import React from "react";
import { Link } from "react-router-dom";
import { FiMusic, FiVideo, FiImage, FiHeadphones } from "react-icons/fi";

export default function AdFormats() {
  const formats = [
    {
      icon: <FiMusic className="text-6xl text-bf-green mb-4" />,
      title: "Audio Ads",
      duration: "15s or 30s",
      description: "Reach listeners between songs with high-impact audio messages. Perfect for brand awareness and direct response campaigns.",
      features: [
        "Plays between songs on mobile, desktop, and connected devices",
        "100% share of voice - no competing messages",
        "Supports companion display ads for visual reinforcement",
        "Ideal for driving website visits, app installs, or purchases"
      ],
      bestFor: "Brand awareness, direct response, local businesses",
      pricing: "Starting at $0.015 CPM"
    },
    {
      icon: <FiVideo className="text-6xl text-bf-green mb-4" />,
      title: "Video Ads",
      duration: "15s or 30s",
      description: "Capture attention with full-screen video ads delivered when listeners are actively engaged with the app.",
      features: [
        "Full-screen, high-impact video placement",
        "Shown only when user is in-app and active",
        "Supports clickable CTAs and interactive elements",
        "Perfect for storytelling and product demonstrations"
      ],
      bestFor: "Product launches, storytelling, high-engagement campaigns",
      pricing: "Starting at $0.025 CPM"
    },
    {
      icon: <FiImage className="text-6xl text-bf-green mb-4" />,
      title: "Display Ads",
      duration: "30 seconds",
      description: "Static or animated visual ads that appear within the BeatFlow experience across all devices.",
      features: [
        "Homepage takeovers and sponsored playlists",
        "Billboard placements in high-traffic areas",
        "Clickable with full tracking support",
        "Works alongside audio for reinforced messaging"
      ],
      bestFor: "Brand visibility, playlist sponsorships, retargeting",
      pricing: "Starting at $0.010 CPM"
    },
    {
      icon: <FiHeadphones className="text-6xl text-bf-green mb-4" />,
      title: "Podcast Ads",
      duration: "30s, 60s, or 90s",
      description: "Reach highly engaged podcast listeners with host-read or produced ads in premium podcast content.",
      features: [
        "Pre-roll, mid-roll, or post-roll placements",
        "Host-read options for authentic delivery",
        "Target by podcast genre, show, or topic",
        "Highest engagement and brand recall rates"
      ],
      bestFor: "Brand storytelling, thought leadership, niche targeting",
      pricing: "Starting at $0.020 CPM"
    }
  ];

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <header className="bg-gray-800 py-6 px-6">
        <div className="max-w-6xl mx-auto">
          <Link to="/advertising" className="text-bf-green hover:underline mb-4 inline-block">
            � Back to Advertising
          </Link>
          <h1 className="text-5xl font-bold mb-4">BeatFlow Ad Formats</h1>
          <p className="text-gray-400 text-lg">
            Choose the right format to reach your audience and achieve your campaign objectives.
          </p>
        </div>
      </header>

      {/* Formats Grid */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          {formats.map((format, idx) => (
            <div key={idx} className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-8">
                <div className="flex items-start gap-6 mb-6">
                  <div className="flex-shrink-0">{format.icon}</div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-3xl font-bold">{format.title}</h2>
                      <span className="bg-bf-green text-black px-4 py-2 rounded-full font-semibold text-sm">
                        {format.duration}
                      </span>
                    </div>
                    <p className="text-gray-400 text-lg mb-6">{format.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h3 className="font-bold mb-3 text-bf-green">Key Features</h3>
                        <ul className="space-y-2">
                          {format.features.map((feature, featureIdx) => (
                            <li key={featureIdx} className="flex items-start text-gray-300">
                              <span className="text-bf-green mr-2">"</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-bold mb-3 text-bf-green">Best For</h3>
                        <p className="text-gray-300 mb-4">{format.bestFor}</p>
                        <h3 className="font-bold mb-2 text-bf-green">Pricing</h3>
                        <p className="text-gray-300">{format.pricing}</p>
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <Link to="/ad-signup">
                        <button className="bg-bf-green text-black px-6 py-3 rounded-full font-semibold hover:bg-green-400 transition">
                          Get Started
                        </button>
                      </Link>
                      <Link to="/resources/ad-specs">
                        <button className="border border-white px-6 py-3 rounded-full font-semibold hover:bg-white hover:text-black transition">
                          View Specs
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-6 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-center">Format Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-gray-900 rounded-lg overflow-hidden">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-4 text-left">Format</th>
                  <th className="p-4 text-left">Best Use Case</th>
                  <th className="p-4 text-left">Engagement</th>
                  <th className="p-4 text-left">Completion Rate</th>
                  <th className="p-4 text-left">Starting CPM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <tr>
                  <td className="p-4 font-semibold">Audio Ads</td>
                  <td className="p-4 text-gray-400">Direct response, brand awareness</td>
                  <td className="p-4 text-gray-400">High</td>
                  <td className="p-4 text-gray-400">~95%</td>
                  <td className="p-4 text-gray-400">$0.015</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold">Video Ads</td>
                  <td className="p-4 text-gray-400">Product demos, storytelling</td>
                  <td className="p-4 text-gray-400">Very High</td>
                  <td className="p-4 text-gray-400">~90%</td>
                  <td className="p-4 text-gray-400">$0.025</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold">Display Ads</td>
                  <td className="p-4 text-gray-400">Brand visibility, retargeting</td>
                  <td className="p-4 text-gray-400">Medium</td>
                  <td className="p-4 text-gray-400">~85%</td>
                  <td className="p-4 text-gray-400">$0.010</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold">Podcast Ads</td>
                  <td className="p-4 text-gray-400">Thought leadership, niche targeting</td>
                  <td className="p-4 text-gray-400">Very High</td>
                  <td className="p-4 text-gray-400">~92%</td>
                  <td className="p-4 text-gray-400">$0.020</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Not sure which format is right for you?</h2>
          <p className="text-gray-400 mb-8">
            Our team can help you choose the best ad formats for your campaign objectives.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/ad-signup">
              <button className="bg-bf-green text-black px-8 py-3 rounded-full font-semibold hover:bg-green-400 transition">
                Talk to an Expert
              </button>
            </Link>
            <Link to="/resources/creative-best-practices">
              <button className="border border-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-black transition">
                Creative Best Practices
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
