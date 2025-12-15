import React from "react";
import { Link } from "react-router-dom";
import { FiTrendingUp, FiUsers, FiTarget, FiAward } from "react-icons/fi";

export default function Wrapped2024() {
  const stats = [
    {
      icon: <FiUsers className="text-5xl text-bf-green" />,
      value: "500M+",
      label: "Active Listeners Reached",
      description: "Advertisers connected with over 500 million engaged listeners worldwide"
    },
    {
      icon: <FiTrendingUp className="text-5xl text-bf-green" />,
      value: "85%",
      label: "Ad Recall Rate",
      description: "BeatFlow ads are remembered 85% more than traditional digital advertising"
    },
    {
      icon: <FiTarget className="text-5xl text-bf-green" />,
      value: "2.5x",
      label: "Better Engagement",
      description: "BeatFlow audio ads achieve 2.5x higher engagement than industry average"
    },
    {
      icon: <FiAward className="text-5xl text-bf-green" />,
      value: "10K+",
      label: "Successful Campaigns",
      description: "Over 10,000 brands ran successful campaigns on BeatFlow in 2024"
    }
  ];

  const topCategories = [
    { category: "Technology & Electronics", growth: "+125%" },
    { category: "Food & Beverage", growth: "+98%" },
    { category: "Fashion & Retail", growth: "+87%" },
    { category: "Automotive", growth: "+76%" },
    { category: "Entertainment & Media", growth: "+65%" },
  ];

  const insights = [
    {
      title: "Morning Commute = Peak Engagement",
      description: "Ads served between 7-9 AM saw 40% higher completion rates as listeners tuned in during their commute."
    },
    {
      title: "Podcast Ads Drive Action",
      description: "92% of listeners took action after hearing a podcast ad, with 68% making a purchase within 24 hours."
    },
    {
      title: "Audio-First Creative Wins",
      description: "Campaigns designed specifically for audio (vs. repurposed TV spots) performed 3x better."
    },
    {
      title: "Gen Z Leads Engagement",
      description: "18-24 year olds showed the highest ad engagement rates, with 78% reporting they discovered new brands through BeatFlow."
    }
  ];

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-br from-bf-green to-green-700 py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <Link to="/advertising" className="text-black hover:underline mb-4 inline-block">
            ← Back to Advertising
          </Link>
          <h1 className="text-6xl font-bold mb-4 text-black">BeatFlow Wrapped for Advertisers 2024</h1>
          <p className="text-black text-xl max-w-3xl mx-auto">
            Your year in advertising on BeatFlow. See how brands connected with millions of engaged listeners.
          </p>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">2024 by the Numbers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-gray-800 p-8 rounded-lg text-center">
                <div className="flex justify-center mb-4">{stat.icon}</div>
                <h3 className="text-5xl font-bold text-bf-green mb-2">{stat.value}</h3>
                <p className="text-xl font-semibold mb-2">{stat.label}</p>
                <p className="text-gray-400">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Categories */}
      <section className="py-16 px-6 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-8">Fastest Growing Ad Categories</h2>
          <p className="text-gray-400 mb-8">These industries saw the highest year-over-year growth in advertising spend on BeatFlow.</p>
          <div className="space-y-4">
            {topCategories.map((item, idx) => (
              <div key={idx} className="bg-gray-900 p-6 rounded-lg flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-bf-green mr-6">{idx + 1}</span>
                  <span className="text-xl font-semibold">{item.category}</span>
                </div>
                <span className="text-2xl font-bold text-green-400">{item.growth}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Insights */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Top Insights from 2024</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {insights.map((insight, idx) => (
              <div key={idx} className="bg-gray-800 p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-4 text-bf-green">{insight.title}</h3>
                <p className="text-gray-300">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories Preview */}
      <section className="py-16 px-6 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-center">Success Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-2">TechStart Inc.</h3>
              <p className="text-gray-400 mb-4">Increased app downloads by 340% with targeted audio ads during peak commute hours.</p>
              <a href="#" className="text-bf-green hover:underline">Read case study →</a>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-2">FreshBite Foods</h3>
              <p className="text-gray-400 mb-4">Achieved 92% brand recall with podcast sponsorships in the food & lifestyle category.</p>
              <a href="#" className="text-bf-green hover:underline">Read case study →</a>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-2">Urban Threads</h3>
              <p className="text-gray-400 mb-4">Drove 250% ROI with video ads targeting Gen Z fashion enthusiasts.</p>
              <a href="#" className="text-bf-green hover:underline">Read case study →</a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to make 2025 your best year yet?</h2>
          <p className="text-gray-400 mb-8 text-lg">
            Join thousands of brands reaching millions of engaged listeners on BeatFlow.
          </p>
          <Link to="/ad-signup">
            <button className="bg-bf-green text-black px-10 py-4 rounded-full font-semibold text-lg hover:bg-green-400 transition">
              Start Your Campaign
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
