import React, { useMemo, useState, useEffect, memo, useCallback } from "react";
import PropTypes from "prop-types";
import { groupSongsByArtist } from "../utils/ArtistFilter";
import useFollowArtist from "../hooks/useFollowArtist";
import PlayButton from "../components/PlayButton";
import DropdownMenu from "../components/DropdownMenu";
import LikeButton from "../components/LikeButton";
import AddToPlaylistModal from "../components/AddToPlaylistModal";
import { toast } from "react-toastify";
import {
  FaMusic, FaPlus, FaShareAlt, FaBars, FaList,
  FaSortAlphaDown, FaClock, FaTwitter, FaFacebook, FaLinkedin,
  FaReddit, FaEnvelope, FaLink,
} from "react-icons/fa";
import { db } from "../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import {
  getSongUrl, getShareText, shareOnTwitter, shareOnFacebook,
  shareOnLinkedIn, shareOnReddit, shareViaEmail, copyToClipboard,
} from "../utils/shareHelper";

const SORT_OPTIONS = [
  { label: "Alphabetical", icon: <FaSortAlphaDown />, value: "alpha" },
  { label: "Recently Added", icon: <FaClock />, value: "recentlyAdded" },
];
const VIEW_OPTIONS = [
  { label: "Compact", icon: <FaBars />, value: "compact" },
  { label: "List", icon: <FaList />, value: "list" },
];

