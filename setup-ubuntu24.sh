#!/bin/bash

echo "🚀 Setting up ReportIn Backend for Ubuntu 24..."

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

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️ Creating .env file..."
    cat > .env << EOF
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

echo "✅ Setup completed successfully!"
echo ""
echo "🎯 Next steps:"
echo "1. Edit .env file: nano .env"
echo "2. Start server: npm start"
echo "3. Test API: curl http://localhost:5005/api"
echo ""
echo "📚 For more info, see README.md" 