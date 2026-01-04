// src/components/StripeButton.jsx
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function StripeButton({ priceId, children, className = "" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  const stripePromise = useMemo(() => {
    if (!publishableKey) {
      console.error("Missing REACT_APP_STRIPE_PUBLISHABLE_KEY or NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
      return null;
    }
    return loadStripe(publishableKey);
  }, [publishableKey]);

  // Check if user has active subscription
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setHasSubscription(false);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();

        console.log('Subscription check:', {
          uid: user.uid,
          subscriptionStatus: userData?.subscriptionStatus,
          isPremium: userData?.isPremium,
          stripeCustomerId: userData?.stripeCustomerId
        });

        // Check if user has an active subscription AND a Stripe customer ID
        if ((userData?.subscriptionStatus === "active" || userData?.isPremium) && userData?.stripeCustomerId) {
          setHasSubscription(true);
        } else {
          setHasSubscription(false);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        setHasSubscription(false);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user]);

  const handleClick = async () => {
    console.log('StripeButton clicked', { user, loading, hasSubscription });

    // If not logged in, redirect to login
    if (!user) {
      console.log('No user found, redirecting to login');
      navigate("/login");
      return;
    }

    // If user has active subscription, redirect to Customer Portal
    if (hasSubscription) {
      try {
        const response = await fetch("/.netlify/functions/create-portal-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Portal session error:", errorData);

          // If portal fails, user likely doesn't have valid subscription - reset state
          setHasSubscription(false);
          alert("Unable to access subscription portal. Please subscribe to a plan.");
          return;
        }

        const { url } = await response.json();
        window.location.href = url;
        return;
      } catch (error) {
        console.error("Error creating portal session:", error);
        // Reset subscription state on error
        setHasSubscription(false);
        alert("Unable to access subscription portal. Please try subscribing again.");
        return;
      }
    }

    // User is logged in but no subscription - proceed to checkout
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
      disabled={loading || !stripePromise}
      className={`${className} ${loading || !stripePromise ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? "Loading..." : hasSubscription ? "Manage Subscription" : children}
    </button>
  );
}
