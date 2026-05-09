const errorMiddleware = (err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(status).json({
    success: false,
    message,
    retryDelay: err.retryDelay,
  });
};

module.exports = errorMiddleware;
