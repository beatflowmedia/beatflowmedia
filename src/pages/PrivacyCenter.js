import React from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";

export default function PrivacyCenter() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Safety & Privacy Center</h1>
          <p className="text-xl text-gray-400 mb-12">
            Control your privacy, understand how we use your data, and stay safe on BeatFlow Media
          </p>

          {/* Hero */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-bold mb-3">Your privacy matters to us</h2>
            <p className="text-lg mb-4">
              We believe you should always know what data we collect and how it's used. Here you can
              manage your privacy settings and learn about our commitment to protecting your information.
            </p>
          </div>

          {/* Privacy Controls */}
          <h2 className="text-3xl font-bold mb-6">Privacy Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="text-xl font-bold mb-2">Privacy Settings</h3>
              <p className="text-gray-400 mb-4">
                Control who can see your activity, playlists, and listening history.
              </p>
              <Link to="/privacy-settings" className="text-green-500 hover:underline font-semibold">
                Manage Settings →
              </Link>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-xl font-bold mb-2">Download Your Data</h3>
              <p className="text-gray-400 mb-4">
                Request a copy of all the data we have about you.
              </p>
              <Link to="/download-data" className="text-green-500 hover:underline font-semibold">
                Request Data →
              </Link>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="text-xl font-bold mb-2">Ad Preferences</h3>
              <p className="text-gray-400 mb-4">
                Manage your advertising preferences and opt-out options.
              </p>
              <Link to="/about-ads" className="text-green-500 hover:underline font-semibold">
                Manage Ads →
              </Link>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-3xl mb-3">🍪</div>
              <h3 className="text-xl font-bold mb-2">Cookie Preferences</h3>
              <p className="text-gray-400 mb-4">
                Control which cookies and tracking technologies we use.
              </p>
              <Link to="/cookies" className="text-green-500 hover:underline font-semibold">
                Cookie Settings →
              </Link>
            </div>
          </div>

          {/* What We Collect */}
          <h2 className="text-3xl font-bold mb-6">What We Collect</h2>
          <div className="bg-gray-800 rounded-lg p-8 mb-12">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Account Information</h3>
                <p className="text-gray-400">
                  Your username, email address, password, date of birth, gender, and payment details.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Usage Data</h3>
                <p className="text-gray-400">
                  Information about how you use BeatFlow Media, including songs played, playlists created,
                  search queries, and device information.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Location Data</h3>
                <p className="text-gray-400">
                  Approximate location based on IP address to provide localized content and recommendations.
                  We only collect precise location if you explicitly grant permission.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Social Features</h3>
                <p className="text-gray-400">
                  Information you choose to share publicly, such as playlists, listening activity, and profile details.
                </p>
              </div>
            </div>
          </div>

          {/* How We Use Your Data */}
          <h2 className="text-3xl font-bold mb-6">How We Use Your Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">Personalization</h3>
              <p className="text-gray-400">
                Create personalized playlists and recommendations based on your listening habits.
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">Service Improvement</h3>
              <p className="text-gray-400">
                Analyze usage patterns to improve features and fix bugs.
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">Communication</h3>
              <p className="text-gray-400">
                Send you service updates, promotional offers, and important notifications.
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">Artist Payments</h3>
              <p className="text-gray-400">
                Calculate royalties and payments to artists based on listening data.
              </p>
            </div>
          </div>

          {/* Your Rights */}
          <h2 className="text-3xl font-bold mb-6">Your Rights</h2>
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6 mb-12">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <div>
                  <h3 className="font-semibold mb-1">Right to Access</h3>
                  <p className="text-gray-300 text-sm">Request a copy of your personal data</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <div>
                  <h3 className="font-semibold mb-1">Right to Correction</h3>
                  <p className="text-gray-300 text-sm">Update or correct inaccurate information</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <div>
                  <h3 className="font-semibold mb-1">Right to Deletion</h3>
                  <p className="text-gray-300 text-sm">Request deletion of your personal data</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <div>
                  <h3 className="font-semibold mb-1">Right to Object</h3>
                  <p className="text-gray-300 text-sm">Opt out of certain data processing activities</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <div>
                  <h3 className="font-semibold mb-1">Right to Portability</h3>
                  <p className="text-gray-300 text-sm">Export your data in a portable format</p>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Documents */}
          <h2 className="text-3xl font-bold mb-6">Legal Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            <Link to="/privacy-policy" className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors flex justify-between items-center">
              <span>Privacy Policy</span>
              <span className="text-gray-400">→</span>
            </Link>
            <Link to="/privacy-choices" className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors flex justify-between items-center">
              <span>Your Privacy Choices</span>
              <span className="text-gray-400">→</span>
            </Link>
            <Link to="/cookies" className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors flex justify-between items-center">
              <span>Cookie Policy</span>
              <span className="text-gray-400">→</span>
            </Link>
            <Link to="/notice-at-collection" className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors flex justify-between items-center">
              <span>Notice at Collection</span>
              <span className="text-gray-400">→</span>
            </Link>
          </div>

          {/* Contact */}
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Questions about privacy?</h2>
            <p className="text-gray-400 mb-6">
              Contact our privacy team if you have questions or concerns about how we handle your data.
            </p>
            <a
              href="mailto:privacy@beatflowmedia.com"
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-semibold transition-colors"
            >
              Contact Privacy Team
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
