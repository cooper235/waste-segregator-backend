/**
 * Security Headers Middleware
 * Implements comprehensive security headers to protect against common web vulnerabilities
 */

const helmet = require("helmet")
const mongoSanitize = require("express-mongo-sanitize")
const xss = require("xss-clean")
const hpp = require("hpp")

/**
 * Apply comprehensive security headers
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
})

/**
 * Data sanitization against NoSQL injection
 */
const dataSanitization = mongoSanitize({
  replaceWith: "_",
  onSanitize: ({ req, key }) => {
    console.log(`[Security] Sanitized key: ${key}`)
  },
})

/**
 * Data sanitization against XSS attacks
 */
const xssSanitization = xss()

/**
 * Prevent HTTP Parameter Pollution attacks
 */
const preventHpp = hpp({
  whitelist: ["sort", "fields", "page", "limit", "category", "status", "binId", "workerId", "severity"],
})

module.exports = {
  securityHeaders,
  dataSanitization,
  xssSanitization,
  preventHpp,
}
