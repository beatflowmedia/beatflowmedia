import React from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";

// This page described Spotify's advertising product, not ours. It opened with "Two
// ways to listen: Free with Ads / Premium (Ad-Free)", listed audio, video and
// sponsored-content ad formats, and offered to make the site ad-free by upgrading to
// Premium. None of that is true here: there is no ad-supported listening tier, the
// only ads on this site are Google display units on the editorial pages, and NOTHING
// in the code suppresses ads for a paying subscriber -- GoogleAdSense.js renders null
// and never checks a plan. It also invited advertisers to "reach millions of engaged
// listeners", the same invented quantity that was on /about.
//
// A page about advertising is a privacy disclosure, not marketing copy. Every claim
// below is checkable against the code:
//   - AdSense is loaded in public/index.html (client ca-pub-8171029345239877)
//   - GoogleAdSense.js marks Blog, BlogPost, Community and ForTheRecord
//   - the personalised-ads choice is honoured by src/utils/adConsent.js
//
// The instructions it gave for opting out -- "Settings -> Privacy -> Advertising
// Preferences" -- described a screen that does not exist. The real control is
// /ad-preferences, and until today it saved a value nothing read.

export default function AboutAds() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto py-12 sm:py-16">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">About ads</h1>
          <p className="text-lg text-gray-300 mb-12">
            What advertising we show, why, and how to change what you see.
          </p>

          {/* What we actually run */}
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Where ads appear
            </h2>
            <p className="text-gray-300 mb-4">
              We show display advertising from Google AdSense on our editorial pages —
              the blog, For the Record, and the community pages. Advertising helps pay
              for the writing and keeps those pages free to read.
            </p>
            <p className="text-gray-300 mb-4">
              We do not run audio ads, video ads or sponsored playlists, and there is no
              advertising in the catalogue, in checkout, or on any page where you manage
              your account or licences.
            </p>
            <p className="text-gray-400 text-sm">
              Ads are served by Google, which means Google — not BeatFlow Media Group —
              decides which specific ad you see. We do not sell your personal
              information to advertisers.
            </p>
          </section>

          {/* The control that works */}
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Your choices</h2>

            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold mb-3">Turn off personalised ads</h3>
              <p className="text-gray-300 mb-4">
                You can ask us to request only non-personalised ads. You will still see
                advertising, but it will be based on the page you are reading and your
                approximate location rather than on your past activity.
              </p>
              <Link
                to="/ad-preferences"
                className="inline-flex items-center justify-center min-h-[44px] px-6 text-base bg-green-600 hover:bg-green-700 rounded-full font-semibold transition-colors"
              >
                Ad preferences
              </Link>
              <p className="text-sm text-gray-400 mt-4">
                Your choice is applied before any ad is requested, on every page load.
                It is stored on your account and on this device, so clearing your
                browser data will reset it on that device until you sign in again.
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold mb-3">Industry opt-out tools</h3>
              <p className="text-gray-400 mb-4">
                These are run by advertising industry bodies, not by us, and they cover
                participating advertisers across many sites:
              </p>
              <ul className="text-gray-400 space-y-2">
                <li>
                  Digital Advertising Alliance:{" "}
                  <a
                    href="https://youradchoices.com/control"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500 hover:underline"
                  >
                    youradchoices.com
                  </a>
                </li>
                <li>
                  Network Advertising Initiative:{" "}
                  <a
                    href="https://optout.networkadvertising.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500 hover:underline"
                  >
                    optout.networkadvertising.org
                  </a>
                </li>
                <li>
                  European Interactive Digital Advertising Alliance:{" "}
                  <a
                    href="https://youronlinechoices.eu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500 hover:underline"
                  >
                    youronlinechoices.eu
                  </a>
                </li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-3">Your device settings</h3>
              <p className="text-gray-400 mb-4">
                Your phone or tablet has its own advertising control, which applies
                across apps and sites:
              </p>
              <div className="space-y-3 text-gray-400">
                <div>
                  <p className="font-semibold text-gray-300">iOS</p>
                  <p className="text-sm">
                    Settings → Privacy &amp; Security → Tracking
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-300">Android</p>
                  <p className="text-sm">
                    Settings → Google → Ads → Opt out of Ads Personalisation
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Advertisers */}
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">For advertisers</h2>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                Display advertising on this site is bought through Google, not from us.
                What we sell directly is sponsorship of{" "}
                <strong>BeatFlow Radio</strong> — a recorded spot in the rotation and
                your card on the player.
              </p>
              <p className="text-gray-400 text-sm mb-6">
                We price sponsorship on airings, which we can count exactly, and we do
                not quote audience figures, because the station does not yet measure
                listeners.
              </p>
              <Link
                to="/advertising"
                className="inline-flex items-center justify-center min-h-[44px] px-6 text-base bg-green-600 hover:bg-green-700 rounded-full font-semibold transition-colors"
              >
                Sponsorship packages
              </Link>
            </div>
          </section>

          {/* Privacy */}
          <section>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Privacy and ads</h2>
            <p className="text-gray-400 mb-4">
              How we collect, use and protect your information:
            </p>
            <ul className="space-y-2">
              {[
                { label: "Privacy Policy", to: "/privacy-policy" },
                { label: "Cookie Policy", to: "/cookies" },
                { label: "Privacy Center", to: "/privacy-center" },
                { label: "Your Privacy Choices", to: "/privacy-choices" }
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="inline-flex items-center min-h-[44px] text-green-500 hover:underline"
                  >
                    {link.label} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
