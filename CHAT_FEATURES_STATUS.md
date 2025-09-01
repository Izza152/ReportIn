# 💬 Chat Features Status ReportIn

## 📋 **Overview**

Sistem chat ReportIn sekarang mendukung fitur unread/read status dengan notifikasi real-time yang lengkap.

## ✅ **Fitur yang Tersedia**

### **1. Real-time Messaging**
- ✅ Pesan instan antar pengguna
- ✅ Typing indicator (sedang mengetik)
- ✅ Online/offline status
- ✅ Message delivery confirmation

### **2. Read Status System**
- ✅ **Unread Status**: Pesan belum dibaca (ceklist 1)
- ✅ **Read Status**: Pesan sudah dibaca (ceklist 2)
- ✅ **Auto Read**: Otomatis read saat user buka chat
- ✅ **Manual Read**: Manual mark as read

### **3. Chat Status Tracking**
- ✅ **Chat Open**: User sedang buka chat dengan teman
- ✅ **Chat Close**: User tutup chat
- ✅ **In Chat Detection**: Deteksi apakah user sedang di chat tertentu

### **4. Unread Count**
- ✅ **Real-time Count**: Update jumlah unread secara real-time
- ✅ **Per User Count**: Count unread per teman
- ✅ **Global Count**: Total unread untuk semua chat

## 🔧 **Database Schema**

### **Chats Table**
```sql
CREATE TABLE chats (
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
);
```

### **Indexes**
- `idx_chats_sender_id` - Untuk query pesan yang dikirim
- `idx_chats_receiver_id` - Untuk query pesan yang diterima
- `idx_chats_created_at` - Untuk sorting berdasarkan waktu
- `idx_chats_is_read` - Untuk query unread messages
- `idx_chats_sender_receiver` - Untuk query chat antara 2 user

## 🌐 **WebSocket Events**

### **Client to Server**
```javascript
// Send message
{
  type: 'chat_message',
  data: {
    receiverId: 123,
    message: 'Hello!',
    messageType: 'text'
  }
}

// Open chat
{
  type: 'chat_open',
  data: {
    chatWithUserId: 123
  }
}

// Close chat
{
  type: 'chat_close',
  data: {
    chatWithUserId: 123
  }
}

// Get unread count
{
  type: 'get_unread_count',
  data: {
    senderId: 123
  }
}

// Read receipt
{
  type: 'read_receipt',
  data: {
    messageId: '1234567890_abc123',
    senderId: 123
  }
}
```

### **Server to Client**
```javascript
// New message received
{
  type: 'new_message',
  data: {
    messageId: '1234567890_abc123',
    senderId: 123,
    message: 'Hello!',
    messageType: 'text',
    timestamp: '2025-07-30T12:00:00.000Z',
    readStatus: 'unread',
    isOnline: true,
    isInChat: false
  }
}

// Message sent confirmation
{
  type: 'message_sent',
  data: {
    messageId: '1234567890_abc123',
    receiverId: 456,
    message: 'Hello!',
    messageType: 'text',
    timestamp: '2025-07-30T12:00:00.000Z',
    readStatus: 'unread',
    receiverOnline: true,
    receiverInChat: false
  }
}

// Read receipt
{
  type: 'read_receipt',
  data: {
    messageId: '1234567890_abc123',
    readBy: 456,
    timestamp: '2025-07-30T12:01:00.000Z',
    readStatus: 'read'
  }
}

// Unread count update
{
  type: 'unread_count_update',
  data: {
    senderId: 123,
    unreadCount: 5,
    timestamp: '2025-07-30T12:00:00.000Z'
  }
}

// Chat opened notification
{
  type: 'chat_opened',
  data: {
    userId: 456,
    timestamp: '2025-07-30T12:00:00.000Z'
  }
}
```

## 📱 **Flutter Integration**

### **WebSocket Connection**
```dart
// Connect to WebSocket
WebSocketChannel channel = WebSocketChannel.connect(
  Uri.parse('ws://localhost:5005?token=$userToken'),
);

// Listen for messages
channel.stream.listen((message) {
  final data = jsonDecode(message);
  handleWebSocketMessage(data);
});
```

