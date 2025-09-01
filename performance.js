// Performance monitoring utilities
const performance = require('perf_hooks').performance;

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.slowQueries = [];
    this.maxSlowQueries = 100;
  }

  // Start timing
  startTimer(name) {
    this.metrics.set(name, {
      start: performance.now(),
      end: null,
      duration: null
    });
  }

  // End timing
  endTimer(name) {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.end = performance.now();
      metric.duration = metric.end - metric.start;
      
      // Log slow operations
      if (metric.duration > 100) {
        console.log(`🐌 Slow operation: ${name} took ${metric.duration.toFixed(2)}ms`);
        
        // Store slow queries
        this.slowQueries.push({
          name,
          duration: metric.duration,
          timestamp: new Date().toISOString()
        });
        
        // Keep only recent slow queries
        if (this.slowQueries.length > this.maxSlowQueries) {
          this.slowQueries.shift();
        }
      }
    }
  }

  // Get performance metrics
  getMetrics() {
    const results = {};
    for (const [name, metric] of this.metrics) {
      if (metric.duration !== null) {
        results[name] = {
          duration: metric.duration,
          timestamp: new Date().toISOString()
        };
      }
    }
    return results;
  }

  // Get slow queries
  getSlowQueries() {
    return this.slowQueries;
  }

  // Clear metrics
  clearMetrics() {
    this.metrics.clear();
    this.slowQueries = [];
  }

  // Memory usage
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
    };
  }

  // CPU usage
  getCPUUsage() {
    const startUsage = process.cpuUsage();
    return {
      user: startUsage.user,
      system: startUsage.system
    };
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

// Middleware for request timing
function requestTimer(req, res, next) {
  const start = performance.now();
  
  res.on('finish', () => {
    const duration = performance.now() - start;
    const route = `${req.method} ${req.route?.path || req.path}`;
    
    performanceMonitor.startTimer(route);
    performanceMonitor.endTimer(route);
    
    if (duration > 500) {
      console.log(`🐌 Slow request: ${route} took ${duration.toFixed(2)}ms`);
    }
  });
  
  next();
}

// Database query timer
function queryTimer(query, params, callback) {
  const start = performance.now();
  
  return function(err, result) {
    const duration = performance.now() - start;
    
    if (duration > 100) {
      console.log(`🐌 Slow query (${duration.toFixed(2)}ms): ${query.substring(0, 100)}...`);
    }
    
    callback(err, result);
  };
}

module.exports = {
  PerformanceMonitor,
  performanceMonitor,
  requestTimer,
  queryTimer
}; 