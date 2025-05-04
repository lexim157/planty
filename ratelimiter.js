const rateLimit = require('express-rate-limit');

// Limit to 100 requests per 15 minutes
module.exports = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later'
});