# 👥 Fitur Teman ReportIn

## 📋 **Ringkasan Fitur**

ReportIn sekarang memiliki fitur teman yang lengkap dengan sistem pertemanan dan chat real-time. Fitur ini memungkinkan user untuk:

- **Mencari dan menambahkan teman**
- **Mengirim dan menerima request pertemanan**
- **Melihat daftar teman**
- **Melakukan chat dengan teman**
- **Melihat status online/offline teman**

## 🗄️ **Database Schema**

### **1. Users Table (Updated)**
```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  avatar TEXT DEFAULT NULL,
  status TEXT DEFAULT 'offline',
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### **2. Friendships Table**
```sql
CREATE TABLE IF NOT EXISTS friendships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  friend_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'rejected', 'blocked')) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users (id) ON DELETE CASCADE,
  UNIQUE(user_id, friend_id)
)
```

### **3. Friend Requests Table**
```sql
CREATE TABLE IF NOT EXISTS friend_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id INTEGER NOT NULL,
  to_user_id INTEGER NOT NULL,
  message TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (to_user_id) REFERENCES users (id) ON DELETE CASCADE,
  UNIQUE(from_user_id, to_user_id)
)
```

### **4. Chats Table**
```sql
CREATE TABLE IF NOT EXISTS chats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  friend_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text', 'image', 'file')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users (id) ON DELETE CASCADE
)
```

## 🔧 **API Endpoints**

### **Friend Management**

#### **1. Get All Friends**
```http
GET /api/friends
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://example.com/avatar.jpg",
      "status": "online",
      "last_seen": "2024-01-15T10:30:00Z",
      "friendship_date": "2024-01-10T15:20:00Z"
    }
  ]
}
```

#### **2. Search Users**
```http
GET /api/users/search?q=john
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://example.com/avatar.jpg",
      "status": "online",
      "relationship_status": "none"
    }
  ]
}
```

#### **3. Send Friend Request**
```http
POST /api/friends/request
Authorization: Bearer <token>
Content-Type: application/json

