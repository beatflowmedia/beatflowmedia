import React, { useMemo, useState } from "react";
import { groupSongsByArtist } from "../utils/ArtistFilter";
import useFollowArtist from "../hooks/useFollowArtist";
import PlayButton from "../components/PlayButton";
import DropdownMenu from "../components/DropdownMenu";
import { FaTrash, FaBars, FaList, FaSortAlphaDown, FaClock } from "react-icons/fa";

function Home({
  musicData,
  selectedArtist,
  selectedPlaylist,
  onSongSelect,
  onPlay = () => {},
  onToggleFavorite,
  favorites = [],
  currentSong,
  isPlaying,
  playlists,
  onAddSongToPlaylist,
  onRemoveSongFromPlaylist,
}) {
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [viewMode, setViewMode] = useState("compact");
  const [sortMode, setSortMode] = useState("recentlyAdded");

  const songsGrouped = useMemo(() => groupSongsByArtist(musicData || []), [musicData]);
  const { isFollowing, toggleFollow } = useFollowArtist(selectedArtist);

  const normalizedArtist = selectedArtist ? selectedArtist.trim().toLowerCase() : null;

  const songsToDisplay = useMemo(() => {
    let songs = selectedPlaylist?.songs?.length
      ? selectedPlaylist.songs
      : normalizedArtist
      ? songsGrouped[normalizedArtist] || []
      : musicData;

    if (sortMode === "alpha") {
      return [...songs].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortMode === "recentlyAdded") {
      return [...songs].sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
    }
    return songs;
  }, [musicData, selectedPlaylist, normalizedArtist, songsGrouped, sortMode]);

  const handleAddToPlaylistClick = (song) => {
    setSelectedSong(song);
    setShowPlaylistModal(true);
  };

  return (
    <div className="pt-16 px-6">
      {selectedPlaylist ? (
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">{selectedPlaylist.name}</h1>
          <p className="text-gray-400 text-sm">{selectedPlaylist.songs.length} song(s)</p>
        </div>
      ) : selectedArtist ? (
        <div className="relative w-full h-64 bg-gradient-to-b from-gray-700 to-black rounded-lg overflow-hidden mb-6">
          <img
            src={`/artistImages/${selectedArtist}.jpg`}
            alt={selectedArtist}
            className="absolute w-full h-full object-cover opacity-50"
          />
          <div className="relative z-10 flex flex-col justify-end h-full p-6">
            <h1 className="text-white text-5xl font-bold">{selectedArtist}</h1>
            <p className="text-gray-300 text-lg">Popular Songs</p>
            <div className="mt-2">
              <button
                className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                  isFollowing
                    ? "bg-red-500 hover:bg-red-400 text-white"
                    : "bg-green-500 hover:bg-green-400 text-white"
                }`}
                onClick={toggleFollow}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold">Popular Songs</h2>
          <DropdownMenu
            trigger={
              <button className="flex items-center space-x-2 text-white text-sm hover:text-green-400">
                {viewMode === "list" ? <FaList /> : <FaBars />} <span>{viewMode === "list" ? "List" : "Compact"}</span>
              </button>
            }
            items={[
              { label: "Compact", icon: <FaBars />, active: viewMode === "compact", onClick: () => setViewMode("compact") },
              { label: "List", icon: <FaList />, active: viewMode === "list", onClick: () => setViewMode("list") },
              "divider",
              { label: "Alphabetical", icon: <FaSortAlphaDown />, active: sortMode === "alpha", onClick: () => setSortMode("alpha") },
              { label: "Recently Added", icon: <FaClock />, active: sortMode === "recentlyAdded", onClick: () => setSortMode("recentlyAdded") },
            ]}
          />
        </div>
      )}

      <div className={viewMode === "list" ? "space-y-2" : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"}>
        {songsToDisplay.map((song) => {
          const isInPlaylist = selectedPlaylist?.songs?.some((s) => s.id === song.id);
          return (
            <div
              key={song.id}
              className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-all cursor-pointer"
            >
              <img
                src={song.cover || "https://via.placeholder.com/50"}
                alt="Album Cover"
                className="w-14 h-14 rounded-md mb-2"
              />
              <h3 className="text-white font-bold text-sm">{song.title}</h3>
              <p className="text-gray-400 text-xs">{song.artist}</p>
              <div className="flex items-center justify-between mt-2">
                <PlayButton
                  isPlaying={currentSong && currentSong.id === song.id && isPlaying}
                  onClick={() => {
                    if (currentSong && currentSong.id === song.id) {
                      onPlay(!isPlaying); // toggle play/pause
                    } else {
                      onSongSelect(song);
                      onPlay(true); // start new song
                    }
                  }}
                  size={20}
                />

                <button
                  className="text-green-400 hover:text-green-300 text-lg ml-2"
                  title={isInPlaylist ? "Remove from Playlist" : "Add to Playlist"}
                  onClick={() => {
                    if (isInPlaylist) {
                      onRemoveSongFromPlaylist(selectedPlaylist.id, song);
                    } else {
                      handleAddToPlaylistClick(song);
                    }
                  }}
                >
                  {isInPlaylist ? <FaTrash /> : "➕"}
                </button>
                <button
                  onClick={() => onToggleFavorite(song)}
                  className={`text-lg transition ${
                    favorites.some((fav) => fav.id === song.id)
                      ? "text-red-500"
                      : "text-gray-400 hover:text-red-400"
                  }`}
                  title={favorites.some((fav) => fav.id === song.id) ? "Unlike" : "Like"}
                >
                  {favorites.some((fav) => fav.id === song.id) ? "♥" : "♡"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showPlaylistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-white text-xl font-bold mb-4">Select a Playlist</h2>
            {playlists.length === 0 ? (
              <p className="text-gray-400">No playlist available.</p>
            ) : (
              playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  className="block w-full text-left p-2 hover:bg-gray-700 rounded"
                  onClick={() => {
                    onAddSongToPlaylist(playlist.id, selectedSong);
                    setShowPlaylistModal(false);
                  }}
                >
                  {playlist.name}
                </button>
              ))
            )}
            <button
              onClick={() => setShowPlaylistModal(false)}
              className="mt-4 bg-red-500 px-4 py-2 rounded hover:bg-red-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
