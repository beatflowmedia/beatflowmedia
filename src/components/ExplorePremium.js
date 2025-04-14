import React from "react";

export default function ExplorePremium() {
  return (
    <div className="text-white bg-black min-h-screen">
      {/* Hero / Banner Section */}
      <section className="w-full bg-gradient-to-r from-purple-700 via-pink-600 to-purple-700 py-16 px-8 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Listen without limits. Try 1 month of Premium Individual for free.
        </h1>
        <p className="text-lg mb-6">
          Only $19.99/month after. Cancel anytime.
        </p>
        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
          <button className="bg-white text-black font-semibold px-6 py-3 rounded-full hover:bg-gray-200 transition">
            Get started
          </button>
          <button className="bg-transparent border border-white text-white font-semibold px-6 py-3 rounded-full hover:bg-white hover:text-black transition">
            View plans
          </button>
        </div>
      </section>

      {/* Affordable Plans Section */}
      <section className="py-12 px-8 text-center bg-black">
        <h2 className="text-3xl font-bold mb-4">Affordable plans for any situation</h2>
        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
          Choose a Premium plan and listen to ad-free music on all your devices.
          Pay in various ways. Cancel anytime.
        </p>
        {/* Payment Methods (example) */}
        <div className="flex justify-center gap-4 mb-8">
          <img
            src="/images/payment/visa.png"
            alt="Visa"
            className="w-12 h-auto"
          />
          <img
            src="/images/payment/mastercard.png"
            alt="MasterCard"
            className="w-12 h-auto"
          />
          <img
            src="/images/payment/paypal.png"
            alt="PayPal"
            className="w-12 h-auto"
          />
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Individual */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="bg-pink-500 text-white px-3 py-1 rounded-full w-fit mb-4">
              Free for 1 month
            </div>
            <h3 className="text-xl font-bold mb-2">Individual</h3>
            <p className="text-sm text-gray-400 mb-2">$11.99 / month after</p>
            <ul className="text-left text-gray-300 text-sm mb-4 space-y-1">
              <li>1 Premium account</li>
              <li>Cancel anytime</li>
              <li>15-hour/month of listening time from our audiobooks</li>
            </ul>
            <button className="bg-white text-black font-semibold w-full py-2 rounded-full hover:bg-gray-200 transition">
              Try free for 1 month
            </button>
            <p className="text-xs text-gray-400 mt-2">
              Free for 1 month, then $11.99/month after.
            </p>
          </div>

          {/* Student */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="bg-pink-500 text-white px-3 py-1 rounded-full w-fit mb-4">
              Free for 1 month
            </div>
            <h3 className="text-xl font-bold mb-2">Student</h3>
            <p className="text-sm text-gray-400 mb-2">$9.99 / month after</p>
            <ul className="text-left text-gray-300 text-sm mb-4 space-y-1">
              <li>1 verified Premium account</li>
              <li>Discount for eligible students</li>
              <li>Same benefits as Individual</li>
            </ul>
            <button className="bg-white text-black font-semibold w-full py-2 rounded-full hover:bg-gray-200 transition">
              Try free for 1 month
            </button>
            <p className="text-xs text-gray-400 mt-2">
              Free for 1 month, then $9.99/month after.
            </p>
          </div>

          {/* Duo */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="bg-pink-500 text-white px-3 py-1 rounded-full w-fit mb-4">
              Free for 1 month
            </div>
            <h3 className="text-xl font-bold mb-2">Duo</h3>
            <p className="text-sm text-gray-400 mb-2">$16.99 / month after</p>
            <ul className="text-left text-gray-300 text-sm mb-4 space-y-1">
              <li>2 Premium accounts</li>
              <li>For couples under one roof</li>
              <li>Plan manager only</li>
            </ul>
            <button className="bg-white text-black font-semibold w-full py-2 rounded-full hover:bg-gray-200 transition">
              Get Premium Duo
            </button>
            <p className="text-xs text-gray-400 mt-2">
              For couples who reside at the same address.
            </p>
          </div>

          {/* Family */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-2">Family</h3>
            <p className="text-sm text-gray-400 mb-2">$18.99 / month</p>
            <ul className="text-left text-gray-300 text-sm mb-4 space-y-1">
              <li>Up to 6 Premium or Kids accounts</li>
              <li>Control content marked as explicit</li>
              <li>Access to Spotify Kids</li>
              <li>Plan manager only</li>
            </ul>
            <button className="bg-white text-black font-semibold w-full py-2 rounded-full hover:bg-gray-200 transition">
              Get Premium Family
            </button>
            <p className="text-xs text-gray-400 mt-2">
              For couples or families who reside at the same address.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="py-12 px-8 bg-black">
        <h2 className="text-3xl font-bold text-center mb-8">Experience the difference</h2>
        <p className="text-center text-gray-400 mb-6">
          Go Premium and enjoy full control of your listening. Cancel anytime.
        </p>
        <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-4 text-sm text-gray-300">What you get</th>
                <th className="p-4 text-sm text-gray-300">Spotify Free</th>
                <th className="p-4 text-sm text-gray-300">Premium</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-600">
                <td className="p-4 text-white">Ad-free music listening</td>
                <td className="p-4 text-center">✖</td>
                <td className="p-4 text-center">✔</td>
              </tr>
              <tr className="border-b border-gray-600">
                <td className="p-4 text-white">Download songs</td>
                <td className="p-4 text-center">✖</td>
                <td className="p-4 text-center">✔</td>
              </tr>
              <tr className="border-b border-gray-600">
                <td className="p-4 text-white">High-quality audio</td>
                <td className="p-4 text-center">✖</td>
                <td className="p-4 text-center">✔</td>
              </tr>
              <tr className="border-b border-gray-600">
                <td className="p-4 text-white">Listen with fewer ads</td>
                <td className="p-4 text-center">✖</td>
                <td className="p-4 text-center">✔</td>
              </tr>
              <tr>
                <td className="p-4 text-white">Organize listening space</td>
                <td className="p-4 text-center">✖</td>
                <td className="p-4 text-center">✔</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-black text-gray-400 py-8 px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <h4 className="text-white font-semibold mb-2">Company</h4>
            <ul className="space-y-1">
              <li><a href="#" className="hover:text-white">About</a></li>
              <li><a href="#" className="hover:text-white">Jobs</a></li>
              <li><a href="#" className="hover:text-white">For the Record</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2">Communities</h4>
            <ul className="space-y-1">
              <li><a href="#" className="hover:text-white">For Artists</a></li>
              <li><a href="#" className="hover:text-white">Developers</a></li>
              <li><a href="#" className="hover:text-white">Advertising</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2">Useful links</h4>
            <ul className="space-y-1">
              <li><a href="#" className="hover:text-white">Support</a></li>
              <li><a href="#" className="hover:text-white">Web Player App</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2">Spotify Plans</h4>
            <ul className="space-y-1">
              <li><a href="#" className="hover:text-white">Premium Individual</a></li>
              <li><a href="#" className="hover:text-white">Premium Student</a></li>
              <li><a href="#" className="hover:text-white">Premium Duo</a></li>
              <li><a href="#" className="hover:text-white">Premium Family</a></li>
              <li><a href="#" className="hover:text-white">Audiobooks Access</a></li>
            </ul>
          </div>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          © 2025 BeatFlow Media. All rights reserved. Various trademarks held by their respective owners.
        </p>
      </footer>
    </div>
  );
}
