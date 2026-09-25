import React from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { currentAgreementVersion, parseAgreementVersion, DOWNLOAD_LICENSE } from "../utils/agreements";

// The version identifier this page is, read from the canonical registry rather than
// written here. Falls back to a plain label if the agreement is ever unpublished, so
// the page renders rather than showing "null".
const TERMS_VERSION = currentAgreementVersion(DOWNLOAD_LICENSE) || "unversioned";
const TERMS_DATE = (() => {
  const parsed = parseAgreementVersion(TERMS_VERSION);
  if (!parsed) return null;
  const d = new Date(parsed.version + "T00:00:00Z");
  return Number.isNaN(d.getTime())
    ? parsed.version
    : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
})();

export default function Terms() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Terms and Conditions of Use</h1>
          {/* Derived, never typed. src/utils/agreements.js holds the version that
              create-checkout verifies and stripe-webhook writes onto the purchase
              record. A hand-edited date here could disagree with the identifier a
              buyer is recorded as having accepted, which is precisely the evidence
              the versioning exists to produce. This page and that record cannot
              drift, because they read the same constant. */}
          {/* SCOPED DELIBERATELY. The identifier versions the DOWNLOAD LICENSE, not
              this whole page -- and the acceptance checkbox at checkout asks the
              buyer to accept exactly that, by name. Heading the full document
              "Version download-license@..." implied the recorded acceptance covered
              all fifteen sections, including arbitration, subscriptions and artist
              revenue, which the buyer was never shown and never agreed to. Claiming
              more scope than the evidence supports is the failure this versioning
              exists to prevent, so the label says which part it governs. */}
          <p className="text-sm text-gray-400 mb-2">
            Download License version:{' '}
            <span className="font-mono text-gray-300">{TERMS_VERSION}</span>
            {TERMS_DATE ? <> &middot; in force from {TERMS_DATE}</> : null}
          </p>
          <p className="text-sm text-gray-400 mb-8">
            That identifier and the time of your acceptance are recorded with your purchase, and
            they govern the <strong>Download License</strong> in section 4. Earlier purchases remain
            governed by whichever version was accepted at the time. The remaining sections are the
            general terms of use for the Service and are not separately versioned.
          </p>

          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">1. Introduction</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                Welcome to BeatFlow Media Group. These Terms and Conditions ("Terms") govern your use of our website,
                applications, and services (collectively, the "Service"). By accessing or using BeatFlow Media Group,
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
                To access certain features of BeatFlow Media Group, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain the security of your account credentials</li>
                <li>Promptly update your information to keep it accurate</li>
                <li>Be responsible for all activities under your account</li>
                <li>Not share your account with others or allow unauthorized access</li>
              </ul>
              <p>
                You must be at least 13 years old to use BeatFlow Media Group. If you are under 18, you must have
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
                All music, artwork, text, and other content on BeatFlow Media Group is protected by copyright and
                intellectual property laws. Artists retain ownership of their uploaded content, but grant
                BeatFlow Media Group a non-exclusive license to distribute and promote such content.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">Licensing for Use</h3>
              <p>
                When you purchase a license through BeatFlow Media Group, you receive specific rights as outlined
                in your purchase. License types include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Download License:</strong> Personal, private listening. Defined in full below.</li>
                <li><strong>Sync License:</strong> For synchronization with video or other media. Negotiated
                  separately and not available through self-service checkout.</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6">The Download License — What You Receive</h3>
              <p>
                Licensing a single track or an album grants you a <strong>non-exclusive, worldwide,
                non-transferable, perpetual license</strong> to download one copy of the recording and to listen
                to it privately, for your own personal enjoyment. The license does not expire, and it survives
                the end of any subscription you may hold.
              </p>
              <p>
                You may keep personal backup copies on devices you own. You may not give, sell, lend, or
                transfer the license or the file to anyone else.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">What the Download License Does Not Cover</h3>
              <p>
                The following are <strong>not</strong> granted, and each requires a separate written license
                from BeatFlow Media Group:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Public performance</strong> — playing the recording to an audience or in a public
                  or commercial space, including DJ sets, clubs, bars, restaurants, cafés, gyms, retail
                  premises, salons, offices, events, and live or recorded streams.</li>
                <li><strong>Broadcast or transmission</strong> — radio, television, webcast, podcast, or any
                  on-demand or streaming service.</li>
                <li><strong>Synchronization</strong> — pairing the recording with video, film, games,
                  advertising, or any other media.</li>
                <li><strong>Adaptation and derivative works</strong> — edits, remixes, mashups, extensions,
                  re-edits, stems, sampling, interpolation, or any altered version of the recording.</li>
                <li><strong>Compilations and mixes</strong> — including the recording in a mix, set,
                  compilation, or playlist that you publish, distribute, sell, or monetize.</li>
                <li><strong>Redistribution</strong> — reselling, sharing, file-sharing, or uploading the
                  recording to any platform, service, library, or marketplace.</li>
                <li><strong>AI and machine learning</strong> — using the recording, in whole or in part, to
                  train, fine-tune, condition, or evaluate any machine learning model or dataset.</li>
                <li><strong>Sublicensing</strong> — granting any of the above to another person, including by
                  uploading to a platform whose terms would require you to grant them such rights.</li>
              </ul>
              <p className="text-sm text-gray-400">
                If you are a DJ, or you play music in a business, a download license is not sufficient. That
                use requires public performance rights, which in most territories are obtained from a
                performing rights organization, and may also require a separate license from us.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">Reservation of Rights</h3>
              <p>
                All rights not expressly granted in these Terms are reserved by BeatFlow Media Group and its
                licensors. Nothing in these Terms transfers ownership of any recording, composition, artwork,
                or trademark to you. A purchase is a license, not a sale of the underlying work.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">Scope of Our Warranty</h3>
              <p>
                We warrant that we have the right to grant the license described above. We make{' '}
                <strong>no representation or warranty</strong> that any recording is protected by copyright,
                that any particular person owns or authored it, that it is original, or that it is or will
                remain exclusive to you or to us. Recordings are licensed on an{' '}
                <strong>&ldquo;as is&rdquo;</strong> basis.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">AI Provenance</h3>
              <p>
                Some or all recordings available through BeatFlow Media Group are created with the assistance
                of, or generated by, artificial intelligence tools. The legal status of copyright in
                AI-generated material is unsettled and varies by jurisdiction. Your rights and obligations
                under this license are contractual and apply regardless of whether copyright subsists in any
                particular recording.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">Termination of a License</h3>
              <p>
                A download license terminates automatically and immediately if you breach any restriction
                above. On termination you must stop using the recording and delete all copies in your
                possession. Termination for breach does not entitle you to a refund and does not limit any
                other remedy available to us.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">Acceptance and Versioning</h3>
              <p>
                These Terms are versioned by date. You are asked to accept the version in force at the time you
                buy, and the version identifier and the time of your acceptance are recorded against your
                purchase. Those recorded values, and not any later revision of this page, govern that purchase.
              </p>
              <p>
                Licenses are non-transferable and subject to the specific terms presented at the time of
                purchase.
              </p>
            </div>
          </section>

          {/* Payments and Revenue */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">5. Payments and Revenue</h2>
            <div className="text-gray-300 space-y-4">
              <h3 className="text-xl font-semibold text-white">Purchases</h3>
              <p>
                All purchases are processed through our payment partner, Stripe. We do not receive or store
                your card details. Prices are displayed in USD. The price charged is the price stored against
                the item at the time of purchase.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">Delivery</h3>
              <p>
                Purchases are delivered as a digital download from your account. Download links are generated
                on request and are deliberately short-lived; if a link expires before you use it, request
                another from your purchase history. Your license does not expire when a link does.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">Refunds</h3>
              <p>
                Because a purchase delivers a digital file immediately and the license granted cannot be
                returned, <strong>all sales are final</strong> and we do not offer refunds for change of mind.
              </p>
              <p>
                We will refund you in full where we fail to deliver what you paid for — for example, where the
                file is corrupt, where the recording does not match its description, or where a charge was
                duplicated. Contact us and we will make it right.
              </p>
              <p className="text-sm text-gray-400">
                Nothing in this section limits any statutory right you have that cannot be waived under the law
                of your country or state.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">Artist Revenue</h3>
              <p>
                Artists earn <strong>70% of net sales revenue</strong>, with BeatFlow Media Group retaining 30% as a
                platform fee covering hosting, bandwidth, catalog administration, and platform maintenance.
                Payouts are processed monthly via Stripe Connect, subject to a minimum threshold of $50.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">What &ldquo;Net Sales Revenue&rdquo; Means</h3>
              <p>
                <strong>Net sales revenue</strong> means the amount charged to the buyer, less payment
                processing fees, less the statutory mechanical royalty payable on the composition, less any
                refund or chargeback on that sale. The 70/30 split is applied to that figure.
              </p>
              <p className="text-sm text-gray-400">
                Worked example. A track sold at $1.99: payment processing of $0.36 and a statutory mechanical
                royalty of $0.131 are deducted, leaving net sales revenue of $1.50. The artist receives $1.05
                and BeatFlow Media Group retains $0.45.
              </p>
              <p className="text-sm text-gray-400">
                The statutory mechanical rate is set by the U.S. Copyright Royalty Board and changes annually.
                The rate applied is the one in force on the date of the sale &mdash; currently 13.1&cent; per
                track, or 2.52&cent; per minute for recordings over five minutes, whichever is greater. An
                album owes this once per track.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">Statements and Audit</h3>
              <p>
                Royalty statements itemize gross revenue and each deduction separately, so that net sales
                revenue can be checked against the amount charged. You may request supporting records for any
                statement within twelve months of its issue.
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
                BeatFlow Media Group reserves the right to remove any content that violates these Terms or our
                Community Guidelines. We may also suspend or terminate accounts for violations. Content
                moderation decisions are at our sole discretion.
              </p>
              <p>
                We respond to DMCA takedown notices and other intellectual property claims. If you believe
                content infringes your rights, please contact us at{" "}
                <a href="mailto:legal@beatflowmediagroup.com" className="text-green-500 hover:underline">
                  legal@beatflowmediagroup.com
                </a>
              </p>
            </div>
          </section>

          {/* Privacy */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4">8. Privacy</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                Your use of BeatFlow Media Group is also governed by our{" "}
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
                You agree to indemnify and hold harmless BeatFlow Media Group, its officers, directors, employees,
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
                <p><strong className="text-white">BeatFlow Media Group</strong></p>
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
          </section>

          {/* Agreement */}
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-2">Agreement</h3>
            <p className="text-gray-300">
              By using BeatFlow Media Group, you acknowledge that you have read, understood, and agree to be bound
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
