// Mock API server for local development and testing
// This simulates the Cloudflare Workers API responses

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data storage
let mockPantryData = {
    ingredients: [
        { name: 'chicken breast', quantity: 2, unit: 'pounds', category: 'meat' },
        { name: 'rice', quantity: 1, unit: 'bag', category: 'pantry' },
        { name: 'mixed vegetables', quantity: 1, unit: 'bag', category: 'produce' },
        { name: 'olive oil', quantity: 1, unit: 'bottle', category: 'pantry' },
        { name: 'garlic', quantity: 1, unit: 'bulb', category: 'produce' }
    ],
    last_updated: new Date().toISOString()
};

const mockRecipes = [
  {
    id: 'recipe-1',
    name: 'Chicken and Rice Bowl',
    description: 'A healthy and delicious one-bowl meal with tender chicken and fluffy rice',
    cuisine: 'International',
    difficulty: 'easy',
    cooking_time: 25,
    servings: 4,
    ingredients: [
      { name: 'chicken breast', quantity: 1, unit: 'pound', category: 'meat' },
      { name: 'rice', quantity: 1, unit: 'cup', category: 'pantry' },
      { name: 'mixed vegetables', quantity: 2, unit: 'cups', category: 'produce' },
      { name: 'olive oil', quantity: 2, unit: 'tablespoons', category: 'pantry' },
      { name: 'garlic', quantity: 2, unit: 'cloves', category: 'produce' }
    ],
    instructions: [
      'Cook rice according to package instructions',
      'Season chicken breast with salt and pepper',
      'Heat olive oil in a pan and cook chicken for 6-7 minutes per side',
      'Add vegetables and garlic, cook for 3-4 minutes',
      'Serve chicken and vegetables over rice'
    ],
    nutrition: {
      calories: 350,
      protein: 28,
      carbs: 35,
      fat: 8,
      fiber: 4
    },
    dietary_info: ['gluten-free', 'dairy-free'],
    seasonal: ['spring', 'summer', 'fall', 'winter'],
    tips: ['Use brown rice for extra fiber', 'Add your favorite herbs for more flavor'],
    tags: ['healthy', 'quick', 'one-bowl'],
    created_at: new Date().toISOString()
  },
  {
    id: 'recipe-2',
    name: 'Vegetarian Stir Fry',
    description: 'Quick and colorful vegetable stir fry with tofu',
    cuisine: 'Asian',
    difficulty: 'easy',
    cooking_time: 15,
    servings: 3,
    ingredients: [
      { name: 'tofu', quantity: 8, unit: 'ounces', category: 'produce' },
      { name: 'bell peppers', quantity: 2, unit: 'pieces', category: 'produce' },
      { name: 'broccoli', quantity: 1, unit: 'cup', category: 'produce' },
      { name: 'soy sauce', quantity: 3, unit: 'tablespoons', category: 'pantry' },
      { name: 'sesame oil', quantity: 1, unit: 'tablespoon', category: 'pantry' }
    ],
    instructions: [
      'Cut tofu into cubes and bell peppers into strips',
      'Heat sesame oil in a large pan or wok',
      'Add tofu and cook until golden, about 5 minutes',
      'Add vegetables and stir fry for 3-4 minutes',
      'Add soy sauce and cook for 1 more minute'
    ],
    nutrition: {
      calories: 180,
      protein: 15,
      carbs: 12,
      fat: 8,
      fiber: 5
    },
    dietary_info: ['vegetarian', 'vegan', 'gluten-free'],
    seasonal: ['spring', 'summer', 'fall'],
    tips: ['Press tofu before cooking for better texture', 'Add ginger for extra flavor'],
    tags: ['vegetarian', 'quick', 'healthy'],
    created_at: new Date().toISOString()
  }
];

