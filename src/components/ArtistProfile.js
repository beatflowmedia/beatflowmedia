// ArtistProfile.js
import React from "react";

/**
 * Example layout for an artist profile page (like Spotify),
 * showing:
 *  - Large artist image + "Verified Artist" label
 *  - Artist name, monthly listeners
 *  - "Following" button
 *  - "Popular" track listing with index, track name, duration
 */
export default function ArtistProfile() {
  return (
    <div className="bg-black text-white min-h-screen p-8">
      {/* Artist Header */}
      <div className="flex items-end gap-6 mb-8">
        {/* Large Artist Image */}
        <img
          src="/images/TeddySwims.jpg" // replace with your image path
          alt="Teddy Swims"
          className="w-52 h-52 object-cover rounded shadow-lg"
        />

        {/* Text Section */}
        <div>
          {/* "Verified Artist" label */}
          <div className="flex items-center text-blue-400 text-sm mb-2">
            <svg className="w-4 h-4 mr-1 fill-current" viewBox="0 0 24 24">
              {/* Example checkmark icon or any badge icon you prefer */}
              <path d="M10 15.172l-3.95-3.95-1.414 1.414L10 18 20.364 7.636l-1.414-1.414z" />
            </svg>
            Verified Artist
          </div>

          {/* Artist Name */}
          <h1 className="text-5xl font-bold mb-2">Teddy Swims</h1>

          {/* Monthly Listeners */}
          <p className="text-gray-400 text-sm mb-4">
            48,421,431 monthly listeners
          </p>

          {/* "Following" Button */}
          <button className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-white font-semibold">
            Following
          </button>
        </div>
      </div>

      {/* Popular Tracks */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Popular</h2>

        {/* A list of tracks with index, name, duration */}
        <div className="space-y-2">
          {/* Track Row #1 */}
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded hover:bg-gray-700 transition cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-gray-400 w-5 text-right">1</span>
              <img
                src="/images/TeddySwims.jpg"
                alt="Lose Control"
                className="w-10 h-10 object-cover rounded"
              />
              <span className="text-white font-medium">Lose Control</span>
            </div>
            <span className="text-gray-400 text-sm">3:30</span>
          </div>

          {/* Track Row #2 */}
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded hover:bg-gray-700 transition cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-gray-400 w-5 text-right">2</span>
              <img
                src="/images/TeddySwims.jpg"
                alt="Bad Dreams"
                className="w-10 h-10 object-cover rounded"
              />
              <span className="text-white font-medium">Bad Dreams</span>
            </div>
            <span className="text-gray-400 text-sm">3:34</span>
          </div>

          {/* Track Row #3 */}
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded hover:bg-gray-700 transition cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-gray-400 w-5 text-right">3</span>
              <img
                src="/images/TeddySwims.jpg"
                alt="The Door"
                className="w-10 h-10 object-cover rounded"
              />
              <span className="text-white font-medium">The Door</span>
            </div>
            <span className="text-gray-400 text-sm">3:32</span>
          </div>

          {/* ... more tracks as needed ... */}
        </div>
      </section>
    </div>
  );
}
