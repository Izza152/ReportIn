#!/bin/bash

echo "🔧 Setting up Chat Feature..."

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the backend directory"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🗄️ Adding chat table to database..."
npm run add-chat-table

echo "🔍 Checking database structure..."
npm run check-db

echo "🚀 Starting server..."
echo "✅ Chat feature setup completed!"
echo ""
echo "📱 To test the chat feature:"
echo "1. Register multiple users"
echo "2. Login with first user"
echo "3. Add second user as friend"
echo "4. Login with second user"
echo "5. Accept friend request"
echo "6. Go back to first user"
echo "7. Open Friends page"
echo "8. Click 'Chat' on friend"
echo "9. Send messages"
echo ""
echo "🔧 Server will be available at:"
echo "- Local: http://localhost:5005"
echo "- Cloudflare: https://denver-collectible-undefined-southampton.trycloudflare.com"
echo ""
echo "📋 Chat API Endpoints:"
echo "- GET /api/chat/:friendId - Get chat messages"
echo "- POST /api/chat/:friendId - Send chat message"
echo "- GET /api/chat/unread/count - Get unread count"
echo ""
echo "💬 Chat Features:"
echo "- Real-time messaging"
echo "- Message bubbles"
echo "- Read status"
echo "- Timestamp display"
echo "- Avatar support"
echo "- Auto-scroll to latest"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm start 