import React from "react";
import { Link } from "react-router-dom";
import { FiVideo, FiMusic, FiImage } from "react-icons/fi";

export default function AdSpecs() {
  const audioSpecs = [
    { label: "Format", value: "MP3 or OGG" },
    { label: "Sample Rate", value: "44.1 kHz" },
    { label: "Bit Rate", value: "Minimum 96 kbps" },
    { label: "Duration", value: "15s or 30s" },
    { label: "Max File Size", value: "1 MB" },
  ];

  const videoSpecs = [
    { label: "Format", value: "MP4, MOV, or AVI" },
    { label: "Resolution", value: "1920x1080 (Full HD)" },
    { label: "Aspect Ratio", value: "16:9" },
    { label: "Frame Rate", value: "23.98, 24, 25, or 29.97 fps" },
    { label: "Duration", value: "15s or 30s" },
    { label: "Max File Size", value: "200 MB" },
  ];

  const displaySpecs = [
    { label: "Format", value: "JPG or PNG" },
    { label: "Dimensions", value: "640x640px (square)" },
    { label: "Max File Size", value: "2 MB" },
    { label: "Color Mode", value: "RGB" },
  ];

  const podcastSpecs = [
    { label: "Format", value: "MP3" },
    { label: "Sample Rate", value: "44.1 kHz" },
    { label: "Bit Rate", value: "128 kbps recommended" },
    { label: "Duration", value: "30s, 60s, or 90s" },
    { label: "Max File Size", value: "2 MB" },
  ];

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <header className="bg-gray-800 py-6 px-6">
        <div className="max-w-6xl mx-auto">
          <Link to="/advertising" className="text-bf-green hover:underline mb-4 inline-block">
            ← Back to Advertising
          </Link>
          <h1 className="text-5xl font-bold mb-4">Ad Specifications</h1>
          <p className="text-gray-400 text-lg">
            Technical requirements and specifications for all BeatFlow ad formats.
          </p>
        </div>
      </header>

      {/* Audio Ads */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-8">
            <FiMusic className="text-5xl text-bf-green mr-4" />
            <h2 className="text-4xl font-bold">Audio Ad Specifications</h2>
          </div>
          <div className="bg-gray-800 rounded-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {audioSpecs.map((spec, idx) => (
                <div key={idx} className="border-b border-gray-700 pb-4">
                  <p className="text-gray-400 text-sm">{spec.label}</p>
                  <p className="text-white text-lg font-semibold">{spec.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-gray-700 rounded">
              <h3 className="font-semibold mb-2">Additional Requirements:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Audio should be mastered to -14 LUFS</li>
                <li>No clipping or distortion</li>
                <li>Clear call-to-action in final 5 seconds</li>
                <li>Professional voice talent recommended</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Video Ads */}
      <section className="py-16 px-6 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-8">
            <FiVideo className="text-5xl text-bf-green mr-4" />
            <h2 className="text-4xl font-bold">Video Ad Specifications</h2>
          </div>
          <div className="bg-gray-900 rounded-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {videoSpecs.map((spec, idx) => (
                <div key={idx} className="border-b border-gray-700 pb-4">
                  <p className="text-gray-400 text-sm">{spec.label}</p>
                  <p className="text-white text-lg font-semibold">{spec.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-gray-800 rounded">
              <h3 className="font-semibold mb-2">Additional Requirements:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>H.264 codec recommended</li>
                <li>Audio track: AAC, 128 kbps minimum</li>
                <li>Safe zones: Keep important content within 90% of frame</li>
                <li>Closed captions recommended for accessibility</li>
                <li>First 3 seconds should capture attention</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Display/Companion Ads */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-8">
            <FiImage className="text-5xl text-bf-green mr-4" />
            <h2 className="text-4xl font-bold">Display & Companion Ad Specifications</h2>
          </div>
          <div className="bg-gray-800 rounded-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displaySpecs.map((spec, idx) => (
                <div key={idx} className="border-b border-gray-700 pb-4">
                  <p className="text-gray-400 text-sm">{spec.label}</p>
                  <p className="text-white text-lg font-semibold">{spec.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-gray-700 rounded">
              <h3 className="font-semibold mb-2">Design Guidelines:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>High contrast for readability</li>
                <li>Minimal text (focus on visuals)</li>
                <li>Brand logo should be clearly visible</li>
                <li>Avoid busy backgrounds</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Podcast Ads */}
      <section className="py-16 px-6 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-8">
            <FiMusic className="text-5xl text-bf-green mr-4" />
            <h2 className="text-4xl font-bold">Podcast Ad Specifications</h2>
          </div>
          <div className="bg-gray-900 rounded-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {podcastSpecs.map((spec, idx) => (
                <div key={idx} className="border-b border-gray-700 pb-4">
                  <p className="text-gray-400 text-sm">{spec.label}</p>
                  <p className="text-white text-lg font-semibold">{spec.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-gray-800 rounded">
              <h3 className="font-semibold mb-2">Podcast-Specific Guidelines:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Conversational tone works best</li>
                <li>Host-read ads perform better (consider script-only submission)</li>
                <li>Pre-roll, mid-roll, and post-roll placements available</li>
                <li>Clear pronunciation guide for brand names</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Need help with your creative?</h2>
          <p className="text-gray-400 mb-8">
            Check out our Creative Best Practices guide or contact our team for assistance.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/resources/creative-best-practices">
              <button className="bg-bf-green text-black px-8 py-3 rounded-full font-semibold hover:bg-green-400 transition">
                Best Practices
              </button>
            </Link>
            <Link to="/resources/help-center">
              <button className="border border-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-black transition">
                Help Center
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
