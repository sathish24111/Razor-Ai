export function errorHandler(err, req, res, next) {
  console.error(`❌ [RequestID: ${req.requestId || 'N/A'}] Internal Server Error:`, err);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const isProduction = process.env.NODE_ENV === 'production';
  const clientMessage = isProduction 
    ? 'Internal server error.' 
    : (err.message || 'An unexpected internal server error occurred.');

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
    requestId: req.requestId,
  });
}

export function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.originalUrl}`,
    requestId: req.requestId,
  });
}
