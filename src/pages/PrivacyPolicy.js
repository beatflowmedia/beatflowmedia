import React from "react";
import Footer from "../components/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-gray-400 mb-2">Effective Date: January 1, 2025</p>
          <p className="text-gray-400 mb-12">Last Updated: January 1, 2025</p>

          <div className="prose prose-invert max-w-none">
            {/* Introduction */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">1. Introduction</h2>
              <p className="text-gray-300 mb-4">
                This Privacy Policy explains how BeatFlow Media Inc. ("BeatFlow Media," "we," "us," or "our")
                collects, uses, discloses, and protects your personal information when you use our music streaming
                service, websites, and applications (collectively, the "Service").
              </p>
              <p className="text-gray-300">
                By using the Service, you consent to the data practices described in this policy. If you do not
                agree with our policies and practices, do not use the Service.
              </p>
            </div>

            {/* Information We Collect */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">2. Information We Collect</h2>

              <h3 className="text-2xl font-semibold mb-3 mt-6">2.1 Information You Provide</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Account registration data (name, email, password, date of birth)</li>
                <li>Payment information (credit card details, billing address)</li>
                <li>Profile information (username, profile picture, preferences)</li>
                <li>User-generated content (playlists, comments, reviews)</li>
                <li>Communications with customer support</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6">2.2 Information We Collect Automatically</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Usage data (songs played, listening duration, skip rates)</li>
                <li>Device information (device type, operating system, unique identifiers)</li>
                <li>Log data (IP address, browser type, pages visited)</li>
                <li>Location data (approximate location based on IP address)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3 mt-6">2.3 Information from Third Parties</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Social media platforms (if you connect your accounts)</li>
                <li>Payment processors</li>
                <li>Marketing partners and analytics providers</li>
              </ul>
            </div>

            {/* How We Use Your Information */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-300 mb-4">We use your information to:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Provide, maintain, and improve the Service</li>
                <li>Process payments and manage subscriptions</li>
                <li>Personalize content and recommendations</li>
                <li>Send service updates and promotional communications</li>
                <li>Analyze usage patterns and trends</li>
                <li>Detect and prevent fraud and abuse</li>
                <li>Comply with legal obligations</li>
                <li>Calculate royalty payments to artists and rights holders</li>
              </ul>
            </div>

            {/* Sharing Your Information */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">4. How We Share Your Information</h2>
              <p className="text-gray-300 mb-4">We may share your information with:</p>

              <h3 className="text-2xl font-semibold mb-3 mt-6">Service Providers</h3>
              <p className="text-gray-300 mb-4">
                Third-party companies that help us operate the Service (payment processors, cloud hosting,
                analytics providers, customer support).
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6">Rights Holders</h3>
              <p className="text-gray-300 mb-4">
                Aggregated listening data with artists, labels, and publishers for royalty calculations.
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6">Legal Requirements</h3>
              <p className="text-gray-300 mb-4">
                When required by law or to protect our rights and the safety of our users.
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6">Business Transfers</h3>
              <p className="text-gray-300 mb-4">
                In connection with a merger, acquisition, or sale of assets.
              </p>

              <h3 className="text-2xl font-semibold mb-3 mt-6">With Your Consent</h3>
              <p className="text-gray-300">
                When you explicitly consent to sharing your information.
              </p>
            </div>

            {/* Your Rights */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">5. Your Privacy Rights</h2>
              <p className="text-gray-300 mb-4">Depending on your location, you may have the following rights:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Objection:</strong> Object to certain processing activities</li>
                <li><strong>Restriction:</strong> Request restriction of processing</li>
                <li><strong>Withdraw Consent:</strong> Withdraw previously given consent</li>
              </ul>
            </div>

            {/* Data Security */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">6. Data Security</h2>
              <p className="text-gray-300 mb-4">
                We implement appropriate technical and organizational measures to protect your personal information
                against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and audits</li>
                <li>Access controls and authentication</li>
                <li>Employee training on data protection</li>
              </ul>
            </div>

            {/* Data Retention */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">7. Data Retention</h2>
              <p className="text-gray-300">
                We retain your personal information for as long as necessary to provide the Service, comply with
                legal obligations, resolve disputes, and enforce our agreements. When you delete your account,
                we will delete or anonymize your personal information, except where we are required to retain
                it by law.
              </p>
            </div>

            {/* International Transfers */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">8. International Data Transfers</h2>
              <p className="text-gray-300">
                Your information may be transferred to and processed in countries other than your country of
                residence. We ensure appropriate safeguards are in place to protect your information in
                accordance with this Privacy Policy.
              </p>
            </div>

            {/* Children's Privacy */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">9. Children's Privacy</h2>
              <p className="text-gray-300">
                The Service is not directed to children under 13. We do not knowingly collect personal information
                from children under 13. If you believe we have collected information from a child under 13,
                please contact us immediately.
              </p>
            </div>

            {/* Changes to Policy */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">10. Changes to This Privacy Policy</h2>
              <p className="text-gray-300">
                We may update this Privacy Policy from time to time. We will notify you of any material changes
                by posting the new Privacy Policy on this page and updating the "Last Updated" date. Your
                continued use of the Service after changes become effective constitutes acceptance of the
                updated policy.
              </p>
            </div>

            {/* Contact */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4">11. Contact Us</h2>
              <p className="text-gray-300 mb-4">
                If you have questions about this Privacy Policy or wish to exercise your privacy rights,
                please contact us:
              </p>
              <div className="bg-gray-800 rounded-lg p-6 text-gray-300">
                <p><strong className="text-white">BeatFlow Media Inc.</strong></p>
                <p>Privacy Department</p>
                <p>478 Cubhouse Dr.</p>
                <p>Middletown, NJ 07748</p>
                <p>United States</p>
                <p className="mt-4">
                  Email: <a href="mailto:privacy@beatflowmediagroup.com" className="text-green-500 hover:underline">
                    privacy@beatflowmediagroup.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