const mockMealPlan = {
  id: 'meal-plan-1',
  days: [
    {
      day: 1,
      date: new Date().toISOString(),
      meals: {
        breakfast: {
          name: 'Oatmeal with Berries',
          recipe_id: 'breakfast-1',
          ingredients: [
            { name: 'oats', quantity: 1, unit: 'cup' },
            { name: 'berries', quantity: 0.5, unit: 'cup' },
            { name: 'almond milk', quantity: 1, unit: 'cup' }
          ],
          nutrition: { calories: 250, protein: 8, carbs: 45, fat: 6 },
          cooking_time: 5,
          difficulty: 'easy'
        },
        lunch: {
          name: 'Quinoa Salad',
          recipe_id: 'lunch-1',
          ingredients: [
            { name: 'quinoa', quantity: 1, unit: 'cup' },
            { name: 'mixed vegetables', quantity: 1, unit: 'cup' },
            { name: 'olive oil', quantity: 2, unit: 'tablespoons' }
          ],
          nutrition: { calories: 320, protein: 12, carbs: 45, fat: 10 },
          cooking_time: 20,
          difficulty: 'easy'
        },
        dinner: {
          name: 'Chicken and Rice Bowl',
          recipe_id: 'recipe-1',
          ingredients: mockRecipes[0].ingredients,
          nutrition: mockRecipes[0].nutrition,
          cooking_time: 25,
          difficulty: 'easy'
        }
      }
    }
  ],
  total_nutrition: {
    calories: 890,
    protein: 48,
    carbs: 135,
    fat: 22,
    fiber: 17
  },
  dietary_compliance: true,
  estimated_cost: 25.50,
  created_at: new Date().toISOString()
};

// API Routes

// Recipe generation - AI-powered simulation
app.post('/api/recipes/generate', (req, res) => {
    const { ingredients, dietary_restrictions, preferences } = req.body;
    
    // Simulate AI processing delay
    setTimeout(() => {
        // Generate recipe based on ingredients - more dynamic approach
        const recipe = generateDynamicRecipe(ingredients, dietary_restrictions, preferences);
        res.json(recipe);
    }, 1000);
});

// AI-powered recipe generation function
function generateDynamicRecipe(ingredients, dietary_restrictions, preferences) {
    // Analyze ingredients to determine recipe type
    const hasAvocado = ingredients.some(ing => ['avocado', 'guac', 'guacamole'].includes(ing.toLowerCase()));
    const hasBread = ingredients.some(ing => ['bread', 'sandwich', 'toast'].includes(ing.toLowerCase()));
    const hasProtein = ingredients.some(ing => ['chicken', 'beef', 'fish', 'tofu', 'egg'].includes(ing.toLowerCase()));
    const hasVegetables = ingredients.some(ing => ['onion', 'garlic', 'tomato', 'lettuce', 'spinach'].includes(ing.toLowerCase()));
    
    let recipeName, description, cuisine, cookingTime, difficulty;
    
    // Determine recipe type based on ingredient analysis
    if (hasAvocado && hasBread) {
        recipeName = 'Fresh Guacamole Sandwich';
        description = 'A delicious and healthy guacamole sandwich with fresh ingredients';
        cuisine = 'Mexican-inspired';
        cookingTime = 10;
        difficulty = 'easy';
    } else if (hasProtein && hasVegetables) {
        recipeName = 'Protein-Packed Bowl';
        description = 'A nutritious bowl with your available protein and vegetables';
        cuisine = 'Healthy';
        cookingTime = 20;
        difficulty = 'easy';
    } else if (hasBread) {
        recipeName = 'Gourmet Sandwich';
        description = 'A delicious sandwich using your available ingredients';
        cuisine = 'International';
        cookingTime = 15;
        difficulty = 'easy';
    } else {
        recipeName = 'Creative Dish';
        description = 'A creative dish made with your available ingredients';
        cuisine = 'International';
        cookingTime = 25;
        difficulty = 'medium';
    }
    
    // Generate dynamic ingredients based on what's available
    const recipeIngredients = generateRecipeIngredients(ingredients);
    
    // Generate dynamic instructions
    const instructions = generateRecipeInstructions(recipeName, recipeIngredients);
    
    // Calculate nutrition based on ingredients
    const nutrition = calculateNutrition(recipeIngredients);
    
    // Determine dietary info based on ingredients
    const dietary_info = determineDietaryInfo(recipeIngredients, dietary_restrictions);
    
    // Generate helpful tips
    const tips = generateCookingTips(recipeName, recipeIngredients);
    
    return {
        id: `recipe-${Date.now()}`,
        name: recipeName,
        description,
        cuisine,
        difficulty,
        cooking_time: cookingTime,
        servings: 2,
        ingredients: recipeIngredients,
        instructions,
        nutrition,
        dietary_info,
        seasonal: ['spring', 'summer', 'fall', 'winter'],
        tips,
        tags: ['healthy', 'quick', 'custom'],
        generated_from: ingredients,
        dietary_restrictions: dietary_restrictions || [],
        created_at: new Date().toISOString()
    };
}

