# 🔄 Update Notification System - ReportIn

## 📋 Overview

Sistem notifikasi update dirancang untuk memberitahu pengguna yang masih menggunakan URL lama (`trycloudflare.com`) agar melakukan update ke versi terbaru yang menggunakan `reportin.site`.

## 🎯 Tujuan

1. **Deteksi Otomatis**: Mendeteksi pengguna yang masih menggunakan URL lama
2. **Notifikasi User-Friendly**: Menampilkan pesan yang jelas dan tidak mengganggu
3. **Rate Limiting**: Mencegah spam notifikasi
4. **Graceful Migration**: Memungkinkan transisi yang mulus ke server baru

## 🔧 Implementasi Server-Side

### **Middleware Detection**
```javascript
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
```

### **Response Warning**
```javascript
// API route dengan warning dalam response body
app.get('/api', (req, res) => {
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
```

## 📱 Implementasi Client-Side

### **Warning Detection**
```dart
// Method untuk menangani warning dari server
static void _handleServerWarning(http.Response response) {
  final warningHeader = response.headers['x-reportin-warning'];
  final newUrlHeader = response.headers['x-reportin-new-url'];
  final updateRequiredHeader = response.headers['x-reportin-update-required'];
  
  if (warningHeader != null) {
    print('⚠️ Server Warning: $warningHeader');
    print('🔄 New URL: $newUrlHeader');
    print('📱 Update Required: $updateRequiredHeader');
    
    // Simpan warning untuk ditampilkan ke user
    _showUpdateNotification(warningHeader, newUrlHeader);
  }
}
```

### **Response Warning Handling**
```dart
// Method untuk menangani warning dalam response body
static void _handleResponseWarning(Map<String, dynamic> responseData) {
  if (responseData.containsKey('warning')) {
    final warning = responseData['warning'] as Map<String, dynamic>?;
    if (warning != null) {
      final message = warning['message'] as String?;
      final newUrl = warning['newUrl'] as String?;
      final updateRequired = warning['updateRequired'] as bool?;
      final deprecated = warning['deprecated'] as bool?;
      
      print('⚠️ Response Warning:');
      print('   Message: $message');
      print('   New URL: $newUrl');
      print('   Update Required: $updateRequired');
      print('   Deprecated: $deprecated');
      
      // Simpan warning untuk ditampilkan ke user
      _showUpdateNotification(message, newUrl);
    }
  }
}
```

## 🎨 Notification Service

### **Features**
- ✅ **Rate Limiting**: Max 5 notifications per day
- ✅ **Time Limiting**: Max 1 notification per hour
- ✅ **Multiple Formats**: Dialog, Snackbar, Banner
- ✅ **Persistent Storage**: Menggunakan SharedPreferences
- ✅ **User-Friendly**: Clear messaging dan actions

### **Notification Types**

#### **1. Dialog Notification**
```dart
static Future<void> showUpdateNotification({
  required BuildContext context,
  String? warningMessage,
  String? newUrl,
  bool forceShow = false,
}) async {
  // Implementation dengan dialog yang informatif
}
```

#### **2. Snackbar Notification**
```dart
static void showSnackBarNotification(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Row(
        children: [
          Icon(Icons.system_update, color: Colors.white, size: 20),
          SizedBox(width: 8),
          Expanded(child: Text(message)),
        ],
      ),
      backgroundColor: Colors.orange.shade600,
      duration: Duration(seconds: 4),
      action: SnackBarAction(
        label: 'Update',
        textColor: Colors.white,
        onPressed: () => _openAppStore(context),
      ),
    ),
  );
}
```

#### **3. Banner Notification**
```dart
static void showBannerNotification(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showMaterialBanner(
    MaterialBanner(
      content: Text(message),
      leading: Icon(Icons.system_update, color: Colors.orange),
      actions: [
        TextButton(onPressed: () => hideBanner(), child: Text('Tutup')),
        TextButton(onPressed: () => _openAppStore(context), child: Text('Update')),
      ],
    ),
  );
}
```

