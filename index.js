const express = require('express');
const cors = require('cors');
const compression = require('compression');
const os = require('os');
require('dotenv').config();

// Set JWT secret with fallback
const JWT_SECRET = process.env.JWT_SECRET || 'reportin-secret-key-2024';
console.log('🔐 JWT Secret configured:', JWT_SECRET ? 'Set' : 'Using fallback');

// Function to get all available IP addresses
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  
  Object.keys(interfaces).forEach((iface) => {
    interfaces[iface].forEach((details) => {
      // Skip internal and non-IPv4 addresses
      if (details.family === 'IPv4' && !details.internal) {
        ips.push({
          interface: iface,
          address: details.address,
          netmask: details.netmask,
          mac: details.mac
        });
      }
    });
  });
  
  return ips;
}

// Function to get primary IP address
function getPrimaryIP() {
  const ips = getLocalIPs();
  
  // Priority order: WiFi > Ethernet > Others
  const wifiIP = ips.find(ip => ip.interface.toLowerCase().includes('wifi') || ip.interface.toLowerCase().includes('en0'));
  const ethernetIP = ips.find(ip => ip.interface.toLowerCase().includes('ethernet') || ip.interface.toLowerCase().includes('en1'));
  
  return wifiIP || ethernetIP || ips[0] || { address: 'localhost' };
}

const app = express();