function generateRecipeIngredients(availableIngredients) {
    const ingredients = [];
    const addedIngredients = new Set(); // Prevent duplicates
    
    // Map available ingredients to recipe ingredients with quantities
    availableIngredients.forEach(ingredient => {
        const lowerIngredient = ingredient.toLowerCase();
        
        if (lowerIngredient.includes('avocado') && !addedIngredients.has('avocado')) {
            ingredients.push({ name: 'avocado', quantity: 2, unit: 'pieces', category: 'produce' });
            addedIngredients.add('avocado');
        }
        if (lowerIngredient.includes('bread') && !addedIngredients.has('bread')) {
            ingredients.push({ name: 'bread', quantity: 4, unit: 'slices', category: 'bakery' });
            addedIngredients.add('bread');
        }
        if (lowerIngredient.includes('lime') && !addedIngredients.has('lime')) {
            ingredients.push({ name: 'lime', quantity: 1, unit: 'piece', category: 'produce' });
            addedIngredients.add('lime');
        }
        if (lowerIngredient.includes('salt') && !addedIngredients.has('salt')) {
            ingredients.push({ name: 'salt', quantity: 0.5, unit: 'teaspoon', category: 'pantry' });
            addedIngredients.add('salt');
        }
        if (lowerIngredient.includes('chicken') && !addedIngredients.has('chicken')) {
            ingredients.push({ name: 'chicken breast', quantity: 1, unit: 'pound', category: 'meat' });
            addedIngredients.add('chicken');
        }
        if (lowerIngredient.includes('rice') && !addedIngredients.has('rice')) {
            ingredients.push({ name: 'rice', quantity: 1, unit: 'cup', category: 'pantry' });
            addedIngredients.add('rice');
        }
        if (lowerIngredient.includes('vegetable') && !addedIngredients.has('vegetables')) {
            ingredients.push({ name: 'mixed vegetables', quantity: 1, unit: 'cup', category: 'produce' });
            addedIngredients.add('vegetables');
        }
        if (lowerIngredient.includes('garlic') && !addedIngredients.has('garlic')) {
            ingredients.push({ name: 'garlic', quantity: 2, unit: 'cloves', category: 'produce' });
            addedIngredients.add('garlic');
        }
        if (lowerIngredient.includes('olive oil') && !addedIngredients.has('olive oil')) {
            ingredients.push({ name: 'olive oil', quantity: 2, unit: 'tablespoons', category: 'pantry' });
            addedIngredients.add('olive oil');
        }
    });
    
    // Add essential ingredients for guacamole sandwich if we have avocado and bread
    if (addedIngredients.has('avocado') && addedIngredients.has('bread')) {
        if (!addedIngredients.has('black pepper')) {
            ingredients.push({ name: 'black pepper', quantity: 0.25, unit: 'teaspoon', category: 'pantry' });
        }
        if (!addedIngredients.has('red onion')) {
            ingredients.push({ name: 'red onion', quantity: 0.25, unit: 'cup', category: 'produce' });
        }
        if (!addedIngredients.has('cilantro')) {
            ingredients.push({ name: 'cilantro', quantity: 2, unit: 'tablespoons', category: 'produce' });
        }
    }
    
    // If no ingredients were found, add some defaults based on pantry
    if (ingredients.length === 0) {
        ingredients.push(
            { name: 'avocado', quantity: 2, unit: 'pieces', category: 'produce' },
            { name: 'bread', quantity: 4, unit: 'slices', category: 'bakery' },
            { name: 'lime', quantity: 1, unit: 'piece', category: 'produce' },
            { name: 'salt', quantity: 0.5, unit: 'teaspoon', category: 'pantry' }
        );
    }
    
    return ingredients;
}

