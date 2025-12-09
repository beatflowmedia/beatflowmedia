// services/billing/entitlementService.js

// Firestore-based entitlement check
const { db, doc, getDocs, getDoc, collection } = require('../../firebaseConfig');

async function userCanPlay(userId, assetId) {
  // Fetch user info from Firestore
  const userDocRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userDocRef);
  if (!userSnap.exists()) return false;
  const user = userSnap.data();

  // Fetch asset info from Firestore
  const assetDocRef = doc(db, 'assets', assetId);
  const assetSnap = await getDoc(assetDocRef);
  if (!assetSnap.exists()) return false;
  const asset = assetSnap.data();

  // Subscription check
  if (!user.subscriptionActive) return false;

  // Region check
  if (asset.allowedRegions && !asset.allowedRegions.includes(user.region)) return false;

  // Rights check
  if (!asset.rights || !asset.rights.includes('play')) return false;

  // Tier check (optional)
  if (asset.requiredTier && user.tier < asset.requiredTier) return false;

  return true;
}

module.exports = { userCanPlay };

module.exports = { userCanPlay };
