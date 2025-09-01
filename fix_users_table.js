const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'db.sqlite');

console.log('🔧 Fixing users table structure...');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ SQLite connection error:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Connected to SQLite database');
  
  // Check current table structure
  db.all("PRAGMA table_info(users)", (err, columns) => {
    if (err) {
      console.error('❌ Error getting table info:', err.message);
      db.close();
      process.exit(1);
    }
    
    console.log('📋 Current users table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.name}: ${col.type}`);
    });
    
    const hasNameColumn = columns.some(col => col.name === 'name');
    const hasPhoneColumn = columns.some(col => col.name === 'phone');
    const hasUpdatedAtColumn = columns.some(col => col.name === 'updated_at');
    
    console.log('\n🔍 Checking required columns:');
    console.log(`  - name column: ${hasNameColumn ? '✅' : '❌'}`);
    console.log(`  - phone column: ${hasPhoneColumn ? '✅' : '❌'}`);
    console.log(`  - updated_at column: ${hasUpdatedAtColumn ? '✅' : '❌'}`);
    
    // Add missing columns
    const promises = [];
    
    if (!hasNameColumn) {
      console.log('➕ Adding name column...');
      promises.push(new Promise((resolve, reject) => {
        db.run('ALTER TABLE users ADD COLUMN name TEXT DEFAULT NULL', (err) => {
          if (err) {
            console.error('❌ Error adding name column:', err.message);
            reject(err);
          } else {
            console.log('✅ Name column added successfully');
            resolve();
          }
        });
      }));
    }
    
    if (!hasPhoneColumn) {
      console.log('➕ Adding phone column...');
      promises.push(new Promise((resolve, reject) => {
        db.run('ALTER TABLE users ADD COLUMN phone TEXT DEFAULT NULL', (err) => {
          if (err) {
            console.error('❌ Error adding phone column:', err.message);
            reject(err);
          } else {
            console.log('✅ Phone column added successfully');
            resolve();
          }
        });
      }));
    }
    
    if (!hasUpdatedAtColumn) {
      console.log('➕ Adding updated_at column...');
      promises.push(new Promise((resolve, reject) => {
        db.run('ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP', (err) => {
          if (err) {
            console.error('❌ Error adding updated_at column:', err.message);
            reject(err);
          } else {
            console.log('✅ Updated_at column added successfully');
            resolve();
          }
        });
      }));
    }
    
    // Wait for all column additions to complete
    Promise.all(promises).then(() => {
      console.log('\n🔍 Verifying final table structure...');
      db.all("PRAGMA table_info(users)", (err, columns) => {
        if (err) {
          console.error('❌ Error verifying table structure:', err.message);
          db.close();
          process.exit(1);
        }
        
        console.log('📋 Final users table structure:');
        columns.forEach(col => {
          console.log(`  - ${col.name}: ${col.type}`);
        });
        
        // Check if all required columns exist
        const finalHasName = columns.some(col => col.name === 'name');
        const finalHasPhone = columns.some(col => col.name === 'phone');
        const finalHasUpdatedAt = columns.some(col => col.name === 'updated_at');
        
        if (finalHasName && finalHasPhone && finalHasUpdatedAt) {
          console.log('\n🎉 All required columns are present!');
          console.log('✅ Users table structure is now complete');
        } else {
          console.log('\n⚠️ Some columns are still missing:');
          console.log(`  - name: ${finalHasName ? '✅' : '❌'}`);
          console.log(`  - phone: ${finalHasPhone ? '✅' : '❌'}`);
          console.log(`  - updated_at: ${finalHasUpdatedAt ? '✅' : '❌'}`);
        }
        
        db.close();
        console.log('🏁 Migration completed');
      });
    }).catch((error) => {
      console.error('❌ Migration failed:', error);
      db.close();
      process.exit(1);
    });
  });
}); 