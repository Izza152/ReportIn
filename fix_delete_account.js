const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Fixing delete account functionality...');
console.log('Database path:', dbPath);

// Test the correct delete queries
const testDeleteQueries = [
  'DELETE FROM chats WHERE user_id = ? OR friend_id = ?',
  'DELETE FROM friend_requests WHERE from_user_id = ? OR to_user_id = ?',
  'DELETE FROM friendships WHERE user_id = ? OR friend_id = ?',
  'DELETE FROM data_sharing WHERE user_id = ? OR friend_id = ?',
  'DELETE FROM shared_transactions WHERE shared_by_user_id = ? OR shared_with_user_id = ?',
  'DELETE FROM transactions WHERE user_id = ?',
  'DELETE FROM categories WHERE user_id = ?',
  'DELETE FROM users WHERE id = ?'
];

console.log('✅ Corrected delete queries:');
testDeleteQueries.forEach((query, index) => {
  console.log(`   ${index + 1}. ${query}`);
});

// Check table structures
console.log('\n📊 Checking table structures...');

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('❌ Error checking tables:', err.message);
    return;
  }
  
  console.log('📋 Available tables:');
  tables.forEach(table => {
    console.log(`   - ${table.name}`);
  });
  
  // Check chats table structure
  db.all("PRAGMA table_info(chats)", (err, columns) => {
    if (err) {
      console.error('❌ Error checking chats table structure:', err.message);
      return;
    }
    
    console.log('\n📋 Chats table columns:');
    columns.forEach(col => {
      console.log(`   - ${col.name} (${col.type})`);
    });
    
    // Check friend_requests table structure
    db.all("PRAGMA table_info(friend_requests)", (err, columns) => {
      if (err) {
        console.error('❌ Error checking friend_requests table structure:', err.message);
        return;
      }
      
      console.log('\n📋 Friend_requests table columns:');
      columns.forEach(col => {
        console.log(`   - ${col.name} (${col.type})`);
      });
      
      // Check shared_transactions table structure
      db.all("PRAGMA table_info(shared_transactions)", (err, columns) => {
        if (err) {
          console.error('❌ Error checking shared_transactions table structure:', err.message);
          return;
        }
        
        console.log('\n📋 Shared_transactions table columns:');
        columns.forEach(col => {
          console.log(`   - ${col.name} (${col.type})`);
        });
        
        console.log('\n✅ Database structure analysis completed');
        console.log('💡 The delete account queries have been corrected');
        console.log('🔧 Update routes.js with the corrected queries');
        
        db.close();
      });
    });
  });
}); 