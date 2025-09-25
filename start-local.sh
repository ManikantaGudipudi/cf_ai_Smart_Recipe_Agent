#!/bin/bash

# Smart Recipe Agent - Local Development Startup Script

echo "🍳 Starting Smart Recipe Agent Locally..."
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Install client dependencies if client/node_modules doesn't exist
if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing client dependencies..."
    cd client && npm install && cd ..
fi

echo ""
echo "🚀 Starting services..."
echo ""

# Start mock API server in background
echo "🔧 Starting Mock API Server on port 3001..."
node mock-server.js &
API_PID=$!

# Wait a moment for the API server to start
sleep 2

# Start frontend development server
echo "🎨 Starting Frontend Development Server on port 3000..."
cd client && npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Smart Recipe Agent is now running!"
echo ""
echo "📍 URLs:"
echo "   Frontend: http://localhost:3000"
echo "   API Server: http://localhost:3001"
echo "   Health Check: http://localhost:3001/health"
echo ""
echo "🧪 Test the workflow:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Try the chat interface - ask for recipes"
echo "   3. Test voice input (click microphone button)"
echo "   4. Generate a meal plan"
echo "   5. Add ingredients to pantry"
echo "   6. Use the cooking timer"
echo ""
echo "📋 Available API Endpoints:"
echo "   POST /api/recipes/generate"
echo "   GET  /api/recipes/search"
echo "   POST /api/meal-plan/create"
echo "   POST /api/nutrition/analyze"
echo "   POST /api/voice/process"
echo "   GET  /api/user/preferences"
echo "   POST /api/leftovers/optimize"
echo "   POST /api/grocery/list"
echo ""
echo "🛑 To stop the servers, press Ctrl+C"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $API_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait
