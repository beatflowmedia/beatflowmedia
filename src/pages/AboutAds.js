import React from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";

export default function AboutAds() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">About Ads</h1>
          <p className="text-xl text-gray-400 mb-12">
            Learn about advertising on BeatFlow Media and how to control your ad experience
          </p>

          {/* Introduction */}
          <div className="mb-12">
            <p className="text-gray-300 mb-4">
              Advertising helps us offer a free version of BeatFlow Media while compensating artists and rights
              holders. This page explains how ads work on our platform, what information we use, and how you
              can control your ad experience.
            </p>
          </div>

          {/* Ad-Supported vs Premium */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Two ways to listen</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">Free with Ads</h3>
                <ul className="text-gray-400 space-y-2">
                  <li>✓ Access to millions of songs</li>
                  <li>✓ Create and share playlists</li>
                  <li>✓ Discover new music</li>
                  <li>✗ Contains audio and display ads</li>
                  <li>✗ Limited skips</li>
                  <li>✗ No offline listening</li>
                </ul>
                <p className="text-green-500 font-semibold mt-4">Free forever</p>
              </div>

              <div className="bg-gradient-to-br from-green-600 to-blue-600 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">Premium (Ad-Free)</h3>
                <ul className="text-white space-y-2">
                  <li>✓ Everything in Free</li>
                  <li>✓ No ads</li>
                  <li>✓ Unlimited skips</li>
                  <li>✓ Offline listening</li>
                  <li>✓ High-quality audio</li>
                  <li>✓ Play any song</li>
                </ul>
                <p className="text-white font-semibold mt-4">Starting at $5.99/month</p>
              </div>
            </div>
          </div>

          {/* Types of Ads */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Types of ads on BeatFlow Media</h2>
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">Audio Ads</h3>
                <p className="text-gray-400">
                  Brief audio advertisements that play between songs. These ads help support the free version
                  of BeatFlow Media and ensure artists get paid.
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">Display Ads</h3>
                <p className="text-gray-400">
                  Visual advertisements that appear within the BeatFlow Media interface, such as on the home
                  screen or between sections.
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">Sponsored Content</h3>
                <p className="text-gray-400">
                  Promoted playlists, albums, or artists that appear in your recommendations. These are clearly
                  labeled as "Sponsored" or "Promoted."
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">Video Ads</h3>
                <p className="text-gray-400">
                  Video advertisements that may appear on our video content or as interstitials in the mobile app.
                </p>
              </div>
            </div>
          </div>

          {/* How Ads Are Personalized */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">How we personalize ads</h2>
            <p className="text-gray-300 mb-4">
              We use information about you to show more relevant ads. This includes:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
              <li>Your listening history and music preferences</li>
              <li>Your age, gender, and location (approximate)</li>
              <li>Your device type and operating system</li>
              <li>Information from cookies and similar technologies</li>
              <li>Data from our advertising partners</li>
            </ul>
            <p className="text-gray-300">
              Personalized ads help ensure you see advertisements that are more relevant to your interests,
              while also helping advertisers reach their target audience more effectively.
            </p>
          </div>

          {/* Ad Controls */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Your ad choices</h2>

            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold mb-3">Manage Ad Preferences</h3>
              <p className="text-gray-300 mb-4">
                Control how we use your information for advertising purposes.
              </p>
              <Link to="/ad-preferences" className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-semibold transition-colors">
                Ad Preferences
              </Link>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">Opt Out of Personalized Ads</h3>
                <p className="text-gray-400 mb-4">
                  You can opt out of personalized advertising. You'll still see ads, but they won't be
                  tailored to your interests.
                </p>
                <ul className="text-gray-400 text-sm space-y-2">
                  <li>• Go to Settings → Privacy → Advertising Preferences</li>
                  <li>• Toggle off "Personalized Ads"</li>
                  <li>• You can change this setting at any time</li>
                </ul>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">Industry Opt-Out Tools</h3>
                <p className="text-gray-400 mb-4">
                  You can also opt out of targeted advertising through industry opt-out tools:
                </p>
                <ul className="text-gray-400 space-y-2">
                  <li>
                    • Digital Advertising Alliance:{" "}
                    <a href="https://youradchoices.com/control" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">youradchoices.com</a>
                  </li>
                  <li>
                    • Network Advertising Initiative:{" "}
                    <a href="https://optout.networkadvertising.org" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">optout.networkadvertising.org</a>
                  </li>
                  <li>
                    • European Interactive Digital Advertising Alliance:{" "}
                    <a href="https://youronlinechoices.eu" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">youronlinechoices.eu</a>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">Mobile Device Settings</h3>
                <p className="text-gray-400 mb-4">
                  Control ad tracking on your mobile device:
                </p>
                <div className="space-y-3 text-gray-400">
                  <div>
                    <p className="font-semibold">iOS:</p>
                    <p className="text-sm">Settings → Privacy → Advertising → Limit Ad Tracking</p>
                  </div>
                  <div>
                    <p className="font-semibold">Android:</p>
                    <p className="text-sm">Settings → Google → Ads → Opt out of Ads Personalization</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">Go Ad-Free with Premium</h3>
                <p className="mb-4">
                  The best way to avoid ads is to upgrade to BeatFlow Media Premium. Enjoy unlimited,
                  ad-free music for a low monthly price.
                </p>
                <Link to="/explore-premium" className="inline-block bg-white text-gray-900 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors">
                  Get BeatFlow Premium
                </Link>
              </div>
            </div>
          </div>

          {/* Advertiser Information */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">For advertisers</h2>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                Interested in advertising on BeatFlow Media? Reach millions of engaged listeners with
                audio, video, and display ads.
              </p>
              <div className="flex gap-4">
                <a
                  href="/advertising"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-semibold transition-colors inline-block"
                >
                  Learn About Advertising
                </a>
                <a
                  href="/contact"
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-full font-semibold transition-colors inline-block"
                >
                  Contact Sales
                </a>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Privacy and ads</h2>
            <p className="text-gray-300 mb-4">
              Your privacy is important to us. Learn more about how we collect, use, and protect your
              information in relation to advertising:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a href="/privacy-policy" className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors flex justify-between items-center">
                <span>Privacy Policy</span>
                <span className="text-gray-400">→</span>
              </a>
              <a href="/cookies" className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors flex justify-between items-center">
                <span>Cookie Policy</span>
                <span className="text-gray-400">→</span>
              </a>
              <a href="/privacy-center" className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors flex justify-between items-center">
                <span>Privacy Center</span>
                <span className="text-gray-400">→</span>
              </a>
              <a href="/privacy-choices" className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors flex justify-between items-center">
                <span>Your Privacy Choices</span>
                <span className="text-gray-400">→</span>
              </a>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Questions about ads?</h2>
            <p className="text-gray-400 mb-6">
              If you have questions about advertising on BeatFlow Media, please contact us.
            </p>
            <a
              href="mailto:advertising@beatflowmediagroup.com"
              className="text-green-500 hover:underline font-semibold"
            >
              advertising@beatflowmediagroup.com
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
