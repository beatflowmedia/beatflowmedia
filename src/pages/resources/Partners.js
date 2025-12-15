import React from "react";
import { Link } from "react-router-dom";
import { FiUsers, FiTrendingUp, FiAward, FiTarget } from "react-icons/fi";

export default function Partners() {
  const partnerCategories = [
    {
      title: "Measurement & Analytics Partners",
      icon: <FiTrendingUp className="text-4xl text-bf-green" />,
      description: "Verify campaign performance with industry-leading measurement providers",
      partners: [
        "Nielsen Digital Ad Ratings",
        "Moat by Oracle",
        "Integral Ad Science (IAS)",
        "DoubleVerify",
        "Comscore"
      ]
    },
    {
      title: "Creative Partners",
      icon: <FiAward className="text-4xl text-bf-green" />,
      description: "Work with vetted creative agencies specializing in audio and video advertising",
      partners: [
        "SoundWave Studios",
        "AudioBrand Collective",
        "Sonic Creative Group",
        "VoiceFirst Productions",
        "PodCraft Agency"
      ]
    },
    {
      title: "Attribution & Data Partners",
      icon: <FiTarget className="text-4xl text-bf-green" />,
      description: "Connect your campaigns to real-world outcomes with advanced attribution",
      partners: [
        "Neustar MarketShare",
        "AppsFlyer",
        "Adjust",
        "Branch",
        "Kochava"
      ]
    },
    {
      title: "DSP & Programmatic Partners",
      icon: <FiUsers className="text-4xl text-bf-green" />,
      description: "Access BeatFlow inventory through your preferred demand-side platform",
      partners: [
        "The Trade Desk",
        "Google Display & Video 360",
        "Amazon DSP",
        "Verizon Media DSP",
        "Adobe Advertising Cloud"
      ]
    }
  ];

  const benefits = [
    {
      title: "Trusted Measurement",
      description: "All measurement partners are certified to ensure accurate, unbiased campaign reporting."
    },
    {
      title: "Seamless Integration",
      description: "Our partners integrate directly with BeatFlow Ads Manager for streamlined workflows."
    },
    {
      title: "Expert Support",
      description: "Access dedicated support from both BeatFlow and our partner network."
    },
    {
      title: "Best-in-Class Tools",
      description: "Leverage industry-leading technology to optimize your advertising performance."
    }
  ];

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <header className="bg-gray-800 py-6 px-6">
        <div className="max-w-6xl mx-auto">
          <Link to="/advertising" className="text-bf-green hover:underline mb-4 inline-block">
            ← Back to Advertising
          </Link>
          <h1 className="text-5xl font-bold mb-4">BeatFlow Advertising Partners</h1>
          <p className="text-gray-400 text-lg">
            Enhance your advertising with our ecosystem of trusted measurement, creative, and technology partners.
          </p>
        </div>
      </header>

      {/* Why Partner */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Why Work with BeatFlow Partners</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="bg-gray-800 p-6 rounded-lg text-center">
                <h3 className="text-xl font-bold mb-3 text-bf-green">{benefit.title}</h3>
                <p className="text-gray-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Categories */}
      <section className="py-16 px-6 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Our Partner Ecosystem</h2>
          <div className="space-y-12">
            {partnerCategories.map((category, idx) => (
              <div key={idx} className="bg-gray-900 p-8 rounded-lg">
                <div className="flex items-center mb-6">
                  {category.icon}
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold">{category.title}</h3>
                    <p className="text-gray-400">{category.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.partners.map((partner, partnerIdx) => (
                    <div key={partnerIdx} className="bg-gray-800 p-4 rounded text-center font-semibold">
                      {partner}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Become a Partner */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-bf-green to-green-700 p-12 rounded-lg text-center">
            <h2 className="text-4xl font-bold mb-4 text-black">Interested in Becoming a Partner?</h2>
            <p className="text-black text-lg mb-8 max-w-2xl mx-auto">
              Join our partner ecosystem and help brands succeed on BeatFlow. We're always looking for innovative technology and creative partners.
            </p>
            <button className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition">
              Apply to Partner Program
            </button>
          </div>
        </div>
      </section>

      {/* Partner Resources */}
      <section className="py-16 px-6 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-center">Partner Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3">API Documentation</h3>
              <p className="text-gray-400 mb-4">
                Access our comprehensive API docs for seamless integration.
              </p>
              <a href="#" className="text-bf-green hover:underline">View docs →</a>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3">Certification Program</h3>
              <p className="text-gray-400 mb-4">
                Get certified as a BeatFlow Advertising expert.
              </p>
              <a href="#" className="text-bf-green hover:underline">Learn more →</a>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3">Partner Portal</h3>
              <p className="text-gray-400 mb-4">
                Access tools, support, and co-marketing resources.
              </p>
              <a href="#" className="text-bf-green hover:underline">Login →</a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-400 mb-8">
            Work with our partners to maximize your advertising ROI on BeatFlow.
          </p>
          <Link to="/ad-signup">
            <button className="bg-bf-green text-black px-8 py-3 rounded-full font-semibold hover:bg-green-400 transition">
              Create Your First Campaign
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
