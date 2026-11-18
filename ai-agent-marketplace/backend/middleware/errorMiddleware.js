/**
 * Centralized Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || res.statusCode;
  if (!statusCode || statusCode === 200) {
    statusCode = 500;
  }

  // Handle Beckn-specific endpoints error shape
  if (req.originalUrl && req.originalUrl.startsWith('/beckn')) {
    return res.status(statusCode).json({
      context: req.body?.context || {},
      message: {
        ack: { status: 'NACK' }
      },
      error: {
        type: 'DOMAIN-ERROR',
        code: err.code || 'ERR-BECKN-PROCESSING',
        message: err.message || 'Internal Beckn Server Error'
      }
    });
  }

  // Standard REST API error shape
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
}

/**
 * 404 Route Not Found Middleware
 */
function notFound(req, res, next) {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}

module.exports = {
  errorHandler,
  notFound
};
