import React from "react";
import Footer from "../components/Footer";
import StripeButton from "../components/StripeButton";

export default function Duo() {

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Beat Duo</h1>
          <p className="text-xl text-gray-400 mb-12">
            2 Premium accounts for couples under one roof
          </p>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto bg-gradient-to-br from-pink-600 to-red-600 rounded-lg p-8 mb-12">
            <h2 className="text-3xl font-bold mb-4">2 Accounts</h2>
            <div className="mb-6">
              <span className="text-5xl font-bold">$16.99</span>
              <span className="text-xl text-gray-200"> / month</span>
            </div>
            <StripeButton
              priceId="price_1RPGGGAEum2hO0KZbsLLd4x1"
              className="w-full bg-white text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors mb-4"
            >
              Get Beat Duo
            </StripeButton>
            <p className="text-sm text-center text-gray-200">
              Free for 1 month, then $16.99 per month after. For couples who reside at the same address. Cancel anytime.
            </p>
          </div>

          {/* Why Duo */}
          <div className="bg-pink-900/30 border border-pink-700 rounded-lg p-6 mb-12">
            <h3 className="text-xl font-bold mb-3">💕 Made for two</h3>
            <p className="text-gray-300 mb-4">
              Beat Duo is designed for couples living together. Each person gets their own Premium account,
              with separate recommendations and personal playlists. Plus, you can create a Duo Mix playlist that combines both of your music tastes.
            </p>
            <p className="text-gray-400 text-sm">
              Both accounts must be at the same registered address to qualify for Beat Duo.
            </p>
          </div>

          {/* Features */}
          <h2 className="text-3xl font-bold mb-6 text-center">What you'll get</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">💑</div>
              <div>
                <h3 className="text-xl font-bold mb-2">2 Premium accounts</h3>
                <p className="text-gray-400">
                  Each person gets their own account with separate libraries and recommendations.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">🎵</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Duo Mix playlist</h3>
                <p className="text-gray-400">
                  A special playlist that blends both of your music preferences, updated regularly.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">🚫</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Ad-free listening</h3>
                <p className="text-gray-400">
                  Both accounts enjoy music without any interruptions from ads.
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
              <div className="text-3xl">⏭️</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Unlimited skips</h3>
                <p className="text-gray-400">
                  Both accounts can skip as many songs as they want.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">🎧</div>
              <div>
                <h3 className="text-xl font-bold mb-2">High audio quality</h3>
                <p className="text-gray-400">
                  Stream music in high-quality 320kbps audio on both accounts.
                </p>
              </div>
            </div>
          </div>

          {/* Value Comparison */}
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-6 mb-12 text-center">
            <h3 className="text-2xl font-bold mb-3">💰 Save $6.99/month</h3>
            <p className="text-gray-300">
              2 Beat Solo accounts would cost <span className="line-through">$23.98/month</span>
            </p>
            <p className="text-2xl font-bold text-green-400 mt-2">
              Beat Duo: Only $16.99/month
            </p>
          </div>

          {/* FAQ */}
          <h2 className="text-3xl font-bold mb-6">Frequently asked questions</h2>
          <div className="space-y-4 mb-12">
            {[
              {
                question: "Do we both need to live at the same address?",
                answer: "Yes, Beat Duo is for couples who live together at the same address. This is verified during signup and may be checked periodically."
              },
              {
                question: "How do I invite my partner?",
                answer: "As the plan manager, you can invite your partner via email. They'll need to accept the invitation and create their own BeatFlow account if they don't have one."
              },
              {
                question: "Will our music recommendations get mixed up?",
                answer: "No! Each person gets their own separate account with individual listening history and recommendations. Your music tastes stay completely separate."
              },
              {
                question: "What's a Duo Mix?",
                answer: "Duo Mix is a special playlist that blends both of your music preferences. It's perfect for when you're listening together and want to discover new music that you'll both enjoy."
              },
              {
                question: "Can I switch to a different plan later?",
                answer: "Yes! You can upgrade to Beat Household or downgrade to Beat Solo at any time from your account settings."
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
            <h2 className="text-3xl font-bold mb-4">Music for two, better together</h2>
            <p className="text-gray-400 mb-6">
              Get 1 month free, then just $16.99/month for 2 Premium accounts. Cancel anytime.
            </p>
            <StripeButton
              priceId="price_1RPGGGAEum2hO0KZbsLLd4x1"
              className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-full font-semibold transition-colors"
            >
              Get Beat Duo
            </StripeButton>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