function generateRecipeInstructions(recipeName, ingredients) {
    if (recipeName.includes('Guacamole')) {
        return [
            'Cut the avocados in half and remove the pits',
            'Scoop the avocado flesh into a bowl',
            'Add lime juice, salt, and black pepper to taste',
            'Mash the avocado mixture with a fork until smooth but slightly chunky',
            'Finely dice the red onion and chop the cilantro',
            'Mix the onion and cilantro into the guacamole',
            'Toast the bread slices lightly',
            'Spread the guacamole evenly on 2 slices of bread',
            'Top with the remaining bread slices',
            'Cut sandwiches in half and serve immediately'
        ];
    } else if (recipeName.includes('Protein-Packed')) {
        return [
            'Season the protein with salt and pepper',
            'Heat oil in a pan over medium-high heat',
            'Cook the protein for 6-8 minutes until golden',
            'Add vegetables and cook for 3-4 minutes',
            'Season with herbs and spices',
            'Serve over rice or in a bowl',
            'Garnish with fresh herbs'
        ];
    } else {
        return [
            'Prepare all ingredients as needed',
            'Heat oil in a large pan',
            'Cook main ingredients for 5-7 minutes',
            'Add seasonings and herbs',
            'Combine all ingredients',
            'Cook for additional 2-3 minutes',
            'Serve hot and enjoy'
        ];
    }
}

function calculateNutrition(ingredients) {
    // Calculate nutrition based on ingredients
    let calories = 0, protein = 0, carbs = 0, fat = 0, fiber = 0;
    
    ingredients.forEach(ingredient => {
        const name = ingredient.name.toLowerCase();
        const quantity = ingredient.quantity;
        
        if (name.includes('avocado')) {
            calories += 160 * quantity;
            protein += 2 * quantity;
            carbs += 9 * quantity;
            fat += 15 * quantity;
            fiber += 7 * quantity;
        } else if (name.includes('bread')) {
            calories += 80 * quantity;
            protein += 3 * quantity;
            carbs += 15 * quantity;
            fat += 1 * quantity;
            fiber += 2 * quantity;
        } else if (name.includes('lime')) {
            calories += 20 * quantity;
            protein += 0.5 * quantity;
            carbs += 7 * quantity;
            fat += 0.1 * quantity;
            fiber += 2 * quantity;
        } else if (name.includes('salt')) {
            calories += 0 * quantity;
            protein += 0 * quantity;
            carbs += 0 * quantity;
            fat += 0 * quantity;
            fiber += 0 * quantity;
        } else if (name.includes('black pepper')) {
            calories += 6 * quantity;
            protein += 0.3 * quantity;
            carbs += 1.5 * quantity;
            fat += 0.1 * quantity;
            fiber += 0.5 * quantity;
        } else if (name.includes('red onion')) {
            calories += 40 * quantity;
            protein += 1 * quantity;
            carbs += 9 * quantity;
            fat += 0.1 * quantity;
            fiber += 2 * quantity;
        } else if (name.includes('cilantro')) {
            calories += 5 * quantity;
            protein += 0.5 * quantity;
            carbs += 1 * quantity;
            fat += 0.1 * quantity;
            fiber += 0.5 * quantity;
        } else if (name.includes('chicken')) {
            calories += 165 * quantity;
            protein += 31 * quantity;
            carbs += 0 * quantity;
            fat += 3.6 * quantity;
            fiber += 0 * quantity;
        } else if (name.includes('rice')) {
            calories += 130 * quantity;
            protein += 2.7 * quantity;
            carbs += 28 * quantity;
            fat += 0.3 * quantity;
            fiber += 0.4 * quantity;
        } else {
            // Default nutrition for other ingredients
            calories += 25 * quantity;
            protein += 1 * quantity;
            carbs += 5 * quantity;
            fat += 0.5 * quantity;
            fiber += 2 * quantity;
        }
    });
    
    // Ensure we have reasonable minimum values
    calories = Math.max(calories, 100);
    protein = Math.max(protein, 5);
    carbs = Math.max(carbs, 10);
    fat = Math.max(fat, 5);
    fiber = Math.max(fiber, 3);
    
    return {
        calories: Math.round(calories),
        protein: Math.round(protein * 10) / 10,
        carbs: Math.round(carbs * 10) / 10,
        fat: Math.round(fat * 10) / 10,
        fiber: Math.round(fiber * 10) / 10
    };
}

