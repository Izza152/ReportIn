#!/bin/bash

echo "🚀 Quick Deploy ReportIn Website Fix"
echo "📅 $(date)"
echo ""

# Konfigurasi
VPS_HOST="reportin.site"
VPS_USER="root"
APP_DIR="/root/reportin-backend"

echo "📝 Uploading updated index.js..."
scp backend/index.js "$VPS_USER@$VPS_HOST:$APP_DIR/" || {
    echo "❌ Failed to upload index.js"
    exit 1
}

echo "🔄 Restarting server..."
ssh "$VPS_USER@$VPS_HOST" "cd $APP_DIR && pm2 restart reportin-backend" || {
    echo "❌ Failed to restart server"
    exit 1
}

echo "⏳ Waiting for server to be ready..."
sleep 3

echo "🧪 Testing server..."
HOMEPAGE_TEST=$(ssh "$VPS_USER@$VPS_HOST" "curl -s http://localhost:5005/ | head -3")
if echo "$HOMEPAGE_TEST" | grep -q "<!DOCTYPE html>"; then
    echo "✅ Homepage is working!"
else
    echo "❌ Homepage test failed"
    exit 1
fi

API_TEST=$(ssh "$VPS_USER@$VPS_HOST" "curl -s http://localhost:5005/api")
if echo "$API_TEST" | grep -q "ReportIn API"; then
    echo "✅ API is working!"
else
    echo "❌ API test failed"
    exit 1
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo "🌐 Website: https://reportin.site"
echo "🔗 API: https://reportin.site/api"
echo "📱 Download: https://reportin.site/downloads/reportin-latest.apk" 