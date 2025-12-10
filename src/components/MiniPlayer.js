import React, { useState, useEffect , useCallback } from "react";
import {
  FaPlay,
  FaPause,
  FaTimes,
  FaRandom,
  FaStepBackward,
  FaStepForward,
  FaRedoAlt,
  FaExpand,
  FaCompress,
  FaVolumeUp,
  FaVolumeMute,
  FaThumbtack,
  FaAlignLeft,
  FaListUl
} from "react-icons/fa";
import { subscribeToActiveAds } from "../utils/AdsHelper";
import PlayingIndicator from "./PlayingIndicator";

const REPEAT_OFF = 0;
const REPEAT_ALL = 1;
const REPEAT_ONE = 2;

export default function MiniPlayer({
  song,
  isPlaying,
  onTogglePlay,
  onClose,
  shuffle,
  onShuffleToggle,
  onPrevSong,
  onNextSong,
  repeatMode,
  onCycleRepeat,
  isPopup = false,
  currentTime = 0,
  duration = 0,
  volume = 1,
  onVolumeChange,
  onSeek,
  queue = [],
  playlists = [],
  addSong
}) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [localVolume, setLocalVolume] = useState(volume);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);
  const [ads, setAds] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  const handleDragMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleDragMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    },
    [isDragging, dragOffset],
  );

  const handleDragMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDragMouseMove);
      window.addEventListener("mouseup", handleDragMouseUp);
    } else {
      window.removeEventListener("mousemove", handleDragMouseMove);
      window.removeEventListener("mouseup", handleDragMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleDragMouseMove);
      window.removeEventListener("mouseup", handleDragMouseUp);
    };
  }, [isDragging, handleDragMouseMove]);

  // Fixed 9:16 aspect ratio (width:height - portrait orientation)
  const MINI_PLAYER_WIDTH = 280;
  const MINI_PLAYER_HEIGHT = Math.round((MINI_PLAYER_WIDTH / 9) * 16);

  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  // Helper functions
  const formatTime = (timeInSec) => {
    if (!timeInSec || isNaN(timeInSec)) return "0:00";
    const minutes = Math.floor(timeInSec / 60);
    const seconds = Math.floor(timeInSec % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setLocalVolume(newVolume);
    if (onVolumeChange) onVolumeChange(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setLocalVolume(previousVolume);
      if (onVolumeChange) onVolumeChange(previousVolume);
    } else {
      setPreviousVolume(localVolume);
      setLocalVolume(0);
      if (onVolumeChange) onVolumeChange(0);
    }
    setIsMuted(!isMuted);
  };

  const handleSeek = (e) => {
    if (onSeek) {
      onSeek(parseFloat(e.target.value));
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only handle if mini player is focused or in popup mode
      if (!isPopup && document.activeElement.tagName === 'INPUT') return;

      switch(e.code) {
        case 'Space':
          e.preventDefault();
          onTogglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrevSong();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNextSong();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPopup, onTogglePlay, onPrevSong, onNextSong]);

  // Sync volume prop changes
  useEffect(() => {
    setLocalVolume(volume);
  }, [volume]);

  // Subscribe to ads from Firebase
  useEffect(() => {
    const unsubscribe = subscribeToActiveAds((activeAds) => {
      // Filter ads for mini_player display location
      const miniPlayerAds = activeAds.filter(ad =>
        ad.displayLocations && ad.displayLocations.includes('mini_player')
      );
      setAds(miniPlayerAds);
    });

    return () => unsubscribe();
  }, []);

  // Get current ad to display
  const currentAd = ads.length > 0 ? ads[currentAdIndex % ads.length] : null;

  const containerStyle = isFullscreen || isPopup
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh"
      }
    : {
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${MINI_PLAYER_WIDTH}px`,
        height: `${MINI_PLAYER_HEIGHT}px`
      };

  return (
    <div
      className={`bg-gradient-to-b from-gray-900 to-black text-white shadow-2xl flex flex-col z-50 overflow-hidden ${isPopup ? '' : 'rounded-lg'}`}
      style={{
        ...containerStyle,
        zIndex: alwaysOnTop ? 9999 : 50
      }}
    >
      {/* Blurred background */}
      {song && (
        <div
          className="absolute inset-0 opacity-20 blur-3xl"
          style={{
            backgroundImage: `url(${song.cover || "/images/default-cover.jpg"})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(40px)',
            transform: 'scale(1.1)'
          }}
        />
      )}

      {/* Header Bar */}
      <div
        className="relative flex items-center justify-between px-3 py-2 bg-black/50 cursor-move flex-shrink-0"
        onMouseDown={handleDragMouseDown}
      >
        <div className="flex items-center gap-2">
          <button
            className="text-gray-400 hover:text-white transition"
            onClick={onClose}
            title="Close mini player"
          >
            <FaTimes size={14} />
          </button>
          <button
            className={`text-gray-400 hover:text-white transition ${alwaysOnTop ? 'text-blue-400' : ''}`}
            onClick={() => setAlwaysOnTop(!alwaysOnTop)}
            title="Always on top"
          >
            <FaThumbtack size={12} />
          </button>
        </div>
        <div className="flex-1 flex justify-center items-center">
          <img
            src="/images/Logo.svg"
            alt="BeatFlow"
            className="h-5"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`text-gray-400 hover:text-white transition ${showLyrics ? 'text-green-400' : ''}`}
            onClick={() => setShowLyrics(!showLyrics)}
            title="Toggle lyrics"
          >
            <FaAlignLeft size={12} />
          </button>
          <button
            className={`text-gray-400 hover:text-white transition ${showQueue ? 'text-green-400' : ''}`}
            onClick={() => setShowQueue(!showQueue)}
            title="Toggle queue"
          >
            <FaListUl size={12} />
          </button>
          {!isPopup && (
            <button
              onClick={toggleFullscreen}
              className="text-gray-400 hover:text-white transition"
              title={isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
            >
              {isFullscreen ? <FaCompress size={14} /> : <FaExpand size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Main Content - Vertical Layout */}
      <div className="relative flex-1 flex flex-col p-3 overflow-hidden">
        {!song ? (
          currentAd ? (
            /* Display Ad - Full 9:16 layout */
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-900">
              {currentAd.imageUrl && (
                <div className="flex-1 overflow-hidden">
                  <img
                    src={currentAd.imageUrl}
                    alt={currentAd.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-shrink-0 p-4 text-center bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 left-0 right-0">
                <h2 className="text-base font-bold mb-2">{currentAd.title}</h2>
                <p className="text-xs text-gray-300 mb-3">
                  {currentAd.description}
                </p>
                {currentAd.ctaText && currentAd.ctaLink && (
                  <button
                    onClick={() => window.open(currentAd.ctaLink, '_blank')}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full text-xs font-semibold transition"
                  >
                    {currentAd.ctaText}
                  </button>
                )}
                {ads.length > 1 && (
                  <div className="flex gap-1 justify-center mt-3">
                    {ads.map((_, idx) => (
                      <button
                        key={idx}
                        className={`w-2 h-2 rounded-full transition ${idx === currentAdIndex % ads.length ? 'bg-white' : 'bg-gray-600'}`}
                        onClick={() => setCurrentAdIndex(idx)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Default Welcome Screen */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <>
                <img
                  src="/images/Logo.svg"
                  alt="BeatFlow"
                  className="w-32 mb-6 opacity-80"
                />
                <h2 className="text-xl font-bold mb-2">Welcome to BeatFlow</h2>
                <p className="text-sm text-gray-400 mb-6">
                  Premium music streaming and licensing platform
                </p>
                <div className="space-y-3 w-full">
                  <div className="bg-white/5 p-3 rounded-lg">
                    <h3 className="text-xs font-semibold text-green-400 mb-1">🎵 Curated Music</h3>
                    <p className="text-xs text-gray-400">Discover handpicked tracks for every mood</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <h3 className="text-xs font-semibold text-blue-400 mb-1">📜 Sync Licensing</h3>
                    <p className="text-xs text-gray-400">Easy licensing for your projects</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <h3 className="text-xs font-semibold text-purple-400 mb-1">🎧 High Quality</h3>
                    <p className="text-xs text-gray-400">Crystal clear audio streaming</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-6">
                  Select a song to start playing
                </p>
              </>
            </div>
          )
        ) : showQueue ? (
          /* Queue View */
          <div className="flex-1 overflow-y-auto">
            <h3 className="text-sm font-bold mb-2">Up Next</h3>
            {queue.length > 0 ? (
              <div className="space-y-2">
                {queue.slice(0, 5).map((item, idx) => {
                  const isCurrentSong = song && item.id === song.id;
                  const isCurrentPlaying = isCurrentSong && isPlaying;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 text-xs p-2 rounded transition ${
                        isCurrentSong ? 'bg-green-500/20 border border-green-500/50' : 'bg-white/5'
                      }`}
                    >
                      <div className="relative w-8 h-8 flex-shrink-0">
                        <img src={item.cover} alt={item.title} className="w-full h-full rounded object-cover" />
                        {isCurrentPlaying && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded">
                            <PlayingIndicator isPlaying={isCurrentPlaying} size="small" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`truncate font-semibold ${isCurrentSong ? 'text-green-400' : ''}`}>
                          {item.title}
                        </p>
                        <p className={`truncate ${isCurrentSong ? 'text-green-300' : 'text-gray-400'}`}>
                          {item.artist}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center">No songs in queue</p>
            )}
          </div>
        ) : showLyrics ? (
          /* Lyrics View */
          <div className="flex-1 overflow-y-auto">
            <h3 className="text-sm font-bold mb-2">Lyrics</h3>
            <div className="text-xs text-gray-300 text-center">
              {song.lyrics || "Lyrics not available for this song"}
            </div>
          </div>
        ) : (
          /* Default View */
          <>
            {/* Album Art - Takes majority of space */}
            <div className="flex-1 mb-3 overflow-hidden rounded-lg">
              <img
                src={song.cover || "/images/default-cover.jpg"}
                alt={song.title}
                className="w-full h-full object-cover shadow-lg"
              />
            </div>

            {/* Song Info */}
            <div className="text-center mb-2 px-1 flex-shrink-0">
              <p className="font-bold text-sm truncate mb-1">{song.title}</p>
              <p className="text-xs text-gray-400 truncate">{song.artist}</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-2 flex-shrink-0">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-3 mb-2 flex-shrink-0">
              <button
                className={`text-gray-400 hover:text-white transition ${
                  shuffle ? "text-white" : ""
                }`}
                onClick={onShuffleToggle}
                title="Shuffle"
              >
                <FaRandom size={12} />
              </button>
              <button
                className="text-gray-400 hover:text-white transition"
                onClick={onPrevSong}
                title="Previous"
              >
                <FaStepBackward size={14} />
              </button>
              <button
                onClick={onTogglePlay}
                className={`bg-white text-black rounded-full w-9 h-9 flex items-center justify-center hover:scale-110 transition-transform shadow-lg ${
                  isPlaying ? 'animate-pulse' : ''
                }`}
                title="Play/Pause"
              >
                {isPlaying ? <FaPause size={12} /> : <FaPlay size={12} />}
              </button>
              <button
                className="text-gray-400 hover:text-white transition"
                onClick={onNextSong}
                title="Next"
              >
                <FaStepForward size={14} />
              </button>
              <button
                className={`text-gray-400 hover:text-white transition ${
                  repeatMode !== REPEAT_OFF ? "text-white" : ""
                }`}
                onClick={onCycleRepeat}
                title={repeatMode === REPEAT_ONE ? "Repeat One" : repeatMode === REPEAT_ALL ? "Repeat All" : "Repeat Off"}
              >
                {repeatMode === REPEAT_ONE ? (
                  <div className="relative">
                    <FaRedoAlt size={12} />
                    <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold">
                      1
                    </span>
                  </div>
                ) : (
                  <FaRedoAlt size={12} />
                )}
              </button>
            </div>

            {/* Volume Control & Add to Playlist */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={toggleMute}
                className="text-gray-400 hover:text-white transition flex-shrink-0"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || localVolume === 0 ? <FaVolumeMute size={12} /> : <FaVolumeUp size={12} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={localVolume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
              <div className="ml-auto relative">
                {/* Custom inline playlist button for mini player */}
                <button
                  className="text-gray-400 hover:text-green-500 transition"
                  onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
                  title="Add to Playlist"
                >
                  ➕
                </button>
                {showPlaylistMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-gray-800 text-white p-2 rounded shadow-lg w-40 z-50 max-h-48 overflow-y-auto">
                    {playlists.length === 0 ? (
                      <p className="text-xs text-gray-400">No playlists</p>
                    ) : (
                      playlists.map((playlist) => (
                        <button
                          key={playlist.id}
                          className="block w-full text-left text-xs p-2 hover:bg-gray-700 rounded"
                          onClick={() => {
                            addSong(playlist.id, song);
                            setShowPlaylistMenu(false);
                          }}
                        >
                          {playlist.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
