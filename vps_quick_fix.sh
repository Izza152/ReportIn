#!/bin/bash

echo "🚀 Quick Fix for VPS Environment Issues"

# Method 1: Fix current directory issue
echo "📁 Method 1: Fixing directory issues..."
cd /home/ubuntu/Documents/ReportIn/backend 2>/dev/null || {
    echo "❌ Directory not found, creating it..."
    mkdir -p /home/ubuntu/Documents/ReportIn/backend
    cd /home/ubuntu/Documents/ReportIn/backend
}

echo "✅ Current directory: $(pwd)"

# Method 2: Clean npm and reinstall
echo "🧹 Method 2: Cleaning npm cache..."
npm cache clean --force

# Method 3: Remove corrupted files
echo "🗑️ Method 3: Removing corrupted files..."
rm -rf node_modules package-lock.json 2>/dev/null

# Method 4: Fresh npm install
echo "📦 Method 4: Fresh npm install..."
npm install --no-optional --legacy-peer-deps

# Method 5: Alternative if npm fails
if [ $? -ne 0 ]; then
    echo "⚠️ npm install failed, trying alternative method..."
    
    # Try with yarn if available
    if command -v yarn &> /dev/null; then
        echo "📦 Using yarn instead..."
        yarn install
    else
        # Try with different npm settings
        echo "📦 Trying npm with different settings..."
        npm config set registry https://registry.npmjs.org/
        npm install --no-optional --legacy-peer-deps --force
    fi
fi

echo "✅ Quick fix completed!"
echo "🚀 Try running: node index.js" 