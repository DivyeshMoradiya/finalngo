const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const xss = require('xss');

// Rate limiting configuration
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Specific rate limiters for different endpoints
const authLimiter = createRateLimiter(15 * 60 * 1000, 10); // 10 requests per 15 minutes for auth
const generalLimiter = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes for general API
const uploadLimiter = createRateLimiter(60 * 60 * 1000, 20); // 20 file uploads per hour

// Helmet configuration for security headers
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173'],
    },
  },
  crossOriginEmbedderPolicy: false,
};

// XSS protection middleware
const xssProtection = (req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
  }
  next();
};

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

module.exports = {
  helmet: helmet(helmetConfig),
  rateLimit: {
    auth: authLimiter,
    general: generalLimiter,
    upload: uploadLimiter,
  },
  mongoSanitize: mongoSanitize({
    replaceWith: '_'
  }),
  hpp: hpp(),
  xssProtection,
  corsOptions,
};