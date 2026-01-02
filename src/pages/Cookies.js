import React from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";

export default function Cookies() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-gray-400 mb-2">Effective Date: January 1, 2025</p>
          <p className="text-gray-400 mb-12">Last Updated: January 1, 2025</p>

          {/* Introduction */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-4">What are cookies?</h2>
            <p className="text-gray-300 mb-4">
              Cookies are small text files that are placed on your device when you visit a website or use an
              application. They help websites recognize your device and remember information about your visit,
              such as your preferred settings and actions you take.
            </p>
            <p className="text-gray-300">
              BeatFlow Media uses cookies and similar technologies to provide, protect, and improve our Service.
              This Cookie Policy explains what these technologies are, why we use them, and your choices regarding
              their use.
            </p>
          </div>

          {/* Types of Cookies */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-4">Types of cookies we use</h2>

            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">Essential Cookies</h3>
                <p className="text-gray-400 mb-3">
                  These cookies are necessary for the Service to function properly. They enable core functionality
                  such as security, authentication, and account management.
                </p>
                <p className="text-sm text-gray-500">Required: Yes | Can be disabled: No</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">Performance Cookies</h3>
                <p className="text-gray-400 mb-3">
                  These cookies help us understand how users interact with our Service by collecting and analyzing
                  information about usage patterns, errors, and performance.
                </p>
                <p className="text-sm text-gray-500">Required: No | Can be disabled: Yes</p>
                <p className="text-gray-400 text-sm mt-2">
                  Examples: Google Analytics, error tracking, loading time measurement
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">Functional Cookies</h3>
                <p className="text-gray-400 mb-3">
                  These cookies enable enhanced functionality and personalization, such as remembering your
                  preferences, language settings, and playback settings.
                </p>
                <p className="text-sm text-gray-500">Required: No | Can be disabled: Yes</p>
                <p className="text-gray-400 text-sm mt-2">
                  Examples: Volume settings, playback quality preferences, theme preferences
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">Targeting/Advertising Cookies</h3>
                <p className="text-gray-400 mb-3">
                  These cookies are used to deliver relevant advertisements and measure the effectiveness of
                  advertising campaigns. They track your browsing habits across websites.
                </p>
                <p className="text-sm text-gray-500">Required: No | Can be disabled: Yes</p>
                <p className="text-gray-400 text-sm mt-2">
                  Examples: Ad personalization, conversion tracking, remarketing
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">Social Media Cookies</h3>
                <p className="text-gray-400 mb-3">
                  These cookies enable social media features such as sharing content and connecting your
                  BeatFlow Media account with social media platforms.
                </p>
                <p className="text-sm text-gray-500">Required: No | Can be disabled: Yes</p>
                <p className="text-gray-400 text-sm mt-2">
                  Examples: Facebook sharing, Twitter integration, Instagram connect
                </p>
              </div>
            </div>
          </div>

          {/* Other Technologies */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-4">Other tracking technologies</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Local Storage</h3>
                <p className="text-gray-300">
                  We use browser local storage to store data locally on your device, such as playback history
                  and cached content for offline listening.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Web Beacons</h3>
                <p className="text-gray-300">
                  Small graphic images (also known as pixel tags) that work with cookies to track user behavior
                  and measure the effectiveness of our communications.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Device Identifiers</h3>
                <p className="text-gray-300">
                  Unique identifiers assigned to your device that help us recognize your device across sessions
                  and provide a consistent experience.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">SDKs</h3>
                <p className="text-gray-300">
                  Software development kits in our mobile apps that collect information about app usage,
                  crashes, and performance.
                </p>
              </div>
            </div>
          </div>

          {/* Why We Use Cookies */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-4">Why we use cookies</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Authenticate users and prevent fraudulent activity</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze how you use our Service to improve performance</li>
              <li>Personalize content and recommendations</li>
              <li>Deliver relevant advertisements</li>
              <li>Measure the effectiveness of marketing campaigns</li>
              <li>Provide social media features</li>
              <li>Ensure security and protect against abuse</li>
            </ul>
          </div>

          {/* Your Choices */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-4">Your cookie choices</h2>

            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold mb-3">Manage Cookie Preferences</h3>
              <p className="text-gray-300 mb-4">
                You can control and manage cookies through your browser settings or our cookie preference center.
              </p>
              <Link to="/cookie-settings" className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-semibold transition-colors">
                Cookie Settings
              </Link>
            </div>

            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold mb-2">Browser Controls</h3>
                <p>
                  Most browsers allow you to block or delete cookies through their settings. However, blocking
                  all cookies may prevent you from accessing certain features of our Service.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Opt-Out Options</h3>
                <p className="mb-2">You can opt out of targeted advertising through:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Your Ad Choices: <a href="https://optout.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">optout.aboutads.info</a></li>
                  <li>Network Advertising Initiative: <a href="https://optout.networkadvertising.org" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">optout.networkadvertising.org</a></li>
                  <li>Digital Advertising Alliance: <a href="https://youradchoices.com/control" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">youradchoices.com</a></li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Mobile Devices</h3>
                <p>
                  On mobile devices, you can control advertising identifiers through your device settings:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                  <li>iOS: Settings → Privacy → Advertising → Limit Ad Tracking</li>
                  <li>Android: Settings → Google → Ads → Opt out of Ads Personalization</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Third-Party Cookies */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-4">Third-party cookies</h2>
            <p className="text-gray-300 mb-4">
              We work with third-party partners who may place cookies on your device when you use our Service.
              These partners include:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Analytics providers (e.g., Google Analytics)</li>
              <li>Advertising networks</li>
              <li>Social media platforms</li>
              <li>Payment processors</li>
              <li>Customer support tools</li>
            </ul>
          </div>

          {/* Updates */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-4">Updates to this Cookie Policy</h2>
            <p className="text-gray-300">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for
              legal, operational, or regulatory reasons. We will notify you of any material changes by
              posting the updated policy on this page.
            </p>
          </div>

          {/* Contact */}
          <div className="bg-gray-800 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Questions about cookies?</h2>
            <p className="text-gray-300 mb-4">
              If you have questions about our use of cookies or other tracking technologies, please contact us:
            </p>
            <p className="text-gray-400">
              Email: <a href="mailto:privacy@beatflowmedia.com" className="text-green-500 hover:underline">
                privacy@beatflowmedia.com
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
