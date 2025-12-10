import React from "react";
import Footer from "../components/Footer";

export default function Developers() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">BeatFlow Media for Developers</h1>
          <p className="text-xl text-gray-400 mb-12">
            Build amazing experiences with the BeatFlow Media API
          </p>

          {/* Hero Section */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-8 mb-12">
            <h2 className="text-3xl font-bold mb-4">Start Building Today</h2>
            <p className="text-lg mb-6">
              Access our comprehensive API to integrate BeatFlow Media's catalog of millions of tracks into your applications.
            </p>
            <button className="bg-white text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
              Get API Access
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-3">Web API</h3>
              <p className="text-gray-400 mb-4">
                Access BeatFlow Media's music catalog, user data, and playback controls through our RESTful API.
              </p>
              <a href="#" className="text-green-500 hover:underline font-semibold">
                View Documentation →
              </a>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-3">SDKs</h3>
              <p className="text-gray-400 mb-4">
                Official SDKs for iOS, Android, and Web make integration quick and easy.
              </p>
              <a href="#" className="text-green-500 hover:underline font-semibold">
                Browse SDKs →
              </a>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-3">Code Examples</h3>
              <p className="text-gray-400 mb-4">
                Get started quickly with our collection of code samples and tutorials.
              </p>
              <a href="#" className="text-green-500 hover:underline font-semibold">
                See Examples →
              </a>
            </div>
          </div>

          {/* API Features */}
          <h2 className="text-3xl font-bold mb-6">API Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {[
              {
                title: "Search & Browse",
                description: "Search for artists, albums, tracks, and playlists across our entire catalog."
              },
              {
                title: "Playback Control",
                description: "Control playback on BeatFlow Media Connect devices and retrieve playback state."
              },
              {
                title: "User Library",
                description: "Access and modify users' saved tracks, albums, and playlists."
              },
              {
                title: "Personalization",
                description: "Get personalized recommendations based on user listening history."
              },
              {
                title: "Audio Analysis",
                description: "Access detailed audio analysis and features for every track."
              },
              {
                title: "User Profiles",
                description: "Retrieve user profile information and top artists/tracks."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Resources */}
          <div className="bg-gray-800 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6">Developer Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Documentation</h3>
                <p className="text-gray-400 mb-4">
                  Comprehensive guides and API references to help you integrate BeatFlow Media.
                </p>
                <a href="#" className="text-green-500 hover:underline">
                  Read the Docs →
                </a>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Developer Forum</h3>
                <p className="text-gray-400 mb-4">
                  Join our community of developers to ask questions and share knowledge.
                </p>
                <a href="#" className="text-green-500 hover:underline">
                  Visit Forum →
                </a>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Changelog</h3>
                <p className="text-gray-400 mb-4">
                  Stay updated with the latest API changes and new features.
                </p>
                <a href="#" className="text-green-500 hover:underline">
                  View Changelog →
                </a>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Status Page</h3>
                <p className="text-gray-400 mb-4">
                  Monitor API health and subscribe to status updates.
                </p>
                <a href="#" className="text-green-500 hover:underline">
                  Check Status →
                </a>
              </div>
            </div>
          </div>

          {/* Showcase */}
          <h2 className="text-3xl font-bold mb-6">Built with BeatFlow Media</h2>
          <p className="text-gray-400 mb-8">
            See what other developers have created with our API
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { name: "MusicViz", description: "Visualize your music listening habits" },
              { name: "PartyQueue", description: "Collaborative playlist creator for events" },
              { name: "SoundMatch", description: "Find users with similar music taste" }
            ].map((app, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
                <div className="h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-4"></div>
                <h3 className="text-lg font-bold mb-2">{app.name}</h3>
                <p className="text-gray-400 text-sm">{app.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
