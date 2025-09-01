# 🚀 Deploy ReportIn Backend ke Render

## 🌟 Mengapa Render?

- ✅ **Free Tier** tersedia
- ✅ **Auto-deploy** dari Git
- ✅ **HTTPS** otomatis
- ✅ **Environment variables** support
- ✅ **Database** hosting (PostgreSQL)
- ✅ **Monitoring** built-in
- ✅ **Custom domains** support

## 📋 Persiapan Deployment

### 1. **Siapkan Repository Git**

```bash
cd /Users/darulizza/Documents/ReportIn_VPS_DEploymentFInal/backend

# Initialize git jika belum ada
git init

# Add all files
git add .

# Commit
git commit -m "Initial backend setup for Render deployment"

# Push ke GitHub/GitLab
git remote add origin https://github.com/yourusername/reportin-backend.git
git push -u origin main
```

### 2. **Update package.json untuk Production**

Pastikan `package.json` Anda sudah sesuai:

```json
{
  "name": "reportin-backend",
  "version": "1.21.0",
  "description": "Backend API for ReportIn financial management app",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "build": "npm install"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 3. **Buat File Environment untuk Render**

Buat file `.env.example`:

```bash
# Database
DATABASE_URL=sqlite:./db.sqlite

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server
PORT=10000
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=https://your-flutter-app.com,http://localhost:3000
```

## 🎯 Langkah-Langkah Deployment

### **Step 1: Setup Render Account**

1. Kunjungi [render.com](https://render.com)
2. Sign up dengan GitHub account
3. Connect repository Anda

### **Step 2: Create Web Service**

1. **Dashboard Render** → **New** → **Web Service**
2. **Connect Repository** → Pilih repository backend Anda
3. **Configure Service:**

```yaml
Name: reportin-backend
Environment: Node
Region: Singapore (terdekat dengan Indonesia)
Branch: main
Build Command: npm install
Start Command: npm start
```

### **Step 3: Environment Variables**

Di **Environment** tab, tambahkan:

```bash
NODE_ENV=production
JWT_SECRET=reportin-super-secret-key-2024-production
PORT=10000
DATABASE_URL=sqlite:./db.sqlite
ALLOWED_ORIGINS=https://reportin-frontend.onrender.com
```

### **Step 4: Advanced Settings**

```yaml
Instance Type: Free (512 MB RAM, 0.1 CPU)
Auto-Deploy: Yes
Health Check Path: /api/ping
```

## 🗄️ Database Options

### **Option 1: SQLite (Simple)**

Tetap gunakan SQLite - file akan disimpan di disk Render:

```javascript
// db.js - Update untuk production
const dbPath = process.env.DATABASE_URL || path.resolve(__dirname, 'db.sqlite');
const db = new sqlite3.Database(dbPath);
```

### **Option 2: PostgreSQL (Recommended)**

Untuk production yang lebih robust:

1. **Render Dashboard** → **New** → **PostgreSQL**
2. **Create Database:**

```yaml
Name: reportin-database
Database: reportin
User: reportin_user
Region: Singapore
```

3. **Update Backend untuk PostgreSQL:**

```bash
npm install pg
```

```javascript
// db-postgres.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = pool;
```

## 🔧 Update Kode untuk Render

### **1. Update index.js untuk Production**

```javascript
const express = require('express');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// CORS untuk production
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check untuk Render
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'ReportIn API is running on Render',
    version: '1.21.0',
    timestamp: new Date().toISOString()
  });
});

