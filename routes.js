const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// JWT Secret with fallback
const JWT_SECRET = process.env.JWT_SECRET || 'reportin-secret-key-2024';

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'chat-image-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Ping endpoint for testing
router.get('/ping', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Try to load database - dengan error handling
let db = null;
try {
  db = require('./db');
  console.log('✅ Database connection loaded in routes');
} catch (error) {
  console.log('⚠️ Database not loaded in routes:', error.message);
  console.log('💡 Some routes may not work without database');
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Nama, email, dan password harus diisi' 
      });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Format email tidak valid' 
      });
    }
    
    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password minimal 6 karakter' 
      });
    }
    
    if (!db) {
      return res.status(500).json({ 
        success: false,
        message: 'Database tidak tersedia' 
      });
    }
    
    // Check if user exists with better error handling
    db.get('SELECT id, email FROM users WHERE email = ?', [email], async (err, existingUser) => {
      if (err) {
        console.error('❌ Database error checking existing user:', err);
        return res.status(500).json({ 
          success: false,
          message: 'Terjadi kesalahan server',
          error: 'database_error'
        });
      }
      
      if (existingUser) {
        console.log(`❌ Registration failed: Email ${email} already exists`);
        return res.status(409).json({ 
          success: false,
          message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.',
          error: 'email_exists'
        });
      }
      
      // Hash password
      let hashedPassword;
      try {
        hashedPassword = await bcrypt.hash(password, 12); // Increased salt rounds
      } catch (hashError) {
        console.error('❌ Password hashing error:', hashError);
        return res.status(500).json({ 
          success: false,
          message: 'Terjadi kesalahan server',
          error: 'hashing_error'
        });
      }
      
      // Create user
      const insertQuery = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
      db.run(insertQuery, [name, email, hashedPassword], function (err) {
        if (err) {
          console.error('❌ User creation error:', err);
          
          // Check if it's a unique constraint violation
          if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ 
              success: false,
              message: 'Email sudah terdaftar. Silakan gunakan email lain.',
              error: 'email_exists'
            });
          }
          
          return res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server',
            error: 'creation_error'
          });
        }
        
        console.log(`✅ User registered successfully: ${email} (ID: ${this.lastID})`);
        res.status(201).json({ 
          success: true,
          message: 'Registrasi berhasil! Silakan login.',
          data: {
            userId: this.lastID,
            email: email,
            name: name
          }
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Terjadi kesalahan server',
      error: 'server_error'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email dan password harus diisi' 
      });
    }
    
    if (!db) {
      return res.status(500).json({ 
        success: false,
        message: 'Database tidak tersedia' 
      });
    }
    
    db.get('SELECT id, name, email, password, phone, created_at FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.error('❌ Database error during login:', err);
        return res.status(500).json({ 
          success: false,
          message: 'Terjadi kesalahan server',
          error: 'database_error'
        });
      }
      
      if (!user) {
        console.log(`❌ Login failed: User not found for email ${email}`);
        return res.status(401).json({ 
          success: false,
          message: 'Email atau password salah',
          error: 'invalid_credentials'
        });
      }
      
      // Verify password
      let isValidPassword;
      try {
        isValidPassword = await bcrypt.compare(password, user.password);
      } catch (compareError) {
        console.error('❌ Password comparison error:', compareError);
        return res.status(500).json({ 
          success: false,
          message: 'Terjadi kesalahan server',
          error: 'password_error'
        });
      }
      
      if (!isValidPassword) {
        console.log(`❌ Login failed: Invalid password for email ${email}`);
        return res.status(401).json({ 
          success: false,
          message: 'Email atau password salah',
          error: 'invalid_credentials'
        });
      }
      
      // Generate JWT token
      let token;
      try {
        token = jwt.sign(
          { 
            id: user.id, 
            email: user.email,
            name: user.name
          }, 
          JWT_SECRET, 
          { expiresIn: '7d' } // Extended token expiry
        );
      } catch (tokenError) {
        console.error('❌ Token generation error:', tokenError);
        return res.status(500).json({ 
          success: false,
          message: 'Terjadi kesalahan server',
          error: 'token_error'
        });
      }
      
      console.log(`✅ Login successful: ${email} (ID: ${user.id})`);
      res.json({ 
        success: true,
        message: 'Login berhasil',
        data: {
          token: token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            created_at: user.created_at || ''
          }
        }
      });
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Terjadi kesalahan server',
      error: 'server_error'
    });
  }
});

