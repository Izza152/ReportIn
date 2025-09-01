# ReportIn Backend - Ubuntu 24 Compatible

## Prerequisites
- Node.js 18+ (Ubuntu 24 comes with Node.js 18)
- SQLite3
- Build tools (for native dependencies)

## Installation on Ubuntu 24

### 1. Install System Dependencies
```bash
sudo apt update
sudo apt install -y nodejs npm sqlite3 libsqlite3-dev build-essential python3
```

### 2. Clone/Setup Project
```bash
cd ~/Documents/ReportIn/backend
```

### 3. Install Node.js Dependencies
```bash
npm install
```

### 4. Setup Environment Variables
```bash
cp .env.example .env
nano .env
```

Edit `.env` file:
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5005
NODE_ENV=development
```

### 5. Initialize Database
```bash
npm run init-db
```

### 6. Start Server
```bash
# Production
npm start

# Development (with auto-restart)
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user

### Transactions (requires authentication)
- `GET /api/transactions` - Get all transactions for user
- `POST /api/transactions` - Add new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Health Check
- `GET /api/ping` - Health check
- `GET /api/status` - API status
- `GET /ping` - Server ping
- `GET /test` - Test endpoint

## Troubleshooting

### SQLite3 Issues
If you get SQLite3 errors:
```bash
sudo apt install sqlite3 libsqlite3-dev
npm rebuild sqlite3
```

### Port Issues
If port 5005 is in use:
```bash
# Check what's using the port
sudo lsof -i :5005

# Kill the process
sudo kill -9 <PID>
```

### Permission Issues
```bash
# Fix file permissions
chmod 755 ~/Documents/ReportIn/backend
chmod 644 ~/Documents/ReportIn/backend/*.js
```

## Environment Variables
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 5005)
- `NODE_ENV` - Environment (development/production) 