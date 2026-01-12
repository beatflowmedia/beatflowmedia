import { useState } from "react";
import { FaMusic, FaUser, FaPlay, FaPlus, FaFolder, FaLock, FaUserPlus, FaEyeSlash, FaThumbtack, FaShare, FaSearch } from "react-icons/fa";
import { MusicNote } from "@mui/icons-material";
import { BiListPlus } from "react-icons/bi";
import { MdEdit, MdDelete } from "react-icons/md";
import PropTypes from 'prop-types';
import ContextMenu from './ContextMenu';
import EditPlaylistModal from './EditPlaylistModal';
import { usePlaylistManager } from '../hooks/usePlaylistManager';
import { usePlayer } from '../context/PlayerContext';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useModal } from '../hooks/useModal';
import { useArtistImage } from '../hooks/useArtistImage';

const typeIcon = {
  playlist: <FaMusic className="text-green-400 mr-2" />,
  artist: <FaUser className="text-yellow-400 mr-2" />
};

const SidebarListItem = ({
  item,
  onArtistSelect,
  onPlaylistSelect,
  onViewArtist,
  onShowRightPanel,
  onPlayArtist,
  onPlayPlaylist,
  onCreatePlaylist,
  isCollapsed = false,
  isMenuOpen = false,
  menuPosition = { x: 0, y: 0 },
  onOpenMenu,
  onCloseMenu
}) => {
  const isArtist = item.type === "artist";
  const [imgError, setImgError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Race condition guard
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { deletePlaylist, updatePlaylistDetails, togglePrivacy } = usePlaylistManager();
  const { user } = useAuth();
  const { dispatch, actions: playerActions } = usePlayer();
  const { showAlert } = useModal();

  // Fetch artist image with album fallback for artists
  const artistImageFromDb = useArtistImage(isArtist ? item.name : null);

  // Main navigation handlers (DRY - same for artist/playlist)
  const handleNameClick = isArtist
    ? () => (onViewArtist || onArtistSelect)?.(item.name)
    : () => onPlaylistSelect(item);

  // Image click handlers - open right panel and auto-play (DRY)
  const handleImageClick = (e) => {
    e.stopPropagation();

    // Play immediately using the existing play handlers
    if (isArtist && onPlayArtist) {
      onPlayArtist(item.name);
    } else if (!isArtist && onPlayPlaylist) {
      onPlayPlaylist(item);
    }

    // Also open right panel if available
    if (onShowRightPanel) {
      if (isArtist) {
        onShowRightPanel(item.name);
      } else {
        onShowRightPanel({ type: 'playlist', data: item });
      }
    }
  };

  // Context menu handler (right-click for playlists)
  const handleContextMenu = (e) => {
    if (isArtist || !onOpenMenu) return; // Only for playlists
    e.preventDefault();
    e.stopPropagation();
    onOpenMenu(item.id, { x: e.clientX, y: e.clientY });
  };

  // Action handlers with proper error handling and race condition guards

  // Add entire playlist to queue
  const handleAddToQueue = async () => {
    if (isProcessing || !user) return;

    setIsProcessing(true);
    try {
      // Try user's private playlists first
      let playlistRef = doc(db, "users", user.uid, "playlists", item.id);
      let playlistSnap = await getDoc(playlistRef);

      // If not found, try global playlists collection (for followed/public playlists)
      if (!playlistSnap.exists()) {
        playlistRef = doc(db, "playlists", item.id);
        playlistSnap = await getDoc(playlistRef);
      }

      if (!playlistSnap.exists()) {
        throw new Error("Playlist not found");
      }

      const playlistData = playlistSnap.data();
      const songs = playlistData.songs || [];

      if (songs.length === 0) {
        await showAlert("Empty Playlist", "This playlist is empty", "error");
        return;
      }

      // For each song entry, fetch the full song data from songs collection
      for (const songEntry of songs) {
        const songId = songEntry.songId || songEntry.id;
        if (!songId) continue;

        // Fetch song from songs collection
        const songRef = doc(db, "songs", songId);
        const songSnap = await getDoc(songRef);

        if (songSnap.exists()) {
          const songData = { id: songSnap.id, ...songSnap.data() };
          dispatch({ type: playerActions.ENQUEUE, payload: { item: songData } });
        }
      }

      onCloseMenu?.();
    } catch (error) {
      console.error('❌ Failed to add to queue:', error);
      await showAlert("Error", "Failed to add playlist to queue", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeletePlaylist = async () => {
    if (isProcessing) return; // Prevent double-clicks

    // Use modal confirmation instead of window.confirm
    const confirmed = await showAlert(
      "Delete Playlist",
      `Delete playlist "${item.name}"? This cannot be undone.`,
      "warning",
      true // Show confirm/cancel buttons
    );

    if (!confirmed) return;

    setIsProcessing(true);
    try {
      await deletePlaylist(item.id);
      await showAlert("Deleted", `Deleted "${item.name}"`, "success");
      onCloseMenu?.(); // Close menu after successful deletion
    } catch (error) {
      console.error('❌ Failed to delete playlist:', error);
      await showAlert("Error", "Failed to delete playlist", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTogglePrivacy = async () => {
    if (isProcessing) return; // Prevent concurrent operations

    setIsProcessing(true);
    try {
      const newPrivacy = !item.isPrivate;
      await togglePrivacy(item.id, newPrivacy);
      await showAlert("Privacy Updated", `Playlist is now ${newPrivacy ? 'private' : 'public'}`, "success");
      onCloseMenu?.(); // Close menu after successful update
    } catch (error) {
      console.error('❌ Failed to toggle privacy:', error);
      await showAlert("Error", "Failed to update privacy settings", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/playlist/${item.id}`;
    try {
      await navigator.clipboard.writeText(url);
      await showAlert("Link Copied", "Link copied to clipboard", "success");
      onCloseMenu?.();
    } catch (error) {
      console.error('❌ Failed to copy link:', error);
      await showAlert("Error", "Failed to copy link", "error");
    }
  };

  const handlePinPlaylist = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const newPinState = !item.isPinned;
      await updatePlaylistDetails(item.id, { isPinned: newPinState });
      onCloseMenu?.();
    } catch (error) {
      console.error('❌ Failed to pin/unpin playlist:', error);
      await showAlert("Error", "Failed to update pin status", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExcludeFromTasteProfile = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const newState = !item.excludedFromTaste;
      await updatePlaylistDetails(item.id, { excludedFromTaste: newState });
      await showAlert("Taste Profile Updated", newState ? 'Excluded from taste profile' : 'Included in taste profile', "success");
      onCloseMenu?.();
    } catch (error) {
      console.error('❌ Failed to update taste profile setting:', error);
      await showAlert("Error", "Failed to update taste profile setting", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFromProfile = async () => {
    if (isProcessing) return;

    // Use modal confirmation instead of window.confirm
    const confirmed = await showAlert(
      "Remove from Profile",
      `Remove "${item.name}" from your profile? You can add it back later.`,
      "warning",
      true // Show confirm/cancel buttons
    );

    if (!confirmed) return;

    setIsProcessing(true);
    try {
      await updatePlaylistDetails(item.id, { hiddenFromProfile: true });
      await showAlert("Removed from Profile", "Removed from profile", "success");
      onCloseMenu?.();
    } catch (error) {
      console.error('❌ Failed to remove from profile:', error);
      await showAlert("Error", "Failed to remove from profile", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditDetails = async () => {
    console.log('✏️ Edit details for:', item);
    setIsEditModalOpen(true);
    onCloseMenu?.();
  };

  const handleSaveEdit = async (updates) => {
    try {
      let imageUrl = item.imageUrl;

      // Upload new cover image if provided
      if (updates.coverFile) {
        imageUrl = await uploadCoverImage(updates.coverFile);
        // Clear image error state to force re-render with new image
        setImgError(false);
      }

      // Handle privacy change first if it changed
      if (updates.isPrivate !== item.isPrivate) {
        await togglePrivacy(item.id, updates.isPrivate);
      }

      // Update playlist details
      await updatePlaylistDetails(item.id, {
        name: updates.name,
        description: updates.description,
        imageUrl
      });

      await showAlert("Saved", "Playlist details updated successfully", "success");
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('❌ Error updating playlist:', error);
      await showAlert("Error", "Failed to update playlist details", "error");
    }
  };

  const uploadCoverImage = async (file) => {
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const { storage } = await import('../firebaseConfig');

    const timestamp = Date.now();
    const storageRef = ref(storage, `users/${user.uid}/playlist-covers/${timestamp}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleInviteCollaborators = async () => {
    // TODO: Open invite modal
    console.log('👥 Invite collaborators to:', item);
    await showAlert('Coming Soon', 'Invite Collaborators feature coming soon!', 'info');
    onCloseMenu?.();
  };

  const handleEmbedPlaylist = async () => {
    const embedCode = `<iframe src="${window.location.origin}/embed/playlist/${item.id}" width="300" height="380" frameborder="0"></iframe>`;
    try {
      await navigator.clipboard.writeText(embedCode);
      await showAlert("Embed Code Copied", "Embed code copied to clipboard", "success");
      onCloseMenu?.();
    } catch (error) {
      console.error('❌ Failed to copy embed code:', error);
      await showAlert("Error", "Failed to copy embed code", "error");
    }
  };

  const handleFindFolder = async () => {
    // TODO: Open folder finder modal
    console.log('🔍 Find folder for:', item);
    await showAlert('Coming Soon', 'Folder management coming soon!', 'info');
    onCloseMenu?.();
  };

  const handleCreateFolder = async () => {
    // TODO: Open create folder modal
    console.log('📁 Create new folder');
    await showAlert('Coming Soon', 'Folder management coming soon!', 'info');
    onCloseMenu?.();
  };

  // Check if user owns this playlist
  const isOwner = user && (
    // For private playlists, user always owns them (they're in user's subcollection)
    item.isPrivate !== false ||
    // For public playlists, check creatorId
    item.creatorId === user.uid
  );

  const contextMenuItems = [
    { label: 'Add to queue', icon: <BiListPlus />, onClick: handleAddToQueue },
    // Only show these options if user owns the playlist
    ...(isOwner ? [
      { label: 'Remove from profile', icon: <FaEyeSlash />, onClick: handleRemoveFromProfile },
      { type: 'divider' },
      { label: 'Edit details', icon: <MdEdit />, onClick: handleEditDetails },
      { label: 'Delete', icon: <MdDelete />, onClick: handleDeletePlaylist },
      { type: 'divider' },
      { label: 'Create playlist', icon: <FaPlus />, onClick: onCreatePlaylist },
      { label: 'Create folder', icon: <FaFolder />, onClick: handleCreateFolder },
      { type: 'divider' },
      {
        label: item.isPrivate ? 'Make public' : 'Make private',
        icon: <FaLock />,
        onClick: handleTogglePrivacy
      },
      { label: 'Invite collaborators', icon: <FaUserPlus />, onClick: handleInviteCollaborators },
      {
        label: item.excludedFromTaste ? 'Include in taste profile' : 'Exclude from your taste profile',
        icon: <FaEyeSlash />,
        onClick: handleExcludeFromTasteProfile
      },
      {
        label: 'Move to folder',
        icon: <FaFolder />,
        submenu: [
          { label: 'Find a folder', icon: <FaSearch />, onClick: handleFindFolder },
          { label: 'Create folder', icon: <FaPlus />, onClick: handleCreateFolder }
        ]
      },
      {
        label: item.isPinned ? 'Unpin playlist' : 'Pin playlist',
        icon: <FaThumbtack />,
        onClick: handlePinPlaylist
      },
      { type: 'divider' }
    ] : []),
    {
      label: 'Share',
      icon: <FaShare />,
      submenu: [
        { label: 'Copy link to playlist', icon: <FaShare />, onClick: handleCopyLink },
        { label: 'Embed playlist', icon: <FaShare />, onClick: handleEmbedPlaylist }
      ]
    }
  ];

  // If we have the right panel handler (applies to both artist AND playlist)
  if (onShowRightPanel) {
    const imageClass = isArtist ? 'rounded-full' : 'rounded';
    const displayImage = !imgError && (item.cover || item.imageUrl)
      ? (item.cover || item.imageUrl)
      : isArtist
      ? artistImageFromDb // Use fetched artist image with fallback
      : null;

    return (
      <div
        className={`flex items-center w-full px-2 py-1 rounded hover:bg-gray-800 transition group ${isCollapsed ? 'justify-center' : ''}`}
        onContextMenu={handleContextMenu}
      >
        {/* Image with play overlay (DRY for both artist and playlist) */}
        {displayImage ? (
          <div className={`relative w-10 h-10 ${isCollapsed ? '' : 'mr-3'} shrink-0`}>
            <img
              key={displayImage}
              src={displayImage}
              alt={item.name}
              className={`w-10 h-10 ${imageClass} object-cover border border-gray-800 cursor-pointer transition-opacity group-hover:opacity-60`}
              onClick={handleImageClick}
              onError={() => setImgError(true)}
              title={`Play ${item.name}`}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <FaPlay className="text-white text-sm" />
            </div>
          </div>
        ) : (
          <div className={`relative w-10 h-10 ${isCollapsed ? '' : 'mr-3'} shrink-0`}>
            <div
              className={`w-10 h-10 flex items-center justify-center rounded border border-gray-800 bg-gray-900 cursor-pointer transition-opacity group-hover:opacity-60`}
              onClick={handleImageClick}
              title={`Play ${item.name}`}
            >
              <MusicNote sx={{ fontSize: 20, color: '#9ca3af' }} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <FaPlay className="text-white text-sm" />
            </div>
          </div>
        )}

        {/* Name - navigates to page - hidden when collapsed */}
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <button
              className="truncate text-white text-sm font-semibold group-hover:text-green-300 text-left"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                margin: 0
              }}
              onClick={handleNameClick}
              title={`${isArtist ? 'Show artist' : 'Open playlist'}: ${item.name}`}
              tabIndex={0}
            >
              {item.name}
            </button>
            <button
              className="text-xs text-gray-400 flex items-center mt-0.5 hover:text-green-300 text-left"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                margin: 0
              }}
              onClick={handleNameClick}
              title={`${isArtist ? 'Go to artist page' : 'Go to playlist page'}`}
            >
              {!isArtist && item.isPinned && <FaThumbtack className="text-green-400 mr-1" />}
              {typeIcon[item.type]} {isArtist ? 'Artist' : 'Playlist'}
            </button>
          </div>
        )}

        {/* Context menu */}
        {isMenuOpen && (
          <ContextMenu
            visible={isMenuOpen}
            x={menuPosition.x}
            y={menuPosition.y}
            items={contextMenuItems}
            onClose={onCloseMenu}
          />
        )}

        {/* Edit Playlist Modal */}
        {!isArtist && isEditModalOpen && (
          <EditPlaylistModal
            isOpen={isEditModalOpen}
            playlist={item}
            onSave={handleSaveEdit}
            onClose={() => setIsEditModalOpen(false)}
          />
        )}
      </div>
    );
  }

  // Default button layout for playlists or simple artist items (no right panel handler)
  return (
    <>
      <button
        className={`flex items-center w-full px-2 py-1 rounded hover:bg-gray-800 transition group text-left ${isCollapsed ? 'justify-center' : ''}`}
        onClick={handleNameClick}
        tabIndex={0}
        aria-label={item.name}
        title={isArtist ? `Go to artist page: ${item.name}` : item.name}
      >
        {!imgError && (item.cover || item.imageUrl) ? (
          <img
            key={item.cover || item.imageUrl}
            src={item.cover || item.imageUrl}
            alt={item.name}
            className={`w-10 h-10 ${isCollapsed ? '' : 'mr-3'} object-cover flex-shrink-0 ${
              isArtist ? 'rounded-full' : 'rounded border border-gray-800'
            }`}
            onError={() => {
              if (!imgError) {
                setImgError(true);
              }
            }}
          />
        ) : isArtist ? (
          <img
            src={artistImageFromDb}
            alt={item.name}
            className={`w-10 h-10 ${isCollapsed ? '' : 'mr-3'} object-cover flex-shrink-0 rounded-full`}
          />
        ) : (
          <div className={`w-10 h-10 ${isCollapsed ? '' : 'mr-3'} flex items-center justify-center flex-shrink-0 rounded border border-gray-800 bg-gray-900`}>
            <MusicNote sx={{ fontSize: 20, color: '#9ca3af' }} />
          </div>
        )}
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <div className="truncate text-white text-sm font-semibold group-hover:text-green-300">
              {item.name}
            </div>
            <div className="text-xs text-gray-400 flex items-center mt-0.5">
              {!isArtist && item.isPinned && <FaThumbtack className="text-green-400 mr-1" />}
              {typeIcon[item.type]} {isArtist ? 'Artist' : 'Playlist'}
            </div>
          </div>
        )}
      </button>

      {/* Edit Playlist Modal */}
      {!isArtist && isEditModalOpen && (
        <EditPlaylistModal
          isOpen={isEditModalOpen}
          playlist={item}
          onSave={handleSaveEdit}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </>
  );
};

SidebarListItem.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    cover: PropTypes.string,
    type: PropTypes.string.isRequired,
    id: PropTypes.string,
    isPrivate: PropTypes.bool
  }).isRequired,
  onArtistSelect: PropTypes.func,
  onPlaylistSelect: PropTypes.func,
  onViewArtist: PropTypes.func,
  onShowRightPanel: PropTypes.func,
  onPlayArtist: PropTypes.func,
  onPlayPlaylist: PropTypes.func,
  onCreatePlaylist: PropTypes.func,
  isCollapsed: PropTypes.bool,
  isMenuOpen: PropTypes.bool,
  menuPosition: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number
  }),
  onOpenMenu: PropTypes.func,
  onCloseMenu: PropTypes.func
};

export default SidebarListItem;
