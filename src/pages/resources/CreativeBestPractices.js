import React from "react";
import { Link } from "react-router-dom";
import { FiCheckCircle, FiXCircle, FiZap, FiHeadphones } from "react-icons/fi";

export default function CreativeBestPractices() {
  const audioTips = [
    {
      do: "Start with a hook in the first 3 seconds",
      dont: "Begin with lengthy introductions or disclaimers"
    },
    {
      do: "Use a conversational, authentic tone",
      dont: "Sound overly scripted or salesy"
    },
    {
      do: "Include a clear, memorable call-to-action",
      dont: "Leave listeners confused about next steps"
    },
    {
      do: "Match the mood of your target playlist/genre",
      dont: "Create jarring transitions from music"
    },
    {
      do: "Use sound effects sparingly and purposefully",
      dont: "Overload with competing audio elements"
    }
  ];

  const videoTips = [
    {
      do: "Design for mobile-first viewing",
      dont: "Rely on small text or details"
    },
    {
      do: "Use bold, high-contrast visuals",
      dont: "Use busy backgrounds or subtle colors"
    },
    {
      do: "Front-load your key message",
      dont: "Save important information for the end"
    },
    {
      do: "Include captions for accessibility",
      dont: "Rely solely on audio to convey information"
    },
    {
      do: "Keep branding consistent throughout",
      dont: "Hide your logo until the final frame"
    }
  ];

  const generalPrinciples = [
    {
      icon: <FiHeadphones className="text-4xl text-bf-green" />,
      title: "Know Your Audience",
      description: "Understand the listening context. Commuters, gym-goers, and focused workers all engage differently. Tailor your message to their mindset and environment."
    },
    {
      icon: <FiZap className="text-4xl text-bf-green" />,
      title: "Tell a Story",
      description: "Even in 15 seconds, you can create an emotional connection. Focus on the problem you solve or the feeling your brand evokes, not just features."
    },
    {
      icon: <FiCheckCircle className="text-4xl text-bf-green" />,
      title: "Test & Iterate",
      description: "Run A/B tests on different creative approaches. Small changes in messaging, voiceover, or music can significantly impact performance."
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
          <h1 className="text-5xl font-bold mb-4">Creative Best Practices</h1>
          <p className="text-gray-400 text-lg">
            Learn how to create compelling ads that resonate with BeatFlow listeners.
          </p>
        </div>
      </header>

      {/* General Principles */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Core Principles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {generalPrinciples.map((principle, idx) => (
              <div key={idx} className="bg-gray-800 p-8 rounded-lg text-center">
                <div className="flex justify-center mb-4">{principle.icon}</div>
                <h3 className="text-2xl font-bold mb-4">{principle.title}</h3>
                <p className="text-gray-400">{principle.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audio Best Practices */}
      <section className="py-16 px-6 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-8">Audio Ad Best Practices</h2>
          <p className="text-gray-400 mb-8">
            Audio ads are intimate and immersive. Make every second count with these proven strategies.
          </p>
          <div className="space-y-4">
            {audioTips.map((tip, idx) => (
              <div key={idx} className="bg-gray-900 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start">
                    <FiCheckCircle className="text-bf-green text-2xl mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-bf-green mb-1">DO:</p>
                      <p className="text-gray-300">{tip.do}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <FiXCircle className="text-red-500 text-2xl mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-red-500 mb-1">DON'T:</p>
                      <p className="text-gray-300">{tip.dont}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Best Practices */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-8">Video Ad Best Practices</h2>
          <p className="text-gray-400 mb-8">
            Video ads on BeatFlow appear during active listening sessions. Capture attention immediately with visual storytelling.
          </p>
          <div className="space-y-4">
            {videoTips.map((tip, idx) => (
              <div key={idx} className="bg-gray-800 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start">
                    <FiCheckCircle className="text-bf-green text-2xl mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-bf-green mb-1">DO:</p>
                      <p className="text-gray-300">{tip.do}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <FiXCircle className="text-red-500 text-2xl mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-red-500 mb-1">DON'T:</p>
                      <p className="text-gray-300">{tip.dont}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pro Tips */}
      <section className="py-16 px-6 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-8">Pro Tips from Top Performers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3 text-bf-green">Use Music Wisely</h3>
              <p className="text-gray-300">
                Background music should complement, not compete with your message. Choose tracks that match your brand's energy without overwhelming the voiceover.
              </p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3 text-bf-green">Optimize for Audio-Only</h3>
              <p className="text-gray-300">
                Even for video ads, ensure your message works without visuals. Many listeners are in audio-only mode (locked screens, smart speakers).
              </p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3 text-bf-green">Create Seasonal Variants</h3>
              <p className="text-gray-300">
                Refresh creative quarterly to align with seasons, holidays, and cultural moments. Fresh creative prevents ad fatigue.
              </p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-3 text-bf-green">Leverage Data Insights</h3>
              <p className="text-gray-300">
                Use BeatFlow Analytics to understand what resonates. Double down on high-performing creative elements and retire underperformers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Need creative support?</h2>
          <p className="text-gray-400 mb-8">
            Our Creative Lab team can help you develop high-performing ad creative from scratch.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/creative-lab">
              <button className="bg-bf-green text-black px-8 py-3 rounded-full font-semibold hover:bg-green-400 transition">
                Explore Creative Lab
              </button>
            </Link>
            <Link to="/resources/ad-specs">
              <button className="border border-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-black transition">
                View Ad Specs
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
