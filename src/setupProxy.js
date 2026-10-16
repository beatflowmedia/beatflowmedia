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

// Netlify Dev's port, DERIVED from netlify.toml rather than copied.
//
// This was a literal, 8899, with a comment saying it must be kept in step with
// netlify.toml if that ever changed. It changed -- netlify.toml moved to 8888 on
// 2026-10-09 -- and this did not. The result was every function call in dev returning
// {"error":"Netlify Dev unreachable"} while the functions server sat answering happily
// on another port. Two copies of one number, and the one with the comment telling you
// to update it is the one that got missed.
//
// The original reasoning for the literal was sound as far as it went: this file loads
// before any TOML parser is available, and a dev bootstrap that can fail to parse is
// worse than one number to maintain. So it is read with a regex instead -- no parser,
// no dependency, and a fallback if the shape is ever unrecognisable.
//
// PROTOCOL: http by default, because `netlify dev` cannot run in this project (it dies
// in installIntegrationPlugins online, and with --offline it times out waiting for port
// 3006), so dev is served by `npx netlify functions:serve --port 8888`, which is plain
// http. Set NETLIFY_DEV_URL to override entirely if netlify dev is ever working again --
// `secure: false` below already tolerates its self-signed mkcert certificate.
const fs = require('fs');
const path = require('path');

function netlifyDevPort() {
  try {
    const toml = fs.readFileSync(path.resolve(__dirname, '..', 'netlify.toml'), 'utf8');
    const dev = toml.split(/^\[/m).find((block) => block.startsWith('dev]'));
    const m = dev && dev.match(/^\s*port\s*=\s*(\d+)/m);
    if (m) return m[1];
  } catch (err) {
    // Fall through to the default rather than failing to boot the dev server.
  }
  return '8888';
}

const NETLIFY_DEV = process.env.NETLIFY_DEV_URL || ('http://localhost:' + netlifyDevPort());

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
          `            Is a functions server running on ${NETLIFY_DEV}?
` +
          '            Start one with: npx netlify functions:serve --port 8888'
        );
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
        }
        res.end(
          JSON.stringify({
            error: 'Netlify Dev unreachable',
            detail: err.message,
            hint: 'Start it with: npx netlify functions:serve --port 8888'
          })
        );
      }
    })
  );
};
