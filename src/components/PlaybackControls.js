// src/components/PlaybackControls.js
import React from "react";
import {
  FaRandom,
  FaStepBackward,
  FaPlay,
  FaPause,
  FaStepForward,
  FaRedoAlt
} from "react-icons/fa";
import { usePlayer } from "../context/PlayerContext";

/**
 * Core playback controls: shuffle, prev, play/pause, next, repeat
 */
export default function PlaybackControls() {
  const { state, dispatch, actions } = usePlayer();
  const { isPlaying, shuffleOn, repeatMode } = state;

  const togglePlay = () => dispatch({ type: actions.TOGGLE_PLAY });
  const skipNext = () => dispatch({ type: actions.SKIP_NEXT });
  const skipPrev = () => dispatch({ type: actions.SKIP_PREVIOUS });
  const toggleShuffle = () => dispatch({ type: actions.TOGGLE_SHUFFLE });
  const cycleRepeat = () => dispatch({ type: actions.CYCLE_REPEAT });

  const repeatLabel =
    repeatMode === "OFF"
      ? "Repeat Off"
      : repeatMode === "ALL"
        ? "Repeat All"
        : "Repeat One";

  return (
    <div className="flex items-center justify-center space-x-6">
      <button
        type="button"
        aria-label={`Shuffle ${shuffleOn ? "On" : "Off"}`}
        onClick={toggleShuffle}
        className={`p-3 ${shuffleOn ? "text-green-500" : "text-gray-400"} hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
      >
        <FaRandom size={20} />
      </button>
      <button
        type="button"
        aria-label="Previous track"
        onClick={skipPrev}
        className="p-3 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        <FaStepBackward size={20} />
      </button>
      <button
        type="button"
        aria-label={isPlaying ? "Pause" : "Play"}
        onClick={togglePlay}
        className="p-3 bg-white text-black rounded-full hover:scale-110 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        {isPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
      </button>
      <button
        type="button"
        aria-label="Next track"
        onClick={skipNext}
        className="p-3 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        <FaStepForward size={20} />
      </button>
      <button
        type="button"
        aria-label={repeatLabel}
        onClick={cycleRepeat}
        className={`p-3 ${repeatMode !== "OFF" ? "text-green-500" : "text-gray-400"} hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
      >
        <FaRedoAlt size={20} />
      </button>
    </div>
  );
}
