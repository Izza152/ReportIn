#!/bin/bash

echo "🔧 Quick Fix untuk Error SQLite3 di VPS"
echo "========================================"

# Backup database
echo "📦 Backup database..."
if [ -f "db.sqlite" ]; then
    cp db.sqlite "db.sqlite.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Database di-backup"
else
    echo "⚠️ File database tidak ditemukan"
fi

# Hapus node_modules dan package-lock.json
echo "🗑️ Menghapus node_modules dan package-lock.json..."
rm -rf node_modules package-lock.json

# Install sqlite3 dari source
echo "🔨 Installing sqlite3 dari source..."
npm install sqlite3 --build-from-source

# Install semua dependencies
echo "📦 Installing semua dependencies..."
npm install

# Test database connection
echo "🧪 Testing database connection..."
node -e "
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'db.sqlite');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Database connection successful!');
    db.close();
    process.exit(0);
  }
});
"

if [ $? -eq 0 ]; then
    echo "✅ Database connection test berhasil!"
    echo ""
    echo "🚀 Sekarang bisa restart server:"
    echo "   pm2 restart all"
    echo "   atau"
    echo "   node index.js"
else
    echo "❌ Database connection test gagal!"
    echo ""
    echo "🔧 Coba solusi alternatif:"
    echo "1. sudo apt update && sudo apt install sqlite3 libsqlite3-dev"
    echo "2. npm install sqlite3 --build-from-source"
    echo "3. npm install"
fi 