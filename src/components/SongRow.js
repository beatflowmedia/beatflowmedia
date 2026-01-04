// SongRow.js
import { getPlaceholderImage } from "../utils/placeholders";
import React from "react";
import PlayButton from "../components/PlayButton";
import SongOptionsMenu from "../components/SongOptionsMenu";

// Helper function to format seconds to mm:ss
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const SongRow = ({
  song,
  index,
  isSongPlaying,
  isFavorite,
  isInPlaylist,
  currentSongId,
  duration,
  onSongSelect,
  onTogglePlay,
  onToggleFavorite,
  onAddToPlaylist,
  onRemoveSongFromPlaylist
}) => {
  const displayDuration =
    song.id === currentSongId && duration
      ? formatDuration(duration)
      : song.duration
        ? song.duration
        : "N/A";

  return (
    <div className="grid grid-cols-[40px_1fr_1fr_100px_60px_40px] items-center text-sm text-gray-300 py-2 hover:bg-gray-800 rounded transition cursor-pointer">
      {/* Track number */}
      <div className="text-center text-gray-400">{index + 1}</div>
      {/* Title & Artist */}
      <div className="flex items-center space-x-3">
        <img
          src={song.cover || "data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50"%3E%3Crect width="50" height="50" fill="%23333"/%3E%3C/svg%3E"}
          alt="cover"
          className="w-10 h-10 rounded"
        />
        <div>
          <p className="text-white font-semibold">{song.title}</p>
          <p className="text-xs text-gray-400">{song.artist}</p>
        </div>
      </div>
      {/* Album name */}
      <div className="truncate">{song.album || "Unknown Album"}</div>
      {/* Date added */}
      <div className="text-xs text-gray-400">
        {song.dateAdded ? song.dateAdded : "N/A"}
      </div>
      {/* Duration */}
      <div className="text-xs text-gray-400">{displayDuration}</div>
      {/* Actions */}
      <div className="flex items-center justify-end space-x-2">
        <PlayButton
          isPlaying={isSongPlaying}
          onClick={() => {
            if (isSongPlaying) {
              onTogglePlay(false);
            } else {
              onSongSelect(song);
              onTogglePlay(true);
            }
          }}
          size={18}
        />
        <SongOptionsMenu
          song={song}
          isFavorite={isFavorite}
          isInPlaylist={isInPlaylist}
          onAddToPlaylist={() => onAddToPlaylist(song)}
          onRemoveFromPlaylist={(songToRemove) =>
            onRemoveSongFromPlaylist(songToRemove)
          }
          onToggleFavorite={onToggleFavorite}
          onRemoveFromLiked={(songToRemove) => onToggleFavorite(songToRemove)}
        />
      </div>
    </div>
  );
};

export default SongRow;
