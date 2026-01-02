import React from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";

export default function Legal() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Legal</h1>
          <p className="text-xl text-gray-400 mb-12">
            Terms, policies, and legal information
          </p>

          {/* Main Legal Documents */}
          <div className="space-y-6 mb-12">
            <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
              <h2 className="text-2xl font-bold mb-3">Terms and Conditions of Use</h2>
              <p className="text-gray-400 mb-4">
                Please read these terms and conditions carefully before using BeatFlow Media's services.
                By using our service, you agree to be bound by these terms.
              </p>
              <p className="text-sm text-gray-500 mb-3">Last updated: January 1, 2025</p>
              <Link to="/terms" className="text-green-500 hover:underline font-semibold">
                Read Terms and Conditions →
              </Link>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
              <h2 className="text-2xl font-bold mb-3">Privacy Policy</h2>
              <p className="text-gray-400 mb-4">
                Learn about how we collect, use, and protect your personal information when you use BeatFlow Media.
              </p>
              <p className="text-sm text-gray-500 mb-3">Last updated: January 1, 2025</p>
              <Link to="/privacy-policy" className="text-green-500 hover:underline font-semibold">
                Read Privacy Policy →
              </Link>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
              <h2 className="text-2xl font-bold mb-3">User Guidelines</h2>
              <p className="text-gray-400 mb-4">
                Community standards and acceptable use policies for all BeatFlow Media users.
              </p>
              <p className="text-sm text-gray-500 mb-3">Last updated: January 1, 2025</p>
              <Link to="/user-guidelines" className="text-green-500 hover:underline font-semibold">
                Read User Guidelines →
              </Link>
            </div>
          </div>

          {/* Additional Legal Resources */}
          <h2 className="text-3xl font-bold mb-6">Additional Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Link to="/privacy-center" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
              <h3 className="text-xl font-bold mb-2">Safety & Privacy Center</h3>
              <p className="text-gray-400 text-sm">
                Control your privacy settings and learn about safety features
              </p>
            </Link>

            <Link to="/cookies" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
              <h3 className="text-xl font-bold mb-2">Cookie Policy</h3>
              <p className="text-gray-400 text-sm">
                Information about how we use cookies and similar technologies
              </p>
            </Link>

            <Link to="/about-ads" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
              <h3 className="text-xl font-bold mb-2">About Ads</h3>
              <p className="text-gray-400 text-sm">
                Learn about advertising on BeatFlow Media
              </p>
            </Link>

            <Link to="/accessibility" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
              <h3 className="text-xl font-bold mb-2">Accessibility</h3>
              <p className="text-gray-400 text-sm">
                Our commitment to making BeatFlow Media accessible to everyone
              </p>
            </Link>

            <Link to="/notice-at-collection" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
              <h3 className="text-xl font-bold mb-2">Notice at Collection</h3>
              <p className="text-gray-400 text-sm">
                California privacy notice for data collection
              </p>
            </Link>

            <Link to="/privacy-choices" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
              <h3 className="text-xl font-bold mb-2">Your Privacy Choices</h3>
              <p className="text-gray-400 text-sm">
                Manage your privacy preferences and data rights
              </p>
            </Link>
          </div>

          {/* Intellectual Property */}
          <div className="bg-gray-800 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-bold mb-4">Intellectual Property</h2>
            <div className="space-y-4 text-gray-400">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Copyright</h3>
                <p>
                  All content on BeatFlow Media, including music, artwork, and text, is protected by copyright laws.
                  Unauthorized copying or distribution is prohibited.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Trademarks</h3>
                <p>
                  BeatFlow Media and related logos are trademarks of BeatFlow Media Inc. All rights reserved.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">DMCA</h3>
                <p>
                  If you believe content on BeatFlow Media infringes your copyright, please submit a DMCA notice to{" "}
                  <a href="mailto:legal@beatflowmediagroup.com" className="text-green-500 hover:underline">
                    legal@beatflowmediagroup.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-gray-800 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-bold mb-4">Legal Contact Information</h2>
            <div className="text-gray-400 space-y-2">
              <p>
                <strong className="text-white">BeatFlow Media Inc.</strong>
              </p>
              <p>Legal Department</p>
              <p>478 Cubhouse Dr.</p>
              <p>Middletown, NJ 07748</p>
              <p>United States</p>
              <p className="pt-4">
                Email:{" "}
                <a href="mailto:legal@beatflowmediagroup.com" className="text-green-500 hover:underline">
                  legal@beatflowmediagroup.com
                </a>
              </p>
            </div>
          </div>

          {/* Updates */}
          <div className="text-center bg-blue-900/30 border border-blue-700 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-2">Stay Informed</h3>
            <p className="text-gray-300">
              We may update our legal documents from time to time. We'll notify you of any material changes
              via email or through the service.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
