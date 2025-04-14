import React, { useState, useEffect, useCallback } from "react";
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
  FaPlus,
} from "react-icons/fa";

const REPEAT_OFF = 0;
const REPEAT_ALL = 1;
const REPEAT_ONE = 2;

export default function MiniPlayer({
  song,
  isPlaying,
  onTogglePlay,
  onClose,
  onLike,
  shuffle,
  onShuffleToggle,
  onPrevSong,
  onNextSong,
  repeatMode,
  onCycleRepeat,
}) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleDragMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleDragMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    },
    [isDragging, dragOffset]
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

  const [size, setSize] = useState({ w: 256, h: 360 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDragStart, setResizeDragStart] = useState({ x: 0, y: 0 });

  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleResizeMouseMove = useCallback(
    (e) => {
      if (!isResizing) return;
      const dx = e.clientX - resizeDragStart.x;
      const dy = e.clientY - resizeDragStart.y;
      setSize((prev) => ({
        w: Math.max(220, prev.w + dx),
        h: Math.max(220, prev.h + dy),
      }));
      setResizeDragStart({ x: e.clientX, y: e.clientY });
    },
    [isResizing, resizeDragStart]
  );

  const handleResizeMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResizeMouseMove);
      window.addEventListener("mouseup", handleResizeMouseUp);
    } else {
      window.removeEventListener("mousemove", handleResizeMouseMove);
      window.removeEventListener("mouseup", handleResizeMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleResizeMouseMove);
      window.removeEventListener("mouseup", handleResizeMouseUp);
    };
  }, [isResizing, handleResizeMouseMove]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  const renderRepeatIcon = () => {
    const baseClasses = `relative text-gray-300 hover:text-white ${
      repeatMode !== REPEAT_OFF ? "text-white" : ""
    }`;
    if (repeatMode === REPEAT_ONE) {
      return (
        <div className={baseClasses} title="Repeat One" onClick={onCycleRepeat}>
          <FaRedoAlt size={16} />
          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-black">
            1
          </span>
        </div>
      );
    }
    return (
      <FaRedoAlt
        size={16}
        className={baseClasses}
        title={
          repeatMode === REPEAT_ALL ? "Repeat All" : "Repeat Off"
        }
        onClick={onCycleRepeat}
      />
    );
  };

  if (!song) return null;

  const containerStyle = isFullscreen
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
      }
    : {
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.w}px`,
        height: `${size.h}px`,
      };

  return (
    <div
      className="bg-black text-white rounded shadow-lg flex flex-col z-50"
      style={containerStyle}
    >
      <div
        className="flex items-center justify-between p-2 border-b border-gray-800 cursor-move"
        onMouseDown={handleDragMouseDown}
      >
        <button
          className="text-gray-400 hover:text-white"
          onClick={onClose}
          title="Close mini player"
        >
          <FaTimes size={16} />
        </button>
        <div className="flex-1 text-center text-sm font-semibold">
          Mini Player
        </div>
        <button
          onClick={toggleFullscreen}
          className="text-gray-400 hover:text-white"
          title={isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
        >
          {isFullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
        </button>
      </div>

      <div className="flex-1 flex flex-col p-2 items-center overflow-hidden">
        <div
          className="self-end text-gray-400 hover:text-white mb-2"
          title="Add to Liked Songs"
        >
          <button onClick={onLike}>
            <FaPlus size={16} />
          </button>
        </div>
        <img
          src={song.cover || "/images/default-cover.jpg"}
          alt={song.title}
          className="object-cover rounded mb-2"
          style={{
            width: isFullscreen ? "50%" : "80%",
            height: isFullscreen ? "50%" : "auto",
          }}
        />
        <div className="text-center mb-3 w-full">
          <p className="font-bold text-sm truncate">{song.title}</p>
          <p className="text-xs text-gray-400 truncate">{song.artist}</p>
        </div>
        <div className="flex items-center justify-center gap-4">
          <button
            className={`text-gray-300 hover:text-white ${
              shuffle ? "text-white" : ""
            }`}
            onClick={onShuffleToggle}
            title="Shuffle"
          >
            <FaRandom size={16} />
          </button>
          <button
            className="text-gray-300 hover:text-white"
            onClick={onPrevSong}
            title="Previous"
          >
            <FaStepBackward size={16} />
          </button>
          <button
            onClick={onTogglePlay}
            className="bg-white text-black rounded-full w-8 h-8 flex items-center justify-center hover:scale-105 transition"
            title="Play/Pause"
          >
            {isPlaying ? <FaPause size={12} /> : <FaPlay size={12} />}
          </button>
          <button
            className="text-gray-300 hover:text-white"
            onClick={onNextSong}
            title="Next"
          >
            <FaStepForward size={16} />
          </button>
          {renderRepeatIcon()}
        </div>
      </div>

      {!isFullscreen && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 bg-gray-600 cursor-se-resize"
          onMouseDown={handleResizeMouseDown}
        />
      )}
    </div>
  );
}
