// src/components/StripeButton.jsx
import { useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "../context/AuthContext";

export default function StripeButton({ priceId, children, className = "" }) {
  const { user } = useAuth();
  const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  const stripePromise = useMemo(() => {
    if (!publishableKey) {
      console.error("Missing REACT_APP_STRIPE_PUBLISHABLE_KEY or NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
      return null;
    }
    return loadStripe(publishableKey);
  }, [publishableKey]);

  const handleClick = async () => {
    if (!stripePromise) {
      alert('Stripe is not configured. Please contact support.');
      return;
    }

    try {
      const stripe = await stripePromise;

      // Prepare request body
      const body = { priceId };
      if (user) {
        body.userId = user.uid;
        body.userEmail = user.email;
      }

      const res = await fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Server error:', errorData);
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId } = await res.json();

      if (sessionId) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          console.error("Stripe redirect error:", error);
          alert(`Payment error: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(`Failed to start checkout: ${error.message}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!stripePromise}
      className={`flex-1 ${className} ${!stripePromise ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}
