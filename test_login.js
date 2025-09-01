const http = require('http');

console.log('🧪 Testing login API...');

const testData = JSON.stringify({
  email: 'test@gmail.com',
  password: 'password123'
});

const options = {
  hostname: 'localhost',
  port: 5005,
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testData)
  }
};

const req = http.request(options, (res) => {
  console.log(`📡 Response Status: ${res.statusCode}`);
  console.log(`📋 Response Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📄 Response Body:', data);
    
    try {
      const response = JSON.parse(data);
      if (response.success) {
        console.log('✅ Login successful!');
        console.log('🔑 Token:', response.data?.token ? 'Received' : 'Missing');
        console.log('👤 User:', response.data?.user?.name || 'Unknown');
      } else {
        console.log('❌ Login failed:', response.message);
      }
    } catch (e) {
      console.log('❌ Error parsing response:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.log('❌ Request error:', e.message);
  console.log('💡 Make sure backend server is running on port 5005');
});

req.write(testData);
req.end(); 