// Enable compression for all responses
app.use(compression({
  level: 6, // Balance between compression and CPU usage
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Basic middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:*',
      'http://127.0.0.1:*',
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'http://localhost:5001',
      'http://127.0.0.1:5001',
      'http://localhost:5002',
      'http://127.0.0.1:5002',
      'http://localhost:5003',
      'http://127.0.0.1:5003',
      'http://localhost:5004',
      'http://127.0.0.1:5004',
      'http://localhost:5005',
      'http://127.0.0.1:5005',
      'http://localhost:5006',
      'http://127.0.0.1:5006',
      'http://localhost:5007',
      'http://127.0.0.1:5007',
      'http://localhost:5008',
      'http://127.0.0.1:5008',
      'http://localhost:5009',
      'http://127.0.0.1:5009',
      'http://localhost:5010',
      'http://127.0.0.1:5010'
    ];
    
    // Add dynamic IP addresses
    const localIPs = getLocalIPs();
    localIPs.forEach(ip => {
      allowedOrigins.push(`http://${ip.address}:*`);
      allowedOrigins.push(`http://${ip.address}:3000`);
      allowedOrigins.push(`http://${ip.address}:8080`);
      allowedOrigins.push(`http://${ip.address}:5000`);
      allowedOrigins.push(`http://${ip.address}:5001`);
      allowedOrigins.push(`http://${ip.address}:5002`);
      allowedOrigins.push(`http://${ip.address}:5003`);
      allowedOrigins.push(`http://${ip.address}:5004`);
      allowedOrigins.push(`http://${ip.address}:5005`);
      allowedOrigins.push(`http://${ip.address}:5006`);
      allowedOrigins.push(`http://${ip.address}:5007`);
      allowedOrigins.push(`http://${ip.address}:5008`);
      allowedOrigins.push(`http://${ip.address}:5009`);
      allowedOrigins.push(`http://${ip.address}:5010`);
    });
    
    // Allow all origins for development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin) || allowedOrigins.some(allowed => allowed.includes('*'))) {
      return callback(null, true);
    }
    
    console.log(`⚠️ CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files for APK downloads
app.use('/apk-releases', express.static('/home/ubuntu/Documents/ReportIn/reportin/apk_releases'));
app.use('/downloads', express.static('/home/ubuntu/Documents/ReportIn/reportin/apk_releases'));

// Root route - serve website homepage (MUST BE FIRST)
app.get('/', (req, res) => {
  console.log('✅ Root route accessed - serving website homepage');
  
  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ReportIn - Kelola Keuangan dengan Mudah</title>
    <meta name="description" content="Aplikasi manajemen keuangan modern untuk mengelola pemasukan, pengeluaran, dan analisis keuangan pribadi">
    <meta name="keywords" content="keuangan, manajemen keuangan, aplikasi keuangan, laporan keuangan, budget">
    <meta name="author" content="ReportIn Team">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://reportin.site/">
    <meta property="og:title" content="ReportIn - Kelola Keuangan dengan Mudah">
    <meta property="og:description" content="Aplikasi manajemen keuangan modern untuk mengelola pemasukan, pengeluaran, dan analisis keuangan pribadi">
    <meta property="og:image" content="https://reportin.site/logo.png">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://reportin.site/">
    <meta property="twitter:title" content="ReportIn - Kelola Keuangan dengan Mudah">
    <meta property="twitter:description" content="Aplikasi manajemen keuangan modern untuk mengelola pemasukan, pengeluaran, dan analisis keuangan pribadi">
    <meta property="twitter:image" content="https://reportin.site/logo.png">

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }

        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 1rem 0;
            position: fixed;
            width: 100%;
            top: 0;
            z-index: 1000;
            box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
        }

        .nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
            text-decoration: none;
        }

        .nav-links {
            display: flex;
            list-style: none;
            gap: 2rem;
        }

        .nav-links a {
            text-decoration: none;
            color: #333;
            font-weight: 500;
            transition: color 0.3s ease;
        }

        .nav-links a:hover {
            color: #667eea;
        }

        .hero {
            padding: 120px 0 80px;
            text-align: center;
            color: white;
        }

        .hero h1 {
            font-size: 3.5rem;
            margin-bottom: 1rem;
            font-weight: 700;
        }

        .hero p {
            font-size: 1.3rem;
            margin-bottom: 2rem;
            opacity: 0.9;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }

        .cta-button {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            transition: all 0.3s ease;
            border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .cta-button:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .features {
            padding: 80px 0;
            background: white;
        }

        .features h2 {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 3rem;
            color: #333;
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
        }

        .feature-card {
            background: white;
            padding: 2rem;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            text-align: center;
            transition: transform 0.3s ease;
        }

        .feature-card:hover {
            transform: translateY(-5px);
        }

        .feature-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            color: #667eea;
        }

        .feature-card h3 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #333;
        }

        .feature-card p {
            color: #666;
            line-height: 1.6;
        }

        .footer {
            background: #333;
            color: white;
            text-align: center;
            padding: 2rem 0;
        }

        .footer p {
            opacity: 0.8;
        }

        @media (max-width: 768px) {
            .hero h1 {
                font-size: 2.5rem;
            }
            
            .nav-links {
                display: none;
            }
            
            .features-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <nav class="nav container">
            <a href="/" class="logo">ReportIn</a>
            <ul class="nav-links">
                <li><a href="#features">Fitur</a></li>
                <li><a href="#download">Download</a></li>
                <li><a href="#contact">Kontak</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section class="hero">
            <div class="container">
                <h1>Kelola Keuangan dengan Mudah</h1>
                <p>Aplikasi manajemen keuangan modern untuk mengelola pemasukan, pengeluaran, dan analisis keuangan pribadi Anda dengan mudah dan aman.</p>
                <a href="#download" class="cta-button">Download Sekarang</a>
            </div>
        </section>

        <section class="features" id="features">
            <div class="container">
                <h2>Fitur Unggulan</h2>
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">💰</div>
                        <h3>Manajemen Keuangan</h3>
                        <p>Kelola pemasukan dan pengeluaran dengan mudah. Catat setiap transaksi dan pantau alur keuangan Anda.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">📊</div>
                        <h3>Analisis Detail</h3>
                        <p>Dapatkan insight mendalam tentang pola pengeluaran dan pemasukan Anda dengan grafik dan laporan yang informatif.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">🔒</div>
                        <h3>Keamanan Data</h3>
                        <p>Data keuangan Anda aman dengan enkripsi end-to-end dan autentikasi yang kuat.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">💬</div>
                        <h3>Chat Real-time</h3>
                        <p>Berbagi informasi keuangan dengan teman dan keluarga melalui fitur chat yang aman dan real-time.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">📱</div>
                        <h3>Multi-platform</h3>
                        <p>Akses aplikasi dari mana saja. Tersedia untuk Android dengan performa yang optimal.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">⚡</div>
                        <h3>Performa Cepat</h3>
                        <p>Dibangun dengan teknologi modern untuk memberikan pengalaman yang cepat dan responsif.</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="hero" id="download">
            <div class="container">
                <h2>Download Aplikasi</h2>
                <p>Dapatkan ReportIn sekarang dan mulai kelola keuangan Anda dengan lebih baik.</p>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 2rem;">
                    <a href="/downloads/reportin-latest.apk" class="cta-button">Download APK Terbaru</a>
                    <a href="/downloads" class="cta-button" style="background: rgba(255, 255, 255, 0.1);">Lihat Semua Versi</a>
                </div>
                <div style="margin-top: 2rem; text-align: center;">
                    <p style="opacity: 0.8; font-size: 0.9rem;">
                        📱 Tersedia untuk Android | 🔒 Aman dan Terpercaya | ⚡ Performa Optimal
                    </p>
                </div>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 ReportIn. Semua hak cipta dilindungi.</p>
        </div>
    </footer>
</body>
</html>`;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Simple logging with performance monitoring
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Monitor response time
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 500) {
      console.log(`🐌 Slow response (${duration}ms): ${req.method} ${req.url}`);
    }
  });
  
  next();
});

