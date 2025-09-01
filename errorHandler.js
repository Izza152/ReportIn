function errorHandler(err, req, res, next) {
  console.error('Error occurred:', err.message);
  console.error('Stack trace:', err.stack);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation Error', 
      error: err.message 
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      message: 'Unauthorized', 
      error: err.message 
    });
  }
  
  // Default error response
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
}

module.exports = errorHandler; 