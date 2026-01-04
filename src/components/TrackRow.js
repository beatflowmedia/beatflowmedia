// src/components/TrackRow.js
import { getPlaceholderImage } from "../utils/placeholders";
import { useState, memo , useCallback, useEffect } from "react";
import {
  FaPlay,
  FaPause,
  FaHeart,
  FaRegHeart,
  FaEllipsisH,
  FaClock,
  FaPlus,
  FaShoppingCart,
  FaCheckCircle,
  FaDownload
} from "react-icons/fa";
import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import classNames from "classnames";
import { useNavigate } from "react-router-dom";
import { stripeService } from "../services/stripeService";

/**
 * TrackRow - A comprehensive track listing component with play button, metadata, and actions
 *
 * Features:
 * - Play/pause states with visual feedback
 * - Like/unlike functionality
 * - Context menu with actions
 * - Duration display
 * - Hover effects and micro-animations
 * - Accessibility support
 * - Loading states
 */
const TrackRow = memo(
  ({
    track,
    index,
    isCurrentTrack = false,
    showAlbum = true,
    showAddedDate = false,
    onContextMenu = null,
    className = "",
    variant = "default", // 'default' | 'compact' | 'queue'
    ...props
  }) => {
    const { state, dispatch, actions } = usePlayer();
    const { isPlaying, currentIndex, queue } = state;
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isLiked, setIsLiked] = useState(track?.isLiked || false);
    const [isHovered, setIsHovered] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPurchased, setIsPurchased] = useState(track?.isPurchased || false);

    // Check if this track is currently playing
    const isActive = isCurrentTrack || queue[currentIndex]?.id === track?.id;
    const showPlayIcon = isHovered || isActive;

    // Listen for purchase completion events to update UI in real-time
    useEffect(() => {
      const handlePurchaseComplete = (event) => {
        if (event.detail?.itemId === track?.id) {
          setIsPurchased(true);
        }
      };

      window.addEventListener('purchaseComplete', handlePurchaseComplete);
      return () => window.removeEventListener('purchaseComplete', handlePurchaseComplete);
    }, [track?.id]);

    // Format duration
    const formatDuration = useCallback((seconds) => {
      if (!seconds || isNaN(seconds)) return "--:--";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }, []);

    // Format date
    const formatDate = useCallback((dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    }, []);

    // Handle play/pause
    const handlePlayPause = useCallback(
      async (e) => {
        e.stopPropagation();

        if (!track) return;

        setIsLoading(true);

        try {
          if (isActive && isPlaying) {
            dispatch({ type: actions.TOGGLE_PLAY });
          } else if (isActive && !isPlaying) {
            dispatch({ type: actions.TOGGLE_PLAY });
          } else {
            dispatch({ type: actions.PLAY_SONG, payload: track });
          }
        } catch (error) {
          console.error("Error playing track:", error);
          toast.error("Failed to play track");
        } finally {
          setIsLoading(false);
        }
      },
      [track, isActive, isPlaying, dispatch, actions],
    );

    // Handle like/unlike
    const handleLike = useCallback(
      async (e) => {
        e.stopPropagation();

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
      },
      [isLiked],
    );

    // Handle context menu
    const handleContextMenu = useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (onContextMenu) {
          onContextMenu(e, track, index);
        } else {
          setShowMenu(!showMenu);
        }
      },
      [onContextMenu, track, index, showMenu],
    );

    // Handle add to queue
    const handleAddToQueue = useCallback(
      (e) => {
        e.stopPropagation();
        dispatch({ type: actions.ENQUEUE, payload: { item: track } });
        toast.success("Added to queue");
      },
      [track, dispatch, actions],
    );

    // Handle purchase
    const handlePurchase = useCallback(
      async (e) => {
        e.stopPropagation();

        if (!user) {
          toast.error('Please sign in to purchase music');
          return;
        }

        // If already purchased, go to downloads
        if (isPurchased) {
          navigate('/downloads');
          return;
        }

        try {
          // Create checkout session
          await stripeService.createSongCheckout(user.uid, track.id, user.email);
        } catch (error) {
          console.error('Purchase error:', error);
          toast.error(`Failed to initiate purchase: ${error.message}`);
        }
      },
      [user, track, navigate, isPurchased],
    );

    // Keyboard navigation
    const handleKeyDown = useCallback(
      (e) => {
        switch (e.key) {
          case "Enter":
          case " ":
            e.preventDefault();
            handlePlayPause(e);
            break;
          case "l":
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              handleLike(e);
            }
            break;
          case "q":
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              handleAddToQueue(e);
            }
            break;
          default:
            break;
        }
      },
      [handlePlayPause, handleLike, handleAddToQueue],
    );

    if (!track) {
      return (
        <div
          className={classNames(
            "flex items-center p-3 animate-pulse",
            className,
          )}
        >
          <div className="w-8 h-8 bg-gray-300 rounded mr-3"></div>
          <div className="w-12 h-12 bg-gray-300 rounded mr-3"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
          <div className="w-16 h-4 bg-gray-300 rounded"></div>
        </div>
      );
    }

    const rowVariants = {
      default: "p-3 hover:bg-gray-800/50",
      compact: "p-2 hover:bg-gray-800/30",
      queue: "p-2 hover:bg-gray-700/50"
    };

    return (
      <div
        className={classNames(
          "group flex items-center w-full transition-all duration-200 cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-gray-800/50",
          rowVariants[variant],
          isActive && "bg-gray-800/30 text-green-400",
          className,
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onContextMenu={handleContextMenu}
        onClick={handlePlayPause}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`${isActive && isPlaying ? "Pause" : "Play"} ${track.title} by ${track.artist}`}
        {...props}
      >
        {/* Index/Play Button */}
        <div className="w-8 flex items-center justify-center mr-3">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          ) : showPlayIcon ? (
            <button
              className={classNames(
                "w-6 h-6 flex items-center justify-center rounded-full transition-all duration-200",
                "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500",
                isActive && isPlaying
                  ? "text-green-400"
                  : "text-white bg-green-500 hover:bg-green-400",
              )}
              onClick={handlePlayPause}
              aria-label={isActive && isPlaying ? "Pause" : "Play"}
            >
              {isActive && isPlaying ? (
                <FaPause size={10} />
              ) : (
                <FaPlay size={10} />
              )}
            </button>
          ) : (
            <span className="text-sm text-gray-400 font-mono">
              {index !== undefined ? index + 1 : "•"}
            </span>
          )}
        </div>

        {/* Album Art */}
        <div className="w-12 h-12 mr-3 flex-shrink-0">
          <img
            src={
              track.cover ||
              track.coverUrl ||
              getPlaceholderImage(48, 48, "♪")
            }
            alt={`${track.title} cover`}
            className={classNames(
              "w-full h-full object-cover rounded transition-all duration-200",
              "group-hover:shadow-lg",
              isActive && "ring-2 ring-green-500",
            )}
            loading="lazy"
            onError={(e) => {
              e.target.src = getPlaceholderImage(48, 48, "♪");
            }}
          />
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center">
            <h3
              className={classNames(
                "font-medium truncate text-sm",
                isActive ? "text-green-400" : "text-white",
              )}
            >
              {track.title}
            </h3>
            {isPurchased && (
              <FaCheckCircle
                className="ml-1.5 text-green-500"
                size={12}
                title="Purchased"
              />
            )}
            {track.isExplicit && (
              <span className="ml-1 px-1 py-0.5 bg-gray-600 text-white text-xs rounded">
                E
              </span>
            )}
          </div>
          <div className="flex items-center text-xs text-gray-400 mt-0.5">
            <span className="truncate">{track.artist}</span>
            {showAlbum && track.album && (
              <>
                <span className="mx-1">•</span>
                <span className="truncate">{track.album}</span>
              </>
            )}
          </div>
        </div>

        {/* Added Date (optional) */}
        {showAddedDate && track.addedAt && (
          <div className="text-xs text-gray-400 mr-4 hidden md:block">
            {formatDate(track.addedAt)}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Like Button */}
          <button
            className={classNames(
              "p-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-200",
              "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500",
              isLiked
                ? "text-green-500 opacity-100"
                : "text-gray-400 hover:text-white",
            )}
            onClick={handleLike}
            aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
          >
            {isLiked ? <FaHeart size={14} /> : <FaRegHeart size={14} />}
          </button>

          {/* Add to Queue */}
          <button
            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-400 hover:text-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500"
            onClick={handleAddToQueue}
            aria-label="Add to queue"
          >
            <FaPlus size={12} />
          </button>

          {/* Duration */}
          <div className="flex items-center text-xs text-gray-400 w-12 justify-end">
            <FaClock size={10} className="mr-1 opacity-50" />
            {formatDuration(track.duration)}
          </div>

          {/* More Options */}
          <button
            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-400 hover:text-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500"
            onClick={handleContextMenu}
            aria-label="More options"
          >
            <FaEllipsisH size={12} />
          </button>
        </div>

        {/* Context Menu (if no external handler) */}
        {showMenu && !onContextMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-50 border border-gray-700">
            <div className="py-1">
              <button
                className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
                onClick={handlePlayPause}
              >
                Play Now
              </button>
              <button
                className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
                onClick={handleAddToQueue}
              >
                Add to queue
              </button>
              <button className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700">
                Add to playlist
              </button>
              <button className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700">
                Go to artist
              </button>
              <button className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700">
                Go to album
              </button>
              <hr className="border-gray-700 my-1" />
              <button className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700">
                Share
              </button>
              <hr className="border-gray-700 my-1" />
              <button
                className="flex items-center w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
                onClick={handlePurchase}
              >
                {isPurchased ? (
                  <>
                    <FaDownload className="mr-2 text-green-500" size={14} />
                    Download
                  </>
                ) : (
                  <>
                    <FaShoppingCart className="mr-2 text-green-500" size={14} />
                    Purchase ($1.99)
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
);

TrackRow.displayName = "TrackRow";

export default TrackRow;
