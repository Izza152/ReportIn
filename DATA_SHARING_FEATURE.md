# 💰 Fitur Berbagi Data Keuangan ReportIn

## 📋 **Ringkasan Fitur**

ReportIn sekarang memiliki fitur berbagi data keuangan yang aman dan terkontrol. Setelah berteman, user dapat berbagi data keuangan mereka dengan teman sesuai dengan tingkat privasi yang diinginkan.

### **Fitur Utama:**
- **Berbagi data keuangan dengan teman** - Kontrol penuh atas data yang dibagikan
- **5 tingkat privasi** - Dari tidak berbagi hingga semua data
- **Pengaturan per-teman** - Setiap teman dapat memiliki pengaturan berbeda
- **Keamanan data** - Hanya teman yang sudah diterima yang bisa melihat data
- **Real-time updates** - Data yang dibagikan selalu up-to-date

## 🗄️ **Database Schema**

### **1. Data Sharing Table**
```sql
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
```

### **2. Shared Transactions Table**
```sql
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
```

## 🔧 **API Endpoints**

### **Data Sharing Management**

#### **1. Get Data Sharing Settings**
```http
GET /api/data-sharing/:friendId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "friend_id": 2,
    "share_type": "summary",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

#### **2. Update Data Sharing Settings**
```http
PUT /api/data-sharing/:friendId
Authorization: Bearer <token>
Content-Type: application/json

{
  "share_type": "summary",
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pengaturan berbagi data berhasil diperbarui"
}
```

#### **3. Get Shared Data from Friends**
```http
GET /api/shared-data
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "share_type": "summary",
      "is_active": true,
      "friend_id": 2,
      "friend_name": "John Doe",
      "friend_email": "john@example.com",
      "friend_avatar": "https://example.com/avatar.jpg",
      "friend_status": "online"
    }
  ]
}
```

#### **4. Get Detailed Shared Data from Friend**
```http
GET /api/shared-data/:friendId
Authorization: Bearer <token>
```

**Response (Summary):**
```json
{
  "success": true,
  "data": [
    {
      "type": "summary",
      "total_income": 5000000,
      "total_expense": 3000000,
      "total_transactions": 25,
      "income_count": 10,
      "expense_count": 15
    }
  ],
  "share_type": "summary"
}
```

**Response (Transactions):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "income",
      "amount": 500000,
      "description": "Gaji Bulanan",
      "date": "2024-01-15",
      "created_at": "2024-01-15T10:30:00Z",
      "category_name": "Gaji",
      "category_color": "#3B82F6"
    }
  ],
  "share_type": "all"
}
```

#### **5. Get Friends Who Can See Your Data**
```http
GET /api/data-sharing/visible-to
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "share_type": "summary",
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z",
      "friend_id": 2,
      "friend_name": "John Doe",
      "friend_email": "john@example.com",
      "friend_avatar": "https://example.com/avatar.jpg",
      "friend_status": "online"
    }
  ]
}
```

## 📱 **Frontend Features**

### **1. Data Sharing Settings Page**
- **Friend info card** - Informasi teman yang akan dibagikan data
- **Active toggle** - Aktifkan/nonaktifkan berbagi data
- **Share type selection** - Pilih tipe data yang dibagikan
- **Real-time preview** - Preview data yang akan dibagikan
- **Save settings** - Simpan pengaturan berbagi data

### **2. Friend Financial Data Page**
- **Friend info display** - Informasi teman dan tipe data yang dibagikan
- **Summary view** - Tampilan ringkasan keuangan (total pemasukan/pengeluaran)
- **Transaction list** - Daftar transaksi sesuai tipe yang dibagikan
- **Real-time data** - Data selalu up-to-date
- **Error handling** - Handling untuk data yang tidak dapat diakses

### **3. Friends Page Integration**
- **Friend options menu** - Menu opsi untuk setiap teman
- **Quick access** - Akses cepat ke data keuangan teman
- **Settings access** - Akses ke pengaturan berbagi data
- **Visual indicators** - Indikator visual untuk status berbagi data

## 🎯 **Tingkat Privasi Data**

### **1. None (Tidak Berbagi)**
- ❌ **Teman tidak dapat melihat data keuangan**
- ✅ **Privasi maksimal**
- ✅ **Default setting untuk teman baru**

### **2. Summary (Ringkasan)**
- ✅ **Total pemasukan dan pengeluaran**
- ✅ **Jumlah transaksi**
- ❌ **Detail transaksi tidak terlihat**
- ✅ **Cocok untuk overview keuangan**

### **3. Income (Pemasukan)**
- ✅ **Semua data pemasukan**
- ✅ **Detail transaksi pemasukan**
- ❌ **Data pengeluaran tidak terlihat**
- ✅ **Cocok untuk berbagi prestasi**

### **4. Expense (Pengeluaran)**
- ✅ **Semua data pengeluaran**
- ✅ **Detail transaksi pengeluaran**
- ❌ **Data pemasukan tidak terlihat**
- ✅ **Cocok untuk berbagi pengalaman**

### **5. All (Semua Data)**
- ✅ **Semua data keuangan**
- ✅ **Detail semua transaksi**
- ✅ **Akses penuh ke data keuangan**
- ⚠️ **Hanya untuk teman yang sangat dipercaya**

