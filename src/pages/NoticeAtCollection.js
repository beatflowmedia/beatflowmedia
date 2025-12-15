import React from "react";
import Footer from "../components/Footer";

export default function NoticeAtCollection() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Notice at Collection</h1>
          <p className="text-gray-400 mb-2">Effective Date: January 1, 2025</p>
          <p className="text-xl text-gray-400 mb-12">
            California Consumer Privacy Act (CCPA) Notice
          </p>

          {/* Introduction */}
          <div className="mb-12">
            <p className="text-gray-300 mb-4">
              This Notice at Collection provides information required by the California Consumer Privacy Act
              (CCPA) about the personal information we collect from California residents. This notice
              supplements our Privacy Policy and applies only to California residents.
            </p>
          </div>

          {/* Categories Collected */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Categories of Personal Information We Collect</h2>
            <p className="text-gray-300 mb-6">
              We collect the following categories of personal information from California consumers:
            </p>

            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">A. Identifiers</h3>
                <p className="text-gray-400 mb-2">Examples:</p>
                <ul className="text-gray-400 list-disc list-inside space-y-1">
                  <li>Name, email address, username, unique user ID</li>
                  <li>IP address, device identifiers</li>
                  <li>Account number, customer number</li>
                </ul>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">B. Customer Records</h3>
                <p className="text-gray-400 mb-2">Examples:</p>
                <ul className="text-gray-400 list-disc list-inside space-y-1">
                  <li>Payment information (credit card number, billing address)</li>
                  <li>Purchase history and account details</li>
                </ul>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">C. Protected Classification Characteristics</h3>
                <p className="text-gray-400 mb-2">Examples:</p>
                <ul className="text-gray-400 list-disc list-inside space-y-1">
                  <li>Age, date of birth</li>
                  <li>Gender</li>
                </ul>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">D. Commercial Information</h3>
                <p className="text-gray-400 mb-2">Examples:</p>
                <ul className="text-gray-400 list-disc list-inside space-y-1">
                  <li>Subscription type and payment history</li>
                  <li>Purchase records and transaction history</li>
                </ul>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">E. Internet or Network Activity</h3>
                <p className="text-gray-400 mb-2">Examples:</p>
                <ul className="text-gray-400 list-disc list-inside space-y-1">
                  <li>Browsing history, search history</li>
                  <li>Listening history (songs played, playlists created)</li>
                  <li>Interaction with our website and applications</li>
                </ul>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">F. Geolocation Data</h3>
                <p className="text-gray-400 mb-2">Examples:</p>
                <ul className="text-gray-400 list-disc list-inside space-y-1">
                  <li>Approximate location based on IP address</li>
                  <li>Precise location (only with your permission)</li>
                </ul>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">G. Inferences</h3>
                <p className="text-gray-400 mb-2">Examples:</p>
                <ul className="text-gray-400 list-disc list-inside space-y-1">
                  <li>Music preferences and tastes</li>
                  <li>Predicted interests and behaviors</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sources */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Sources of Personal Information</h2>
            <p className="text-gray-300 mb-4">We collect personal information from the following sources:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Directly from you when you create an account or use our services</li>
              <li>Automatically through your use of our services</li>
              <li>From third parties (e.g., payment processors, social media platforms)</li>
              <li>From our business partners and affiliates</li>
            </ul>
          </div>

          {/* Business Purposes */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Business or Commercial Purposes for Collection</h2>
            <p className="text-gray-300 mb-4">We use personal information for the following purposes:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Providing and maintaining our music streaming service</li>
              <li>Processing payments and managing subscriptions</li>
              <li>Personalizing content and recommendations</li>
              <li>Communicating with you about our services</li>
              <li>Marketing and advertising</li>
              <li>Analyzing and improving our services</li>
              <li>Detecting security incidents and protecting against fraud</li>
              <li>Debugging and error correction</li>
              <li>Complying with legal obligations</li>
            </ul>
          </div>

          {/* Categories Disclosed */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Categories of Personal Information Disclosed</h2>
            <p className="text-gray-300 mb-4">
              We may disclose the following categories of personal information for business purposes:
            </p>
            <div className="bg-gray-800 rounded-lg p-6">
              <ul className="text-gray-300 space-y-2">
                <li>• Identifiers</li>
                <li>• Customer records</li>
                <li>• Commercial information</li>
                <li>• Internet or network activity</li>
                <li>• Geolocation data</li>
                <li>• Inferences</li>
              </ul>
              <p className="text-gray-400 text-sm mt-4">
                We disclose this information to service providers, business partners, and third parties
                as described in our Privacy Policy.
              </p>
            </div>
          </div>

          {/* Sale/Sharing */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Sale or Sharing of Personal Information</h2>
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                We do not "sell" personal information as defined by the CCPA. However, we may "share"
                personal information for cross-context behavioral advertising purposes.
              </p>
              <p className="text-gray-300 mb-4">
                The categories of personal information we may share include:
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• Identifiers (e.g., cookie IDs, device IDs)</li>
                <li>• Internet or network activity</li>
                <li>• Geolocation data</li>
                <li>• Inferences about preferences</li>
              </ul>
              <p className="text-gray-300 mt-4">
                You have the right to opt out of this sharing. Visit our{" "}
                <a href="/privacy-choices" className="text-green-500 hover:underline">Privacy Choices</a>{" "}
                page to exercise this right.
              </p>
            </div>
          </div>

          {/* Retention */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Retention of Personal Information</h2>
            <p className="text-gray-300">
              We retain personal information for as long as necessary to provide our services, comply with
              legal obligations, resolve disputes, and enforce our agreements. The specific retention period
              varies depending on the type of information and the purpose for which it was collected.
            </p>
          </div>

          {/* Your Rights */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Your California Privacy Rights</h2>
            <p className="text-gray-300 mb-6">
              As a California resident, you have the following rights under the CCPA:
            </p>

            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-2">Right to Know</h3>
                <p className="text-gray-400">
                  Request disclosure of the categories and specific pieces of personal information we collect,
                  use, and disclose about you.
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-2">Right to Delete</h3>
                <p className="text-gray-400">
                  Request deletion of your personal information, subject to certain exceptions.
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-2">Right to Correct</h3>
                <p className="text-gray-400">
                  Request correction of inaccurate personal information.
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-2">Right to Opt-Out</h3>
                <p className="text-gray-400">
                  Opt out of the "sale" or "sharing" of your personal information.
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-2">Right to Limit Use of Sensitive Information</h3>
                <p className="text-gray-400">
                  Request that we limit our use of sensitive personal information.
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-2">Right to Non-Discrimination</h3>
                <p className="text-gray-400">
                  Exercise your privacy rights without receiving discriminatory treatment.
                </p>
              </div>
            </div>
          </div>

          {/* Exercise Rights */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">How to Exercise Your Rights</h2>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                To exercise your California privacy rights, you may:
              </p>
              <ul className="text-gray-300 space-y-3 mb-6">
                <li>• Visit our <a href="/privacy-choices" className="text-green-500 hover:underline">Privacy Choices</a> page</li>
                <li>• Email us at <a href="mailto:privacy@beatflowmedia.com" className="text-green-500 hover:underline">privacy@beatflowmedia.com</a></li>
                <li>• Call us at 1-800-BEATFLOW</li>
              </ul>
              <p className="text-gray-400 text-sm">
                We will verify your identity before processing your request. You may also designate an
                authorized agent to make requests on your behalf.
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-gray-800 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
            <p className="text-gray-300 mb-4">
              If you have questions about this Notice at Collection or our privacy practices:
            </p>
            <div className="text-gray-400">
              <p><strong className="text-white">BeatFlow Media Inc.</strong></p>
              <p>Privacy Department</p>
              <p>478 Cubhouse Dr.</p>
              <p>Middletown, NJ 07748</p>
              <p>United States</p>
              <p className="mt-4">
                Email: <a href="mailto:privacy@beatflowmedia.com" className="text-green-500 hover:underline">
                  privacy@beatflowmedia.com
                </a>
              </p>
              <p>Phone: 1-800-BEATFLOW</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
