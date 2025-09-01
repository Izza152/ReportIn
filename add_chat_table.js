const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'db.sqlite');
console.log('🔧 Adding chat table to database...');
console.log('Database path:', dbPath);

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database');
});

// Show current tables
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
  if (err) {
    console.error('❌ Error getting tables:', err.message);
    return;
  }
  
  console.log('📋 Current tables:');
  tables.forEach(table => {
    console.log(`  - ${table.name}`);
  });
  
  // Check if chats table exists
  const chatsTableExists = tables.some(table => table.name === 'chats');
  console.log('🔍 Checking chat table:');
  console.log(`  - chats table: ${chatsTableExists ? '✅' : '❌'}`);
  
  if (chatsTableExists) {
    // Show existing table structure
    db.all("PRAGMA table_info(chats)", [], (err, columns) => {
      if (err) {
        console.error('❌ Error getting table info:', err.message);
        return;
      }
      
      console.log('📋 Existing chats table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
      });
      
      // Check if read_at column exists
      const hasReadAt = columns.some(col => col.name === 'read_at');
      if (!hasReadAt) {
        console.log('🔧 Adding read_at column...');
        db.run("ALTER TABLE chats ADD COLUMN read_at DATETIME", (err) => {
          if (err) {
            console.error('❌ Error adding read_at column:', err.message);
          } else {
            console.log('✅ read_at column added');
          }
        });
      }
      
      console.log('🎉 Chat feature is already set up!');
      console.log('✅ Chat table exists and is ready');
    });
  } else {
    // Create chats table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        is_read BOOLEAN DEFAULT 0,
        read_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users (id),
        FOREIGN KEY (receiver_id) REFERENCES users (id)
      )
    `;
    
    db.run(createTableSQL, (err) => {
      if (err) {
        console.error('❌ Error creating chats table:', err.message);
        return;
      }
      
      console.log('✅ Chats table created successfully');
      console.log('📋 New chats table structure:');
      console.log('  - id: INTEGER  PRIMARY KEY');
      console.log('  - sender_id: INTEGER NOT NULL');
      console.log('  - receiver_id: INTEGER NOT NULL');
      console.log('  - message: TEXT NOT NULL');
      console.log('  - message_type: TEXT');
      console.log('  - is_read: BOOLEAN');
      console.log('  - read_at: DATETIME');
      console.log('  - created_at: DATETIME');
      
      // Create indexes for better performance
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_chats_sender_id ON chats(sender_id)',
        'CREATE INDEX IF NOT EXISTS idx_chats_receiver_id ON chats(receiver_id)',
        'CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at)',
        'CREATE INDEX IF NOT EXISTS idx_chats_is_read ON chats(is_read)',
        'CREATE INDEX IF NOT EXISTS idx_chats_sender_receiver ON chats(sender_id, receiver_id)'
      ];
      
      indexes.forEach((indexSQL, i) => {
        db.run(indexSQL, (err) => {
          if (err) {
            console.error(`❌ Error creating index ${i + 1}:`, err.message);
          } else {
            console.log(`✅ Index ${i + 1} created`);
          }
        });
      });
      
      console.log('🎉 Chat feature is now set up!');
      console.log('✅ Chat table exists and is ready');
    });
  }
});

// Close database connection
db.close((err) => {
  if (err) {
    console.error('❌ Error closing database:', err.message);
  } else {
    console.log('✅ Database connection closed');
  }
}); 