import React from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";

export default function Terms() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Terms and Conditions of Use</h1>
          <p className="text-sm text-gray-400 mb-8">Last updated: January 1, 2025</p>

          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">1. Introduction</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                Welcome to BeatFlow Media. These Terms and Conditions ("Terms") govern your use of our website,
                applications, and services (collectively, the "Service"). By accessing or using BeatFlow Media,
                you agree to be bound by these Terms.
              </p>
              <p>
                If you do not agree to these Terms, please do not use the Service. We reserve the right to update
                these Terms at any time, and your continued use of the Service constitutes acceptance of any changes.
              </p>
            </div>
          </section>

          {/* Account Registration */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">2. Account Registration</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                To access certain features of BeatFlow Media, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain the security of your account credentials</li>
                <li>Promptly update your information to keep it accurate</li>
                <li>Be responsible for all activities under your account</li>
                <li>Not share your account with others or allow unauthorized access</li>
              </ul>
              <p>
                You must be at least 13 years old to use BeatFlow Media. If you are under 18, you must have
                parental or guardian consent.
              </p>
            </div>
          </section>

          {/* User Roles and Responsibilities */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">3. User Roles and Responsibilities</h2>
            <div className="text-gray-300 space-y-4">
              <h3 className="text-xl font-semibold text-white">Listeners</h3>
              <p>
                As a listener, you may stream music, create playlists, and purchase licenses for music content.
                You agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Download, copy, or redistribute content without proper licensing</li>
                <li>Use automated tools to access the Service (bots, scrapers, etc.)</li>
                <li>Circumvent any technical measures protecting the content</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6">Artists</h3>
              <p>
                As an artist, you may upload music, manage your content, and earn revenue. You represent and warrant that:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You own or have necessary rights to all content you upload</li>
                <li>Your content does not infringe any third-party rights</li>
                <li>Your content complies with all applicable laws and our Community Guidelines</li>
                <li>You will not upload inappropriate, offensive, or illegal content</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6">Curators</h3>
              <p>
                As a curator, you may create and manage playlists, review submissions, and promote music.
                You agree to exercise editorial judgment fairly and in accordance with our Community Guidelines.
              </p>
            </div>
          </section>

          {/* Content and Licenses */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">4. Content and Licenses</h2>
            <div className="text-gray-300 space-y-4">
              <h3 className="text-xl font-semibold text-white">Content Ownership</h3>
              <p>
                All music, artwork, text, and other content on BeatFlow Media is protected by copyright and
                intellectual property laws. Artists retain ownership of their uploaded content, but grant
                BeatFlow Media a non-exclusive license to distribute and promote such content.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">Licensing for Use</h3>
              <p>
                When you purchase a license through BeatFlow Media, you receive specific rights as outlined
                in your purchase. Common license types include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Personal Use:</strong> For individual, non-commercial enjoyment</li>
                <li><strong>Commercial Use:</strong> For use in commercial projects, advertising, etc.</li>
                <li><strong>Sync License:</strong> For synchronization with video or other media</li>
              </ul>
              <p>
                Licenses are non-transferable and subject to the specific terms provided at the time of purchase.
              </p>
            </div>
          </section>

          {/* Payments and Revenue */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">5. Payments and Revenue</h2>
            <div className="text-gray-300 space-y-4">
              <h3 className="text-xl font-semibold text-white">Purchases</h3>
              <p>
                All purchases are processed through our payment partner, Stripe. Prices are displayed in USD
                and include applicable taxes. All sales are final unless otherwise specified.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">Artist Revenue</h3>
              <p>
                Artists earn 70% of net sales revenue, with BeatFlow Media retaining 30% as a platform fee
                to cover payment processing, hosting, bandwidth, and platform maintenance. Payouts are processed
                monthly via Stripe Connect, subject to a minimum threshold of $50.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">Premium Subscriptions</h3>
              <p>
                Premium subscriptions provide ad-free listening and other benefits. Subscriptions automatically
                renew until cancelled. You may cancel at any time through your account settings, and your
                subscription will remain active until the end of your billing period.
              </p>
            </div>
          </section>

          {/* Prohibited Conduct */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">6. Prohibited Conduct</h2>
            <div className="text-gray-300 space-y-4">
              <p>You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violate any laws or regulations</li>
                <li>Infringe intellectual property rights</li>
                <li>Upload malicious code, viruses, or harmful software</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Engage in fraudulent or deceptive practices</li>
                <li>Manipulate streaming counts or engagement metrics</li>
                <li>Create fake accounts or impersonate others</li>
                <li>Scrape, data mine, or automatically collect information from the Service</li>
                <li>Interfere with or disrupt the Service or servers</li>
              </ul>
            </div>
          </section>

          {/* Content Moderation */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">7. Content Moderation</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                BeatFlow Media reserves the right to remove any content that violates these Terms or our
                Community Guidelines. We may also suspend or terminate accounts for violations. Content
                moderation decisions are at our sole discretion.
              </p>
              <p>
                We respond to DMCA takedown notices and other intellectual property claims. If you believe
                content infringes your rights, please contact us at{" "}
                <a href="mailto:legal@beatflowmedia.com" className="text-green-500 hover:underline">
                  legal@beatflowmedia.com
                </a>
              </p>
            </div>
          </section>

          {/* Privacy */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">8. Privacy</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                Your use of BeatFlow Media is also governed by our{" "}
                <Link to="/privacy-policy" className="text-green-500 hover:underline">
                  Privacy Policy
                </Link>
                , which describes how we collect, use, and protect your personal information.
              </p>
            </div>
          </section>

          {/* Disclaimers */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">9. Disclaimers</h2>
            <div className="text-gray-300 space-y-4">
              <p className="uppercase font-semibold">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
                BEATFLOW MEDIA DISCLAIMS ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                AND NON-INFRINGEMENT.
              </p>
              <p>
                We do not guarantee that the Service will be uninterrupted, error-free, or secure. We do not
                warrant the accuracy or reliability of any content on the Service.
              </p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">10. Limitation of Liability</h2>
            <div className="text-gray-300 space-y-4">
              <p className="uppercase font-semibold">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, BEATFLOW MEDIA SHALL NOT BE LIABLE FOR ANY INDIRECT,
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES,
                WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE
                LOSSES.
              </p>
              <p>
                Our total liability to you for any claims arising from your use of the Service shall not exceed
                the amount you paid to us in the 12 months preceding the claim, or $100, whichever is greater.
              </p>
            </div>
          </section>

          {/* Indemnification */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">11. Indemnification</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                You agree to indemnify and hold harmless BeatFlow Media, its officers, directors, employees,
                and agents from any claims, damages, losses, liabilities, and expenses (including attorneys' fees)
                arising from:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Content you upload or share on the Service</li>
              </ul>
            </div>
          </section>

          {/* Termination */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">12. Termination</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                We may suspend or terminate your access to the Service at any time, with or without cause,
                with or without notice. You may also terminate your account at any time by contacting us or
                through your account settings.
              </p>
              <p>
                Upon termination, your right to use the Service immediately ceases. Sections of these Terms
                that by their nature should survive termination will survive, including ownership provisions,
                warranty disclaimers, and limitations of liability.
              </p>
            </div>
          </section>

          {/* Governing Law */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">13. Governing Law and Dispute Resolution</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                These Terms are governed by the laws of the State of New Jersey, United States, without regard
                to conflict of law principles.
              </p>
              <p>
                Any disputes arising from these Terms or your use of the Service shall be resolved through
                binding arbitration in accordance with the American Arbitration Association's rules, except
                that either party may seek injunctive relief in court for infringement of intellectual property
                rights.
              </p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">14. Changes to These Terms</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                We may modify these Terms at any time. If we make material changes, we will notify you by
                email or through a notice on the Service. Your continued use of the Service after such notice
                constitutes acceptance of the modified Terms.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">15. Contact Information</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                If you have questions about these Terms, please contact us at:
              </p>
              <div className="bg-gray-800 rounded-lg p-6">
                <p><strong className="text-white">BeatFlow Media Inc.</strong></p>
                <p>Legal Department</p>
                <p>478 Cubhouse Dr.</p>
                <p>Middletown, NJ 07748</p>
                <p>United States</p>
                <p className="pt-4">
                  Email:{" "}
                  <a href="mailto:legal@beatflowmedia.com" className="text-green-500 hover:underline">
                    legal@beatflowmedia.com
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* Agreement */}
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-2">Agreement</h3>
            <p className="text-gray-300">
              By using BeatFlow Media, you acknowledge that you have read, understood, and agree to be bound
              by these Terms and Conditions.
            </p>
          </div>

          {/* Back to Legal */}
          <div className="text-center mb-12">
            <Link
              to="/legal"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-full transition-colors"
            >
              ← Back to Legal
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
