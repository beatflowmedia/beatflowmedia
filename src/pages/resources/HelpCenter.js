import React from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiBook, FiMessageCircle, FiMail } from "react-icons/fi";

export default function HelpCenter() {
  const helpCategories = [
    {
      title: "Getting Started",
      icon: <FiBook className="text-4xl text-bf-green" />,
      topics: [
        "How to create your first ad campaign",
        "Setting up your advertiser account",
        "Understanding BeatFlow Ads Manager",
        "Payment methods and billing",
      ],
    },
    {
      title: "Campaign Management",
      icon: <FiMessageCircle className="text-4xl text-bf-green" />,
      topics: [
        "Targeting your audience",
        "Setting campaign budgets and bids",
        "Scheduling your campaigns",
        "Pausing and resuming campaigns",
      ],
    },
    {
      title: "Ad Creative",
      icon: <FiMail className="text-4xl text-bf-green" />,
      topics: [
        "Ad format specifications",
        "Creative best practices",
        "Uploading audio and video assets",
        "A/B testing your creative",
      ],
    },
    {
      title: "Reporting & Analytics",
      icon: <FiSearch className="text-4xl text-bf-green" />,
      topics: [
        "Understanding your campaign metrics",
        "Exporting reports",
        "Conversion tracking",
        "Attribution windows",
      ],
    },
  ];

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <header className="bg-gray-800 py-6 px-6">
        <div className="max-w-6xl mx-auto">
          <Link to="/advertising" className="text-bf-green hover:underline mb-4 inline-block">
            ← Back to Advertising
          </Link>
          <h1 className="text-5xl font-bold mb-4">BeatFlow Advertising Help Center</h1>
          <p className="text-gray-400 text-lg">
            Find answers to your advertising questions and learn how to get the most out of your campaigns.
          </p>
        </div>
      </header>

      {/* Search Bar */}
      <section className="py-12 px-6 bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search for help articles..."
              className="w-full bg-gray-700 text-white pl-12 pr-4 py-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-bf-green"
            />
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {helpCategories.map((category, idx) => (
              <div key={idx} className="bg-gray-800 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  {category.icon}
                  <h3 className="text-2xl font-semibold ml-4">{category.title}</h3>
                </div>
                <ul className="space-y-2">
                  {category.topics.map((topic, topicIdx) => (
                    <li key={topicIdx}>
                      <a href="/#" className="text-gray-400 hover:text-bf-green transition">
                        {topic}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 px-6 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Popular Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/resources/ad-specs" className="bg-gray-700 p-6 rounded-lg hover:bg-gray-600 transition">
              <h3 className="text-xl font-semibold mb-2">Ad Specifications</h3>
              <p className="text-gray-400">Technical requirements for all ad formats</p>
            </Link>
            <Link to="/resources/creative-best-practices" className="bg-gray-700 p-6 rounded-lg hover:bg-gray-600 transition">
              <h3 className="text-xl font-semibold mb-2">Creative Best Practices</h3>
              <p className="text-gray-400">Tips for creating effective ads</p>
            </Link>
            <Link to="/resources/analytics-help-center" className="bg-gray-700 p-6 rounded-lg hover:bg-gray-600 transition">
              <h3 className="text-xl font-semibold mb-2">Analytics Help</h3>
              <p className="text-gray-400">Learn how to read your campaign data</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Still need help?</h2>
          <p className="text-gray-400 mb-8">
            Our support team is here to help you succeed with your advertising campaigns.
          </p>
          <Link to="/contact">
            <button className="bg-bf-green text-black px-8 py-3 rounded-full font-semibold hover:bg-green-400 transition">
              Contact Support
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
