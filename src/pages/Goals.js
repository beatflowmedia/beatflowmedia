import React from "react";
import { Link } from "react-router-dom";
import { FiTrendingUp, FiShoppingCart, FiEye, FiSmartphone, FiUsers, FiActivity } from "react-icons/fi";

export default function Goals() {
  const objectives = [
    {
      icon: <FiEye className="text-5xl text-bf-green mb-4" />,
      title: "Brand Awareness",
      description: "Reach new audiences and make your brand memorable with high-impact audio and video ads.",
      metrics: ["Reach", "Impressions", "Brand Lift", "Ad Recall"],
      bestFormats: ["Audio Ads", "Video Ads", "Display Ads"],
      caseStudy: {
        brand: "Urban Apparel Co.",
        result: "85% increase in brand recall among 18-34 year olds"
      }
    },
    {
      icon: <FiActivity className="text-5xl text-bf-green mb-4" />,
      title: "Consideration",
      description: "Drive engagement with your brand and encourage deeper exploration of your products or services.",
      metrics: ["Click-Through Rate", "Engagement Rate", "Video Completion Rate", "Time Spent"],
      bestFormats: ["Video Ads", "Podcast Ads", "Interactive Display"],
      caseStudy: {
        brand: "TechGadget Plus",
        result: "3.2x higher engagement vs. industry benchmark"
      }
    },
    {
      icon: <FiShoppingCart className="text-5xl text-bf-green mb-4" />,
      title: "Conversions",
      description: "Drive purchases, sign-ups, and other valuable actions with targeted, conversion-focused campaigns.",
      metrics: ["Conversions", "Conversion Rate", "ROAS", "CPA"],
      bestFormats: ["Audio Ads with CTA", "Video Ads", "Retargeting Display"],
      caseStudy: {
        brand: "FreshMeal Delivery",
        result: "450% ROAS with audio ads during dinner hours"
      }
    },
    {
      icon: <FiSmartphone className="text-5xl text-bf-green mb-4" />,
      title: "App Installs",
      description: "Get your app in front of millions of mobile users and drive high-quality installs.",
      metrics: ["App Installs", "Install Rate", "Cost Per Install", "Post-Install Actions"],
      bestFormats: ["Mobile Video Ads", "Audio Ads", "App Install Display"],
      caseStudy: {
        brand: "FitTrack Fitness",
        result: "340% increase in app downloads, $1.20 CPI"
      }
    },
    {
      icon: <FiTrendingUp className="text-5xl text-bf-green mb-4" />,
      title: "Website Traffic",
      description: "Drive qualified visitors to your website or landing pages with compelling calls-to-action.",
      metrics: ["Clicks", "CTR", "Landing Page Views", "Cost Per Click"],
      bestFormats: ["Audio Ads", "Display Ads", "Video Ads"],
      caseStudy: {
        brand: "HomeStyle Furniture",
        result: "2,500+ daily website visits from BeatFlow ads"
      }
    },
    {
      icon: <FiUsers className="text-5xl text-bf-green mb-4" />,
      title: "Audience Growth",
      description: "Build your email list, social following, or customer database with targeted lead generation.",
      metrics: ["Leads Generated", "Cost Per Lead", "Lead Quality Score", "Conversion to Customer"],
      bestFormats: ["Podcast Ads", "Video Ads", "Lead Gen Display"],
      caseStudy: {
        brand: "Learning Hub Online",
        result: "10,000 qualified leads at $3.50 CPL"
      }
    }
  ];

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <header className="bg-gray-800 py-6 px-6">
        <div className="max-w-6xl mx-auto">
          <Link to="/advertising" className="text-bf-green hover:underline mb-4 inline-block">
            ê Back to Advertising
          </Link>
          <h1 className="text-5xl font-bold mb-4">Achieve Your Marketing Goals</h1>
          <p className="text-gray-400 text-lg">
            Whether you're building awareness, driving conversions, or growing your audience, BeatFlow has the right solution.
          </p>
        </div>
      </header>

      {/* Goals Grid */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Choose Your Objective</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {objectives.map((obj, idx) => (
              <div key={idx} className="bg-gray-800 p-8 rounded-lg">
                <div className="flex justify-center">{obj.icon}</div>
                <h3 className="text-2xl font-bold mb-4 text-center">{obj.title}</h3>
                <p className="text-gray-400 mb-6">{obj.description}</p>

                <div className="mb-6">
                  <h4 className="font-semibold mb-2 text-bf-green">Key Metrics</h4>
                  <div className="flex flex-wrap gap-2">
                    {obj.metrics.map((metric, mIdx) => (
                      <span key={mIdx} className="bg-gray-700 px-3 py-1 rounded-full text-sm">
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold mb-2 text-bf-green">Recommended Formats</h4>
                  <ul className="space-y-1">
                    {obj.bestFormats.map((format, fIdx) => (
                      <li key={fIdx} className="text-gray-400 text-sm">" {format}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-700 p-4 rounded mb-6">
                  <h4 className="font-semibold mb-1 text-sm">Success Story</h4>
                  <p className="text-sm text-gray-400 mb-1">{obj.caseStudy.brand}</p>
                  <p className="text-bf-green text-sm font-semibold">{obj.caseStudy.result}</p>
                </div>

                <Link to="/ad-signup">
                  <button className="w-full bg-bf-green text-black px-6 py-3 rounded-full font-semibold hover:bg-green-400 transition">
                    Get Started with {obj.title}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategy Guide */}
      <section className="py-16 px-6 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-center">Multi-Goal Strategies</h2>
          <p className="text-gray-400 text-center mb-12 max-w-3xl mx-auto">
            Many successful advertisers run campaigns with multiple objectives. Here are proven combinations:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3 text-bf-green">Full Funnel Approach</h3>
              <p className="text-gray-400 mb-4">
                Start with brand awareness, retarget engaged users for consideration, then conversion campaigns.
              </p>
              <p className="text-sm text-gray-500">Best for: E-commerce, SaaS products</p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3 text-bf-green">Growth + Conversion</h3>
              <p className="text-gray-400 mb-4">
                Combine audience growth campaigns with conversion optimization to build a sustainable pipeline.
              </p>
              <p className="text-sm text-gray-500">Best for: B2B, Education, Subscription services</p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3 text-bf-green">App Ecosystem</h3>
              <p className="text-gray-400 mb-4">
                Drive app installs, then re-engage users with in-app actions and retention campaigns.
              </p>
              <p className="text-sm text-gray-500">Best for: Mobile apps, Games, Utilities</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Achieve Your Goals?</h2>
          <p className="text-gray-400 mb-8">
            Let our advertising experts help you create a strategy tailored to your objectives.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/ad-signup">
              <button className="bg-bf-green text-black px-8 py-3 rounded-full font-semibold hover:bg-green-400 transition">
                Start a Campaign
              </button>
            </Link>
            <Link to="/get-started">
              <button className="border border-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-black transition">
                Learn How It Works
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
