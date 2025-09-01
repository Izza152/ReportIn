#!/bin/bash

echo "🔧 Setting up Friends Feature..."

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the backend directory"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🗄️ Adding friends tables to database..."
npm run add-friends-tables

echo "🔍 Checking database structure..."
npm run check-db

echo "🚀 Starting server..."
echo "✅ Friends feature setup completed!"
echo ""
echo "📱 To test the friends feature:"
echo "1. Register multiple users"
echo "2. Login with first user"
echo "3. Go to Friends page"
echo "4. Search for other users"
echo "5. Send friend requests"
echo "6. Login with second user"
echo "7. Accept friend requests"
echo ""
echo "🔧 Server will be available at:"
echo "- Local: http://localhost:5005"
echo "- Cloudflare: https://denver-collectible-undefined-southampton.trycloudflare.com"
echo ""
echo "📋 Friends API Endpoints:"
echo "- GET /api/users/search - Search users"
echo "- POST /api/friends/request - Send friend request"
echo "- GET /api/friends - Get friends list"
echo "- GET /api/friends/requests - Get friend requests"
echo "- PUT /api/friends/request/:id - Accept/reject request"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm start 