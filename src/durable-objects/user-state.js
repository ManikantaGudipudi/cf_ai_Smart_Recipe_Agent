export class UserState {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (path) {
        case '/preferences':
          return await this.handlePreferences(request);
        case '/pantry':
          return await this.handlePantry(request);
        case '/meal-history':
          return await this.handleMealHistory(request);
        case '/timers':
          return await this.handleTimers(request);
        case '/nutrition-goals':
          return await this.handleNutritionGoals(request);
        default:
          return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('UserState error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async handlePreferences(request) {
    const userData = await this.state.storage.get('userData') || {
      preferences: {
        dietary_restrictions: [],
        allergies: [],
        favorite_cuisines: [],
        disliked_ingredients: [],
        spice_level: 'medium',
        cooking_time_preference: 'medium'
      },
      created_at: new Date().toISOString()
    };

    if (request.method === 'GET') {
      return new Response(JSON.stringify(userData.preferences), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (request.method === 'POST') {
      const newPreferences = await request.json();
      userData.preferences = { ...userData.preferences, ...newPreferences };
      userData.updated_at = new Date().toISOString();
      
      await this.state.storage.put('userData', userData);
      
      return new Response(JSON.stringify({ 
        success: true, 
        preferences: userData.preferences 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method not allowed', { status: 405 });
  }

  async handlePantry(request) {
    const pantryData = await this.state.storage.get('pantry') || {
      ingredients: [],
      last_updated: new Date().toISOString()
    };

    if (request.method === 'GET') {
      return new Response(JSON.stringify(pantryData), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (request.method === 'POST') {
      const body = await request.json();
      const { action, ingredients } = body;

      if (action === 'add') {
        pantryData.ingredients = [...pantryData.ingredients, ...ingredients];
      } else if (action === 'remove') {
        pantryData.ingredients = pantryData.ingredients.filter(
          item => !ingredients.some(removeItem => removeItem.name === item.name)
        );
      } else if (action === 'update') {
        pantryData.ingredients = ingredients;
      }

      pantryData.last_updated = new Date().toISOString();
      await this.state.storage.put('pantry', pantryData);

      return new Response(JSON.stringify({ 
        success: true, 
        pantry: pantryData 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method not allowed', { status: 405 });
  }

  async handleMealHistory(request) {
    const mealHistory = await this.state.storage.get('mealHistory') || {
      meals: [],
      last_updated: new Date().toISOString()
    };

    if (request.method === 'GET') {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit')) || 10;
      const offset = parseInt(url.searchParams.get('offset')) || 0;

      const paginatedMeals = mealHistory.meals
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(offset, offset + limit);

      return new Response(JSON.stringify({
        meals: paginatedMeals,
        total: mealHistory.meals.length,
        limit,
        offset
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (request.method === 'POST') {
      const meal = await request.json();
      meal.id = Date.now().toString();
      meal.date = new Date().toISOString();

      mealHistory.meals.unshift(meal);
      mealHistory.last_updated = new Date().toISOString();

      // Keep only last 100 meals
      if (mealHistory.meals.length > 100) {
        mealHistory.meals = mealHistory.meals.slice(0, 100);
      }

      await this.state.storage.put('mealHistory', mealHistory);

      return new Response(JSON.stringify({ 
        success: true, 
        meal 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method not allowed', { status: 405 });
  }

  async handleTimers(request) {
    const timerData = await this.state.storage.get('timers') || {
      active_timers: [],
      timer_history: [],
      last_updated: new Date().toISOString()
    };

    if (request.method === 'GET') {
      return new Response(JSON.stringify(timerData), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (request.method === 'POST') {
      const body = await request.json();
      const { action, timer } = body;

      if (action === 'start') {
        timer.id = Date.now().toString();
        timer.start_time = new Date().toISOString();
        timer.status = 'active';
        timerData.active_timers.push(timer);
      } else if (action === 'stop') {
        const timerIndex = timerData.active_timers.findIndex(t => t.id === timer.id);
        if (timerIndex !== -1) {
          const stoppedTimer = timerData.active_timers[timerIndex];
          stoppedTimer.end_time = new Date().toISOString();
          stoppedTimer.status = 'completed';
          
          timerData.timer_history.unshift(stoppedTimer);
          timerData.active_timers.splice(timerIndex, 1);

          // Keep only last 50 timer records
          if (timerData.timer_history.length > 50) {
            timerData.timer_history = timerData.timer_history.slice(0, 50);
          }
        }
      } else if (action === 'pause') {
        const timerIndex = timerData.active_timers.findIndex(t => t.id === timer.id);
        if (timerIndex !== -1) {
          timerData.active_timers[timerIndex].status = 'paused';
          timerData.active_timers[timerIndex].paused_at = new Date().toISOString();
        }
      } else if (action === 'resume') {
        const timerIndex = timerData.active_timers.findIndex(t => t.id === timer.id);
        if (timerIndex !== -1) {
          timerData.active_timers[timerIndex].status = 'active';
          timerData.active_timers[timerIndex].resumed_at = new Date().toISOString();
        }
      }

      timerData.last_updated = new Date().toISOString();
      await this.state.storage.put('timers', timerData);

      return new Response(JSON.stringify({ 
        success: true, 
        timers: timerData 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method not allowed', { status: 405 });
  }

  async handleNutritionGoals(request) {
    const nutritionGoals = await this.state.storage.get('nutritionGoals') || {
      daily_calories: 2000,
      daily_protein: 150,
      daily_carbs: 250,
      daily_fat: 65,
      daily_fiber: 25,
      daily_sugar: 50,
      goals_updated: new Date().toISOString()
    };

    if (request.method === 'GET') {
      return new Response(JSON.stringify(nutritionGoals), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (request.method === 'POST') {
      const newGoals = await request.json();
      const updatedGoals = { ...nutritionGoals, ...newGoals };
      updatedGoals.goals_updated = new Date().toISOString();
      
      await this.state.storage.put('nutritionGoals', updatedGoals);
      
      return new Response(JSON.stringify({ 
        success: true, 
        goals: updatedGoals 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method not allowed', { status: 405 });
  }

  // WebSocket support for real-time updates
  async webSocketMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'timer_update':
          // Handle real-time timer updates
          ws.send(JSON.stringify({
            type: 'timer_response',
            data: await this.getActiveTimers()
          }));
          break;
        case 'pantry_update':
          // Handle pantry updates
          ws.send(JSON.stringify({
            type: 'pantry_response',
            data: await this.state.storage.get('pantry')
          }));
          break;
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  }

  async getActiveTimers() {
    const timerData = await this.state.storage.get('timers') || { active_timers: [] };
    return timerData.active_timers;
  }
}
