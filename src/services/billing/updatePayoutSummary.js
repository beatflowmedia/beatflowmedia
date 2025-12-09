// Firestore sync utility for payout summary
// Usage: updatePayoutSummary(userId, summary)

import { db, doc, setDoc } from '../../firebaseConfig';

/**
 * Sync payout summary to Firestore for dashboard analytics
 * @param {string} userId - Curator/artist user ID
 * @param {object} summary - { lastPayout, currentBalance, royaltyTotal }
 */
export async function updatePayoutSummary(userId, summary) {
  try {
    await setDoc(doc(db, 'payoutSummaries', userId), {
      ...summary,
      updatedAt: Date.now()
    });
    return true;
  } catch (err) {
    console.error('Failed to update payout summary:', err);
    return false;
  }
}
