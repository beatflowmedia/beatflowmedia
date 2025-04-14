// ArtistItem.js
// ------------------------------------------------------
// Renders an individual song item within an artist's list,
// including a PlayButton for each song.
// ------------------------------------------------------
import React from "react";
import PlayButton from "./PlayButton";

const ArtistItem = ({ song, isPlaying, currentSong, onPlay }) => {
  const isCurrentPlaying = isPlaying && currentSong?.id === song.id;

  return (
    <div
      className="flex items-center justify-between p-2 hover:bg-gray-800 rounded-lg cursor-pointer"
      onClick={() => onPlay(song)}
    >
      <div className="flex items-center space-x-4">
        <img
          src={song.cover}
          alt={song.title}
          className="w-12 h-12 rounded-md object-cover"
        />
        <div>
          <h3 className="text-white text-lg">{song.title}</h3>
          <p className="text-gray-400 text-sm">{song.artist}</p>
          {song.category && (
            <p className="text-gray-400 text-sm">{song.category}</p>
          )}
        </div>
      </div>
      <PlayButton
        isPlaying={isCurrentPlaying}
        onClick={() => onPlay(song)}
        size={20}
      />
    </div>
  );
};

export default ArtistItem;
