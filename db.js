const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'db.sqlite');

// Create database connection with better error handling
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('SQLite connection error:', err.message);
    console.error('Please make sure SQLite3 is installed on your system');
    console.error('On Ubuntu: sudo apt install sqlite3 libsqlite3-dev');
  } else {
    console.log('Connected to SQLite database.');
    console.log('Database path:', dbPath);

    // Enable optimizations
    db.run('PRAGMA journal_mode = WAL'); // Write-Ahead Logging for better concurrency
    db.run('PRAGMA synchronous = NORMAL'); // Faster writes
    db.run('PRAGMA cache_size = 10000'); // Increase cache size
    db.run('PRAGMA temp_store = MEMORY'); // Store temp tables in memory
    db.run('PRAGMA mmap_size = 268435456'); // 256MB memory mapping
    db.run('PRAGMA optimize'); // Optimize database

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Check if tables exist and create them if they don't
    initializeTablesIfNeeded();

    console.log('✅ Database optimizations applied');
  }
});

// Function to check and create tables if they don't exist
const initializeTablesIfNeeded = () => {
  console.log('🔍 Checking database tables...');
  
  // Check if users table exists
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
    if (err) {
      console.error('❌ Error checking users table:', err.message);
      return;
    }
    
    if (!row) {
      console.log('⚠️ Users table not found. Creating tables...');
      createTables();
    } else {
      console.log('✅ Database tables verified');
    }
  });
};

// Function to create all necessary tables
const createTables = () => {
  console.log('🏗️ Creating database tables...');
  
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT DEFAULT NULL,
      avatar TEXT DEFAULT NULL,
      status TEXT DEFAULT 'offline',
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createTransactionsTable = `
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `;

  const createCategoriesTable = `
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      color TEXT DEFAULT '#3B82F6',
      icon TEXT DEFAULT 'category',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  const createFriendshipsTable = `
    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'rejected', 'blocked')) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (friend_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(user_id, friend_id)
    )
  `;

  const createChatsTable = `
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text', 'image', 'file')),
      is_read BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (friend_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `;

  const createFriendRequestsTable = `
    CREATE TABLE IF NOT EXISTS friend_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      message TEXT,
      status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (to_user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(from_user_id, to_user_id)
    )
  `;

  const createDataSharingTable = `
    CREATE TABLE IF NOT EXISTS data_sharing (
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

  const createSharedTransactionsTable = `
    CREATE TABLE IF NOT EXISTS shared_transactions (
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

  db.serialize(() => {
    db.run(createUsersTable, (err) => {
      if (err) {
        console.error('❌ Error creating users table:', err.message);
        return;
      }
      console.log('✅ Users table created');

      db.run(createTransactionsTable, (err) => {
        if (err) {
          console.error('❌ Error creating transactions table:', err.message);
          return;
        }
        console.log('✅ Transactions table created');

        db.run(createCategoriesTable, (err) => {
          if (err) {
            console.error('❌ Error creating categories table:', err.message);
            return;
          }
          console.log('✅ Categories table created');

          db.run(createFriendshipsTable, (err) => {
            if (err) {
              console.error('❌ Error creating friendships table:', err.message);
              return;
            }
            console.log('✅ Friendships table created');

            db.run(createChatsTable, (err) => {
              if (err) {
                console.error('❌ Error creating chats table:', err.message);
                return;
              }
              console.log('✅ Chats table created');

              db.run(createFriendRequestsTable, (err) => {
                if (err) {
                  console.error('❌ Error creating friend_requests table:', err.message);
                  return;
                }
                console.log('✅ Friend requests table created');

                db.run(createDataSharingTable, (err) => {
                  if (err) {
                    console.error('❌ Error creating data_sharing table:', err.message);
                    return;
                  }
                  console.log('✅ Data sharing table created');

                  db.run(createSharedTransactionsTable, (err) => {
                    if (err) {
                      console.error('❌ Error creating shared_transactions table:', err.message);
                      return;
                    }
                    console.log('✅ Shared transactions table created');
                    insertDefaultCategories();
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};

// Function to insert default categories
const insertDefaultCategories = () => {
  console.log('📝 Inserting default categories...');
  
  const defaultCategories = [
    // Income categories
    { name: 'Gaji', type: 'income', color: '#10B981', icon: 'work' },
    { name: 'Bonus', type: 'income', color: '#F59E0B', icon: 'star' },
    { name: 'Investasi', type: 'income', color: '#8B5CF6', icon: 'trending_up' },
    { name: 'Lainnya', type: 'income', color: '#6B7280', icon: 'more_horiz' },
    
    // Expense categories
    { name: 'Makanan', type: 'expense', color: '#EF4444', icon: 'restaurant' },
    { name: 'Transportasi', type: 'expense', color: '#3B82F6', icon: 'directions_car' },
    { name: 'Belanja', type: 'expense', color: '#EC4899', icon: 'shopping_cart' },
    { name: 'Tagihan', type: 'expense', color: '#F97316', icon: 'receipt' },
    { name: 'Hiburan', type: 'expense', color: '#8B5CF6', icon: 'movie' },
    { name: 'Kesehatan', type: 'expense', color: '#10B981', icon: 'local_hospital' },
    { name: 'Pendidikan', type: 'expense', color: '#06B6D4', icon: 'school' },
    { name: 'Lainnya', type: 'expense', color: '#6B7280', icon: 'more_horiz' }
  ];

  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (name, type, color, icon) 
    VALUES (?, ?, ?, ?)
  `);

  let completed = 0;
  const total = defaultCategories.length;

  defaultCategories.forEach(category => {
    insertCategory.run([category.name, category.type, category.color, category.icon], (err) => {
      if (err) {
        console.error(`❌ Error inserting category ${category.name}:`, err.message);
      } else {
        console.log(`✅ Category "${category.name}" inserted/verified`);
      }
      
      completed++;
      if (completed === total) {
        insertCategory.finalize();
        console.log('🎉 Database initialization completed!');
      }
    });
  });
};

