// WhatsNew.js
// ------------------------------------------------------
// Displays a "What's New" section with sample releases.
// ------------------------------------------------------
import React from "react";

const WhatsNew = () => {
  return (
    <div className="p-8 bg-black text-white">
      <h2 className="text-4xl font-bold mb-4">What's New</h2>
      <p className="text-gray-400 mb-6">
        The latest releases from artists, podcasts, and shows you follow.
      </p>

      {/* Filter Buttons */}
      <div className="flex gap-4 mb-6">
        <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-full text-white">
          Music
        </button>
        <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-full text-white">
          Podcast & Shows
        </button>
      </div>

      {/* New Releases List */}
      <div className="space-y-8">
        {/* Example Release */}
        <div className="song-item">
          <img
            src="https://i.scdn.co/image/ab67616d0000b273d1e1c2e1c37a7c8fbb3e1c1e"
            alt="Album Cover"
          />
          <div className="song-details">
            <h3 className="song-title">Sometimes</h3>
            <p className="song-meta">
              Tiago PZK, Teddy Swims • Single • 1 week ago
            </p>
          </div>
          <button className="play-button">▶</button>
        </div>
        {/* Add more releases as needed... */}
      </div>
    </div>
  );
};

export default WhatsNew;
