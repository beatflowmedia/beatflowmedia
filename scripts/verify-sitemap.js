#!/usr/bin/env node
//
// scripts/verify-sitemap.js
//
//   npm run verify:sitemap                 # against production
//   npm run verify:sitemap -- --local      # against http://localhost:3006
//
// DOES THE SITEMAP DESCRIBE A SITE THAT EXISTS?
//
// WHY THIS EXISTS — A SITEMAP IS NEVER VISIBLY WRONG
//
// On 2026-10-23, Search Console reported "Success — 24 discovered pages" for a sitemap
// that listed nine pages of a stalled product, the cookie policy, two URLs returning
// 301, and not one of the 23 collections or 906 songs BFMG sells. Nothing errored.
// Nothing could error: a sitemap is a list of strings, and the only symptom of a wrong
// one is pages that quietly fail to get indexed, six months later, with no event to
// trace it to.
//
// The second fault found the same day was worse and even quieter. /sitemap-songs.xml
// was routed in netlify.toml and NOT in public/_redirects, and _redirects wins -- so the
// SPA catch-all matched first and the URL returned index.html with HTTP 200. Google saw
// a page, found no URLs in it, and the entire song catalogue has never been submitted.
// A 200 response is why nobody noticed.
//
// SO THIS CHECKS TWO THINGS NOTHING ELSE DOES:
//
//   1. every URL in every sitemap returns 200 -- not 301, not 404
//   2. every sitemap returns XML -- not the SPA shell wearing a 200
//
// The second is the one that matters most, because it is the failure that looks like
// success.

const https = require('https');
const http = require('http');

const PROD = 'https://beatflowmediagroup.com';
const LOCAL = 'http://localhost:3006';

const args = process.argv.slice(2);
const BASE = args.includes('--local') ? LOCAL : PROD;
// A sample keeps this usable as a pre-deploy check. --all is for when it matters.
const SAMPLE = args.includes('--all') ? Infinity : 40;

/**
 * @param {boolean} full  read the WHOLE body. Sitemaps need it; URL checks do not.
 *
 * The cap exists so a HEAD-style check never holds a large page in memory, and capping
 * a SITEMAP was a bug in this script's first version: at 4000 bytes it counted only the
 * URLs in the first 4KB and reported the 906-song sitemap as having 69. It never caused
 * a false pass -- the shell detection reads the opening bytes and the URL checks use
 * HEAD -- but it under-reported every sitemap over 4KB, which is every useful one.
 */
function fetchUrl(url, method = 'GET', full = false) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, { method, timeout: 20000 }, (res) => {
      let body = '';
      res.on('data', (c) => { if (full || body.length < 4000) body += c; });
      res.on('end', () => resolve({
        status: res.statusCode,
        location: res.headers.location,
        contentType: res.headers['content-type'] || '',
        body
      }));
    });
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: '', contentType: '' }); });
    req.on('error', () => resolve({ status: 0, body: '', contentType: '' }));
    req.end();
  });
}

const locsIn = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

/** The failure that looks like success: a 200 carrying the SPA shell. */
function isSpaShell(body) {
  return /<!doctype html/i.test(body) || /<div id="root">/i.test(body);
}

(async () => {
  console.log('\nverify:sitemap — does the sitemap describe a site that exists?\n');
  console.log('  base: ' + BASE + '\n');

  const problems = [];

  // --- the index -------------------------------------------------------------
  const index = await fetchUrl(`${BASE}/sitemap.xml`, 'GET', true);
  if (index.status !== 200) {
    console.error('  sitemap.xml returned ' + index.status + '. Nothing else can be checked.\n');
    process.exit(1);
  }
  if (isSpaShell(index.body)) {
    problems.push('sitemap.xml returns the SPA shell, not XML — the catch-all is matching it');
  }

  const children = locsIn(index.body);
  console.log('  sitemap index lists ' + children.length + ' child sitemap(s)');

  // --- each child ------------------------------------------------------------
  let urls = [];
  for (const child of children) {
    const res = await fetchUrl(child, 'GET', true);
    const name = child.replace(BASE, '');
    if (res.status !== 200) {
      problems.push(`${name} returned ${res.status}`);
      console.log('     ' + name + '  ' + res.status + '  FAIL');
      continue;
    }
    if (isSpaShell(res.body)) {
      // THE BIG ONE. 200 + HTML is how sitemap-songs.xml hid for six months.
      problems.push(`${name} returns the SPA shell, not XML — check it is routed in public/_redirects, not only netlify.toml`);
      console.log('     ' + name + '  200 but HTML  FAIL');
      continue;
    }
    const found = locsIn(res.body);
    if (!found.length) {
      problems.push(`${name} is valid XML but contains no URLs`);
    }
    console.log('     ' + name + '  200, ' + found.length + ' URLs');
    urls = urls.concat(found);
  }

  // --- the URLs themselves ---------------------------------------------------
  const toCheck = urls.slice(0, SAMPLE);
  console.log('');
  console.log('  checking ' + toCheck.length + ' of ' + urls.length + ' URLs' +
    (SAMPLE === Infinity ? '' : '   (--all for every one)'));

  let redirects = 0;
  let missing = 0;
  for (const url of toCheck) {
    const res = await fetchUrl(url, 'HEAD');
    if (res.status === 200) continue;
    if (res.status >= 300 && res.status < 400) {
      redirects += 1;
      // A sitemap pointing at a redirect is a documented crawl-budget leak: the crawler
      // spends a fetch to be told to spend another.
      problems.push(`${url.replace(BASE, '')} -> ${res.status} ${res.location || ''}`.trim());
    } else {
      missing += 1;
      problems.push(`${url.replace(BASE, '')} -> ${res.status}`);
    }
  }

  console.log('     redirects : ' + redirects);
  console.log('     not found : ' + missing);
  console.log('');

  if (problems.length) {
    console.log('  PROBLEMS');
    problems.slice(0, 25).forEach((p) => console.log('     ' + p));
    if (problems.length > 25) console.log('     … and ' + (problems.length - 25) + ' more');
    console.log('');
    console.log('  A sitemap is never visibly wrong — that is why this check exists.');
    console.log('  Regenerate with: npm run build:sitemap\n');
    process.exit(1);
  }

  console.log('  Every sitemap returns XML and every URL checked returns 200.\n');
  process.exit(0);
})();
