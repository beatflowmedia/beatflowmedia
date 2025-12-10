import React from "react";
import Footer from "../components/Footer";

export default function Vendors() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Vendor Partnerships</h1>
          <p className="text-xl text-gray-400 mb-12">
            Partner with BeatFlow Media to deliver exceptional experiences
          </p>

          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 mb-12">
            <h2 className="text-3xl font-bold mb-4">Become a BeatFlow Media Vendor</h2>
            <p className="text-lg mb-6">
              Join our network of trusted partners providing services and solutions to millions of BeatFlow Media users worldwide.
            </p>
            <button className="bg-white text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
              Apply Now
            </button>
          </div>

          {/* Partnership Categories */}
          <h2 className="text-3xl font-bold mb-6">Partnership Opportunities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-4xl mb-4">🎧</div>
              <h3 className="text-xl font-bold mb-3">Hardware Partners</h3>
              <p className="text-gray-400 mb-4">
                Integrate BeatFlow Media into your audio devices, smart speakers, and headphones.
              </p>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>• BeatFlow Connect integration</li>
                <li>• Certification program</li>
                <li>• Co-marketing opportunities</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-4xl mb-4">🚗</div>
              <h3 className="text-xl font-bold mb-3">Automotive Partners</h3>
              <p className="text-gray-400 mb-4">
                Bring BeatFlow Media to car infotainment systems and connected vehicles.
              </p>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>• In-car entertainment</li>
                <li>• Voice control integration</li>
                <li>• Premium audio experiences</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-bold mb-3">Mobile Carriers</h3>
              <p className="text-gray-400 mb-4">
                Offer BeatFlow Media Premium as part of your mobile plans and bundles.
              </p>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>• Bundled subscriptions</li>
                <li>• Promotional campaigns</li>
                <li>• Custom integrations</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-4xl mb-4">🏪</div>
              <h3 className="text-xl font-bold mb-3">Retail Partners</h3>
              <p className="text-gray-400 mb-4">
                Distribute BeatFlow Media gift cards and promotional materials in your stores.
              </p>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>• Gift card distribution</li>
                <li>• Point-of-sale marketing</li>
                <li>• Exclusive promotions</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-4xl mb-4">💼</div>
              <h3 className="text-xl font-bold mb-3">Business Solutions</h3>
              <p className="text-gray-400 mb-4">
                Provide BeatFlow Media for Business to commercial venues and enterprises.
              </p>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>• Commercial licensing</li>
                <li>• Playlist curation services</li>
                <li>• Volume pricing</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-4xl mb-4">🛠️</div>
              <h3 className="text-xl font-bold mb-3">Technology Partners</h3>
              <p className="text-gray-400 mb-4">
                Build platforms, tools, and services that enhance the BeatFlow Media ecosystem.
              </p>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>• API integrations</li>
                <li>• Analytics platforms</li>
                <li>• Marketing tools</li>
              </ul>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gray-800 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6">Partner Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Global Reach</h3>
                <p className="text-gray-400">
                  Access to millions of BeatFlow Media users across 180+ markets worldwide.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Marketing Support</h3>
                <p className="text-gray-400">
                  Co-marketing opportunities and promotional campaigns to drive engagement.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Technical Support</h3>
                <p className="text-gray-400">
                  Dedicated technical resources and integration support from our team.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Revenue Opportunities</h3>
                <p className="text-gray-400">
                  Flexible business models including revenue sharing and referral programs.
                </p>
              </div>
            </div>
          </div>

          {/* Application Process */}
          <h2 className="text-3xl font-bold mb-6">Application Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
              { step: "1", title: "Apply", description: "Submit your vendor application online" },
              { step: "2", title: "Review", description: "Our team evaluates your proposal" },
              { step: "3", title: "Negotiate", description: "Discuss terms and partnership details" },
              { step: "4", title: "Launch", description: "Go live with your integration" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center bg-gray-800 rounded-lg p-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Partner with BeatFlow Media?</h2>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              Join our ecosystem of innovative partners delivering exceptional music experiences to millions of users.
            </p>
            <div className="flex gap-4 justify-center">
              <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-semibold transition-colors">
                Submit Application
              </button>
              <button className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-full font-semibold transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