// Routes
const routes = require('./routes');
app.use('/api', routes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ReportIn Backend running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/ping`);
});
```

### **2. Update Database Connection**

```javascript
// db.js - Production ready
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Render persistent disk path
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/opt/render/project/src/db.sqlite'
  : path.resolve(__dirname, 'db.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ SQLite connection error:', err.message);
  } else {
    console.log('✅ Connected to SQLite database on Render');
    console.log('📍 Database path:', dbPath);
    
    // Production optimizations
    db.run('PRAGMA journal_mode = WAL');
    db.run('PRAGMA synchronous = NORMAL');
    db.run('PRAGMA cache_size = 10000');
    db.run('PRAGMA foreign_keys = ON');
    
    initializeTablesIfNeeded();
  }
});

module.exports = db;
```

## 🔄 Update Flutter App untuk Render

### **Update API Service URLs**

```dart
// lib/api_service.dart
class ApiService {
  // Render deployment URL
  static const String renderUrl = 'https://reportin-backend.onrender.com/api';
  static const String backupUrl = 'https://reportin.site/api';
  
  // URLs to try in order
  static const List<String> urlsToTry = [
    renderUrl,     // Primary: Render deployment
    backupUrl,     // Backup: Current server
  ];
  
  static String? _activeUrl;
  static String get activeUrl => _activeUrl ?? renderUrl;
  
  // Force use Render server
  static void useRenderServer() {
    _activeUrl = renderUrl;
    print('🌐 Switched to Render server: $renderUrl');
  }
}
```

## 📊 Monitoring & Maintenance

### **1. Logs Monitoring**

Render provides automatic logging:

```bash
# View logs di Render Dashboard
Events → View Logs

# Real-time logs
tail -f /var/log/render/service.log
```

### **2. Performance Monitoring**

Add basic monitoring to your app:

```javascript
// routes.js - Add monitoring endpoint
router.get('/status', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'healthy',
    uptime: Math.floor(uptime),
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB'
    },
    timestamp: new Date().toISOString()
  });
});
```

### **3. Database Backup (SQLite)**

```javascript
// backup.js
const fs = require('fs');
const path = require('path');

function backupDatabase() {
  const sourceDb = '/opt/render/project/src/db.sqlite';
  const backupPath = `/opt/render/project/src/backups/db-${Date.now()}.sqlite`;
  
  fs.copyFileSync(sourceDb, backupPath);
  console.log(`✅ Database backed up to: ${backupPath}`);
}

// Run backup setiap 24 jam
setInterval(backupDatabase, 24 * 60 * 60 * 1000);
```

## 🚀 Deployment Process

### **1. Pre-deployment Checklist**

```bash
# Test locally
npm install
npm start

# Check API endpoints
curl http://localhost:5005/api/ping
curl http://localhost:5005/api/status

# Run tests jika ada
npm test
```

### **2. Deploy to Render**

1. **Push ke Git:**
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

2. **Render Auto-deploy:**
   - Render akan otomatis detect changes
   - Build process akan berjalan
   - Service akan restart otomatis

3. **Verify Deployment:**
```bash
# Test API
curl https://reportin-backend.onrender.com/api/ping
curl https://reportin-backend.onrender.com/api/status
```

## 💰 Pricing & Limits

### **Free Tier:**
- ✅ **RAM**: 512 MB
- ✅ **CPU**: 0.1 CPU units  
- ✅ **Bandwidth**: 100 GB/month
- ✅ **Sleep**: Service sleep setelah 15 menit inactive
- ✅ **Build time**: 500 build minutes/month

### **Paid Tiers** (jika perlu upgrade):
- **Starter**: $7/month (no sleep, 1GB RAM)
- **Standard**: $25/month (2GB RAM, priority support)

## 🔧 Troubleshooting

### **Problem 1: Service Sleeping**
```javascript
// keep-alive.js - Prevent free tier sleeping
setInterval(() => {
  if (process.env.NODE_ENV === 'production') {
    fetch('https://reportin-backend.onrender.com/api/ping')
      .catch(err => console.log('Keep-alive ping failed:', err));
  }
}, 14 * 60 * 1000); // Ping every 14 minutes
```

### **Problem 2: Database Issues**
```javascript
// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
```

### **Problem 3: CORS Issues**
```javascript
// Update CORS untuk domain baru
const corsOptions = {
  origin: [
    'https://reportin-frontend.onrender.com',
    'https://your-flutter-web-app.com',
    'http://localhost:3000'
  ],
  credentials: true
};
```

## 🎯 Custom Domain (Optional)

1. **Render Dashboard** → **Settings** → **Custom Domains**
2. **Add Domain**: `api.reportin.site`
3. **DNS Settings**:
```
Type: CNAME
Name: api
Value: reportin-backend.onrender.com
```

## 📱 Update Flutter App

Setelah deploy sukses, update Flutter app:

```dart
// Update base URL
static const String baseUrl = 'https://reportin-backend.onrender.com/api';

// Test connection
await ApiService.testConnection();
```

## 🎉 Go Live Checklist

- [ ] Repository pushed ke Git
- [ ] Render service created
- [ ] Environment variables configured
- [ ] Database initialized
- [ ] API endpoints tested
- [ ] Flutter app updated
- [ ] CORS configured properly
- [ ] Custom domain setup (optional)
- [ ] Monitoring enabled
- [ ] Backup strategy implemented

**🚀 Your ReportIn backend will be live at:**
`https://reportin-backend.onrender.com`

**📱 Update your Flutter app to use the new URL and you're ready to go!**
