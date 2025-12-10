import React from 'react';
import PayoutDashboard from './PayoutDashboard';
import OnboardStripe from '../components/OnboardStripe';

const ArtistPortal = ({ userId, stripeAccountId }) => {
  // Add artist-specific logic and analytics here
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h2 className="text-3xl font-bold mb-6">Artist Portal</h2>
      <PayoutDashboard userId={userId} stripeAccountId={stripeAccountId} />
      {/* Stripe onboarding for payouts */}
      <div className="mt-8">
        <OnboardStripe />
      </div>
      {/* Add artist analytics, campaign tools, etc. */}
    </div>
  );
};

export default ArtistPortal;
