# 🚀 Setup Server Lokal ReportIn

## 📋 **Konfigurasi IP Dinamis**

Server sekarang mendukung IP dinamis yang terdeteksi secara otomatis:

### 🌐 **IP Dinamis (Otomatis)**
- Server akan mendeteksi semua interface jaringan
- IP akan ditampilkan saat server start
- Prioritas: WiFi > Ethernet > Lainnya

### 🏠 **IP Standar (Tetap)**
- `http://localhost:5005/`
- `http://127.0.0.1:5005/`

## ⚡ **Cara Menjalankan Server**

### 1. **Buka Terminal di Folder Backend**
```bash
cd /Users/darulizza/ReportIn/backend
```

### 2. **Jalankan Server**
```bash
npm start
```

### 3. **Server akan Menampilkan IP Dinamis**
```
🚀 Server running on dynamic IPs:
   - Primary: http://192.168.1.100:5005/
   - Localhost: http://localhost:5005/
   - 127.0.0.1: http://127.0.0.1:5005/
📋 Available network interfaces:
   1. en0: http://192.168.1.100:5005/
   2. en1: http://192.168.1.101:5005/
```

## 🔧 **Troubleshooting**

### **Jika Port 5005 Sudah Digunakan:**
```bash
# Cek proses yang menggunakan port 5005
netstat -ano | findstr :5005

# Kill proses (ganti PID dengan nomor proses)
taskkill /PID <PID> /F
```

### **Test Koneksi:**
```bash
# Test IP dinamis (ganti dengan IP yang ditampilkan)
curl http://192.168.1.100:5005/api/status

# Test localhost
curl http://localhost:5005/api/status
```

### **Jika Firewall Memblokir:**
1. Buka Windows Defender Firewall
2. Tambahkan exception untuk port 5005
3. Atau nonaktifkan firewall sementara untuk testing

## 📱 **Aplikasi Flutter**

Aplikasi Flutter sudah dikonfigurasi untuk menggunakan IP dinamis di `api_service.dart`:

```dart
// IP akan terdeteksi secara otomatis
static const String localUrl = 'http://localhost:5005/api';
static const String baseUrl = localUrl; // Menggunakan IP lokal
```

## 🔄 **Switch antara IP Dinamis dan Static**

### **Untuk Menggunakan IP Dinamis (Default):**
Server akan otomatis mendeteksi IP saat start:
```bash
npm start
```

### **Untuk Menggunakan IP Static:**
Edit `api_service.dart`:
```dart
static const String baseUrl = 'http://192.168.1.100:5005/api'; // IP static
```

## ✅ **Verifikasi Server Berjalan**

Setelah menjalankan `npm start`, Anda akan melihat:

```
✅ Database connection loaded in routes
✅ Routes loaded successfully
✅ Error handler loaded successfully
🚀 Server running on dynamic IPs:
   - Primary: http://192.168.1.100:5005/
   - Localhost: http://localhost:5005/
   - 127.0.0.1: http://127.0.0.1:5005/
📋 Available network interfaces:
   1. en0: http://192.168.1.100:5005/
   2. en1: http://192.168.1.101:5005/
📋 Available endpoints:
   - Homepage: http://192.168.1.100:5005/
   - API Root: http://192.168.1.100:5005/api
   - API Status: http://192.168.1.100:5005/api/status
🔗 App routes: /api/register, /api/login, /api/transactions
🌐 Dynamic IP detection enabled
```

## 🎯 **Langkah Selanjutnya**

1. **Jalankan server backend:** `npm start`
2. **Catat IP yang ditampilkan** untuk akses dari perangkat lain
3. **Jalankan aplikasi Flutter:** `flutter run -d chrome`
4. **Test registrasi/login** di aplikasi
5. **Test fitur teman dan chat** jika sudah login

## 🔍 **Deteksi IP Manual**

Jika ingin melihat IP yang tersedia secara manual:

```bash
# Di macOS/Linux
ifconfig

# Di Windows
ipconfig

# Atau gunakan Node.js
node -e "console.log(require('os').networkInterfaces())"
```

---

**Note:** Server sekarang mendukung IP dinamis, jadi Anda bisa mengakses dari perangkat manapun dalam jaringan yang sama menggunakan IP yang ditampilkan saat server start! 