## 📊 Monitoring & Analytics

### **Server Logs**
```javascript
// Log setiap request dari URL lama
console.log('⚠️ Request detected from old URL:', { 
  referer, 
  origin, 
  userAgent,
  timestamp: new Date().toISOString()
});
```

### **Client Logs**
```dart
// Log setiap warning yang diterima
print('⚠️ Server Warning: $warningHeader');
print('🔄 New URL: $newUrlHeader');
print('📱 Update Required: $updateRequiredHeader');
```

## 🔄 Migration Strategy

### **Phase 1: Warning Only (Current)**
- ✅ Deteksi request dari URL lama
- ✅ Tampilkan warning tanpa mengganggu fungsionalitas
- ✅ Rate limiting untuk mencegah spam

### **Phase 2: Deprecation Warning**
- ⏳ Tambahkan deprecation flag
- ⏳ Tampilkan warning yang lebih prominent
- ⏳ Berikan timeline untuk shutdown

### **Phase 3: Graceful Shutdown**
- ⏳ Redirect semua request ke server baru
- ⏳ Maintain backward compatibility
- ⏳ Monitor migration progress

## 🛠️ Configuration

### **Server Configuration**
```javascript
// Environment variables
const ENABLE_UPDATE_WARNINGS = process.env.ENABLE_UPDATE_WARNINGS || 'true';
const WARNING_MESSAGE = process.env.WARNING_MESSAGE || 'URL lama terdeteksi. Silakan update aplikasi ke versi terbaru.';
const NEW_URL = process.env.NEW_URL || 'https://reportin.site/api';
```

### **Client Configuration**
```dart
// App configuration
static const bool ENABLE_UPDATE_NOTIFICATIONS = true;
static const int MAX_WARNINGS_PER_DAY = 5;
static const int WARNING_INTERVAL_HOURS = 1;
```

## 📈 Metrics & Monitoring

### **Key Metrics**
- **Old URL Requests**: Jumlah request dari URL lama
- **Warning Displayed**: Jumlah warning yang ditampilkan
- **Update Actions**: Jumlah user yang melakukan update
- **Migration Progress**: Progress migrasi ke server baru

### **Monitoring Dashboard**
```javascript
// Endpoint untuk monitoring
app.get('/api/migration-stats', (req, res) => {
  res.json({
    oldUrlRequests: getOldUrlRequestCount(),
    warningsDisplayed: getWarningCount(),
    updateActions: getUpdateActionCount(),
    migrationProgress: calculateMigrationProgress()
  });
});
```

## 🚀 Deployment

### **Server Deployment**
```bash
# Deploy dengan environment variables
ENABLE_UPDATE_WARNINGS=true \
WARNING_MESSAGE="URL lama terdeteksi. Silakan update aplikasi ke versi terbaru." \
NEW_URL="https://reportin.site/api" \
pm2 restart reportin
```

### **Client Deployment**
```bash
# Build dengan update notification enabled
flutter build apk --release \
  --dart-define=ENABLE_UPDATE_NOTIFICATIONS=true \
  --dart-define=MAX_WARNINGS_PER_DAY=5
```

## 📞 Support & Troubleshooting

### **Common Issues**
1. **Warning tidak muncul**: Check server logs dan client configuration
2. **Spam notifications**: Verify rate limiting settings
3. **False positives**: Review detection logic

### **Debug Commands**
```bash
# Check server logs
pm2 logs reportin --lines 100

# Check client logs
flutter logs

# Test warning detection
curl -H "Referer: https://old-url.trycloudflare.com" https://reportin.site/api
```

---

**Status**: ✅ **ACTIVE** - Update notification system sudah diimplementasikan dan siap digunakan untuk migrasi pengguna dari URL lama ke server baru.

**Last Updated**: $(date)
**Version**: 1.0.0 