function Home({
  musicData,
  selectedArtist,
  selectedPlaylist,
  onSongSelect,
  onPlayPause,
  onToggleFavorite,
  favorites = [],
  currentSong,
  isPlaying = false,
  playlists = [],
  onAddSongToPlaylist,
  onRemoveSongFromPlaylist,
  onCreatePlaylist,
  onOpenRightPanel,
}) {
  const [viewMode, setViewMode] = useState("compact");
  const [sortMode, setSortMode] = useState("recentlyAdded");
  const [globalLikes, setGlobalLikes] = useState({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSong, setShareSong] = useState(null);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [pendingSong, setPendingSong] = useState(null);
  const [firestoreSongs, setFirestoreSongs] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "songLikes"), (snap) => {
      const counts = {};
      snap.docs.forEach((d) => {
        counts[d.id] = d.data().likers?.length || 0;
      });
      setGlobalLikes(counts);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (musicData?.length) return;
    const unsub = onSnapshot(collection(db, "artistSubmissions"), (snap) => {
      const songs = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          artist: data.artist,
          cover: data.coverUrl || "",
          addedAt: data.submittedAt?.toDate?.() || new Date(),
          audioUrl: data.audioUrl,
        };
      });
      setFirestoreSongs(songs);
    });
    return unsub;
  }, [musicData]);

  const songsSource = musicData?.length ? musicData : firestoreSongs;

  const songsByArtist = useMemo(() => groupSongsByArtist(songsSource), [songsSource]);
  const normalizedArtist = selectedArtist?.trim().toLowerCase();
  const { isFollowing, toggleFollow } = useFollowArtist(selectedArtist);

  const songs = useMemo(() => {
    const base = selectedPlaylist?.songs?.length
      ? selectedPlaylist.songs
      : normalizedArtist
        ? songsByArtist[normalizedArtist] || []
        : songsSource;

    return [...base].sort((a, b) =>
      sortMode === "alpha"
        ? a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
        : new Date(b.addedAt || 0) - new Date(a.addedAt || 0)
    );
  }, [songsSource, selectedPlaylist, normalizedArtist, songsByArtist, sortMode]);

  const handleShare = useCallback((song) => {
    setShareSong(song);
    setShowShareModal(true);
  }, []);
  const closeShareModal = useCallback(() => {
    setShowShareModal(false);
    setShareSong(null);
  }, []);
  const songUrl = shareSong ? getSongUrl(shareSong.id) : "";
  const shareText = shareSong ? getShareText(shareSong.title, shareSong.id) : "";

  const handleAddToPlaylistClick = (song) => {
    setPendingSong(song);
    setShowAddToPlaylistModal(true);
  };
  const handleCloseAddToPlaylistModal = () => {
    setPendingSong(null);
    setShowAddToPlaylistModal(false);
  };
  const handleAddToExistingPlaylist = (playlistId, song) => {
    onAddSongToPlaylist(playlistId, song);
    toast.success("Song added to playlist!");
    handleCloseAddToPlaylistModal();
  };
  const handleCreateAndAddToPlaylist = (playlistName, song) => {
    onCreatePlaylist(playlistName, song);
    toast.success(`Playlist "${playlistName}" created and song added!`);
    handleCloseAddToPlaylistModal();
  };

  const handlePeekArtist = (artist) => {
    if (onOpenRightPanel) {
      onOpenRightPanel({ type: "artist", artistName: artist });
    }
  };
  const handlePeekPlaylist = () => {
    if (onOpenRightPanel && selectedPlaylist) {
      onOpenRightPanel({ type: "playlist", ...selectedPlaylist });
    }
  };

  return (
    <div className="pt-16 px-6">
      {!selectedArtist && !selectedPlaylist && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white">Popular Songs</h2>
          <div className="flex space-x-4">
            <DropdownMenu
              trigger={<button className="flex items-center space-x-1 text-sm text-white">{VIEW_OPTIONS.find(v => v.value === viewMode).icon}<span className="capitalize">{viewMode}</span></button>}
              items={VIEW_OPTIONS.map(({ label, icon, value }) => ({
                label,
                icon,
                active: viewMode === value,
                onClick: () => setViewMode(value),
              }))}
            />
            <DropdownMenu
              trigger={<button className="flex items-center space-x-1 text-sm text-white">{SORT_OPTIONS.find(s => s.value === sortMode).icon}<span className="capitalize">{sortMode}</span></button>}
              items={SORT_OPTIONS.map(({ label, icon, value }) => ({
                label,
                icon,
                active: sortMode === value,
                onClick: () => setSortMode(value),
              }))}
            />
          </div>
        </div>
      )}

      {selectedPlaylist ? (
        <div className="mb-6 cursor-pointer flex items-center gap-4" onClick={handlePeekPlaylist}>
          <img src={selectedPlaylist.cover || "/playlist-default.jpg"} alt={selectedPlaylist.name} className="w-28 h-28 rounded-lg object-cover shadow" />
          <div>
            <h1 className="text-3xl font-bold text-white">{selectedPlaylist.name}</h1>
            <p className="text-gray-400">{selectedPlaylist.songs?.length || 0} song(s)</p>
          </div>
        </div>
      ) : selectedArtist ? (
        <div className="relative mb-6 h-64 overflow-hidden rounded-lg bg-gradient-to-b from-gray-700 to-black group">
          <img src={`/artistImages/${selectedArtist}.jpg`} alt={selectedArtist} className="absolute inset-0 w-full h-full object-cover opacity-50 cursor-pointer" onClick={() => handlePeekArtist(selectedArtist)} />
          <div className="relative z-10 flex h-full flex-col justify-end p-6">
            <h1 className="text-5xl font-bold text-white cursor-pointer hover:underline" onClick={() => handlePeekArtist(selectedArtist)}>{selectedArtist}</h1>
            <button onClick={toggleFollow} className={`mt-2 rounded-md px-4 py-2 text-sm font-semibold ${isFollowing ? "bg-red-500" : "bg-green-500"} text-white`}>
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          </div>
        </div>
      ) : null}

      <div className={viewMode === "list" ? "space-y-4" : "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"}>
        {songs.map((song) => {
          const isFav = favorites.some((f) => f.id === song.id);
          const likes = globalLikes[song.id] || 0;
          return (
            <div key={song.id} className="rounded-lg bg-gray-800 p-4 hover:bg-gray-700 transition">
              <img src={song.cover || "https://via.placeholder.com/50"} alt={song.title} className="w-14 h-14 mb-2 rounded-md object-cover" />
              <h3 className="mb-1 text-sm font-bold text-white cursor-pointer" onClick={() => onSongSelect(song)}>{song.title}</h3>
              <p className="text-xs text-green-400 cursor-pointer hover:underline" onClick={() => handlePeekArtist(song.artist)}>{song.artist}</p>
              <p className="mb-2 text-xs text-gray-400">{likes} likes</p>
              <div className="flex items-center justify-between">
                <PlayButton isPlaying={currentSong?.id === song.id && isPlaying} onClick={() => onPlayPause(song)} size={20} />
                <div className="flex items-center space-x-2 bg-gray-700 bg-opacity-50 p-1 rounded-md">
                  <button onClick={() => handleAddToPlaylistClick(song)} className="relative text-green-400"><FaMusic /><FaPlus className="absolute -top-1 -right-1 text-xs" /></button>
                  <LikeButton item={song} isLiked={isFav} onToggleFavorite={onToggleFavorite} size={18} />
                  <button onClick={() => handleShare(song)} className="text-blue-400"><FaShareAlt /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showShareModal && shareSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-80 space-y-4 rounded-lg bg-gray-900 p-6 shadow-lg">
            <div className="flex justify-between">
              <h2 className="text-xl font-bold text-white">Share to...</h2>
              <button onClick={closeShareModal} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="flex flex-col space-y-2">
              <button onClick={() => shareOnTwitter(shareText)}><FaTwitter className="mr-2" /> Twitter</button>
              <button onClick={() => shareOnFacebook(songUrl)}><FaFacebook className="mr-2" /> Facebook</button>
              <button onClick={() => shareOnLinkedIn(songUrl)}><FaLinkedin className="mr-2" /> LinkedIn</button>
              <button onClick={() => shareOnReddit(songUrl)}><FaReddit className="mr-2" /> Reddit</button>
              <button onClick={() => shareViaEmail(shareSong.title, shareText)}><FaEnvelope className="mr-2" /> Email</button>
              <button onClick={async () => { await copyToClipboard(shareText); toast.success("Link copied!"); }}><FaLink className="mr-2" /> Copy link</button>
            </div>
          </div>
        </div>
      )}

      {showAddToPlaylistModal && (
        <AddToPlaylistModal
          song={pendingSong}
          playlists={playlists}
          onClose={handleCloseAddToPlaylistModal}
          onAddToPlaylist={handleAddToExistingPlaylist}
          onCreatePlaylist={handleCreateAndAddToPlaylist}
        />
      )}
    </div>
  );
}

Home.propTypes = {
  musicData: PropTypes.array,
  selectedArtist: PropTypes.string,
  selectedPlaylist: PropTypes.object,
  onSongSelect: PropTypes.func.isRequired,
  onPlayPause: PropTypes.func.isRequired,
  onToggleFavorite: PropTypes.func.isRequired,
  favorites: PropTypes.array,
  currentSong: PropTypes.object,
  isPlaying: PropTypes.bool,
  playlists: PropTypes.array,
  onAddSongToPlaylist: PropTypes.func.isRequired,
  onRemoveSongFromPlaylist: PropTypes.func.isRequired,
  onCreatePlaylist: PropTypes.func.isRequired,
  onOpenRightPanel: PropTypes.func,
};

export default memo(Home);