function determineDietaryInfo(ingredients, dietary_restrictions) {
    const dietary = [];
    
    // Check if vegetarian
    const hasMeat = ingredients.some(ing => 
        ['chicken', 'beef', 'pork', 'fish'].includes(ing.name.toLowerCase())
    );
    if (!hasMeat) {
        dietary.push('vegetarian');
    }
    
    // Check if vegan
    const hasDairy = ingredients.some(ing => 
        ['milk', 'cheese', 'butter', 'cream'].includes(ing.name.toLowerCase())
    );
    if (!hasMeat && !hasDairy) {
        dietary.push('vegan');
    }
    
    // Check if gluten-free
    const hasGluten = ingredients.some(ing => 
        ['bread', 'flour', 'pasta'].includes(ing.name.toLowerCase())
    );
    if (!hasGluten) {
        dietary.push('gluten-free');
    }
    
    return dietary;
}

function generateCookingTips(recipeName, ingredients) {
    const tips = [];
    
    if (recipeName.includes('Guacamole')) {
        tips.push('Add a squeeze of lime juice to prevent browning');
        tips.push('Use ripe avocados for the best texture');
        tips.push('Add diced tomatoes for extra freshness');
    } else if (recipeName.includes('Protein')) {
        tips.push('Let the protein rest for 2-3 minutes before serving');
        tips.push('Use high heat for a good sear');
        tips.push('Season generously with salt and pepper');
    } else {
        tips.push('Taste and adjust seasoning as needed');
        tips.push('Use fresh ingredients for best flavor');
        tips.push('Don\'t overcook the vegetables');
    }
    
    return tips;
}

// Recipe search
app.get('/api/recipes/search', (req, res) => {
  const { q, filters } = req.query;
  
  let filteredRecipes = mockRecipes;
  
  if (q) {
    filteredRecipes = mockRecipes.filter(recipe =>
      recipe.name.toLowerCase().includes(q.toLowerCase()) ||
      recipe.description.toLowerCase().includes(q.toLowerCase())
    );
  }
  
  res.json({
    recipes: filteredRecipes,
    total: filteredRecipes.length,
    query: q,
    filters: filters ? JSON.parse(filters) : {}
  });
});

// Meal plan creation
app.post('/api/meal-plan/create', (req, res) => {
  const { days, preferences, dietary_restrictions } = req.body;
  
  setTimeout(() => {
    res.json(mockMealPlan);
  }, 1500);
});

// Nutrition analysis
app.post('/api/nutrition/analyze', (req, res) => {
  const { ingredients, quantities } = req.body;
  
  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  };
  
  // Mock nutrition calculation
  ingredients.forEach((ingredient, index) => {
    const quantity = quantities[index] || 1;
    totals.calories += Math.round(Math.random() * 100 + 50) * quantity;
    totals.protein += Math.round(Math.random() * 10 + 5) * quantity;
    totals.carbs += Math.round(Math.random() * 15 + 10) * quantity;
    totals.fat += Math.round(Math.random() * 8 + 2) * quantity;
    totals.fiber += Math.round(Math.random() * 5 + 1) * quantity;
  });
  
  const analysis = {
    ingredients: ingredients.map((ingredient, index) => ({
      name: ingredient,
      quantity: quantities[index] || 1,
      unit: 'cup',
      nutrition: {
        calories: Math.round(Math.random() * 100 + 50),
        protein: Math.round(Math.random() * 10 + 5),
        carbs: Math.round(Math.random() * 15 + 10),
        fat: Math.round(Math.random() * 8 + 2)
      }
    })),
    totals,
    analysis: {
      overall_score: 85,
      macronutrient_balance: 'good',
      micronutrient_density: 'moderate',
      health_indicators: {},
      concerns: ['Consider adding more fiber'],
      strengths: ['Good protein balance', 'Appropriate fat content']
    },
    recommendations: [
      {
        type: 'fiber',
        message: 'Add more fiber-rich foods like vegetables and whole grains',
        priority: 'medium'
      }
    ],
    compliance: {
      vegetarian: true,
      vegan: false,
      gluten_free: true,
      dairy_free: true
    },
    analyzed_at: new Date().toISOString()
  };
  
  res.json(analysis);
});

