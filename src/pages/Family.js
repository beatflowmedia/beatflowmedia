import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export default function Family() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleCheckout = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    try {
      const stripe = await stripePromise;
      const response = await fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: "price_1RPGOLAEum2hO0KZ7tHXcspp",
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
          <h1 className="text-5xl font-bold mb-4">Beat Household</h1>
          <p className="text-xl text-gray-400 mb-12">
            Up to 6 Premium accounts for family members living under one roof
          </p>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto bg-gradient-to-br from-orange-600 to-red-600 rounded-lg p-8 mb-12">
            <h2 className="text-3xl font-bold mb-4">Up to 6 Accounts</h2>
            <div className="mb-6">
              <span className="text-5xl font-bold">$18.00</span>
              <span className="text-xl text-gray-200"> / month</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-white text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors mb-4"
            >
              Get Beat Household
            </button>
            <p className="text-sm text-center text-gray-200">
              $18.00 per month after. For up to 6 family members residing at the same address. Cancel anytime.
            </p>
          </div>

          {/* Why Family */}
          <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-6 mb-12">
            <h3 className="text-xl font-bold mb-3">👨‍👩‍👧‍👦 Best value for families</h3>
            <p className="text-gray-300 mb-4">
              Beat Household is designed for up to 6 family members living together. Everyone gets their own Premium account,
              so recommendations and playlists stay personal. Plus, you can manage content for kids with Family Mix.
            </p>
            <p className="text-gray-400 text-sm">
              All family members must reside at the same address to be eligible.
            </p>
          </div>

          {/* Features */}
          <h2 className="text-3xl font-bold mb-6 text-center">What you'll get</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">👨‍👩‍👧‍👦</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Up to 6 Premium accounts</h3>
                <p className="text-gray-400">
                  Each family member gets their own account with separate libraries and recommendations.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">🎵</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Family Mix playlist</h3>
                <p className="text-gray-400">
                  A special playlist that combines everyone's music tastes, updated regularly.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">🔒</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Parental controls</h3>
                <p className="text-gray-400">
                  Manage content for younger listeners with explicit content filters.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">🚫</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Ad-free listening</h3>
                <p className="text-gray-400">
                  All family members enjoy music without interruptions from ads.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">📥</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Offline playback</h3>
                <p className="text-gray-400">
                  Each person can download up to 10,000 songs on 5 devices.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">🎧</div>
              <div>
                <h3 className="text-xl font-bold mb-2">High audio quality</h3>
                <p className="text-gray-400">
                  Stream music in high-quality 320kbps audio on all accounts.
                </p>
              </div>
            </div>
          </div>

          {/* Value Comparison */}
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-6 mb-12 text-center">
            <h3 className="text-2xl font-bold mb-3">💰 Save up to $53/month</h3>
            <p className="text-gray-300">
              6 Beat Solo accounts would cost <span className="line-through">$71.94/month</span>
            </p>
            <p className="text-2xl font-bold text-green-400 mt-2">
              Beat Household: Only $18.00/month
            </p>
          </div>

          {/* Comparison */}
          <h2 className="text-3xl font-bold mb-6 text-center">Compare plans</h2>
          <div className="overflow-x-auto mb-12">
            <table className="w-full bg-gray-800 rounded-lg">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-4">Feature</th>
                  <th className="text-center p-4">Beat Solo</th>
                  <th className="text-center p-4">Beat Duo</th>
                  <th className="text-center p-4 bg-orange-600/20">Beat Household</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700">
                  <td className="p-4">Number of accounts</td>
                  <td className="text-center p-4">1</td>
                  <td className="text-center p-4">2</td>
                  <td className="text-center p-4 bg-orange-600/10">Up to 6</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="p-4">Family Mix playlist</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4 bg-orange-600/10">✓</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="p-4">Parental controls</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4 bg-orange-600/10">✓</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="p-4">Ad-free listening</td>
                  <td className="text-center p-4">✓</td>
                  <td className="text-center p-4">✓</td>
                  <td className="text-center p-4 bg-orange-600/10">✓</td>
                </tr>
                <tr>
                  <td className="p-4">Monthly price</td>
                  <td className="text-center p-4">$11.99</td>
                  <td className="text-center p-4">$16.99</td>
                  <td className="text-center p-4 bg-orange-600/10">$18.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* FAQ */}
          <h2 className="text-3xl font-bold mb-6">Frequently asked questions</h2>
          <div className="space-y-4 mb-12">
            {[
              {
                question: "How do I add family members?",
                answer: "As the plan manager, you can invite up to 5 other people via email. They'll need to accept the invitation and create their own BeatFlow account if they don't have one."
              },
              {
                question: "Do all family members need to live at the same address?",
                answer: "Yes, Beat Household is for family members who reside at the same address. This is verified during signup and may be checked periodically."
              },
              {
                question: "Can I remove or change family members?",
                answer: "Yes, as the plan manager, you can remove family members and invite new ones at any time through your account settings."
              },
              {
                question: "Will our playlists and recommendations get mixed up?",
                answer: "No! Each person gets their own separate account with individual listening history, recommendations, and playlists. Everyone's music tastes stay separate."
              },
              {
                question: "What are parental controls?",
                answer: "Parental controls let you filter explicit content for specific family members. This is perfect for younger listeners in the family."
              },
              {
                question: "What happens if someone leaves the family plan?",
                answer: "If you remove someone or they leave, they'll lose Premium access unless they get their own subscription. Their playlists and saved content will remain in their account."
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
            <h2 className="text-3xl font-bold mb-4">Best value for the whole family</h2>
            <p className="text-gray-400 mb-6">
              Just $18.00/month for up to 6 accounts. Cancel anytime.
            </p>
            <button
              onClick={handleCheckout}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-full font-semibold transition-colors"
            >
              Get Beat Household
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