## 🔒 **Security Features**

### **1. Friendship Validation**
- ✅ **Hanya teman yang sudah diterima** yang bisa berbagi data
- ✅ **Validasi friendship status** di setiap request
- ✅ **Mencegah akses dari non-friend**

### **2. Data Privacy**
- ✅ **Kontrol penuh user** atas data yang dibagikan
- ✅ **Pengaturan per-teman** yang berbeda
- ✅ **Dapat dinonaktifkan** kapan saja
- ✅ **Data tidak tersimpan** di tempat lain

### **3. Access Control**
- ✅ **JWT token validation** untuk setiap request
- ✅ **User hanya bisa akses** data yang diizinkan
- ✅ **Audit trail** untuk aktivitas berbagi data

## 📊 **Performance Optimizations**

### **1. Database Indexes**
```sql
CREATE INDEX IF NOT EXISTS idx_data_sharing_user ON data_sharing(user_id, is_active)
CREATE INDEX IF NOT EXISTS idx_data_sharing_friend ON data_sharing(friend_id, is_active)
CREATE INDEX IF NOT EXISTS idx_data_sharing_type ON data_sharing(share_type, is_active)
CREATE INDEX IF NOT EXISTS idx_shared_transactions_by ON shared_transactions(shared_by_user_id)
CREATE INDEX IF NOT EXISTS idx_shared_transactions_with ON shared_transactions(shared_with_user_id)
CREATE INDEX IF NOT EXISTS idx_shared_transactions_original ON shared_transactions(original_transaction_id)
```

### **2. Caching Strategy**
- ✅ **Cache pengaturan berbagi data** untuk performa lebih baik
- ✅ **Lazy loading** untuk data transaksi
- ✅ **Pagination** untuk data yang besar

### **3. Query Optimization**
- ✅ **Efficient JOIN queries** untuk data teman
- ✅ **Indexed lookups** untuk pengaturan berbagi
- ✅ **Limited result sets** untuk performa

## 🎯 **User Flow**

### **Mengatur Berbagi Data:**
1. User membuka halaman Teman
2. Pilih teman yang ingin diatur
3. Klik "Pengaturan Berbagi Data"
4. Aktifkan toggle "Aktifkan Berbagi Data"
5. Pilih tipe data yang dibagikan
6. Klik "Simpan Pengaturan"

### **Melihat Data Teman:**
1. User membuka halaman Teman
2. Pilih teman yang ingin dilihat datanya
3. Klik "Lihat Data Keuangan"
4. Lihat data sesuai pengaturan yang diizinkan
5. Refresh untuk data terbaru

### **Mengelola Privasi:**
1. User membuka halaman Teman
2. Pilih teman yang ingin diatur privasinya
3. Klik "Pengaturan Berbagi Data"
4. Ubah tipe data atau nonaktifkan berbagi
5. Simpan perubahan

## 🚀 **Deployment Checklist**

### **Before Deploying:**
- [ ] Run database migration untuk tabel data sharing
- [ ] Test semua API endpoints data sharing
- [ ] Test pengaturan berbagi data
- [ ] Test akses data teman
- [ ] Test security validation
- [ ] Test error handling

### **After Deploying:**
- [ ] Monitor data sharing activity
- [ ] Monitor database performance
- [ ] Monitor user privacy settings
- [ ] Test user experience flow

## 📝 **Future Enhancements**

### **Planned Features:**
- [ ] **Temporary sharing** - Berbagi data untuk waktu tertentu
- [ ] **Group sharing** - Berbagi data dengan grup teman
- [ ] **Data export** - Export data yang dibagikan
- [ ] **Sharing analytics** - Analisis aktivitas berbagi data
- [ ] **Privacy notifications** - Notifikasi perubahan privasi

### **Technical Improvements:**
- [ ] **Real-time updates** - WebSocket untuk update real-time
- [ ] **Data encryption** - Enkripsi data yang dibagikan
- [ ] **Audit logging** - Log lengkap aktivitas berbagi
- [ ] **Backup sharing** - Backup data yang dibagikan
- [ ] **Advanced privacy** - Pengaturan privasi yang lebih detail

## 🔧 **Troubleshooting**

### **Common Issues:**

#### **1. Data tidak terlihat**
- ✅ **Check friendship status** - Pastikan sudah berteman
- ✅ **Check sharing settings** - Pastikan data dibagikan
- ✅ **Check active status** - Pastikan berbagi data aktif

#### **2. Pengaturan tidak tersimpan**
- ✅ **Check token validity** - Pastikan token masih valid
- ✅ **Check network connection** - Pastikan koneksi stabil
- ✅ **Check server status** - Pastikan server berjalan

#### **3. Data tidak up-to-date**
- ✅ **Refresh data** - Pull to refresh
- ✅ **Check last update** - Lihat waktu update terakhir
- ✅ **Check sharing type** - Pastikan tipe data benar

---

**Fitur Berbagi Data Keuangan telah berhasil diimplementasikan! User sekarang dapat berbagi data keuangan dengan aman dan terkontrol! 💰✅** 