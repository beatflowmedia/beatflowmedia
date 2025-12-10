// src/components/PlayPauseButton.js
import React from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import { usePlayer } from "../context/PlayerContext";

/**
 * A reusable play/pause toggle button that uses the shared PlayerContext.
 * Props:
 * - size: icon size (defaults to 14)
 * - className: additional styling classes
 */
const PlayPauseButton = ({ size = 14, className = "" }) => {
  const { state, dispatch, actions } = usePlayer();
  const isPlaying = state.isPlaying;
  const togglePlay = () => dispatch({ type: actions.TOGGLE_PLAY });

  return (
    <button
      onClick={togglePlay}
      className={className}
      title={isPlaying ? "Pause" : "Play"}
    >
      {isPlaying ? <FaPause size={size} /> : <FaPlay size={size} />}
    </button>
  );
};

export default PlayPauseButton;
