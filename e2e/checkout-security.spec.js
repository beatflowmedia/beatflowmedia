// e2e: prove create-checkout enforces the price SERVER-SIDE (the critical fix).
// Uses the API request fixture + Admin SDK (real price) + Stripe SDK (session amount).
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { db, idTokenFor } = require('./_admin');

// Stripe test key from .env
const env = {};
for (const line of fs.readFileSync(path.resolve(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const stripe = require('stripe')(env.STRIPE_SECRET_KEY);

test('create-checkout ignores a tampered client price and charges the real DB price', async ({ request }) => {
  // Look up a real track + its authoritative price from Firestore.
  const snap = await db.collection('songs').where('title', '==', 'Honey Sky').limit(1).get();
  expect(snap.empty).toBeFalsy();
  const songId = snap.docs[0].id;
  const realPrice = snap.docs[0].get('price') || 2900;

  // ATTACK: send price:1 for a real track.
  const res = await request.post('/api/create-checkout', {
    data: {
      userId: 'attacker', itemId: songId, itemType: 'song',
      itemName: 'HACKED', artistName: 'x', price: 1, originalPrice: 1, userEmail: 'a@a.com',
    },
  });
  expect(res.status()).toBe(200);
  const { sessionId } = await res.json();
  expect(sessionId).toBeTruthy();

  // The Stripe session must charge the real price, not the tampered 1 cent.
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  expect(session.amount_total).toBe(realPrice);
});

test('create-checkout rejects an unknown itemId (no phantom sessions)', async ({ request }) => {
  const res = await request.post('/api/create-checkout', {
    data: { userId: 'u', itemId: 'does-not-exist-xyz', itemType: 'song', price: 1, userEmail: 'a@a.com' },
  });
  // 400 (not 404): Netlify falls through function 404s to the SPA catch-all.
  expect(res.status()).toBe(400);
});

test('create-checkout still requires core fields', async ({ request }) => {
  const res = await request.post('/api/create-checkout', { data: {} });
  expect(res.status()).toBe(400);
});

test('a verified ID token overrides a spoofed body userId (anti-spoof)', async ({ request }) => {
  const snap = await db.collection('songs').where('title', '==', 'Honey Sky').limit(1).get();
  const songId = snap.docs[0].id;
  const idToken = await idTokenFor('e2e-token-user');

  const res = await request.post('/api/create-checkout', {
    headers: { Authorization: `Bearer ${idToken}` },
    data: { userId: 'attacker-spoofed', itemId: songId, itemType: 'song', price: 1, userEmail: 'a@a.com' },
  });
  expect(res.status()).toBe(200);
  const { sessionId } = await res.json();

  // The webhook fulfills to session.metadata.userId — it must be the TOKEN's uid,
  // not the spoofed body userId.
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  expect(session.metadata.userId).toBe('e2e-token-user');
});
