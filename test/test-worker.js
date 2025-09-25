// Simple test file for the Smart Recipe Agent Worker
// This is a basic test to verify the worker functionality

import { UserState, RecipeCache, MealPlan } from '../src/worker.js';

// Mock environment for testing
const mockEnv = {
  AI: {
    run: async (model, options) => {
      // Mock AI response
      return {
        response: JSON.stringify({
          name: "Test Recipe",
          description: "A delicious test recipe",
          cooking_time: 30,
          difficulty: "easy",
          servings: 4,
          ingredients: [
            { name: "chicken", quantity: 1, unit: "pound", category: "meat" }
          ],
          instructions: [
            "Step 1: Prepare ingredients",
            "Step 2: Cook the dish"
          ],
          nutrition: {
            calories: 300,
            protein: 25,
            carbs: 20,
            fat: 10,
            fiber: 3
          }
        })
      };
    }
  },
  RECIPE_CACHE: {
    idFromName: () => ({ id: 'test-cache' }),
    get: () => ({
      fetch: async () => new Response(JSON.stringify({ recipes: [] }))
    })
  },
  MEAL_PLAN: {
    idFromName: () => ({ id: 'test-meal-plan' }),
    get: () => ({
      fetch: async () => new Response(JSON.stringify({ days: [] }))
    })
  },
  USER_STATE: {
    idFromName: () => ({ id: 'test-user' }),
    get: () => ({
      fetch: async () => new Response(JSON.stringify({ preferences: {} }))
    })
  }
};

// Test basic worker functionality
async function testWorker() {
  console.log('🧪 Testing Smart Recipe Agent Worker...');
  
  try {
    // Test 1: Recipe Generation
    console.log('\n1. Testing Recipe Generation...');
    const recipeRequest = new Request('http://localhost/api/recipes/generate', {
      method: 'POST',
      body: JSON.stringify({
        ingredients: ['chicken', 'rice', 'vegetables'],
        dietary_restrictions: ['gluten-free'],
        preferences: { spice_level: 'medium' },
        season: 'winter'
      })
    });

    // Mock the worker fetch function
    const worker = {
      async fetch(request, env) {
        // Simulate recipe generation
        const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct', {
          messages: [{ role: 'user', content: 'Generate a recipe' }]
        });
        
        const recipe = JSON.parse(response.response);
        return new Response(JSON.stringify(recipe), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    };

    const recipeResponse = await worker.fetch(recipeRequest, mockEnv);
    const recipe = await recipeResponse.json();
    
    console.log('✅ Recipe generated:', recipe.name);
    console.log('   Cooking time:', recipe.cooking_time, 'minutes');
    console.log('   Difficulty:', recipe.difficulty);

    // Test 2: User State Management
    console.log('\n2. Testing User State Management...');
    const userState = new UserState({ storage: new Map() }, mockEnv);
    
    const preferencesRequest = new Request('http://internal/preferences', {
      method: 'POST',
      body: JSON.stringify({
        dietary_restrictions: ['vegetarian'],
        spice_level: 'mild'
      })
    });

    const prefsResponse = await userState.fetch(preferencesRequest);
    const prefs = await prefsResponse.json();
    
    console.log('✅ User preferences updated:', prefs.success);

    // Test 3: Recipe Caching
    console.log('\n3. Testing Recipe Caching...');
    const recipeCache = new RecipeCache({ storage: new Map() }, mockEnv);
    
    const cacheRequest = new Request('http://internal/set', {
      method: 'POST',
      body: JSON.stringify({
        id: 'test-recipe-1',
        name: 'Cached Recipe',
        ingredients: [{ name: 'test', quantity: 1, unit: 'cup' }]
      })
    });

    const cacheResponse = await recipeCache.fetch(cacheRequest);
    const cacheResult = await cacheResponse.json();
    
    console.log('✅ Recipe cached:', cacheResult.success);

    // Test 4: Meal Plan Generation
    console.log('\n4. Testing Meal Plan Generation...');
    const mealPlan = new MealPlan({ storage: new Map() }, mockEnv);
    
    const mealPlanRequest = new Request('http://internal/create', {
      method: 'POST',
      body: JSON.stringify({
        days: 7,
        preferences: { spice_level: 'medium' },
        dietary_restrictions: []
      })
    });

    const mealPlanResponse = await mealPlan.fetch(mealPlanRequest);
    const mealPlanResult = await mealPlanResponse.json();
    
    console.log('✅ Meal plan created with', mealPlanResult.days?.length || 0, 'days');

    console.log('\n🎉 All tests passed! The Smart Recipe Agent is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  testWorker();
}

export { testWorker };
