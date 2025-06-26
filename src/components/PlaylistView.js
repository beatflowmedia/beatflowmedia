import React, { useEffect, useState, useMemo } from "react";
import { FaPlay, FaRandom, FaCheck, FaDownload, FaClock } from "react-icons/fa";
import { subscribeToPlaylists, reorderSongsInPlaylist, updatePlaylistDetails } from "../utils/PlaylistHelper";
import PropTypes from 'prop-types';
import { format } from "date-fns";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import EditPlaylistModal from './EditPlaylistModal';

// Utility function moved outside component
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function PlaylistView({ playlistId, onSongSelect }) {
  const [playlist, setPlaylist] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Derive songs array with stable reference
  const songs = useMemo(() => playlist?.songs || [], [playlist?.songs]);

  const durationMap = useMemo(() => {
    const map = {};
    songs.forEach((s) => {
      if (s.durationSec != null) map[s.id] = s.durationSec;
    });
    return map;
  }, [songs]);

  const totalDurationSec = useMemo(
    () => songs.reduce((sum, s) => sum + (durationMap[s.id] || 0), 0),
    [songs, durationMap]
  );

  const formattedTotal = useMemo(() => formatTime(totalDurationSec), [totalDurationSec]);

  useEffect(() => {
    if (!playlistId) return;
    const unsubscribe = subscribeToPlaylists((playlists) => {
      const selected = playlists.find((p) => p.id === playlistId);
      setPlaylist(selected);
    });
    return () => unsubscribe();
  }, [playlistId]);

  // Local song order state
  const [localSongs, setLocalSongs] = useState([]);

  // Sync localSongs when playlist.songs changes
  useEffect(() => {
    setLocalSongs(songs);
  }, [songs]);

  // Handle drag end and persist order
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const reordered = Array.from(localSongs);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setLocalSongs(reordered);
    try {
      await reorderSongsInPlaylist(playlist.id, reordered);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveDetails = async (details) => {
    try {
      await updatePlaylistDetails(playlist.id, details);
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (!playlist) {
    return <p className="text-gray-400 p-4">No playlist selected.</p>;
  }

  const coverUrl = playlist.cover;
  const hasCover = Boolean(coverUrl);

  return (
    <div className="text-white">
      {/* Header */}
      <div
        className={`relative w-full h-64 rounded-b-lg overflow-hidden ${
          hasCover ? 'bg-cover bg-center' : 'bg-gradient-to-r from-purple-600 via-blue-500 to-pink-400'
        }`}
        style={
          hasCover
            ? { backgroundImage: `url(${coverUrl})` }
            : undefined
        }
      >
        {hasCover && <div className="absolute inset-0 bg-gradient-to-b from-purple-600 to-purple-800 opacity-80" />}
        <div className="relative z-10 p-6 flex flex-col justify-end h-full">
          <span className="uppercase text-sm font-semibold">Public Playlist</span>
          <h1 className="text-6xl font-bold mt-1">{playlist.name}</h1>
          <p className="text-gray-300 mt-2 text-sm">
            <button
              className="underline hover:text-white"
              onClick={() => setShowEditModal(true)}
            >
              {playlist.owner || 'Unknown'}
            </button> • {playlist.saves || 0} save{(playlist.saves||0)!==1?'s':''} •{' '}
            {playlist.songs.length} song{playlist.songs.length!==1?'s':''}, {formattedTotal}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 p-6">
        <button
          className="bg-green-500 hover:bg-green-600 text-black p-4 rounded-full transition"
          onClick={() => playlist.songs[0] && onSongSelect(playlist.songs[0])}
        >
          <FaPlay size={24} />
        </button>
        <button className="text-white hover:text-gray-300" title="Shuffle">
          <FaRandom size={20} />
        </button>
        <button className="text-white hover:text-gray-300" title="Save to Your Library">
          <FaCheck size={20} />
        </button>
        <button className="text-white hover:text-gray-300" title="Download">
          <FaDownload size={20} />
        </button>
      </div>

      {/* Track List Header */}
      <div className="px-6">
        <div
          className="grid items-center text-gray-400 text-xs uppercase border-b border-gray-700 pb-2"
          style={{ gridTemplateColumns: '32px minmax(0,1fr) minmax(0,1fr) 150px 32px' }}
        >
          <div>#</div>
          <div>Title</div>
          <div>Album</div>
          <div>Date Added</div>
          <div><FaClock /></div>
        </div>

        {/* Tracks */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="playlistTracks">
            {(provided) => (
              <div
                className="mt-2 space-y-1"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {localSongs.map((song, index) => (
                  <Draggable key={song.id} draggableId={song.id} index={index}>
                    {(draggableProvided) => (
                      <div
                        className="grid items-center text-gray-200 hover:bg-gray-800 p-2 rounded cursor-pointer"
                        style={{ gridTemplateColumns: '32px minmax(0,1fr) minmax(0,1fr) 150px 32px' }}
                        onClick={() => onSongSelect(song)}
                        ref={draggableProvided.innerRef}
                        {...draggableProvided.draggableProps}
                        {...draggableProvided.dragHandleProps}
                      >
                        <div className="text-sm">{index + 1}</div>
                        <div className="flex items-center space-x-2">
                          <img
                            src={song.cover}
                            alt={song.title}
                            className="w-8 h-8 rounded object-cover"
                          />
                          <div className="truncate">
                            <p className="text-sm font-semibold truncate">{song.title}</p>
                            <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                          </div>
                        </div>
                        <div className="text-sm truncate">{song.album}</div>
                        <div className="text-xs text-gray-400 truncate">
                          {song.dateAdded
                            ? format(new Date(song.dateAdded), "MMM d, yyyy")
                            : "-"}
                        </div>
                        <div className="text-sm">{formatTime(durationMap[song.id] || 0)}</div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <EditPlaylistModal
        isOpen={showEditModal}
        playlist={playlist}
        onSave={handleSaveDetails}
        onClose={() => setShowEditModal(false)}
      />
    </div>
  );
}

// Add PropTypes and default props
PlaylistView.propTypes = {
  playlistId: PropTypes.string,
  onSongSelect: PropTypes.func.isRequired,
};

PlaylistView.defaultProps = {
  playlistId: null,
};
