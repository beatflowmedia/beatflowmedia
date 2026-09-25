import React from "react";
import Footer from "../components/Footer";

// This page replaced copy that was lifted near-verbatim from Spotify's own About
// page -- "With Spotify, it's easy to find the right music for every moment - on your
// phone, your computer, your tablet and more. There are millions of tracks and
// podcasts on Spotify" -- with the name swapped. On a platform whose entire legal
// position rests on respecting other people's rights, that was the least defensible
// page on the site.
//
// It also claimed "millions of tracks and podcasts" against a catalogue of 138 tracks
// and no podcasts at all. A quantity claim that specific and that wrong is not
// puffery, it is a false advertising exposure -- and it is the kind of claim a
// competitor or a regulator can check in one click.
//
// Everything below is true as written and checkable against the catalogue. Where a
// number would date quickly it is described rather than counted, so the page does not
// silently become false the next time the catalogue grows.

export default function About() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pt-16 px-6 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left column */}
          <div>
            <h1 className="text-4xl font-bold mb-4">About BeatFlow Media Group</h1>
            <p className="text-gray-400 mb-4">
              BeatFlow Media Group is an independent music company. We write, produce and
              release our own catalogue, and we license it directly — without the chain of
              intermediaries that usually sits between a recording and the person who wants
              to use it.
            </p>
            <p className="text-gray-400 mb-6">
              Every release is cleared at source. Because we hold both the recording and the
              composition, a single licence covers both — no separate publisher to chase, no
              split rights to reconcile. We call that one-stop clearance, and it is the
              reason this catalogue exists.
            </p>

            <h2 className="text-2xl font-semibold mb-2">How our music is made</h2>
            <p className="text-gray-400 mb-6">
              Our recordings are produced with the assistance of artificial intelligence.
              Lyrics and songwriting are human work; performance and instrumentation are
              generated. We say so plainly because you deserve to know what you are
              licensing, and because the law in this area is still settling. Our{" "}
              <a href="/terms" className="text-white hover:underline">
                licence terms
              </a>{" "}
              set out exactly what a purchase grants you and what it does not.
            </p>

            <h2 className="text-2xl font-semibold mb-2">Customer service and support</h2>
            <ul className="list-disc list-inside text-gray-400 mb-6 space-y-2">
              <li>
                <a href="/support" className="text-white hover:underline">
                  Help
                </a>
                : answers to common questions about licensing, downloads and your account.
              </li>
              <li>
                <a href="/sync-licensing" className="text-white hover:underline">
                  Sync licensing
                </a>
                : for film, television, advertising, games and other media. Handled
                directly, not through self-service checkout.
              </li>
              <li>
                <a href="/contact" className="text-white hover:underline">
                  Contact us
                </a>
                : message the team and we will get back to you.
              </li>
              <li>
                <a href="/accessibility" className="text-white hover:underline">
                  Accessibility
                </a>
                : tell us where the site fails you and we will fix it.
              </li>
            </ul>
          </div>

          {/* Right column */}
          <div className="grid grid-cols-1 gap-8">
            {/* No mailto links. Enquiries are raised in the app and land in the
                back office (studioInquiryService -> StudioInquiriesManager), where
                they can be tracked, assigned and answered. A published mailbox
                bypasses all of that: the message arrives somewhere nobody is
                measuring, and a licensing enquiry that goes unanswered is a sale
                that quietly did not happen.

                The Terms and Privacy Policy still carry postal and email contacts,
                because a contract and a privacy notice are REQUIRED to name a way to
                reach the company. That is a legal obligation, not a support channel,
                and the distinction is why those pages keep theirs while this one
                does not. */}
            <div>
              <h3 className="text-xl font-semibold mb-2">Get in touch</h3>
              <ul className="text-gray-400 space-y-6">
                <li>
                  <strong className="text-white">General enquiries</strong>
                  <br />
                  <a href="/contact" className="text-white hover:underline">
                    Send us a message
                  </a>{" "}
                  — it reaches the team directly and we can track it through to an answer.
                </li>
                <li>
                  <strong className="text-white">Licensing and sync</strong>
                  <br />
                  <a href="/sync-licensing" className="text-white hover:underline">
                    Start a licensing enquiry
                  </a>{" "}
                  — tell us about the project and we will come back with terms.
                </li>
                <li>
                  <strong className="text-white">Support</strong>
                  <br />
                  <a href="/support" className="text-white hover:underline">
                    Help centre
                  </a>{" "}
                  — account, downloads and licence questions.
                </li>
              </ul>

              <div className="mt-8 pt-6 border-t border-gray-700">
                <p className="text-sm text-gray-500">
                  <strong className="text-gray-300">BeatFlow Media Group</strong>
                  <br />
                  Middletown, New Jersey, United States
                </p>
                <p className="text-sm text-gray-500 mt-3">
                  Our registered postal address and legal contacts are in our{" "}
                  <a href="/terms" className="text-gray-300 hover:underline">
                    Terms
                  </a>{" "}
                  and{" "}
                  <a href="/privacy-policy" className="text-gray-300 hover:underline">
                    Privacy Policy
                  </a>
                  .
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