// Middleware auth
function auth(req, res, next) {
  try {
    const bearer = req.headers['authorization'];
    if (!bearer) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = bearer.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Friend Routes
// Get all friends
router.get('/friends', auth, (req, res) => {
  const userId = req.user.id;
  
  const query = `
    SELECT u.id, u.name, u.email, u.avatar, u.status, u.last_seen, f.created_at as friendship_date
    FROM friendships f
    JOIN users u ON (f.friend_id = u.id OR f.user_id = u.id)
    WHERE (f.user_id = ? OR f.friend_id = ?) 
    AND f.status = 'accepted'
    AND u.id != ?
    ORDER BY u.status DESC, u.last_seen DESC
  `;
  
  db.all(query, [userId, userId, userId], (err, friends) => {
    if (err) {
      console.error('❌ Error fetching friends:', err);
      return res.status(500).json({ 
        success: false,
        message: 'Terjadi kesalahan server',
        error: 'database_error'
      });
    }
    
    res.json({
      success: true,
      data: friends
    });
  });
});

// Search users to add as friends
router.get('/users/search', auth, (req, res) => {
  const userId = req.user.id;
  const searchTerm = req.query.q || '';
  
  if (searchTerm.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Minimal 2 karakter untuk pencarian'
    });
  }
  
  const query = `
    SELECT u.id, u.name, u.email, u.avatar, u.status,
           CASE 
             WHEN f.status = 'accepted' THEN 'friend'
             WHEN f.status = 'pending' THEN 'pending'
             WHEN fr.status = 'pending' THEN 'requested'
             ELSE 'none'
           END as relationship_status
    FROM users u
    LEFT JOIN friendships f ON (f.user_id = ? AND f.friend_id = u.id) OR (f.friend_id = ? AND f.user_id = u.id)
    LEFT JOIN friend_requests fr ON (fr.from_user_id = ? AND fr.to_user_id = u.id) OR (fr.to_user_id = ? AND fr.from_user_id = u.id)
    WHERE u.id != ? 
    AND (u.name LIKE ? OR u.email LIKE ?)
    ORDER BY u.name ASC
    LIMIT 20
  `;
  
  const searchPattern = `%${searchTerm}%`;
  
  db.all(query, [userId, userId, userId, userId, userId, searchPattern, searchPattern], (err, users) => {
    if (err) {
      console.error('❌ Error searching users:', err);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server',
        error: 'database_error'
      });
    }
    
    res.json({
      success: true,
      data: users
    });
  });
});

// Send friend request
router.post('/friends/request', auth, (req, res) => {
  const fromUserId = req.user.id;
  const { to_user_id, message } = req.body;
  
  if (!to_user_id) {
    return res.status(400).json({
      success: false,
      message: 'ID user tujuan harus diisi'
    });
  }
  
  if (fromUserId === to_user_id) {
    return res.status(400).json({
      success: false,
      message: 'Tidak bisa mengirim request ke diri sendiri'
    });
  }
  
  // Check if already friends or request exists
  const checkQuery = `
    SELECT 
      CASE 
        WHEN f.status = 'accepted' THEN 'already_friends'
        WHEN f.status = 'pending' THEN 'request_exists'
        WHEN fr.status = 'pending' THEN 'request_sent'
        ELSE 'none'
      END as status
    FROM users u
    LEFT JOIN friendships f ON (f.user_id = ? AND f.friend_id = ?) OR (f.friend_id = ? AND f.user_id = ?)
    LEFT JOIN friend_requests fr ON (fr.from_user_id = ? AND fr.to_user_id = ?) OR (fr.to_user_id = ? AND fr.from_user_id = ?)
    WHERE u.id = ?
  `;
  
  db.get(checkQuery, [fromUserId, to_user_id, fromUserId, to_user_id, fromUserId, to_user_id, fromUserId, to_user_id, to_user_id], (err, result) => {
    if (err) {
      console.error('❌ Error checking friendship status:', err);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server',
        error: 'database_error'
      });
    }
    
    if (result.status === 'already_friends') {
      return res.status(400).json({
        success: false,
        message: 'Sudah berteman dengan user ini'
      });
    }
    
    if (result.status === 'request_exists' || result.status === 'request_sent') {
      return res.status(400).json({
        success: false,
        message: 'Request pertemanan sudah ada'
      });
    }
    
    // Send friend request
    const insertQuery = 'INSERT INTO friend_requests (from_user_id, to_user_id, message) VALUES (?, ?, ?)';
    db.run(insertQuery, [fromUserId, to_user_id, message || null], function(err) {
      if (err) {
        console.error('❌ Error sending friend request:', err);
        return res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan server',
          error: 'database_error'
        });
      }
      
      // Get sender info for notification
      const getSenderQuery = 'SELECT name FROM users WHERE id = ?';
      db.get(getSenderQuery, [fromUserId], (err, sender) => {
        if (err) {
          console.error('❌ Error getting sender info:', err);
        } else {
          console.log(`📨 Friend request sent: ${sender.name} -> User ${to_user_id}`);
          console.log(`🔔 Notification should be sent to user ${to_user_id}`);
          // Note: In a real app, you would send push notification here
          // For now, we'll log it and the client will handle local notifications
        }
      });
      
      res.status(201).json({
        success: true,
        message: 'Request pertemanan berhasil dikirim'
      });
    });
  });
});