{
  "to_user_id": 2,
  "message": "Halo! Mari berteman!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Request pertemanan berhasil dikirim"
}
```

#### **4. Get Friend Requests**
```http
GET /api/friends/requests
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "message": "Halo! Mari berteman!",
      "created_at": "2024-01-15T10:30:00Z",
      "from_user_id": 2,
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://example.com/avatar.jpg",
      "status": "online"
    }
  ]
}
```

#### **5. Accept/Reject Friend Request**
```http
PUT /api/friends/request/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "accept"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Request pertemanan diterima"
}
```

### **Chat System**

#### **1. Get Chat Messages**
```http
GET /api/chat/2
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "message": "Halo! Apa kabar?",
      "message_type": "text",
      "is_read": true,
      "created_at": "2024-01-15T10:30:00Z",
      "sender_id": 2,
      "sender_name": "John Doe",
      "sender_avatar": "https://example.com/avatar.jpg"
    }
  ]
}
```

#### **2. Send Chat Message**
```http
POST /api/chat/2
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Kabarku baik, terima kasih!",
  "message_type": "text"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pesan berhasil dikirim",
  "data": {
    "id": 2,
    "message": "Kabarku baik, terima kasih!",
    "message_type": "text",
    "created_at": "2024-01-15T10:35:00Z"
  }
}
```

#### **3. Get Unread Message Count**
```http
GET /api/chat/unread/count
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "friend_id": 2,
      "count": 3
    }
  ]
}
```

## 📱 **Frontend Features**

### **1. Friends Page**
- **Tab 1: Daftar Teman** - Menampilkan semua teman dengan status online/offline
- **Tab 2: Cari Teman** - Pencarian user untuk menambahkan teman
- **Tab 3: Request** - Menampilkan dan mengelola request pertemanan

### **2. Chat Page**
- **Real-time messaging** - Kirim dan terima pesan
- **Message history** - Riwayat percakapan
- **Read status** - Status pesan sudah dibaca
- **User status** - Status online/offline teman
- **Auto-scroll** - Otomatis scroll ke pesan terbaru

### **3. Dashboard Integration**
- **Quick Action** - Menu Teman di dashboard
- **Notification badge** - Badge untuk request yang belum dibaca
- **Easy navigation** - Navigasi mudah ke fitur teman

## 🎯 **User Flow**

### **Menambahkan Teman:**
1. User membuka halaman Teman
2. Pilih tab "Cari Teman"
3. Ketik nama atau email user yang dicari
4. Klik tombol "Tambah" pada user yang diinginkan
5. Opsional: Tambahkan pesan request
6. Klik "Kirim" untuk mengirim request

### **Menerima Request Pertemanan:**
1. User membuka halaman Teman
2. Pilih tab "Request" (dengan badge jika ada request)
3. Lihat daftar request pertemanan
4. Klik "Terima" atau "Tolak"
5. Jika diterima, user akan menjadi teman

### **Chat dengan Teman:**
1. User membuka halaman Teman
2. Pilih tab "Daftar Teman"
3. Klik icon chat pada teman yang diinginkan
4. Mulai percakapan
5. Pesan akan otomatis tersimpan dan dapat dibaca

## 🔒 **Security Features**

### **1. Authentication**
- Semua endpoint memerlukan JWT token
- Token validation di setiap request
- User hanya bisa mengakses data miliknya

### **2. Friendship Validation**
- User hanya bisa chat dengan teman yang sudah diterima
- Request pertemanan tidak bisa dikirim ke diri sendiri
- Duplikasi request pertemanan dicegah

### **3. Data Privacy**
- User hanya bisa melihat data teman yang sudah diterima
- Pesan chat hanya bisa diakses oleh kedua belah pihak
- Avatar dan data pribadi terlindungi

## 📊 **Performance Optimizations**

### **1. Database Indexes**
```sql
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id, status)
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id, status)
CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON friend_requests(from_user_id, status)
CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON friend_requests(to_user_id, status)
CREATE INDEX IF NOT EXISTS idx_chats_users ON chats(user_id, friend_id)
CREATE INDEX IF NOT EXISTS idx_chats_created ON chats(created_at DESC)
CREATE INDEX IF NOT EXISTS idx_chats_unread ON chats(is_read, friend_id)
```

### **2. Caching**
- Cache daftar teman untuk performa lebih baik
- Cache hasil pencarian user
- Lazy loading untuk pesan chat

### **3. Pagination**
- Limit 20 hasil pencarian user
- Limit 100 pesan chat per request
- Pagination untuk riwayat chat yang panjang

## 🚀 **Deployment Checklist**

### **Before Deploying:**
- [ ] Run database migration untuk tabel baru
- [ ] Test semua API endpoints
- [ ] Test fitur pencarian user
- [ ] Test sistem request pertemanan
- [ ] Test fitur chat
- [ ] Test error handling

### **After Deploying:**
- [ ] Monitor database performance
- [ ] Monitor chat message delivery
- [ ] Monitor friend request notifications
- [ ] Test user experience flow

## 📝 **Future Enhancements**

### **Planned Features:**
- [ ] Real-time notifications dengan WebSocket
- [ ] File sharing dalam chat
- [ ] Voice messages
- [ ] Group chat
- [ ] Message reactions
- [ ] Message deletion
- [ ] User blocking
- [ ] Chat backup/export

### **Technical Improvements:**
- [ ] WebSocket untuk real-time chat
- [ ] Push notifications
- [ ] Message encryption
- [ ] Media upload untuk avatar
- [ ] Chat search functionality
- [ ] Message threading

---

**Fitur Teman telah berhasil diimplementasikan! User sekarang dapat berteman dan chat dengan mudah! 👥✅** 