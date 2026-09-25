#!/usr/bin/env node
//
// scripts/link-masters.js
//
// Point each song at its master file in Firebase Storage, and unlock the ones that
// have one.
//
//   npm run link:masters                 # dry run, reports what would change
//   npm run link:masters -- --apply      # write it
//   npm run link:masters -- --lossless-only --apply
//
// WHY THIS EXISTS
// The masters were uploaded to Firebase Storage under admin-uploads/ and nothing
// ever recorded WHERE. So every song carried previewOnly: true -- not because the
// audio was missing, but because no record could say where it was. 3.8 GB of files
// and a storefront that could not sell any of them.
//
// WHAT IT WRITES
//   masterPath   the Storage object path, e.g. admin-uploads/<uid>/1771180506589_No Echo.wav
//   masterFormat 'wav' | 'mp3' | ...
//   previewOnly  false, but ONLY where a master was actually confirmed
//
// IT WRITES A PATH, NOT A URL, and that distinction is the whole security design.
// The songs collection is world-readable. A downloadUrl field holding a public link
// would publish the product for free. A path is inert: storage.rules restricts
// admin-uploads/** to isPlatformAdmin(), so the bytes are unreachable without a
// signature, and netlify/functions/download-master.js issues that signature only
// after checking the buyer actually paid.
//
// If storage.rules is ever loosened to allow public reads on admin-uploads, this
// stops being safe. That rule is load-bearing.
//
// MATCHING IS BY TITLE, and titles are messy: smart apostrophes, "(feat. X)"
// suffixes, upload timestamps prefixed to filenames. norm() flattens all of it.
// Where several files match one title the pick is lossless > largest > newest, and
// every rejected candidate is printed so the choice can be checked rather than
// trusted.

const path = require('path');
const fs = require('fs');

const { loadEnv, initAdmin, assertProject, args, BATCH_SIZE } = require('./lib/admin');

const { has, value: valueOf } = args();

const APPLY = has('--apply');
const LOSSLESS_ONLY = has('--lossless-only');
const EXPECT_PROJECT = valueOf('project', null);
const BUCKET = valueOf('bucket', 'beatflowmedia.firebasestorage.app');




/** Flatten a title hard enough that storage filenames and catalogue titles meet.
 *  Smart apostrophes, "(feat. …)" and punctuation all differ between the two. */
