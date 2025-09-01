const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'db.sqlite');

console.log('🔧 Adding phone column to users table...');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ SQLite connection error:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Connected to SQLite database');
  
  // Check if phone column exists
  db.get("PRAGMA table_info(users)", (err, rows) => {
    if (err) {
      console.error('❌ Error checking table structure:', err.message);
      db.close();
      process.exit(1);
    }
    
    // Get all column info
    db.all("PRAGMA table_info(users)", (err, columns) => {
      if (err) {
        console.error('❌ Error getting table info:', err.message);
        db.close();
        process.exit(1);
      }
      
      const hasPhoneColumn = columns.some(col => col.name === 'phone');
      
      if (hasPhoneColumn) {
        console.log('✅ Phone column already exists');
        db.close();
        process.exit(0);
      }
      
      // Add phone column
      console.log('➕ Adding phone column...');
      db.run('ALTER TABLE users ADD COLUMN phone TEXT DEFAULT NULL', (err) => {
        if (err) {
          console.error('❌ Error adding phone column:', err.message);
          db.close();
          process.exit(1);
        }
        
        console.log('✅ Phone column added successfully');
        
        // Verify the column was added
        db.all("PRAGMA table_info(users)", (err, columns) => {
          if (err) {
            console.error('❌ Error verifying table structure:', err.message);
            db.close();
            process.exit(1);
          }
          
          const phoneColumn = columns.find(col => col.name === 'phone');
          if (phoneColumn) {
            console.log('✅ Phone column verified:', phoneColumn);
          } else {
            console.log('❌ Phone column not found after adding');
          }
          
          db.close();
          console.log('🎉 Migration completed successfully');
        });
      });
    });
  });
}); 