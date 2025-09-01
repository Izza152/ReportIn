#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Memperbaiki Error SQLite3 di VPS...\n');

// Function untuk mengecek apakah file SQLite3 valid
const checkSqliteFile = () => {
  const sqlitePath = path.join(__dirname, 'node_modules/sqlite3/build/Release/node_sqlite3.node');
  
  if (!fs.existsSync(sqlitePath)) {
    console.log('❌ File node_sqlite3.node tidak ditemukan');
    return false;
  }

  try {
    const stats = fs.statSync(sqlitePath);
    console.log(`✅ File node_sqlite3.node ditemukan (${stats.size} bytes)`);
    return true;
  } catch (error) {
    console.log('❌ Error membaca file node_sqlite3.node:', error.message);
    return false;
  }
};

// Function untuk backup database
const backupDatabase = () => {
  const dbPath = path.join(__dirname, 'db.sqlite');
  const backupPath = path.join(__dirname, 'db.sqlite.backup.' + Date.now());
  
  if (fs.existsSync(dbPath)) {
    try {
      fs.copyFileSync(dbPath, backupPath);
      console.log(`✅ Database di-backup ke: ${backupPath}`);
      return true;
    } catch (error) {
      console.log('❌ Error backup database:', error.message);
      return false;
    }
  } else {
    console.log('⚠️ File database tidak ditemukan, skip backup');
    return true;
  }
};

// Function untuk reinstall sqlite3
const reinstallSqlite3 = () => {
  console.log('\n📦 Reinstalling sqlite3...');
  
  try {
    // Hapus node_modules dan package-lock.json
    console.log('🗑️ Menghapus node_modules dan package-lock.json...');
    if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
      execSync('rm -rf node_modules', { cwd: __dirname, stdio: 'inherit' });
    }
    if (fs.existsSync(path.join(__dirname, 'package-lock.json'))) {
      execSync('rm -f package-lock.json', { cwd: __dirname, stdio: 'inherit' });
    }
    
    // Install ulang dengan build dari source
    console.log('🔨 Installing sqlite3 dari source...');
    execSync('npm install sqlite3 --build-from-source', { cwd: __dirname, stdio: 'inherit' });
    
    // Install dependencies lainnya
    console.log('📦 Installing dependencies lainnya...');
    execSync('npm install', { cwd: __dirname, stdio: 'inherit' });
    
    console.log('✅ Reinstall berhasil!');
    return true;
  } catch (error) {
    console.log('❌ Error saat reinstall:', error.message);
    return false;
  }
};

// Function untuk membuat database connection yang lebih robust
const createRobustDbConnection = () => {
  console.log('\n🔧 Membuat koneksi database yang robust...');
  
  const dbConnectionCode = `
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'db.sqlite');

// Enhanced database connection with better error handling
let db = null;

const createDatabaseConnection = () => {
  return new Promise((resolve, reject) => {
    try {
      // Check if sqlite3 module is properly loaded
      if (!sqlite3 || !sqlite3.Database) {
        throw new Error('SQLite3 module not properly loaded');
      }

      db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('❌ SQLite connection error:', err.message);
          console.error('🔧 Troubleshooting:');
          console.error('   - Pastikan SQLite3 terinstall: sudo apt install sqlite3 libsqlite3-dev');
          console.error('   - Coba reinstall: npm install sqlite3 --build-from-source');
          console.error('   - Cek permission file database');
          reject(err);
        } else {
          console.log('✅ Connected to SQLite database.');
          console.log('📁 Database path:', dbPath);

          // Enable optimizations
          db.run('PRAGMA journal_mode = WAL');
          db.run('PRAGMA synchronous = NORMAL');
          db.run('PRAGMA cache_size = 10000');
          db.run('PRAGMA temp_store = MEMORY');
          db.run('PRAGMA mmap_size = 268435456');
          db.run('PRAGMA optimize');
          db.run('PRAGMA foreign_keys = ON');

          console.log('✅ Database optimizations applied');
          resolve(db);
        }
      });

      // Handle database errors
      db.on('error', (err) => {
        console.error('❌ Database error:', err.message);
      });

    } catch (error) {
      console.error('❌ Error creating database connection:', error.message);
      reject(error);
    }
  });
};

// Function to get database instance
const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call createDatabaseConnection() first.');
  }
  return db;
};

// Function to close database
const closeDatabase = () => {
  return new Promise((resolve) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('❌ Error closing database:', err.message);
        } else {
          console.log('✅ Database connection closed');
        }
        db = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
};

module.exports = {
  createDatabaseConnection,
  getDatabase,
  closeDatabase,
  dbPath
};
`;

  const dbFile = path.join(__dirname, 'db_robust.js');
  fs.writeFileSync(dbFile, dbConnectionCode);
  console.log(`✅ File database connection robust dibuat: ${dbFile}`);
  
  return dbFile;
};

// Function untuk update routes.js menggunakan database yang robust
const updateRoutesToUseRobustDb = () => {
  console.log('\n🔧 Updating routes.js untuk menggunakan database robust...');
  
  const routesPath = path.join(__dirname, 'routes.js');
  if (!fs.existsSync(routesPath)) {
    console.log('❌ File routes.js tidak ditemukan');
    return false;
  }

  let routesContent = fs.readFileSync(routesPath, 'utf8');
  
  // Replace database import
  if (routesContent.includes("const db = require('./db');")) {
    routesContent = routesContent.replace(
      "const db = require('./db');",
      "const { createDatabaseConnection, getDatabase } = require('./db_robust');"
    );
    
    // Add database initialization
    const initCode = `
// Initialize database connection
let db = null;

const initDatabase = async () => {
  try {
    db = await createDatabaseConnection();
    console.log('✅ Database initialized in routes');
  } catch (error) {
    console.error('❌ Failed to initialize database in routes:', error.message);
  }
};

// Initialize database when module loads
initDatabase();
`;
    
    routesContent = routesContent.replace(
      "const { createDatabaseConnection, getDatabase } = require('./db_robust');",
      `const { createDatabaseConnection, getDatabase } = require('./db_robust');${initCode}`
    );
    
    // Replace db usage with getDatabase()
    routesContent = routesContent.replace(/db\./g, 'getDatabase().');
    
    fs.writeFileSync(routesPath, routesContent);
    console.log('✅ Routes.js updated untuk menggunakan database robust');
    return true;
  } else {
    console.log('⚠️ Tidak menemukan pattern database import di routes.js');
    return false;
  }
};

// Main execution
const main = async () => {
  console.log('🚀 Memulai perbaikan error SQLite3...\n');
  
  // Step 1: Backup database
  backupDatabase();
  
  // Step 2: Check current sqlite3 file
  const sqliteValid = checkSqliteFile();
  
  if (!sqliteValid) {
    console.log('\n🔧 SQLite3 file tidak valid, melakukan reinstall...');
    const reinstallSuccess = reinstallSqlite3();
    
    if (!reinstallSuccess) {
      console.log('\n❌ Reinstall gagal. Mencoba alternatif...');
    }
  }
  
  // Step 3: Create robust database connection
  createRobustDbConnection();
  
  // Step 4: Update routes
  updateRoutesToUseRobustDb();
  
  console.log('\n✅ Perbaikan selesai!');
  console.log('\n📋 Langkah selanjutnya:');
  console.log('1. Restart server: pm2 restart all atau node index.js');
  console.log('2. Test koneksi database');
  console.log('3. Jika masih error, coba: npm install sqlite3 --build-from-source');
};

// Run main function
main().catch(console.error); 