function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[‘’‛ʼ]/g, "'")
    .replace(/\(feat\.?[^)]*\)/g, ' ')
    .replace(/\bfeat\.?\s.*$/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const AUDIO = new Set(['wav', 'mp3', 'flac', 'aiff', 'aif', 'm4a']);
const LOSSLESS = new Set(['wav', 'flac', 'aiff', 'aif']);

/**
 * List every object in the R2 bucket, via a SigV4-presigned ListObjectsV2.
 *
 * The masters are split across two stores for historical reasons -- WAVs went to
 * Firebase Storage through the admin uploader, MP3s to R2 for the radio station --
 * and neither store knows about the other. Reading both here is what lets one rule
 * ("prefer lossless, then largest") choose across the whole estate rather than
 * whichever store happened to be looked at first.
 *
 * Returns [] when R2 is unconfigured, so the linker still works on Firebase alone.
 */
async function listR2() {
  const crypto = require('crypto');
  const https = require('https');

  const ACCESS = process.env.R2_ACCESS_KEY_ID;
  const SECRET = process.env.R2_SECRET_ACCESS_KEY;
  const ENDPOINT = process.env.R2_MASTERS_ENDPOINT;
  const R2_BUCKET = process.env.R2_MASTERS_BUCKET;
  if (!ACCESS || !SECRET || !ENDPOINT || !R2_BUCKET) return [];

  const enc = (v) => encodeURIComponent(v).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
  const sha256 = (x) => crypto.createHash('sha256').update(x).digest('hex');
  const hmac = (k, s) => crypto.createHmac('sha256', k).update(s).digest();

  function sign(token) {
    const url = new URL(ENDPOINT);
    const stamp = new Date().toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '');
    const dateOnly = stamp.slice(0, 8);
    const scope = dateOnly + '/auto/s3/aws4_request';
    const q = {
      'list-type': '2',
      'max-keys': '1000',
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': ACCESS + '/' + scope,
      'X-Amz-Date': stamp,
      'X-Amz-Expires': '120',
      'X-Amz-SignedHeaders': 'host'
    };
    if (token) q['continuation-token'] = token;
    const cq = Object.keys(q).sort().map((k) => enc(k) + '=' + enc(q[k])).join('&');
    const uri = '/' + R2_BUCKET;
    const canonical = ['GET', uri, cq, 'host:' + url.host + '\n', 'host', 'UNSIGNED-PAYLOAD'].join('\n');
    const sts = ['AWS4-HMAC-SHA256', stamp, scope, sha256(canonical)].join('\n');
    let k = hmac('AWS4' + SECRET, dateOnly);
    k = hmac(k, 'auto'); k = hmac(k, 's3'); k = hmac(k, 'aws4_request');
    const sig = crypto.createHmac('sha256', k).update(sts).digest('hex');
    return url.protocol + '//' + url.host + uri + '?' + cq + '&X-Amz-Signature=' + sig;
  }

  const fetchUrl = (u) => new Promise((resolve) => {
    https.get(u, { timeout: 30000 }, (res) => {
      let b = '';
      res.on('data', (d) => (b += d));
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    }).on('error', () => resolve({ status: 0, body: '' }));
  });

  const out = [];
  let token = null;
  for (let page = 0; page < 20; page += 1) {
    const r = await fetchUrl(sign(token));
    if (r.status !== 200) {
      console.warn('  WARNING: R2 list returned HTTP ' + r.status + ' - continuing with Firebase only');
      return out;
    }
    const keys = [...r.body.matchAll(/<Key>([^<]+)<\/Key>/g)].map((m) => m[1]);
    const sizes = [...r.body.matchAll(/<Size>(\d+)<\/Size>/g)].map((m) => Number(m[1]));
    keys.forEach((kk, i) => out.push({ key: kk, bytes: sizes[i] || 0 }));
    if (!/<IsTruncated>true<\/IsTruncated>/.test(r.body)) break;
    const nt = /<NextContinuationToken>([^<]+)<\/NextContinuationToken>/.exec(r.body);
    if (!nt) break;
    token = nt[1];
  }
  return out;
}