// Get friend requests
router.get('/friends/requests', auth, (req, res) => {
  const userId = req.user.id;
  
  const query = `
    SELECT fr.id, fr.message, fr.created_at,
           u.id as from_user_id, u.name, u.email, u.avatar, u.status
    FROM friend_requests fr
    JOIN users u ON fr.from_user_id = u.id
    WHERE fr.to_user_id = ? AND fr.status = 'pending'
    ORDER BY fr.created_at DESC
  `;
  
  db.all(query, [userId], (err, requests) => {
    if (err) {
      console.error('❌ Error fetching friend requests:', err);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server',
        error: 'database_error'
      });
    }
    
    res.json({
      success: true,
      data: requests
    });
  });
});

// Accept/Reject friend request
router.put('/friends/request/:requestId', auth, (req, res) => {
  const userId = req.user.id;
  const requestId = req.params.requestId;
  const { action } = req.body; // 'accept' or 'reject'
  
  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({
      success: false,
      message: 'Action harus accept atau reject'
    });
  }
  
  // Get request details
  const getRequestQuery = 'SELECT * FROM friend_requests WHERE id = ? AND to_user_id = ? AND status = "pending"';
  db.get(getRequestQuery, [requestId, userId], (err, request) => {
    if (err) {
      console.error('❌ Error getting friend request:', err);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server',
        error: 'database_error'
      });
    }
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request pertemanan tidak ditemukan'
      });
    }
    
    // Update request status
    const updateRequestQuery = 'UPDATE friend_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    db.run(updateRequestQuery, [action === 'accept' ? 'accepted' : 'rejected', requestId], function(err) {
      if (err) {
        console.error('❌ Error updating friend request:', err);
        return res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan server',
          error: 'database_error'
        });
      }
      
      if (action === 'accept') {
        // Create friendship
        const createFriendshipQuery = 'INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, "accepted")';
        db.run(createFriendshipQuery, [request.from_user_id, request.to_user_id], function(err) {
          if (err) {
            console.error('❌ Error creating friendship:', err);
            return res.status(500).json({
              success: false,
              message: 'Terjadi kesalahan server',
              error: 'database_error'
            });
          }
          
          // Get user names for notification
          const getUserQuery = 'SELECT name FROM users WHERE id = ?';
          db.get(getUserQuery, [userId], (err, currentUser) => {
            if (err) {
              console.error('❌ Error getting current user info:', err);
            } else {
              console.log(`✅ Friend request accepted: User ${request.from_user_id} -> ${currentUser.name}`);
              console.log(`🔔 Notification should be sent to user ${request.from_user_id}`);
            }
          });
          
          res.json({
            success: true,
            message: 'Request pertemanan diterima'
          });
        });
      } else {
        // Get user names for notification
        const getUserQuery = 'SELECT name FROM users WHERE id = ?';
        db.get(getUserQuery, [userId], (err, currentUser) => {
          if (err) {
            console.error('❌ Error getting current user info:', err);
          } else {
            console.log(`❌ Friend request rejected: User ${request.from_user_id} -> ${currentUser.name}`);
            console.log(`🔔 Notification should be sent to user ${request.from_user_id}`);
          }
        });
        
        res.json({
          success: true,
          message: 'Request pertemanan ditolak'
        });
      }
    });
  });
});

// Chat Routes
// Get chat messages with a friend
router.get('/chat/:friendId', auth, (req, res) => {
  const userId = req.user.id;
  const friendId = req.params.friendId;
  
  // Check if they are friends
  const checkFriendshipQuery = `
    SELECT id FROM friendships 
    WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
    AND status = 'accepted'
  `;
  
  db.get(checkFriendshipQuery, [userId, friendId, friendId, userId], (err, friendship) => {
    if (err) {
      console.error('❌ Error checking friendship:', err);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server',
        error: 'database_error'
      });
    }
    
    if (!friendship) {
      return res.status(403).json({
        success: false,
        message: 'Anda harus berteman untuk chat'
      });
    }
    
    // Get chat messages
    const getMessagesQuery = `
      SELECT c.id, c.message, c.message_type, c.is_read, c.created_at,
             u.id as sender_id, u.name as sender_name, u.avatar as sender_avatar
      FROM chats c
      JOIN users u ON c.sender_id = u.id
      WHERE (c.sender_id = ? AND c.receiver_id = ?) OR (c.sender_id = ? AND c.receiver_id = ?)
      ORDER BY c.created_at ASC
      LIMIT 100
    `;
    
    db.all(getMessagesQuery, [userId, friendId, friendId, userId], (err, messages) => {
      if (err) {
        console.error('❌ Error fetching chat messages:', err);
        return res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan server',
          error: 'database_error'
        });
      }
      
      // Mark messages as read
      const markReadQuery = `
        UPDATE chats 
        SET is_read = TRUE 
        WHERE receiver_id = ? AND sender_id = ? AND is_read = FALSE
      `;
      db.run(markReadQuery, [userId, friendId]);
      
      res.json({
        success: true,
        data: messages
      });
    });
  });
});

