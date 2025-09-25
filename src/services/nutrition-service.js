export class NutritionService {
  constructor(env) {
    this.env = env;
    this.nutritionDB = env.NUTRITION_DB;
  }

  async analyzeNutrition(ingredients, quantities) {
    try {
      // Get nutrition data for each ingredient
      const nutritionData = await this.getNutritionData(ingredients, quantities);
      
      // Calculate totals
      const totalNutrition = this.calculateTotalNutrition(nutritionData);
      
      // Analyze nutritional quality
      const analysis = await this.analyzeNutritionalQuality(totalNutrition);
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(totalNutrition, analysis);
      
      // Check dietary compliance
      const compliance = await this.checkDietaryCompliance(ingredients);

      return {
        ingredients: nutritionData,
        totals: totalNutrition,
        analysis,
        recommendations,
        compliance,
        analyzed_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Nutrition analysis error:', error);
      throw new Error('Failed to analyze nutrition: ' + error.message);
    }
  }

  async getNutritionData(ingredients, quantities) {
    const nutritionData = [];

    for (let i = 0; i < ingredients.length; i++) {
      const ingredient = ingredients[i];
      const quantity = quantities[i] || 1;
      const unit = this.extractUnit(ingredient) || 'cup';

      try {
        // Try to get from cache first
        const cachedData = await this.nutritionDB.get(`nutrition:${ingredient.toLowerCase()}`);
        
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          const scaledNutrition = this.scaleNutrition(parsedData, quantity, unit);
          nutritionData.push({
            name: ingredient,
            quantity,
            unit,
            nutrition: scaledNutrition,
            source: 'cache'
          });
        } else {
          // Generate estimated nutrition data using AI
          const estimatedNutrition = await this.estimateNutritionWithAI(ingredient, quantity, unit);
          nutritionData.push({
            name: ingredient,
            quantity,
            unit,
            nutrition: estimatedNutrition,
            source: 'ai_estimate'
          });

          // Cache the estimated data
          await this.nutritionDB.put(`nutrition:${ingredient.toLowerCase()}`, JSON.stringify(estimatedNutrition));
        }
      } catch (error) {
        console.error(`Error getting nutrition for ${ingredient}:`, error);
        // Fallback to basic estimation
        const fallbackNutrition = this.createFallbackNutrition(ingredient, quantity);
        nutritionData.push({
          name: ingredient,
          quantity,
          unit,
          nutrition: fallbackNutrition,
          source: 'fallback'
        });
      }
    }

    return nutritionData;
  }

  async estimateNutritionWithAI(ingredient, quantity, unit) {
    try {
      const prompt = `Estimate the nutritional content for ${quantity} ${unit}(s) of ${ingredient}. Provide the values in this exact JSON format:
{
  "calories": 100,
  "protein": 5.0,
  "carbs": 20.0,
  "fat": 2.0,
  "fiber": 3.0,
  "sugar": 5.0,
  "sodium": 200,
  "cholesterol": 0,
  "saturated_fat": 0.5,
  "monounsaturated_fat": 0.5,
  "polyunsaturated_fat": 0.5,
  "vitamin_a": 100,
  "vitamin_c": 50,
  "calcium": 50,
  "iron": 2.0,
  "potassium": 200
}

Provide realistic estimates based on typical nutritional values for this ingredient.`;

      const response = await this.env.AI.run('@cf/meta/llama-3.3-8b-instruct', {
        messages: [
          {
            role: 'system',
            content: 'You are a nutritionist with expertise in food composition. Provide accurate nutritional estimates for ingredients.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      const nutritionText = response.response;
      const jsonMatch = nutritionText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        return this.createFallbackNutrition(ingredient, quantity);
      }
    } catch (error) {
      console.error('AI nutrition estimation error:', error);
      return this.createFallbackNutrition(ingredient, quantity);
    }
  }

  createFallbackNutrition(ingredient, quantity) {
    // Basic fallback nutrition estimation
    const baseNutrition = {
      calories: 50,
      protein: 2.0,
      carbs: 10.0,
      fat: 1.0,
      fiber: 2.0,
      sugar: 3.0,
      sodium: 50,
      cholesterol: 0,
      saturated_fat: 0.2,
      monounsaturated_fat: 0.3,
      polyunsaturated_fat: 0.3,
      vitamin_a: 50,
      vitamin_c: 25,
      calcium: 25,
      iron: 1.0,
      potassium: 100
    };

    // Scale by quantity
    return Object.keys(baseNutrition).reduce((acc, key) => {
      acc[key] = Math.round(baseNutrition[key] * quantity * 10) / 10;
      return acc;
    }, {});
  }

  calculateTotalNutrition(nutritionData) {
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      cholesterol: 0,
      saturated_fat: 0,
      monounsaturated_fat: 0,
      polyunsaturated_fat: 0,
      vitamin_a: 0,
      vitamin_c: 0,
      calcium: 0,
      iron: 0,
      potassium: 0
    };

    nutritionData.forEach(item => {
      Object.keys(totals).forEach(nutrient => {
        totals[nutrient] += item.nutrition[nutrient] || 0;
      });
    });

    // Round to appropriate decimal places
    Object.keys(totals).forEach(key => {
      if (['calories', 'sodium', 'vitamin_a', 'vitamin_c', 'calcium', 'iron', 'potassium'].includes(key)) {
        totals[key] = Math.round(totals[key]);
      } else {
        totals[key] = Math.round(totals[key] * 10) / 10;
      }
    });

    return totals;
  }

  async analyzeNutritionalQuality(totalNutrition) {
    const analysis = {
      overall_score: 0,
      macronutrient_balance: 'good',
      micronutrient_density: 'moderate',
      health_indicators: {},
      concerns: [],
      strengths: []
    };

    // Analyze macronutrient balance
    const totalCalories = totalNutrition.calories;
    const proteinCalories = totalNutrition.protein * 4;
    const carbCalories = totalNutrition.carbs * 4;
    const fatCalories = totalNutrition.fat * 9;

    const proteinPercentage = (proteinCalories / totalCalories) * 100;
    const carbPercentage = (carbCalories / totalCalories) * 100;
    const fatPercentage = (fatCalories / totalCalories) * 100;

    // Ideal ranges: Protein 15-25%, Carbs 45-65%, Fat 20-35%
    if (proteinPercentage >= 15 && proteinPercentage <= 25) {
      analysis.strengths.push('Good protein balance');
    } else if (proteinPercentage < 15) {
      analysis.concerns.push('Low protein content');
    } else {
      analysis.concerns.push('High protein content');
    }

    if (carbPercentage >= 45 && carbPercentage <= 65) {
      analysis.strengths.push('Balanced carbohydrate intake');
    } else if (carbPercentage < 45) {
      analysis.concerns.push('Low carbohydrate content');
    } else {
      analysis.concerns.push('High carbohydrate content');
    }

    if (fatPercentage >= 20 && fatPercentage <= 35) {
      analysis.strengths.push('Appropriate fat content');
    } else if (fatPercentage < 20) {
      analysis.concerns.push('Low fat content');
    } else {
      analysis.concerns.push('High fat content');
    }

    // Analyze fiber content
    if (totalNutrition.fiber >= 25) {
      analysis.strengths.push('Excellent fiber content');
    } else if (totalNutrition.fiber >= 15) {
      analysis.strengths.push('Good fiber content');
    } else {
      analysis.concerns.push('Low fiber content');
    }

    // Analyze sodium content
    if (totalNutrition.sodium > 2300) {
      analysis.concerns.push('High sodium content');
    } else if (totalNutrition.sodium < 500) {
      analysis.concerns.push('Low sodium content');
    } else {
      analysis.strengths.push('Appropriate sodium level');
    }

    // Calculate overall score
    let score = 100;
    score -= analysis.concerns.length * 10;
    score += analysis.strengths.length * 5;
    analysis.overall_score = Math.max(0, Math.min(100, score));

    // Determine quality levels
    if (analysis.overall_score >= 80) {
      analysis.macronutrient_balance = 'excellent';
      analysis.micronutrient_density = 'high';
    } else if (analysis.overall_score >= 60) {
      analysis.macronutrient_balance = 'good';
      analysis.micronutrient_density = 'moderate';
    } else {
      analysis.macronutrient_balance = 'needs_improvement';
      analysis.micronutrient_density = 'low';
    }

    return analysis;
  }

  async generateRecommendations(totalNutrition, analysis) {
    const recommendations = [];

    // Macronutrient recommendations
    if (totalNutrition.protein < 50) {
      recommendations.push({
        type: 'protein',
        message: 'Consider adding protein-rich ingredients like lean meats, beans, or nuts',
        priority: 'high'
      });
    }

    if (totalNutrition.fiber < 15) {
      recommendations.push({
        type: 'fiber',
        message: 'Add more fiber-rich foods like vegetables, fruits, and whole grains',
        priority: 'medium'
      });
    }

    if (totalNutrition.fat < 20) {
      recommendations.push({
        type: 'fat',
        message: 'Include healthy fats from sources like olive oil, avocado, or nuts',
        priority: 'medium'
      });
    }

    if (totalNutrition.sodium > 2000) {
      recommendations.push({
        type: 'sodium',
        message: 'Reduce sodium by using herbs and spices instead of salt',
        priority: 'high'
      });
    }

    // Vitamin and mineral recommendations
    if (totalNutrition.vitamin_c < 60) {
      recommendations.push({
        type: 'vitamin_c',
        message: 'Add vitamin C-rich foods like citrus fruits or bell peppers',
        priority: 'low'
      });
    }

    if (totalNutrition.iron < 8) {
      recommendations.push({
        type: 'iron',
        message: 'Include iron-rich ingredients like spinach, lentils, or lean red meat',
        priority: 'medium'
      });
    }

    if (totalNutrition.calcium < 300) {
      recommendations.push({
        type: 'calcium',
        message: 'Add calcium-rich foods like dairy products, leafy greens, or fortified foods',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  async checkDietaryCompliance(ingredients) {
    const compliance = {
      vegetarian: true,
      vegan: true,
      gluten_free: true,
      dairy_free: true,
      nut_free: true,
      kosher: true,
      halal: true
    };

    const nonVegetarian = ['chicken', 'beef', 'pork', 'fish', 'meat', 'seafood'];
    const nonVegan = ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'egg', 'honey'];
    const glutenSources = ['wheat', 'barley', 'rye', 'flour', 'bread', 'pasta'];
    const dairySources = ['milk', 'cheese', 'butter', 'cream', 'yogurt'];
    const nutSources = ['almond', 'walnut', 'peanut', 'cashew', 'pistachio', 'nut'];

    ingredients.forEach(ingredient => {
      const lowerIngredient = ingredient.toLowerCase();

      // Check vegetarian/vegan
      if (nonVegetarian.some(item => lowerIngredient.includes(item))) {
        compliance.vegetarian = false;
        compliance.vegan = false;
      }

      if (nonVegan.some(item => lowerIngredient.includes(item))) {
        compliance.vegan = false;
      }

      // Check gluten-free
      if (glutenSources.some(item => lowerIngredient.includes(item))) {
        compliance.gluten_free = false;
      }

      // Check dairy-free
      if (dairySources.some(item => lowerIngredient.includes(item))) {
        compliance.dairy_free = false;
      }

      // Check nut-free
      if (nutSources.some(item => lowerIngredient.includes(item))) {
        compliance.nut_free = false;
      }
    });

    return compliance;
  }

  extractUnit(ingredient) {
    const units = ['cup', 'cups', 'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons', 
                  'pound', 'pounds', 'ounce', 'ounces', 'gram', 'grams', 'kg', 'liter', 'ml'];
    
    const lowerIngredient = ingredient.toLowerCase();
    for (const unit of units) {
      if (lowerIngredient.includes(unit)) {
        return unit;
      }
    }
    return null;
  }

  scaleNutrition(nutrition, quantity, unit) {
    // Basic scaling - in a real implementation, this would be more sophisticated
    const scaledNutrition = {};
    Object.keys(nutrition).forEach(key => {
      scaledNutrition[key] = Math.round((nutrition[key] * quantity) * 10) / 10;
    });
    return scaledNutrition;
  }

  async getDailyNutritionGoals(userId) {
    try {
      // This would typically fetch from user profile
      // For now, returning standard adult recommendations
      return {
        calories: 2000,
        protein: 150,
        carbs: 250,
        fat: 65,
        fiber: 25,
        sugar: 50,
        sodium: 2300,
        cholesterol: 300,
        saturated_fat: 20,
        vitamin_a: 900,
        vitamin_c: 90,
        calcium: 1000,
        iron: 18,
        potassium: 3500
      };
    } catch (error) {
      console.error('Error getting nutrition goals:', error);
      return null;
    }
  }

  async compareToGoals(nutrition, goals) {
    if (!goals) return null;

    const comparison = {};
    Object.keys(goals).forEach(nutrient => {
      const actual = nutrition[nutrient] || 0;
      const target = goals[nutrient];
      const percentage = Math.round((actual / target) * 100);
      
      comparison[nutrient] = {
        actual,
        target,
        percentage,
        status: percentage >= 80 && percentage <= 120 ? 'good' : 
                percentage < 80 ? 'low' : 'high'
      };
    });

    return comparison;
  }
}
