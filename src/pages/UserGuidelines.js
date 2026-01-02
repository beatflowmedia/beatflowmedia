import React from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";

export default function UserGuidelines() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">User Guidelines</h1>
          <p className="text-sm text-gray-400 mb-8">Last updated: January 1, 2025</p>

          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">Community Standards</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                BeatFlow Media is a community-driven platform that connects artists, listeners, and curators.
                These User Guidelines outline the standards of behavior we expect from all members of our community.
                By using BeatFlow Media, you agree to follow these guidelines and help us maintain a safe,
                respectful, and creative environment.
              </p>
              <p>
                Violations of these guidelines may result in content removal, account suspension, or permanent
                termination at our sole discretion.
              </p>
            </div>
          </section>

          {/* Be Respectful */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">1. Be Respectful</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                BeatFlow Media is built on mutual respect. We expect all users to treat each other with kindness
                and consideration.
              </p>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-3">DO:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Treat all users with respect and courtesy</li>
                  <li>Provide constructive feedback to artists</li>
                  <li>Support fellow artists and creators</li>
                  <li>Engage in meaningful discussions about music</li>
                  <li>Report violations you encounter</li>
                </ul>
              </div>

              <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-3">DON'T:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Harass, bully, or threaten other users</li>
                  <li>Use hate speech or discriminatory language</li>
                  <li>Attack users based on race, religion, gender, sexual orientation, or disability</li>
                  <li>Engage in personal attacks or doxxing</li>
                  <li>Spam comments or messages</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Content Standards */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">2. Content Standards</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                All content uploaded to BeatFlow Media must meet our quality and safety standards.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">Prohibited Content</h3>
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
                <p className="mb-3">The following types of content are strictly prohibited:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Illegal Content:</strong> Content promoting or facilitating illegal activities</li>
                  <li><strong>Violent Content:</strong> Graphic violence, gore, or content promoting harm</li>
                  <li><strong>Sexual Content:</strong> Pornography or sexually explicit material</li>
                  <li><strong>Child Safety:</strong> Any content exploiting or endangering minors</li>
                  <li><strong>Hate Speech:</strong> Content promoting hatred or violence against groups</li>
                  <li><strong>Self-Harm:</strong> Content promoting suicide, self-harm, or eating disorders</li>
                  <li><strong>Misinformation:</strong> Deliberately false information causing harm</li>
                  <li><strong>Spam:</strong> Repetitive, misleading, or manipulative content</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-white mt-6">Mature Content</h3>
              <div className="bg-gray-800 rounded-lg p-6">
                <p className="mb-3">Content with mature themes must be clearly labeled:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Mark tracks with explicit language or themes as "Explicit"</li>
                  <li>Provide content warnings for sensitive topics</li>
                  <li>Ensure album artwork is appropriate for general audiences</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">3. Respect Intellectual Property</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                Copyright and intellectual property rights are fundamental to BeatFlow Media's ecosystem.
              </p>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-3">For Artists:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Only upload music you own or have permission to distribute</li>
                  <li>Ensure all samples and interpolations are properly cleared</li>
                  <li>Credit collaborators, producers, and featured artists accurately</li>
                  <li>Don't upload covers or remixes without proper licensing</li>
                  <li>Use original or licensed artwork for albums and singles</li>
                </ul>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 mt-4">
                <h3 className="text-xl font-semibold text-white mb-3">For Listeners:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Purchase licenses before using music commercially</li>
                  <li>Don't download, copy, or redistribute music without authorization</li>
                  <li>Don't circumvent DRM or technical protection measures</li>
                  <li>Credit artists when sharing their work</li>
                </ul>
              </div>

              <p className="mt-4">
                If you believe content on BeatFlow Media infringes your copyright, please submit a DMCA notice to{" "}
                <a href="mailto:legal@beatflowmediagroup.com" className="text-green-500 hover:underline">
                  legal@beatflowmediagroup.com
                </a>
              </p>
            </div>
          </section>

          {/* Authenticity and Integrity */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">4. Authenticity and Integrity</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                We value genuine engagement and authentic representation on BeatFlow Media.
              </p>

              <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-3">Prohibited Practices:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Fake Engagement:</strong> Buying streams, plays, likes, or followers</li>
                  <li><strong>Bot Usage:</strong> Using automated tools to inflate metrics</li>
                  <li><strong>Stream Manipulation:</strong> Artificially inflating play counts</li>
                  <li><strong>Impersonation:</strong> Pretending to be another artist, curator, or entity</li>
                  <li><strong>Fake Accounts:</strong> Creating multiple accounts to manipulate the platform</li>
                  <li><strong>Review Manipulation:</strong> Posting fake reviews or ratings</li>
                  <li><strong>Misleading Metadata:</strong> Using incorrect genres, tags, or artist names to gain visibility</li>
                </ul>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 mt-4">
                <h3 className="text-xl font-semibold text-white mb-3">Best Practices:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Build your audience organically through quality content</li>
                  <li>Represent yourself and your music honestly</li>
                  <li>Use accurate metadata and genre classifications</li>
                  <li>Engage authentically with your fans and community</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Privacy and Safety */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">5. Privacy and Safety</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                Protecting user privacy and safety is a top priority.
              </p>

              <div className="bg-gray-800 rounded-lg p-6">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Don't share other users' personal information without consent (doxxing)</li>
                  <li>Don't solicit personal information from minors</li>
                  <li>Respect other users' privacy settings and boundaries</li>
                  <li>Report suspicious or harmful behavior immediately</li>
                  <li>Don't use BeatFlow Media to stalk, harass, or threaten others</li>
                  <li>Keep your account credentials secure and don't share them</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Commercial Activity */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">6. Commercial Activity</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                BeatFlow Media supports legitimate commercial activity, but certain practices are prohibited.
              </p>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-3">Allowed:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Selling your music through the platform</li>
                  <li>Promoting your shows, merchandise, and other offerings</li>
                  <li>Purchasing music licenses for legitimate use</li>
                  <li>Running approved advertising campaigns</li>
                </ul>
              </div>

              <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 mt-4">
                <h3 className="text-xl font-semibold text-white mb-3">Prohibited:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Pyramid schemes or multi-level marketing</li>
                  <li>Selling counterfeit or unauthorized merchandise</li>
                  <li>Phishing or fraudulent payment schemes</li>
                  <li>Unsolicited commercial messages (spam)</li>
                  <li>Reselling purchased music without proper licensing</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Role-Specific Guidelines */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">7. Role-Specific Guidelines</h2>
            <div className="text-gray-300 space-y-4">

              <h3 className="text-2xl font-semibold text-white">For Artists</h3>
              <div className="bg-gray-800 rounded-lg p-6">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Upload high-quality audio files (minimum 320kbps MP3 or lossless formats)</li>
                  <li>Provide accurate metadata (title, artist name, genre, release date)</li>
                  <li>Use high-resolution album artwork (minimum 1400x1400px)</li>
                  <li>Don't upload duplicate or low-quality content</li>
                  <li>Respond professionally to feedback and reviews</li>
                  <li>Honor your licensing agreements and payment obligations</li>
                  <li>Don't artificially inflate your metrics or engagement</li>
                </ul>
              </div>

              <h3 className="text-2xl font-semibold text-white mt-6">For Curators</h3>
              <div className="bg-gray-800 rounded-lg p-6">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Review submissions fairly and impartially</li>
                  <li>Provide constructive feedback to artists</li>
                  <li>Don't accept bribes or preferential treatment for playlist placement</li>
                  <li>Maintain playlist quality and relevance</li>
                  <li>Credit artists properly in playlist descriptions</li>
                  <li>Don't plagiarize other playlists or content</li>
                </ul>
              </div>

              <h3 className="text-2xl font-semibold text-white mt-6">For Listeners</h3>
              <div className="bg-gray-800 rounded-lg p-6">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Support artists by purchasing music and attending shows</li>
                  <li>Leave respectful reviews and feedback</li>
                  <li>Share music through proper channels (not unauthorized downloads)</li>
                  <li>Report inappropriate content or behavior</li>
                  <li>Respect licensing terms when using purchased music</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Reporting Violations */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">8. Reporting Violations</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                If you encounter content or behavior that violates these guidelines, please report it immediately.
              </p>

              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-3">How to Report:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Use the "Report" button on content or user profiles</li>
                  <li>Email <a href="mailto:support@beatflowmediagroup.com" className="text-green-500 hover:underline">support@beatflowmediagroup.com</a> with details</li>
                  <li>For copyright issues, email <a href="mailto:legal@beatflowmediagroup.com" className="text-green-500 hover:underline">legal@beatflowmediagroup.com</a></li>
                  <li>For urgent safety concerns, contact us immediately</li>
                </ul>
                <p className="mt-4">
                  All reports are reviewed by our moderation team. We may request additional information
                  to investigate. False reports or abuse of the reporting system may result in account penalties.
                </p>
              </div>
            </div>
          </section>

          {/* Enforcement */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">9. Enforcement</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                Violations of these guidelines may result in the following actions:
              </p>

              <div className="bg-gray-800 rounded-lg p-6">
                <ul className="list-disc list-inside space-y-3 ml-4">
                  <li>
                    <strong className="text-white">Content Removal:</strong> Individual tracks, albums, or posts
                    that violate guidelines will be removed
                  </li>
                  <li>
                    <strong className="text-white">Warning:</strong> First-time or minor violations may receive
                    a warning with explanation
                  </li>
                  <li>
                    <strong className="text-white">Temporary Suspension:</strong> Accounts may be suspended for
                    a specified period for repeated or serious violations
                  </li>
                  <li>
                    <strong className="text-white">Permanent Termination:</strong> Severe or repeated violations
                    will result in permanent account deletion
                  </li>
                  <li>
                    <strong className="text-white">Legal Action:</strong> Illegal activity may be reported to
                    law enforcement authorities
                  </li>
                </ul>
              </div>

              <p className="mt-4">
                Enforcement decisions are made at BeatFlow Media's sole discretion. If you believe your account
                was unfairly penalized, you may appeal by contacting{" "}
                <a href="mailto:support@beatflowmediagroup.com" className="text-green-500 hover:underline">
                  support@beatflowmediagroup.com
                </a>
              </p>
            </div>
          </section>

          {/* Updates to Guidelines */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">10. Updates to These Guidelines</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                We may update these User Guidelines from time to time to reflect changes in our platform,
                community needs, or legal requirements. Material changes will be communicated through email
                or a notice on the platform.
              </p>
              <p>
                Your continued use of BeatFlow Media after guideline updates constitutes acceptance of the
                new guidelines.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">Questions or Concerns?</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                If you have questions about these User Guidelines or need clarification, please contact us:
              </p>
              <div className="bg-gray-800 rounded-lg p-6">
                <p><strong className="text-white">BeatFlow Media Inc.</strong></p>
                <p>Community Team</p>
                <p>478 Cubhouse Dr.</p>
                <p>Middletown, NJ 07748</p>
                <p>United States</p>
                <p className="pt-4">
                  Email:{" "}
                  <a href="mailto:support@beatflowmediagroup.com" className="text-green-500 hover:underline">
                    support@beatflowmediagroup.com
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* Thank You */}
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-2">Thank You</h3>
            <p className="text-gray-300">
              Thank you for being part of the BeatFlow Media community and helping us create a safe,
              respectful, and inspiring platform for music lovers and creators worldwide.
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
