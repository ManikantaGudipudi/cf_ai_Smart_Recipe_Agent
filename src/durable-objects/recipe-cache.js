export class RecipeCache {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.cache = new Map();
    this.maxCacheSize = 1000;
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (path) {
        case '/get':
          return await this.getRecipe(request);
        case '/set':
          return await this.setRecipe(request);
        case '/search':
          return await this.searchRecipes(request);
        case '/seasonal':
          return await this.getSeasonalRecipes(request);
        case '/similar':
          return await this.getSimilarRecipes(request);
        case '/popular':
          return await this.getPopularRecipes(request);
        default:
          return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('RecipeCache error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async getRecipe(request) {
    const url = new URL(request.url);
    const recipeId = url.searchParams.get('id');

    if (!recipeId) {
      return new Response('Recipe ID required', { status: 400 });
    }

    // Check memory cache first
    if (this.cache.has(recipeId)) {
      const cached = this.cache.get(recipeId);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return new Response(JSON.stringify(cached.recipe), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        this.cache.delete(recipeId);
      }
    }

    // Check durable storage
    const recipe = await this.state.storage.get(`recipe:${recipeId}`);
    if (recipe) {
      // Add to memory cache
      this.cache.set(recipeId, {
        recipe,
        timestamp: Date.now()
      });
      
      return new Response(JSON.stringify(recipe), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Recipe not found', { status: 404 });
  }

  async setRecipe(request) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const recipe = await request.json();
    const recipeId = recipe.id || `recipe_${Date.now()}`;
    recipe.id = recipeId;
    recipe.cached_at = new Date().toISOString();

    // Store in durable storage
    await this.state.storage.put(`recipe:${recipeId}`, recipe);

    // Add to memory cache
    this.cache.set(recipeId, {
      recipe,
      timestamp: Date.now()
    });

    // Clean up cache if it gets too large
    if (this.cache.size > this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    // Update recipe index
    await this.updateRecipeIndex(recipe);

    return new Response(JSON.stringify({ 
      success: true, 
      recipe_id: recipeId 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async searchRecipes(request) {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const filters = JSON.parse(url.searchParams.get('filters') || '{}');

    if (!query) {
      return new Response('Query parameter required', { status: 400 });
    }

    const searchResults = await this.performSearch(query, filters);
    
    return new Response(JSON.stringify(searchResults), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async getSeasonalRecipes(request) {
    const url = new URL(request.url);
    const season = url.searchParams.get('season') || this.getCurrentSeason();
    const limit = parseInt(url.searchParams.get('limit')) || 10;

    const seasonalRecipes = await this.getRecipesBySeason(season, limit);
    
    return new Response(JSON.stringify(seasonalRecipes), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async getSimilarRecipes(request) {
    const url = new URL(request.url);
    const recipeId = url.searchParams.get('recipe_id');
    const limit = parseInt(url.searchParams.get('limit')) || 5;

    if (!recipeId) {
      return new Response('Recipe ID required', { status: 400 });
    }

    const recipe = await this.state.storage.get(`recipe:${recipeId}`);
    if (!recipe) {
      return new Response('Recipe not found', { status: 404 });
    }

    const similarRecipes = await this.findSimilarRecipes(recipe, limit);
    
    return new Response(JSON.stringify(similarRecipes), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async getPopularRecipes(request) {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const limit = parseInt(url.searchParams.get('limit')) || 10;

    const popularRecipes = await this.getPopularRecipesByCategory(category, limit);
    
    return new Response(JSON.stringify(popularRecipes), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async updateRecipeIndex(recipe) {
    const index = await this.state.storage.get('recipe_index') || {
      by_cuisine: {},
      by_diet: {},
      by_season: {},
      by_ingredients: {},
      popularity_scores: {},
      last_updated: new Date().toISOString()
    };

    // Index by cuisine
    if (recipe.cuisine) {
      if (!index.by_cuisine[recipe.cuisine]) {
        index.by_cuisine[recipe.cuisine] = [];
      }
      if (!index.by_cuisine[recipe.cuisine].includes(recipe.id)) {
        index.by_cuisine[recipe.cuisine].push(recipe.id);
      }
    }

    // Index by dietary restrictions
    if (recipe.dietary_info) {
      recipe.dietary_info.forEach(diet => {
        if (!index.by_diet[diet]) {
          index.by_diet[diet] = [];
        }
        if (!index.by_diet[diet].includes(recipe.id)) {
          index.by_diet[diet].push(recipe.id);
        }
      });
    }

    // Index by season
    if (recipe.seasonal) {
      recipe.seasonal.forEach(season => {
        if (!index.by_season[season]) {
          index.by_season[season] = [];
        }
        if (!index.by_season[season].includes(recipe.id)) {
          index.by_season[season].push(recipe.id);
        }
      });
    }

    // Index by main ingredients
    if (recipe.ingredients) {
      recipe.ingredients.forEach(ingredient => {
        const ingredientName = ingredient.name.toLowerCase();
        if (!index.by_ingredients[ingredientName]) {
          index.by_ingredients[ingredientName] = [];
        }
        if (!index.by_ingredients[ingredientName].includes(recipe.id)) {
          index.by_ingredients[ingredientName].push(recipe.id);
        }
      });
    }

    // Update popularity score
    index.popularity_scores[recipe.id] = (index.popularity_scores[recipe.id] || 0) + 1;
    index.last_updated = new Date().toISOString();

    await this.state.storage.put('recipe_index', index);
  }

  async performSearch(query, filters) {
    const index = await this.state.storage.get('recipe_index') || {};
    const searchTerms = query.toLowerCase().split(' ');
    const results = new Set();

    // Search by ingredients
    searchTerms.forEach(term => {
      Object.keys(index.by_ingredients || {}).forEach(ingredient => {
        if (ingredient.includes(term)) {
          index.by_ingredients[ingredient].forEach(recipeId => {
            results.add(recipeId);
          });
        }
      });
    });

    // Apply filters
    let filteredResults = Array.from(results);
    
    if (filters.cuisine && index.by_cuisine[filters.cuisine]) {
      filteredResults = filteredResults.filter(id => 
        index.by_cuisine[filters.cuisine].includes(id)
      );
    }

    if (filters.diet && index.by_diet[filters.diet]) {
      filteredResults = filteredResults.filter(id => 
        index.by_diet[filters.diet].includes(id)
      );
    }

    if (filters.season && index.by_season[filters.season]) {
      filteredResults = filteredResults.filter(id => 
        index.by_season[filters.season].includes(id)
      );
    }

    // Get recipe details
    const recipes = [];
    for (const recipeId of filteredResults.slice(0, 20)) {
      const recipe = await this.state.storage.get(`recipe:${recipeId}`);
      if (recipe) {
        recipes.push(recipe);
      }
    }

    return {
      recipes,
      total: recipes.length,
      query,
      filters
    };
  }

  getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  async getRecipesBySeason(season, limit) {
    const index = await this.state.storage.get('recipe_index') || {};
    const seasonalRecipeIds = index.by_season[season] || [];
    
    const recipes = [];
    for (const recipeId of seasonalRecipeIds.slice(0, limit)) {
      const recipe = await this.state.storage.get(`recipe:${recipeId}`);
      if (recipe) {
        recipes.push(recipe);
      }
    }

    return recipes;
  }

  async findSimilarRecipes(recipe, limit) {
    const index = await this.state.storage.get('recipe_index') || {};
    const similarIds = new Set();

    // Find recipes with similar ingredients
    if (recipe.ingredients) {
      recipe.ingredients.forEach(ingredient => {
        const ingredientName = ingredient.name.toLowerCase();
        if (index.by_ingredients[ingredientName]) {
          index.by_ingredients[ingredientName].forEach(id => {
            if (id !== recipe.id) {
              similarIds.add(id);
            }
          });
        }
      });
    }

    // Find recipes with same cuisine
    if (recipe.cuisine && index.by_cuisine[recipe.cuisine]) {
      index.by_cuisine[recipe.cuisine].forEach(id => {
        if (id !== recipe.id) {
          similarIds.add(id);
        }
      });
    }

    const similarRecipes = [];
    for (const recipeId of Array.from(similarIds).slice(0, limit)) {
      const similarRecipe = await this.state.storage.get(`recipe:${recipeId}`);
      if (similarRecipe) {
        similarRecipes.push(similarRecipe);
      }
    }

    return similarRecipes;
  }

  async getPopularRecipesByCategory(category, limit) {
    const index = await this.state.storage.get('recipe_index') || {};
    
    let recipeIds = [];
    if (category && index.by_cuisine[category]) {
      recipeIds = index.by_cuisine[category];
    } else {
      // Get all recipe IDs sorted by popularity
      recipeIds = Object.keys(index.popularity_scores || {})
        .sort((a, b) => (index.popularity_scores[b] || 0) - (index.popularity_scores[a] || 0));
    }

    const popularRecipes = [];
    for (const recipeId of recipeIds.slice(0, limit)) {
      const recipe = await this.state.storage.get(`recipe:${recipeId}`);
      if (recipe) {
        popularRecipes.push({
          ...recipe,
          popularity_score: index.popularity_scores[recipeId] || 0
        });
      }
    }

    return popularRecipes;
  }
}
