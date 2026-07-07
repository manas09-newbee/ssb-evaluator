const rateLimit = require("express-rate-limit");

// Exclude standard physical static asset paths
const isStaticAsset = (path) => {
  return (
    path.startsWith("/ppdt_images") ||
    /\.(css|js|png|jpg|jpeg|gif|svg|ico|json|txt|woff|woff2)$/i.test(path)
  );
};

// Global API rate-limiter: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { message: "Too many requests from this IP. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isStaticAsset(req.path),
  handler: (req, res, next, options) => {
    console.warn(`[Global Rate Limit Violation] IP: ${req.ip} triggered threshold at path: ${req.path}`);
    res.status(options.statusCode).json(options.message);
  }
});

// Authentication rate-limiter: 10 requests per 15 minutes per IP (Login, Register, Google OAuth)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many authentication attempts. Access suspended for 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    console.warn(`[Auth Rate Limit Violation] IP: ${req.ip} triggered threshold at path: ${req.path}`);
    res.status(options.statusCode).json(options.message);
  }
});

module.exports = {
  globalLimiter,
  authLimiter
};