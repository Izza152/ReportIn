#!/bin/bash

echo "🚀 Setting up ReportIn Backend for Ubuntu 24 (Final Version)..."

# Ensure we're in the right directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📁 Working directory: $(pwd)"

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the backend directory."
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
sudo apt update

# Install system dependencies
echo "🔧 Installing system dependencies..."
sudo apt install -y nodejs npm sqlite3 libsqlite3-dev build-essential python3

# Check Node.js version
echo "📋 Checking Node.js version..."
node --version
npm --version

# Clean npm cache
echo "🧹 Cleaning npm cache..."
npm cache clean --force

# Remove old node_modules if exists
if [ -d "node_modules" ]; then
    echo "🗑️ Removing old node_modules..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    echo "🗑️ Removing old package-lock.json..."
    rm -f package-lock.json
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️ Creating .env file..."
    cat > .env << 'EOF'
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5005
NODE_ENV=development
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Initialize database
echo "🗄️ Initializing database..."
npm run init-db

# Set proper permissions
echo "🔐 Setting file permissions..."
chmod 755 .
chmod 644 *.js
chmod 644 *.json
chmod 644 *.md
chmod 644 *.sql

# Test server startup
echo "🧪 Testing server startup..."
timeout 5s node index.js &
SERVER_PID=$!

sleep 2

if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Server started successfully"
    kill $SERVER_PID
    wait $SERVER_PID 2>/dev/null
else
    echo "❌ Server failed to start"
    exit 1
fi

echo "✅ Setup completed successfully!"
echo ""
echo "🎯 Next steps:"
echo "1. Edit .env file: nano .env"
echo "2. Start server: npm start"
echo "3. Test API: curl http://localhost:5005/api"
echo ""
echo "📚 For more info, see README.md" 