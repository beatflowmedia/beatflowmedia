#!/usr/bin/env node
/**
 * verify:published — is the newest successful build the one production is serving?
 *
 * WHY THIS EXISTS
 * Twice now, pushes have built green and gone nowhere. Nothing errors, nothing retries,
 * no log line says anything is wrong: `git push` succeeds, Netlify reports the deploy
 * `ready`, and production keeps serving an older build. The first time it went unnoticed
 * for weeks. The second time it was caught only because a Playwright run against
 * production failed 8 of 9 assertions and the page it returned still showed text that had
 * been removed hours earlier.
 *
 * "Deployed" and "published" are different states, and only one of them is what a visitor
 * sees. A deploy can be `ready` with `published_at: null` forever.
 *
 * TWO CONDITIONS, AND THE SECOND IS THE QUIET ONE
 *
 *   1. The site is LOCKED. Publishing an older deploy from the Netlify UI pins the site
 *      to it (`published_deploy.locked: true`), and every subsequent build is uploaded,
 *      marked ready, and ignored. This is a deliberate human action and a reasonable
 *      feature -- it is the silence afterwards that is the problem.
 *
 *   2. The newest ready deploy simply is not the published one, lock or no lock.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 * It does not unlock, publish, or change anything. Publishing is a production action and
 * belongs to a person. This only makes the gap impossible to miss.
 *
 * Needs NETLIFY_AUTH_TOKEN (or a logged-in netlify CLI) and NETLIFY_SITE_ID.
 */

const { execSync } = require('child_process');

const SITE_ID = process.env.NETLIFY_SITE_ID || '7250c634-7aa6-4fe0-913c-9e4239a8df69';

function api(method, payload) {
  const out = execSync(
    `npx --no-install netlify api ${method} --data ${JSON.stringify(JSON.stringify(payload))}`,
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 20 * 1024 * 1024 }
  );
  return JSON.parse(out);
}

function short(sha) {
  return String(sha || '').slice(0, 8) || '(none)';
}

function ago(iso) {
  if (!iso) return 'never';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.round(mins / 60);
  return hrs < 48 ? hrs + 'h ago' : Math.round(hrs / 24) + 'd ago';
}

(function main() {
  let site;
  let deploys;
  try {
    site = api('getSite', { site_id: SITE_ID });
    deploys = api('listSiteDeploys', { site_id: SITE_ID });
  } catch (err) {
    console.error('\nverify:published — could not reach the Netlify API.');
    console.error('  Needs a logged-in netlify CLI or NETLIFY_AUTH_TOKEN.');
    console.error('  ' + String(err.message).split('\n')[0]);
    process.exit(2);
  }

  const published = site.published_deploy || {};
  const productionDeploys = (deploys || []).filter((d) => d.context === 'production');
  const newestReady = productionDeploys.find((d) => d.state === 'ready');

  console.log('\nverify:published — what production is actually serving\n');
  console.log('  published  : ' + short(published.commit_ref) +
    '  ' + (published.published_at || '(unknown)') + '  (' + ago(published.published_at) + ')');
  console.log('  newest ready: ' + short(newestReady && newestReady.commit_ref) +
    '  ' + ((newestReady && newestReady.created_at) || '(none)') +
    '  (' + ago(newestReady && newestReady.created_at) + ')');
  console.log('  locked     : ' + (published.locked === true ? 'YES' : 'no'));

  const problems = [];

  if (published.locked === true) {
    problems.push(
      'The site is LOCKED to a specific deploy. Every build since is uploaded, marked\n' +
      '    ready, and never served. Nothing errors. Unlock in the Netlify UI\n' +
      '    (Deploys -> the published deploy -> "Unlock to resume auto publishing"),\n' +
      '    or publish the intended deploy explicitly.'
    );
  }

  if (newestReady && published.id && newestReady.id !== published.id) {
    const unpublished = productionDeploys
      .filter((d) => d.state === 'ready' && !d.published_at)
      .length;
    problems.push(
      'The newest successful build is NOT the published one.\n' +
      '    ' + unpublished + ' ready deploy(s) have published_at: null — built and discarded.'
    );
  }

  if (!problems.length) {
    console.log('\nverify:published — production is serving the newest successful build.\n');
    process.exit(0);
  }

  console.error('');
  problems.forEach((p, i) => console.error('  ' + (i + 1) + '. ' + p + '\n'));
  console.error(
    'verify:published — what you pushed is not what visitors are getting.\n\n' +
    '"Deployed" and "published" are different states and only one of them is visible.\n' +
    'This has happened twice; both times every signal except the live site looked fine.\n'
  );
  process.exit(1);
})();
