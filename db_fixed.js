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

      console.log('🔧 Creating database connection...');
      console.log('📁 Database path:', dbPath);

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

// Initialize database connection when module loads
const initializeDatabase = async () => {
  try {
    await createDatabaseConnection();
    console.log('✅ Database initialized successfully');
    
    // Check if tables exist and create them if they don't
    await initializeTablesIfNeeded();
    
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    throw error;
  }
};

// Function to check and create tables if they don't exist
const initializeTablesIfNeeded = () => {
  return new Promise((resolve, reject) => {
    console.log('🔍 Checking database tables...');
    
    // Check if users table exists
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
      if (err) {
        console.error('❌ Error checking users table:', err.message);
        reject(err);
        return;
      }
      
      if (!row) {
        console.log('⚠️ Users table not found. Creating tables...');
        createTables().then(resolve).catch(reject);
      } else {
        console.log('✅ Database tables verified');
        resolve();
      }
    });
  });
};

// Function to create all necessary tables
const createTables = () => {
  return new Promise((resolve, reject) => {
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

    const createFriendsTable = `
      CREATE TABLE IF NOT EXISTS friends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        friend_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, friend_id)
      )
    `;

    const createChatsTable = `
      CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text', 'image', 'file')),
        is_read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    // Execute table creation
    db.serialize(() => {
      db.run(createUsersTable, (err) => {
        if (err) {
          console.error('❌ Error creating users table:', err.message);
          reject(err);
          return;
        }
        console.log('✅ Users table created/verified');
      });

      db.run(createTransactionsTable, (err) => {
        if (err) {
          console.error('❌ Error creating transactions table:', err.message);
          reject(err);
          return;
        }
        console.log('✅ Transactions table created/verified');
      });

      db.run(createCategoriesTable, (err) => {
        if (err) {
          console.error('❌ Error creating categories table:', err.message);
          reject(err);
          return;
        }
        console.log('✅ Categories table created/verified');
      });

      db.run(createFriendsTable, (err) => {
        if (err) {
          console.error('❌ Error creating friends table:', err.message);
          reject(err);
          return;
        }
        console.log('✅ Friends table created/verified');
      });

      db.run(createChatsTable, (err) => {
        if (err) {
          console.error('❌ Error creating chats table:', err.message);
          reject(err);
          return;
        }
        console.log('✅ Chats table created/verified');
      });

      // Create indexes for better performance
      db.run('CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)');
      db.run('CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_chats_sender_id ON chats(sender_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_chats_receiver_id ON chats(receiver_id)');

      console.log('✅ Database indexes created/verified');
      resolve();
    });
  });
};

// Insert default categories
const insertDefaultCategories = () => {
  return new Promise((resolve, reject) => {
    console.log('📝 Inserting default categories...');
    
    const defaultCategories = [
      { name: 'Gaji', type: 'income', color: '#10B981', icon: 'work' },
      { name: 'Bonus', type: 'income', color: '#F59E0B', icon: 'star' },
      { name: 'Investasi', type: 'income', color: '#3B82F6', icon: 'trending_up' },
      { name: 'Makanan', type: 'expense', color: '#EF4444', icon: 'restaurant' },
      { name: 'Transport', type: 'expense', color: '#8B5CF6', icon: 'directions_car' },
      { name: 'Belanja', type: 'expense', color: '#EC4899', icon: 'shopping_cart' },
      { name: 'Tagihan', type: 'expense', color: '#F97316', icon: 'receipt' },
      { name: 'Hiburan', type: 'expense', color: '#06B6D4', icon: 'movie' }
    ];

    const insertQuery = 'INSERT OR IGNORE INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)';
    
    db.serialize(() => {
      defaultCategories.forEach(category => {
        db.run(insertQuery, [category.name, category.type, category.color, category.icon], (err) => {
          if (err) {
            console.error('❌ Error inserting category:', err.message);
          }
        });
      });
      
      console.log('✅ Default categories inserted');
      resolve();
    });
  });
};

// Export functions
module.exports = {
  createDatabaseConnection,
  getDatabase,
  closeDatabase,
  initializeDatabase,
  initializeTablesIfNeeded,
  createTables,
  insertDefaultCategories,
  dbPath
};

// Auto-initialize if this module is run directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('✅ Database setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database setup failed:', error.message);
      process.exit(1);
    });
} 