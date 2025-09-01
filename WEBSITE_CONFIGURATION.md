# 🌐 Website Configuration - ReportIn

## 📋 Overview

Aplikasi ReportIn sekarang dikonfigurasi untuk menampilkan website yang proper ketika diakses melalui browser, sambil tetap mempertahankan fungsionalitas API untuk aplikasi mobile.

## 🎯 Konfigurasi URL

### **Website (Browser Access)**
- **URL**: `https://reportin.site/`
- **Tipe**: HTML Website
- **Fungsi**: Landing page ReportIn dengan informasi fitur dan download

### **API (Mobile App Access)**
- **URL**: `https://reportin.site/api`
- **Tipe**: JSON API
- **Fungsi**: Backend untuk aplikasi mobile ReportIn

## 📁 Route Structure

### **Website Routes**
```
/                    → Landing page ReportIn (HTML)
/status              → API status page (JSON)
/404                 → Custom 404 page (HTML)
```

### **API Routes**
```
/api                 → API base endpoint (JSON)
/api/                → API base endpoint with slash (JSON)
/api/status          → API status (JSON)
/api/login           → Login endpoint
/api/register        → Register endpoint
/api/transactions    → Transactions endpoint
/ping                → Health check (JSON)
/test                → Test endpoint (JSON)
```

## 🎨 Website Features

### **Landing Page (`/`)**
- ✅ Responsive design
- ✅ Modern UI dengan gradient background
- ✅ Fitur showcase dengan cards
- ✅ Smooth scrolling navigation
- ✅ Mobile-friendly layout
- ✅ SEO optimized dengan meta tags
- ✅ Open Graph tags untuk social media

### **404 Page**
- ✅ Custom error page
- ✅ Consistent design dengan landing page
- ✅ Link kembali ke homepage
- ✅ Responsive design

## 🔧 Technical Implementation

### **Server Configuration**
```javascript
// Root route - serve website homepage
app.get('/', (req, res) => {
  // Serves HTML landing page
});

// API Status route
app.get('/status', (req, res) => {
  // Serves JSON API status
});

// 404 handler with conditional response
app.use('*', (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    // Return JSON for API routes
  } else {
    // Return HTML for website routes
  }
});
```

### **Content-Type Handling**
- **Website routes**: `text/html`
- **API routes**: `application/json`

## 📱 Mobile App Integration

### **API Service Configuration**
```dart
// Dari api_service.dart
static const String cloudflareUrl = 'https://reportin.site/api';
static const String baseUrl = cloudflareUrl;
```

### **Endpoints yang Digunakan**
- `https://reportin.site/api/login`
- `https://reportin.site/api/register`
- `https://reportin.site/api/transactions`
- `https://reportin.site/api/status`

## 🚀 Deployment

### **VPS Configuration**
- ✅ Server berjalan di port 5005
- ✅ CORS configured untuk mobile apps
- ✅ Compression enabled
- ✅ Error handling
- ✅ WebSocket support untuk chat

### **Domain Configuration**
- ✅ `reportin.site` mengarah ke VPS
- ✅ SSL certificate (HTTPS)
- ✅ Proper DNS configuration

## 📊 Monitoring

### **Health Checks**
- `https://reportin.site/ping` - Basic health check
- `https://reportin.site/api/status` - API status
- `https://reportin.site/status` - Server status

### **Logging**
- ✅ Request logging dengan timestamp
- ✅ Performance monitoring
- ✅ Error tracking
- ✅ API endpoint monitoring

## 🔒 Security

### **CORS Configuration**
- ✅ Allowed origins untuk development
- ✅ Credentials support
- ✅ Proper headers configuration

### **Rate Limiting**
- ✅ JSON payload size limit (10MB)
- ✅ URL encoded data limit (10MB)

## 📈 Performance

### **Optimization**
- ✅ Compression enabled (level 6)
- ✅ Response caching (5 minutes)
- ✅ Static file serving
- ✅ Efficient routing

### **Monitoring**
- ✅ Slow response detection (>500ms)
- ✅ Memory usage monitoring
- ✅ Error rate tracking

## 🛠️ Maintenance

### **Server Restart**
```bash
# Restart server
pm2 restart reportin

# Check logs
pm2 logs reportin

# Monitor status
pm2 status
```

### **Database Backup**
```bash
# Backup SQLite database
cp db.sqlite backup/db_$(date +%Y%m%d_%H%M%S).sqlite
```

## 📞 Support

### **Troubleshooting**
1. **Website tidak muncul**: Check server status dan logs
2. **API error**: Verify database connection
3. **Mobile app issues**: Check API endpoints
4. **Performance issues**: Monitor server resources

### **Contact**
- **Developer**: ReportIn Team
- **Server**: VPS Ubuntu 24.04
- **Domain**: reportin.site

---

**Last Updated**: $(date)
**Version**: 1.0.0
**Status**: ✅ Active 