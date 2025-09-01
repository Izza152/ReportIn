# 🔧 Perbaikan Error SQLite3 di VPS

## Error yang Dialami
```
⚠️ Database not loaded in routes: /home/ubuntu/Documents/ReportIn/backend/node_modules/sqlite3/build/Release/node_sqlite3.node: invalid ELF header
```

## Penyebab Error
- File `node_sqlite3.node` tidak kompatibel dengan sistem operasi VPS
- File SQLite3 di-copy dari sistem yang berbeda (macOS → Linux)
- Dependencies tidak di-build ulang untuk sistem target

## Solusi Lengkap

### 🚀 Solusi 1: Quick Fix (Recommended)
```bash
# Jalankan script quick fix
chmod +x quick_fix_sqlite.sh
./quick_fix_sqlite.sh
```

### 🔧 Solusi 2: Manual Fix
```bash
# 1. Backup database
cp db.sqlite "db.sqlite.backup.$(date +%Y%m%d_%H%M%S)"

# 2. Hapus node_modules dan package-lock.json
rm -rf node_modules package-lock.json

# 3. Install sqlite3 dari source
npm install sqlite3 --build-from-source

# 4. Install semua dependencies
npm install

# 5. Test database connection
node -e "
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'db.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Database connection successful!');
    db.close();
    process.exit(0);
  }
});
"
```

### 🔄 Solusi 3: Replace Database File
```bash
# 1. Jalankan script replace database
chmod +x replace_db.sh
./replace_db.sh

# 2. Test database
node db.js
```

### 🛠️ Solusi 4: Advanced Fix dengan Robust Database
```bash
# 1. Jalankan script fix lengkap
chmod +x fix_sqlite_error.js
node fix_sqlite_error.js

# 2. Restart server
pm2 restart all
# atau
node index.js
```

## Verifikasi Perbaikan

### 1. Test Database Connection
```bash
node -e "
const db = require('./db.js');
db.initializeDatabase()
  .then(() => console.log('✅ Database OK'))
  .catch(err => console.error('❌ Database Error:', err.message));
"
```

### 2. Test Server
```bash
node index.js
```

### 3. Test API Endpoints
```bash
curl http://your-vps-ip:5005/api/status
curl http://your-vps-ip:5005/ping
```

## Troubleshooting

### Jika masih error:
1. **Install SQLite3 system packages:**
   ```bash
   sudo apt update
   sudo apt install sqlite3 libsqlite3-dev build-essential
   ```

2. **Reinstall dengan build tools:**
   ```bash
   npm install sqlite3 --build-from-source --sqlite=/usr/local
   ```

3. **Cek permission database:**
   ```bash
   ls -la db.sqlite
   chmod 644 db.sqlite
   ```

4. **Cek Node.js version:**
   ```bash
   node --version
   npm --version
   ```

### Alternative: Gunakan better-sqlite3
Jika sqlite3 masih bermasalah, bisa ganti dengan better-sqlite3:

```bash
# 1. Uninstall sqlite3
npm uninstall sqlite3

# 2. Install better-sqlite3
npm install better-sqlite3

# 3. Update db.js untuk menggunakan better-sqlite3
```

## File yang Dibuat untuk Perbaikan

1. **`quick_fix_sqlite.sh`** - Script bash untuk fix cepat
2. **`fix_sqlite_error.js`** - Script Node.js untuk fix lengkap
3. **`db_fixed.js`** - Database connection yang robust
4. **`replace_db.sh`** - Script untuk mengganti db.js
5. **`SQLITE_ERROR_FIX.md`** - Dokumentasi ini

## Langkah Setelah Perbaikan

1. **Restart server:**
   ```bash
   pm2 restart all
   # atau
   node index.js
   ```

2. **Test aplikasi:**
   - Buka aplikasi Flutter
   - Test login/register
   - Test fitur database

3. **Monitor logs:**
   ```bash
   pm2 logs
   # atau
   tail -f server.log
   ```

## Backup dan Recovery

### Backup Database
```bash
# Backup database
cp db.sqlite "backup/db.sqlite.$(date +%Y%m%d_%H%M%S)"

# Backup seluruh folder backend
tar -czf "backup/backend_$(date +%Y%m%d_%H%M%S).tar.gz" .
```

### Recovery Database
```bash
# Restore database dari backup
cp backup/db.sqlite.backup.20240730_143000 db.sqlite

# Restore seluruh backend
tar -xzf backup/backend_20240730_143000.tar.gz
```

## Tips Pencegahan

1. **Selalu backup sebelum update**
2. **Gunakan environment yang sama untuk development dan production**
3. **Test di VPS sebelum deploy ke production**
4. **Monitor disk space dan permission**
5. **Gunakan PM2 untuk process management**

## Support

Jika masih mengalami masalah:
1. Cek logs: `pm2 logs` atau `tail -f server.log`
2. Cek disk space: `df -h`
3. Cek memory: `free -h`
4. Cek process: `ps aux | grep node` 