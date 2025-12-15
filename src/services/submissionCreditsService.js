// src/services/submissionCreditsService.js
// Service for managing artist submission credits

import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

/**
 * Get user's submission credits balance
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function getUserCredits(userId) {
  if (!userId) return 0;

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().submissionCredits || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error getting user credits:', error);
    return 0;
  }
}

/**
 * Check if user has enough credits for a submission
 * @param {string} userId
 * @param {number} requiredCredits
 * @returns {Promise<boolean>}
 */
export async function hasEnoughCredits(userId, requiredCredits = 1) {
  const currentCredits = await getUserCredits(userId);
  return currentCredits >= requiredCredits;
}

/**
 * Deduct credits after successful submission
 * @param {string} userId
 * @param {number} creditsToDeduct
 * @param {string} submissionId
 * @returns {Promise<boolean>}
 */
export async function deductCredits(userId, creditsToDeduct = 1, submissionId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const currentCredits = userDoc.data().submissionCredits || 0;

    if (currentCredits < creditsToDeduct) {
      throw new Error(`Insufficient credits. Required: ${creditsToDeduct}, Available: ${currentCredits}`);
    }

    // Deduct credits
    await updateDoc(userRef, {
      submissionCredits: currentCredits - creditsToDeduct
    });

    // Record the transaction
    await addDoc(collection(db, 'creditTransactions'), {
      userId,
      type: 'deduction',
      credits: -creditsToDeduct,
      submissionId,
      createdAt: serverTimestamp()
    });

    console.log(`✅ Deducted ${creditsToDeduct} credit(s). New balance: ${currentCredits - creditsToDeduct}`);
    return true;
  } catch (error) {
    console.error('Error deducting credits:', error);
    throw error;
  }
}

/**
 * Refund credits (if submission is rejected or failed)
 * @param {string} userId
 * @param {number} creditsToRefund
 * @param {string} reason
 * @returns {Promise<boolean>}
 */
export async function refundCredits(userId, creditsToRefund = 1, reason) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const currentCredits = userDoc.data().submissionCredits || 0;

    // Add credits back
    await updateDoc(userRef, {
      submissionCredits: currentCredits + creditsToRefund
    });

    // Record the transaction
    await addDoc(collection(db, 'creditTransactions'), {
      userId,
      type: 'refund',
      credits: creditsToRefund,
      reason,
      createdAt: serverTimestamp()
    });

    console.log(`✅ Refunded ${creditsToRefund} credit(s). New balance: ${currentCredits + creditsToRefund}`);
    return true;
  } catch (error) {
    console.error('Error refunding credits:', error);
    throw error;
  }
}
