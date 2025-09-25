class SmartRecipeApp {
    constructor() {
        this.apiBase = 'http://localhost:3002/api';
        this.currentSection = 'chat';
        this.userId = this.generateUserId();
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.timer = null;
        this.timerInterval = null;
        
        // Conversation context
        this.conversationContext = {
            lastRecipe: null,
            lastMealPlan: null,
            waitingForResponse: false
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadUserPreferences();
        this.loadPantry();
        this.loadRecipes();
        this.setupVoiceRecognition();
    }

    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });

        // Chat
        document.getElementById('send-btn').addEventListener('click', () => this.sendMessage());
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Voice controls
        document.getElementById('voice-btn').addEventListener('click', () => this.toggleVoiceRecording());
        document.getElementById('voice-stop-btn').addEventListener('click', () => this.stopVoiceRecording());

        // Quick actions
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Meal plan
        document.getElementById('generate-meal-plan').addEventListener('click', () => this.generateMealPlan());

        // Pantry
        document.getElementById('add-ingredient').addEventListener('click', () => this.showIngredientModal());

        // Recipes
        document.getElementById('recipe-search').addEventListener('input', (e) => this.searchRecipes(e.target.value));

        // Modals
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') this.closeModals();
        });

        // Ingredient form
        document.getElementById('ingredient-form').addEventListener('submit', (e) => this.addIngredient(e));

        // Timer controls
        document.getElementById('timer-start').addEventListener('click', () => this.startTimer());
        document.getElementById('timer-pause').addEventListener('click', () => this.pauseTimer());
        document.getElementById('timer-reset').addEventListener('click', () => this.resetTimer());
    }

    switchSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(`${section}-section`).classList.add('active');

        this.currentSection = section;
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;

        // Add user message to chat
        this.addMessage('user', message);
        input.value = '';

        // Show loading
        this.showLoading('Processing your request...');

        try {
            // Determine the type of request and handle accordingly
            const response = await this.processUserMessage(message);
            this.addMessage('assistant', response);
        } catch (error) {
            console.error('Error processing message:', error);
            this.addMessage('assistant', 'Sorry, I encountered an error processing your request. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async processUserMessage(message) {
        const lowerMessage = message.toLowerCase();

        // Check for follow-up responses to previous messages
        if (this.conversationContext.waitingForResponse) {
            return await this.handleFollowUpResponse(message);
        }

        // Recipe generation request - expanded keywords
        if (lowerMessage.includes('recipe') || lowerMessage.includes('cook') || lowerMessage.includes('make') ||
            lowerMessage.includes('sandwich') || lowerMessage.includes('dish') || lowerMessage.includes('meal') ||
            lowerMessage.includes('food') || lowerMessage.includes('guac') || lowerMessage.includes('guacamole') ||
            lowerMessage.includes('what can i') || lowerMessage.includes('how to') ||
            (lowerMessage.includes('pantry') && (lowerMessage.includes('ingredients') || lowerMessage.includes('added')))) {
            return await this.handleRecipeRequest(message);
        }

        // Meal planning request
        if (lowerMessage.includes('meal plan') || lowerMessage.includes('weekly') || lowerMessage.includes('plan')) {
            return await this.handleMealPlanRequest(message);
        }

        // Leftover optimization
        if (lowerMessage.includes('leftover') || lowerMessage.includes('use up') || lowerMessage.includes('remaining')) {
            return await this.handleLeftoverRequest(message);
        }

        // Nutrition questions
        if (lowerMessage.includes('nutrition') || lowerMessage.includes('calorie') || lowerMessage.includes('healthy')) {
            return await this.handleNutritionRequest(message);
        }

        // General cooking questions
        return await this.handleGeneralCookingQuestion(message);
    }

    async handleFollowUpResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Handle "yes" responses for recipe details
        if (lowerMessage === 'yes' || lowerMessage === 'y' || lowerMessage.includes('show') || lowerMessage.includes('full')) {
            if (this.conversationContext.lastRecipe) {
                this.conversationContext.waitingForResponse = false;
                return this.formatFullRecipeResponse(this.conversationContext.lastRecipe);
            }
        }
        
        // Handle "no" responses
        if (lowerMessage === 'no' || lowerMessage === 'n') {
            this.conversationContext.waitingForResponse = false;
            return "No problem! Is there anything else I can help you with? You can ask me to generate another recipe, create a meal plan, or help with cooking questions.";
        }
        
        // Handle other follow-up questions
        this.conversationContext.waitingForResponse = false;
        return "I'd be happy to help! You can ask me to:\n• Show the full recipe details\n• Generate another recipe\n• Create a meal plan\n• Help with cooking questions\n\nWhat would you like to do?";
    }

    async handleRecipeRequest(message) {
        // Extract ingredients from message or use pantry
        let ingredients = this.extractIngredientsFromMessage(message);
        // If no ingredients found in message, use pantry ingredients
        if (!ingredients || ingredients.length === 0) {
            ingredients = await this.getPantryIngredients();
        }
        
        if (ingredients.length === 0) {
            return "I'd be happy to help you generate a recipe! Please tell me what ingredients you have available, or add some ingredients to your pantry first.";
        }

        // Show loading message
        this.showLoading('Generating your recipe...');

        try {
            const response = await this.makeAPIRequest('/recipes/generate', {
                method: 'POST',
                body: JSON.stringify({
                    ingredients,
                    dietary_restrictions: await this.getDietaryRestrictions(),
                    preferences: await this.getCookingPreferences(),
                    season: this.getCurrentSeason()
                })
            });

            if (response.name) {
                // Store recipe for later reference
                this.storeRecipe(response);
                
                // Set conversation context for follow-up
                this.conversationContext.lastRecipe = response;
                this.conversationContext.waitingForResponse = true;
                
                return this.formatRecipeResponse(response);
            } else {
                return "I couldn't generate a recipe with those ingredients. Could you try specifying different ingredients or check your pantry?";
            }
        } catch (error) {
            console.error('Error generating recipe:', error);
            return "Sorry, I had trouble generating a recipe. Please try again.";
        } finally {
            this.hideLoading();
        }
    }

    async handleMealPlanRequest(message) {
        const response = await this.makeAPIRequest('/meal-plan/create', {
            method: 'POST',
            body: JSON.stringify({
                user_id: this.userId,
                days: 7,
                preferences: await this.getCookingPreferences(),
                dietary_restrictions: await this.getDietaryRestrictions()
            })
        });

        if (response.days) {
            this.displayMealPlan(response);
            return `I've generated a ${response.days.length}-day meal plan for you! You can view it in the Meal Plan section. I've also created a grocery list for you.`;
        } else {
            return "I couldn't generate a meal plan at the moment. Please try again later.";
        }
    }

    async handleLeftoverRequest(message) {
        const pantryIngredients = await this.getPantryIngredients();
        
        if (pantryIngredients.length === 0) {
            return "I'd be happy to help you use up your leftovers! Please add some ingredients to your pantry first, or tell me what leftovers you have.";
        }

        const response = await this.makeAPIRequest('/leftovers/optimize', {
            method: 'POST',
            body: JSON.stringify({
                ingredients: pantryIngredients,
                user_preferences: await this.getCookingPreferences()
            })
        });

        if (response.length > 0) {
            return this.formatLeftoverRecipes(response);
        } else {
            return "I couldn't find creative ways to use those ingredients. Try adding more variety to your pantry!";
        }
    }

    async handleNutritionRequest(message) {
        const pantryIngredients = await this.getPantryIngredients();
        
        if (pantryIngredients.length === 0) {
            return "I can help analyze the nutrition of your ingredients! Please add some ingredients to your pantry first.";
        }

        const response = await this.makeAPIRequest('/nutrition/analyze', {
            method: 'POST',
            body: JSON.stringify({
                ingredients: pantryIngredients,
                quantities: pantryIngredients.map(() => 1) // Default quantity
            })
        });

        if (response.totals) {
            return this.formatNutritionResponse(response);
        } else {
            return "I couldn't analyze the nutrition of those ingredients. Please try again.";
        }
    }

    async handleGeneralCookingQuestion(message) {
        // Use AI to answer general cooking questions
        const response = await this.makeAPIRequest('/voice/process', {
            method: 'POST',
            body: new FormData().append('audio', new Blob([message], { type: 'text/plain' }))
        });

        return response.answer || "I'd be happy to help with that cooking question! Could you provide more details?";
    }

    addMessage(type, content) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        const icon = type === 'user' ? 'fas fa-user' : 'fas fa-robot';
        messageDiv.innerHTML = `
            <div class="message-content">
                <i class="${icon}"></i>
                <div>${this.formatMessageContent(content)}</div>
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    formatMessageContent(content) {
        if (typeof content === 'string') {
            return content.replace(/\n/g, '<br>');
        }
        return JSON.stringify(content, null, 2);
    }

    formatRecipeResponse(recipe) {
        return `
            <strong>${recipe.name}</strong><br>
            <em>${recipe.description}</em><br><br>
            
            <strong>Cooking Time:</strong> ${recipe.cooking_time} minutes<br>
            <strong>Difficulty:</strong> ${recipe.difficulty}<br>
            <strong>Servings:</strong> ${recipe.servings}<br><br>
            
            <strong>Main Ingredients:</strong><br>
            ${recipe.ingredients.slice(0, 5).map(ing => `• ${ing.quantity} ${ing.unit} ${ing.name}`).join('<br>')}<br><br>
            
            <strong>Instructions:</strong><br>
            ${recipe.instructions.slice(0, 3).map((step, i) => `${i + 1}. ${step}`).join('<br>')}<br><br>
            
            <em>Would you like me to show the full recipe details?</em>
        `;
    }

    formatFullRecipeResponse(recipe) {
        return `
            <strong>📋 Complete Recipe: ${recipe.name}</strong><br>
            <em>${recipe.description}</em><br><br>
            
            <strong>🍽️ Details:</strong><br>
            <strong>Cuisine:</strong> ${recipe.cuisine}<br>
            <strong>Cooking Time:</strong> ${recipe.cooking_time} minutes<br>
            <strong>Difficulty:</strong> ${recipe.difficulty}<br>
            <strong>Servings:</strong> ${recipe.servings}<br>
            <strong>Dietary:</strong> ${recipe.dietary_info.join(', ')}<br><br>
            
            <strong>🥘 Ingredients:</strong><br>
            ${recipe.ingredients.map(ing => `• ${ing.quantity} ${ing.unit} ${ing.name}`).join('<br>')}<br><br>
            
            <strong>👨‍🍳 Instructions:</strong><br>
            ${recipe.instructions.map((step, i) => `${i + 1}. ${step}`).join('<br>')}<br><br>
            
            <strong>📊 Nutrition (per serving):</strong><br>
            <strong>Calories:</strong> ${recipe.nutrition.calories}<br>
            <strong>Protein:</strong> ${recipe.nutrition.protein}g<br>
            <strong>Carbs:</strong> ${recipe.nutrition.carbs}g<br>
            <strong>Fat:</strong> ${recipe.nutrition.fat}g<br>
            <strong>Fiber:</strong> ${recipe.nutrition.fiber}g<br><br>
            
            <strong>💡 Pro Tips:</strong><br>
            ${recipe.tips.map(tip => `• ${tip}`).join('<br>')}<br><br>
            
            <em>Enjoy your delicious ${recipe.name}! 🎉</em>
        `;
    }

    formatLeftoverRecipes(recipes) {
        let response = `<strong>Creative Leftover Recipes:</strong><br><br>`;
        
        recipes.forEach((recipe, index) => {
            response += `
                <strong>${index + 1}. ${recipe.name}</strong><br>
                <em>${recipe.description}</em><br>
                Cooking Time: ${recipe.cooking_time} minutes<br><br>
            `;
        });

        return response;
    }

    formatNutritionResponse(nutrition) {
        const totals = nutrition.totals;
        return `
            <strong>Nutrition Analysis:</strong><br><br>
            
            <strong>Total Calories:</strong> ${totals.calories}<br>
            <strong>Protein:</strong> ${totals.protein}g<br>
            <strong>Carbohydrates:</strong> ${totals.carbs}g<br>
            <strong>Fat:</strong> ${totals.fat}g<br>
            <strong>Fiber:</strong> ${totals.fiber}g<br><br>
            
            <strong>Analysis:</strong><br>
            Overall Score: ${nutrition.analysis.overall_score}/100<br>
            ${nutrition.analysis.strengths.length > 0 ? 
                '<strong>Strengths:</strong><br>' + nutrition.analysis.strengths.map(s => `• ${s}`).join('<br>') + '<br><br>' : 
                ''
            }
            ${nutrition.analysis.concerns.length > 0 ? 
                '<strong>Areas for Improvement:</strong><br>' + nutrition.analysis.concerns.map(c => `• ${c}`).join('<br>') + '<br><br>' : 
                ''
            }
            
            <strong>Recommendations:</strong><br>
            ${nutrition.recommendations.map(r => `• ${r.message}`).join('<br>')}
        `;
    }

    async toggleVoiceRecording() {
        if (this.isRecording) {
            this.stopVoiceRecording();
        } else {
            this.startVoiceRecording();
        }
    }

    async startVoiceRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                await this.processVoiceInput(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.updateVoiceButton();
        } catch (error) {
            console.error('Error starting voice recording:', error);
            this.showToast('Error accessing microphone', 'error');
        }
    }

    stopVoiceRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.updateVoiceButton();
        }
    }

    updateVoiceButton() {
        const voiceBtn = document.getElementById('voice-btn');
        const stopBtn = document.getElementById('voice-stop-btn');

        if (this.isRecording) {
            voiceBtn.style.display = 'none';
            stopBtn.style.display = 'block';
            voiceBtn.classList.add('recording');
        } else {
            voiceBtn.style.display = 'block';
            stopBtn.style.display = 'none';
            voiceBtn.classList.remove('recording');
        }
    }

    async processVoiceInput(audioBlob) {
        this.showLoading('Processing your voice input...');

        try {
            const formData = new FormData();
            formData.append('audio', audioBlob);

            const response = await fetch(`${this.apiBase}/voice/process`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.processed_text) {
                this.addMessage('assistant', `I heard: "${result.original_transcription}"`);
                
                // Process the extracted cooking information
                if (result.extracted_info.ingredients.length > 0) {
                    this.addMessage('assistant', await this.handleRecipeRequest(result.processed_text));
                } else {
                    this.addMessage('assistant', await this.processUserMessage(result.processed_text));
                }
            } else {
                this.addMessage('assistant', "I couldn't understand your voice input. Could you try again or type your message?");
            }
        } catch (error) {
            console.error('Error processing voice input:', error);
            this.addMessage('assistant', 'Sorry, I had trouble processing your voice input. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    setupVoiceRecognition() {
        // Check for browser support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.log('Speech recognition not supported');
            return;
        }

        // Fallback to browser speech recognition if available
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('chat-input').value = transcript;
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };
    }

    handleQuickAction(action) {
        switch (action) {
            case 'generate-recipe':
                this.addMessage('user', 'Generate a recipe from my pantry ingredients');
                this.sendMessage();
                break;
            case 'meal-plan':
                this.addMessage('user', 'Create a weekly meal plan');
                this.sendMessage();
                break;
            case 'leftovers':
                this.addMessage('user', 'Help me use up my leftover ingredients');
                this.sendMessage();
                break;
        }
    }

    async generateMealPlan() {
        this.showLoading('Generating your personalized meal plan...');

        try {
            const response = await this.makeAPIRequest('/meal-plan/create', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: this.userId,
                    days: 7,
                    preferences: await this.getCookingPreferences(),
                    dietary_restrictions: await this.getDietaryRestrictions()
                })
            });

            if (response.days) {
                this.displayMealPlan(response);
                this.showToast('Meal plan generated successfully!', 'success');
            } else {
                this.showToast('Failed to generate meal plan', 'error');
            }
        } catch (error) {
            console.error('Error generating meal plan:', error);
            this.showToast('Error generating meal plan', 'error');
        } finally {
            this.hideLoading();
        }
    }

    displayMealPlan(mealPlan) {
        const container = document.getElementById('meal-plan-container');
        
        let html = `
            <div class="meal-plan-header">
                <h3>${mealPlan.days.length}-Day Meal Plan</h3>
                <div class="meal-plan-meta">
                    <span><i class="fas fa-clock"></i> Generated ${new Date(mealPlan.created_at).toLocaleDateString()}</span>
                    <span><i class="fas fa-users"></i> Serves ${mealPlan.days[0]?.meals?.breakfast?.servings || 4} people</span>
                </div>
            </div>
            <div class="meal-plan-days">
        `;

        mealPlan.days.forEach((day, index) => {
            html += `
                <div class="meal-plan-day">
                    <h4>Day ${day.day}</h4>
                    <div class="meals-grid">
            `;

            Object.entries(day.meals).forEach(([mealType, meal]) => {
                html += `
                    <div class="meal-card">
                        <h5>${mealType.charAt(0).toUpperCase() + mealType.slice(1)}</h5>
                        <p>${meal.name}</p>
                        <div class="meal-meta">
                            <span><i class="fas fa-clock"></i> ${meal.cooking_time}min</span>
                            <span><i class="fas fa-signal"></i> ${meal.difficulty}</span>
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        html += `
            </div>
            <div class="meal-plan-actions">
                <button class="btn btn-primary" onclick="app.generateGroceryList('${mealPlan.id}')">
                    <i class="fas fa-shopping-cart"></i>
                    Generate Grocery List
                </button>
                <button class="btn btn-secondary" onclick="app.optimizeMealPlan('${mealPlan.id}')">
                    <i class="fas fa-magic"></i>
                    Optimize Plan
                </button>
            </div>
        `;

        container.innerHTML = html;
    }

    async loadPantry() {
        try {
            const response = await this.makeAPIRequest(`/user/preferences?user_id=${this.userId}&type=pantry`);
            
            if (response && response.ingredients) {
                this.displayPantry(response.ingredients);
            }
        } catch (error) {
            console.error('Error loading pantry:', error);
            // Show empty pantry on error
            this.displayPantry([]);
        }
    }

    displayPantry(ingredients) {
        const container = document.getElementById('pantry-categories');
        
        if (!ingredients || ingredients.length === 0) {
            container.innerHTML = `
                <div class="pantry-placeholder">
                    <i class="fas fa-archive"></i>
                    <h3>Your pantry is empty</h3>
                    <p>Add some ingredients to get started with recipe suggestions!</p>
                </div>
            `;
            return;
        }
        
        // Group ingredients by category
        const categories = {};
        ingredients.forEach(ingredient => {
            const category = ingredient.category || 'other';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(ingredient);
        });

        let html = '';
        Object.entries(categories).forEach(([category, items]) => {
            html += `
                <div class="pantry-category">
                    <h3><i class="fas fa-${this.getCategoryIcon(category)}"></i> ${this.formatCategoryName(category)}</h3>
                    <div class="pantry-items">
            `;

            items.forEach(item => {
                html += `
                    <div class="pantry-item">
                        <span class="pantry-item-name">${item.name}</span>
                        <span class="pantry-item-quantity">${item.quantity} ${item.unit}</span>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    getCategoryIcon(category) {
        const icons = {
            'produce': 'leaf',
            'meat': 'drumstick-bite',
            'dairy': 'milk',
            'pantry': 'box',
            'frozen': 'snowflake',
            'bakery': 'bread-slice',
            'other': 'question'
        };
        return icons[category] || 'question';
    }

    formatCategoryName(category) {
        return category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ');
    }

    async loadRecipes() {
        try {
            const response = await this.makeAPIRequest('/recipes/search?q=popular&limit=12');
            
            if (response.recipes) {
                this.displayRecipes(response.recipes);
            }
        } catch (error) {
            console.error('Error loading recipes:', error);
        }
    }

    displayRecipes(recipes) {
        const container = document.getElementById('recipes-grid');
        
        let html = '';
        recipes.forEach(recipe => {
            html += `
                <div class="recipe-card" onclick="app.showRecipeDetails('${recipe.id}')">
                    <div class="recipe-image">
                        <i class="fas fa-utensils"></i>
                    </div>
                    <div class="recipe-content">
                        <h3 class="recipe-title">${recipe.name}</h3>
                        <div class="recipe-meta">
                            <span><i class="fas fa-clock"></i> ${recipe.cooking_time}min</span>
                            <span><i class="fas fa-signal"></i> ${recipe.difficulty}</span>
                            <span><i class="fas fa-users"></i> ${recipe.servings}</span>
                        </div>
                        <p class="recipe-description">${recipe.description}</p>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    async searchRecipes(query) {
        if (!query.trim()) {
            this.loadRecipes();
            return;
        }

        try {
            const response = await this.makeAPIRequest(`/recipes/search?q=${encodeURIComponent(query)}`);
            
            if (response.recipes) {
                this.displayRecipes(response.recipes);
            }
        } catch (error) {
            console.error('Error searching recipes:', error);
        }
    }

    showRecipeDetails(recipeId) {
        // Implementation for showing recipe details in modal
        this.showToast('Recipe details feature coming soon!', 'info');
    }

    showIngredientModal() {
        document.getElementById('modal-overlay').classList.add('active');
        // Hide all modals first
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        // Show only the ingredient modal
        document.getElementById('ingredient-modal').style.display = 'block';
    }

    async addIngredient(event) {
        event.preventDefault();
        
        // Get form values directly from inputs
        const ingredient = {
            name: document.getElementById('ingredient-name').value,
            quantity: parseFloat(document.getElementById('ingredient-quantity').value),
            unit: document.getElementById('ingredient-unit').value,
            category: document.getElementById('ingredient-category').value
        };

        try {
            await this.makeAPIRequest(`/user/preferences?user_id=${this.userId}`, {
                method: 'POST',
                body: JSON.stringify({
                    type: 'pantry',
                    action: 'add',
                    ingredients: [ingredient]
                })
            });

            this.showToast('Ingredient added successfully!', 'success');
            this.closeModals();
            this.loadPantry();
            event.target.reset();
        } catch (error) {
            console.error('Error adding ingredient:', error);
            this.showToast('Error adding ingredient', 'error');
        }
    }

    // Timer functionality
    startTimer() {
        const minutes = parseInt(document.getElementById('timer-minutes').value) || 0;
        const seconds = parseInt(document.getElementById('timer-seconds').value) || 0;
        
        if (minutes === 0 && seconds === 0) {
            this.showToast('Please set a timer duration', 'warning');
            return;
        }

        this.timer = minutes * 60 + seconds;
        this.timerInterval = setInterval(() => {
            this.timer--;
            this.updateTimerDisplay();
            
            if (this.timer <= 0) {
                this.timerFinished();
            }
        }, 1000);

        this.updateTimerControls();
    }

    pauseTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.updateTimerControls();
    }

    resetTimer() {
        this.pauseTimer();
        this.timer = null;
        document.getElementById('timer-time').textContent = '00:00';
        this.updateTimerControls();
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('timer-time').textContent = display;
    }

    updateTimerControls() {
        const startBtn = document.getElementById('timer-start');
        const pauseBtn = document.getElementById('timer-pause');
        const resetBtn = document.getElementById('timer-reset');

        if (this.timer === null) {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            resetBtn.disabled = true;
        } else if (this.timerInterval) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            resetBtn.disabled = false;
        } else {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            resetBtn.disabled = false;
        }
    }

    timerFinished() {
        this.pauseTimer();
        this.showToast('Timer finished!', 'success');
        
        // Play notification sound if supported
        if ('AudioContext' in window) {
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
        }
    }

    // Utility methods
    async makeAPIRequest(endpoint, options = {}) {
        const url = `${this.apiBase}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        return await response.json();
    }

    extractIngredientsFromMessage(message) {
        // Expanded ingredient extraction - includes guacamole and sandwich ingredients
        const commonIngredients = [
            'chicken', 'beef', 'pork', 'fish', 'rice', 'pasta', 'potato', 'onion', 
            'garlic', 'tomato', 'carrot', 'broccoli', 'spinach', 'cheese', 'milk', 'egg',
            'avocado', 'lime', 'lemon', 'bread', 'tortilla', 'salt', 'pepper', 'cilantro',
            'guacamole', 'guac', 'sandwich', 'lettuce', 'bacon', 'ham', 'turkey'
        ];

        const foundIngredients = [];
        const lowerMessage = message.toLowerCase();

        commonIngredients.forEach(ingredient => {
            if (lowerMessage.includes(ingredient)) {
                foundIngredients.push(ingredient);
            }
        });

        return foundIngredients;
    }

    async getPantryIngredients() {
        try {
            const response = await this.makeAPIRequest(`/user/preferences?user_id=${this.userId}&type=pantry`);
            const ingredients = response.ingredients?.map(ing => ing.name) || [];
            return ingredients;
        } catch (error) {
            console.error('Error getting pantry ingredients:', error);
            return [];
        }
    }

    async getDietaryRestrictions() {
        try {
            const response = await this.makeAPIRequest(`/user/preferences?user_id=${this.userId}`);
            return response.dietary_restrictions || [];
        } catch (error) {
            console.error('Error getting dietary restrictions:', error);
            return [];
        }
    }

    async getCookingPreferences() {
        try {
            const response = await this.makeAPIRequest(`/user/preferences?user_id=${this.userId}`);
            return {
                spice_level: response.spice_level || 'medium',
                cooking_time_preference: response.cooking_time_preference || 'medium',
                favorite_cuisines: response.favorite_cuisines || []
            };
        } catch (error) {
            console.error('Error getting cooking preferences:', error);
            return {
                spice_level: 'medium',
                cooking_time_preference: 'medium',
                favorite_cuisines: []
            };
        }
    }

    async loadUserPreferences() {
        try {
            const response = await this.makeAPIRequest(`/user/preferences?user_id=${this.userId}`);
            // Store preferences for use throughout the app
            this.userPreferences = response;
        } catch (error) {
            console.error('Error loading user preferences:', error);
            this.userPreferences = {};
        }
    }

    getCurrentSeason() {
        const month = new Date().getMonth();
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'fall';
        return 'winter';
    }

    storeRecipe(recipe) {
        // Store recipe in local storage for quick access
        const storedRecipes = JSON.parse(localStorage.getItem('recipes') || '[]');
        storedRecipes.unshift(recipe);
        
        // Keep only last 20 recipes
        if (storedRecipes.length > 20) {
            storedRecipes.splice(20);
        }
        
        localStorage.setItem('recipes', JSON.stringify(storedRecipes));
    }

    closeModals() {
        document.getElementById('modal-overlay').classList.remove('active');
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        overlay.querySelector('p').textContent = message;
        overlay.classList.add('active');
    }

    hideLoading() {
        document.getElementById('loading-overlay').classList.remove('active');
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'fas fa-check-circle' : 
                    type === 'error' ? 'fas fa-exclamation-circle' : 
                    type === 'warning' ? 'fas fa-exclamation-triangle' : 'fas fa-info-circle';

        toast.innerHTML = `
            <i class="toast-icon ${icon}"></i>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
        `;

        container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);

        // Remove after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => container.removeChild(toast), 300);
        }, 5000);
    }
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new SmartRecipeApp();
});