// Send chat message
router.post('/chat/:friendId', auth, upload.single('image'), (req, res) => {
  const userId = req.user.id;
  const friendId = req.params.friendId;
  const message_type = req.body.message_type || 'text';
  
  // Check if they are friends
  const checkFriendshipQuery = `
    SELECT id FROM friendships 
    WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
    AND status = 'accepted'
  `;
  
  db.get(checkFriendshipQuery, [userId, friendId, friendId, userId], (err, friendship) => {
    if (err) {
      console.error('❌ Error checking friendship:', err);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server',
        error: 'database_error'
      });
    }
    
    if (!friendship) {
      return res.status(403).json({
        success: false,
        message: 'Anda harus berteman untuk chat'
      });
    }
    
    let messageContent = '';
    
    if (message_type === 'image') {
      // Handle image upload
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Gambar tidak ditemukan'
        });
      }
      
      messageContent = req.file.path; // Store file path
      console.log('📸 Image uploaded:', req.file.path);
    } else {
      // Handle text message
      const { message } = req.body;
      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Pesan tidak boleh kosong'
        });
      }
      messageContent = message.trim();
    }
    
    // Send message
    const sendMessageQuery = 'INSERT INTO chats (sender_id, receiver_id, message, message_type) VALUES (?, ?, ?, ?)';
    db.run(sendMessageQuery, [userId, friendId, messageContent, message_type], function(err) {
      if (err) {
        console.error('❌ Error sending message:', err);
        return res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan server',
          error: 'database_error'
        });
      }
      
      res.status(201).json({
        success: true,
        message: message_type === 'image' ? 'Gambar berhasil dikirim' : 'Pesan berhasil dikirim',
        data: {
          id: this.lastID,
          message: messageContent,
          message_type: message_type,
          created_at: new Date().toISOString()
        }
      });
    });
  });
});

// Get unread message count
router.get('/chat/unread/count', auth, (req, res) => {
  const userId = req.user.id;
  
  const query = `
    SELECT receiver_id as friend_id, COUNT(*) as count
    FROM chats
    WHERE receiver_id = ? AND is_read = FALSE
    GROUP BY receiver_id
  `;
  
  db.all(query, [userId], (err, unreadCounts) => {
    if (err) {
      console.error('❌ Error fetching unread count:', err);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server',
        error: 'database_error'
      });
    }
    
    res.json({
      success: true,
      data: unreadCounts
    });
  });
});

// Data Sharing Routes
// Get shared data settings for a friend
router.get('/data-sharing/:friendId', auth, (req, res) => {
  const userId = req.user.id;
  const friendId = req.params.friendId;
  
  // Check if they are friends
  const checkFriendshipQuery = `
    SELECT id FROM friendships 
    WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
    AND status = 'accepted'
  `;
  
  db.get(checkFriendshipQuery, [userId, friendId, friendId, userId], (err, friendship) => {
    if (err) {
      console.error('❌ Error checking friendship:', err);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server',
        error: 'database_error'
      });
    }
    
    if (!friendship) {
      return res.status(403).json({
        success: false,
        message: 'Anda harus berteman untuk berbagi data'
      });
    }
    
    // Get current sharing settings
    const getSharingQuery = 'SELECT * FROM data_sharing WHERE user_id = ? AND friend_id = ?';
    db.get(getSharingQuery, [userId, friendId], (err, sharing) => {
      if (err) {
        console.error('❌ Error getting sharing settings:', err);
        return res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan server',
          error: 'database_error'
        });
      }
      
      res.json({
        success: true,
        data: sharing || {
          user_id: userId,
          friend_id: friendId,
          share_type: 'none',
          is_active: false
        }
      });
    });
  });
});

