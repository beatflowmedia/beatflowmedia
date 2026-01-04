// src/components/MusicPlayer.js
import { useEffect, useState } from "react";
import { getPlaceholderImage } from "../utils/placeholders";
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
import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";
import { usePlaybackResume } from "../utils/usePlaybackResume";
import MiniPlayerPortal from "./MiniPlayerPortal";
import PlayerAnalyticsClass from '../services/analytics/PlayerAnalytics';
const playerAnalytics = new PlayerAnalyticsClass();

const MusicPlayer = () => {
  // Get player state and audioRef from context - SINGLE SOURCE OF TRUTH
  const { audioRef } = usePlayer();
  const {
    currentSong: song,
    isPlaying,
    togglePlay,
    skipNext,
    skipPrevious,
    toggleShuffle,
    cycleRepeat,
    shuffleOn,
    repeatMode,
    currentTime,
    duration,
    volume: contextVolume,
    setVolume: setContextVolume,
    queue
  } = usePlayerActions();

  const { playlists, addSong } = usePlaylistManager();
  const { user } = useAuth();

  // Local state for UI only (mute toggle and mini player)
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);
  const [miniPlayerVisible, setMiniPlayerVisible] = useState(false);

  // Hybrid resume hook - now uses PlayerContext's audioRef
  usePlaybackResume(audioRef, song, user);

  // Analytics tracking only - playback is handled by PlayerContext
  useEffect(() => {
    if (!song) return;
    playerAnalytics.trackTrackLoad(song, {});
    if (isPlaying) {
      playerAnalytics.trackPlayStart(song);
    }
  }, [song, isPlaying]);

  // Helpers - now use context volume and PlayerContext's controls
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
    playerAnalytics.trackSeek(currentTime, seekVal, 'user_seek');
    // Seek via PlayerContext (which updates the engine)
    if (audioRef.current) {
      audioRef.current.currentTime = seekVal;
    }
  };

  const handleOpenMiniPlayer = () => setMiniPlayerVisible(true);

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setContextVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleMiniPlayerVolumeChange = (newVolume) => {
    setContextVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleMiniPlayerSeek = (seekVal) => {
    playerAnalytics.trackSeek(currentTime, seekVal, 'user_seek');
    if (audioRef.current) {
      audioRef.current.currentTime = seekVal;
    }
  };

  return (
    <>
      <div
        className="bg-black text-white border-t border-gray-800 flex items-center px-4"
        style={{ height: "100%" }}
      >
        {/* LEFT: Cover + Title/Artist */}
        <div className="flex items-center min-w-[180px] w-1/5">
          {song ? (
            <>
              <img
                src={song.cover || getPlaceholderImage(50, 50)}
                alt="cover"
                className="w-12 h-12 object-cover rounded mr-3"
              />
              <div className="leading-tight">
                <p className="font-bold text-sm">{song.title}</p>
                <p className="text-xs text-gray-400">{song.artist}</p>
              </div>
            </>
          ) : (
            <>
              <img
                src="/images/Logo.png"
                alt="BeatFlow"
                className="w-12 h-12 object-cover rounded mr-3"
              />
              <div className="leading-tight">
                <p className="font-bold text-sm">No song playing</p>
                <p className="text-xs text-gray-400">Select a song to play</p>
              </div>
            </>
          )}
        </div>

        {/* CENTER: Playback Controls + Seek */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="flex items-center gap-4 mb-1">
            <button
              onClick={toggleShuffle}
              className={`transition-colors ${shuffleOn ? "text-green-500" : "text-gray-400 hover:text-white"}`}
              title={shuffleOn ? "Disable shuffle" : "Enable shuffle"}
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
              className={`relative transition-colors ${
                repeatMode !== "OFF" ? "text-green-500" : "text-gray-400 hover:text-white"
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
                <div className="relative inline-flex items-center justify-center">
                  <FaRedoAlt size={16} />
                  <span className="absolute text-[10px] font-bold" style={{ marginTop: '1px' }}>
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
            <span className="text-xs text-gray-400">{formatTime(currentTime)}</span>
            <input
              type="range"
              className="flex-1 accent-gray-300 h-1 cursor-pointer"
              min={0}
              max={duration || 0}
              step="0.01"
              value={currentTime}
              onChange={handleSeek}
            />
            <span className="text-xs text-gray-400">{formatTime(duration)}</span>
          </div>
        </div>

        {/* RIGHT: AddToPlaylist, Volume, Mini Player Toggle */}
        <div className="flex items-center justify-end w-1/5 gap-3">
          {song && <AddToPlaylistButton song={song} playlists={playlists} addSong={addSong} />}
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
              onChange={handleVolumeChange}
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
        currentTime={currentTime}
        duration={duration}
        volume={contextVolume}
        onVolumeChange={handleMiniPlayerVolumeChange}
        onSeek={handleMiniPlayerSeek}
        queue={queue || []}
        playlists={playlists}
        addSong={addSong}
      />
    </>
  );
};

export default MusicPlayer;
