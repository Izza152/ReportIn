# VPS Troubleshooting Guide

## Error yang Dialami
```
Error: ENOENT: no such file or directory, uv_cwd
```

## Penyebab
Error ini terjadi karena:
1. **Direktori kerja tidak ada** - Current working directory telah dihapus atau tidak ada
2. **Permission issues** - Masalah hak akses di VPS
3. **Corrupted npm cache** - Cache npm yang rusak
4. **Node.js version issues** - Versi Node.js yang tidak kompatibel

## Solusi

### Solusi 1: Quick Fix (Recommended)
```bash
# Download dan jalankan script quick fix
wget https://raw.githubusercontent.com/your-repo/fix_vps_environment.sh
chmod +x fix_vps_environment.sh
./fix_vps_environment.sh
```

### Solusi 2: Manual Fix

#### Step 1: Navigasi ke direktori yang benar
```bash
cd /home/ubuntu/Documents/ReportIn/backend
pwd  # Pastikan direktori benar
```

#### Step 2: Clean npm cache
```bash
npm cache clean --force
```

#### Step 3: Hapus file yang corrupted
```bash
rm -rf node_modules package-lock.json
```

#### Step 4: Install ulang dependencies
```bash
npm install --no-optional --legacy-peer-deps
```

### Solusi 3: Alternative Installation

#### Jika npm gagal, coba yarn:
```bash
# Install yarn jika belum ada
npm install -g yarn

# Install dependencies dengan yarn
yarn install
```

#### Atau coba dengan npm settings berbeda:
```bash
npm config set registry https://registry.npmjs.org/
npm install --no-optional --legacy-peer-deps --force
```

### Solusi 4: Node.js Version Fix

#### Update Node.js ke versi yang stabil:
```bash
# Install nvm jika belum ada
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install Node.js versi LTS
nvm install 18
nvm use 18
nvm alias default 18

# Verify installation
node --version
npm --version
```

### Solusi 5: System Update

#### Update sistem Ubuntu:
```bash
sudo apt update
sudo apt upgrade -y
sudo apt install nodejs npm -y
```

## Verifikasi Instalasi

### Test Node.js:
```bash
node -e "console.log('Node.js working!')"
```

### Test npm:
```bash
npm --version
```

### Test direktori:
```bash
pwd
ls -la
```

## Troubleshooting Commands

### Check current directory:
```bash
pwd
```

### Check if directory exists:
```bash
ls -la /home/ubuntu/Documents/ReportIn/backend
```

### Check Node.js version:
```bash
node --version
npm --version
```

### Check npm cache:
```bash
npm cache verify
```

### Check system resources:
```bash
df -h
free -h
```

## Common VPS Issues

### 1. Permission Issues
```bash
# Fix permissions
sudo chown -R ubuntu:ubuntu /home/ubuntu/Documents/ReportIn
chmod -R 755 /home/ubuntu/Documents/ReportIn
```

### 2. Disk Space Issues
```bash
# Check disk space
df -h

# Clean up if needed
sudo apt autoremove
sudo apt autoclean
```

### 3. Memory Issues
```bash
# Check memory
free -h

# If low memory, try:
npm install --no-optional
```

### 4. Network Issues
```bash
# Test network connectivity
ping google.com

# Check DNS
nslookup registry.npmjs.org
```

## Alternative Setup

### Jika semua gagal, setup ulang dari awal:
```bash
# Backup data penting
cp -r /home/ubuntu/Documents/ReportIn /tmp/ReportIn_backup

# Remove old installation
rm -rf /home/ubuntu/Documents/ReportIn

# Clone fresh repository
git clone https://github.com/your-repo/ReportIn.git /home/ubuntu/Documents/ReportIn

# Setup backend
cd /home/ubuntu/Documents/ReportIn/backend
npm install
```

## Environment Variables

### Buat file .env:
```bash
cat > .env << 'EOF'
PORT=5005
JWT_SECRET=your-secret-key-here
NODE_ENV=development
EOF
```

## Start Server

### Setelah semua berhasil:
```bash
cd /home/ubuntu/Documents/ReportIn/backend
node index.js
```

### Atau dengan npm:
```bash
npm start
```

## Monitoring

### Check if server is running:
```bash
curl http://localhost:5005/api/status
```

### Check logs:
```bash
tail -f /var/log/syslog | grep node
```

## Support

Jika masih mengalami masalah:
1. Check error logs dengan `journalctl -u your-service`
2. Restart VPS jika diperlukan
3. Contact VPS provider untuk bantuan
4. Consider using Docker untuk deployment yang lebih stabil

## Prevention

### Untuk mencegah masalah di masa depan:
1. **Gunakan PM2** untuk process management
2. **Setup monitoring** dengan tools seperti htop
3. **Regular backups** dari kode dan database
4. **Use Docker** untuk deployment yang konsisten
5. **Setup CI/CD** untuk automated deployment 