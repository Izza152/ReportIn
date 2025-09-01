#!/bin/bash

echo "🔧 Mengganti db.js dengan versi yang diperbaiki..."
echo "=================================================="

# Backup db.js yang lama
if [ -f "db.js" ]; then
    cp db.js "db.js.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ db.js lama di-backup"
else
    echo "⚠️ File db.js tidak ditemukan"
fi

# Copy db_fixed.js ke db.js
if [ -f "db_fixed.js" ]; then
    cp db_fixed.js db.js
    echo "✅ db.js diganti dengan versi yang diperbaiki"
else
    echo "❌ File db_fixed.js tidak ditemukan"
    exit 1
fi

# Test database connection
echo "🧪 Testing database connection dengan db.js baru..."
node -e "
const db = require('./db.js');

db.initializeDatabase()
  .then(() => {
    console.log('✅ Database connection test berhasil!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database connection test gagal:', error.message);
    process.exit(1);
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
    echo "🔧 Coba solusi manual:"
    echo "1. sudo apt update && sudo apt install sqlite3 libsqlite3-dev"
    echo "2. npm install sqlite3 --build-from-source"
    echo "3. npm install"
    echo "4. node db.js"
fi 