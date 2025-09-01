# 🚀 Panduan Update Server Lokal ReportIn

## 📋 **Overview**

Script update lokal memungkinkan Anda untuk melakukan update server ReportIn secara otomatis dengan fitur:
- ✅ Backup database otomatis
- ✅ Update dependensi npm
- ✅ Update dari Git repository
- ✅ Jalankan migrasi database
- ✅ Restart server otomatis
- ✅ Test koneksi server

## 🛠️ **Script yang Tersedia**

### **Linux/macOS**
```bash
./update_local_server.sh [--force] [--backup]
```

### **Windows**
```cmd
update_local_server.bat [--force] [--backup]
```

## 📁 **Struktur File**

```
backend/
├── update_local_server.sh      # Script Linux/macOS
├── update_local_server.bat     # Script Windows
├── backups/                    # Folder backup database
│   ├── db_backup_20250730_115748.sqlite
│   └── package.json.backup
├── update.log                  # Log update
└── server.log                  # Log server
```

## 🚀 **Cara Penggunaan**

### **1. Update Lengkap (Default)**
```bash
# Linux/macOS
cd backend
chmod +x update_local_server.sh
./update_local_server.sh

# Windows
cd backend
update_local_server.bat
```

### **2. Backup Saja**
```bash
# Linux/macOS
./update_local_server.sh --backup

# Windows
update_local_server.bat --backup
```

### **3. Update Paksa**
```bash
# Linux/macOS
./update_local_server.sh --force

# Windows
update_local_server.bat --force
```

## 📊 **Proses Update**

### **1. Backup Database**
- ✅ Backup `db.sqlite` ke folder `backups/`
- ✅ Backup `package.json` untuk safety
- ✅ Timestamp otomatis untuk setiap backup

### **2. Stop Server**
- ✅ Cari dan hentikan proses Node.js yang berjalan
- ✅ Force kill jika diperlukan
- ✅ Konfirmasi server berhasil dihentikan

### **3. Update dari Git**
- ✅ Stash perubahan lokal
- ✅ Pull latest changes dari `main` atau `master`
- ✅ Apply stashed changes kembali

### **4. Update Dependencies**
- ✅ `npm install --production`
- ✅ Update semua package yang ada di `package.json`

### **5. Database Migrations**
- ✅ Jalankan `init_db.js`
- ✅ Jalankan semua script `add_*.js` dan `fix_*.js`
- ✅ Migrasi database otomatis

### **6. Start Server**
- ✅ Start server di background
- ✅ Log ke `server.log`
- ✅ Konfirmasi server berjalan

### **7. Test Server**
- ✅ Test endpoint `/api/status`
- ✅ Konfirmasi server berfungsi

## 🔧 **Troubleshooting**

### **Server Tidak Start**
```bash
# Cek log server
tail -f server.log

# Cek port yang digunakan
netstat -tulpn | grep :5005

# Kill proses yang menggunakan port
sudo kill -9 $(lsof -t -i:5005)
```

### **Database Error**
```bash
# Restore dari backup
cp backups/db_backup_YYYYMMDD_HHMMSS.sqlite db.sqlite

# Reset database
npm run reset-db
```

### **Dependencies Error**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### **Git Error**
```bash
# Reset Git repository
git reset --hard HEAD
git clean -fd

# Atau clone ulang
cd ..
rm -rf backend
git clone <repository-url> backend
```

## 📱 **Integrasi dengan Flutter**

### **Update API Service**
Setelah update server, pastikan aplikasi Flutter menggunakan URL yang benar:

```dart
// lib/api_service.dart
static const String localUrl = 'http://localhost:5005/api';
static const String baseUrl = localUrl; // Untuk development lokal
```

### **Test Aplikasi**
```bash
# Jalankan aplikasi Flutter
cd ../reportin
flutter run -d chrome

# Atau untuk mobile
flutter run -d android
flutter run -d ios
```

## 🔄 **Automated Update**

### **Cron Job (Linux/macOS)**
```bash
# Edit crontab
crontab -e

# Tambahkan untuk update otomatis setiap hari jam 2 pagi
0 2 * * * cd /path/to/ReportIn/backend && ./update_local_server.sh
```

### **Task Scheduler (Windows)**
1. Buka Task Scheduler
2. Create Basic Task
3. Set schedule (misal: Daily at 2:00 AM)
4. Action: Start a program
5. Program: `cmd.exe`
6. Arguments: `/c "cd /d C:\path\to\ReportIn\backend && update_local_server.bat"`

## 📊 **Monitoring**

### **Check Server Status**
```bash
# Cek apakah server berjalan
ps aux | grep "node.*index.js"

# Cek log real-time
tail -f server.log

# Test API
curl http://localhost:5005/api/status
```

### **Check Backup**
```bash
# List backup files
ls -la backups/

# Restore dari backup tertentu
cp backups/db_backup_20250730_115748.sqlite db.sqlite
```

## 🎯 **Best Practices**

### **1. Backup Regular**
- ✅ Jalankan backup sebelum update besar
- ✅ Simpan backup di lokasi aman
- ✅ Test restore dari backup

### **2. Update Staging**
- ✅ Test update di environment staging
- ✅ Verifikasi semua fitur berfungsi
- ✅ Update production setelah testing

### **3. Monitoring**
- ✅ Monitor log server secara regular
- ✅ Set up alerting untuk error
- ✅ Track performance metrics

### **4. Version Control**
- ✅ Commit perubahan sebelum update
- ✅ Tag release untuk rollback
- ✅ Document breaking changes

## 📞 **Support**

Jika mengalami masalah:

1. **Cek log files:**
   - `server.log` - Log server
   - `update.log` - Log update script

2. **Restart manual:**
   ```bash
   cd backend
   npm start
   ```

3. **Reset database:**
   ```bash
   npm run reset-db
   ```

4. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

**Note:** Script update lokal ini dirancang untuk development dan testing. Untuk production, gunakan deployment pipeline yang proper dengan staging environment. 