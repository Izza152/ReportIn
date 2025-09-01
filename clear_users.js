const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🗑️ Clearing all users from database...');
console.log('Database path:', dbPath);

// Delete all users
db.run("DELETE FROM users", function(err) {
  if (err) {
    console.log('❌ Error deleting users:', err.message);
    return;
  }
  
  console.log(`✅ Deleted ${this.changes} users from database`);
  
  // Reset auto-increment
  db.run("DELETE FROM sqlite_sequence WHERE name='users'", function(err) {
    if (err) {
      console.log('❌ Error resetting sequence:', err.message);
    } else {
      console.log('✅ Reset user ID sequence');
    }
    
    // Verify users are gone
    db.all("SELECT COUNT(*) as count FROM users", (err, rows) => {
      if (err) {
        console.log('❌ Error checking users:', err.message);
        return;
      }
      
      const userCount = rows[0]?.count || 0;
      console.log(`📊 Current user count: ${userCount}`);
      
      if (userCount === 0) {
        console.log('🎉 All users successfully removed!');
        console.log('✅ Database is now empty');
        console.log('✅ Users must register again');
      } else {
        console.log('❌ Some users still remain');
      }
      
      db.close();
    });
  });
}); 