#!/bin/bash

# Script untuk update server lokal ReportIn
# Usage: ./update_local_server.sh [--force] [--backup]

set -e

# Configuration
SERVER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SERVER_DIR/backups"
LOG_FILE="$SERVER_DIR/update.log"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        print_error "Jangan jalankan script ini sebagai root!"
        exit 1
    fi
}

# Create backup directory
create_backup_dir() {
    mkdir -p "$BACKUP_DIR"
    print_status "Backup directory: $BACKUP_DIR"
}

# Backup database
backup_database() {
    if [ -f "$SERVER_DIR/db.sqlite" ]; then
        local backup_file="$BACKUP_DIR/db_backup_$TIMESTAMP.sqlite"
        cp "$SERVER_DIR/db.sqlite" "$backup_file"
        print_status "Database backed up: $backup_file"
        log "Database backup created: $backup_file"
    else
        print_warning "Database file tidak ditemukan"
    fi
}

# Stop server if running
stop_server() {
    print_info "Menghentikan server..."
    
    # Find and kill Node.js processes
    local pids=$(pgrep -f "node.*index.js" || true)
    if [ -n "$pids" ]; then
        echo "$pids" | xargs kill -TERM
        sleep 2
        
        # Force kill if still running
        local remaining=$(pgrep -f "node.*index.js" || true)
        if [ -n "$remaining" ]; then
            echo "$remaining" | xargs kill -KILL
            print_warning "Server dihentikan secara paksa"
        else
            print_status "Server berhasil dihentikan"
        fi
    else
        print_info "Server tidak sedang berjalan"
    fi
}

# Update dependencies
update_dependencies() {
    print_info "Updating dependencies..."
    
    # Backup package.json
    if [ -f "$SERVER_DIR/package.json" ]; then
        cp "$SERVER_DIR/package.json" "$BACKUP_DIR/package.json.backup"
    fi
    
    # Update npm dependencies
    cd "$SERVER_DIR"
    npm install --production
    print_status "Dependencies updated"
    log "Dependencies updated successfully"
}

# Update from Git (if available)
update_from_git() {
    if [ -d "$SERVER_DIR/.git" ]; then
        print_info "Updating from Git repository..."
        
        # Stash any local changes
        git stash push -m "Auto stash before update $TIMESTAMP" || true
        
        # Pull latest changes
        git pull origin main || git pull origin master || true
        
        # Apply stashed changes if any
        git stash pop || true
        
        print_status "Git repository updated"
        log "Git repository updated successfully"
    else
        print_warning "Git repository tidak ditemukan"
    fi
}

# Run database migrations
run_migrations() {
    print_info "Running database migrations..."
    
    cd "$SERVER_DIR"
    
    # Run initialization script
    if [ -f "init_db.js" ]; then
        node init_db.js
        print_status "Database initialized"
        log "Database initialized successfully"
    fi
    
    # Run any additional migration scripts
    for script in add_*.js fix_*.js; do
        if [ -f "$script" ]; then
            print_info "Running migration: $script"
            node "$script"
            log "Migration completed: $script"
        fi
    done
}

# Start server
start_server() {
    print_info "Starting server..."
    
    cd "$SERVER_DIR"
    
    # Start server in background
    nohup node index.js > server.log 2>&1 &
    local server_pid=$!
    
    # Wait a moment for server to start
    sleep 3
    
    # Check if server is running
    if kill -0 "$server_pid" 2>/dev/null; then
        print_status "Server started successfully (PID: $server_pid)"
        log "Server started with PID: $server_pid"
        
        # Show server info
        echo ""
        print_info "Server Information:"
        echo "   - PID: $server_pid"
        echo "   - Log: $SERVER_DIR/server.log"
        echo "   - Port: 5005"
        echo "   - URLs:"
        echo "     * http://localhost:5005/"
        echo "     * http://localhost:5005/api"
        echo "     * http://localhost:5005/api/status"
    else
        print_error "Failed to start server"
        log "Server failed to start"
        exit 1
    fi
}

# Test server
test_server() {
    print_info "Testing server..."
    
    # Wait a bit more for server to fully start
    sleep 2
    
    # Test server status
    local response=$(curl -s http://localhost:5005/api/status || echo "ERROR")
    
    if [[ "$response" == *"status"* ]] || [[ "$response" == *"success"* ]]; then
        print_status "Server test successful"
        log "Server test successful"
    else
        print_warning "Server test failed, but server might still be starting"
        log "Server test failed: $response"
    fi
}

# Show server status
show_status() {
    echo ""
    print_info "Server Status:"
    
    # Check if server is running
    local pids=$(pgrep -f "node.*index.js" || echo "")
    if [ -n "$pids" ]; then
        print_status "Server is running (PIDs: $pids)"
        echo "   - Log file: $SERVER_DIR/server.log"
        echo "   - Available at: http://localhost:5005/"
    else
        print_warning "Server is not running"
    fi
    
    # Show recent logs
    if [ -f "$SERVER_DIR/server.log" ]; then
        echo ""
        print_info "Recent server logs:"
        tail -n 5 "$SERVER_DIR/server.log" 2>/dev/null || echo "No logs available"
    fi
}

# Main function
main() {
    echo ""
    print_info "🚀 ReportIn Local Server Update"
    echo "=================================="
    
    # Check arguments
    local force_update=false
    local backup_only=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force)
                force_update=true
                shift
                ;;
            --backup)
                backup_only=true
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Usage: $0 [--force] [--backup]"
                exit 1
                ;;
        esac
    done
    
    # Check if we're in the right directory
    if [ ! -f "$SERVER_DIR/package.json" ]; then
        print_error "Script harus dijalankan dari direktori backend!"
        exit 1
    fi
    
    # Create backup directory
    create_backup_dir
    
    # Backup database
    backup_database
    
    if [ "$backup_only" = true ]; then
        print_status "Backup completed. Exiting."
        exit 0
    fi
    
    # Stop server
    stop_server
    
    # Update from Git
    update_from_git
    
    # Update dependencies
    update_dependencies
    
    # Run migrations
    run_migrations
    
    # Start server
    start_server
    
    # Test server
    test_server
    
    # Show status
    show_status
    
    echo ""
    print_status "✅ Update server lokal selesai!"
    log "Server update completed successfully"
}

# Run main function
main "$@" 