// HomeHeader.js
import React from "react";
import { FaPlay } from "react-icons/fa";

function HomeHeader({
  headerBgStyle,
  songsToDisplay,
  selectedPlaylist,
  selectedArtist,
  isFollowing,
  toggleFollow,
  onSongSelect,
  onTogglePlay,
}) {
  return (
    <div className={`relative w-full h-80 bg-gradient-to-b ${headerBgStyle} p-6 flex items-end`}>
      {/* Big green play button anchored to bottom-left */}
      <button
        className="absolute left-6 bottom-6 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-black shadow-lg hover:scale-105 transform transition"
        title="Play"
        onClick={() => {
          if (songsToDisplay[0]) {
            onSongSelect(songsToDisplay[0]);
            onTogglePlay(true);
          }
        }}
      >
        <FaPlay className="w-6 h-6" />
      </button>
      {/* Text container with left margin */}
      <div className="ml-24">
        {selectedPlaylist ? (
          <div>
            <h1 className="text-5xl font-bold text-white">{selectedPlaylist.name}</h1>
            <p className="text-gray-300 text-sm">
              Trending Songs (Music Production) · {songsToDisplay.length} song(s)
            </p>
          </div>
        ) : selectedArtist ? (
          <div>
            <h1 className="text-5xl font-bold text-white">{selectedArtist}</h1>
            <p className="text-gray-300 text-sm">
              Popular Songs · {songsToDisplay.length} track(s)
            </p>
            <button
              className={`mt-2 px-4 py-2 rounded-md text-sm font-semibold transition ${
                isFollowing
                  ? "bg-red-500 hover:bg-red-400 text-white"
                  : "bg-green-500 hover:bg-green-400 text-white"
              }`}
              onClick={toggleFollow}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          </div>
        ) : (
          <div>
            <h1 className="text-5xl font-bold text-white">Liked Songs</h1>
            <p className="text-gray-300 text-sm">
              Trending Songs (Music Production) · {songsToDisplay.length} song(s)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomeHeader;
