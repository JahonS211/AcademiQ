const rateLimit = require("express-rate-limit");

// Slightly stricter limiter for auth endpoints
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100, // Increased for development convenience
  message: "Too many auth attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = loginLimiter;

