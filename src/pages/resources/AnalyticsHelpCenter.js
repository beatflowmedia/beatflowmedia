import React from "react";
import { Link } from "react-router-dom";
import { FiBarChart2, FiPieChart, FiTrendingUp, FiActivity } from "react-icons/fi";

export default function AnalyticsHelpCenter() {
  const metricCategories = [
    {
      icon: <FiBarChart2 className="text-4xl text-bf-green" />,
      title: "Delivery Metrics",
      metrics: [
        {
          name: "Impressions",
          description: "Total number of times your ad was delivered to listeners"
        },
        {
          name: "Reach",
          description: "Unique number of listeners who saw/heard your ad"
        },
        {
          name: "Frequency",
          description: "Average number of times each unique listener was exposed to your ad"
        },
        {
          name: "Completion Rate",
          description: "Percentage of ads that were fully listened to or watched"
        }
      ]
    },
    {
      icon: <FiActivity className="text-4xl text-bf-green" />,
      title: "Engagement Metrics",
      metrics: [
        {
          name: "Click-Through Rate (CTR)",
          description: "Percentage of listeners who clicked on your ad"
        },
        {
          name: "Interaction Rate",
          description: "How often listeners engage with interactive elements"
        },
        {
          name: "Time Engaged",
          description: "Average time listeners spend with your ad content"
        },
        {
          name: "Share Rate",
          description: "How often your ad content is shared"
        }
      ]
    },
    {
      icon: <FiTrendingUp className="text-4xl text-bf-green" />,
      title: "Conversion Metrics",
      metrics: [
        {
          name: "Conversions",
          description: "Number of completed desired actions (purchases, sign-ups, etc.)"
        },
        {
          name: "Conversion Rate",
          description: "Percentage of ad exposures that resulted in a conversion"
        },
        {
          name: "Cost Per Acquisition (CPA)",
          description: "Average cost to acquire one customer through your campaign"
        },
        {
          name: "Return on Ad Spend (ROAS)",
          description: "Revenue generated for every dollar spent on advertising"
        }
      ]
    },
    {
      icon: <FiPieChart className="text-4xl text-bf-green" />,
      title: "Audience Metrics",
      metrics: [
        {
          name: "Demographics",
          description: "Age, gender, and location breakdown of your audience"
        },
        {
          name: "Listening Context",
          description: "When and where listeners engage with your ads"
        },
        {
          name: "Device Type",
          description: "Distribution across mobile, desktop, tablet, and smart speakers"
        },
        {
          name: "Genre Affinity",
          description: "Music and podcast genres your audience prefers"
        }
      ]
    }
  ];

  const reportingGuides = [
    {
      title: "Campaign Dashboard Overview",
      description: "Learn how to navigate your main analytics dashboard and understand key visualizations."
    },
    {
      title: "Custom Report Builder",
      description: "Create tailored reports with the specific metrics and dimensions you need."
    },
    {
      title: "Automated Reporting",
      description: "Set up scheduled email reports to keep stakeholders informed automatically."
    },
    {
      title: "Export & Data Integration",
      description: "Export your data or connect BeatFlow Analytics to your BI tools."
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
          <h1 className="text-5xl font-bold mb-4">Analytics Help Center</h1>
          <p className="text-gray-400 text-lg">
            Master BeatFlow advertising analytics to measure, optimize, and prove the impact of your campaigns.
          </p>
        </div>
      </header>

      {/* Quick Start */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-8">Getting Started with Analytics</h2>
          <div className="bg-gray-800 p-8 rounded-lg mb-8">
            <h3 className="text-2xl font-bold mb-4 text-bf-green">Your Analytics Journey</h3>
            <ol className="space-y-4 text-gray-300">
              <li className="flex items-start">
                <span className="bg-bf-green text-black font-bold rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">1</span>
                <div>
                  <p className="font-semibold text-white">Set up conversion tracking</p>
                  <p className="text-sm">Install the BeatFlow pixel on your website to track post-ad actions</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-bf-green text-black font-bold rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">2</span>
                <div>
                  <p className="font-semibold text-white">Define your KPIs</p>
                  <p className="text-sm">Choose the metrics that matter most for your campaign objectives</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-bf-green text-black font-bold rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">3</span>
                <div>
                  <p className="font-semibold text-white">Monitor in real-time</p>
                  <p className="text-sm">Check your dashboard regularly to spot trends and opportunities</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-bf-green text-black font-bold rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">4</span>
                <div>
                  <p className="font-semibold text-white">Optimize and iterate</p>
                  <p className="text-sm">Use insights to refine targeting, creative, and budget allocation</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Metrics Breakdown */}
      <section className="py-16 px-6 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Understanding Your Metrics</h2>
          <div className="space-y-8">
            {metricCategories.map((category, idx) => (
              <div key={idx} className="bg-gray-900 p-8 rounded-lg">
                <div className="flex items-center mb-6">
                  {category.icon}
                  <h3 className="text-2xl font-bold ml-4">{category.title}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {category.metrics.map((metric, metricIdx) => (
                    <div key={metricIdx} className="bg-gray-800 p-4 rounded">
                      <h4 className="font-semibold text-bf-green mb-2">{metric.name}</h4>
                      <p className="text-gray-400 text-sm">{metric.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reporting Guides */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-8">Reporting & Visualization</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportingGuides.map((guide, idx) => (
              <div key={idx} className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-3">{guide.title}</h3>
                <p className="text-gray-400 mb-4">{guide.description}</p>
                <a href="/#" className="text-bf-green hover:underline">Read guide →</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Topics */}
      <section className="py-16 px-6 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-8">Advanced Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3 text-bf-green">Attribution Modeling</h3>
              <p className="text-gray-400 mb-4">
                Understand which touchpoints drive conversions with multi-touch attribution.
              </p>
              <a href="/#" className="text-bf-green hover:underline">Learn more →</a>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3 text-bf-green">A/B Testing</h3>
              <p className="text-gray-400 mb-4">
                Run controlled experiments to optimize creative and targeting.
              </p>
              <a href="/#" className="text-bf-green hover:underline">Learn more →</a>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3 text-bf-green">Brand Lift Studies</h3>
              <p className="text-gray-400 mb-4">
                Measure the impact of your campaigns on brand awareness and perception.
              </p>
              <a href="/#" className="text-bf-green hover:underline">Learn more →</a>
            </div>
          </div>
        </div>
      </section>

      {/* Video Tutorials */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-center">Video Tutorials</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="bg-gray-700 h-48 flex items-center justify-center">
                <FiBarChart2 className="text-6xl text-gray-600" />
              </div>
              <div className="p-6">
                <h3 className="font-bold mb-2">Analytics Dashboard Tour</h3>
                <p className="text-gray-400 text-sm mb-4">5:32</p>
                <button className="text-bf-green hover:underline">Watch →</button>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="bg-gray-700 h-48 flex items-center justify-center">
                <FiPieChart className="text-6xl text-gray-600" />
              </div>
              <div className="p-6">
                <h3 className="font-bold mb-2">Setting Up Conversion Tracking</h3>
                <p className="text-gray-400 text-sm mb-4">8:15</p>
                <button className="text-bf-green hover:underline">Watch →</button>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="bg-gray-700 h-48 flex items-center justify-center">
                <FiTrendingUp className="text-6xl text-gray-600" />
              </div>
              <div className="p-6">
                <h3 className="font-bold mb-2">Optimizing with Data</h3>
                <p className="text-gray-400 text-sm mb-4">6:47</p>
                <button className="text-bf-green hover:underline">Watch →</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
          <p className="text-gray-400 mb-8">
            Our analytics support team is here to help you get the most out of your data.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/resources/help-center">
              <button className="bg-bf-green text-black px-8 py-3 rounded-full font-semibold hover:bg-green-400 transition">
                Contact Support
              </button>
            </Link>
            <Link to="/resources/partners">
              <button className="border border-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-black transition">
                View Partner Tools
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
