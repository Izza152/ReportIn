const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // Map untuk menyimpan client connections
    this.userSessions = new Map(); // Map untuk menyimpan user sessions
    
    this.initialize();
  }

  // Helper function untuk menyensor isi pesan
  sanitizeMessage(message, maxLength = 20) {
    if (!message) return '[empty message]';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  }

  // Helper function untuk log yang aman
  logChatActivity(action, senderId, receiverId, messageType = 'text', messageLength = 0, messagePreview = '') {
    console.log(`💬 ${action} from ${senderId} to ${receiverId}: [${messageType}] [${messageLength} chars] "${messagePreview}"`);
  }

  initialize() {
    console.log('🔌 WebSocket Server initialized');
    
    this.wss.on('connection', (ws, req) => {
      console.log('🔗 New WebSocket connection');
      
      // Authenticate connection
      this.authenticateConnection(ws, req);
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      });
      
      ws.on('close', () => {
        this.handleDisconnection(ws);
      });
      
      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        this.handleDisconnection(ws);
      });
    });
  }

  authenticateConnection(ws, req) {
    // Extract token from query parameters or headers
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token') || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ No token provided for WebSocket connection');
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
      
      // Store client connection
      this.clients.set(ws, {
        userId: userId,
        connectedAt: new Date(),
        isAuthenticated: true
      });
      
      // Store user session
      if (!this.userSessions.has(userId)) {
        this.userSessions.set(userId, new Set());
      }
      this.userSessions.get(userId).add(ws);
      
      console.log(`✅ User ${userId} authenticated for WebSocket`);
      
      // Update user status to online
      this.updateUserStatus(userId, 'online');
      
      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connection_established',
        userId: userId,
        timestamp: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error('❌ WebSocket authentication failed:', error);
      ws.close(1008, 'Invalid token');
    }
  }

  handleMessage(ws, message) {
    const client = this.clients.get(ws);
    if (!client || !client.isAuthenticated) {
      console.log('❌ Unauthenticated message attempt');
      return;
    }

    const { type, data } = message;
    
    // Log message type tanpa menampilkan isi data sensitif
    if (type === 'chat_message') {
      const { receiverId, messageType = 'text' } = data;
      const messageLength = data.message ? data.message.length : 0;
      console.log(`📨 Received ${type} from user ${client.userId} to ${receiverId} [${messageType}] [${messageLength} chars]`);
    } else {
      console.log(`📨 Received ${type} from user ${client.userId}`);
    }
    
    switch (type) {
      case 'chat_message':
        this.handleChatMessage(client.userId, data);
        break;
      case 'typing_start':
        this.handleTypingStart(client.userId, data);
        break;
      case 'typing_stop':
        this.handleTypingStop(client.userId, data);
        break;
      case 'read_receipt':
        this.handleReadReceipt(client.userId, data);
        break;
      case 'chat_open':
        this.handleChatOpen(client.userId, data);
        break;
      case 'chat_close':
        this.handleChatClose(client.userId, data);
        break;
      case 'get_unread_count':
        this.handleGetUnreadCount(client.userId, data);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;
      default:
        console.log('❌ Unknown message type:', type);
    }
  }

  handleChatMessage(senderId, data) {
    const { receiverId, message, messageType = 'text' } = data;
    
    // Sensor isi pesan untuk privasi
    const messageLength = message ? message.length : 0;
    const messagePreview = this.sanitizeMessage(message);
    
    this.logChatActivity('Chat message', senderId, receiverId, messageType, messageLength, messagePreview);
    
    // Generate unique message ID
    const messageId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Check if receiver is online and in chat with sender
    const isReceiverOnline = this.isUserOnline(receiverId);
    const isReceiverInChat = this.isUserInChat(receiverId, senderId);
    
    // Determine read status
    let readStatus = 'unread';
    if (isReceiverOnline && isReceiverInChat) {
      readStatus = 'read';
    }
    
    // Broadcast to receiver immediately
    this.broadcastToUser(receiverId, {
      type: 'new_message',
      data: {
        messageId: messageId,
        senderId: senderId,
        message: message,
        messageType: messageType,
        timestamp: new Date().toISOString(),
        readStatus: readStatus,
        isOnline: isReceiverOnline,
        isInChat: isReceiverInChat
      }
    });
    
    // Send confirmation to sender with read status
    this.broadcastToUser(senderId, {
      type: 'message_sent',
      data: {
        messageId: messageId,
        receiverId: receiverId,
        message: message,
        messageType: messageType,
        timestamp: new Date().toISOString(),
        readStatus: readStatus,
        receiverOnline: isReceiverOnline,
        receiverInChat: isReceiverInChat
      }
    });
    
    console.log(`✅ Message broadcasted to receiver ${receiverId} (${readStatus}) and confirmation sent to sender ${senderId}`);
  }

  handleTypingStart(userId, data) {
    const { receiverId } = data;
    
    console.log(`⌨️ User ${userId} started typing to ${receiverId}`);
    
    this.broadcastToUser(receiverId, {
      type: 'typing_start',
      data: {
        senderId: userId,
        timestamp: new Date().toISOString()
      }
    });
  }

  handleTypingStop(userId, data) {
    const { receiverId } = data;
    
    console.log(`⌨️ User ${userId} stopped typing to ${receiverId}`);
    
    this.broadcastToUser(receiverId, {
      type: 'typing_stop',
      data: {
        senderId: userId,
        timestamp: new Date().toISOString()
      }
    });
  }

  handleReadReceipt(userId, data) {
    const { messageId, senderId, chatId } = data;
    
    console.log(`✅ Read receipt from ${userId} for message ${messageId}`);
    
    // Update read status in database
    this.updateMessageReadStatus(messageId, userId);
    
    // Notify sender about read receipt
    this.broadcastToUser(senderId, {
      type: 'read_receipt',
      data: {
        messageId: messageId,
        readBy: userId,
        timestamp: new Date().toISOString(),
        readStatus: 'read'
      }
    });
    
    // Update unread count for receiver
    this.updateUnreadCount(userId, senderId);
  }

  // Track user chat status
  handleChatOpen(userId, data) {
    const { chatWithUserId } = data;
    
    console.log(`📱 User ${userId} opened chat with ${chatWithUserId}`);
    
    // Mark user as in chat
    this.setUserInChat(userId, chatWithUserId, true);
    
    // Mark all messages as read
    this.markAllMessagesAsRead(userId, chatWithUserId);
    
    // Notify other user about chat opened
    this.broadcastToUser(chatWithUserId, {
      type: 'chat_opened',
      data: {
        userId: userId,
        timestamp: new Date().toISOString()
      }
    });
  }

  handleChatClose(userId, data) {
    const { chatWithUserId } = data;
    
    console.log(`📱 User ${userId} closed chat with ${chatWithUserId}`);
    
    // Mark user as not in chat
    this.setUserInChat(userId, chatWithUserId, false);
  }

  broadcastToUser(userId, message) {
    const userSessions = this.userSessions.get(userId);
    if (!userSessions) {
      console.log(`❌ No active sessions for user ${userId}`);
      return;
    }

    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    userSessions.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
        sentCount++;
      }
    });

    console.log(`📤 Sent message to user ${userId} (${sentCount} sessions)`);
  }

  handleDisconnection(ws) {
    const client = this.clients.get(ws);
    if (client) {
      const { userId } = client;
      
      // Remove from user sessions
      const userSessions = this.userSessions.get(userId);
      if (userSessions) {
        userSessions.delete(ws);
        if (userSessions.size === 0) {
          this.userSessions.delete(userId);
          console.log(`👋 User ${userId} disconnected (no more sessions)`);
          
          // Update user status to offline
          this.updateUserStatus(userId, 'offline');
        }
      }
      
      // Remove from clients
      this.clients.delete(ws);
      
      console.log(`🔌 WebSocket connection closed for user ${userId}`);
    }
  }

  // Update user status in database and notify friends
  updateUserStatus(userId, status) {
    const db = require('./db');
    const now = new Date().toISOString();
    
    const sql = `
      UPDATE users 
      SET status = ?, last_seen = ? 
      WHERE id = ?
    `;
    
    db.run(sql, [status, now, userId], (err) => {
      if (err) {
        console.error('❌ Error updating user status:', err);
      } else {
        console.log(`✅ User ${userId} status updated to ${status}`);
        
        // Notify friends about status change
        this.notifyFriendsAboutStatusChange(userId, status, now);
      }
    });
  }

  // Notify friends about user status change
  notifyFriendsAboutStatusChange(userId, status, lastSeen) {
    const db = require('./db');
    
    // Get all friends of this user
    const query = `
      SELECT u.id, u.name, u.email
      FROM friendships f
      JOIN users u ON (f.friend_id = u.id OR f.user_id = u.id)
      WHERE (f.user_id = ? OR f.friend_id = ?) 
      AND f.status = 'accepted'
      AND u.id != ?
    `;
    
    db.all(query, [userId, userId, userId], (err, friends) => {
      if (err) {
        console.error('❌ Error getting friends for status notification:', err);
        return;
      }
      
      console.log(`📢 Notifying ${friends.length} friends about user ${userId} status change to ${status}`);
      
      // Send status update to all friends
      friends.forEach(friend => {
        this.broadcastToUser(friend.id, {
          type: 'friend_status_change',
          data: {
            userId: userId,
            status: status,
            lastSeen: lastSeen,
            timestamp: new Date().toISOString()
          }
        });
      });
    });
  }

  // Public method to send message from server
  sendToUser(userId, message) {
    this.broadcastToUser(userId, message);
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.userSessions.size;
  }

  // Get all online users
  getOnlineUsers() {
    return Array.from(this.userSessions.keys());
  }

  // Check if user is online
  isUserOnline(userId) {
    const userSessions = this.userSessions.get(userId);
    return userSessions && userSessions.size > 0;
  }

  // Chat status tracking
  isUserInChat(userId, chatWithUserId) {
    const userSessions = this.userSessions.get(userId);
    if (!userSessions) return false;
    
    // Check if user has active chat session
    for (const ws of userSessions) {
      const client = this.clients.get(ws);
      if (client && client.activeChat === chatWithUserId) {
        return true;
      }
    }
    return false;
  }

  setUserInChat(userId, chatWithUserId, isInChat) {
    const userSessions = this.userSessions.get(userId);
    if (!userSessions) return;
    
    userSessions.forEach(ws => {
      const client = this.clients.get(ws);
      if (client) {
        if (isInChat) {
          client.activeChat = chatWithUserId;
        } else {
          delete client.activeChat;
        }
      }
    });
  }

  // Database operations for read status
  updateMessageReadStatus(messageId, userId) {
    const db = require('./db');
    const sql = `
      UPDATE chats 
      SET is_read = 1, read_at = datetime('now') 
      WHERE id = ? AND receiver_id = ?
    `;
    
    db.run(sql, [messageId, userId], (err) => {
      if (err) {
        console.error('❌ Error updating message read status:', err);
      } else {
        console.log(`✅ Message ${messageId} marked as read by user ${userId}`);
      }
    });
  }

  markAllMessagesAsRead(userId, senderId) {
    const db = require('./db');
    const sql = `
      UPDATE chats 
      SET is_read = 1, read_at = datetime('now') 
      WHERE receiver_id = ? AND sender_id = ? AND is_read = 0
    `;
    
    db.run(sql, [userId, senderId], function(err) {
      if (err) {
        console.error('❌ Error marking messages as read:', err);
      } else {
        console.log(`✅ Marked ${this.changes} messages as read for user ${userId}`);
      }
    });
  }

  updateUnreadCount(userId, senderId) {
    const db = require('./db');
    const sql = `
      SELECT COUNT(*) as unread_count 
      FROM chats 
      WHERE receiver_id = ? AND sender_id = ? AND is_read = 0
    `;
    
    db.get(sql, [userId, senderId], (err, row) => {
      if (err) {
        console.error('❌ Error getting unread count:', err);
      } else {
        const unreadCount = row ? row.unread_count : 0;
        
        // Send unread count update to user
        this.broadcastToUser(userId, {
          type: 'unread_count_update',
          data: {
            senderId: senderId,
            unreadCount: unreadCount,
            timestamp: new Date().toISOString()
          }
        });
      }
    });
  }

  handleGetUnreadCount(userId, data) {
    const { senderId } = data;
    
    const db = require('./db');
    const sql = `
      SELECT COUNT(*) as unread_count 
      FROM chats 
      WHERE receiver_id = ? AND sender_id = ? AND is_read = 0
    `;
    
    db.get(sql, [userId, senderId], (err, row) => {
      if (err) {
        console.error('❌ Error getting unread count:', err);
      } else {
        const unreadCount = row ? row.unread_count : 0;
        
        // Send unread count to user
        this.sendToUser(userId, {
          type: 'unread_count_response',
          data: {
            senderId: senderId,
            unreadCount: unreadCount,
            timestamp: new Date().toISOString()
          }
        });
      }
    });
  }
}

module.exports = WebSocketService; 