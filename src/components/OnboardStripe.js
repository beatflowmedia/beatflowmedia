import { useState } from "react";
import { useAuth } from '../context/AuthContext';

const OnboardStripe = () => {
  const { user, role } = useAuth();
  const [onboardingUrl, setOnboardingUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOnboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/.netlify/functions/api/stripe/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, email: user.email, role })
      });
      const data = await res.json();
      if (data.onboardingUrl) {
        setOnboardingUrl(data.onboardingUrl);
      } else {
        setError(data.error || 'Failed to get onboarding link');
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg mb-8">
      <h3 className="text-xl mb-4">Stripe Payout Onboarding</h3>
      {onboardingUrl ? (
        <a href={onboardingUrl} target="_blank" rel="noopener noreferrer" className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded">Complete Stripe Onboarding</a>
      ) : (
        <button onClick={handleOnboard} disabled={loading} className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded">
          {loading ? 'Loading...' : 'Start Stripe Onboarding'}
        </button>
      )}
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
};

export default OnboardStripe;
