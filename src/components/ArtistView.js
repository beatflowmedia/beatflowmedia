// ArtistView.js
// ------------------------------------------------------
// Displays a detailed view of an artist, including:
//  - A header with the artist's image and monthly listeners
//  - A "Play All" button
//  - A list of songs using ArtistItem
// ------------------------------------------------------
import React from "react";
import PlayButton from "./PlayButton";
import ArtistItem from "./ArtistItem";

const ArtistView = ({ artist, songs = [], currentSong, isPlaying, onPlay }) => {
  if (!artist || songs.length === 0) {
    return <p className="text-gray-400 p-4">No songs available.</p>;
  }

  const isArtistPlaying =
    isPlaying && currentSong && songs.some((song) => song.id === currentSong.id);

  return (
    <div className="p-6">
      {/* Artist Header */}
      <div className="relative w-full h-64 bg-gradient-to-b from-gray-700 to-black rounded-lg overflow-hidden">
        <img
          src={`/artistImages/${artist}.jpg`}
          alt={artist}
          className="absolute w-full h-full object-cover opacity-50"
        />
        <div className="relative z-10 flex flex-col justify-end h-full p-6">
          <h1 className="text-white text-5xl font-bold">{artist}</h1>
          <p className="text-gray-300 text-lg">48,240,188 monthly listeners</p>
        </div>
      </div>

      {/* Play All Button */}
      <div className="flex items-center space-x-4 mt-4">
        <PlayButton
          isPlaying={isArtistPlaying}
          onClick={() => onPlay(songs[0])}
          size={30}
        />
        <span className="text-white text-lg font-semibold">
          {isArtistPlaying ? "Pause" : "Play All"}
        </span>
      </div>

      {/* Song List */}
      <h2 className="text-white text-2xl font-bold mt-6">Popular</h2>
      <div className="mt-4">
        {songs.map((song, index) => (
          <ArtistItem
            key={song.id || index}
            song={song}
            isPlaying={isPlaying && currentSong?.id === song.id}
            currentSong={currentSong}
            onPlay={onPlay}
          />
        ))}
      </div>
    </div>
  );
};

export default ArtistView;
