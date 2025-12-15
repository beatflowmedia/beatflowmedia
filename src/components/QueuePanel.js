// src/components/QueuePanel.js
import { useState, memo , useCallback } from "react";
import { usePlayer } from "../context/PlayerContext";
import PlayButton from "./PlayButton";
import {
  FaChevronRight,
  FaGripHorizontal,
  FaTrashAlt,
  FaPlay,
  FaPause,
  FaClock,
  FaRandom,
  FaHeart,
  FaRegHeart,
  FaSave,
  FaDownload
} from "react-icons/fa";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { toast } from "react-hot-toast";
import classNames from "classnames";

/**
 * Enhanced QueuePanel - A comprehensive queue management component
 *
 * Features:
 * - Drag and drop reordering with touch support
 * - Remove actions with undo functionality
 * - Clear queue with confirmation
 * - Save queue as playlist
 * - Shuffle queue functionality
 * - Duration display and queue stats
 * - Enhanced accessibility
 * - Loading states and error handling
 */
const QueuePanel = memo(({ visible, onClose, className = "" }) => {
  const { state, dispatch, actions } = usePlayer();
  const { queue, currentIndex, isPlaying } = state;
  const [isDragDisabled, setIsDragDisabled] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [playlistName, setPlaylistName] = useState("");

  const currentTrack = queue[currentIndex] || null;

  // Prepare Up Next items with original indices
  const upNextItems = queue
    .map((item, idx) => ({ item, idx }))
    .filter(({ idx }) => idx !== currentIndex)
    .filter(({ item }) => item);

  // Calculate total queue duration
  const totalDuration = queue.reduce(
    (acc, track) => acc + (track?.duration || 0),
    0,
  );

  // Format duration helper
  const formatDuration = useCallback((seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Format queue stats
  const formatQueueStats = useCallback(() => {
    const trackCount = queue.length;
    const duration = formatDuration(totalDuration);
    return `${trackCount} ${trackCount === 1 ? "song" : "songs"} • ${duration}`;
  }, [queue.length, totalDuration, formatDuration]);

  if (!visible) return null;

  // Handle drag-end to reorder
  const handleDragEnd = useCallback(
    (result) => {
      if (!result.destination) return;

      setIsDragDisabled(false);

      const fromRaw = result.source.index;
      const toRaw = result.destination.index;

      if (fromRaw === toRaw) return;

      const fromIdx = upNextItems[fromRaw].idx;
      const toIdx = upNextItems[toRaw].idx;

      dispatch({
        type: actions.REORDER,
        payload: { from: fromIdx, to: toIdx }
      });
      toast.success("Queue reordered");
    },
    [upNextItems, dispatch, actions],
  );

  // Handle drag start
  const handleDragStart = useCallback(() => {
    setIsDragDisabled(false);
  }, []);

  // Clear queue with enhanced confirmation
  const clearQueue = useCallback(() => {
    if (queue.length === 0) return;

    if (!window.confirm(`Clear all ${queue.length} tracks from queue?`)) return;

    // Snapshot for undo
    const prevQueue = [...queue];
    const prevIndex = currentIndex;

    dispatch({ type: actions.CLEAR });

    toast.success(`Queue cleared (${queue.length} songs)`, {
      action: {
        label: "Undo",
        onClick: () => {
          dispatch({
            type: actions.SET_QUEUE,
            payload: { queue: prevQueue, currentIndex: prevIndex }
          });
          toast.success("Queue restored");
        }
      }
    });
  }, [queue, currentIndex, dispatch, actions]);

  // Shuffle queue
  const shuffleQueue = useCallback(() => {
    if (queue.length <= 1) return;

    const currentSong = queue[currentIndex];
    const otherSongs = queue.filter((_, idx) => idx !== currentIndex);
    const shuffledOthers = [...otherSongs].sort(() => Math.random() - 0.5);
    const newQueue = [currentSong, ...shuffledOthers];

    dispatch({
      type: actions.SET_QUEUE,
      payload: { queue: newQueue, currentIndex: 0 }
    });
    toast.success("Queue shuffled");
  }, [queue, currentIndex, dispatch, actions]);

  // Save queue as playlist
  const saveAsPlaylist = useCallback(() => {
    if (queue.length === 0) {
      toast.error("Queue is empty");
      return;
    }
    setShowSaveModal(true);
  }, [queue.length]);

  // Handle save playlist
  const handleSavePlaylist = useCallback(async () => {
    if (!playlistName.trim()) {
      toast.error("Please enter a playlist name");
      return;
    }

    try {
      // TODO: Integrate with backend API to save playlist
      console.log("Saving playlist:", { name: playlistName, tracks: queue });
      toast.success(`Playlist "${playlistName}" created`);
      setShowSaveModal(false);
      setPlaylistName("");
    } catch (error) {
      toast.error("Failed to save playlist");
    }
  }, [playlistName, queue]);

  // Remove single track with undo
  const removeTrack = useCallback(
    (idx, track) => {
      dispatch({ type: actions.REMOVE_AT, payload: idx });

      toast.success(`Removed "${track.title}"`, {
        action: {
          label: "Undo",
          onClick: () => {
            dispatch({
              type: actions.ENQUEUE,
              payload: { item: track, position: idx }
            });
            toast.success("Track restored");
          }
        }
      });
    },
    [dispatch, actions],
  );

  const playAt = useCallback(
    (idx) => {
      dispatch({ type: actions.PLAY_AT, payload: idx });
    },
    [dispatch, actions],
  );

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={classNames(
          "fixed right-0 top-16 h-full w-80 bg-gray-900 text-white shadow-xl z-50 flex flex-col",
          "transform transition-transform duration-300 ease-in-out",
          visible ? "translate-x-0" : "translate-x-full",
          className,
        )}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold">Queue</h2>
              <p className="text-xs text-gray-400 mt-1">
                {queue.length > 0 ? formatQueueStats() : "No songs in queue"}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close queue panel"
              onClick={onClose}
              className="text-xl text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded p-1"
            >
              ✖
            </button>
          </div>

          {/* Action buttons */}
          {queue.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={shuffleQueue}
                disabled={queue.length <= 1}
                className="flex items-center gap-1 text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Shuffle queue"
              >
                <FaRandom size={10} />
                Shuffle
              </button>
              <button
                type="button"
                onClick={saveAsPlaylist}
                className="flex items-center gap-1 text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                aria-label="Save as playlist"
              >
                <FaSave size={10} />
                Save
              </button>
              <button
                type="button"
                onClick={clearQueue}
                className="flex items-center gap-1 text-xs bg-red-800 hover:bg-red-700 px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Clear queue"
              >
                <FaTrashAlt size={10} />
                Clear
              </button>
            </div>
          )}
        </div>
        {/* Queue Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
              <FaClock size={48} className="opacity-50" />
              <div className="text-center">
                <p className="text-lg font-medium">Your queue is empty</p>
                <p className="text-sm">Add songs to start listening</p>
              </div>
            </div>
          ) : (
            <>
              {/* Now Playing Section */}
              {currentTrack && (
                <div className="mb-6">
                  <div className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wide">
                    Now Playing
                  </div>
                  <div
                    className={classNames(
                      "flex items-center p-4 bg-gradient-to-r from-green-900/20 to-gray-800",
                      "rounded-lg shadow-lg border border-green-500/20",
                    )}
                  >
                    <img
                      src={
                        currentTrack.cover ||
                        currentTrack.coverUrl ||
                        "https://via.placeholder.com/64?text=♪"
                      }
                      alt={`${currentTrack.title} cover`}
                      className="w-16 h-16 mr-4 rounded-lg object-cover shadow-md"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/64?text=♪";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-green-400 font-semibold truncate text-lg">
                        {currentTrack.title}
                      </p>
                      <p className="text-sm text-gray-300 truncate">
                        {currentTrack.artist}
                      </p>
                      {currentTrack.album && (
                        <p className="text-xs text-gray-400 truncate">
                          {currentTrack.album}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => dispatch({ type: actions.TOGGLE_PLAY })}
                      className="w-12 h-12 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center text-black transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 ml-4"
                      aria-label={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? (
                        <FaPause size={16} />
                      ) : (
                        <FaPlay size={16} className="ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Up Next Section */}
              {upNextItems.length > 0 && (
                <>
                  <div className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wide">
                    Up Next ({upNextItems.length})
                  </div>
                  <DragDropContext
                    onDragEnd={handleDragEnd}
                    onDragStart={handleDragStart}
                  >
                    <Droppable
                      droppableId="queue"
                      isDropDisabled={isDragDisabled}
                    >
                      {(provided, snapshot) => (
                        <ul
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={classNames(
                            "space-y-1",
                            snapshot.isDraggingOver &&
                              "bg-gray-800/30 rounded-lg",
                          )}
                        >
                          {upNextItems.map(({ item, idx }, rawIdx) => (
                            <Draggable
                              key={`${item.id}-${idx}`}
                              draggableId={`${item.id}-${idx}`}
                              index={rawIdx}
                              isDragDisabled={isDragDisabled}
                            >
                              {(draggableProvided, draggableSnapshot) => (
                                <li
                                  ref={draggableProvided.innerRef}
                                  {...draggableProvided.draggableProps}
                                  className={classNames(
                                    "group flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200",
                                    "hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500",
                                    draggableSnapshot.isDragging &&
                                      "bg-gray-700 shadow-xl scale-105 rotate-2",
                                    draggableSnapshot.draggingOver &&
                                      "ring-2 ring-green-500/50",
                                  )}
                                  onClick={() => playAt(idx)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      playAt(idx);
                                    }
                                  }}
                                  tabIndex={0}
                                  role="button"
                                  aria-label={`Play ${item.title} by ${item.artist}`}
                                >
                                  {/* Drag Handle */}
                                  <div
                                    {...draggableProvided.dragHandleProps}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity mr-2 p-1 text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing"
                                    aria-label="Drag to reorder"
                                  >
                                    <FaGripHorizontal size={12} />
                                  </div>

                                  {/* Track Number */}
                                  <span className="w-6 text-xs text-gray-400 font-mono">
                                    {rawIdx + 1}
                                  </span>

                                  {/* Album Art */}
                                  <img
                                    src={
                                      item.cover ||
                                      item.coverUrl ||
                                      "https://via.placeholder.com/40?text=♪"
                                    }
                                    alt={`${item.title} cover`}
                                    className="w-10 h-10 mr-3 rounded object-cover shadow-sm"
                                    onError={(e) => {
                                      e.target.src =
                                        "https://via.placeholder.com/40?text=♪";
                                    }}
                                  />

                                  {/* Track Info */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate text-sm">
                                      {item.title}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                      {item.artist}
                                    </p>
                                  </div>

                                  {/* Duration */}
                                  <div className="flex items-center text-xs text-gray-400 mr-2">
                                    <FaClock
                                      size={8}
                                      className="mr-1 opacity-50"
                                    />
                                    {formatDuration(item.duration)}
                                  </div>

                                  {/* Remove Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeTrack(idx, item);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-400 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                                    aria-label={`Remove ${item.title} from queue`}
                                  >
                                    <FaTrashAlt size={12} />
                                  </button>
                                </li>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </ul>
                      )}
                    </Droppable>
                  </DragDropContext>
                </>
              )}
            </>
          )}
        </div>

        {/* Save Playlist Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Save Queue as Playlist</h3>
              <input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="Enter playlist name..."
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoFocus
              />
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePlaylist}
                  disabled={!playlistName.trim()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
});

QueuePanel.displayName = "QueuePanel";

export default QueuePanel;
