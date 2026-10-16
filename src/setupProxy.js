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
//     -> /*  /index.html  200             <- catch-all wins
//     -> browser gets text/html where it asked for JavaScript
//     -> "Uncaught SyntaxError: Unexpected token '<'" and a BLANK PAGE
//
// The fix is to invert the proxy: browse CRA directly on :3006, where webpack serves its
// own bundle from memory, and forward only the function-backed paths to the functions
// server. Netlify's redirect engine is no longer in the asset path, so it cannot swallow
// anything.
//
// WHY THE RULES ARE DERIVED FROM public/_redirects
// ------------------------------------------------
// This file has now been wrong twice, both times because it held a COPY of something.
//
//   1. It hardcoded Netlify Dev's port as 8899 with a comment saying to keep it in step
//      with netlify.toml. netlify.toml moved to 8888 on 2026-10-09; this did not. Every
//      function call in dev returned "Netlify Dev unreachable" while the functions server
//      answered happily on another port.
//
//   2. It hardcoded the forwarded paths as ['/.netlify', '/api']. Adding /verify/* to
//      _redirects and netlify.toml was not enough: the function answered correctly on
//      8888 while the app served the SPA shell for the same path. Production was fine
//      throughout, which is the worst shape for a bug -- it exists only on the machine
//      you develop on.
//
// So both the port and the routing table are now READ rather than copied. _redirects is
// already the file that wins in production; adding a function route there now makes dev
// follow automatically. No parser is used -- this file loads before any TOML or TOML-like
// dependency is available, and a dev bootstrap that can fail to parse is worse than one
// that falls back.
const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');
const path = require('path');

const NEWLINE = new RegExp('\\r?\\n');

/** Netlify Dev's port, read from netlify.toml [dev] rather than copied. */
function netlifyDevPort() {
  try {
    const toml = fs.readFileSync(path.resolve(__dirname, '..', 'netlify.toml'), 'utf8');
    const dev = toml.split(/^\[/m).find((block) => block.startsWith('dev]'));
    const m = dev && dev.match(/^\s*port\s*=\s*(\d+)/m);
    if (m) return m[1];
  } catch (err) {
    // Fall through rather than failing to boot the dev server.
  }
  return '8888';
}

// http by default: `netlify dev` cannot run in this project -- online it dies inside its
// own installIntegrationPlugins step, and with --offline it dies with "Timed out waiting
// for port '3006' to be open" before CRA finishes compiling. Dev is therefore two
// processes: `npm start` here and `npx netlify functions:serve --port 8888` alongside.
// NETLIFY_DEV_URL overrides if netlify dev is ever working again; `secure: false` below
// already tolerates its self-signed mkcert certificate.
const NETLIFY_DEV = process.env.NETLIFY_DEV_URL || ('http://localhost:' + netlifyDevPort());

/**
 * The function routes, read from public/_redirects.
 *
 * Production REWRITES these paths -- `/verify/LIC-x` is served by
 * `/.netlify/functions/verify-license/LIC-x` -- so forwarding the path unchanged reaches
 * the functions server and gets "Function not found". The rewrite has to come along with
 * the prefix, which is the whole reason this reads the rules rather than just the paths.
 *
 * @returns {{prefixes: string[], rewrite: Record<string,string>}}
 */
function functionRoutes() {
  const prefixes = new Set(['/.netlify']);
  const rewrite = {};

  try {
    const text = fs.readFileSync(path.resolve(__dirname, '..', 'public', '_redirects'), 'utf8');
    text.split(NEWLINE).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const parts = trimmed.split(/\s+/);
      const from = parts[0];
      const to = parts[1];
      if (!from || !to || to.indexOf('/.netlify/functions/') !== 0) return;

      const prefix = '/' + from.replace(/^\//, '').split('/')[0];
      if (prefix.length <= 1 || prefix === '/.netlify') return;
      prefixes.add(prefix);

      // '/verify/*' -> '/.netlify/functions/verify-license/:splat'
      //   becomes    ^/verify  ->  /.netlify/functions/verify-license
      // so the trailing segment the caller supplied is carried through untouched.
      if (from.endsWith('/*') && to.endsWith('/:splat')) {
        rewrite['^' + from.slice(0, -2)] = to.slice(0, -7);
      } else {
        // An exact path, e.g. '/api/catalog.json' -> '/.netlify/functions/catalog-feed'
        rewrite['^' + from + '$'] = to;
      }
    });
  } catch (err) {
    // Fall back to the paths that existed before this was derived.
    return { prefixes: ['/.netlify', '/api'], rewrite: {} };
  }

  return { prefixes: Array.from(prefixes), rewrite };
}

const ROUTES = functionRoutes();

module.exports = function (app) {
  app.use(
    ROUTES.prefixes,
    createProxyMiddleware({
      target: NETLIFY_DEV,
      changeOrigin: true,
      pathRewrite: ROUTES.rewrite,
      // Netlify Dev serves a locally-trusted mkcert certificate. Node does not
      // share the OS trust store that the browser uses, so without this the proxy
      // rejects its own machine's certificate.
      secure: false,
      logLevel: 'warn',
      onError(err, req, res) {
        // Say which side failed. Without this the browser reports a generic 500
        // and the obvious conclusion -- "the function is broken" -- is wrong: the
        // usual cause is simply that nothing is serving functions.
        console.error(
          `[setupProxy] ${req.method} ${req.url} -> ${NETLIFY_DEV} failed: ${err.message}\n` +
          `            Is a functions server running on ${NETLIFY_DEV}?\n` +
          '            Start one with: npx netlify functions:serve --port 8888'
        );
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
        }
        res.end(
          JSON.stringify({
            error: 'Functions server unreachable',
            detail: err.message,
            hint: 'Start it with: npx netlify functions:serve --port 8888'
          })
        );
      }
    })
  );
};

// Exported for the reconciler, which checks that every function route in _redirects is
// actually reachable in dev. Nothing in the dev server uses this.
module.exports.functionRoutes = functionRoutes;
