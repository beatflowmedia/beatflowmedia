// src/components/PlayerProgress.js
import { useState, useRef, useEffect, memo , useCallback } from "react";
import { usePlayer } from "../context/PlayerContext";
import classNames from "classnames";

/**
 * PlayerProgress - A comprehensive progress bar component with seek functionality
 *
 * Features:
 * - Interactive seek bar with time display
 * - Buffer visualization
 * - Hover preview with time tooltip
 * - Touch-friendly for mobile
 * - Keyboard navigation
 * - Smooth animations
 * - Loading states
 */
const PlayerProgress = memo(
  ({
    className = "",
    showTimes = true,
    showBuffer = true,
    variant = "default", // 'default' | 'mini' | 'full'
    ...props
  }) => {
    const { state, dispatch, actions } = usePlayer();
    const { currentTime, duration, isPlaying, queue, currentIndex } = state;
    const [isDragging, setIsDragging] = useState(false);
    const [hoverTime, setHoverTime] = useState(null);
    const [hoverPosition, setHoverPosition] = useState(null);
    const [bufferedRanges, setBufferedRanges] = useState([]);
    const progressRef = useRef(null);
    const audioRef = useRef(null);

    // Get audio element reference
    useEffect(() => {
      const audioElement = document.getElementById("audio-player");
      if (audioElement) {
        audioRef.current = audioElement;
      }
    }, []);

    // Update buffered ranges
    useEffect(() => {
      const updateBuffered = () => {
        if (!audioRef.current || !duration) return;

        const audio = audioRef.current;
        const ranges = [];

        for (let i = 0; i < audio.buffered.length; i++) {
          ranges.push({
            start: audio.buffered.start(i),
            end: audio.buffered.end(i)
          });
        }

        setBufferedRanges(ranges);
      };

      const audio = audioRef.current;
      if (audio) {
        audio.addEventListener("progress", updateBuffered);
        audio.addEventListener("loadedmetadata", updateBuffered);
        updateBuffered();

        return () => {
          audio.removeEventListener("progress", updateBuffered);
          audio.removeEventListener("loadedmetadata", updateBuffered);
        };
      }
    }, [duration, queue, currentIndex]);

    // Format time to MM:SS
    const formatTime = useCallback((seconds) => {
      if (!seconds || isNaN(seconds)) return "0:00";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }, []);

    // Calculate position from mouse/touch event
    const calculatePosition = useCallback(
      (event) => {
        if (!progressRef.current || !duration) return 0;

        const rect = progressRef.current.getBoundingClientRect();
        const clientX = event.touches
          ? event.touches[0].clientX
          : event.clientX;
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percentage = x / rect.width;

        return percentage * duration;
      },
      [duration],
    );

    // Handle seek
    const handleSeek = useCallback(
      (time) => {
        if (!duration || isNaN(time)) return;
        const clampedTime = Math.max(0, Math.min(time, duration));
        dispatch({ type: actions.SET_CURRENT_TIME, payload: clampedTime });
      },
      [duration, dispatch, actions],
    );

    // Mouse events
    const handleMouseDown = useCallback(
      (event) => {
        if (!duration) return;
        event.preventDefault();
        setIsDragging(true);
        const time = calculatePosition(event);
        handleSeek(time);
      },
      [duration, calculatePosition, handleSeek],
    );

    const handleMouseMove = useCallback(
      (event) => {
        if (!progressRef.current || !duration) return;

        const time = calculatePosition(event);
        setHoverTime(time);

        const rect = progressRef.current.getBoundingClientRect();
        const clientX = event.touches
          ? event.touches[0].clientX
          : event.clientX;
        setHoverPosition(clientX - rect.left);

        if (isDragging) {
          handleSeek(time);
        }
      },
      [duration, calculatePosition, isDragging, handleSeek],
    );

    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
    }, []);

    const handleMouseLeave = useCallback(() => {
      setHoverTime(null);
      setHoverPosition(null);
      setIsDragging(false);
    }, []);

    // Touch events
    const handleTouchStart = useCallback(
      (event) => {
        handleMouseDown(event);
      },
      [handleMouseDown],
    );

    const handleTouchMove = useCallback(
      (event) => {
        event.preventDefault();
        handleMouseMove(event);
      },
      [handleMouseMove],
    );

    const handleTouchEnd = useCallback(() => {
      handleMouseUp();
    }, [handleMouseUp]);

    // Keyboard navigation
    const handleKeyDown = useCallback(
      (event) => {
        if (!duration) return;

        let newTime = currentTime;

        switch (event.key) {
          case "ArrowLeft":
            event.preventDefault();
            newTime = Math.max(0, currentTime - 5);
            break;
          case "ArrowRight":
            event.preventDefault();
            newTime = Math.min(duration, currentTime + 5);
            break;
          case "Home":
            event.preventDefault();
            newTime = 0;
            break;
          case "End":
            event.preventDefault();
            newTime = duration;
            break;
          default:
            return;
        }

        handleSeek(newTime);
      },
      [duration, currentTime, handleSeek],
    );

    // Global mouse events for dragging
    useEffect(() => {
      if (!isDragging) return;

      const handleGlobalMouseMove = (event) => {
        if (!progressRef.current || !duration) return;
        const time = calculatePosition(event);
        handleSeek(time);
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
      document.addEventListener("touchmove", handleGlobalMouseMove);
      document.addEventListener("touchend", handleGlobalMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove);
        document.removeEventListener("mouseup", handleGlobalMouseUp);
        document.removeEventListener("touchmove", handleGlobalMouseMove);
        document.removeEventListener("touchend", handleGlobalMouseUp);
      };
    }, [isDragging, calculatePosition, handleSeek, duration]);

    // Calculate progress percentage
    const progressPercentage =
      duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

    // Variant styles
    const variants = {
      default: {
        container: "w-full",
        track: "h-1",
        thumb: "w-3 h-3",
        times: "text-xs"
      },
      mini: {
        container: "w-full",
        track: "h-0.5",
        thumb: "w-2 h-2",
        times: "text-xs"
      },
      full: {
        container: "w-full",
        track: "h-2",
        thumb: "w-4 h-4",
        times: "text-sm"
      }
    };

    const variantStyles = variants[variant] || variants.default;

    if (!queue.length || !queue[currentIndex]) {
      return (
        <div className={classNames("flex items-center space-x-3", className)}>
          {showTimes && (
            <span
              className={classNames(
                "text-gray-400 font-mono",
                variantStyles.times,
              )}
            >
              0:00
            </span>
          )}
          <div
            className={classNames(
              "flex-1 bg-gray-700 rounded-full",
              variantStyles.track,
            )}
          >
            <div className="h-full bg-gray-600 rounded-full animate-pulse"></div>
          </div>
          {showTimes && (
            <span
              className={classNames(
                "text-gray-400 font-mono",
                variantStyles.times,
              )}
            >
              0:00
            </span>
          )}
        </div>
      );
    }

    return (
      <div
        className={classNames("flex items-center space-x-3", className)}
        {...props}
      >
        {/* Current time */}
        {showTimes && (
          <span
            className={classNames(
              "text-gray-300 font-mono tabular-nums",
              variantStyles.times,
            )}
          >
            {formatTime(currentTime)}
          </span>
        )}

        {/* Progress bar container */}
        <div className="flex-1 relative group">
          <div
            ref={progressRef}
            className={classNames(
              "relative bg-gray-700 rounded-full cursor-pointer",
              "focus:outline-none focus:ring-2 focus:ring-green-500",
              variantStyles.track,
            )}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={duration || 100}
            aria-valuenow={currentTime || 0}
            aria-label="Seek slider"
          >
            {/* Buffer indicators */}
            {showBuffer &&
              bufferedRanges.map((range, index) => (
                <div
                  key={index}
                  className="absolute top-0 h-full bg-gray-600 rounded-full"
                  style={{
                    left: `${(range.start / duration) * 100}%`,
                    width: `${((range.end - range.start) / duration) * 100}%`
                  }}
                />
              ))}

            {/* Progress fill */}
            <div
              className={classNames(
                "absolute top-0 h-full bg-green-500 rounded-full transition-all duration-100",
                isPlaying && "shadow-glow-green",
              )}
              style={{ width: `${progressPercentage}%` }}
            />

            {/* Progress thumb */}
            <div
              className={classNames(
                "absolute top-1/2 transform -translate-y-1/2 bg-white rounded-full",
                "transition-all duration-200 shadow-lg",
                "opacity-0 group-hover:opacity-100",
                isDragging && "opacity-100 scale-125",
                variantStyles.thumb,
              )}
              style={{
                left: `${progressPercentage}%`,
                marginLeft: `-${parseInt(variantStyles.thumb.split(" ")[0].replace("w-", "")) * 2}px`
              }}
            />

            {/* Hover tooltip */}
            {hoverTime !== null && hoverPosition !== null && !isDragging && (
              <div
                className="absolute bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg pointer-events-none z-10"
                style={{
                  left: hoverPosition,
                  transform: "translateX(-50%)"
                }}
              >
                {formatTime(hoverTime)}
              </div>
            )}
          </div>
        </div>

        {/* Duration */}
        {showTimes && (
          <span
            className={classNames(
              "text-gray-400 font-mono tabular-nums",
              variantStyles.times,
            )}
          >
            {formatTime(duration)}
          </span>
        )}
      </div>
    );
  },
);

PlayerProgress.displayName = "PlayerProgress";

export default PlayerProgress;
