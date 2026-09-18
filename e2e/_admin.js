// e2e fixture helper — sets platform tags on tracks via the Firebase Admin SDK
// so the browse-filter specs control their own deterministic data.
// (Not a spec: filename doesn't match the test glob, so Playwright won't run it.)
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const env = {};
  const envPath = path.resolve(__dirname, '..', '.env');
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

try {
  admin.app(); // throws if no default app yet
} catch {
  const env = loadEnv();
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function setPlatforms(title, platforms) {
  const snap = await db.collection('songs').where('title', '==', title).limit(1).get();
  if (snap.empty) throw new Error(`e2e fixture: track not found: ${title}`);
  await snap.docs[0].ref.update({ platforms });
}

// Set platform tags for many tracks at once: { 'Honey Sky': ['tiktok'], ... }
async function setAll(map) {
  for (const [title, platforms] of Object.entries(map)) {
    await setPlatforms(title, platforms);
  }
}

// Mint a real Firebase ID token for a uid (mint custom token -> exchange via REST),
// so tests can exercise create-checkout's server-side token verification.
function firebaseWebApiKey() {
  const cfg = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'firebaseConfig.js'), 'utf8');
  const m = cfg.match(/apiKey:\s*["']([^"']+)["']/);
  if (!m) throw new Error('Could not read Firebase web apiKey from firebaseConfig.js');
  return m[1];
}

async function idTokenFor(uid) {
  const customToken = await admin.auth().createCustomToken(uid);
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${firebaseWebApiKey()}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }) }
  );
  const data = await res.json();
  if (!data.idToken) throw new Error('idToken exchange failed: ' + JSON.stringify(data));
  return data.idToken;
}

module.exports = { db, setPlatforms, setAll, idTokenFor };
