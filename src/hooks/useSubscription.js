// src/hooks/useSubscription.js
// Hook to check user's subscription status
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Hook to check if user has an active subscription
 * @param {object} user - The authenticated user object
 * @returns {object} - { hasSubscription, loading, subscriptionData }
 */
export function useSubscription(user) {
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState(null);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setHasSubscription(false);
        setSubscriptionData(null);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();

        if (!userData) {
          setHasSubscription(false);
          setSubscriptionData(null);
          setLoading(false);
          return;
        }

        // Check if user has an active subscription AND a Stripe customer ID
        const isActive = (userData.subscriptionStatus === 'active' || userData.isPremium || userData.premiumActive)
                        && userData.stripeCustomerId;

        setHasSubscription(isActive);
        setSubscriptionData({
          status: userData.subscriptionStatus || null,
          tier: userData.premiumTier || userData.subscriptionPlan || null,
          customerId: userData.stripeCustomerId || null,
          isPremium: userData.isPremium || userData.premiumActive || false
        });
      } catch (error) {
        console.error('Error checking subscription:', error);
        setHasSubscription(false);
        setSubscriptionData(null);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user]);

  return { hasSubscription, loading, subscriptionData };
}
