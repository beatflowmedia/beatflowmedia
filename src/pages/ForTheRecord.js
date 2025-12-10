import React from "react";
import Footer from "../components/Footer";

export default function ForTheRecord() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">For the Record</h1>
          <p className="text-xl text-gray-400 mb-12">
            News, stories, and insights from BeatFlow Media
          </p>

          {/* Featured Story */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="h-64 bg-gradient-to-br from-green-500 to-blue-600"></div>
              <div className="p-6">
                <span className="text-sm text-gray-400">FEATURED</span>
                <h2 className="text-2xl font-bold mt-2 mb-3">
                  BeatFlow Media Wrapped 2024: The Biggest Year Yet
                </h2>
                <p className="text-gray-400 mb-4">
                  Explore the top artists, songs, and podcasts that defined 2024 on BeatFlow Media.
                </p>
                <a href="/wrapped2024" className="text-green-500 hover:underline font-semibold">
                  Read More →
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-6">
                <span className="text-sm text-gray-400">INNOVATION</span>
                <h3 className="text-xl font-bold mt-2 mb-2">
                  Introducing AI-Powered Personalized Playlists
                </h3>
                <p className="text-gray-400 text-sm mb-3">
                  Our new recommendation engine learns from your listening habits to create the perfect soundtrack.
                </p>
                <a href="#" className="text-green-500 hover:underline text-sm font-semibold">
                  Learn More →
                </a>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <span className="text-sm text-gray-400">ARTISTS</span>
                <h3 className="text-xl font-bold mt-2 mb-2">
                  Supporting Independent Artists in 2025
                </h3>
                <p className="text-gray-400 text-sm mb-3">
                  How BeatFlow Media is helping emerging artists reach new audiences and grow their careers.
                </p>
                <a href="/for-artists" className="text-green-500 hover:underline text-sm font-semibold">
                  Read More →
                </a>
              </div>
            </div>
          </div>

          {/* Latest Stories Grid */}
          <h2 className="text-3xl font-bold mb-6">Latest Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                category: "TECHNOLOGY",
                title: "Enhanced Audio Quality with Lossless Streaming",
                excerpt: "Experience your favorite music in studio-quality sound.",
              },
              {
                category: "COMMUNITY",
                title: "BeatFlow Media Expands to 20 New Markets",
                excerpt: "Bringing music to millions more listeners worldwide.",
              },
              {
                category: "CULTURE",
                title: "The Rise of Lo-Fi Hip Hop: A Global Phenomenon",
                excerpt: "How a niche genre became the soundtrack for productivity.",
              },
              {
                category: "PODCASTS",
                title: "Top Podcasts of 2024: Year in Review",
                excerpt: "The shows that captivated listeners around the world.",
              },
              {
                category: "PLAYLISTS",
                title: "Curated Collections: Behind the Scenes",
                excerpt: "Meet the curators who craft your favorite playlists.",
              },
              {
                category: "INSIGHTS",
                title: "How Music Streaming Changed the Industry",
                excerpt: "A decade of transformation in the music business.",
              },
            ].map((story, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
                <span className="text-sm text-gray-400">{story.category}</span>
                <h3 className="text-lg font-bold mt-2 mb-2">{story.title}</h3>
                <p className="text-gray-400 text-sm mb-3">{story.excerpt}</p>
                <a href="#" className="text-green-500 hover:underline text-sm font-semibold">
                  Read More →
                </a>
              </div>
            ))}
          </div>

          {/* Categories */}
          <div className="border-t border-gray-800 pt-8 mb-12">
            <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
            <div className="flex flex-wrap gap-3">
              {["All", "Technology", "Artists", "Culture", "Podcasts", "Playlists", "Company News", "Insights"].map((category) => (
                <button
                  key={category}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-sm font-semibold transition-colors"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
