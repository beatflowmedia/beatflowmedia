// config/security.js
//
// Security values that the LIVE request path actually enforces. Single source.
//
// Before this, the numbers existed in three places that disagreed:
//
//   netlify/functions/middleware/securityMiddleware.js  inline, LIVE (2 functions)
//   src/middleware/securityMiddleware.js                638 lines, zero importers
//   src/config/securityConfig.js                        564 lines, zero importers
//
// The two dead copies declared a global rate limit of 1000/15min and an auth limit
// of 10/15min. The live one enforces 100 and 20. Anyone reading the config files to
// learn the limits would have been wrong on both, which is worse than having no
// document at all.
//
// VALUES HERE ARE THE CURRENTLY ENFORCED ONES. This commit deliberately changes no
// behaviour: it gives the running numbers a name. Changing a limit is now a
// one-line decision in one file, which is the point.
//
// CommonJS, at the repo root, because the live consumer is a Netlify function and
// CRA's ModuleScopePlugin forbids src/ importing from outside itself. Same shape
// and same reason as config/csp.js.

const RATE_LIMITING = {
  // Applied per client key by the middleware's sliding window.
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
};

const CORS = {
  allowedOrigins: [
    'https://beatflowmediagroup.com',
    'https://www.beatflowmediagroup.com',
    'https://admin.beatflowmediagroup.com'
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

/** Response headers applied to every API response by the middleware. */
const HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache'
};

/* The API's own CSP is deliberately NOT unified with config/csp.js.
 *
 * config/csp.js governs the HTML application, which must load Stripe, Firebase,
 * reCAPTCHA and analytics. These endpoints return JSON to an admin caller and
 * should load nothing at all. Same directive names, opposite intent -- applying one
 * abstraction to both would loosen an API's policy to suit a web page, which is the
 * wrong direction. Kept here so it is named rather than inline, not so it is shared.
 */
const API_CONTENT_SECURITY_POLICY = {
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'", 'https://api.beatflowmediagroup.com'],
    'font-src': ["'self'"],
    'object-src': ["'none'"],
    'media-src': ["'self'"],
    'frame-src': ["'none'"]
  }
};

module.exports = {
  rateLimiting: RATE_LIMITING,
  cors: CORS,
  headers: HEADERS,
  contentSecurityPolicy: API_CONTENT_SECURITY_POLICY
};