// Create indexes for better query performance
const createIndexes = () => {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)',
    'CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC)',
    'CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)',
    'CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type)',
    'CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id, status)',
    'CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id, status)',
    'CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON friend_requests(from_user_id, status)',
    'CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON friend_requests(to_user_id, status)',
    'CREATE INDEX IF NOT EXISTS idx_chats_users ON chats(user_id, friend_id)',
    'CREATE INDEX IF NOT EXISTS idx_chats_created ON chats(created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_chats_unread ON chats(is_read, friend_id)',
    'CREATE INDEX IF NOT EXISTS idx_data_sharing_user ON data_sharing(user_id, is_active)',
    'CREATE INDEX IF NOT EXISTS idx_data_sharing_friend ON data_sharing(friend_id, is_active)',
    'CREATE INDEX IF NOT EXISTS idx_data_sharing_type ON data_sharing(share_type, is_active)',
    'CREATE INDEX IF NOT EXISTS idx_shared_transactions_by ON shared_transactions(shared_by_user_id)',
    'CREATE INDEX IF NOT EXISTS idx_shared_transactions_with ON shared_transactions(shared_with_user_id)',
    'CREATE INDEX IF NOT EXISTS idx_shared_transactions_original ON shared_transactions(original_transaction_id)'
  ];

  indexes.forEach(index => {
    db.run(index, (err) => {
      if (err) {
        console.error('❌ Error creating index:', err.message);
      } else {
        console.log('✅ Index created/verified');
      }
    });
  });
};

// Handle database errors
db.on('error', (err) => {
  console.error('Database error:', err.message);
});

// Add query performance monitoring
const originalAll = db.all.bind(db);
const originalGet = db.get.bind(db);
const originalRun = db.run.bind(db);

db.all = function(sql, params, callback) {
  const start = Date.now();
  return originalAll(sql, params, function(err, rows) {
    const duration = Date.now() - start;
    if (duration > 100) { // Log slow queries (>100ms)
      console.log(`🐌 Slow query (${duration}ms): ${sql.substring(0, 100)}...`);
    }
    callback(err, rows);
  });
};

db.get = function(sql, params, callback) {
  const start = Date.now();
  return originalGet(sql, params, function(err, row) {
    const duration = Date.now() - start;
    if (duration > 100) {
      console.log(`🐌 Slow query (${duration}ms): ${sql.substring(0, 100)}...`);
    }
    if (callback) {
      callback(err, row);
    }
  });
};

module.exports = db; 