// Voice processing
app.post('/api/voice/process', (req, res) => {
  // Mock voice processing
  const transcription = "I need a recipe for chicken with rice and vegetables for dinner tonight. I'm vegetarian and prefer quick meals under 30 minutes.";
  
  const processedText = "I need a vegetarian recipe for rice and vegetables for dinner tonight. I prefer quick meals under 30 minutes.";
  
  const extractedInfo = {
    ingredients: ['rice', 'vegetables'],
    dietary_restrictions: ['vegetarian'],
    meal_type: 'dinner',
    cooking_time_preference: 'quick',
    cuisine_preference: null,
    difficulty_preference: 'easy',
    serving_size: 4,
    special_requirements: ['quick']
  };
  
  res.json({
    original_transcription: transcription,
    processed_text: processedText,
    extracted_info: extractedInfo,
    confidence: 0.85,
    processed_at: new Date().toISOString()
  });
});

// User preferences
app.get('/api/user/preferences', (req, res) => {
    const { user_id, type } = req.query;
    
    if (type === 'pantry') {
        // Return only pantry data
        res.json(mockPantryData);
    } else {
        // Return full user data
        res.json({
            preferences: {
                dietary_restrictions: ['gluten-free'],
                allergies: [],
                favorite_cuisines: ['Italian', 'Asian'],
                disliked_ingredients: [],
                spice_level: 'medium',
                cooking_time_preference: 'medium'
            },
            pantry: mockPantryData,
            created_at: new Date().toISOString()
        });
    }
});

app.post('/api/user/preferences', (req, res) => {
  const { type, action, ingredients } = req.body;
  
  if (type === 'pantry' && action === 'add' && ingredients) {
    // Add new ingredients to pantry
    ingredients.forEach(newIngredient => {
      const existingIndex = mockPantryData.ingredients.findIndex(
        item => item.name.toLowerCase() === newIngredient.name.toLowerCase()
      );
      
      if (existingIndex !== -1) {
        // Update existing ingredient quantity
        mockPantryData.ingredients[existingIndex].quantity += newIngredient.quantity;
      } else {
        // Add new ingredient
        mockPantryData.ingredients.push(newIngredient);
      }
    });
    
    mockPantryData.last_updated = new Date().toISOString();
    
    res.json({
      success: true,
      pantry: mockPantryData,
      updated_at: new Date().toISOString()
    });
  } else {
    // Handle other preference updates
    res.json({
      success: true,
      preferences: req.body,
      updated_at: new Date().toISOString()
    });
  }
});

// Leftover optimization
app.post('/api/leftovers/optimize', (req, res) => {
  const { ingredients, user_preferences } = req.body;
  
  const optimizedRecipes = [
    {
      id: `leftover-${Date.now()}-1`,
      name: 'Leftover Chicken Fried Rice',
      description: 'Transform your leftover chicken into a delicious fried rice',
      difficulty: 'easy',
      cooking_time: 15,
      servings: 3,
      ingredients: ingredients.map(ingredient => ({
        name: ingredient,
        quantity: 1,
        unit: 'as needed',
        category: 'leftover'
      })),
      instructions: [
        'Heat oil in a large pan or wok',
        'Add leftover chicken and cook for 2-3 minutes',
        'Add cooked rice and stir fry for 3-4 minutes',
        'Season with soy sauce and serve hot'
      ],
      nutrition: {
        calories: 280,
        protein: 20,
        carbs: 35,
        fat: 6,
        fiber: 2
      },
      dietary_info: ['leftover-optimization'],
      seasonal: [],
      tips: ['Perfect for using up leftovers!'],
      tags: ['leftover', 'quick', 'creative'],
      created_at: new Date().toISOString(),
      source_ingredients: ingredients
    }
  ];
  
  res.json(optimizedRecipes);
});

