# 🗄️ Database Fix ReportIn Backend

## 📋 **Ringkasan Masalah**

Backend ReportIn mengalami error `SQLITE_ERROR: no such table: users` saat mencoba melakukan operasi database. Masalah ini disebabkan oleh database yang belum diinisialisasi dengan tabel yang diperlukan.

## 🚨 **Root Cause Analysis**

### **Error yang Ditemukan:**
```
Register error: Error: SQLITE_ERROR: no such table: users
--> in Database#get('SELECT * FROM users WHERE email = ?', [ 'darulizza80@gmail.com' ], [AsyncFunction (anonymous)])
```

### **Penyebab:**
1. **Database belum diinisialisasi** - Tabel `users` tidak ada
2. **Tidak ada auto-initialization** - Database tidak otomatis membuat tabel
3. **Missing database setup** - Tidak ada script untuk setup database

## ✅ **Solusi yang Diterapkan**

### **1. Database Initialization Script**

**File:** `init_db.js`
```javascript
// Create users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

// Create transactions table
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

// Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'category',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### **2. Auto-Initialization di db.js**

**File:** `db.js`
```javascript
// Check if tables exist and create them if they don't
const initializeTablesIfNeeded = () => {
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
    if (!row) {
      console.log('⚠️ Users table not found. Creating tables...');
      createTables();
    } else {
      console.log('✅ Database tables verified');
    }
  });
};
```

### **3. Default Categories**

**Income Categories:**
- Gaji (Salary)
- Bonus
- Investasi (Investment)
- Lainnya (Others)

**Expense Categories:**
- Makanan (Food)
- Transportasi (Transportation)
- Belanja (Shopping)
- Tagihan (Bills)
- Hiburan (Entertainment)
- Kesehatan (Health)
- Pendidikan (Education)
- Lainnya (Others)

### **4. Database Optimizations**

```javascript
// Performance optimizations
PRAGMA journal_mode = WAL
PRAGMA synchronous = NORMAL
PRAGMA cache_size = 10000
PRAGMA temp_store = MEMORY
PRAGMA mmap_size = 268435456
PRAGMA optimize
```

### **5. Indexes untuk Performance**

```sql
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC)
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type)
```

## 📊 **Database Schema**

### **Users Table:**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key, auto increment |
| name | TEXT | User's full name |
| email | TEXT | Unique email address |
| password | TEXT | Hashed password |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

### **Transactions Table:**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key, auto increment |
| user_id | INTEGER | Foreign key to users table |
| type | TEXT | 'income' or 'expense' |
| category | TEXT | Transaction category |
| amount | DECIMAL(10,2) | Transaction amount |
| description | TEXT | Optional description |
| date | DATE | Transaction date |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

### **Categories Table:**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key, auto increment |
| name | TEXT | Category name |
| type | TEXT | 'income' or 'expense' |
| color | TEXT | Hex color code |
| icon | TEXT | Icon identifier |
| created_at | DATETIME | Creation timestamp |

## 🚀 **Cara Menggunakan**

### **1. Manual Database Initialization:**
```bash
cd backend
npm run init-db
```

### **2. Reset Database (Hapus dan buat ulang):**
```bash
cd backend
npm run reset-db
```

### **3. Auto-Initialization:**
Database akan otomatis diinisialisasi saat server start jika tabel tidak ada.

## 🧪 **Testing Database**

### **1. Test Connection:**
```bash
curl http://localhost:5005/api/
```

### **2. Test Registration:**
```bash
curl -X POST http://localhost:5005/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### **3. Test Login:**
```bash
curl -X POST http://localhost:5005/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 📝 **Package.json Scripts**

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "init-db": "node init_db.js",
    "reset-db": "rm -f db.sqlite && node init_db.js"
  }
}
```

## 🔧 **Files Modified**

1. **`init_db.js`** - Database initialization script
2. **`db.js`** - Auto-initialization and optimizations
3. **`package.json`** - Added database scripts
4. **`DATABASE_FIX.md`** - This documentation

## 🎯 **Expected Results**

### **Before:**
- ❌ **Database error:** `no such table: users`
- ❌ **Registration failed**
- ❌ **Login failed**
- ❌ **No data persistence**

### **After:**
- ✅ **Database initialized** - All tables created
- ✅ **Registration works** - Users can register
- ✅ **Login works** - Users can login
- ✅ **Data persistence** - All data saved properly
- ✅ **Performance optimized** - Fast queries with indexes

## 🚀 **Deployment Checklist**

### **Before Deploying:**
- [ ] Run `npm run init-db`
- [ ] Test registration endpoint
- [ ] Test login endpoint
- [ ] Verify database file exists
- [ ] Check database permissions

### **After Deploying:**
- [ ] Monitor database errors
- [ ] Check database performance
- [ ] Monitor disk space usage
- [ ] Backup database regularly

## 📝 **Best Practices Applied**

1. **Auto-initialization** - Database setup automatically
2. **Foreign key constraints** - Data integrity
3. **Indexes** - Query performance optimization
4. **Default data** - Pre-populated categories
5. **Error handling** - Graceful error management
6. **Documentation** - Complete setup guide

## 🎯 **Future Improvements**

### **Planned Features:**
- [ ] Database migration system
- [ ] Backup and restore functionality
- [ ] Database monitoring
- [ ] Performance analytics
- [ ] Data validation rules

### **Monitoring Tools:**
- [ ] Database performance monitoring
- [ ] Query analytics
- [ ] Error tracking
- [ ] Backup automation

---

**Database error telah diatasi! Backend sekarang siap untuk operasi database! 🗄️** 