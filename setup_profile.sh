#!/bin/bash

echo "🔧 Setting up Profile Feature..."

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the backend directory"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🗄️ Fixing database structure..."
npm run fix-users-table

echo "🔍 Checking database structure..."
npm run check-db

echo "🚀 Starting server..."
echo "✅ Profile feature setup completed!"
echo ""
echo "📱 To test the profile feature:"
echo "1. Open the Flutter app"
echo "2. Go to Profile page"
echo "3. Try editing your profile"
echo ""
echo "🔧 Server will be available at:"
echo "- Local: http://localhost:5005"
echo "- Cloudflare: https://denver-collectible-undefined-southampton.trycloudflare.com"
echo ""
echo "📋 API Endpoints:"
echo "- GET /api/profile - Get user profile"
echo "- PUT /api/profile - Update user profile"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm start 