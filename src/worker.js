import { UserState } from './durable-objects/user-state.js';
import { RecipeCache } from './durable-objects/recipe-cache.js';
import { MealPlan } from './durable-objects/meal-plan.js';
import { RecipeService } from './services/recipe-service.js';
import { NutritionService } from './services/nutrition-service.js';
import { VoiceProcessor } from './services/voice-processor.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Initialize services
      const recipeService = new RecipeService(env);
      const nutritionService = new NutritionService(env);
      const voiceProcessor = new VoiceProcessor(env);

      // Route handling
      switch (path) {
        case '/api/recipes/generate':
          return await handleRecipeGeneration(request, env, recipeService, corsHeaders);
        
        case '/api/meal-plan/create':
          return await handleMealPlanCreation(request, env, recipeService, corsHeaders);
        
        case '/api/recipes/search':
          return await handleRecipeSearch(request, env, recipeService, corsHeaders);
        
        case '/api/nutrition/analyze':
          return await handleNutritionAnalysis(request, env, nutritionService, corsHeaders);
        
        case '/api/voice/process':
          return await handleVoiceProcessing(request, env, voiceProcessor, corsHeaders);
        
        case '/api/user/preferences':
          return await handleUserPreferences(request, env, corsHeaders);
        
        case '/api/grocery/list':
          return await handleGroceryList(request, env, recipeService, corsHeaders);
        
        case '/api/leftovers/optimize':
          return await handleLeftoverOptimization(request, env, recipeService, corsHeaders);
        
        case '/api/timer':
          return await handleCookingTimer(request, env, corsHeaders);
        
        default:
          return new Response('Not Found', { 
            status: 404, 
            headers: corsHeaders 
          });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },
};

// Recipe Generation Handler
async function handleRecipeGeneration(request, env, recipeService, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  const body = await request.json();
  const { ingredients, dietary_restrictions, preferences, season } = body;

  const recipe = await recipeService.generateRecipe({
    ingredients,
    dietary_restrictions,
    preferences,
    season
  });

  return new Response(JSON.stringify(recipe), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Meal Plan Creation Handler
async function handleMealPlanCreation(request, env, recipeService, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  const body = await request.json();
  const { user_id, days, preferences, dietary_restrictions } = body;

  const id = env.MEAL_PLAN.idFromName(user_id);
  const mealPlanObj = env.MEAL_PLAN.get(id);
  
  const mealPlan = await mealPlanObj.fetch('http://internal/create', {
    method: 'POST',
    body: JSON.stringify({ days, preferences, dietary_restrictions })
  });

  return new Response(await mealPlan.text(), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Recipe Search Handler
async function handleRecipeSearch(request, env, recipeService, corsHeaders) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const filters = url.searchParams.get('filters');

  if (!query) {
    return new Response('Query parameter required', { 
      status: 400, 
      headers: corsHeaders 
    });
  }

  const results = await recipeService.searchRecipes(query, filters);
  
  return new Response(JSON.stringify(results), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Nutrition Analysis Handler
async function handleNutritionAnalysis(request, env, nutritionService, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  const body = await request.json();
  const { ingredients, quantities } = body;

  const analysis = await nutritionService.analyzeNutrition(ingredients, quantities);
  
  return new Response(JSON.stringify(analysis), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Voice Processing Handler
async function handleVoiceProcessing(request, env, voiceProcessor, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  const formData = await request.formData();
  const audioFile = formData.get('audio');

  if (!audioFile) {
    return new Response('Audio file required', { 
      status: 400, 
      headers: corsHeaders 
    });
  }

  const transcription = await voiceProcessor.processAudio(audioFile);
  
  return new Response(JSON.stringify({ transcription }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// User Preferences Handler
async function handleUserPreferences(request, env, corsHeaders) {
  const url = new URL(request.url);
  const user_id = url.searchParams.get('user_id');

  if (!user_id) {
    return new Response('User ID required', { 
      status: 400, 
      headers: corsHeaders 
    });
  }

  const id = env.USER_STATE.idFromName(user_id);
  const userStateObj = env.USER_STATE.get(id);
  
  if (request.method === 'GET') {
    const response = await userStateObj.fetch('http://internal/preferences');
    return new Response(await response.text(), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } else if (request.method === 'POST') {
    const body = await request.text();
    const response = await userStateObj.fetch('http://internal/preferences', {
      method: 'POST',
      body
    });
    return new Response(await response.text(), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response('Method not allowed', { 
    status: 405, 
    headers: corsHeaders 
  });
}

// Grocery List Handler
async function handleGroceryList(request, env, recipeService, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  const body = await request.json();
  const { meal_plan_id, user_id } = body;

  const id = env.MEAL_PLAN.idFromName(user_id);
  const mealPlanObj = env.MEAL_PLAN.get(id);
  
  const groceryList = await mealPlanObj.fetch('http://internal/grocery-list', {
    method: 'POST',
    body: JSON.stringify({ meal_plan_id })
  });

  return new Response(await groceryList.text(), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Leftover Optimization Handler
async function handleLeftoverOptimization(request, env, recipeService, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  const body = await request.json();
  const { ingredients, user_preferences } = body;

  const optimizedRecipes = await recipeService.optimizeLeftovers(ingredients, user_preferences);
  
  return new Response(JSON.stringify(optimizedRecipes), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Cooking Timer Handler
async function handleCookingTimer(request, env, corsHeaders) {
  const url = new URL(request.url);
  const user_id = url.searchParams.get('user_id');

  if (!user_id) {
    return new Response('User ID required', { 
      status: 400, 
      headers: corsHeaders 
    });
  }

  const id = env.USER_STATE.idFromName(user_id);
  const userStateObj = env.USER_STATE.get(id);
  
  if (request.method === 'GET') {
    const response = await userStateObj.fetch('http://internal/timers');
    return new Response(await response.text(), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } else if (request.method === 'POST') {
    const body = await request.text();
    const response = await userStateObj.fetch('http://internal/timers', {
      method: 'POST',
      body
    });
    return new Response(await response.text(), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response('Method not allowed', { 
    status: 405, 
    headers: corsHeaders 
  });
}

export { UserState, RecipeCache, MealPlan };
