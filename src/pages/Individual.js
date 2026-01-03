import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export default function Individual() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleCheckout = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    try {
      const stripe = await stripePromise;
      const response = await fetch("/.netlify/functions/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: "price_1RPFZuAEum2hO0KZ6R9hDDBS",
          userId: currentUser.uid,
          userEmail: currentUser.email,
        }),
      });

      const { sessionId } = await response.json();
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        console.error("Stripe checkout error:", error);
      }
    } catch (error) {
      console.error("Checkout error:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Beat Solo</h1>
          <p className="text-xl text-gray-400 mb-12">
            Ad-free music listening, offline playback, and unlimited skips
          </p>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto bg-gradient-to-br from-green-600 to-blue-600 rounded-lg p-8 mb-12">
            <h2 className="text-3xl font-bold mb-4">1 Account</h2>
            <div className="mb-6">
              <span className="text-5xl font-bold">$11.99</span>
              <span className="text-xl text-gray-200"> / month</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-white text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors mb-4"
            >
              Get Beat Solo
            </button>
            <p className="text-sm text-center text-gray-200">
              Free for 1 month, then $11.99 per month after. Cancel anytime.
            </p>
          </div>

          {/* Features */}
          <h2 className="text-3xl font-bold mb-6 text-center">What you'll get</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">🎵</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Ad-free music listening</h3>
                <p className="text-gray-400">
                  Enjoy uninterrupted music without any advertisements.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">📥</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Offline playback</h3>
                <p className="text-gray-400">
                  Download up to 10,000 songs on 5 different devices.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">⏭️</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Unlimited skips</h3>
                <p className="text-gray-400">
                  Skip as many songs as you want, anytime you want.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">🎧</div>
              <div>
                <h3 className="text-xl font-bold mb-2">High audio quality</h3>
                <p className="text-gray-400">
                  Stream music in high-quality 320kbps audio.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">🎨</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Support independent artists</h3>
                <p className="text-gray-400">
                  Your subscription helps emerging artists earn a living.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">📱</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Play on any device</h3>
                <p className="text-gray-400">
                  Listen on mobile, desktop, tablet, and more.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <h2 className="text-3xl font-bold mb-6">Frequently asked questions</h2>
          <div className="space-y-4 mb-12">
            {[
              {
                question: "Is there a free trial?",
                answer: "Yes! Get 1 month of Beat Solo free. You can cancel anytime before the trial ends without being charged."
              },
              {
                question: "Can I cancel anytime?",
                answer: "Absolutely. You can cancel your subscription at any time from your account settings. No questions asked."
              },
              {
                question: "What happens when I cancel?",
                answer: "You'll keep Premium access until the end of your current billing period. After that, you'll return to the free plan."
              },
              {
                question: "Can I download music for offline listening?",
                answer: "Yes! Download up to 10,000 songs on up to 5 different devices for offline playback."
              },
              {
                question: "How does this help independent artists?",
                answer: "BeatFlow pays higher royalty rates to independent artists compared to major streaming platforms, helping them earn a sustainable income from their music."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-2">{faq.question}</h3>
                <p className="text-gray-400">{faq.answer}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center bg-gray-800 rounded-lg p-12">
            <h2 className="text-3xl font-bold mb-4">Ready to upgrade your music experience?</h2>
            <p className="text-gray-400 mb-6">
              Start your free 1-month trial today. Cancel anytime.
            </p>
            <button
              onClick={handleCheckout}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-semibold transition-colors"
            >
              Try Beat Solo Free
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
