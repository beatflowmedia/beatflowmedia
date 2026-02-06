import React from "react";
import Footer from "../components/Footer";

export default function About() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pt-16 px-6 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left column */}
          <div>
            <h1 className="text-4xl font-bold mb-4">About BeatFlow Media</h1>
            <p className="text-gray-400 mb-6">
              With BeatFlow Media, it’s easy to find the right music for every
              moment — on your phone, your computer, your tablet and more. There
              are millions of tracks and podcasts on BeatFlow Media. So whether
              you’re behind the wheel, working out, partying or relaxing, the
              right music or podcast is always at your fingertips. Choose what
              you want to listen to, or let BeatFlow Media surprise you.
            </p>
            <h2 className="text-2xl font-semibold mb-2">
              Customer Service and Support
            </h2>
            <ul className="list-disc list-inside text-gray-400 mb-6 space-y-2">
              <li>
                <a href="/support" className="text-white hover:underline">
                  Help
                </a>
                : Check our help site for answers to your questions and to learn
                how to get the most out of BeatFlow Media.
              </li>
              <li>
                <a href="/community" className="text-white hover:underline">
                  Community
                </a>
                : Get support from other BeatFlow Media users. If there isn’t
                already an answer there for your question, post it and someone
                will quickly answer.
              </li>
              <li>
                <a href="/contact" className="text-white hover:underline">
                  Contact us
                </a>
                : Shoot the BeatFlow Media support team a message — we’re here
                to help.
              </li>
              <li>
                <a href="/accessibility" className="text-white hover:underline">
                  Accessibility support
                </a>
                : Simply tweet the team and they’ll do all they can to help.
              </li>
            </ul>
          </div>
          {/* Right column */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-2">
                BeatFlow around the world
              </h3>
              <ul className="text-gray-400 space-y-6">
                <li>
                  <strong>BeatFlow USA</strong>
                  <br />
                  478 Cubhouse Dr.
                  <br />
                  Middletown, NJ 07748
                  <br />
                  USA
                  <br />
                  <a
                    href="mailto:office@beatflowmediagroup.com"
                    className="text-white hover:underline"
                  >
                    office@beatflowmediagroup.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