### **Send Message**
```dart
// Send chat message
channel.sink.add(jsonEncode({
  'type': 'chat_message',
  'data': {
    'receiverId': friendId,
    'message': messageText,
    'messageType': 'text'
  }
}));
```

### **Open Chat**
```dart
// Notify server when opening chat
channel.sink.add(jsonEncode({
  'type': 'chat_open',
  'data': {
    'chatWithUserId': friendId
  }
}));
```

### **Handle Read Receipt**
```dart
// Send read receipt
channel.sink.add(jsonEncode({
  'type': 'read_receipt',
  'data': {
    'messageId': messageId,
    'senderId': senderId
  }
}));
```

## 🎯 **Read Status Logic**

### **Auto Read Conditions**
1. **User Online** + **In Chat** = Auto Read
2. **User Online** + **Not In Chat** = Unread
3. **User Offline** = Unread

### **Manual Read**
- User buka chat → Mark all messages as read
- User send read receipt → Mark specific message as read

### **Status Indicators**
- **Ceklist 1** (✓): Message sent, not delivered
- **Ceklist 2** (✓✓): Message delivered and read

## 🔄 **Real-time Updates**

### **Message Flow**
1. **User A** kirim pesan ke **User B**
2. **Server** terima pesan dan generate message ID
3. **Server** cek status User B:
   - Online + In Chat = Read
   - Online + Not In Chat = Unread
   - Offline = Unread
4. **Server** kirim pesan ke User B dengan status
5. **Server** kirim konfirmasi ke User A dengan status

### **Read Status Flow**
1. **User B** buka chat dengan User A
2. **Client** kirim `chat_open` event
3. **Server** mark semua pesan sebagai read
4. **Server** kirim `read_receipt` ke User A
5. **User A** terima notifikasi pesan sudah dibaca

## 📊 **API Endpoints**

### **Chat Messages**
- `GET /api/chat/:friendId` - Get chat messages
- `POST /api/chat/:friendId` - Send message
- `GET /api/chat/unread/count` - Get unread count
- `GET /api/chat/unread/:friendId` - Get unread count per friend

### **WebSocket Events**
- `chat_message` - Send/receive message
- `chat_open` - Open chat
- `chat_close` - Close chat
- `read_receipt` - Mark as read
- `typing_start` - Start typing
- `typing_stop` - Stop typing

## 🎨 **UI Indicators**

### **Message Status**
```dart
// Unread message
Icon(Icons.check, color: Colors.grey, size: 16)

// Read message
Icon(Icons.done_all, color: Colors.blue, size: 16)

// Unread count badge
Container(
  decoration: BoxDecoration(
    color: Colors.red,
    borderRadius: BorderRadius.circular(10),
  ),
  child: Text('$unreadCount', style: TextStyle(color: Colors.white)),
)
```

### **Typing Indicator**
```dart
// Show typing indicator
Row(
  children: [
    Text('$friendName is typing'),
    SizedBox(width: 8),
    AnimatedContainer(
      duration: Duration(milliseconds: 500),
      child: Text('...'),
    ),
  ],
)
```

## 🚀 **Testing**

### **Test WebSocket Connection**
```bash
# Test connection
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" \
  http://localhost:5005
```

### **Test Chat Features**
1. **Start server**: `npm start`
2. **Open chat** di 2 browser berbeda
3. **Send message** dari user A ke user B
4. **Check status** unread/read
5. **Open chat** di user B
6. **Verify** status berubah menjadi read

## 📈 **Performance**

### **Optimizations**
- ✅ **Indexed queries** untuk unread count
- ✅ **Connection pooling** untuk WebSocket
- ✅ **Message batching** untuk multiple messages
- ✅ **Efficient read status** updates

### **Monitoring**
- ✅ **Connection count** tracking
- ✅ **Message delivery** statistics
- ✅ **Read status** accuracy
- ✅ **Error handling** dan recovery

---

**Status**: ✅ **Fully Implemented** - Chat system dengan unread/read status siap digunakan! 