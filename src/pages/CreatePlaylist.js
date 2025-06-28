import React, { useState } from 'react';
import { FaPencilAlt, FaUserPlus, FaEllipsisH, FaTh, FaSearch, FaTimes, FaPlus } from 'react-icons/fa';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import ContextMenu from '../components/ContextMenu';
import EditPlaylistModal from '../components/EditPlaylistModal';
import * as ctxHelpers from '../utils/contextMenuHelpers';
import PropTypes from 'prop-types';
import { useImagePreview } from '../hooks/useImagePreview';

export default function CreatePlaylist({ onCreate, onCancel }) {
  const { file: coverFile, setFile: setCoverFile, preview: coverPreview, gradient: bgGradient } = useImagePreview();
  const [name, setName] = useState('My Playlist #?');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  // draft playlist tracks
  const [selectedTracks, setSelectedTracks] = useState([]);
  // all songs loaded from Firestore
  const [allSongs, setAllSongs] = useState([]);
  // context menu state
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  // description and edit modal visibility
  const [description, setDescription] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  // default fallback cover image to avoid src undefined causing reload
  const defaultCover = encodeURI('/artistImages/Unknown Artist.jpg');

  // context menu items for draft playlist
  const optionsMenu = [
    { icon: '▶️', label: 'Add to queue', onClick: () => ctxHelpers.addToQueue({ name, selectedTracks }) },
    { icon: '', label: 'Remove from profile', onClick: () => ctxHelpers.removeFromProfile({ name, selectedTracks }) },
    { icon: '✏️', label: 'Edit details', onClick: () => setShowEditModal(true) },
    { icon: '🗑️', label: 'Cancel creation', onClick: () => onCancel() },
    { icon: '', label: 'Make private', onClick: () => ctxHelpers.makePrivate({ name, selectedTracks }) },
    { icon: '', label: 'Invite collaborators', onClick: () => ctxHelpers.inviteCollaborators({ name, selectedTracks }) },
    { icon: '', label: 'Exclude from your taste profile', onClick: () => ctxHelpers.excludeFromTasteProfile({ name, selectedTracks }) },
    { icon: '', label: 'Move to folder', onClick: () => ctxHelpers.moveToFolder({ name, selectedTracks }) },
    { icon: '', label: 'Share', onClick: () => ctxHelpers.share({ name, selectedTracks }) },
    { icon: '', label: 'Open in Desktop app', onClick: () => ctxHelpers.openInDesktopApp({ name, selectedTracks }) },
  ];

  // add and remove track handlers
  const addSong = song => {
    setSelectedTracks(prev => prev.some(t => t.id === song.id) ? prev : [...prev, song]);
  };
  const removeSong = id => {
    setSelectedTracks(prev => prev.filter(t => t.id !== id));
  };

  // Load songs from Firestore on mount
  React.useEffect(() => {
    getDocs(collection(db, 'songs'))
      .then(snap => setAllSongs(snap.docs.map(d => ({ id: d.id, ...d.data() }))
      ))
      .catch(console.error);
  }, []);

  // In-memory filter search from loaded songs
  React.useEffect(() => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }
    const term = searchTerm.trim().toLowerCase();
    const results = allSongs
      .filter(song =>
        song.title?.toLowerCase().includes(term) ||
        song.artist?.toLowerCase().includes(term)
      )
      .slice(0, 20);
    setSearchResults(results);
  }, [searchTerm, allSongs]);

  // finalize

  return (
    <div className="flex h-full flex-col bg-gray-900 text-white">
      {/* Hero Section */}
      <div
        className="relative w-full h-64"
        style={{ background: bgGradient }}
      >
        <div className="absolute inset-0 bg-cover bg-center opacity-50" />
        <div className="relative z-10 flex items-end p-6 h-full">
          <div className="w-32 h-32 bg-gray-700 rounded flex items-center justify-center">
            {coverPreview ? (
              <img src={coverPreview} alt="Cover" className="w-full h-full object-cover rounded" />
            ) : (
              <label className="cursor-pointer text-gray-400">
                <FaPencilAlt />
                <input type="file" accept="image/*" className="hidden" onChange={e => setCoverFile(e.target.files[0])} />
              </label>
            )}
          </div>
          <div className="ml-6 flex-1">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-transparent text-5xl font-bold w-full focus:outline-none"
            />
            <p className="text-gray-400 mt-1">{description || 'Add an optional description'}</p>
            <div className="flex items-center space-x-4 text-gray-400 mt-2">
              <button title="Collaborators"><FaUserPlus size={20} /></button>
              <button
                title="Options"
                onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMenuPos({ x: rect.right, y: rect.bottom });
                  setMenuVisible(true);
                }}
              ><FaEllipsisH size={20} /></button>
              <button title="View as Compact"><FaTh size={20} /></button>
            </div>
          </div>
        </div>
      </div>
      {/* Options context menu */}
      <ContextMenu
        visible={menuVisible}
        x={menuPos.x}
        y={menuPos.y}
        items={optionsMenu}
        onClose={() => setMenuVisible(false)}
      />
      {/* Edit details modal */}
      <EditPlaylistModal
        isOpen={showEditModal}
        playlist={{ name, description, cover: coverPreview }}
        onSave={({ name: newName, description: newDesc, coverFile: newCoverFile }) => {
          setName(newName);
          setDescription(newDesc);
          if (newCoverFile) {
            setCoverFile(newCoverFile);
          }
          setShowEditModal(false);
        }}
        onClose={() => setShowEditModal(false)}
      />

      {/* Divider */}
      <hr className="border-gray-700" />

      {/* Search Section */}
      <section className="p-6 flex-1 flex flex-col">
        {/* Selected Tracks Preview */}
        {selectedTracks.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Selected Songs</h2>
            <ul className="space-y-2">
              {selectedTracks.map(song => (
                <li key={song.id} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                  <div className="flex items-center space-x-2">
                    <img
                      src={song.cover || defaultCover}
                      alt={song.title}
                      className="w-10 h-10 rounded object-cover"
                      onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = defaultCover; }}
                    />
                    <div>
                      <p className="font-semibold">{song.title}</p>
                      <p className="text-gray-400 text-sm">{song.artist}</p>
                    </div>
                  </div>
                  <button className="text-red-400 hover:text-red-300" onClick={() => removeSong(song.id)}><FaTimes /></button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <h2 className="text-xl font-semibold mb-3">Let&apos;s find something for your playlist</h2>
        <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
          <FaSearch className="text-gray-500" />
          <input
            type="text"
            placeholder="Search for songs or episodes"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-transparent flex-1 focus:outline-none"
          />
          <button className="text-gray-500 hover:text-white" onClick={() => setSearchTerm('')}><FaTimes /></button>
        </div>
        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map(song => (
              <div key={song.id} className="flex items-center justify-between hover:bg-gray-800 p-2 rounded">
                <div className="flex items-center space-x-2">
                  <img
                    src={song.cover || defaultCover}
                    alt={song.title}
                    className="w-10 h-10 rounded object-cover"
                    onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = defaultCover; }}
                  />
                  <div>
                    <p className="font-semibold">{song.title}</p>
                    <p className="text-gray-400 text-sm">{song.artist}</p>
                  </div>
                </div>
                <button className="text-green-400 hover:text-green-300" onClick={() => addSong(song)}><FaPlus /></button>
              </div>
            ))}
          </div>
        )}
      </section>
      {/* Actions */}
      <div className="p-6 flex justify-end space-x-4 bg-gray-900">
        <button onClick={onCancel} className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600">Cancel</button>
        <button onClick={() => onCreate({ name, coverFile, songs: selectedTracks })} className="bg-green-500 px-4 py-2 rounded hover:bg-green-400">Create</button>
      </div>
    </div>
  );
}

CreatePlaylist.propTypes = {
  onCreate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
