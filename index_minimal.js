const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test route working', timestamp: new Date().toISOString() });
});

// API route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'ReportIn API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API route with slash
app.get('/api/', (req, res) => {
  res.json({ 
    message: 'ReportIn API is running (with slash)',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API status route
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'ReportIn API is running',
    timestamp: new Date().toISOString()
  });
});

// Ping route
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'ReportIn Backend API',
    version: '1.0.0',
    endpoints: {
      api: '/api',
      status: '/api/status',
      ping: '/ping',
      test: '/test'
    }
  });
});

// Load routes for app functionality
try {
  const routes = require('./routes');
  app.use('/api', routes);
  console.log('✅ Routes loaded successfully');
} catch (error) {
  console.log('⚠️ Routes not loaded:', error.message);
}

// Error handler
try {
  const errorHandler = require('./errorHandler');
  app.use(errorHandler);
  console.log('✅ Error handler loaded successfully');
} catch (error) {
  console.log('⚠️ Error handler not loaded:', error.message);
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    availableRoutes: ['/api', '/api/', '/api/status', '/ping', '/test', '/']
  });
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://192.168.22.231:${PORT}/`);
  console.log(`📋 Available endpoints:`);
  console.log(`   - http://192.168.22.231:${PORT}/`);
  console.log(`   - http://192.168.22.231:${PORT}/api`);
  console.log(`   - http://192.168.22.231:${PORT}/api/`);
  console.log(`   - http://192.168.22.231:${PORT}/api/status`);
  console.log(`   - http://192.168.22.231:${PORT}/ping`);
  console.log(`   - http://192.168.22.231:${PORT}/test`);
}); 