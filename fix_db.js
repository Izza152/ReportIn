const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('db.sqlite');

console.log('🔧 Dropping table categories (if exists)...');
db.serialize(() => {
  db.run('DROP TABLE IF EXISTS categories', (err) => {
    if (err) {
      console.error('❌ Error dropping table:', err);
      process.exit(1);
    } else {
      console.log('✅ Table categories dropped (if existed).');
      process.exit(0);
    }
  });
}); 