// Cache static responses
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedResponse(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCachedResponse(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// Test route
app.get('/test', (req, res) => {
  console.log('✅ Test route accessed');
  res.json({ message: 'Test route working', timestamp: new Date().toISOString() });
});

// Middleware untuk mendeteksi request dari URL lama
app.use('/api', (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const referer = req.headers['referer'] || '';
  const origin = req.headers['origin'] || '';
  
  // Deteksi jika request berasal dari URL lama
  const isOldUrl = referer.includes('trycloudflare.com') || 
                   origin.includes('trycloudflare.com') ||
                   userAgent.includes('ReportIn') && (referer.includes('trycloudflare.com') || origin.includes('trycloudflare.com'));
  
  if (isOldUrl) {
    console.log('⚠️ Request detected from old URL:', { referer, origin, userAgent });
    // Tambahkan warning header
    res.setHeader('X-ReportIn-Warning', 'URL lama terdeteksi. Silakan update aplikasi ke versi terbaru.');
    res.setHeader('X-ReportIn-New-URL', 'https://reportin.site/api');
    res.setHeader('X-ReportIn-Update-Required', 'true');
  }
  
  next();
});

// API route with trailing slash
app.get('/api/', (req, res) => {
  console.log('✅ /api/ route accessed');
  
  const response = { 
    message: 'ReportIn API is running (with slash)',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
  
  // Tambahkan warning jika menggunakan URL lama
  const referer = req.headers['referer'] || '';
  const origin = req.headers['origin'] || '';
  if (referer.includes('trycloudflare.com') || origin.includes('trycloudflare.com')) {
    response.warning = {
      message: 'URL lama terdeteksi. Silakan update aplikasi ke versi terbaru.',
      newUrl: 'https://reportin.site/api',
      updateRequired: true,
      deprecated: true
    };
  }
  
  res.json(response);
});

// API route without trailing slash
app.get('/api', (req, res) => {
  console.log('✅ /api route accessed');
  
  const response = { 
    message: 'ReportIn API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
  
  // Tambahkan warning jika menggunakan URL lama
  const referer = req.headers['referer'] || '';
  const origin = req.headers['origin'] || '';
  if (referer.includes('trycloudflare.com') || origin.includes('trycloudflare.com')) {
    response.warning = {
      message: 'URL lama terdeteksi. Silakan update aplikasi ke versi terbaru.',
      newUrl: 'https://reportin.site/api',
      updateRequired: true,
      deprecated: true
    };
  }
  
  res.json(response);
});

// API status route with caching
app.get('/api/status', (req, res) => {
  console.log('✅ /api/status route accessed');
  
  const cached = getCachedResponse('api_status');
  if (cached) {
    return res.json(cached);
  }
  
  const response = { 
    status: 'ok',
    message: 'ReportIn API is running',
    timestamp: new Date().toISOString()
  };
  
  setCachedResponse('api_status', response);
  res.json(response);
});

// Ping route
app.get('/ping', (req, res) => {
  console.log('✅ /ping route accessed');
  res.json({ status: 'ok', message: 'Server is running' });
});

// Load routes for app functionality - dengan error handling yang lebih baik
let routesLoaded = false;
try {
  const routes = require('./routes');
  app.use('/api', routes);
  routesLoaded = true;
  console.log('✅ Routes loaded successfully');
} catch (error) {
  console.log('⚠️ Routes not loaded:', error.message);
  console.log('💡 This is normal if you\'re testing basic functionality');
}

// Error handler - dengan error handling yang lebih baik
let errorHandlerLoaded = false;
try {
  const errorHandler = require('./errorHandler');
  app.use(errorHandler);
  errorHandlerLoaded = true;
  console.log('✅ Error handler loaded successfully');
} catch (error) {
  console.log('⚠️ Error handler not loaded:', error.message);
  console.log('💡 Using default error handler');
  
  // Default error handler
  app.use((err, req, res, next) => {
    console.error('Error occurred:', err.message);
    res.status(500).json({ 
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  });
}

// API Status route - untuk akses API status
app.get('/status', (req, res) => {
  console.log('✅ /status route accessed');
  res.json({
    status: 'ok',
    message: 'ReportIn API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      api: '/api',
      status: '/api/status',
      ping: '/ping',
      test: '/test'
    }
  });
});

// Download APK route
app.get('/downloads/reportin-latest.apk', (req, res) => {
  console.log('📱 APK download requested');
  
  const fs = require('fs');
  const path = require('path');
  
  // Path absolut ke folder apk_releases
  const apkReleasesDir = '/home/ubuntu/Documents/ReportIn/reportin/apk_releases';
  
  // Cari file APK terbaru di folder apk_releases
  if (fs.existsSync(apkReleasesDir)) {
    const files = fs.readdirSync(apkReleasesDir)
      .filter(file => file.endsWith('.apk'))
      .sort((a, b) => {
        const statsA = fs.statSync(path.join(apkReleasesDir, a));
        const statsB = fs.statSync(path.join(apkReleasesDir, b));
        return statsB.mtime.getTime() - statsA.mtime.getTime();
      });
    
    if (files.length > 0) {
      const latestApk = files[0];
      const apkPath = path.join(apkReleasesDir, latestApk);
      console.log(`✅ Found latest APK: ${latestApk}`);
      
      res.download(apkPath, 'reportin-latest.apk', (err) => {
        if (err) {
          console.log('❌ Error downloading APK:', err.message);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to download APK' });
          }
        } else {
          console.log('✅ APK downloaded successfully');
        }
      });
    } else {
      console.log('❌ No APK files found in apk_releases directory');
      res.status(404).json({ 
        error: 'No APK files found',
        message: 'No APK files found in apk_releases directory',
        directory: apkReleasesDir
      });
    }
  } else {
    console.log('❌ apk_releases directory not found:', apkReleasesDir);
    res.status(404).json({ 
      error: 'APK directory not found',
      message: 'apk_releases directory not found',
      expectedPath: apkReleasesDir
    });
  }
});

// API route untuk mendapatkan informasi versi APK
app.get('/api/apk-versions', (req, res) => {
  console.log('📱 APK versions API requested');
  
  const fs = require('fs');
  const path = require('path');
  const versionFile = '/home/ubuntu/Documents/ReportIn/reportin/apk_releases/version.json';
  
  try {
    if (fs.existsSync(versionFile)) {
      const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
      res.json({
        success: true,
        data: versionData
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Version file not found',
        message: 'version.json not found in apk_releases directory'
      });
    }
  } catch (error) {
    console.error('❌ Error reading version file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read version file',
      message: error.message
    });
  }
});

// Download APK by version route
app.get('/downloads/:version', (req, res) => {
  console.log(`📱 APK download requested for version: ${req.params.version}`);
  
  const fs = require('fs');
  const path = require('path');
  const apkReleasesDir = '/home/ubuntu/Documents/ReportIn/reportin/apk_releases';
  
  if (fs.existsSync(apkReleasesDir)) {
    const files = fs.readdirSync(apkReleasesDir)
      .filter(file => file.endsWith('.apk'));
    
    // Cari file yang cocok dengan versi yang diminta
    const requestedFile = files.find(file => 
      file.includes(req.params.version) || 
      file.toLowerCase().includes(req.params.version.toLowerCase())
    );
    
    if (requestedFile) {
      const apkPath = path.join(apkReleasesDir, requestedFile);
      console.log(`✅ Found APK: ${requestedFile}`);
      
      res.download(apkPath, requestedFile, (err) => {
        if (err) {
          console.log('❌ Error downloading APK:', err.message);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to download APK' });
          }
        } else {
          console.log('✅ APK downloaded successfully');
        }
      });
    } else {
      console.log(`❌ APK version ${req.params.version} not found`);
      res.status(404).json({ 
        error: 'APK version not found',
        message: `APK version ${req.params.version} not found`,
        availableVersions: files
      });
    }
  } else {
    console.log('❌ apk_releases directory not found:', apkReleasesDir);
    res.status(404).json({ 
      error: 'APK directory not found',
      message: 'apk_releases directory not found',
      expectedPath: apkReleasesDir
    });
  }
});

// Downloads page route
app.get('/downloads', (req, res) => {
  console.log('📋 Downloads page requested');
  
  const fs = require('fs');
  const path = require('path');
  const downloadsDir = './downloads';
  const apkReleasesDir = '/home/ubuntu/Documents/ReportIn/reportin/apk_releases';
  
  let allFiles = [];
  
  // Cek folder downloads
  if (fs.existsSync(downloadsDir)) {
    const files = fs.readdirSync(downloadsDir)
      .filter(file => file.endsWith('.apk'))
      .map(file => {
        const stats = fs.statSync(path.join(downloadsDir, file));
        return {
          name: file,
          path: `/downloads/${file}`,
          size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
          modified: stats.mtime,
          location: 'downloads'
        };
      });
    allFiles = allFiles.concat(files);
  }
  
  // Cek folder apk_releases dengan path absolut
  if (fs.existsSync(apkReleasesDir)) {
    const files = fs.readdirSync(apkReleasesDir)
      .filter(file => file.endsWith('.apk'))
      .map(file => {
        const stats = fs.statSync(path.join(apkReleasesDir, file));
        return {
          name: file,
          path: `/apk-releases/${file}`,
          size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
          modified: stats.mtime,
          location: 'apk_releases'
        };
      });
    allFiles = allFiles.concat(files);
  }
  
  // Sort by modified date (newest first)
  allFiles.sort((a, b) => new Date(b.modified) - new Date(a.modified));
  
  // Generate HTML for downloads page
  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Download ReportIn - Semua Versi APK</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }

        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 1rem 0;
            position: fixed;
            width: 100%;
            top: 0;
            z-index: 1000;
            box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
        }

        .nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
            text-decoration: none;
        }

        .nav-links {
            display: flex;
            list-style: none;
            gap: 2rem;
        }

        .nav-links a {
            text-decoration: none;
            color: #333;
            font-weight: 500;
            transition: color 0.3s ease;
        }

        .nav-links a:hover {
            color: #667eea;
        }

        .main-content {
            padding: 120px 0 80px;
            color: white;
        }

        .downloads-header {
            text-align: center;
            margin-bottom: 3rem;
        }

        .downloads-header h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
        }

        .downloads-header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }

        .downloads-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
        }

        .download-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 2rem;
            border-radius: 15px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: transform 0.3s ease;
        }

        .download-card:hover {
            transform: translateY(-5px);
        }

        .download-card.latest {
            border: 2px solid #4CAF50;
            background: rgba(76, 175, 80, 0.1);
        }

        .download-card h3 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: white;
        }

        .download-info {
            margin-bottom: 1.5rem;
        }

        .download-info p {
            margin-bottom: 0.5rem;
            opacity: 0.9;
        }

        .download-button {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: 600;
            transition: all 0.3s ease;
            border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .download-button:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }

        .latest-badge {
            background: #4CAF50;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: bold;
            margin-bottom: 1rem;
            display: inline-block;
        }

        .no-files {
            text-align: center;
            padding: 3rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
        }

        .back-button {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 25px;
            margin-bottom: 2rem;
            transition: all 0.3s ease;
        }

        .back-button:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        @media (max-width: 768px) {
            .downloads-header h1 {
                font-size: 2rem;
            }
            
            .nav-links {
                display: none;
            }
            
            .downloads-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <nav class="nav container">
            <a href="/" class="logo">ReportIn</a>
            <ul class="nav-links">
                <li><a href="/#features">Fitur</a></li>
                <li><a href="/#download">Download</a></li>
                <li><a href="/#contact">Kontak</a></li>
            </ul>
        </nav>
    </header>

    <main class="main-content">
        <div class="container">
            <a href="/" class="back-button">← Kembali ke Beranda</a>
            
            <div class="downloads-header">
                <h1>Download ReportIn</h1>
                <p>Pilih versi yang sesuai dengan kebutuhan Anda</p>
            </div>

            ${allFiles.length > 0 ? `
                <div class="downloads-grid">
                    ${allFiles.map((file, index) => `
                        <div class="download-card ${index === 0 ? 'latest' : ''}">
                            ${index === 0 ? '<div class="latest-badge">VERSI TERBARU</div>' : ''}
                            <h3>${file.name}</h3>
                            <div class="download-info">
                                <p><strong>Ukuran:</strong> ${file.size}</p>
                                <p><strong>Tanggal:</strong> ${new Date(file.modified).toLocaleDateString('id-ID')}</p>
                                <p><strong>Lokasi:</strong> ${file.location}</p>
                            </div>
                            <a href="${file.path}" class="download-button" download>
                                Download ${file.name}
                            </a>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="no-files">
                    <h3>Belum ada file APK tersedia</h3>
                    <p>Silakan build APK terlebih dahulu menggunakan perintah:</p>
                    <code style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px; display: block; margin: 1rem 0;">
                        flutter build apk --release
                    </code>
                    <p>Atau download dari GitHub Releases:</p>
                    <a href="https://github.com/reportin80/reportin-releases/releases/latest" class="download-button" target="_blank">
                        GitHub Releases
                    </a>
                </div>
            `}
        </div>
    </main>
</body>
</html>`;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Route untuk download APK dari apk_releases
app.get('/apk-releases/:filename', (req, res) => {
  const filename = req.params.filename;
  console.log(`📱 APK download requested: ${filename}`);
  
  const fs = require('fs');
  const apkPath = `/home/ubuntu/Documents/ReportIn/reportin/apk_releases/${filename}`;
  
  if (fs.existsSync(apkPath)) {
    res.download(apkPath, filename, (err) => {
      if (err) {
        console.log('❌ Error downloading APK:', err.message);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download APK' });
        }
      } else {
        console.log(`✅ APK ${filename} downloaded successfully`);
      }
    });
  } else {
    console.log(`❌ APK file not found: ${apkPath}`);
    res.status(404).json({ 
      error: 'APK file not found',
      message: `File ${filename} not found in apk_releases directory`,
      expectedPath: apkPath,
      availableReleases: 'https://github.com/reportin80/reportin-releases/releases/latest'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  
  // Jika request untuk API, kembalikan JSON
  if (req.originalUrl.startsWith('/api')) {
  res.status(404).json({ 
      error: 'API endpoint not found',
    path: req.originalUrl,
      availableRoutes: ['/api', '/api/', '/api/status', '/ping', '/test']
    });
  } else {
    // Jika bukan API, kembalikan halaman 404 HTML
    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Halaman Tidak Ditemukan | ReportIn</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        h1 {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        a {
            color: white;
            text-decoration: none;
            background: rgba(255, 255, 255, 0.2);
            padding: 12px 24px;
            border-radius: 25px;
            transition: all 0.3s ease;
        }
        a:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>404</h1>
        <p>Halaman yang Anda cari tidak ditemukan.</p>
        <a href="/">Kembali ke Beranda</a>
    </div>
</body>
</html>`;
    res.status(404).setHeader('Content-Type', 'text/html').send(html);
  }
});

const PORT = process.env.PORT || 5005;

// Get dynamic IP addresses
const localIPs = getLocalIPs();
const primaryIP = getPrimaryIP();

// Start server dengan error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on dynamic IPs:`);
  console.log(`   - Primary: http://${primaryIP.address}:${PORT}/`);
  console.log(`   - Localhost: http://localhost:${PORT}/`);
  console.log(`   - 127.0.0.1: http://127.0.0.1:${PORT}/`);
  
  if (localIPs.length > 0) {
    console.log(`📋 Available network interfaces:`);
    localIPs.forEach((ip, index) => {
      console.log(`   ${index + 1}. ${ip.interface}: http://${ip.address}:${PORT}/`);
    });
  }
  
  console.log(`📋 Available endpoints:`);
  console.log(`   - Homepage: http://${primaryIP.address}:${PORT}/`);
  console.log(`   - API Root: http://${primaryIP.address}:${PORT}/api`);
  console.log(`   - API Status: http://${primaryIP.address}:${PORT}/api/status`);
  console.log(`   - Server Status: http://${primaryIP.address}:${PORT}/status`);
  console.log(`   - Ping: http://${primaryIP.address}:${PORT}/ping`);
  console.log(`   - Test: http://${primaryIP.address}:${PORT}/test`);
  
  if (routesLoaded) {
    console.log(`🔗 App routes: /api/register, /api/login, /api/transactions`);
  }
  
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📦 Node.js version: ${process.version}`);
  console.log(`⚡ Compression enabled for better performance`);
  console.log(`🌐 Dynamic IP detection enabled`);
  
  // Initialize WebSocket service after server is created
  let webSocketService = null;
  try {
    const WebSocketService = require('./websocket_service');
    webSocketService = new WebSocketService(server);
    console.log('🔌 WebSocket service initialized');
  } catch (error) {
    console.log('⚠️ WebSocket service not loaded:', error.message);
    console.log('💡 Real-time chat features will not be available');
  }
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    console.error('💡 Try: sudo lsof -i :5005 && sudo kill -9 <PID>');
  } else {
    console.error('❌ Server error:', error.message);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
