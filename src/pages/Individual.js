import React from "react";
import Footer from "../components/Footer";

export default function Individual() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Premium Individual</h1>
          <p className="text-xl text-gray-400 mb-12">
            Ad-free music listening, offline playback, and unlimited skips
          </p>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto bg-gradient-to-br from-green-600 to-blue-600 rounded-lg p-8 mb-12">
            <h2 className="text-3xl font-bold mb-4">1 Account</h2>
            <div className="mb-6">
              <span className="text-5xl font-bold">$10.99</span>
              <span className="text-xl text-gray-200"> / month</span>
            </div>
            <button className="w-full bg-white text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors mb-4">
              Get Premium Individual
            </button>
            <p className="text-sm text-center text-gray-200">
              Free for 1 month, then $10.99 per month after. Cancel anytime.
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
                  Skip songs as many times as you want without limits.
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
              <div className="text-3xl">📱</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Play on any device</h3>
                <p className="text-gray-400">
                  Listen on phone, computer, tablet, speakers, TV, and more.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">🎼</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Organize listening queue</h3>
                <p className="text-gray-400">
                  Line up your favorite tracks and organize what plays next.
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
                  <th className="text-center p-4">Free</th>
                  <th className="text-center p-4 bg-green-600/20">Premium Individual</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700">
                  <td className="p-4">Ad-free music</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4 bg-green-600/10">✓</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="p-4">Offline playback</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4 bg-green-600/10">✓</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="p-4">Unlimited skips</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4 bg-green-600/10">✓</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="p-4">High audio quality</td>
                  <td className="text-center p-4">Normal</td>
                  <td className="text-center p-4 bg-green-600/10">High (320kbps)</td>
                </tr>
                <tr>
                  <td className="p-4">Monthly price</td>
                  <td className="text-center p-4">Free</td>
                  <td className="text-center p-4 bg-green-600/10">$10.99</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* FAQ */}
          <h2 className="text-3xl font-bold mb-6">Frequently asked questions</h2>
          <div className="space-y-4 mb-12">
            {[
              {
                question: "Can I cancel anytime?",
                answer: "Yes, you can cancel your Premium subscription at any time. Your subscription will remain active until the end of your billing period."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards, PayPal, and various local payment methods depending on your country."
              },
              {
                question: "Can I try Premium for free?",
                answer: "Yes, new users get 1 month of Premium Individual for free. No credit card required for the trial."
              },
              {
                question: "What happens to my playlists if I cancel?",
                answer: "Your playlists and saved content will remain available. You'll just lose access to Premium features like offline listening and ad-free playback."
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
            <h2 className="text-3xl font-bold mb-4">Ready to upgrade?</h2>
            <p className="text-gray-400 mb-6">
              Get 1 month of Premium Individual for free. Cancel anytime.
            </p>
            <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-semibold transition-colors">
              Start Free Trial
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
