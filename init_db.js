const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'db.sqlite');

console.log('🗄️ Initializing database...');
console.log('Database path:', dbPath);

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ SQLite connection error:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Create tables
const createTables = () => {
  return new Promise((resolve, reject) => {
    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create transactions table
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

    // Create categories table
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

    // Execute table creation
    db.serialize(() => {
      // Create users table
      db.run(createUsersTable, (err) => {
        if (err) {
          console.error('❌ Error creating users table:', err.message);
          reject(err);
          return;
        }
        console.log('✅ Users table created/verified');

        // Create transactions table
        db.run(createTransactionsTable, (err) => {
          if (err) {
            console.error('❌ Error creating transactions table:', err.message);
            reject(err);
            return;
          }
          console.log('✅ Transactions table created/verified');

          // Create categories table
          db.run(createCategoriesTable, (err) => {
            if (err) {
              console.error('❌ Error creating categories table:', err.message);
              reject(err);
              return;
            }
            console.log('✅ Categories table created/verified');
            resolve();
          });
        });
      });
    });
  });
};

// Insert default categories
const insertDefaultCategories = () => {
  return new Promise((resolve, reject) => {
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
          resolve();
        }
      });
    });
  });
};

// Create indexes for better performance
const createIndexes = () => {
  return new Promise((resolve, reject) => {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)',
      'CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type)'
    ];

    let completed = 0;
    const total = indexes.length;

    indexes.forEach(index => {
      db.run(index, (err) => {
        if (err) {
          console.error('❌ Error creating index:', err.message);
        } else {
          console.log('✅ Index created/verified');
        }
        
        completed++;
        if (completed === total) {
          resolve();
        }
      });
    });
  });
};

// Enable database optimizations
const enableOptimizations = () => {
  return new Promise((resolve) => {
    const optimizations = [
      'PRAGMA journal_mode = WAL',
      'PRAGMA synchronous = NORMAL',
      'PRAGMA cache_size = 10000',
      'PRAGMA temp_store = MEMORY',
      'PRAGMA mmap_size = 268435456',
      'PRAGMA optimize'
    ];

    let completed = 0;
    const total = optimizations.length;

    optimizations.forEach(optimization => {
      db.run(optimization, (err) => {
        if (err) {
          console.error('❌ Error applying optimization:', err.message);
        } else {
          console.log('✅ Optimization applied');
        }
        
        completed++;
        if (completed === total) {
          resolve();
        }
      });
    });
  });
};

// Main initialization function
const initializeDatabase = async () => {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Create tables
    await createTables();
    
    // Insert default categories
    await insertDefaultCategories();
    
    // Create indexes
    await createIndexes();
    
    // Enable optimizations
    await enableOptimizations();
    
    console.log('🎉 Database initialization completed successfully!');
    console.log('📊 Database is ready for use');
    
    // Close database connection
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('✅ Database connection closed');
      }
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Run initialization
initializeDatabase(); 