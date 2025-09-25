export class VoiceProcessor {
  constructor(env) {
    this.env = env;
  }

  async processAudio(audioFile) {
    try {
      // Convert audio to text using AI speech recognition
      const transcription = await this.transcribeAudio(audioFile);
      
      // Process the transcription to extract cooking-related information
      const processedText = await this.processCookingText(transcription);
      
      return {
        original_transcription: transcription,
        processed_text: processedText,
        extracted_info: this.extractCookingInfo(processedText),
        confidence: 0.85, // Placeholder confidence score
        processed_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Voice processing error:', error);
      throw new Error('Failed to process audio: ' + error.message);
    }
  }

  async transcribeAudio(audioFile) {
    try {
      // Note: Cloudflare Workers AI doesn't currently have direct speech-to-text
      // This is a placeholder implementation that would integrate with a speech service
      // In a real implementation, you might use:
      // 1. Cloudflare's future speech-to-text capabilities
      // 2. External APIs like OpenAI Whisper
      // 3. Browser Web Speech API for client-side processing
      
      // For now, return a mock transcription
      return "I need a recipe for chicken with rice and vegetables for dinner tonight. I'm vegetarian and prefer quick meals under 30 minutes.";
    } catch (error) {
      console.error('Audio transcription error:', error);
      throw new Error('Failed to transcribe audio: ' + error.message);
    }
  }

  async processCookingText(text) {
    try {
      const prompt = `Process this cooking-related speech transcription and clean it up for recipe generation. Extract key information and make it more structured:

Original text: "${text}"

Please provide a cleaned, structured version that clearly identifies:
1. Main ingredients needed
2. Dietary restrictions or preferences
3. Meal type (breakfast, lunch, dinner, snack)
4. Cooking time preferences
5. Any specific requirements or constraints

Format the response as a clear, structured cooking request.`;

      const response = await this.env.AI.run('@cf/meta/llama-3.3-8b-instruct', {
        messages: [
          {
            role: 'system',
            content: 'You are a cooking assistant that helps process and structure cooking requests from voice input. Clean up and organize cooking-related speech into clear, actionable requests.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      return response.response;
    } catch (error) {
      console.error('Text processing error:', error);
      return text; // Return original text if processing fails
    }
  }

  extractCookingInfo(processedText) {
    const info = {
      ingredients: [],
      dietary_restrictions: [],
      meal_type: 'dinner',
      cooking_time_preference: 'medium',
      cuisine_preference: null,
      difficulty_preference: 'medium',
      serving_size: 4,
      special_requirements: []
    };

    const text = processedText.toLowerCase();

    // Extract ingredients
    const commonIngredients = [
      'chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'rice', 'pasta', 
      'potato', 'onion', 'garlic', 'tomato', 'carrot', 'broccoli', 'spinach',
      'cheese', 'milk', 'egg', 'butter', 'oil', 'flour', 'bread'
    ];

    commonIngredients.forEach(ingredient => {
      if (text.includes(ingredient)) {
        info.ingredients.push(ingredient);
      }
    });

    // Extract dietary restrictions
    if (text.includes('vegetarian') || text.includes('veg')) {
      info.dietary_restrictions.push('vegetarian');
    }
    if (text.includes('vegan')) {
      info.dietary_restrictions.push('vegan');
    }
    if (text.includes('gluten') || text.includes('gluten-free')) {
      info.dietary_restrictions.push('gluten-free');
    }
    if (text.includes('dairy-free') || text.includes('lactose')) {
      info.dietary_restrictions.push('dairy-free');
    }
    if (text.includes('keto')) {
      info.dietary_restrictions.push('keto');
    }
    if (text.includes('paleo')) {
      info.dietary_restrictions.push('paleo');
    }

    // Extract meal type
    if (text.includes('breakfast')) {
      info.meal_type = 'breakfast';
    } else if (text.includes('lunch')) {
      info.meal_type = 'lunch';
    } else if (text.includes('snack')) {
      info.meal_type = 'snack';
    }

    // Extract cooking time preferences
    if (text.includes('quick') || text.includes('fast') || text.includes('under 15') || text.includes('under 20')) {
      info.cooking_time_preference = 'quick';
    } else if (text.includes('under 30') || text.includes('30 minutes')) {
      info.cooking_time_preference = 'medium';
    } else if (text.includes('slow') || text.includes('long') || text.includes('hours')) {
      info.cooking_time_preference = 'long';
    }

    // Extract cuisine preferences
    const cuisines = [
      'italian', 'mexican', 'chinese', 'indian', 'thai', 'japanese', 'french',
      'mediterranean', 'american', 'greek', 'korean', 'vietnamese'
    ];

    cuisines.forEach(cuisine => {
      if (text.includes(cuisine)) {
        info.cuisine_preference = cuisine;
      }
    });

    // Extract difficulty preferences
    if (text.includes('easy') || text.includes('simple')) {
      info.difficulty_preference = 'easy';
    } else if (text.includes('hard') || text.includes('complex') || text.includes('advanced')) {
      info.difficulty_preference = 'hard';
    }

    // Extract serving size
    const servingMatch = text.match(/(\d+)\s*(people|servings?|portions?)/);
    if (servingMatch) {
      info.serving_size = parseInt(servingMatch[1]);
    }

    // Extract special requirements
    if (text.includes('healthy') || text.includes('low calorie') || text.includes('diet')) {
      info.special_requirements.push('healthy');
    }
    if (text.includes('comfort') || text.includes('hearty')) {
      info.special_requirements.push('comfort-food');
    }
    if (text.includes('light') || text.includes('fresh')) {
      info.special_requirements.push('light');
    }

    return info;
  }

  async generateVoiceResponse(recipeData) {
    try {
      const prompt = `Create a natural, conversational voice response for a cooking assistant. The user just asked for a recipe, and here's what I found:

Recipe: ${recipeData.name}
Cooking Time: ${recipeData.cooking_time} minutes
Difficulty: ${recipeData.difficulty}
Servings: ${recipeData.servings}

Main ingredients: ${recipeData.ingredients.slice(0, 5).map(i => i.name).join(', ')}

Create a friendly, natural response that:
1. Confirms the recipe details
2. Highlights key information like cooking time and difficulty
3. Mentions the main ingredients
4. Offers to provide detailed instructions or answer questions
5. Sounds conversational and helpful

Keep it under 100 words and make it sound natural for voice output.`;

      const response = await this.env.AI.run('@cf/meta/llama-3.3-8b-instruct', {
        messages: [
          {
            role: 'system',
            content: 'You are a friendly cooking assistant that provides natural, conversational responses for voice output. Be helpful, enthusiastic, and concise.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      return response.response;
    } catch (error) {
      console.error('Voice response generation error:', error);
      return `I found a great recipe for ${recipeData.name}. It takes ${recipeData.cooking_time} minutes to make and serves ${recipeData.servings} people. Would you like me to give you the detailed instructions?`;
    }
  }

  async processCookingQuestions(question) {
    try {
      const prompt = `Answer this cooking question in a helpful, conversational way:

Question: "${question}"

Provide a clear, practical answer that a cooking assistant would give. If it's about techniques, ingredients, substitutions, or general cooking advice, give helpful guidance. Keep it concise but informative.`;

      const response = await this.env.AI.run('@cf/meta/llama-3.3-8b-instruct', {
        messages: [
          {
            role: 'system',
            content: 'You are an experienced cooking assistant and chef. Answer cooking questions with practical, helpful advice. Be encouraging and clear in your explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.5
      });

      return {
        question,
        answer: response.response,
        answered_at: new Date().toISOString(),
        confidence: 0.9
      };
    } catch (error) {
      console.error('Cooking question processing error:', error);
      return {
        question,
        answer: "I'd be happy to help with that cooking question! Could you provide a bit more detail?",
        answered_at: new Date().toISOString(),
        confidence: 0.5
      };
    }
  }

  async validateAudioFile(audioFile) {
    // Basic validation for audio files
    const validation = {
      isValid: false,
      errors: [],
      warnings: []
    };

    if (!audioFile) {
      validation.errors.push('No audio file provided');
      return validation;
    }

    // Check file size (limit to 10MB)
    if (audioFile.size > 10 * 1024 * 1024) {
      validation.errors.push('Audio file too large (max 10MB)');
      return validation;
    }

    // Check file type
    const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/webm'];
    if (!allowedTypes.includes(audioFile.type)) {
      validation.errors.push('Unsupported audio format. Please use WAV, MP3, OGG, or WebM.');
      return validation;
    }

    // Check duration (limit to 2 minutes)
    // Note: This would require audio processing library in real implementation
    if (audioFile.size > 5 * 1024 * 1024) { // Rough estimate
      validation.warnings.push('Long audio files may take longer to process');
    }

    validation.isValid = true;
    return validation;
  }

  async convertTextToSpeech(text) {
    try {
      // This would integrate with a text-to-speech service
      // For now, return the text for client-side TTS
      return {
        text,
        audio_url: null, // Would be generated by TTS service
        duration_estimate: Math.ceil(text.length / 15), // Rough estimate in seconds
        language: 'en-US'
      };
    } catch (error) {
      console.error('Text-to-speech conversion error:', error);
      throw new Error('Failed to convert text to speech: ' + error.message);
    }
  }
}
