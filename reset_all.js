const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'db.sqlite');

console.log('🗑️ Resetting database and removing all users...');
console.log('Database path:', dbPath);

// Check if database file exists
if (!fs.existsSync(dbPath)) {
  console.log('❌ Database file not found!');
  process.exit(1);
}

console.log('✅ Database file exists');

// Connect to database
const db = new sqlite3.Database(dbPath);

// Reset all data
db.serialize(() => {
  console.log('🔄 Starting database reset...');
  
  // Drop all tables
  const tables = [
    'users',
    'transactions', 
    'categories',
    'friendships',
    'chats',
    'friend_requests',
    'data_sharing',
    'shared_transactions'
  ];
  
  tables.forEach(table => {
    db.run(`DROP TABLE IF EXISTS ${table}`, (err) => {
      if (err) {
        console.log(`❌ Error dropping table ${table}:`, err.message);
      } else {
        console.log(`✅ Table ${table} dropped`);
      }
    });
  });
  
  // Wait a bit then recreate tables
  setTimeout(() => {
    console.log('🔄 Recreating tables...');
    
    // Create users table
    const createUsersTable = `
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT,
        status TEXT DEFAULT 'offline',
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    db.run(createUsersTable, (err) => {
      if (err) {
        console.log('❌ Error creating users table:', err.message);
      } else {
        console.log('✅ Users table created');
      }
    });
    
    // Create transactions table
    const createTransactionsTable = `
      CREATE TABLE transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        description TEXT,
        category TEXT,
        date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `;
    
    db.run(createTransactionsTable, (err) => {
      if (err) {
        console.log('❌ Error creating transactions table:', err.message);
      } else {
        console.log('✅ Transactions table created');
      }
    });
    
    // Create categories table
    const createCategoriesTable = `
      CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    db.run(createCategoriesTable, (err) => {
      if (err) {
        console.log('❌ Error creating categories table:', err.message);
      } else {
        console.log('✅ Categories table created');
      }
    });
    
    // Create friendships table
    const createFriendshipsTable = `
      CREATE TABLE friendships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        friend_id INTEGER NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (friend_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(user_id, friend_id)
      )
    `;
    
    db.run(createFriendshipsTable, (err) => {
      if (err) {
        console.log('❌ Error creating friendships table:', err.message);
      } else {
        console.log('✅ Friendships table created');
      }
    });
    
    // Create chats table
    const createChatsTable = `
      CREATE TABLE chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        is_read BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `;
    
    db.run(createChatsTable, (err) => {
      if (err) {
        console.log('❌ Error creating chats table:', err.message);
      } else {
        console.log('✅ Chats table created');
      }
    });
    
    // Create friend_requests table
    const createFriendRequestsTable = `
      CREATE TABLE friend_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_user_id INTEGER NOT NULL,
        to_user_id INTEGER NOT NULL,
        message TEXT,
        status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (to_user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `;
    
    db.run(createFriendRequestsTable, (err) => {
      if (err) {
        console.log('❌ Error creating friend_requests table:', err.message);
      } else {
        console.log('✅ Friend requests table created');
      }
    });
    
    // Create data_sharing table
    const createDataSharingTable = `
      CREATE TABLE data_sharing (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        friend_id INTEGER NOT NULL,
        share_type TEXT NOT NULL CHECK(share_type IN ('all', 'income', 'expense', 'summary', 'none')) DEFAULT 'none',
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (friend_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(user_id, friend_id)
      )
    `;
    
    db.run(createDataSharingTable, (err) => {
      if (err) {
        console.log('❌ Error creating data_sharing table:', err.message);
      } else {
        console.log('✅ Data sharing table created');
      }
    });
    
    // Create shared_transactions table
    const createSharedTransactionsTable = `
      CREATE TABLE shared_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_transaction_id INTEGER NOT NULL,
        shared_by_user_id INTEGER NOT NULL,
        shared_with_user_id INTEGER NOT NULL,
        transaction_data TEXT NOT NULL,
        shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (original_transaction_id) REFERENCES transactions (id) ON DELETE CASCADE,
        FOREIGN KEY (shared_by_user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (shared_with_user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `;
    
    db.run(createSharedTransactionsTable, (err) => {
      if (err) {
        console.log('❌ Error creating shared_transactions table:', err.message);
      } else {
        console.log('✅ Shared transactions table created');
      }
    });
    
    // Add default categories
    setTimeout(() => {
      console.log('➕ Adding default categories...');
      
      const defaultCategories = [
        ['Gaji', 'income'],
        ['Bonus', 'income'],
        ['Investasi', 'income'],
        ['Lainnya', 'income'],
        ['Makanan', 'expense'],
        ['Transportasi', 'expense'],
        ['Belanja', 'expense'],
        ['Tagihan', 'expense'],
        ['Hiburan', 'expense'],
        ['Kesehatan', 'expense'],
        ['Pendidikan', 'expense'],
        ['Lainnya', 'expense']
      ];
      
      let completed = 0;
      defaultCategories.forEach(([name, type]) => {
        db.run(
          "INSERT INTO categories (name, type) VALUES (?, ?)",
          [name, type],
          function(err) {
            if (err) {
              console.log(`❌ Error adding category ${name}:`, err.message);
            } else {
              console.log(`✅ Category added: ${name} (${type})`);
            }
            
            completed++;
            if (completed === defaultCategories.length) {
              console.log('');
              console.log('🎉 Database reset completed successfully!');
              console.log('');
              console.log('📋 What was done:');
              console.log('   ✅ All users deleted');
              console.log('   ✅ All transactions deleted');
              console.log('   ✅ All friendships deleted');
              console.log('   ✅ All chats deleted');
              console.log('   ✅ All friend requests deleted');
              console.log('   ✅ All data sharing settings deleted');
              console.log('   ✅ Tables recreated with clean structure');
              console.log('   ✅ Default categories added');
              console.log('');
              console.log('📝 Next steps:');
              console.log('   1. Users must register again');
              console.log('   2. All data will be fresh and clean');
              console.log('   3. No existing accounts or data');
              console.log('');
              
              db.close();
            }
          }
        );
      });
    }, 1000);
  }, 2000);
}); 