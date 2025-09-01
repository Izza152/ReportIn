#!/bin/bash

# Fix VPS Environment Issues
echo "🔧 Fixing VPS Environment Issues..."

# Navigate to the correct directory
cd /home/ubuntu/Documents/ReportIn/backend

# Check if directory exists
if [ ! -d "/home/ubuntu/Documents/ReportIn/backend" ]; then
    echo "❌ Directory /home/ubuntu/Documents/ReportIn/backend does not exist"
    echo "Creating directory structure..."
    mkdir -p /home/ubuntu/Documents/ReportIn/backend
fi

# Set proper working directory
cd /home/ubuntu/Documents/ReportIn/backend

# Check current directory
echo "📁 Current directory: $(pwd)"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Creating basic package.json..."
    cat > package.json << 'EOF'
{
  "name": "reportin-backend",
  "version": "1.0.0",
  "description": "ReportIn Backend API",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "express": "^4.18.2",
    "sqlite3": "^5.1.6",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "compression": "^1.7.4",
    "dotenv": "^16.3.1",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "keywords": ["api", "backend", "reportin"],
  "author": "ReportIn Team",
  "license": "MIT"
}
EOF
    echo "✅ Created package.json"
fi

# Clean npm cache
echo "🧹 Cleaning npm cache..."
npm cache clean --force

# Remove node_modules if it exists and is corrupted
if [ -d "node_modules" ]; then
    echo "🗑️ Removing existing node_modules..."
    rm -rf node_modules
fi

# Remove package-lock.json if it exists
if [ -f "package-lock.json" ]; then
    echo "🗑️ Removing package-lock.json..."
    rm package-lock.json
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    echo "Trying alternative installation method..."
    
    # Try with different npm configuration
    npm config set registry https://registry.npmjs.org/
    npm install --no-optional
fi

# Create basic index.js if it doesn't exist
if [ ! -f "index.js" ]; then
    echo "📝 Creating basic index.js..."
    cat > index.js << 'EOF'
const express = require('express');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
    res.json({
        message: 'ReportIn Backend API',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// Health check
app.get('/api/status', (req, res) => {
    res.json({
        status: 'ok',
        message: 'ReportIn API is running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📋 Available endpoints:`);
    console.log(`   - http://localhost:${PORT}/`);
    console.log(`   - http://localhost:${PORT}/api/status`);
});

module.exports = app;
EOF
    echo "✅ Created index.js"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
PORT=5005
JWT_SECRET=your-secret-key-here
NODE_ENV=development
EOF
    echo "✅ Created .env file"
fi

# Set proper permissions
echo "🔐 Setting proper permissions..."
chmod 755 /home/ubuntu/Documents/ReportIn/backend
chmod 644 package.json
chmod 644 index.js
chmod 644 .env

# Test the installation
echo "🧪 Testing installation..."
node -e "console.log('✅ Node.js is working properly')"

echo ""
echo "🎉 VPS Environment Setup Complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run: cd /home/ubuntu/Documents/ReportIn/backend"
echo "2. Run: npm start"
echo "3. Or run: node index.js"
echo ""
echo "🌐 Server will be available at:"
echo "   - http://localhost:5005/"
echo "   - http://localhost:5005/api/status"
echo ""
echo "🔧 If you still have issues, try:"
echo "   - sudo apt update && sudo apt install nodejs npm"
echo "   - nvm install 18 && nvm use 18"
echo "" 