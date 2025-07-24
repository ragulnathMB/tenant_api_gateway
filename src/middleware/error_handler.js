const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Default error
  let error = { ...err };
  error.message = err.message;

  // SQL errors
  if (err.code === 'EREQUEST') {
    error.message = 'Database query error';
    error.statusCode = 400;
  }

  // Duplicate key error
  if (err.number === 2627) {
    error.message = 'Duplicate entry';
    error.statusCode = 409;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
