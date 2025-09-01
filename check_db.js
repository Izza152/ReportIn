const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'db.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking database...');
console.log('Database path:', dbPath);

// Check if database file exists
const fs = require('fs');
if (!fs.existsSync(dbPath)) {
  console.log('❌ Database file not found!');
  process.exit(1);
}

console.log('✅ Database file exists');

// Check users table
db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, rows) => {
  if (err) {
    console.log('❌ Error checking users table:', err.message);
    return;
  }
  
  if (rows.length === 0) {
    console.log('❌ Users table not found!');
    return;
  }
  
  console.log('✅ Users table exists');
  
  // Check existing users
  db.all("SELECT id, name, email, created_at FROM users", (err, rows) => {
    if (err) {
      console.log('❌ Error querying users:', err.message);
      return;
    }
    
    console.log(`📊 Found ${rows.length} users:`);
    rows.forEach(user => {
      console.log(`   - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Created: ${user.created_at}`);
    });
    
    // Add test user if none exists
    if (rows.length === 0) {
      console.log('➕ Adding test user...');
      const hashedPassword = bcrypt.hashSync('password123', 10);
      
      db.run(
        "INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, datetime('now'))",
        ['Test User', 'test@gmail.com', hashedPassword],
        function(err) {
          if (err) {
            console.log('❌ Error adding test user:', err.message);
            return;
          }
          
          console.log('✅ Test user added successfully!');
          console.log('   Email: test@gmail.com');
          console.log('   Password: password123');
          
          // Add another test user
          db.run(
            "INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, datetime('now'))",
            ['Darul Izza', 'darulizza80@gmail.com', hashedPassword],
            function(err) {
              if (err) {
                console.log('❌ Error adding second test user:', err.message);
                return;
              }
              
              console.log('✅ Second test user added successfully!');
              console.log('   Email: darulizza80@gmail.com');
              console.log('   Password: password123');
              
              db.close();
            }
          );
        }
      );
    } else {
      db.close();
    }
  });
}); 