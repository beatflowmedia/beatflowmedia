// src/pages/Home.js
import React, { useMemo, useState, useEffect, memo } from "react";
import PropTypes from "prop-types";
import { groupSongsByArtist } from "../utils/ArtistFilter";
import useFollowArtist from "../hooks/useFollowArtist";
import PlayButton from "../components/PlayButton";
import DropdownMenu from "../components/DropdownMenu";
import LikeButton from "../components/LikeButton";
import { toast } from "react-toastify";

import {
  FaTrashAlt,
  FaMusic,
  FaPlus,
  FaShareAlt,
  FaBars,
  FaList,
  FaSortAlphaDown,
  FaClock,
  FaTwitter,
  FaFacebook,
  FaLinkedin,
  FaReddit,
  FaEnvelope,
  FaLink,
} from "react-icons/fa";

import { db } from "../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";

import {
  getSongUrl,
  getShareText,
  shareOnTwitter,
  shareOnFacebook,
  shareOnLinkedIn,
  shareOnReddit,
  shareViaEmail,
  copyToClipboard,
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
  onPlay,
  onToggleFavorite,
  favorites,
  currentSong,
  isPlaying,
  playlists,
  onAddSongToPlaylist,
  onRemoveSongFromPlaylist,
}) {
  const [viewMode, setViewMode] = useState("compact");
  const [sortMode, setSortMode] = useState("recentlyAdded");
  const [globalLikes, setGlobalLikes] = useState({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSong, setShareSong] = useState(null);

  // ── Subscribe to global likes ────────────────────────────────────────────────
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

  // ── Artist / playlist grouping & follow toggle ───────────────────────────────
  const songsByArtist = useMemo(() => groupSongsByArtist(musicData), [musicData]);
  const normalizedArtist = selectedArtist?.trim().toLowerCase();
  const { isFollowing, toggleFollow } = useFollowArtist(selectedArtist);

  // ── Filter + sort the list of songs ───────────────────────────────────────────
  const songs = useMemo(() => {
    const base = selectedPlaylist?.songs?.length
      ? selectedPlaylist.songs
      : normalizedArtist
      ? songsByArtist[normalizedArtist] || []
      : musicData;

    return [...base].sort((a, b) =>
      sortMode === "alpha"
        ? a.title.localeCompare(b.title)
        : new Date(b.addedAt || 0) - new Date(a.addedAt || 0)
    );
  }, [musicData, selectedPlaylist, normalizedArtist, songsByArtist, sortMode]);

  // ── Share handlers ───────────────────────────────────────────────────────────
  const handleShare = (song) => {
    setShareSong(song);
    setShowShareModal(true);
  };
  const closeShareModal = () => {
    setShowShareModal(false);
    setShareSong(null);
  };

  const songUrl = shareSong ? getSongUrl(shareSong.id) : "";
  const shareText = shareSong ? getShareText(shareSong.title, shareSong.id) : "";

  return (
    <div className="pt-16 px-6">
      {/* ── Controls (only on main “Popular Songs” view) ────────────────────────── */}
      {!selectedArtist && !selectedPlaylist && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white">Popular Songs</h2>
          <div className="flex space-x-4">
            {/* View mode dropdown */}
            <DropdownMenu
              trigger={
                <button className="flex items-center space-x-1 text-sm text-white focus:outline-none">
                  {VIEW_OPTIONS.find((v) => v.value === viewMode).icon}
                  <span>{viewMode}</span>
                </button>
              }
              items={VIEW_OPTIONS.map(({ label, icon, value }) => ({
                label,
                icon,
                active: viewMode === value,
                onClick: () => setViewMode(value),
              }))}
            />

            {/* Sort mode dropdown */}
            <DropdownMenu
              trigger={
                <button className="flex items-center space-x-1 text-sm text-white focus:outline-none">
                  {SORT_OPTIONS.find((s) => s.value === sortMode).icon}
                  <span>{sortMode}</span>
                </button>
              }
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

      {/* ── Playlist or Artist Header ──────────────────────────────────────────── */}
      {selectedPlaylist ? (
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">{selectedPlaylist.name}</h1>
          <p className="text-gray-400">
            {selectedPlaylist.songs.length} song
            {selectedPlaylist.songs.length !== 1 && "s"}
          </p>
        </div>
      ) : selectedArtist ? (
        <div className="relative mb-6 h-64 overflow-hidden rounded-lg bg-gradient-to-b from-gray-700 to-black">
          <img
            src={`/artistImages/${selectedArtist}.jpg`}
            alt={selectedArtist}
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          <div className="relative z-10 flex h-full flex-col justify-end p-6">
            <h1 className="text-5xl font-bold text-white">{selectedArtist}</h1>
            <button
              onClick={toggleFollow}
              className={`mt-2 rounded-md px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                isFollowing
                  ? "bg-red-500 hover:bg-red-400 text-white"
                  : "bg-green-500 hover:bg-green-400 text-white"
              }`}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          </div>
        </div>
      ) : null}

      {/* ── Songs Grid / List ───────────────────────────────────────────────────── */}
      <div
        className={
          viewMode === "list"
            ? "space-y-4"
            : "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        }
      >
        {songs.map((song) => {
          const inPlaylist = selectedPlaylist?.songs?.some((s) => s.id === song.id);
          const isFav = favorites.some((f) => f.id === song.id);
          const likes = globalLikes[song.id] || 0;

          return (
            <div
              key={song.id}
              className="rounded-lg bg-gray-800 p-4 hover:bg-gray-700 transition"
            >
              <img
                src={song.cover || "https://via.placeholder.com/50"}
                alt={song.title}
                className="w-14 h-14 mb-2 rounded-md object-cover"
              />
              <h3 className="mb-1 text-sm font-bold text-white">{song.title}</h3>
              <p className="text-xs text-gray-400">{song.artist}</p>
              <p className="mb-2 text-xs text-gray-400">{likes} likes</p>

              <div className="flex items-center justify-between">
                <PlayButton
                  isPlaying={currentSong?.id === song.id && isPlaying}
                  onClick={() =>
                    currentSong?.id === song.id
                      ? onPlay(!isPlaying)
                      : (onSongSelect(song), onPlay(true))
                  }
                  size={20}
                />

                <div className="flex items-center space-x-2 rounded-md bg-gray-700 bg-opacity-50 p-1">
                  {/* Add / Remove from playlist */}
                  <button
                    onClick={() =>
                      inPlaylist
                        ? onRemoveSongFromPlaylist(selectedPlaylist.id, song)
                        : onAddSongToPlaylist(selectedPlaylist?.id, song)
                    }
                    className="relative text-green-400 hover:text-green-300 focus:outline-none"
                    title={inPlaylist ? "Remove from playlist" : "Add to playlist"}
                  >
                    {inPlaylist ? <FaTrashAlt /> : <FaMusic />}
                    {!inPlaylist && (
                      <FaPlus className="absolute -top-1 -right-1 text-xs" />
                    )}
                  </button>

                  {/* Like / Unlike */}
                  <LikeButton
                    item={song}
                    isLiked={isFav}
                    onToggleFavorite={onToggleFavorite}
                    size={18}
                  />

                  {/* Share */}
                  <button
                    onClick={() => handleShare(song)}
                    className="text-blue-400 hover:text-blue-300 focus:outline-none"
                    title="Share"
                  >
                    <FaShareAlt />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Share Modal ─────────────────────────────────────────────────────────── */}
      {showShareModal && shareSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-80 space-y-4 rounded-lg bg-gray-900 p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Share to...</h2>
              <button
                onClick={closeShareModal}
                className="text-gray-400 hover:text-white focus:outline-none"
                aria-label="Close share modal"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => shareOnTwitter(shareText)}
                className="flex items-center p-2 hover:bg-gray-800 rounded focus:outline-none"
              >
                <FaTwitter className="mr-2" /> Twitter
              </button>
              <button
                onClick={() => shareOnFacebook(songUrl)}
                className="flex items-center p-2 hover:bg-gray-800 rounded focus:outline-none"
              >
                <FaFacebook className="mr-2" /> Facebook
              </button>
              <button
                onClick={() => shareOnLinkedIn(songUrl)}
                className="flex items-center p-2 hover:bg-gray-800 rounded focus:outline-none"
              >
                <FaLinkedin className="mr-2" /> LinkedIn
              </button>
              <button
                onClick={() => shareOnReddit(songUrl)}
                className="flex items-center p-2 hover:bg-gray-800 rounded focus:outline-none"
              >
                <FaReddit className="mr-2" /> Reddit
              </button>
              <button
                onClick={() => shareViaEmail(shareSong.title, shareText)}
                className="flex items-center p-2 hover:bg-gray-800 rounded focus:outline-none"
              >
                <FaEnvelope className="mr-2" /> Email
              </button>
              <button
                onClick={async () => {
                  await copyToClipboard(shareText);
                  toast.success("Link copied to clipboard!");
                }}
                className="flex items-center p-2 hover:bg-gray-800 rounded focus:outline-none"
              >
                <FaLink className="mr-2" /> Copy link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Home.propTypes = {
  musicData: PropTypes.array.isRequired,
  selectedArtist: PropTypes.string,
  selectedPlaylist: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    songs: PropTypes.array,
  }),
  onSongSelect: PropTypes.func.isRequired,
  onPlay: PropTypes.func,
  onToggleFavorite: PropTypes.func.isRequired,
  favorites: PropTypes.array,
  currentSong: PropTypes.object,
  isPlaying: PropTypes.bool,
  playlists: PropTypes.array,
  onAddSongToPlaylist: PropTypes.func.isRequired,
  onRemoveSongFromPlaylist: PropTypes.func.isRequired,
};

Home.defaultProps = {
  onPlay: () => {},
  favorites: [],
  playlists: [],
  isPlaying: false,
};

export default memo(Home);
