import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default function StripeConnectOnboarding({ totalRevenue = 0, purchases = [] }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [stripeStatus, setStripeStatus] = useState(null);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);
  const [payoutSuccess, setPayoutSuccess] = useState(null);

  const loadStripeStatus = useCallback(async () => {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setStripeStatus({
          connected: !!data.stripeConnectAccountId,
          accountId: data.stripeConnectAccountId,
          status: data.stripeConnectStatus
        });
      }
    } catch (err) {
      console.error('Error loading Stripe status:', err);
    }
  }, [user]);

  const loadBalance = useCallback(async () => {
    if (!user) return;

    try {
      const balanceDoc = await getDoc(doc(db, 'artistBalances', user.uid));

      if (balanceDoc.exists()) {
        // Use the balance from Firestore (updated by webhook)
        const dbBalance = balanceDoc.data();
        setBalance({
          availableBalance: dbBalance.availableBalance || 0,
          totalEarnings: dbBalance.totalEarnings || 0,
          totalPaidOut: dbBalance.totalPaidOut || 0
        });
      } else {
        // No balance record yet - use calculated totalRevenue from props as fallback
        setBalance({
          availableBalance: totalRevenue,
          totalEarnings: totalRevenue,
          totalPaidOut: 0
        });
      }
    } catch (err) {
      console.error('Error loading balance:', err);
      // Fallback to totalRevenue if there's an error
      setBalance({
        availableBalance: totalRevenue,
        totalEarnings: totalRevenue,
        totalPaidOut: 0
      });
    }
  }, [user, totalRevenue]);

  useEffect(() => {
    loadStripeStatus();
    loadBalance();
  }, [loadStripeStatus, loadBalance]);

  const handleConnectStripe = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/create-connect-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Connect account');
      }

      // Redirect to Stripe onboarding
      window.location.href = data.onboardingUrl;
    } catch (err) {
      console.error('Error connecting Stripe:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!balance || balance.availableBalance < 10) {
      setError('Minimum payout is $10.00');
      return;
    }

    setPayoutLoading(true);
    setError(null);
    setPayoutSuccess(null);

    try {
      const response = await fetch('/.netlify/functions/request-payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          artistId: user.uid,
          requestedAmount: balance.availableBalance // Request full balance
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request payout');
      }

      setPayoutSuccess(data);
      // Reload balance
      await loadBalance();
    } catch (err) {
      console.error('Error requesting payout:', err);
      setError(err.message);
    } finally {
      setPayoutLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <p className="text-gray-400">Please sign in to set up payouts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stripe Connect Status */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Payout Account</h3>

        {stripeStatus?.connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-white">Stripe Connected</p>
                <p className="text-sm text-gray-400">You're all set to receive payouts</p>
              </div>
            </div>

            {balance && (
              <div className="space-y-4 mt-4">
                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Available Balance</p>
                      <p className="text-2xl font-bold text-green-500">
                        ${(balance.availableBalance || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Earnings</p>
                      <p className="text-2xl font-bold text-white">
                        ${(balance.totalEarnings || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Paid Out</p>
                      <p className="text-2xl font-bold text-gray-400">
                        ${(balance.totalPaidOut || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {balance.lastPayoutAt && (
                    <p className="text-xs text-gray-500 mt-3">
                      Last payout: ${(balance.lastPayoutAmount || 0).toFixed(2)} on{' '}
                      {new Date(balance.lastPayoutAt.seconds * 1000).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Payout Request Section */}
                {balance.availableBalance >= 10 ? (
                  <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">Ready to withdraw</p>
                        <p className="text-sm text-gray-400">
                          ${balance.availableBalance.toFixed(2)} available for payout
                        </p>
                      </div>
                      <button
                        onClick={handleRequestPayout}
                        disabled={payoutLoading}
                        className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                          payoutLoading
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {payoutLoading ? 'Processing...' : 'Request Payout'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                    <p className="text-sm text-gray-400">
                      Minimum payout is $10.00. Current balance: ${(balance.availableBalance || 0).toFixed(2)}
                    </p>
                  </div>
                )}

                {payoutSuccess && (
                  <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                    <p className="font-semibold text-green-500">✓ Payout initiated successfully!</p>
                    <p className="text-sm text-gray-400 mt-1">
                      ${payoutSuccess.amount.toFixed(2)} will arrive in your bank account within {payoutSuccess.expectedArrival}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <a
                href={`https://dashboard.stripe.com/${stripeStatus?.accountId ? `test/connect/accounts/${stripeStatus.accountId}` : 'test/connect/accounts'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-500 hover:underline text-sm"
              >
                View Stripe Dashboard →
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-semibold text-yellow-500">Connect Stripe to Receive Payouts</p>
                  <p className="text-sm text-gray-400 mt-1">
                    You'll earn 70% of every sale. Connect your Stripe account to receive automatic payouts.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleConnectStripe}
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                loading
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {loading ? 'Connecting...' : 'Connect Stripe Account'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              Powered by Stripe. Your earnings will be transferred automatically within 2 business days.
            </p>
          </div>
        )}
      </div>

      {/* Revenue Share Info - Hidden for single artists, shown for collaborations */}
      {/* TODO: Conditionally show when song has multiple writers */}
    </div>
  );
}
