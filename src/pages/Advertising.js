import React from "react";
import { FiChevronDown } from "react-icons/fi";
import { Link } from "react-router-dom";

// Resources dropdown items
const resourcesLinks = [
  { label: "Help Center", href: "/resources/help-center" },
  { label: "Ad Specs", href: "/resources/ad-specs" },
  { label: "Wrapped for Advertisers 2024", href: "/resources/wrapped-2024" },
  {
    label: "Creative Best Practices",
    href: "/resources/creative-best-practices"
  },
  { label: "Partners", href: "/resources/partners" },
  { label: "Analytics Help Center", href: "/resources/analytics-help-center" },
];

export default function Advertising() {
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header nav */}
      <header className="bg-gray-900">
        <nav className="max-w-6xl mx-auto flex items-center justify-between py-4 px-6">
          <div className="flex items-center space-x-8">
            <span className="text-2xl font-bold text-bf-green">
              BeatFlow Advertising
            </span>
            {[
              "Get Started",
              "Ad Formats",
              "Goals",
              "News & Inspiration",
              "Creative Lab",
            ].map((link) => (
              <a key={link} href="#" className="hover:text-gray-400">
                {link}
              </a>
            ))}
            <div className="relative group">
              <button className="flex items-center hover:text-gray-400">
                Resources <FiChevronDown className="ml-1" />
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {resourcesLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="block px-4 py-2 hover:bg-gray-700"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <Link to="/ad-signup">
            <button className="bg-bf-green px-4 py-2 rounded-full text-black font-semibold">
              Create an ad
            </button>
          </Link>
        </nav>
      </header>

      {/* Hero section with image */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-5xl font-bold mb-4">
              Your ads work harder with BeatFlow Media
            </h1>
            <p className="text-gray-400 mb-8">
              Advertising on BeatFlow Media gives you more moments to reach your
              audience, more attention paid to your message, more success across
              the funnel, and flexible ways to buy to help you achieve your
              business objectives.
            </p>
            <div className="flex justify-center lg:justify-start space-x-4">
              <Link to="/ad-signup">
                <button className="bg-white text-black px-6 py-3 rounded-full font-semibold">
                  Create an ad
                </button>
              </Link>
              <button className="border border-white px-6 py-3 rounded-full font-semibold hover:bg-white hover:text-black">
                Learn More
              </button>
            </div>
          </div>
          <div>
            <img
              src="/images/hero-ads.png"
              alt="Advertising creative"
              className="w-full rounded-lg shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Stats section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">The numbers don't lie</h2>
          <p className="text-gray-400">
            When ads reach you at the right moment, they don’t interrupt—they
            engage. That’s why ads on BeatFlow Media are remembered more
            frequently and more favorably than other platforms.
          </p>
        </div>
      </section>

      {/* Custom inquiry form */}
      <section className="py-16 px-6 bg-gray-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Prompt text */}
          <div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Looking for something a little more custom? Let's talk.
            </h2>
          </div>
          {/* Inquiry form */}
          <form className="space-y-4 text-gray-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select className="bg-gray-700 p-3 rounded w-full">
                <option>I am a brand/business</option>
                <option>Agency/Partner</option>
              </select>
              <select className="bg-gray-700 p-3 rounded w-full">
                <option>Looking to drive revenue</option>
                <option>Building brand awareness</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="First Name"
              className="w-full bg-gray-700 p-3 rounded"
            />
            <input
              type="text"
              placeholder="Last Name"
              className="w-full bg-gray-700 p-3 rounded"
            />
            <input
              type="email"
              placeholder="Email Address"
              className="w-full bg-gray-700 p-3 rounded"
            />
            <input
              type="text"
              placeholder="Company"
              className="w-full bg-gray-700 p-3 rounded"
            />
            <input
              type="text"
              placeholder="Website"
              className="w-full bg-gray-700 p-3 rounded"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select className="bg-gray-700 p-3 rounded w-full">
                <option>United States</option>
                <option>United Kingdom</option>
              </select>
              <select className="bg-gray-700 p-3 rounded w-full">
                <option>State</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="newsletter"
                type="checkbox"
                className="bg-gray-700 rounded text-bf-green"
              />
              <label htmlFor="newsletter" className="text-gray-300">
                Sign up for our newsletter
              </label>
            </div>
            <button
              type="submit"
              className="bg-bf-green text-black px-6 py-3 rounded-full font-semibold"
            >
              Get in touch
            </button>
          </form>
        </div>
      </section>

      {/* Ad formats section */}
      <section className="py-16 px-6 bg-gray-900">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-4">
              Ad formats that help drive outcomes
            </h2>
            <p className="text-gray-400">
              Our ad formats and capabilities are as dynamic as our base.
              BeatFlow Ads Manager makes it easy to get the right ad to the
              right person, at the right time.
            </p>
          </div>
          <div className="relative">
            {/* Placeholder for ad formats carousel/image */}
            <img
              src="/images/ad-formats.jpg"
              alt="Ad formats showcase"
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>
        {/* Video Ads */}
        <div className="max-w-6xl mx-auto mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <img
            src="/images/video-ads.jpg"
            alt="Eye-catching video ads"
            className="rounded-lg shadow-lg"
          />
          <div>
            <h3 className="text-2xl font-semibold mb-2">
              Eye-catching video ads
            </h3>
            <p className="text-gray-400 mb-4">
              Create moments of connection through visual storytelling, served
              only when your audience is listening in the app.
            </p>
            <button className="bg-bf-green text-black px-4 py-2 rounded-full font-semibold">
              Learn more
            </button>
          </div>
        </div>
        {/* Audio Ads */}
        <div className="max-w-6xl mx-auto mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
          <img
            src="/images/audio-ads.jpg"
            alt="Audio ads"
            className="rounded-lg shadow-lg"
          />
          <div>
            <h3 className="text-2xl font-semibold mb-2">
              Attention-grabbing audio ads
            </h3>
            <p className="text-gray-400 mb-4">
              Reach active listeners on any device, at any time of day. Audio
              ads are served between songs, so listeners are distraction-free
              and focused on what you have to say.
            </p>
            <button className="bg-bf-green text-black px-4 py-2 rounded-full font-semibold">
              Learn more
            </button>
          </div>
        </div>
        {/* Podcast Ads */}
        <div className="max-w-6xl mx-auto mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <img
            src="/images/podcast-ads.jpg"
            alt="Podcast ads"
            className="rounded-lg shadow-lg"
          />
          <div>
            <h3 className="text-2xl font-semibold mb-2">
              Thought-provoking podcast ads
            </h3>
            <p className="text-gray-400 mb-4">
              Align your message with top podcasts and shows for deep listener
              engagement. Podcast ads drive conversation and brand recall.
            </p>
            <button className="bg-bf-green text-black px-4 py-2 rounded-full font-semibold">
              Learn more
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
