import rateLimit from 'express-rate-limit';

// Rate limiter for authentication attempts (mitigates brute force / credential stuffing)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // allow up to 150 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

// Rate limiter for Electronic Signature ceremony
export const signatureLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // allow up to 100 signing attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Electronic signature ceremony rate limit exceeded. Please try again later.',
  },
});
