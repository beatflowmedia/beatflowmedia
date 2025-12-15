// src/components/PlaylistHeader.js
import { useState, memo, useEffect, useRef , useCallback } from "react";
import {
  FaPlay,
  FaPause,
  FaRandom,
  FaHeart,
  FaRegHeart,
  FaEllipsisH,
  FaUserPlus,
  FaUserCheck,
  FaDownload,
  FaShare
} from "react-icons/fa";
import { usePlayer } from "../context/PlayerContext";
import { toast } from "react-hot-toast";
import classNames from "classnames";

/**
 * PlaylistHeader - A comprehensive playlist header component with cover art, metadata, and controls
 *
 * Features:
 * - Large cover art with gradient overlay
 * - Playlist metadata (title, creator, description, track count, duration)
 * - Play all and shuffle controls
 * - Follow/unfollow functionality
 * - Download and share options
 * - Responsive design with loading states
 * - Accessibility support
 */
const PlaylistHeader = memo(
  ({
    playlist,
    tracks = [],
    isOwner = false,
    onEdit = null,
    onDelete = null,
    className = "",
    ...props
  }) => {
    const { state, dispatch, actions } = usePlayer();
    const { isPlaying, queue, currentIndex } = state;
    const [isFollowing, setIsFollowing] = useState(
      playlist?.isFollowing || false,
    );
    const [showMenu, setShowMenu] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [gradientColor, setGradientColor] = useState("#1f2937");
    const canvasRef = useRef(null);

    // Calculate total duration
    const totalDuration = tracks.reduce(
      (acc, track) => acc + (track.duration || 0),
      0,
    );

    // Format duration
    const formatDuration = useCallback((seconds) => {
      if (!seconds || isNaN(seconds)) return "0 min";
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);

      if (hours > 0) {
        return `${hours} hr ${mins} min`;
      }
      return `${mins} min`;
    }, []);

    // Format track count
    const formatTrackCount = useCallback((count) => {
      return `${count} ${count === 1 ? "song" : "songs"}`;
    }, []);

    // Extract dominant color from album art
    const extractDominantColor = useCallback((imageUrl) => {
      if (!imageUrl || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.crossOrigin = "anonymous";
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const { data } = imageData;

          let r = 0,
            g = 0,
            b = 0;
          let pixelCount = 0;

          // Sample every 10th pixel for performance
          for (let i = 0; i < data.length; i += 40) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            pixelCount++;
          }

          r = Math.floor(r / pixelCount);
          g = Math.floor(g / pixelCount);
          b = Math.floor(b / pixelCount);

          // Darken the color for better contrast
          r = Math.floor(r * 0.6);
          g = Math.floor(g * 0.6);
          b = Math.floor(b * 0.6);

          setGradientColor(`rgb(${r}, ${g}, ${b})`);
        } catch (error) {
          console.log("Could not extract color from image");
        }
      };

      img.src = imageUrl;
    }, []);

    useEffect(() => {
      if (playlist?.cover && imageLoaded) {
        extractDominantColor(playlist.cover);
      }
    }, [playlist?.cover, imageLoaded, extractDominantColor]);

    // Check if playlist is currently playing
    const isPlaylistPlaying = useCallback(() => {
      if (!tracks.length || !queue.length) return false;
      const currentTrack = queue[currentIndex];
      return tracks.some((track) => track.id === currentTrack?.id) && isPlaying;
    }, [tracks, queue, currentIndex, isPlaying]);

    // Handle play all
    const handlePlayAll = useCallback(async () => {
      if (!tracks.length) {
        toast.error("No tracks to play");
        return;
      }

      setIsLoading(true);

      try {
        if (isPlaylistPlaying()) {
          dispatch({ type: actions.TOGGLE_PLAY });
        } else {
          // Set entire playlist as queue and start playing
          dispatch({
            type: actions.SET_QUEUE,
            payload: { queue: tracks, currentIndex: 0 }
          });
          dispatch({ type: actions.PLAY_AT, payload: 0 });
        }
      } catch (error) {
        console.error("Error playing playlist:", error);
        toast.error("Failed to play playlist");
      } finally {
        setIsLoading(false);
      }
    }, [tracks, isPlaylistPlaying, dispatch, actions]);

    // Handle shuffle play
    const handleShufflePlay = useCallback(async () => {
      if (!tracks.length) {
        toast.error("No tracks to shuffle");
        return;
      }

      setIsLoading(true);

      try {
        // Create shuffled copy of tracks
        const shuffledTracks = [...tracks].sort(() => Math.random() - 0.5);

        dispatch({
          type: actions.SET_QUEUE,
          payload: { queue: shuffledTracks, currentIndex: 0 }
        });
        dispatch({ type: actions.TOGGLE_SHUFFLE }); // Enable shuffle mode
        dispatch({ type: actions.PLAY_AT, payload: 0 });
      } catch (error) {
        console.error("Error shuffling playlist:", error);
        toast.error("Failed to shuffle playlist");
      } finally {
        setIsLoading(false);
      }
    }, [tracks, dispatch, actions]);

    // Handle follow/unfollow
    const handleFollow = useCallback(async () => {
      try {
        setIsFollowing(!isFollowing);
        // TODO: Integrate with backend API
        toast.success(
          isFollowing ? "Unfollowed playlist" : "Following playlist",
        );
      } catch (error) {
        setIsFollowing(isFollowing); // Revert on error
        toast.error("Failed to update following status");
      }
    }, [isFollowing]);

    // Handle download
    const handleDownload = useCallback(() => {
      // TODO: Implement download functionality
      toast.info("Download feature coming soon");
    }, []);

    // Handle share
    const handleShare = useCallback(async () => {
      try {
        if (navigator.share && playlist) {
          await navigator.share({
            title: playlist.title,
            text: `Check out this playlist: ${playlist.title}`,
            url: window.location.href
          });
        } else {
          // Fallback to clipboard
          await navigator.clipboard.writeText(window.location.href);
          toast.success("Link copied to clipboard");
        }
      } catch (error) {
        toast.error("Failed to share playlist");
      }
    }, [playlist]);

    if (!playlist) {
      return (
        <div className={classNames("p-8 animate-pulse", className)}>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-64 h-64 bg-gray-300 rounded-lg"></div>
            <div className="flex-1 space-y-4">
              <div className="h-8 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={classNames("relative overflow-hidden rounded-lg", className)}
        style={{
          background: `linear-gradient(135deg, ${gradientColor} 0%, #1f2937 50%, #111827 100%)`
        }}
        {...props}
      >
        {/* Background blur effect */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>

        {/* Content */}
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Album Art */}
            <div className="flex-shrink-0">
              <div className="relative group">
                <img
                  src={
                    playlist.cover || "https://via.placeholder.com/256?text=♪"
                  }
                  alt={`${playlist.title} cover`}
                  className={classNames(
                    "w-64 h-64 object-cover rounded-lg shadow-2xl transition-all duration-300",
                    "group-hover:shadow-3xl group-hover:scale-105",
                    !imageLoaded && "opacity-0",
                  )}
                  onLoad={() => setImageLoaded(true)}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/256?text=♪";
                    setImageLoaded(true);
                  }}
                />

                {/* Play overlay on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                  <button
                    onClick={handlePlayAll}
                    disabled={isLoading}
                    className="w-16 h-16 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center text-black transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-500/50"
                    aria-label={
                      isPlaylistPlaying() ? "Pause playlist" : "Play playlist"
                    }
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : isPlaylistPlaying() ? (
                      <FaPause size={20} />
                    ) : (
                      <FaPlay size={20} className="ml-1" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex-1 flex flex-col justify-end space-y-4">
              {/* Type */}
              <p className="text-sm font-medium text-white/80 uppercase tracking-wide">
                {playlist.type || "Playlist"}
              </p>

              {/* Title */}
              <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                {playlist.title}
              </h1>

              {/* Description */}
              {playlist.description && (
                <p className="text-white/80 text-lg max-w-2xl line-clamp-2">
                  {playlist.description}
                </p>
              )}

              {/* Creator and stats */}
              <div className="flex items-center space-x-2 text-white/80">
                {playlist.creator && (
                  <>
                    <img
                      src={
                        playlist.creator.avatar ||
                        "https://via.placeholder.com/24?text=U"
                      }
                      alt={playlist.creator.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="font-medium hover:underline cursor-pointer">
                      {playlist.creator.name}
                    </span>
                    <span>•</span>
                  </>
                )}
                <span>{formatTrackCount(tracks.length)}</span>
                {totalDuration > 0 && (
                  <>
                    <span>•</span>
                    <span>{formatDuration(totalDuration)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-4 mt-8">
            {/* Play button */}
            <button
              onClick={handlePlayAll}
              disabled={isLoading || !tracks.length}
              className={classNames(
                "w-14 h-14 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center",
                "text-black transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500/50",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
              )}
              aria-label={
                isPlaylistPlaying() ? "Pause playlist" : "Play playlist"
              }
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : isPlaylistPlaying() ? (
                <FaPause size={18} />
              ) : (
                <FaPlay size={18} className="ml-1" />
              )}
            </button>

            {/* Shuffle button */}
            <button
              onClick={handleShufflePlay}
              disabled={isLoading || !tracks.length}
              className="w-12 h-12 bg-transparent border-2 border-white/20 hover:border-white/40 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Shuffle play"
            >
              <FaRandom size={16} />
            </button>

            {/* Follow button (if not owner) */}
            {!isOwner && (
              <button
                onClick={handleFollow}
                className="w-12 h-12 bg-transparent border-2 border-white/20 hover:border-white/40 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/20"
                aria-label={
                  isFollowing ? "Unfollow playlist" : "Follow playlist"
                }
              >
                {isFollowing ? (
                  <FaUserCheck size={16} />
                ) : (
                  <FaUserPlus size={16} />
                )}
              </button>
            )}

            {/* Download button */}
            <button
              onClick={handleDownload}
              className="w-12 h-12 bg-transparent border-2 border-white/20 hover:border-white/40 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/20"
              aria-label="Download playlist"
            >
              <FaDownload size={16} />
            </button>

            {/* Share button */}
            <button
              onClick={handleShare}
              className="w-12 h-12 bg-transparent border-2 border-white/20 hover:border-white/40 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/20"
              aria-label="Share playlist"
            >
              <FaShare size={16} />
            </button>

            {/* More options */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-12 h-12 bg-transparent border-2 border-white/20 hover:border-white/40 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/20"
                aria-label="More options"
              >
                <FaEllipsisH size={16} />
              </button>

              {/* Dropdown menu */}
              {showMenu && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-50 border border-gray-700">
                  <div className="py-1">
                    {isOwner && onEdit && (
                      <button
                        onClick={() => {
                          onEdit(playlist);
                          setShowMenu(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
                      >
                        Edit playlist
                      </button>
                    )}
                    <button className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700">
                      Add to queue
                    </button>
                    <button className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700">
                      Create similar playlist
                    </button>
                    <hr className="border-gray-700 my-1" />
                    <button className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700">
                      Copy link
                    </button>
                    <button className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700">
                      Embed playlist
                    </button>
                    {isOwner && onDelete && (
                      <>
                        <hr className="border-gray-700 my-1" />
                        <button
                          onClick={() => {
                            onDelete(playlist);
                            setShowMenu(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                        >
                          Delete playlist
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hidden canvas for color extraction */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  },
);

PlaylistHeader.displayName = "PlaylistHeader";

export default PlaylistHeader;
