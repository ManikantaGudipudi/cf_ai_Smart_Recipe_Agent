export class RecipeService {
  constructor(env) {
    this.env = env;
    this.recipeCache = env.RECIPE_CACHE;
    this.nutritionDB = env.NUTRITION_DB;
  }

  async generateRecipe({ ingredients, dietary_restrictions, preferences, season }) {
    try {
      // Create prompt for AI recipe generation
      const prompt = this.createRecipePrompt({
        ingredients,
        dietary_restrictions,
        preferences,
        season
      });

      // Call Llama 3.3 via Workers AI
      const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct', {
        messages: [
          {
            role: 'system',
            content: `You are a professional chef and nutritionist. Generate detailed, practical recipes based on user requirements. Always include precise measurements, cooking times, difficulty levels, and nutritional information.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      const recipeText = response.response;
      const structuredRecipe = this.parseRecipeResponse(recipeText, {
        ingredients,
        dietary_restrictions,
        preferences,
        season
      });

      // Cache the recipe
      await this.cacheRecipe(structuredRecipe);

      return structuredRecipe;
    } catch (error) {
      console.error('Recipe generation error:', error);
      throw new Error('Failed to generate recipe: ' + error.message);
    }
  }

  async searchRecipes(query, filters = {}) {
    try {
      const id = this.recipeCache.idFromName('global');
      const recipeCacheObj = this.recipeCache.get(id);
      
      const searchRequest = new Request(`http://internal/search?q=${encodeURIComponent(query)}&filters=${encodeURIComponent(JSON.stringify(filters))}`);
      const response = await recipeCacheObj.fetch(searchRequest);
      
      return await response.json();
    } catch (error) {
      console.error('Recipe search error:', error);
      return { recipes: [], total: 0, query, filters };
    }
  }

  async optimizeLeftovers(ingredients, userPreferences) {
    try {
      const prompt = this.createLeftoverOptimizationPrompt(ingredients, userPreferences);

      const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct', {
        messages: [
          {
            role: 'system',
            content: `You are a creative chef who specializes in transforming leftovers into delicious new meals. Provide practical, innovative recipes that use leftover ingredients efficiently.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.8
      });

      const optimizationText = response.response;
      const optimizedRecipes = this.parseOptimizationResponse(optimizationText, ingredients);

      return optimizedRecipes;
    } catch (error) {
      console.error('Leftover optimization error:', error);
      throw new Error('Failed to optimize leftovers: ' + error.message);
    }
  }

  async getSeasonalRecipes(season, limit = 10) {
    try {
      const id = this.recipeCache.idFromName('global');
      const recipeCacheObj = this.recipeCache.get(id);
      
      const request = new Request(`http://internal/seasonal?season=${season}&limit=${limit}`);
      const response = await recipeCacheObj.fetch(request);
      
      return await response.json();
    } catch (error) {
      console.error('Seasonal recipes error:', error);
      return [];
    }
  }

  createRecipePrompt({ ingredients, dietary_restrictions, preferences, season }) {
    let prompt = `Create a detailed recipe using these available ingredients: ${ingredients.join(', ')}.\n\n`;

    if (dietary_restrictions && dietary_restrictions.length > 0) {
      prompt += `Dietary restrictions to follow: ${dietary_restrictions.join(', ')}.\n`;
    }

    if (preferences) {
      if (preferences.spice_level) {
        prompt += `Spice level preference: ${preferences.spice_level}.\n`;
      }
      if (preferences.cooking_time_preference) {
        prompt += `Cooking time preference: ${preferences.cooking_time_preference}.\n`;
      }
      if (preferences.favorite_cuisines && preferences.favorite_cuisines.length > 0) {
        prompt += `Preferred cuisines: ${preferences.favorite_cuisines.join(', ')}.\n`;
      }
    }

    if (season) {
      prompt += `Consider seasonal ingredients and flavors for: ${season}.\n`;
    }

    prompt += `\nPlease provide the recipe in this exact JSON format:
{
  "name": "Recipe Name",
  "description": "Brief description",
  "cuisine": "Cuisine type",
  "difficulty": "easy|medium|hard",
  "cooking_time": 30,
  "servings": 4,
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": 2,
      "unit": "cups",
      "category": "produce"
    }
  ],
  "instructions": [
    "Step 1: Detailed instruction",
    "Step 2: Detailed instruction"
  ],
  "nutrition": {
    "calories": 350,
    "protein": 25,
    "carbs": 40,
    "fat": 12,
    "fiber": 6
  },
  "dietary_info": ["vegetarian", "gluten-free"],
  "seasonal": ["spring", "summer"],
  "tips": ["Helpful cooking tip 1", "Helpful cooking tip 2"],
  "tags": ["quick", "healthy", "comfort-food"]
}`;

    return prompt;
  }

  parseRecipeResponse(recipeText, context) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = recipeText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const recipe = JSON.parse(jsonMatch[0]);
        
        // Add metadata
        recipe.id = `recipe_${Date.now()}`;
        recipe.created_at = new Date().toISOString();
        recipe.generated_from = context.ingredients;
        recipe.season = context.season;

        return recipe;
      } else {
        // Fallback: create a structured recipe from text
        return this.createFallbackRecipe(recipeText, context);
      }
    } catch (error) {
      console.error('Recipe parsing error:', error);
      return this.createFallbackRecipe(recipeText, context);
    }
  }

  createFallbackRecipe(recipeText, context) {
    return {
      id: `recipe_${Date.now()}`,
      name: "AI Generated Recipe",
      description: "Recipe generated from available ingredients",
      cuisine: "International",
      difficulty: "medium",
      cooking_time: 30,
      servings: 4,
      ingredients: context.ingredients.map(ingredient => ({
        name: ingredient,
        quantity: 1,
        unit: "as needed",
        category: "other"
      })),
      instructions: recipeText.split('\n').filter(line => line.trim().length > 0),
      nutrition: {
        calories: 300,
        protein: 20,
        carbs: 35,
        fat: 10,
        fiber: 5
      },
      dietary_info: context.dietary_restrictions || [],
      seasonal: [context.season] || [],
      tips: ["Adjust seasoning to taste"],
      tags: ["ai-generated"],
      created_at: new Date().toISOString(),
      generated_from: context.ingredients,
      raw_response: recipeText
    };
  }

  createLeftoverOptimizationPrompt(ingredients, userPreferences) {
    let prompt = `I have these leftover ingredients: ${ingredients.join(', ')}.\n\n`;
    
    prompt += `Create 2-3 creative recipes that can transform these leftovers into delicious new meals. `;
    
    if (userPreferences) {
      if (userPreferences.dietary_restrictions) {
        prompt += `Follow these dietary restrictions: ${userPreferences.dietary_restrictions.join(', ')}. `;
      }
      if (userPreferences.preferred_cooking_time) {
        prompt += `Keep cooking time to ${userPreferences.preferred_cooking_time} or less. `;
      }
    }

    prompt += `\nProvide practical, easy-to-follow recipes that make the most of these ingredients.`;

    return prompt;
  }

  parseOptimizationResponse(responseText, ingredients) {
    try {
      // Split response into individual recipes
      const recipes = responseText.split(/(?=Recipe \d+:|## Recipe)/i);
      
      return recipes
        .filter(recipe => recipe.trim().length > 0)
        .map((recipeText, index) => ({
          id: `leftover_recipe_${Date.now()}_${index}`,
          name: `Leftover Transformation ${index + 1}`,
          description: "Creative recipe using leftover ingredients",
          difficulty: "easy",
          cooking_time: 20,
          servings: 2,
          ingredients: ingredients.map(ingredient => ({
            name: ingredient,
            quantity: 1,
            unit: "as needed",
            category: "leftover"
          })),
          instructions: recipeText.split('\n').filter(line => line.trim().length > 0),
          nutrition: {
            calories: 250,
            protein: 15,
            carbs: 30,
            fat: 8,
            fiber: 4
          },
          dietary_info: ["leftover-optimization"],
          seasonal: [],
          tips: ["Perfect for using up leftovers!"],
          tags: ["leftover", "quick", "creative"],
          created_at: new Date().toISOString(),
          source_ingredients: ingredients,
          raw_response: recipeText
        }));
    } catch (error) {
      console.error('Optimization parsing error:', error);
      return [this.createFallbackRecipe(responseText, { ingredients })];
    }
  }

  async cacheRecipe(recipe) {
    try {
      const id = this.recipeCache.idFromName('global');
      const recipeCacheObj = this.recipeCache.get(id);
      
      const cacheRequest = new Request('http://internal/set', {
        method: 'POST',
        body: JSON.stringify(recipe)
      });
      
      await recipeCacheObj.fetch(cacheRequest);
    } catch (error) {
      console.error('Recipe caching error:', error);
    }
  }

  async getRecipeNutrition(ingredients, quantities) {
    try {
      const nutritionData = [];
      
      for (let i = 0; i < ingredients.length; i++) {
        const ingredient = ingredients[i];
        const quantity = quantities[i] || 1;
        
        // Try to get nutrition data from cache or external API
        const nutrition = await this.getIngredientNutrition(ingredient, quantity);
        nutritionData.push(nutrition);
      }

      return nutritionData;
    } catch (error) {
      console.error('Nutrition calculation error:', error);
      return [];
    }
  }

  async getIngredientNutrition(ingredient, quantity) {
    // This would integrate with a nutrition database
    // For now, returning estimated values
    return {
      name: ingredient,
      quantity: quantity,
      nutrition: {
        calories: Math.round(Math.random() * 100 + 50),
        protein: Math.round(Math.random() * 20 + 5),
        carbs: Math.round(Math.random() * 30 + 10),
        fat: Math.round(Math.random() * 15 + 2),
        fiber: Math.round(Math.random() * 8 + 1)
      }
    };
  }

  async validateRecipe(recipe) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check required fields
    if (!recipe.name || recipe.name.trim().length === 0) {
      validation.errors.push('Recipe name is required');
      validation.isValid = false;
    }

    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      validation.errors.push('At least one ingredient is required');
      validation.isValid = false;
    }

    if (!recipe.instructions || recipe.instructions.length === 0) {
      validation.errors.push('At least one instruction is required');
      validation.isValid = false;
    }

    // Check for warnings
    if (!recipe.nutrition) {
      validation.warnings.push('Nutrition information is missing');
    }

    if (!recipe.cooking_time || recipe.cooking_time <= 0) {
      validation.warnings.push('Cooking time should be specified');
    }

    if (!recipe.servings || recipe.servings <= 0) {
      validation.warnings.push('Number of servings should be specified');
    }

    return validation;
  }
}
