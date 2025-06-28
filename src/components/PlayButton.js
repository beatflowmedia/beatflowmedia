// PlayButton.js
// ------------------------------------------------------
// A simple button that toggles between play and pause icons
// based on the "isPlaying" prop.
// ------------------------------------------------------
import React from "react";
import { FaPlay, FaPause } from "react-icons/fa";

const PlayButton = ({ isPlaying, onClick, size = 24, className = "", style = {} }) => {
  return (
    <button
      onClick={onClick}
      className={`text-white hover:text-green-400 transition ${className}`}
      style={style}
    >
      {isPlaying ? <FaPause size={size} /> : <FaPlay size={size} />}
    </button>
  );
};

export default PlayButton;
