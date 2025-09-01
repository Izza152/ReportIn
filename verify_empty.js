const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Verifying empty database...');
console.log('Database path:', dbPath);

// Check users table
db.all("SELECT id, name, email, created_at FROM users", (err, rows) => {
  if (err) {
    console.log('❌ Error querying users:', err.message);
    return;
  }
  
  const userCount = rows.length;
  console.log(`📊 Found ${userCount} users in database`);
  
  if (userCount === 0) {
    console.log('✅ Database is empty - no users found');
    console.log('✅ Users must register again');
  } else {
    console.log('❌ Database still has users:');
    rows.forEach(user => {
      console.log(`   - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
    });
  }
  
  // Check transactions
  db.all("SELECT COUNT(*) as count FROM transactions", (err, rows) => {
    if (err) {
      console.log('❌ Error querying transactions:', err.message);
      return;
    }
    
    const transactionCount = rows[0]?.count || 0;
    console.log(`📊 Found ${transactionCount} transactions in database`);
    
    if (transactionCount === 0) {
      console.log('✅ No transactions found');
    } else {
      console.log('❌ Database still has transactions');
    }
    
    // Check categories
    db.all("SELECT COUNT(*) as count FROM categories", (err, rows) => {
      if (err) {
        console.log('❌ Error querying categories:', err.message);
        return;
      }
      
      const categoryCount = rows[0]?.count || 0;
      console.log(`📊 Found ${categoryCount} categories in database`);
      
      if (categoryCount > 0) {
        console.log('✅ Default categories are available');
      } else {
        console.log('❌ No categories found');
      }
      
      console.log('');
      console.log('📋 Summary:');
      console.log(`   Users: ${userCount === 0 ? '✅ Empty' : '❌ Has data'}`);
      console.log(`   Transactions: ${transactionCount === 0 ? '✅ Empty' : '❌ Has data'}`);
      console.log(`   Categories: ${categoryCount > 0 ? '✅ Available' : '❌ Missing'}`);
      console.log('');
      
      if (userCount === 0 && transactionCount === 0) {
        console.log('🎉 Database is clean and ready for new registrations!');
      } else {
        console.log('⚠️ Database still has some data');
      }
      
      db.close();
    });
  });
}); 