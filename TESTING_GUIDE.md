# Testing Guide - Smart Recipe & Meal Planning Agent

This guide provides comprehensive testing instructions to validate all features of the Smart Recipe Agent application.

## 🚀 Quick Setup for Testing

### 1. Start the Application
```bash
# Start both servers
./start-local.sh

# Verify servers are running
curl http://localhost:3002/health
curl http://localhost:3000
```

### 2. Open Browser
Navigate to http://localhost:3000

## 📋 Feature Testing Checklist

### ✅ Core Functionality Tests

#### 1. Pantry Management
**Test**: Add ingredients to pantry
- [ ] Click "Add Ingredients" button
- [ ] Fill out ingredient form:
  - Name: "Avocado"
  - Quantity: "2"
  - Unit: "pieces"
  - Category: "Produce"
- [ ] Click "Add Ingredient"
- [ ] Verify success toast appears
- [ ] Check pantry displays the ingredient
- [ ] Reload page and verify persistence

**Test**: Multiple ingredients
- [ ] Add: Bread (4 slices, Bakery)
- [ ] Add: Lime (1 piece, Produce)
- [ ] Add: Salt (0.5 teaspoon, Pantry)
- [ ] Verify all ingredients appear in pantry

#### 2. Recipe Generation
**Test**: Basic recipe request
- [ ] Go to Chat section
- [ ] Type: "Generate a recipe for guacamole sandwich"
- [ ] Verify recipe appears with:
  - Recipe name and description
  - Cooking time and difficulty
  - Main ingredients list
  - Basic instructions
  - "Would you like full details?" prompt

**Test**: Interactive recipe details
- [ ] Type "yes" in response to full details prompt
- [ ] Verify complete recipe shows:
  - All ingredients with quantities
  - Complete step-by-step instructions
  - Nutrition information
  - Pro tips
  - Dietary information

**Test**: Pantry-based recipe
- [ ] Type: "What can I make with my pantry ingredients?"
- [ ] Verify recipe uses actual pantry ingredients
- [ ] Check ingredient mapping is correct

#### 3. Chat Interface
**Test**: Natural language processing
- [ ] Try various phrasings:
  - "I want a chicken recipe"
  - "Make me something with rice"
  - "What's a healthy meal I can cook?"
- [ ] Verify appropriate responses

**Test**: Follow-up conversations
- [ ] Ask for recipe
- [ ] Type "yes" for full details
- [ ] Ask "Can you make it vegetarian?"
- [ ] Verify context is maintained

#### 4. Voice Input (Simulated)
**Test**: Voice button functionality
- [ ] Click microphone icon
- [ ] Verify "Listening..." indicator appears
- [ ] Click stop button
- [ ] Verify simulated voice input works

### ✅ Advanced Feature Tests

#### 5. Meal Planning
**Test**: Create meal plan
- [ ] Go to Meal Plan section
- [ ] Click "Create Weekly Plan"
- [ ] Verify meal plan generation
- [ ] Check variety of meals

#### 6. Nutrition Analysis
**Test**: Nutrition request
- [ ] In chat, type: "Analyze nutrition of my pantry"
- [ ] Verify nutrition breakdown appears
- [ ] Check calorie and macro calculations

#### 7. Leftover Optimization
**Test**: Leftover recipes
- [ ] Type: "What can I make with my leftovers?"
- [ ] Verify creative leftover recipes
- [ ] Check ingredient utilization

#### 8. Grocery List Generation
**Test**: Shopping list creation
- [ ] Go to Meal Plan section
- [ ] Create meal plan
- [ ] Click "Generate Grocery List"
- [ ] Verify organized shopping list

#### 9. Cooking Timers
**Test**: Timer functionality
- [ ] Go to Timers section
- [ ] Click "Start Timer"
- [ ] Set timer for 5 minutes
- [ ] Verify countdown works
- [ ] Check timer completion notification

### ✅ UI/UX Tests

#### 10. Responsive Design
**Test**: Mobile responsiveness
- [ ] Resize browser window to mobile size
- [ ] Verify all sections work on mobile
- [ ] Check modal displays correctly
- [ ] Test touch interactions

#### 11. Navigation
**Test**: Section switching
- [ ] Click through all main sections
- [ ] Verify smooth transitions
- [ ] Check active section highlighting
- [ ] Test back/forward navigation

#### 12. Form Validation
**Test**: Ingredient form
- [ ] Try submitting empty form
- [ ] Verify validation messages
- [ ] Test with invalid data
- [ ] Check success handling

### ✅ Error Handling Tests

#### 13. API Error Handling
**Test**: Network issues
- [ ] Stop mock server
- [ ] Try to add ingredient
- [ ] Verify error message appears
- [ ] Restart server and retry

#### 14. Edge Cases
**Test**: Empty pantry
- [ ] Clear all pantry ingredients
- [ ] Request recipe
- [ ] Verify appropriate message
- [ ] Add ingredients and retry

## 🎯 Demo Scenarios

### Scenario 1: New User Onboarding
1. **Setup Pantry**
   - Add 5-7 common ingredients
   - Include variety (produce, protein, pantry staples)

2. **First Recipe Request**
   - Ask for simple recipe using pantry
   - Follow full recipe details
   - Verify all information is helpful

3. **Explore Features**
   - Try voice input
   - Create meal plan
   - Generate grocery list

### Scenario 2: Advanced User Workflow
1. **Complex Recipe Request**
   - Ask for specific cuisine type
   - Request dietary modifications
   - Use cooking timers

2. **Meal Planning Session**
   - Create weekly plan
   - Optimize for nutrition
   - Generate shopping list

3. **Leftover Management**
   - Add leftover ingredients
   - Request creative recipes
   - Plan next meals

### Scenario 3: Edge Case Testing
1. **Minimal Pantry**
   - Add only 2-3 ingredients
   - Request complex recipe
   - Verify helpful suggestions

2. **Dietary Restrictions**
   - Set specific dietary needs
   - Request recipes
   - Verify compliance

3. **Seasonal Cooking**
   - Request seasonal recipes
   - Check seasonal suggestions
   - Verify appropriate recommendations

## 🔍 Debugging Tips

### Console Debugging
1. Open browser Developer Tools (F12)
2. Check Console tab for errors
3. Look for debug logs (marked with "Debug log")
4. Verify API requests in Network tab

### Common Issues
- **Ingredients not showing**: Check pantry API response
- **Recipe not generating**: Verify ingredient mapping
- **Chat not responding**: Check conversation context
- **Modal issues**: Verify JavaScript event handlers

### Performance Testing
- **Load Time**: Verify fast initial load
- **Response Time**: Check recipe generation speed
- **Memory Usage**: Monitor for memory leaks
- **API Efficiency**: Verify minimal API calls

## 📊 Success Criteria

### Functional Requirements
- [ ] All core features work as expected
- [ ] No critical errors or crashes
- [ ] Data persists across sessions
- [ ] API responses are consistent

### User Experience
- [ ] Intuitive navigation
- [ ] Clear error messages
- [ ] Responsive design
- [ ] Fast performance

### Integration
- [ ] Frontend-backend communication works
- [ ] Mock API simulates real behavior
- [ ] Data flow is consistent
- [ ] Error handling is graceful

## 🎉 Completion Checklist

After running all tests:
- [ ] All features demonstrated successfully
- [ ] No critical bugs found
- [ ] User experience is smooth
- [ ] Performance is acceptable
- [ ] Documentation is accurate

---

**Happy Testing! 🧪✨**

For issues or questions, check the console logs and refer to the main README.md for troubleshooting steps.