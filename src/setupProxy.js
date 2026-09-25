/* eslint-disable */
// DEV ONLY. Create React App loads this file when it starts the dev server and
// never bundles it, so nothing here reaches production.
//
// The problem it solves
// ---------------------
// We used to browse through Netlify Dev (:8888), which proxied to CRA (:3006).
// That put Netlify's redirect engine in front of every asset request, and the
// SPA fallback in public/_redirects swallowed the bundle:
//
//   GET /static/js/bundle.js
//     -> no such file on disk (webpack holds it in MEMORY during dev)
//     -> /static/*  /static/:splat  200   <- rewrite to its OWN path, a no-op
//     -> /*  /index.html  200             <- catch-all wins
//     -> browser gets text/html where it asked for JavaScript
//     -> "Uncaught SyntaxError: Unexpected token '<'" and a BLANK PAGE
//
// The no-op passthrough was written to prevent exactly this and could never have
// worked: a redirect whose destination equals its source changes nothing, so the
// rule below it still matches. Production is unaffected -- there the files really
// are on disk and are served before redirects are consulted.
//
// The fix
// -------
// Invert the proxy. Browse CRA directly on :3006, where webpack serves its own
// bundle from memory natively, and forward ONLY the Netlify-specific paths to
// Netlify Dev on :8888. Netlify's redirect engine is no longer in the asset path,
// so it cannot swallow anything.
//
// This is also why the fix is not "make the redirect smarter". The rule was
// standing in for a dev-server layering mistake; correcting the layering removes
// the need for the rule instead of adding a second one to compensate. The
// production _redirects keeps its SPA fallback, which is correct there.
//
// Stripe is unaffected: `stripe listen` forwards straight to Netlify Dev and never
// goes through this proxy, so webhooks arrive exactly as before. Point --forward-to
// at the SAME port as NETLIFY_DEV below (8899) -- 8888 is Netlify Dev's default and
// another of Percy's projects uses it.
const { createProxyMiddleware } = require('http-proxy-middleware');

// Netlify Dev's port. Kept in step with netlify.toml [dev] port = 8899; if that
// changes this must change with it. It is a literal rather than a read of
// netlify.toml because this file loads before any TOML parser is available and a
// dev-server bootstrap that can fail to parse is worse than one number to update.
const NETLIFY_DEV = 'https://localhost:8899';

module.exports = function (app) {
  app.use(
    ['/.netlify', '/api'],
    createProxyMiddleware({
      target: NETLIFY_DEV,
      changeOrigin: true,
      // Netlify Dev serves a locally-trusted mkcert certificate. Node does not
      // share the OS trust store that the browser uses, so without this the proxy
      // rejects its own machine's certificate.
      secure: false,
      logLevel: 'warn',
      onError(err, req, res) {
        // Say which side failed. Without this the browser reports a generic 500
        // and the obvious conclusion -- "the function is broken" -- is wrong: the
        // usual cause is simply that Netlify Dev is not running.
        console.error(
          `[setupProxy] ${req.method} ${req.url} -> ${NETLIFY_DEV} failed: ${err.message}\n` +
          '            Is `netlify dev` running on 8899?'
        );
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
        }
        res.end(
          JSON.stringify({
            error: 'Netlify Dev unreachable',
            detail: err.message,
            hint: 'Start it with: npx netlify dev'
          })
        );
      }
    })
  );
};
