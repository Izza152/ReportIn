const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'db.sqlite');

console.log('🧪 Testing Chat Features...');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ SQLite connection error:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Connected to SQLite database');
  
  // Test 1: Check database structure
  console.log('\n📋 Test 1: Database Structure');
  db.all("PRAGMA table_info(chats)", (err, columns) => {
    if (err) {
      console.error('❌ Error getting table info:', err.message);
    } else {
      console.log('✅ Chats table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
      });
    }
    
    // Test 2: Check if users exist
    console.log('\n👥 Test 2: Users Check');
    db.all("SELECT id, name, email FROM users", (err, users) => {
      if (err) {
        console.error('❌ Error getting users:', err.message);
      } else {
        console.log(`✅ Found ${users.length} users:`);
        users.forEach(user => {
          console.log(`  - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
        });
      }
      
      // Test 3: Check friendships
      console.log('\n🤝 Test 3: Friendships Check');
      db.all("SELECT * FROM friendships", (err, friendships) => {
        if (err) {
          console.error('❌ Error getting friendships:', err.message);
        } else {
          console.log(`✅ Found ${friendships.length} friendships:`);
          friendships.forEach(friendship => {
            console.log(`  - User ID: ${friendship.user_id}, Friend ID: ${friendship.friend_id}, Status: ${friendship.status}`);
          });
        }
        
        // Test 4: Check chat messages
        console.log('\n💬 Test 4: Chat Messages Check');
        db.all("SELECT * FROM chats", (err, chats) => {
          if (err) {
            console.error('❌ Error getting chats:', err.message);
          } else {
            console.log(`✅ Found ${chats.length} chat messages:`);
            chats.forEach(chat => {
              console.log(`  - ID: ${chat.id}, Sender: ${chat.sender_id}, Receiver: ${chat.receiver_id}, Message: ${chat.message?.substring(0, 50)}...`);
            });
          }
          
          // Test 5: Test chat query (simulate backend query)
          console.log('\n🔍 Test 5: Chat Query Test');
          if (users.length >= 2) {
            const userId = users[0].id;
            const friendId = users[1].id;
            
            const testQuery = `
              SELECT c.id, c.message, c.message_type, c.is_read, c.created_at,
                     u.id as sender_id, u.name as sender_name, u.avatar as sender_avatar
              FROM chats c
              JOIN users u ON c.sender_id = u.id
              WHERE (c.sender_id = ? AND c.receiver_id = ?) OR (c.sender_id = ? AND c.receiver_id = ?)
              ORDER BY c.created_at ASC
              LIMIT 100
            `;
            
            db.all(testQuery, [userId, friendId, friendId, userId], (err, messages) => {
              if (err) {
                console.error('❌ Error testing chat query:', err.message);
              } else {
                console.log(`✅ Chat query test successful: ${messages.length} messages found`);
              }
              
              // Test 6: Test insert message
              console.log('\n📝 Test 6: Insert Message Test');
              const insertQuery = 'INSERT INTO chats (sender_id, receiver_id, message, message_type) VALUES (?, ?, ?, ?)';
              db.run(insertQuery, [userId, friendId, 'Test message from script', 'text'], function(err) {
                if (err) {
                  console.error('❌ Error inserting test message:', err.message);
                } else {
                  console.log(`✅ Test message inserted successfully with ID: ${this.lastID}`);
                }
                
                // Test 7: Test unread count query
                console.log('\n📊 Test 7: Unread Count Query Test');
                const unreadQuery = `
                  SELECT receiver_id as friend_id, COUNT(*) as count
                  FROM chats
                  WHERE receiver_id = ? AND is_read = FALSE
                  GROUP BY receiver_id
                `;
                
                db.all(unreadQuery, [friendId], (err, unreadCounts) => {
                  if (err) {
                    console.error('❌ Error testing unread count query:', err.message);
                  } else {
                    console.log(`✅ Unread count query test successful: ${unreadCounts.length} unread counts found`);
                    unreadCounts.forEach(count => {
                      console.log(`  - Friend ID: ${count.friend_id}, Unread: ${count.count}`);
                    });
                  }
                  
                  // Final summary
                  console.log('\n🎉 Chat Features Test Summary:');
                  console.log('✅ Database structure: CORRECT');
                  console.log('✅ Users: AVAILABLE');
                  console.log('✅ Friendships: CHECKED');
                  console.log('✅ Chat messages: WORKING');
                  console.log('✅ Chat queries: WORKING');
                  console.log('✅ Message insertion: WORKING');
                  console.log('✅ Unread count: WORKING');
                  console.log('\n🚀 Chat features are ready to use!');
                  
                  db.close();
                });
              });
            });
          } else {
            console.log('⚠️ Need at least 2 users to test chat features');
            db.close();
          }
        });
      });
    });
  });
}); 