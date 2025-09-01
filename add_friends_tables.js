const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'db.sqlite');

console.log('🔧 Adding friends tables to database...');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ SQLite connection error:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Connected to SQLite database');
  
  // Check current table structure
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('❌ Error getting table list:', err.message);
      db.close();
      process.exit(1);
    }
    
    console.log('📋 Current tables:');
    tables.forEach(table => {
      console.log(`  - ${table.name}`);
    });
    
    const hasFriendships = tables.some(t => t.name === 'friendships');
    const hasFriendRequests = tables.some(t => t.name === 'friend_requests');
    
    console.log('\n🔍 Checking friends tables:');
    console.log(`  - friendships table: ${hasFriendships ? '✅' : '❌'}`);
    console.log(`  - friend_requests table: ${hasFriendRequests ? '✅' : '❌'}`);
    
    // Add missing tables
    const promises = [];
    
    if (!hasFriendships) {
      console.log('➕ Adding friendships table...');
      promises.push(new Promise((resolve, reject) => {
        const createFriendshipsTable = `
          CREATE TABLE IF NOT EXISTS friendships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            friend_id INTEGER NOT NULL,
            status TEXT CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, friend_id)
          )
        `;
        
        db.run(createFriendshipsTable, (err) => {
          if (err) {
            console.error('❌ Error creating friendships table:', err.message);
            reject(err);
          } else {
            console.log('✅ Friendships table created successfully');
            resolve();
          }
        });
      }));
    }
    
    if (!hasFriendRequests) {
      console.log('➕ Adding friend_requests table...');
      promises.push(new Promise((resolve, reject) => {
        const createFriendRequestsTable = `
          CREATE TABLE IF NOT EXISTS friend_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_user_id INTEGER NOT NULL,
            to_user_id INTEGER NOT NULL,
            message TEXT,
            status TEXT CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(from_user_id, to_user_id)
          )
        `;
        
        db.run(createFriendRequestsTable, (err) => {
          if (err) {
            console.error('❌ Error creating friend_requests table:', err.message);
            reject(err);
          } else {
            console.log('✅ Friend_requests table created successfully');
            resolve();
          }
        });
      }));
    }
    
    // Wait for all table creations to complete
    Promise.all(promises).then(() => {
      console.log('\n🔍 Verifying final table structure...');
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
          console.error('❌ Error verifying table structure:', err.message);
          db.close();
          process.exit(1);
        }
        
        console.log('📋 Final tables:');
        tables.forEach(table => {
          console.log(`  - ${table.name}`);
        });
        
        // Check if all required tables exist
        const finalHasFriendships = tables.some(t => t.name === 'friendships');
        const finalHasFriendRequests = tables.some(t => t.name === 'friend_requests');
        
        if (finalHasFriendships && finalHasFriendRequests) {
          console.log('\n🎉 All friends tables are present!');
          console.log('✅ Friends feature is now ready');
        } else {
          console.log('\n⚠️ Some tables are still missing:');
          console.log(`  - friendships: ${finalHasFriendships ? '✅' : '❌'}`);
          console.log(`  - friend_requests: ${finalHasFriendRequests ? '✅' : '❌'}`);
        }
        
        // Show table schemas
        console.log('\n📋 Table Schemas:');
        
        if (finalHasFriendships) {
          db.all("PRAGMA table_info(friendships)", (err, columns) => {
            if (!err) {
              console.log('\n🔗 Friendships table structure:');
              columns.forEach(col => {
                console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
              });
            }
          });
        }
        
        if (finalHasFriendRequests) {
          db.all("PRAGMA table_info(friend_requests)", (err, columns) => {
            if (!err) {
              console.log('\n📨 Friend_requests table structure:');
              columns.forEach(col => {
                console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
              });
            }
          });
        }
        
        db.close();
        console.log('\n🏁 Friends tables setup completed');
      });
    }).catch((error) => {
      console.error('❌ Setup failed:', error);
      db.close();
      process.exit(1);
    });
  });
}); 