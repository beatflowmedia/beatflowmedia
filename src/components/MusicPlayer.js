// src/components/MusicPlayer.js
import React, { useEffect, useState } from "react";
import {
  FaRandom,
  FaStepBackward,
  FaPlay,
  FaPause,
  FaStepForward,
  FaRedoAlt,
  FaVolumeUp,
  FaVolumeMute,
  FaClone,
} from "react-icons/fa";
import AddToPlaylistButton from "../utils/AddToPlaylistButton";
import { usePlaylistManager } from "../hooks/usePlaylistManager";
import { usePlayerActions } from "../hooks/usePlayerActions";
import MiniPlayerPortal from "./MiniPlayerPortal";
import PlayerAnalyticsClass from '../services/analytics/PlayerAnalytics';
const playerAnalytics = new PlayerAnalyticsClass();

// Repeat mode constants
const REPEAT_OFF = 0;
const REPEAT_ALL = 1;
const REPEAT_ONE = 2;

const MusicPlayer = () => {
  // Use unified player context instead of props
  const {
    currentSong: song,
    queue: songs,
    isPlaying,
    togglePlay,
    skipNext,
    skipPrevious,
    toggleShuffle,
    cycleRepeat,
    seekTo,
    setVolume: setContextVolume,
    shuffleOn,
    repeatMode,
    currentTime: contextCurrentTime,
    duration: contextDuration,
    volume: contextVolume
  } = usePlayerActions();

  const { playlists, addSong } = usePlaylistManager();

  // Local UI state only (not playback state - that's in context)
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);
  const [miniPlayerVisible, setMiniPlayerVisible] = useState(false);

  // Analytics tracking only
  useEffect(() => {
    if (!song) return;
    playerAnalytics.trackTrackLoad(song, {});
  }, [song]);

  useEffect(() => {
    if (isPlaying && song) {
      playerAnalytics.trackPlayStart(song);
    } else if (!isPlaying && song) {
      playerAnalytics.trackPlayPause('user_action');
    }
  }, [isPlaying, song]);

  // Helpers
  const toggleMute = () => {
    if (isMuted) {
      setContextVolume(previousVolume);
    } else {
      setPreviousVolume(contextVolume);
      setContextVolume(0);
    }
    setIsMuted(!isMuted);
  };

  const formatTime = (timeInSec) => {
    if (!timeInSec || isNaN(timeInSec)) return "0:00";
    const minutes = Math.floor(timeInSec / 60);
    const seconds = Math.floor(timeInSec % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleSeek = (e) => {
    const seekVal = parseFloat(e.target.value);
    playerAnalytics.trackSeek(contextCurrentTime, seekVal, 'user_seek');
    seekTo(seekVal);
  };

  const handleOpenMiniPlayer = () => setMiniPlayerVisible(true);

  // Fallback if no song in queue
  if (!song) {
    return (
      <div className="w-full bg-black text-white border-t border-gray-800 flex items-center justify-center px-4" style={{ height: "90px" }}>
        <p className="text-gray-400">No song playing</p>
      </div>
    );
  }

  return (
    <>
      <div
        className="w-full bg-black text-white border-t border-gray-800 flex items-center px-4"
        style={{ height: "90px" }}
      >
        {/* LEFT: Cover + Title/Artist */}
        <div className="flex items-center min-w-[180px] w-1/5">
          <img
            src={song.cover || "https://via.placeholder.com/50"}
            alt="cover"
            className="w-12 h-12 object-cover rounded mr-3"
          />
          <div className="leading-tight">
            <p className="font-bold text-sm">{song.title}</p>
            <p className="text-xs text-gray-400">{song.artist}</p>
          </div>
        </div>

        {/* CENTER: Playback Controls + Seek */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="flex items-center gap-4 mb-1">
            <button
              onClick={toggleShuffle}
              className={`text-gray-400 hover:text-white ${shuffleOn ? "text-white" : ""}`}
              title="Shuffle"
            >
              <FaRandom size={16} />
            </button>
            <button
              onClick={skipPrevious}
              className="text-gray-400 hover:text-white"
              title="Previous"
            >
              <FaStepBackward size={18} />
            </button>
            <button
              onClick={togglePlay}
              className="bg-white text-black rounded-full w-8 h-8 flex items-center justify-center hover:scale-105 transition"
              title="Play/Pause"
            >
              {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} />}
            </button>
            <button
              onClick={skipNext}
              className="text-gray-400 hover:text-white"
              title="Next"
            >
              <FaStepForward size={18} />
            </button>
            <button
              onClick={cycleRepeat}
              className={`relative text-gray-400 hover:text-white ${
                repeatMode !== "OFF" ? "text-white" : ""
              }`}
              title={
                repeatMode === "ONE"
                  ? "Repeat One"
                  : repeatMode === "ALL"
                  ? "Repeat All"
                  : "Repeat Off"
              }
            >
              {repeatMode === "ONE" ? (
                <div className="relative">
                  <FaRedoAlt size={16} />
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-black">
                    1
                  </span>
                </div>
              ) : (
                <FaRedoAlt size={16} />
              )}
            </button>
          </div>
          {/* Seek Bar Row */}
          <div className="flex items-center gap-2 w-full px-4">
            <span className="text-xs text-gray-400">{formatTime(contextCurrentTime)}</span>
            <input
              type="range"
              className="flex-1 accent-gray-300 h-1 cursor-pointer"
              min={0}
              max={contextDuration || 0}
              step="0.01"
              value={contextCurrentTime}
              onChange={handleSeek}
            />
            <span className="text-xs text-gray-400">{formatTime(contextDuration)}</span>
          </div>
        </div>

        {/* RIGHT: AddToPlaylist, Volume, Mini Player Toggle */}
        <div className="flex items-center justify-end w-1/5 gap-3">
          <AddToPlaylistButton song={song} playlists={playlists} addSong={addSong} />
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="text-gray-400 hover:text-white">
              {isMuted ? <FaVolumeMute size={14} /> : <FaVolumeUp size={14} />}
            </button>
            <input
              type="range"
              className="w-16 accent-gray-300 cursor-pointer"
              min={0}
              max={1}
              step="0.01"
              value={isMuted ? 0 : contextVolume}
              onChange={(e) => setContextVolume(parseFloat(e.target.value))}
            />
          </div>
          <button
            onClick={handleOpenMiniPlayer}
            className="text-gray-400 hover:text-white"
            title="Open mini player"
          >
            <FaClone size={14} />
          </button>
        </div>
      </div>

      {/* Mini Player Portal */}
      <MiniPlayerPortal
        visible={miniPlayerVisible}
        song={song}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onClose={() => setMiniPlayerVisible(false)}
        shuffle={shuffleOn}
        onShuffleToggle={toggleShuffle}
        onPrevSong={skipPrevious}
        onNextSong={skipNext}
        repeatMode={repeatMode}
        onCycleRepeat={cycleRepeat}
      />
    </>
  );
};

export default MusicPlayer;