async function main() {
  loadEnv();
  const { admin, projectId } = initAdmin({ storageBucket: BUCKET });

  console.log('');
  console.log(APPLY ? 'APPLYING master links' : 'DRY RUN - nothing will be written');
  console.log('  project : ' + projectId);
  console.log('  bucket  : ' + BUCKET);
  if (LOSSLESS_ONLY) console.log('  filter  : lossless only (wav/flac/aiff)');
  assertProject(projectId, EXPECT_PROJECT);

  const bucket = admin.storage().bucket();
  const [files] = await bucket.getFiles({ maxResults: 10000 });

  const candidates = files
    .filter((f) => {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      if (!AUDIO.has(ext)) return false;
      // The 30-second clips are the thing we are replacing, never the answer.
      if (f.name.startsWith('songs/previews/')) return false;
      if (f.name.includes('/previews/')) return false;
      return true;
    })
    .map((f) => {
      const base = f.name.split('/').pop();
      const stripped = base.replace(/^\d{10,}_/, '').replace(/\.[a-z0-9]+$/i, '');
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      return {
        backend: 'firebase',
        path: f.name,
        base,
        key: norm(stripped),
        ext,
        lossless: LOSSLESS.has(ext),
        bytes: Number(f.metadata.size) || 0,
        updated: f.metadata.updated || ''
      };
    });

  // R2 holds the station's MP3s. Same shape, different store, one ranking below.
  const r2Objects = await listR2();
  r2Objects.forEach((o) => {
    const ext = (o.key.split('.').pop() || '').toLowerCase();
    if (!AUDIO.has(ext)) return;
    if (o.key.includes('/previews/')) return;
    const base = o.key.split('/').pop();
    const stripped = base.replace(/^\d{10,}_/, '').replace(/\.[a-z0-9]+$/i, '');
    candidates.push({
      backend: 'r2',
      path: o.key,
      base,
      key: norm(stripped),
      ext,
      lossless: LOSSLESS.has(ext),
      bytes: o.bytes,
      updated: ''
    });
  });

  const pool = candidates.filter((c) => (LOSSLESS_ONLY ? c.lossless : true));

  const byKey = new Map();
  pool.forEach((c) => {
    if (!byKey.has(c.key)) byKey.set(c.key, []);
    byKey.get(c.key).push(c);
  });

  const db = admin.firestore();
  const snap = await db.collection('songs').get();
  const songs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const toLink = [];
  const noMaster = [];
  const alreadyLinked = [];

  songs.forEach((s) => {
    const cands = byKey.get(norm(s.title)) || [];
    if (!cands.length) { noMaster.push(s); return; }

    const ranked = [...cands].sort((a, b) => {
      if (b.lossless !== a.lossless) return (b.lossless ? 1 : 0) - (a.lossless ? 1 : 0);
      if (b.bytes !== a.bytes) return b.bytes - a.bytes;
      return String(b.updated).localeCompare(String(a.updated));
    });
    const pick = ranked[0];

    const sameBackend = (s.masterBackend || 'firebase') === pick.backend;
    if (s.masterPath === pick.path && sameBackend && s.previewOnly === false) {
      alreadyLinked.push(s);
      return;
    }
    toLink.push({ song: s, pick, rejected: ranked.slice(1) });
  });

  const mb = (b) => (b / 1048576).toFixed(1) + ' MB';

  console.log('');
  console.log('  songs                 : ' + songs.length);
  console.log('  candidate files       : ' + pool.length + '  (firebase ' + pool.filter((c) => c.backend === 'firebase').length + ', r2 ' + pool.filter((c) => c.backend === 'r2').length + ')');
  console.log('  already linked        : ' + alreadyLinked.length);
  console.log('  TO LINK               : ' + toLink.length);
  console.log('    lossless            : ' + toLink.filter((t) => t.pick.lossless).length);
  console.log('    from firebase       : ' + toLink.filter((t) => t.pick.backend === 'firebase').length);
  console.log('    from r2             : ' + toLink.filter((t) => t.pick.backend === 'r2').length);
  console.log('    lossy (mp3/m4a)     : ' + toLink.filter((t) => !t.pick.lossless).length);
  console.log('  no master found       : ' + noMaster.length + '  (stay previewOnly)');

  if (toLink.length) {
    console.log('');
    console.log('  WOULD LINK:');
    toLink.forEach((t) => {
      console.log('    ' + (t.song.title || t.song.id));
      console.log('       ' + t.pick.backend.padEnd(9) + t.pick.ext.padEnd(5) + mb(t.pick.bytes).padStart(9) + '  ' + t.pick.path);
      t.rejected.forEach((r) => console.log('       rejected: ' + r.backend + ' ' + r.ext + ' ' + mb(r.bytes) + '  ' + r.base.slice(0, 46)));
    });
  }

  if (!APPLY) {
    console.log('');
    if (toLink.length) console.log('  Re-run with --apply to write these.');
    return 0;
  }
  if (!toLink.length) return 0;

  console.log('');
  console.log('  writing...');
  let written = 0;
  for (let i = 0; i < toLink.length; i += BATCH_SIZE) {
    const slice = toLink.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    slice.forEach((t) => {
      batch.update(db.collection('songs').doc(t.song.id), {
        masterPath: t.pick.path,
        masterBackend: t.pick.backend,
        masterFormat: t.pick.ext,
        previewOnly: false
      });
    });
    await batch.commit();
    written += slice.length;
    process.stdout.write('    committed ' + written + '/' + toLink.length + '\n');
  }

  console.log('');
  console.log('  verifying by re-reading...');
  const bad = [];
  for (let i = 0; i < toLink.length; i += BATCH_SIZE) {
    const slice = toLink.slice(i, i + BATCH_SIZE);
    const snaps = await db.getAll(...slice.map((t) => db.collection('songs').doc(t.song.id)));
    snaps.forEach((d, idx) => {
      const got = d.exists ? d.data() : {};
      if (got.masterPath !== slice[idx].pick.path
          || got.masterBackend !== slice[idx].pick.backend
          || got.previewOnly !== false) {
        bad.push({ title: slice[idx].song.title, got: got.masterPath, previewOnly: got.previewOnly });
      }
    });
  }
  if (bad.length) {
    console.error('  VERIFICATION FAILED for ' + bad.length + ' record(s):');
    bad.slice(0, 10).forEach((b) => console.error('    ' + b.title + ': ' + b.got + ' previewOnly=' + b.previewOnly));
    return 1;
  }

  console.log('  verified ' + toLink.length + ' record(s) linked and unlocked.');
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('');
    console.error('  FAILED: ' + err.message);
    process.exit(1);
  });
