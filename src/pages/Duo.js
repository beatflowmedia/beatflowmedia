import React from "react";
import Footer from "../components/Footer";

export default function Duo() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Premium Duo</h1>
          <p className="text-xl text-gray-400 mb-12">
            2 Premium accounts for couples under one roof
          </p>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto bg-gradient-to-br from-pink-600 to-red-600 rounded-lg p-8 mb-12">
            <h2 className="text-3xl font-bold mb-4">2 Accounts</h2>
            <div className="mb-6">
              <span className="text-5xl font-bold">$14.99</span>
              <span className="text-xl text-gray-200"> / month</span>
            </div>
            <button className="w-full bg-white text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors mb-4">
              Get Premium Duo
            </button>
            <p className="text-sm text-center text-gray-200">
              Free for 1 month, then $14.99 per month after. For couples who reside at the same address. Cancel anytime.
            </p>
          </div>

          {/* Why Duo */}
          <div className="bg-pink-900/30 border border-pink-700 rounded-lg p-6 mb-12">
            <h3 className="text-xl font-bold mb-3">💑 Perfect for couples</h3>
            <p className="text-gray-300 mb-4">
              Premium Duo is designed for two people who live together. Each person gets their own Premium account,
              so music tastes won't get mixed up, and you can listen to different things at the same time.
            </p>
            <p className="text-gray-400 text-sm">
              Both members must reside at the same address to be eligible.
            </p>
          </div>

          {/* Features */}
          <h2 className="text-3xl font-bold mb-6 text-center">What you'll get</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">👥</div>
              <div>
                <h3 className="text-xl font-bold mb-2">2 Premium accounts</h3>
                <p className="text-gray-400">
                  Each person gets their own account with separate libraries and recommendations.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">❤️</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Duo Mix playlist</h3>
                <p className="text-gray-400">
                  A special playlist that combines both of your music tastes, updated regularly.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">🎵</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Ad-free listening</h3>
                <p className="text-gray-400">
                  Both accounts enjoy music without interruptions from ads.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">📥</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Offline playback</h3>
                <p className="text-gray-400">
                  Download up to 10,000 songs each, on 5 devices per account.
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

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">⏭️</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Unlimited skips</h3>
                <p className="text-gray-400">
                  Skip as many songs as you want on both accounts.
                </p>
              </div>
            </div>
          </div>

          {/* Comparison */}
          <h2 className="text-3xl font-bold mb-6 text-center">Compare plans</h2>
          <div className="overflow-x-auto mb-12">
            <table className="w-full bg-gray-800 rounded-lg">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-4">Feature</th>
                  <th className="text-center p-4">2 Individual Plans</th>
                  <th className="text-center p-4 bg-pink-600/20">Premium Duo</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700">
                  <td className="p-4">Number of accounts</td>
                  <td className="text-center p-4">2</td>
                  <td className="text-center p-4 bg-pink-600/10">2</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="p-4">Duo Mix playlist</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4 bg-pink-600/10">✓</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="p-4">Ad-free listening</td>
                  <td className="text-center p-4">✓</td>
                  <td className="text-center p-4 bg-pink-600/10">✓</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="p-4">Offline playback</td>
                  <td className="text-center p-4">✓</td>
                  <td className="text-center p-4 bg-pink-600/10">✓</td>
                </tr>
                <tr>
                  <td className="p-4">Monthly price</td>
                  <td className="text-center p-4">$21.98</td>
                  <td className="text-center p-4 bg-pink-600/10">$14.99 (Save $6.99)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* FAQ */}
          <h2 className="text-3xl font-bold mb-6">Frequently asked questions</h2>
          <div className="space-y-4 mb-12">
            {[
              {
                question: "Do we both need to live at the same address?",
                answer: "Yes, Premium Duo is for two people who reside at the same address. This is verified during signup and may be checked periodically."
              },
              {
                question: "Will our music tastes get mixed up?",
                answer: "No! Each person gets their own separate account with individual listening history, recommendations, and playlists. Your music tastes stay separate."
              },
              {
                question: "What is Duo Mix?",
                answer: "Duo Mix is a special playlist that combines songs both of you love, creating a shared musical experience. It updates regularly based on your combined listening habits."
              },
              {
                question: "Can we listen at the same time?",
                answer: "Yes! Since you each have your own account, you can both listen to different music at the same time on your own devices."
              },
              {
                question: "What if we move to different addresses?",
                answer: "If you no longer live at the same address, you won't be eligible for Premium Duo. You can switch to Individual plans or choose a different plan."
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
            <h2 className="text-3xl font-bold mb-4">Save together with Premium Duo</h2>
            <p className="text-gray-400 mb-6">
              Get 1 month free, then just $14.99/month for 2 accounts. Cancel anytime.
            </p>
            <button className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-full font-semibold transition-colors">
              Get Premium Duo
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
