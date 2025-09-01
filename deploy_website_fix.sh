#!/bin/bash

# Script untuk deploy perbaikan website ReportIn
# Memperbaiki routing agar homepage dihandle terlebih dahulu

echo "🚀 Deploying ReportIn Website Fix..."
echo "📅 $(date)"
echo ""

# Konfigurasi
VPS_HOST="reportin.site"
VPS_USER="root"
BACKUP_DIR="/root/backups"
APP_DIR="/root/reportin-backend"
LOG_FILE="/root/deploy_website_fix.log"

# Fungsi untuk logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Fungsi untuk backup
backup_current() {
    log "📦 Creating backup of current version..."
    ssh "$VPS_USER@$VPS_HOST" "mkdir -p $BACKUP_DIR/$(date +%Y%m%d_%H%M%S)" || {
        log "❌ Failed to create backup directory"
        return 1
    }
    
    ssh "$VPS_USER@$VPS_HOST" "cp -r $APP_DIR $BACKUP_DIR/$(date +%Y%m%d_%H%M%S)/" || {
        log "❌ Failed to backup current version"
        return 1
    }
    
    log "✅ Backup created successfully"
}

# Fungsi untuk stop server
stop_server() {
    log "🛑 Stopping ReportIn server..."
    ssh "$VPS_USER@$VPS_HOST" "cd $APP_DIR && pm2 stop reportin-backend || true" || {
        log "⚠️ Server might not be running with pm2"
    }
    
    # Kill any process using port 5005
    ssh "$VPS_USER@$VPS_HOST" "pkill -f 'node.*index.js' || true" || {
        log "⚠️ No node processes found"
    }
    
    log "✅ Server stopped"
}

# Fungsi untuk start server
start_server() {
    log "🚀 Starting ReportIn server..."
    ssh "$VPS_USER@$VPS_HOST" "cd $APP_DIR && pm2 start index.js --name reportin-backend" || {
        log "❌ Failed to start server with pm2"
        return 1
    }
    
    log "✅ Server started successfully"
}

# Fungsi untuk test server
test_server() {
    log "🧪 Testing server..."
    
    # Test homepage
    log "Testing homepage..."
    HOMEPAGE_RESPONSE=$(ssh "$VPS_USER@$VPS_HOST" "curl -s http://localhost:5005/ | head -5")
    if echo "$HOMEPAGE_RESPONSE" | grep -q "<!DOCTYPE html>"; then
        log "✅ Homepage is working correctly"
    else
        log "❌ Homepage test failed"
        return 1
    fi
    
    # Test API
    log "Testing API endpoint..."
    API_RESPONSE=$(ssh "$VPS_USER@$VPS_HOST" "curl -s http://localhost:5005/api")
    if echo "$API_RESPONSE" | grep -q "ReportIn API"; then
        log "✅ API endpoint is working correctly"
    else
        log "❌ API test failed"
        return 1
    fi
    
    log "✅ All tests passed"
}

# Fungsi untuk update code
update_code() {
    log "📝 Updating server code..."
    
    # Copy updated index.js to server
    scp backend/index.js "$VPS_USER@$VPS_HOST:$APP_DIR/" || {
        log "❌ Failed to copy index.js"
        return 1
    }
    
    log "✅ Code updated successfully"
}

# Main deployment process
main() {
    log "🎯 Starting ReportIn Website Fix Deployment"
    log "Target: $VPS_HOST"
    log "App Directory: $APP_DIR"
    
    # Step 1: Backup current version
    backup_current || {
        log "❌ Backup failed, aborting deployment"
        exit 1
    }
    
    # Step 2: Stop server
    stop_server || {
        log "❌ Failed to stop server"
        exit 1
    }
    
    # Step 3: Update code
    update_code || {
        log "❌ Failed to update code"
        exit 1
    }
    
    # Step 4: Start server
    start_server || {
        log "❌ Failed to start server"
        exit 1
    }
    
    # Step 5: Wait for server to be ready
    log "⏳ Waiting for server to be ready..."
    sleep 5
    
    # Step 6: Test server
    test_server || {
        log "❌ Server tests failed"
        log "🔄 Rolling back to previous version..."
        ssh "$VPS_USER@$VPS_HOST" "cd $APP_DIR && pm2 stop reportin-backend"
        ssh "$VPS_USER@$VPS_HOST" "cp -r $BACKUP_DIR/$(ls -t $BACKUP_DIR | head -1)/* $APP_DIR/"
        start_server
        exit 1
    }
    
    log "🎉 Deployment completed successfully!"
    log "🌐 Website: https://reportin.site"
    log "🔗 API: https://reportin.site/api"
    log "📱 Download: https://reportin.site/downloads/reportin-latest.apk"
}

# Run main function
main "$@" 