// Update data sharing settings
router.put('/data-sharing/:friendId', auth, (req, res) => {
  const userId = req.user.id;
  const friendId = req.params.friendId;
  const { share_type, is_active } = req.body;
  
  if (!['all', 'income', 'expense', 'summary', 'none'].includes(share_type)) {
    return res.status(400).json({
      success: false,
      message: 'Tipe berbagi data tidak valid'
    });
  }
  
  // Check if they are friends
  const checkFriendshipQuery = `
    SELECT id FROM friendships 
    WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
    AND status = 'accepted'
  `;
  
  db.get(checkFriendshipQuery, [userId, friendId, friendId, userId], (err, friendship) => {
    if (err) {
      console.error('❌ Error checking friendship:', err);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server',
        error: 'database_error'
      });
    }
    
    if (!friendship) {
      return res.status(403).json({
        success: false,
        message: 'Anda harus berteman untuk berbagi data'
      });
    }
    
    // Update or insert sharing settings
    const upsertQuery = `
      INSERT INTO data_sharing (user_id, friend_id, share_type, is_active, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, friend_id) 
      DO UPDATE SET 
        share_type = excluded.share_type,
        is_active = excluded.is_active,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    db.run(upsertQuery, [userId, friendId, share_type, is_active], function(err) {
      if (err) {
        console.error('❌ Error updating sharing settings:', err);
        return res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan server',
          error: 'database_error'
        });
      }
      
      res.json({
        success: true,
        message: 'Pengaturan berbagi data berhasil diperbarui'
      });
    });
  });
});

// Get shared financial data from friends
router.get('/shared-data', auth, (req, res) => {
  const userId = req.user.id;
  
  // Get all friends who share data with this user
  const getSharedDataQuery = `
    SELECT 
      ds.share_type,
      ds.is_active,
      u.id as friend_id,
      u.name as friend_name,
      u.email as friend_email,
      u.avatar as friend_avatar,
      u.status as friend_status
    FROM data_sharing ds
    JOIN users u ON ds.user_id = u.id
    WHERE ds.friend_id = ? AND ds.is_active = TRUE
  `;
  
  db.all(getSharedDataQuery, [userId], (err, sharedData) => {
    if (err) {
      console.error('❌ Error fetching shared data:', err);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server',
        error: 'database_error'
      });
    }
    
    res.json({
      success: true,
      data: sharedData
    });
  });
});

// Get detailed shared financial data from a specific friend
router.get('/shared-data/:friendId', auth, (req, res) => {
  const userId = req.user.id;
  const friendId = req.params.friendId;
  
  // Check if friend is sharing data with this user
  const checkSharingQuery = `
    SELECT share_type, is_active 
    FROM data_sharing 
    WHERE user_id = ? AND friend_id = ? AND is_active = TRUE
  `;
  
  db.get(checkSharingQuery, [friendId, userId], (err, sharing) => {
    if (err) {
      console.error('❌ Error checking data sharing:', err);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server',
        error: 'database_error'
      });
    }
    
    if (!sharing) {
      return res.status(403).json({
        success: false,
        message: 'Teman tidak berbagi data keuangan dengan Anda'
      });
    }
    
    // Get friend's financial data based on share type
    let query = '';
    let params = [friendId];
    
    switch (sharing.share_type) {
      case 'all':
        query = `
          SELECT 
            t.id, t.type, t.amount, t.description, t.date, t.created_at,
            c.name as category_name, c.color as category_color
          FROM transactions t
          LEFT JOIN categories c ON t.category = c.name
          WHERE t.user_id = ?
          ORDER BY t.date DESC
          LIMIT 100
        `;
        break;
      case 'income':
        query = `
          SELECT 
            t.id, t.type, t.amount, t.description, t.date, t.created_at,
            c.name as category_name, c.color as category_color
          FROM transactions t
          LEFT JOIN categories c ON t.category = c.name
          WHERE t.user_id = ? AND t.type = 'income'
          ORDER BY t.date DESC
          LIMIT 100
        `;
        break;
      case 'expense':
        query = `
          SELECT 
            t.id, t.type, t.amount, t.description, t.date, t.created_at,
            c.name as category_name, c.color as category_color
          FROM transactions t
          LEFT JOIN categories c ON t.category = c.name
          WHERE t.user_id = ? AND t.type = 'expense'
          ORDER BY t.date DESC
          LIMIT 100
        `;
        break;
      case 'summary':
        // Return summary data only
        query = `
          SELECT 
            'summary' as type,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
            COUNT(*) as total_transactions,
            COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
            COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count
          FROM transactions 
          WHERE user_id = ?
        `;
        break;
      default:
        return res.status(403).json({
          success: false,
          message: 'Teman tidak berbagi data keuangan dengan Anda'
        });
    }
    
    db.all(query, params, (err, data) => {
      if (err) {
        console.error('❌ Error fetching friend financial data:', err);
        return res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan server',
          error: 'database_error'
        });
      }
      
      res.json({
        success: true,
        data: data,
        share_type: sharing.share_type
      });
    });
  });
});

// Get friends who can see your data
router.get('/data-sharing/visible-to', auth, (req, res) => {
  const userId = req.user.id;
  
  const query = `
    SELECT 
      ds.share_type,
      ds.is_active,
      ds.created_at,
      u.id as friend_id,
      u.name as friend_name,
      u.email as friend_email,
      u.avatar as friend_avatar,
      u.status as friend_status
    FROM data_sharing ds
    JOIN users u ON ds.friend_id = u.id
    WHERE ds.user_id = ? AND ds.is_active = TRUE
    ORDER BY ds.updated_at DESC
  `;
  
  db.all(query, [userId], (err, visibleTo) => {
    if (err) {
      console.error('❌ Error fetching visible to data:', err);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server',
        error: 'database_error'
      });
    }
    
    res.json({
      success: true,
      data: visibleTo
    });
  });
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone } = req.body;
    
    // Validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan email harus diisi'
      });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid'
      });
    }
    
    // Check if email is already used by another user
    db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId], (err, existingUser) => {
      if (err) {
        console.error('❌ Database error checking email:', err);
        return res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan server',
          error: 'database_error'
        });
      }
      
      if (existingUser) {
        console.log(`❌ Profile update failed: Email ${email} already used by another user`);
        return res.status(409).json({
          success: false,
          message: 'Email sudah digunakan oleh pengguna lain',
          error: 'email_exists'
        });
      }
      
      // Update user profile
      const updateQuery = 'UPDATE users SET name = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      db.run(updateQuery, [name, email, phone || null, userId], function (err) {
        if (err) {
          console.error('❌ Profile update error:', err);
          return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: 'database_error'
          });
        }
        
        if (this.changes === 0) {
          console.log(`❌ Profile update failed: User ${userId} not found`);
          return res.status(404).json({
            success: false,
            message: 'Pengguna tidak ditemukan',
            error: 'user_not_found'
          });
        }
        
        console.log(`✅ Profile updated successfully for user ${userId}`);
        res.json({
          success: true,
          message: 'Profile berhasil diperbarui',
          data: {
            id: userId,
            name: name,
            email: email,
            phone: phone || null
          }
        });
      });
    });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: 'server_error'
    });
  }
});

// Get user profile
router.get('/profile', auth, (req, res) => {
  const userId = req.user.id;
  
  const query = 'SELECT id, name, email, phone, created_at, updated_at FROM users WHERE id = ?';
  
  db.get(query, [userId], (err, user) => {
    if (err) {
      console.error('❌ Error fetching user profile:', err);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server',
        error: 'database_error'
      });
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan',
        error: 'user_not_found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  });
});

// ===================== TRANSACTIONS ENDPOINTS =====================

// Ambil semua transaksi user
router.get('/transactions', auth, (req, res) => {
  const userId = req.user.id;
  const query = 'SELECT id, type, amount, description, date FROM transactions WHERE user_id = ? ORDER BY date DESC';
  db.all(query, [userId], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching transactions:', err);
      return res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: 'database_error' });
    }
    res.json(rows);
  });
});

// Tambah transaksi baru
router.post('/transactions', auth, (req, res) => {
  const userId = req.user.id;
  const { type, amount, description, date } = req.body;
  if (!type || !amount || !date) {
    return res.status(400).json({ success: false, message: 'Data transaksi tidak lengkap' });
  }
  const query = 'INSERT INTO transactions (user_id, type, amount, description, date) VALUES (?, ?, ?, ?, ?)';
  db.run(query, [userId, type, amount, description || '', date], function (err) {
    if (err) {
      console.error('❌ Error adding transaction:', err);
      return res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: 'database_error' });
    }
    res.json({ success: true, message: 'Transaction added', id: this.lastID });
  });
});

// Update transaksi
router.put('/transactions/:id', auth, (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { type, amount, description, date } = req.body;
  const query = 'UPDATE transactions SET type = ?, amount = ?, description = ?, date = ? WHERE id = ? AND user_id = ?';
  db.run(query, [type, amount, description || '', date, id, userId], function (err) {
    if (err) {
      console.error('❌ Error updating transaction:', err);
      return res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: 'database_error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
    }
    res.json({ success: true, message: 'Transaction updated' });
  });
});

// Hapus transaksi
router.delete('/transactions/:id', auth, (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const query = 'DELETE FROM transactions WHERE id = ? AND user_id = ?';
  db.run(query, [id, userId], function (err) {
    if (err) {
      console.error('❌ Error deleting transaction:', err);
      return res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: 'database_error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
    }
    res.json({ success: true, message: 'Transaction deleted' });
  });
});

// ===================== CATEGORIES ENDPOINTS =====================

// Ambil semua kategori user dengan statistik transaksi
router.get('/categories', auth, (req, res) => {
  const userId = req.user.id;
  const query = `
    SELECT 
      c.id,
      c.name,
      c.type,
      c.color,
      c.icon,
      COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as income_total,
      COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as expense_total,
      COUNT(t.id) as transaction_count
    FROM categories c
    LEFT JOIN transactions t ON c.name = t.category AND t.user_id = ?
    WHERE c.user_id = ?
    GROUP BY c.id, c.name, c.type, c.color, c.icon
    ORDER BY c.name ASC
  `;
  
  db.all(query, [userId, userId], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching categories:', err);
      return res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: 'database_error' });
    }
    
    // Transform data untuk frontend
    const categories = rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      color: row.color || '#3B82F6',
      icon: row.icon || 'category',
      total: row.type === 'income' ? row.income_total : row.expense_total,
      count: row.transaction_count,
      income_total: row.income_total,
      expense_total: row.expense_total
    }));
    
    res.json(categories);
  });
});

// Tambah kategori baru
router.post('/categories', auth, (req, res) => {
  const userId = req.user.id;
  const { name, type, color, icon } = req.body;
  if (!name || !type) {
    return res.status(400).json({ success: false, message: 'Nama dan tipe kategori wajib diisi' });
  }
  const query = 'INSERT INTO categories (user_id, name, type, color, icon) VALUES (?, ?, ?, ?, ?)';
  db.run(query, [userId, name, type, color || '#3B82F6', icon || 'category'], function (err) {
    if (err) {
      console.error('❌ Error adding category:', err);
      return res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: 'database_error' });
    }
    res.json({ success: true, message: 'Category added', id: this.lastID });
  });
});

// Edit kategori
router.put('/categories/:id', auth, (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Nama kategori tidak boleh kosong' });
  }
  const query = 'UPDATE categories SET name = ? WHERE id = ? AND user_id = ?';
  db.run(query, [name, id, userId], function (err) {
    if (err) {
      console.error('❌ Error updating category:', err);
      return res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: 'database_error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }
    res.json({ success: true, message: 'Category updated' });
  });
});

// Hapus kategori
router.delete('/categories/:id', auth, (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const query = 'DELETE FROM categories WHERE id = ? AND user_id = ?';
  db.run(query, [id, userId], function (err) {
    if (err) {
      console.error('❌ Error deleting category:', err);
      return res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: 'database_error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }
    res.json({ success: true, message: 'Category deleted' });
  });
});

// Delete user account and all related data
router.delete('/account', auth, (req, res) => {
  const userId = req.user.id;
  
  console.log(`🗑️ User ${userId} requesting account deletion`);
  
  // Start transaction to ensure data consistency
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        console.error('❌ Error starting transaction:', err);
        return res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan server',
          error: 'database_error'
        });
      }
      
      // Delete all related data first (due to foreign key constraints)
      const deleteQueries = [
        'DELETE FROM chats WHERE sender_id = ? OR receiver_id = ?',
        'DELETE FROM friend_requests WHERE from_user_id = ? OR to_user_id = ?',
        'DELETE FROM friendships WHERE user_id = ? OR friend_id = ?',
        'DELETE FROM data_sharing WHERE user_id = ? OR friend_id = ?',
        'DELETE FROM shared_transactions WHERE shared_by_user_id = ? OR shared_with_user_id = ?',
        'DELETE FROM transactions WHERE user_id = ?',
        'DELETE FROM categories WHERE user_id = ?',
        'DELETE FROM users WHERE id = ?'
      ];
      
      let completedQueries = 0;
      let hasError = false;
      
      deleteQueries.forEach((query, index) => {
        let params;
        if (query.includes('sender_id = ? OR receiver_id = ?')) {
          params = [userId, userId];
        } else if (query.includes('user_id = ? OR friend_id = ?')) {
          params = [userId, userId];
        } else if (query.includes('from_user_id = ? OR to_user_id = ?')) {
          params = [userId, userId];
        } else if (query.includes('shared_by_user_id = ? OR shared_with_user_id = ?')) {
          params = [userId, userId];
        } else {
          params = [userId];
        }
        
        db.run(query, params, function(err) {
          if (err) {
            console.error(`❌ Error executing query ${index + 1}:`, err);
            hasError = true;
          } else {
            console.log(`✅ Query ${index + 1} completed: ${this.changes} rows affected`);
          }
          
          completedQueries++;
          
          // When all queries are done
          if (completedQueries === deleteQueries.length) {
            if (hasError) {
              // Rollback transaction on error
              db.run('ROLLBACK', (rollbackErr) => {
                if (rollbackErr) {
                  console.error('❌ Error rolling back transaction:', rollbackErr);
                }
                return res.status(500).json({
                  success: false,
                  message: 'Gagal menghapus akun. Silakan coba lagi.',
                  error: 'deletion_failed'
                });
              });
            } else {
              // Commit transaction on success
              db.run('COMMIT', (commitErr) => {
                if (commitErr) {
                  console.error('❌ Error committing transaction:', commitErr);
                  return res.status(500).json({
                    success: false,
                    message: 'Terjadi kesalahan server',
                    error: 'commit_error'
                  });
                }
                
                console.log(`✅ Account deletion completed for user ${userId}`);
                res.json({
                  success: true,
                  message: 'Akun berhasil dihapus',
                  data: {
                    user_id: userId,
                    deleted_at: new Date().toISOString()
                  }
                });
              });
            }
          }
        });
      });
    });
  });
});

// Delete chat message (for everyone)
router.delete('/chat/:messageId', auth, (req, res) => {
  const userId = req.user.id;
  const messageId = req.params.messageId;

  // Only allow sender to delete for everyone
  const checkQuery = 'SELECT * FROM chats WHERE id = ?';
  db.get(checkQuery, [messageId], (err, message) => {
    if (err) {
      console.error('❌ Error checking message:', err);
      return res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: 'database_error' });
    }
    if (!message) {
      return res.status(404).json({ success: false, message: 'Pesan tidak ditemukan', error: 'not_found' });
    }
    if (message.sender_id !== userId) {
      return res.status(403).json({ success: false, message: 'Anda hanya bisa menghapus pesan yang Anda kirim', error: 'forbidden' });
    }
    // Delete message
    const deleteQuery = 'DELETE FROM chats WHERE id = ?';
    db.run(deleteQuery, [messageId], function(err) {
      if (err) {
        console.error('❌ Error deleting message:', err);
        return res.status(500).json({ success: false, message: 'Gagal menghapus pesan', error: 'database_error' });
      }
      return res.json({ success: true, message: 'Pesan berhasil dihapus', data: { id: messageId } });
    });
  });
});

// Update user status (online/offline)
router.put('/user/status', auth, (req, res) => {
  const userId = req.user.id;
  const { status } = req.body; // 'online' or 'offline'
  
  if (!status || !['online', 'offline'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Status harus online atau offline',
      error: 'invalid_status'
    });
  }
  
  const updateQuery = 'UPDATE users SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?';
  db.run(updateQuery, [status, userId], function(err) {
    if (err) {
      console.error('❌ Error updating user status:', err);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server',
        error: 'database_error'
      });
    }
    
    console.log(`✅ User ${userId} status updated to ${status}`);
    res.json({
      success: true,
      message: `Status berhasil diupdate ke ${status}`,
      data: { status, last_seen: new Date().toISOString() }
    });
  });
});

// Get user status
router.get('/user/status/:userId', auth, (req, res) => {
  const targetUserId = req.params.userId;
  
  const query = 'SELECT id, name, status, last_seen FROM users WHERE id = ?';
  db.get(query, [targetUserId], (err, user) => {
    if (err) {
      console.error('❌ Error getting user status:', err);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server',
        error: 'database_error'
      });
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
        error: 'user_not_found'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        status: user.status,
        last_seen: user.last_seen
      }
    });
  });
});

// Upload user avatar
router.put('/user/avatar', auth, upload.single('avatar'), (req, res) => {
  const userId = req.user.id;
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Tidak ada file yang diupload',
      error: 'no_file'
    });
  }
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    // Delete uploaded file
    fs.unlinkSync(req.file.path);
    return res.status(400).json({
      success: false,
      message: 'Tipe file tidak didukung. Gunakan JPEG, PNG, atau GIF',
      error: 'invalid_file_type'
    });
  }
  
  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (req.file.size > maxSize) {
    // Delete uploaded file
    fs.unlinkSync(req.file.path);
    return res.status(400).json({
      success: false,
      message: 'Ukuran file terlalu besar. Maksimal 5MB',
      error: 'file_too_large'
    });
  }
  
  // Generate avatar URL
  const avatarUrl = `/uploads/${req.file.filename}`;
  
  // Update user avatar in database
  const updateQuery = 'UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  db.run(updateQuery, [avatarUrl, userId], function(err) {
    if (err) {
      console.error('❌ Error updating user avatar:', err);
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server',
        error: 'database_error'
      });
    }
    
    console.log(`✅ Avatar updated for user ${userId}: ${avatarUrl}`);
    res.json({
      success: true,
      message: 'Avatar berhasil diupload',
      data: {
        avatar_url: avatarUrl,
        filename: req.file.filename
      }
    });
  });
});

// Get user avatar
router.get('/user/avatar/:userId', (req, res) => {
  const userId = req.params.userId;
  
  const query = 'SELECT avatar FROM users WHERE id = ?';
  db.get(query, [userId], (err, user) => {
    if (err) {
      console.error('❌ Error getting user avatar:', err);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server',
        error: 'database_error'
      });
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
        error: 'user_not_found'
      });
    }
    
    res.json({
      success: true,
      data: {
        avatar_url: user.avatar
      }
    });
  });
});

module.exports = router; 