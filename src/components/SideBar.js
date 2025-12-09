// components/SideBar.js
import React, { useState , useMemo } from "react";
import SidebarListItem from "./SidebarListItem";
import NewPlaylistModal from "./NewPlaylistModal";
import { FaPlus, FaSearch, FaList } from "react-icons/fa";
import PropTypes from 'prop-types';

const FILTERS = [
  { label: "Playlists", value: "playlist" },
  { label: "Artists", value: "artist" },
];

// Helper to group and filter sidebar items
function buildSidebarItems(musicData, playlists, filter, search) {
  const artistSet = new Set();
  const artistItems = musicData
    .filter((song) => {
      if (!song.artist || artistSet.has(song.artist)) return false;
      artistSet.add(song.artist);
      return true;
    })
    .map((artistSong) => ({
      id: `artist-${artistSong.artist}`,
      name: artistSong.artist,
      cover: `/artistImages/${artistSong.artist}.jpg`,
      type: "artist"
    }));

  const playlistItems = playlists.map((p) => ({
    ...p,
    cover: p.cover || "/playlist-default.jpg",
    type: "playlist",
    id: `playlist-${p.id}`
  }));

  let items = [...playlistItems, ...artistItems];
  if (filter) items = items.filter((item) => item.type === filter);
  if (search)
    items = items.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase()),
    );

  return {
    playlists: items.filter((i) => i.type === "playlist"),
    artists: items.filter((i) => i.type === "artist"),
    all: items
  };
}

const SideBar = ({
  musicData = [],
  playlists = [],
  onPlaylistSelect,
  onArtistSelect,
  onShowRightPanel,
  onCreatePlaylist,
  onPlayArtist,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  const sidebar = useMemo(
    () => buildSidebarItems(musicData, playlists, filter, search),
    [musicData, playlists, filter, search],
  );
  const { playlists: playlistItems, artists: artistItems } = sidebar;

  return (
    <aside className="bg-gray-900 text-white flex flex-col h-full border-r border-gray-800 min-h-0">
      {/* No more spacer - grid handles positioning */}

      {/* Sidebar header: logo, filters, search */}
      <div className="flex flex-col pt-0 pb-2 flex-shrink-0 z-10 bg-gray-900">
        {/* Filter chips */}
        <div className="flex space-x-2 px-4 mb-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`px-3 py-1 rounded-full text-xs ${
                filter === f.value
                  ? "bg-gray-800 text-white"
                  : "bg-gray-700 text-gray-300"
              } hover:bg-gray-800`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
          <button
            className={`px-3 py-1 rounded-full text-xs ${
              !filter ? "bg-gray-800 text-white" : "bg-gray-700 text-gray-300"
            } hover:bg-gray-800`}
            onClick={() => setFilter("")}
          >
            All
          </button>
        </div>
        {/* Search */}
        <div className="flex items-center px-4 mb-2">
          <FaSearch className="text-gray-500 mr-2" />
          <input
            className="w-full p-1 bg-gray-800 rounded text-sm text-white"
            placeholder="Search in Your Library"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="ml-2 text-gray-400" title="Recents">
            <FaList />
          </button>
          <button
            className="bg-gray-700 rounded-full p-2 hover:bg-gray-600 ml-2"
            title="Create Playlist"
            onClick={() => setShowModal(true)}
          >
            <FaPlus />
          </button>
        </div>
      </div>

      {/* Scrollable library: playlists & artists */}
      <div className="overflow-y-auto flex-1 px-2 pb-2 min-h-0">
        {playlistItems.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">
              Playlists
            </div>
            {playlistItems.map((item) => (
              <SidebarListItem
                key={item.id}
                item={item}
                onPlaylistSelect={onPlaylistSelect}
              />
            ))}
          </div>
        )}
        {artistItems.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">
              Artists
            </div>
            {artistItems.map((item) => (
              <SidebarListItem
                key={item.id}
                item={item}
                onArtistSelect={onArtistSelect}
                onShowRightPanel={onShowRightPanel}
                onPlayArtist={onPlayArtist}
              />
            ))}
          </div>
        )}
        {playlistItems.length === 0 && artistItems.length === 0 && (
          <div className="text-gray-400 text-center pt-4">No items found.</div>
        )}
      </div>
      {/* New Playlist Modal */}
      {showModal && (
        <NewPlaylistModal
          onCreate={(name) => {
            onCreatePlaylist(name);
            setShowModal(false);
          }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </aside>
  );
};

SideBar.propTypes = {
  musicData: PropTypes.array,
  playlists: PropTypes.array,
  onPlaylistSelect: PropTypes.func.isRequired,
  onArtistSelect: PropTypes.func.isRequired,
  onShowRightPanel: PropTypes.func.isRequired,
  onCreatePlaylist: PropTypes.func.isRequired,
  onPlayArtist: PropTypes.func,
  isCollapsed: PropTypes.bool,
  onToggleCollapse: PropTypes.func
};

export default SideBar;
