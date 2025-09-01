# Profile Feature Fix

## Masalah
Halaman profile tidak bisa tersambung ke server karena:
1. Database tidak memiliki kolom `name`, `phone`, dan `updated_at` di tabel users
2. API service menggunakan `baseUrl` instead of `activeUrl`
3. Error handling yang kurang robust

## Solusi

### 1. Fix Database Structure
Jalankan script untuk menambahkan kolom yang diperlukan:

```bash
cd backend
npm run fix-users-table
```

Script ini akan menambahkan:
- `name` column (TEXT)
- `phone` column (TEXT) 
- `updated_at` column (DATETIME)

### 2. Fix API Service
API service sudah diperbaiki untuk:
- Menggunakan `activeUrl` instead of `baseUrl`
- Menambahkan proper error handling
- Menambahkan logging untuk debugging

### 3. Fix Profile Page
Profile page sudah diperbaiki untuk:
- Load data dari server terlebih dahulu
- Fallback ke local storage jika server tidak tersedia
- Proper error handling dan user feedback

## Testing

### 1. Test Database Structure
```bash
cd backend
npm run fix-users-table
```

### 2. Test Server Connection
```bash
cd backend
npm start
```

### 3. Test Profile API
```bash
# Test GET /api/profile
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5005/api/profile

# Test PUT /api/profile  
curl -X PUT -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","phone":"08123456789"}' \
  http://localhost:5005/api/profile
```

## Expected Behavior

### Profile Page
1. **Load Data**: Mencoba load dari server, fallback ke local storage
2. **Edit Profile**: Update ke server, simpan ke local storage
3. **Error Handling**: Tampilkan pesan error yang jelas
4. **Success Feedback**: Tampilkan pesan sukses

### API Endpoints
1. **GET /api/profile**: Return user profile data
2. **PUT /api/profile**: Update user profile data
3. **Validation**: Validasi email format dan unique constraint
4. **Error Codes**: Proper HTTP status codes dan error messages

## Troubleshooting

### Database Issues
```bash
# Check database structure
npm run check-db

# Reset database if needed
npm run reset-db
```

### Server Issues
```bash
# Check server status
curl http://localhost:5005/api/ping

# Check server logs
tail -f logs/server.log
```

### Flutter Issues
```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter run
```

## Files Modified

### Backend
- `routes.js`: Profile endpoints
- `fix_users_table.js`: Database migration script
- `package.json`: Added migration script

### Frontend  
- `api_service.dart`: Fixed profile API calls
- `profile_page.dart`: Improved data loading and error handling

## Notes
- Profile data akan di-cache di local storage untuk offline access
- Server validation memastikan email unik dan format valid
- Error messages dalam bahasa Indonesia untuk UX yang lebih baik 