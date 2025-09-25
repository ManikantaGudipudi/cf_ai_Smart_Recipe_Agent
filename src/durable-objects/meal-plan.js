export class MealPlan {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (path) {
        case '/create':
          return await this.createMealPlan(request);
        case '/get':
          return await this.getMealPlan(request);
        case '/update':
          return await this.updateMealPlan(request);
        case '/grocery-list':
          return await this.generateGroceryList(request);
        case '/nutrition-summary':
          return await this.getNutritionSummary(request);
        case '/optimize':
          return await this.optimizeMealPlan(request);
        default:
          return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('MealPlan error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async createMealPlan(request) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const body = await request.json();
    const { days, preferences, dietary_restrictions, user_id } = body;

    // Generate meal plan using AI
    const mealPlan = await this.generateMealPlanWithAI({
      days,
      preferences,
      dietary_restrictions,
      user_id
    });

    // Store meal plan
    const planId = `plan_${Date.now()}`;
    mealPlan.id = planId;
    mealPlan.created_at = new Date().toISOString();
    mealPlan.user_id = user_id;

    await this.state.storage.put(`meal_plan:${planId}`, mealPlan);

    // Update user's meal plan history
    await this.updateMealPlanHistory(user_id, planId);

    return new Response(JSON.stringify(mealPlan), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async getMealPlan(request) {
    const url = new URL(request.url);
    const planId = url.searchParams.get('id');
    const user_id = url.searchParams.get('user_id');

    if (!planId && !user_id) {
      return new Response('Plan ID or User ID required', { status: 400 });
    }

    let mealPlan;
    if (planId) {
      mealPlan = await this.state.storage.get(`meal_plan:${planId}`);
    } else {
      // Get latest meal plan for user
      const history = await this.state.storage.get(`meal_plan_history:${user_id}`) || [];
      if (history.length > 0) {
        const latestPlanId = history[0];
        mealPlan = await this.state.storage.get(`meal_plan:${latestPlanId}`);
      }
    }

    if (!mealPlan) {
      return new Response('Meal plan not found', { status: 404 });
    }

    return new Response(JSON.stringify(mealPlan), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async updateMealPlan(request) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const body = await request.json();
    const { plan_id, updates } = body;

    const mealPlan = await this.state.storage.get(`meal_plan:${plan_id}`);
    if (!mealPlan) {
      return new Response('Meal plan not found', { status: 404 });
    }

    // Apply updates
    const updatedMealPlan = { ...mealPlan, ...updates };
    updatedMealPlan.updated_at = new Date().toISOString();

    await this.state.storage.put(`meal_plan:${plan_id}`, updatedMealPlan);

    return new Response(JSON.stringify(updatedMealPlan), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async generateGroceryList(request) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const body = await request.json();
    const { meal_plan_id } = body;

    const mealPlan = await this.state.storage.get(`meal_plan:${meal_plan_id}`);
    if (!mealPlan) {
      return new Response('Meal plan not found', { status: 404 });
    }

    const groceryList = await this.createGroceryListFromMealPlan(mealPlan);
    
    // Store grocery list
    const listId = `grocery_${Date.now()}`;
    groceryList.id = listId;
    groceryList.meal_plan_id = meal_plan_id;
    groceryList.created_at = new Date().toISOString();

    await this.state.storage.put(`grocery_list:${listId}`, groceryList);

    return new Response(JSON.stringify(groceryList), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async getNutritionSummary(request) {
    const url = new URL(request.url);
    const planId = url.searchParams.get('plan_id');

    if (!planId) {
      return new Response('Plan ID required', { status: 400 });
    }

    const mealPlan = await this.state.storage.get(`meal_plan:${planId}`);
    if (!mealPlan) {
      return new Response('Meal plan not found', { status: 404 });
    }

    const nutritionSummary = await this.calculateNutritionSummary(mealPlan);

    return new Response(JSON.stringify(nutritionSummary), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async optimizeMealPlan(request) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const body = await request.json();
    const { plan_id, optimization_goals } = body;

    const mealPlan = await this.state.storage.get(`meal_plan:${plan_id}`);
    if (!mealPlan) {
      return new Response('Meal plan not found', { status: 404 });
    }

    const optimizedPlan = await this.optimizeMealPlanWithAI(mealPlan, optimization_goals);

    // Store optimized version
    optimizedPlan.original_plan_id = plan_id;
    optimizedPlan.optimized_at = new Date().toISOString();

    const optimizedPlanId = `plan_opt_${Date.now()}`;
    await this.state.storage.put(`meal_plan:${optimizedPlanId}`, optimizedPlan);

    return new Response(JSON.stringify(optimizedPlan), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async generateMealPlanWithAI({ days, preferences, dietary_restrictions, user_id }) {
    // This would integrate with the AI service to generate meal plans
    // For now, returning a structured meal plan template
    
    const meals = ['breakfast', 'lunch', 'dinner', 'snacks'];
    const mealPlan = {
      days: [],
      total_nutrition: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
      },
      dietary_compliance: true,
      estimated_cost: 0
    };

    for (let day = 0; day < days; day++) {
      const dayPlan = {
        day: day + 1,
        date: new Date(Date.now() + day * 24 * 60 * 60 * 1000).toISOString(),
        meals: {}
      };

      meals.forEach(mealType => {
        dayPlan.meals[mealType] = {
          name: `${mealType} for day ${day + 1}`,
          recipe_id: null,
          ingredients: [],
          nutrition: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
          },
          cooking_time: 30,
          difficulty: 'medium',
          notes: ''
        };
      });

      mealPlan.days.push(dayPlan);
    }

    return mealPlan;
  }

  async createGroceryListFromMealPlan(mealPlan) {
    const ingredientMap = new Map();

    mealPlan.days.forEach(day => {
      Object.values(day.meals).forEach(meal => {
        meal.ingredients.forEach(ingredient => {
          const key = ingredient.name.toLowerCase();
          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key);
            existing.quantity += ingredient.quantity;
            existing.unit = ingredient.unit;
          } else {
            ingredientMap.set(key, {
              name: ingredient.name,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              category: ingredient.category || 'other',
              estimated_cost: ingredient.estimated_cost || 0
            });
          }
        });
      });
    });

    const groceryList = {
      items: Array.from(ingredientMap.values()),
      total_estimated_cost: Array.from(ingredientMap.values())
        .reduce((sum, item) => sum + (item.estimated_cost || 0), 0),
      categories: this.groupItemsByCategory(Array.from(ingredientMap.values())),
      shopping_optimization: {
        store_sections: this.optimizeStoreSections(Array.from(ingredientMap.values())),
        estimated_shopping_time: this.estimateShoppingTime(ingredientMap.size)
      }
    };

    return groceryList;
  }

  async calculateNutritionSummary(mealPlan) {
    const totalNutrition = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    };

    const dailyNutrition = [];

    mealPlan.days.forEach(day => {
      const dayNutrition = { ...totalNutrition };
      
      Object.values(day.meals).forEach(meal => {
        Object.keys(dayNutrition).forEach(nutrient => {
          dayNutrition[nutrient] += meal.nutrition[nutrient] || 0;
        });
      });

      dailyNutrition.push({
        day: day.day,
        date: day.date,
        nutrition: dayNutrition
      });

      // Add to total
      Object.keys(totalNutrition).forEach(nutrient => {
        totalNutrition[nutrient] += dayNutrition[nutrient];
      });
    });

    const averageDailyNutrition = {
      calories: totalNutrition.calories / mealPlan.days.length,
      protein: totalNutrition.protein / mealPlan.days.length,
      carbs: totalNutrition.carbs / mealPlan.days.length,
      fat: totalNutrition.fat / mealPlan.days.length,
      fiber: totalNutrition.fiber / mealPlan.days.length,
      sugar: totalNutrition.sugar / mealPlan.days.length,
      sodium: totalNutrition.sodium / mealPlan.days.length
    };

    return {
      total_nutrition: totalNutrition,
      average_daily_nutrition: averageDailyNutrition,
      daily_breakdown: dailyNutrition,
      nutrition_goals_compliance: await this.checkNutritionGoalsCompliance(averageDailyNutrition),
      recommendations: await this.generateNutritionRecommendations(averageDailyNutrition)
    };
  }

  async optimizeMealPlanWithAI(mealPlan, optimizationGoals) {
    // This would use AI to optimize the meal plan based on goals
    // For now, returning a basic optimization structure
    
    const optimizedPlan = JSON.parse(JSON.stringify(mealPlan));
    
    optimizationGoals.forEach(goal => {
      switch (goal.type) {
        case 'reduce_cost':
          optimizedPlan = this.optimizeForCost(optimizedPlan);
          break;
        case 'increase_protein':
          optimizedPlan = this.optimizeForProtein(optimizedPlan);
          break;
        case 'reduce_cooking_time':
          optimizedPlan = this.optimizeForTime(optimizedPlan);
          break;
        case 'improve_variety':
          optimizedPlan = this.optimizeForVariety(optimizedPlan);
          break;
      }
    });

    return optimizedPlan;
  }

  groupItemsByCategory(items) {
    const categories = {};
    
    items.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    });

    return categories;
  }

  optimizeStoreSections(items) {
    // Group items by typical store sections for efficient shopping
    const sections = {
      'Produce': [],
      'Meat & Seafood': [],
      'Dairy': [],
      'Bakery': [],
      'Pantry': [],
      'Frozen': [],
      'Other': []
    };

    items.forEach(item => {
      const category = item.category.toLowerCase();
      if (category.includes('vegetable') || category.includes('fruit')) {
        sections['Produce'].push(item);
      } else if (category.includes('meat') || category.includes('seafood')) {
        sections['Meat & Seafood'].push(item);
      } else if (category.includes('dairy')) {
        sections['Dairy'].push(item);
      } else if (category.includes('bread') || category.includes('bakery')) {
        sections['Bakery'].push(item);
      } else if (category.includes('frozen')) {
        sections['Frozen'].push(item);
      } else {
        sections['Pantry'].push(item);
      }
    });

    return sections;
  }

  estimateShoppingTime(itemCount) {
    // Estimate shopping time based on number of items
    const baseTime = 30; // 30 minutes base time
    const timePerItem = 2; // 2 minutes per item
    return Math.min(baseTime + (itemCount * timePerItem), 120); // Max 2 hours
  }

  async checkNutritionGoalsCompliance(nutrition) {
    // This would check against user's nutrition goals
    return {
      calories: { target: 2000, actual: nutrition.calories, compliant: true },
      protein: { target: 150, actual: nutrition.protein, compliant: true },
      carbs: { target: 250, actual: nutrition.carbs, compliant: true },
      fat: { target: 65, actual: nutrition.fat, compliant: true }
    };
  }

  async generateNutritionRecommendations(nutrition) {
    const recommendations = [];

    if (nutrition.protein < 100) {
      recommendations.push('Consider adding more protein-rich foods to your meals');
    }
    if (nutrition.fiber < 25) {
      recommendations.push('Increase fiber intake with more vegetables and whole grains');
    }
    if (nutrition.calories > 2500) {
      recommendations.push('Consider reducing portion sizes or choosing lower-calorie options');
    }

    return recommendations;
  }

  async updateMealPlanHistory(user_id, planId) {
    const history = await this.state.storage.get(`meal_plan_history:${user_id}`) || [];
    history.unshift(planId);
    
    // Keep only last 20 meal plans
    if (history.length > 20) {
      history.splice(20);
    }

    await this.state.storage.put(`meal_plan_history:${user_id}`, history);
  }

  // Optimization helper methods
  optimizeForCost(mealPlan) {
    // Implement cost optimization logic
    return mealPlan;
  }

  optimizeForProtein(mealPlan) {
    // Implement protein optimization logic
    return mealPlan;
  }

  optimizeForTime(mealPlan) {
    // Implement time optimization logic
    return mealPlan;
  }

  optimizeForVariety(mealPlan) {
    // Implement variety optimization logic
    return mealPlan;
  }
}
