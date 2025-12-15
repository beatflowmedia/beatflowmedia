// src/components/NowPlayingBar.js
import { useState, memo, useRef, useEffect , useCallback } from "react";
import {
  FaPlay,
  FaPause,
  FaStepBackward,
  FaStepForward,
  FaRandom,
  FaRedoAlt,
  FaVolumeUp,
  FaVolumeDown,
  FaVolumeMute,
  FaHeart,
  FaRegHeart,
  FaExpand,
  FaListUl
} from "react-icons/fa";
import { usePlayer } from "../context/PlayerContext";
import PlayerProgress from "./PlayerProgress";
import { toast } from "react-hot-toast";
import classNames from "classnames";

/**
 * NowPlayingBar - A comprehensive mini player with controls and track info
 *
 * Features:
 * - Track information with album art
 * - Playback controls (play/pause, skip, shuffle, repeat)
 * - Progress bar with seek functionality
 * - Volume control with mute
 * - Like/unlike functionality
 * - Queue panel toggle
 * - Expand to full player
 * - Responsive design
 * - Keyboard shortcuts
 */
const NowPlayingBar = memo(
  ({ onQueueToggle = null, onExpand = null, className = "", ...props }) => {
    const { state, dispatch, actions } = usePlayer();
    const {
      queue,
      currentIndex,
      isPlaying,
      shuffleOn,
      repeatMode,
      volume,
      currentTime,
      duration
    } = state;

    const [isLiked, setIsLiked] = useState(false);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [previousVolume, setPreviousVolume] = useState(volume);
    const volumeRef = useRef(null);
    const volumeSliderRef = useRef(null);

    const currentTrack = queue[currentIndex] || null;

    // Initialize like status
    useEffect(() => {
      if (currentTrack) {
        setIsLiked(currentTrack.isLiked || false);
      }
    }, [currentTrack]);

    // Handle volume slider visibility
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          volumeRef.current &&
          !volumeRef.current.contains(event.target) &&
          volumeSliderRef.current &&
          !volumeSliderRef.current.contains(event.target)
        ) {
          setShowVolumeSlider(false);
        }
      };

      if (showVolumeSlider) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [showVolumeSlider]);

    // Playback controls
    const togglePlay = useCallback(() => {
      dispatch({ type: actions.TOGGLE_PLAY });
    }, [dispatch, actions]);

    const skipPrevious = useCallback(() => {
      dispatch({ type: actions.SKIP_PREVIOUS });
    }, [dispatch, actions]);

    const skipNext = useCallback(() => {
      dispatch({ type: actions.SKIP_NEXT });
    }, [dispatch, actions]);

    const toggleShuffle = useCallback(() => {
      dispatch({ type: actions.TOGGLE_SHUFFLE });
      toast.success(`Shuffle ${!shuffleOn ? "enabled" : "disabled"}`);
    }, [dispatch, actions, shuffleOn]);

    const cycleRepeat = useCallback(() => {
      dispatch({ type: actions.CYCLE_REPEAT });
      const nextMode =
        repeatMode === "OFF" ? "ALL" : repeatMode === "ALL" ? "ONE" : "OFF";
      toast.success(`Repeat ${nextMode.toLowerCase()}`);
    }, [dispatch, actions, repeatMode]);

    // Volume controls
    const toggleMute = useCallback(() => {
      if (volume > 0) {
        setPreviousVolume(volume);
        dispatch({ type: actions.SET_VOLUME, payload: 0 });
      } else {
        dispatch({ type: actions.SET_VOLUME, payload: previousVolume || 0.5 });
      }
    }, [volume, previousVolume, dispatch, actions]);

    const handleVolumeChange = useCallback(
      (newVolume) => {
        dispatch({ type: actions.SET_VOLUME, payload: newVolume });
      },
      [dispatch, actions],
    );

    const handleVolumeWheel = useCallback(
      (event) => {
        event.preventDefault();
        const delta = event.deltaY > 0 ? -0.05 : 0.05;
        const newVolume = Math.max(0, Math.min(1, volume + delta));
        handleVolumeChange(newVolume);
      },
      [volume, handleVolumeChange],
    );

    // Like functionality
    const toggleLike = useCallback(async () => {
      if (!currentTrack) return;

      try {
        setIsLiked(!isLiked);
        // TODO: Integrate with backend API
        toast.success(
          isLiked ? "Removed from favorites" : "Added to favorites",
        );
      } catch (error) {
        setIsLiked(isLiked); // Revert on error
        toast.error("Failed to update favorites");
      }
    }, [currentTrack, isLiked]);

    // Keyboard shortcuts
    useEffect(() => {
      const handleKeyPress = (event) => {
        // Only handle if not in an input field
        if (
          event.target.tagName === "INPUT" ||
          event.target.tagName === "TEXTAREA"
        ) {
          return;
        }

        switch (event.key) {
          case " ":
            event.preventDefault();
            togglePlay();
            break;
          case "ArrowLeft":
            if (event.shiftKey) {
              event.preventDefault();
              skipPrevious();
            }
            break;
          case "ArrowRight":
            if (event.shiftKey) {
              event.preventDefault();
              skipNext();
            }
            break;
          case "s":
            if (event.ctrlKey || event.metaKey) {
              event.preventDefault();
              toggleShuffle();
            }
            break;
          case "r":
            if (event.ctrlKey || event.metaKey) {
              event.preventDefault();
              cycleRepeat();
            }
            break;
          case "l":
            if (event.ctrlKey || event.metaKey) {
              event.preventDefault();
              toggleLike();
            }
            break;
          case "m":
            if (event.ctrlKey || event.metaKey) {
              event.preventDefault();
              toggleMute();
            }
            break;
          default:
            break;
        }
      };

      document.addEventListener("keydown", handleKeyPress);
      return () => document.removeEventListener("keydown", handleKeyPress);
    }, [
      togglePlay,
      skipPrevious,
      skipNext,
      toggleShuffle,
      cycleRepeat,
      toggleLike,
      toggleMute,
    ]);

    // Get volume icon
    const getVolumeIcon = () => {
      if (volume === 0) return FaVolumeMute;
      if (volume < 0.5) return FaVolumeDown;
      return FaVolumeUp;
    };

    const VolumeIcon = getVolumeIcon();

    if (!currentTrack) {
      return null;
    }

    return (
      <div
        className={classNames(
          "fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-40",
          "flex items-center justify-between px-4 py-3",
          className,
        )}
        {...props}
      >
        {/* Track Info */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <img
            src={
              currentTrack.cover ||
              currentTrack.coverUrl ||
              "https://via.placeholder.com/56?text=♪"
            }
            alt={`${currentTrack.title} cover`}
            className="w-14 h-14 rounded object-cover shadow-lg"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/56?text=♪";
            }}
          />

          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium text-sm truncate">
              {currentTrack.title}
            </h4>
            <p className="text-gray-400 text-xs truncate">
              {currentTrack.artist}
            </p>
          </div>

          {/* Like button */}
          <button
            onClick={toggleLike}
            className={classNames(
              "p-2 rounded-full transition-all duration-200 hover:scale-110",
              "focus:outline-none focus:ring-2 focus:ring-green-500",
              isLiked ? "text-green-500" : "text-gray-400 hover:text-white",
            )}
            aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
          >
            {isLiked ? <FaHeart size={16} /> : <FaRegHeart size={16} />}
          </button>
        </div>

        {/* Playback Controls */}
        <div className="flex flex-col items-center flex-1 max-w-2xl">
          {/* Control buttons */}
          <div className="flex items-center space-x-4 mb-2">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={classNames(
                "p-2 rounded-full transition-all duration-200 hover:scale-110",
                "focus:outline-none focus:ring-2 focus:ring-green-500",
                shuffleOn ? "text-green-500" : "text-gray-400 hover:text-white",
              )}
              aria-label={`Shuffle ${shuffleOn ? "enabled" : "disabled"}`}
            >
              <FaRandom size={14} />
            </button>

            {/* Previous */}
            <button
              onClick={skipPrevious}
              className="p-2 text-gray-400 hover:text-white transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-full"
              aria-label="Previous track"
            >
              <FaStepBackward size={16} />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <FaPause size={16} />
              ) : (
                <FaPlay size={16} className="ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={skipNext}
              className="p-2 text-gray-400 hover:text-white transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-full"
              aria-label="Next track"
            >
              <FaStepForward size={16} />
            </button>

            {/* Repeat */}
            <button
              onClick={cycleRepeat}
              className={classNames(
                "p-2 rounded-full transition-all duration-200 hover:scale-110",
                "focus:outline-none focus:ring-2 focus:ring-green-500",
                repeatMode !== "OFF"
                  ? "text-green-500"
                  : "text-gray-400 hover:text-white",
              )}
              aria-label={`Repeat ${repeatMode.toLowerCase()}`}
            >
              <FaRedoAlt size={14} />
              {repeatMode === "ONE" && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center text-black text-xs font-bold">
                  1
                </span>
              )}
            </button>
          </div>

          {/* Progress bar */}
          <PlayerProgress variant="mini" className="w-full max-w-lg" />
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2 flex-1 justify-end">
          {/* Volume Control */}
          <div className="relative flex items-center">
            <button
              ref={volumeRef}
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              onWheel={handleVolumeWheel}
              className="p-2 text-gray-400 hover:text-white transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-full"
              aria-label={`Volume ${Math.round(volume * 100)}%`}
            >
              <VolumeIcon size={16} />
            </button>

            {/* Volume slider */}
            {showVolumeSlider && (
              <div
                ref={volumeSliderRef}
                className="absolute bottom-full right-0 mb-2 p-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700"
              >
                <div className="flex flex-col items-center h-24">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) =>
                      handleVolumeChange(parseFloat(e.target.value))
                    }
                    className="h-16 w-1 bg-gray-600 rounded-lg appearance-none cursor-pointer volume-slider"
                    style={{
                      writingMode: "bt-lr",
                      WebkitAppearance: "slider-vertical"
                    }}
                    aria-label="Volume"
                  />
                  <span className="text-xs text-gray-400 mt-1">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Queue toggle */}
          {onQueueToggle && (
            <button
              onClick={onQueueToggle}
              className="p-2 text-gray-400 hover:text-white transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-full"
              aria-label="Toggle queue"
            >
              <FaListUl size={16} />
            </button>
          )}

          {/* Expand button */}
          {onExpand && (
            <button
              onClick={onExpand}
              className="p-2 text-gray-400 hover:text-white transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-full"
              aria-label="Expand player"
            >
              <FaExpand size={14} />
            </button>
          )}
        </div>

        {/* CSS for volume slider */}
        <style jsx>{`
          .volume-slider::-webkit-slider-thumb {
            appearance: none;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #10b981;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }

          .volume-slider::-webkit-slider-track {
            width: 4px;
            height: 100%;
            cursor: pointer;
            background: #4b5563;
            border-radius: 2px;
          }

          .volume-slider::-moz-range-thumb {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #10b981;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }

          .volume-slider::-moz-range-track {
            width: 4px;
            height: 100%;
            cursor: pointer;
            background: #4b5563;
            border-radius: 2px;
          }
        `}</style>
      </div>
    );
  },
);

NowPlayingBar.displayName = "NowPlayingBar";

export default NowPlayingBar;
