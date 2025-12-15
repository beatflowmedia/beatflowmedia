import React from "react";
import Footer from "../components/Footer";

export default function Audiobooks() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Audiobooks Access</h1>
          <p className="text-xl text-gray-400 mb-12">
            Unlimited audiobooks and music, all in one subscription
          </p>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg p-8 mb-12">
            <h2 className="text-3xl font-bold mb-4">Audiobooks + Music</h2>
            <div className="mb-6">
              <span className="text-5xl font-bold">$12.99</span>
              <span className="text-xl text-gray-200"> / month</span>
            </div>
            <button className="w-full bg-white text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors mb-4">
              Get Audiobooks Access
            </button>
            <p className="text-sm text-center text-gray-200">
              Includes 15 hours of audiobooks per month, plus full Premium music access. Cancel anytime.
            </p>
          </div>

          {/* What's Included */}
          <div className="bg-indigo-900/30 border border-indigo-700 rounded-lg p-6 mb-12">
            <h3 className="text-xl font-bold mb-3">📚 What's included</h3>
            <div className="space-y-3 text-gray-300">
              <p>• <span className="font-semibold">15 hours of audiobook listening per month</span> from 300,000+ audiobook titles</p>
              <p>• <span className="font-semibold">All Premium music features</span> - ad-free, offline, unlimited skips</p>
              <p>• <span className="font-semibold">High-quality audio</span> for both music and audiobooks</p>
              <p>• <span className="font-semibold">Seamless switching</span> between music and audiobooks in one app</p>
            </div>
          </div>

          {/* Features */}
          <h2 className="text-3xl font-bold mb-6 text-center">Why choose Audiobooks Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">📚</div>
              <div>
                <h3 className="text-xl font-bold mb-2">300,000+ audiobooks</h3>
                <p className="text-gray-400">
                  Access a massive library of bestsellers, classics, and new releases across all genres.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">⏱️</div>
              <div>
                <h3 className="text-xl font-bold mb-2">15 hours per month</h3>
                <p className="text-gray-400">
                  Get 15 hours of audiobook listening time every month. Unused hours don't roll over.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">🎵</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Full Premium music</h3>
                <p className="text-gray-400">
                  Enjoy all BeatFlow Premium features including ad-free listening and offline downloads.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">📱</div>
              <div>
                <h3 className="text-xl font-bold mb-2">One app for everything</h3>
                <p className="text-gray-400">
                  Switch seamlessly between audiobooks and music without leaving the app.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">🔖</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Bookmarks & progress</h3>
                <p className="text-gray-400">
                  Your listening progress syncs across devices, so you can pick up where you left off.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 flex items-start gap-4">
              <div className="text-3xl">⚡</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Playback controls</h3>
                <p className="text-gray-400">
                  Adjust playback speed, set sleep timers, and use chapter navigation.
                </p>
              </div>
            </div>
          </div>

          {/* Popular Categories */}
          <h2 className="text-3xl font-bold mb-6">Popular audiobook categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { emoji: "🕵️", name: "Mystery & Thriller" },
              { emoji: "❤️", name: "Romance" },
              { emoji: "🧙", name: "Fantasy & Sci-Fi" },
              { emoji: "📖", name: "Biography" },
              { emoji: "💼", name: "Business" },
              { emoji: "🧘", name: "Self-Help" },
              { emoji: "🎭", name: "Fiction" },
              { emoji: "📚", name: "Non-Fiction" }
            ].map((category, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-6 text-center hover:bg-gray-750 transition-colors">
                <div className="text-4xl mb-2">{category.emoji}</div>
                <p className="font-semibold">{category.name}</p>
              </div>
            ))}
          </div>

          {/* How it Works */}
          <h2 className="text-3xl font-bold mb-6 text-center">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { step: "1", title: "Subscribe", description: "Get Audiobooks Access for $12.99/month" },
              { step: "2", title: "Browse & Listen", description: "Choose from 300,000+ audiobooks and unlimited music" },
              { step: "3", title: "Enjoy Anywhere", description: "Listen on any device, online or offline" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <h2 className="text-3xl font-bold mb-6">Frequently asked questions</h2>
          <div className="space-y-4 mb-12">
            {[
              {
                question: "What happens if I don't use all 15 hours in a month?",
                answer: "Unused audiobook hours do not roll over to the next month. Your 15 hours refresh at the start of each billing cycle."
              },
              {
                question: "Can I buy more audiobook hours?",
                answer: "Yes! You can purchase additional audiobook hours through the app if you run out before the month ends."
              },
              {
                question: "Is the music access the same as Premium Individual?",
                answer: "Yes! You get all the same Premium music features: ad-free listening, offline downloads, unlimited skips, and high-quality audio."
              },
              {
                question: "Can I download audiobooks for offline listening?",
                answer: "Yes, you can download audiobooks to listen offline, just like music. They count against your device download limits."
              },
              {
                question: "What audiobooks are available?",
                answer: "We have over 300,000 audiobooks across all genres, including bestsellers, classics, and new releases from major publishers."
              },
              {
                question: "Can I switch between audiobooks and music easily?",
                answer: "Absolutely! Everything is in one app, so you can seamlessly switch between listening to audiobooks and music."
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
            <h2 className="text-3xl font-bold mb-4">Start listening to audiobooks today</h2>
            <p className="text-gray-400 mb-6">
              Get unlimited music and 15 hours of audiobooks per month for just $12.99.
            </p>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-semibold transition-colors">
              Get Audiobooks Access
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
