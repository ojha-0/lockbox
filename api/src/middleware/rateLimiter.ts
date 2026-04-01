import rateLimit from 'express-rate-limit'

// Global rate limiter (120 requests per minute)
export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

// Auth rate limiter (stricter - 10 attempts per minute)
export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10, // 10 attempts per minute
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true,
})
