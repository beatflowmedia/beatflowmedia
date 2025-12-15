import React from "react";
import { Link } from "react-router-dom";
import { FiPlay, FiTarget, FiDollarSign, FiTrendingUp } from "react-icons/fi";

export default function GetStarted() {
  const steps = [
    {
      number: 1,
      title: "Define Your Objective",
      description: "Choose what you want to achieve: brand awareness, conversions, app installs, or website traffic.",
      icon: <FiTarget className="text-5xl text-bf-green" />
    },
    {
      number: 2,
      title: "Set Your Budget",
      description: "Start with as little as $250. Set daily or lifetime budgets that work for your business.",
      icon: <FiDollarSign className="text-5xl text-bf-green" />
    },
    {
      number: 3,
      title: "Target Your Audience",
      description: "Reach listeners by age, gender, location, listening habits, and musical preferences.",
      icon: <FiTarget className="text-5xl text-bf-green" />
    },
    {
      number: 4,
      title: "Upload Your Creative",
      description: "Add your audio, video, or display ads. Our team can help if you need creative support.",
      icon: <FiPlay className="text-5xl text-bf-green" />
    },
    {
      number: 5,
      title: "Launch & Optimize",
      description: "Your campaign goes live within 24-48 hours. Monitor performance and optimize in real-time.",
      icon: <FiTrendingUp className="text-5xl text-bf-green" />
    }
  ];

  const quickTips = [
    {
      title: "Start Small, Scale Up",
      tip: "Begin with a modest budget to test different audiences and creative. Once you find what works, scale your investment."
    },
    {
      title: "Test Multiple Creatives",
      tip: "Run A/B tests with different ad variations. Even small changes in messaging can significantly impact performance."
    },
    {
      title: "Leverage Analytics",
      tip: "Check your campaign dashboard daily. Use insights to refine targeting and optimize underperforming campaigns."
    },
    {
      title: "Match Content to Context",
      tip: "Tailor your message to match when and where listeners hear your ad. Morning commuters respond differently than evening relaxers."
    }
  ];

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-br from-bf-green to-green-700 py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <Link to="/advertising" className="text-black hover:underline mb-4 inline-block">
            ê Back to Advertising
          </Link>
          <h1 className="text-6xl font-bold mb-4 text-black">Get Started with BeatFlow Ads</h1>
          <p className="text-black text-xl max-w-3xl mx-auto">
            Launch your first campaign in 5 simple steps and start reaching millions of engaged listeners.
          </p>
        </div>
      </header>

      {/* Steps */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Your Path to Success</h2>
          <div className="space-y-8">
            {steps.map((step, idx) => (
              <div key={idx} className="bg-gray-800 p-8 rounded-lg flex items-start gap-6">
                <div className="flex-shrink-0">
                  {step.icon}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center mb-3">
                    <span className="bg-bf-green text-black font-bold rounded-full w-10 h-10 flex items-center justify-center mr-4">
                      {step.number}
                    </span>
                    <h3 className="text-2xl font-bold">{step.title}</h3>
                  </div>
                  <p className="text-gray-400 text-lg">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Tips */}
      <section className="py-16 px-6 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Pro Tips for First-Time Advertisers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickTips.map((item, idx) => (
              <div key={idx} className="bg-gray-900 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-3 text-bf-green">{item.title}</h3>
                <p className="text-gray-400">{item.tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Helpful Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link to="/resources/ad-specs" className="bg-gray-800 p-8 rounded-lg hover:bg-gray-700 transition text-center">
              <h3 className="text-xl font-bold mb-3">Ad Specifications</h3>
              <p className="text-gray-400">Technical requirements for all ad formats</p>
            </Link>
            <Link to="/resources/creative-best-practices" className="bg-gray-800 p-8 rounded-lg hover:bg-gray-700 transition text-center">
              <h3 className="text-xl font-bold mb-3">Creative Best Practices</h3>
              <p className="text-gray-400">Learn how to create ads that convert</p>
            </Link>
            <Link to="/resources/help-center" className="bg-gray-800 p-8 rounded-lg hover:bg-gray-700 transition text-center">
              <h3 className="text-xl font-bold mb-3">Help Center</h3>
              <p className="text-gray-400">Find answers to common questions</p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Launch Your First Campaign?</h2>
          <p className="text-gray-400 mb-8 text-lg">
            Join thousands of brands reaching millions of listeners on BeatFlow.
          </p>
          <Link to="/ad-signup">
            <button className="bg-bf-green text-black px-10 py-4 rounded-full font-semibold text-lg hover:bg-green-400 transition">
              Create Your Ad
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
