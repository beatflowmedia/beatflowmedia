// config/csp.js
//
// THE Content Security Policy. Single source.
//
// This existed in four unreferenced copies -- public/_headers, the <meta> tag in
// public/index.html, craco.config.js devServer.headers, and a dead
// src/config/securityConfig.js. A browser enforces the INTERSECTION of every
// policy present, so a value missing from ONE copy blocks the request while the
// other copies look correct. That is how App Check silently failed: two copies
// allowed reCAPTCHA, the third did not, and the served HTML was demonstrably
// right the whole time.
//
// craco.config.js requires this directly. The two static copies cannot, so they
// are RECONCILED instead: npm run verify:csp fails if they drift from this file.
// A copy that reconciles is fine; a copy that cannot is a second source of truth.
//
// CommonJS because craco.config.js is, and it runs outside the bundler.

const DIRECTIVES = {
  "default-src": [
    "'self'",
  ],
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://www.google.com/recaptcha/",
    "https://www.gstatic.com/recaptcha/",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://js.stripe.com",
    "https://apis.google.com",
    "https://www.gstatic.com",
    "https://*.firebaseapp.com",
    "https://*.firebaseio.com",
    "https://accounts.google.com",
    "https://connect.facebook.net",
    "https://analytics.tiktok.com",
    "https://pagead2.googlesyndication.com",
    "https://*.googleadservices.com",
  ],
  "style-src": [
    "'self'",
    "'unsafe-inline'",
    "https://fonts.googleapis.com",
    "https://accounts.google.com",
  ],
  "font-src": [
    "'self'",
    "https://fonts.gstatic.com",
    "data:",
  ],
  "img-src": [
    "'self'",
    "data:",
    "https:",
    "blob:",
    "https://*.googleusercontent.com",
  ],
  "media-src": [
    "'self'",
    "https://storage.googleapis.com",
    "https://firebasestorage.googleapis.com",
    "https://*.firebasestorage.app",
    "blob:",
    "data:",
  ],
  "connect-src": [
    "'self'",
    "ws://localhost:*",
    "http://localhost:*",
    "https://firestore.googleapis.com",
    "https://identitytoolkit.googleapis.com",
    "https://securetoken.googleapis.com",
    "https://firebasestorage.googleapis.com",
    "https://*.firebasestorage.app",
    "https://www.google-analytics.com",
    "https://api.stripe.com",
    "https://apis.google.com",
    "https://*.googleapis.com",
    "https://*.firebaseio.com",
    "https://*.cloudfunctions.net",
    "wss://firestore.googleapis.com",
    "wss://*.firebaseio.com",
    "https://www.facebook.com",
    "https://analytics.tiktok.com",
    "https://*.google.com",
    "https://*.doubleclick.net",
    "https://*.adtrafficquality.google",
    "https://ep1.adtrafficquality.google",
  ],
  "frame-src": [
    "'self'",
    "https://www.google.com/recaptcha/",
    "https://recaptcha.google.com/recaptcha/",
    "https://www.youtube.com",
    "https://player.vimeo.com",
    "https://js.stripe.com",
    "https://hooks.stripe.com",
    "https://accounts.google.com",
    "https://*.firebaseapp.com",
    "https://googleads.g.doubleclick.net",
    "https://*.doubleclick.net",
    "https://tpc.googlesyndication.com",
  ],
  "worker-src": [
    "'self'",
    "blob:",
  ],
  "child-src": [
    "'self'",
    "blob:",
  ],
  "object-src": [
    "'none'",
  ],
  "base-uri": [
    "'self'",
  ],
  "form-action": [
    "'self'",
    "https://checkout.stripe.com",
  ],
};

/** The policy as a single header/meta value. */
function toPolicyString() {
  return Object.entries(DIRECTIVES)
    .map(([name, values]) => name + " " + values.join(" "))
    .join("; ") + ";";
}

module.exports = { DIRECTIVES, toPolicyString };