// Grocery list generation
app.post('/api/grocery/list', (req, res) => {
  const { meal_plan_id } = req.body;
  
  const groceryList = {
    id: `grocery-${Date.now()}`,
    items: [
      { name: 'chicken breast', quantity: 2, unit: 'pounds', category: 'meat', estimated_cost: 8.99 },
      { name: 'rice', quantity: 1, unit: 'bag', category: 'pantry', estimated_cost: 3.49 },
      { name: 'mixed vegetables', quantity: 2, unit: 'bags', category: 'produce', estimated_cost: 4.99 },
      { name: 'olive oil', quantity: 1, unit: 'bottle', category: 'pantry', estimated_cost: 6.99 },
      { name: 'garlic', quantity: 1, unit: 'bulb', category: 'produce', estimated_cost: 1.99 }
    ],
    total_estimated_cost: 26.45,
    categories: {
      'meat': [{ name: 'chicken breast', quantity: 2, unit: 'pounds', estimated_cost: 8.99 }],
      'pantry': [
        { name: 'rice', quantity: 1, unit: 'bag', estimated_cost: 3.49 },
        { name: 'olive oil', quantity: 1, unit: 'bottle', estimated_cost: 6.99 }
      ],
      'produce': [
        { name: 'mixed vegetables', quantity: 2, unit: 'bags', estimated_cost: 4.99 },
        { name: 'garlic', quantity: 1, unit: 'bulb', estimated_cost: 1.99 }
      ]
    },
    shopping_optimization: {
      store_sections: {
        'Produce': [
          { name: 'mixed vegetables', quantity: 2, unit: 'bags', estimated_cost: 4.99 },
          { name: 'garlic', quantity: 1, unit: 'bulb', estimated_cost: 1.99 }
        ],
        'Meat & Seafood': [
          { name: 'chicken breast', quantity: 2, unit: 'pounds', estimated_cost: 8.99 }
        ],
        'Pantry': [
          { name: 'rice', quantity: 1, unit: 'bag', estimated_cost: 3.49 },
          { name: 'olive oil', quantity: 1, unit: 'bottle', estimated_cost: 6.99 }
        ]
      },
      estimated_shopping_time: 25
    },
    meal_plan_id,
    created_at: new Date().toISOString()
  };
  
  res.json(groceryList);
});

// Timer management
app.get('/api/timer', (req, res) => {
  const { user_id } = req.query;
  
  res.json({
    active_timers: [
      {
        id: 'timer-1',
        name: 'Chicken Cooking',
        duration: 1800, // 30 minutes in seconds
        remaining: 1200, // 20 minutes remaining
        status: 'active',
        start_time: new Date(Date.now() - 600000).toISOString() // 10 minutes ago
      }
    ],
    timer_history: [],
    last_updated: new Date().toISOString()
  });
});

app.post('/api/timer', (req, res) => {
  const { action, timer } = req.body;
  
  res.json({
    success: true,
    timers: {
      active_timers: [],
      timer_history: [],
      last_updated: new Date().toISOString()
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock API server running at http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   POST /api/recipes/generate - Generate recipes`);
  console.log(`   GET  /api/recipes/search - Search recipes`);
  console.log(`   POST /api/meal-plan/create - Create meal plans`);
  console.log(`   POST /api/nutrition/analyze - Analyze nutrition`);
  console.log(`   POST /api/voice/process - Process voice input`);
  console.log(`   GET  /api/user/preferences - Get user preferences`);
  console.log(`   POST /api/leftovers/optimize - Optimize leftovers`);
  console.log(`   POST /api/grocery/list - Generate grocery lists`);
  console.log(`   GET  /api/timer - Get timers`);
  console.log(`   GET  /health - Health check`);
  console.log(`\n🎯 Test the frontend at http://localhost:3000`);
});

export default app;
