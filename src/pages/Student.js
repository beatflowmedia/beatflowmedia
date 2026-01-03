import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export default function Student() {
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
          priceId: "price_1RPG6sAEum2hO0KZGTDZIqOr",
          userId: currentUser.uid,
          userEmail: currentUser.email,
        }),
      });

      const { sessionId } = await response.json();
      const { error} = await stripe.redirectToCheckout({ sessionId });

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
          <h1 className="text-5xl font-bold mb-4">Beat Campus</h1>
          <p className="text-xl text-gray-400 mb-12">
            Special discount for verified students at accredited institutions
          </p>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg p-8 mb-12">
            <div className="bg-yellow-500 text-gray-900 px-3 py-1 rounded-full inline-block mb-4 font-semibold text-sm">
              Student Discount
            </div>
            <h2 className="text-3xl font-bold mb-4">1 Student Account</h2>
            <div className="mb-6">
              <span className="text-5xl font-bold">$9.99</span>
              <span className="text-xl text-gray-200"> / month</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-white text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors mb-4"
            >
              Get Beat Campus
            </button>
            <p className="text-sm text-center text-gray-200">
              Free for 1 month, then $9.99 per month after. Offer available only to students at accredited institutions.
            </p>
          </div>

          {/* Eligibility */}
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6 mb-12">
            <h3 className="text-xl font-bold mb-3">🎓 Student Verification Required</h3>
            <p className="text-gray-300 mb-4">
              To get Beat Campus, you must be enrolled at an accredited higher education institution.
              We verify your student status through SheerID, a third-party verification service.
            </p>
            <p className="text-gray-400 text-sm">
              Verification is required every 12 months to continue receiving the student discount.
            </p>
          </div>

          {/* Features */}
          <h2 className="text-3xl font-bold mb-6 text-center">Everything in Beat Solo</h2>
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
              <div className="text-3xl">🎓</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Student-friendly pricing</h3>
                <p className="text-gray-400">
                  Save money while enjoying all Premium features.
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
                question: "Who qualifies for Beat Campus?",
                answer: "Students currently enrolled at an accredited higher education institution qualify. This includes colleges, universities, and trade schools."
              },
              {
                question: "How do I verify my student status?",
                answer: "During sign-up, you'll be redirected to SheerID for verification. You'll need to provide your school name, full name, and date of birth."
              },
              {
                question: "How long does the student discount last?",
                answer: "You can enjoy Beat Campus for up to 4 years. We'll verify your student status every 12 months to confirm continued eligibility."
              },
              {
                question: "What happens after I graduate?",
                answer: "After graduation or if you're no longer verified as a student, you'll be moved to Beat Solo at the regular price of $11.99/month. You'll be notified before any price change."
              },
              {
                question: "Can I cancel anytime?",
                answer: "Yes! You can cancel your subscription at any time from your account settings with no cancellation fees."
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
            <h2 className="text-3xl font-bold mb-4">Study, chill, and party with Premium</h2>
            <p className="text-gray-400 mb-6">
              Get 1 month free, then just $9.99/month for students. Verify your status to get started.
            </p>
            <button
              onClick={handleCheckout}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full font-semibold transition-colors"
            >
              Get Beat Campus
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
