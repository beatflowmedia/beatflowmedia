import React from "react";

const plans = [
  {
    title: "Individual",
    price: "$11.99 / month after",
    details: [
      "1 Premium account",
      "Cancel anytime",
      "15-hour/month of listening time from our audiobooks",
    ],
    button: "Try free for 1 month",
    note: "Free for 1 month, then $11.99/month after.",
    tag: "Free for 1 month",
  },
  {
    title: "Student",
    price: "$9.99 / month after",
    details: [
      "1 verified Premium account",
      "Discount for eligible students",
      "Same benefits as Individual",
    ],
    button: "Try free for 1 month",
    note: "Free for 1 month, then $9.99/month after.",
    tag: "Free for 1 month",
  },
  {
    title: "Duo",
    price: "$16.99 / month after",
    details: [
      "2 Premium accounts",
      "For couples under one roof",
      "Plan manager only",
    ],
    button: "Get Premium Duo",
    note: "For couples who reside at the same address.",
    tag: "Free for 1 month",
  },
  {
    title: "Family",
    price: "$18.99 / month",
    details: [
      "Up to 6 Premium or Kids accounts",
      "Control content marked as explicit",
      "Access to Spotify Kids",
      "Plan manager only",
    ],
    button: "Get Premium Family",
    note: "For couples or families who reside at the same address.",
    tag: "Popular",
  },
];

export default function ExplorePremium() {
  return (
    <div className="text-white bg-black min-h-screen">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-r from-purple-700 via-pink-600 to-purple-700 py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Listen without limits. Try 1 month of Premium Individual for free.
          </h1>
          <p className="text-base sm:text-lg mb-6">
            Only $19.99/month after. Cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button className="bg-white text-black font-semibold px-6 py-3 rounded-full hover:bg-gray-200 transition">
              Get started
            </button>
            <button className="bg-transparent border border-white text-white font-semibold px-6 py-3 rounded-full hover:bg-white hover:text-black transition">
              View plans
            </button>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 text-center bg-black">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">
          Affordable plans for any situation
        </h2>
        <p className="text-gray-400 mb-8 max-w-2xl mx-auto text-base sm:text-lg">
          Choose a Premium plan and listen to ad-free music on all your devices.
          Pay in various ways. Cancel anytime.
        </p>

        <div className="flex justify-center gap-4 mb-8">
          {["visa", "mastercard", "paypal"].map((provider) => (
            <img
              key={provider}
              src={`/images/payment/${provider}.png`}
              alt={`${provider} logo`}
              className="w-12 h-auto"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <div key={i} className="bg-gray-800 p-6 rounded-lg text-left">
              <div className="bg-pink-500 text-white px-3 py-1 rounded-full w-fit mb-4">
                {plan.tag}
              </div>
              <h3 className="text-xl font-bold mb-2">{plan.title}</h3>
              <p className="text-sm text-gray-400 mb-2">{plan.price}</p>
              <ul className="text-gray-300 text-sm mb-4 space-y-1">
                {plan.details.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
              <button className="bg-white text-black font-semibold w-full py-2 rounded-full hover:bg-gray-200 transition">
                {plan.button}
              </button>
              <p className="text-xs text-gray-400 mt-2">{plan.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-black">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
          Experience the difference
        </h2>
        <p className="text-center text-gray-400 mb-6 text-base sm:text-lg">
          Go Premium and enjoy full control of your listening. Cancel anytime.
        </p>
        <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-4 text-sm text-gray-300">What you get</th>
                <th className="p-4 text-sm text-gray-300 text-center">Free</th>
                <th className="p-4 text-sm text-gray-300 text-center">Premium</th>
              </tr>
            </thead>
            <tbody>
              {[
                "Ad-free music listening",
                "Download songs",
                "High-quality audio",
                "Listen with fewer ads",
                "Organize listening space",
              ].map((feature, idx) => (
                <tr key={idx} className="border-b border-gray-600">
                  <td className="p-4 text-white">{feature}</td>
                  <td className="p-4 text-center">✖</td>
                  <td className="p-4 text-center">✔</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-gray-400 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            {
              title: "Company",
              links: [
                ["About", "/about"],
                ["Jobs", "/jobs"],
                ["For the Record", "/for-the-record"],
              ],
            },
            {
              title: "Communities",
              links: [
                ["For Artists", "/for-artist"],
                ["Developers", "/developers"],
                ["Advertising", "/advertising"],
              ],
            },
            {
              title: "Useful links",
              links: [
                ["Support", "/support"],
                ["Web Player App", "/webplayer"],
              ],
            },
            {
              title: "Spotify Plans",
              links: [
                ["Premium Individual", "/individual"],
                ["Premium Student", "/student"],
                ["Premium Duo", "/duo"],
                ["Premium Family", "/family"],
                ["Audiobooks Access", "/audiobooks"],
              ],
            },
          ].map((section, idx) => (
            <div key={idx}>
              <h4 className="text-white font-semibold mb-2">{section.title}</h4>
              <ul className="space-y-1">
                {section.links.map(([text, href], linkIdx) => (
                  <li key={linkIdx}>
                    <a href={href} className="hover:text-white">
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          © 2025 BeatFlow Media. All rights reserved. Various trademarks held by their respective owners.
        </p>
      </footer>
    </div>
  );
}
