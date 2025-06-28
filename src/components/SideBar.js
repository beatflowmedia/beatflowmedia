// components/SideBar.js
import React, { useMemo, useState, useEffect } from "react";
import SidebarListItem from "./SidebarListItem";
import { FaPlus, FaSearch, FaList, FaTimes } from "react-icons/fa";
import PropTypes from "prop-types";

const FILTERS = [
  { label: "Playlists", value: "playlist" },
  { label: "Artists", value: "artist" },
  { label: "Albums", value: "album" },
];

// Helper to group and filter sidebar items
function buildSidebarItems(musicData, playlists, filter, search) {
  const artistSet = new Set();
  const artistItems = musicData
    .filter(song => {
      if (!song.artist || artistSet.has(song.artist)) return false;
      artistSet.add(song.artist);
      return true;
    })
    .map(artistSong => ({
      id: `artist-${artistSong.artist}`,
      name: artistSong.artist,
      cover: `/artistImages/${artistSong.artist}.jpg`,
      type: "artist",
    }));

  const playlistItems = playlists.map(p => ({
    ...p,
    cover: p.cover || "/artistImages/Unknown Artist.jpg",
    type: "playlist",
    id: `playlist-${p.id}`,
  }));

  // Album grouping
  const albumSet = new Set();
  const albumItems = musicData
    .filter(song => song.album && !albumSet.has(song.album))
    .map(song => {
      albumSet.add(song.album);
      return {
        id: `album-${song.album}`,
        name: song.album,
        cover: `/albumImages/${song.album}.jpg`, // ensure these exist or fallback
        type: "album",
      };
    });

  let items = [...playlistItems, ...artistItems, ...albumItems];
  // Only apply type filter when a specific filter other than 'all' is active
  if (filter && filter !== 'all') {
    items = items.filter(item => item.type === filter);
  }
  if (search)
    items = items.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );

  return {
    playlists: items.filter(i => i.type === "playlist"),
    artists: items.filter(i => i.type === "artist"),
    albums: items.filter(i => i.type === "album"),
    all: items,
  };
}

const SideBar = ({
  musicData = [],
  playlists = [],
  onPlaylistSelect,
  onArtistSelect,
  onShowRightPanel,
  onPlayArtist,
  onShowCreatePlaylist,
  onEditPlaylist,
  onDeletePlaylist,
}) => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [subFilter, setSubFilter] = useState("all");

  // Reset sub-filter when main filter changes
  useEffect(() => {
    setSubFilter("all");
  }, [filter]);

  const sidebar = useMemo(
    () => buildSidebarItems(musicData, playlists, filter, search),
    [musicData, playlists, filter, search]
  );
  const { playlists: playlistItems, artists: artistItems, albums: albumItems } = sidebar;

  // Set this to match your NavBar height! h-16 is 64px (standard Tailwind navbar height)
  const NAVBAR_HEIGHT_CLASS = "h-16";

  return (
    <aside className="bg-gray-900 text-white w-72 flex flex-col h-full border-r border-gray-800 min-h-0">
      {/* --- Spacer to match NavBar height --- */}
      <div className={NAVBAR_HEIGHT_CLASS}></div>

      {/* Sidebar header: logo, filters, search */}
      <div className="flex flex-col pt-0 pb-2 flex-shrink-0 z-10 bg-gray-900">
        {/* Filter chips */}
        <div className="flex space-x-2 px-4 mb-2">
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className="px-2 py-1 rounded-full text-xs bg-gray-700 text-gray-300 hover:bg-gray-800"
              title="Clear filter"
            >
              <FaTimes />
            </button>
          )}
          {FILTERS.map(f => (
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
        </div>
        {/* Search */}
        <div className="flex items-center px-4 mb-2">
          <FaSearch className="text-gray-500 mr-2" />
          <input
            className="w-full p-1 bg-gray-800 rounded text-sm text-white"
            placeholder="Search in Your Library"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="ml-2 text-gray-400" title="Recents">
            <FaList />
          </button>
          <button
            className="bg-gray-700 rounded-full p-2 hover:bg-gray-600 ml-2 text-gray-400"
            title="Create Playlist"
            onClick={onShowCreatePlaylist}
          >
            <FaPlus />
          </button>
        </div>
        {/* Playlist sub-filters when viewing Playlists */}
        {filter === "playlist" && (
          <div className="flex space-x-2 px-4 mb-2">
            <button
              onClick={() => setSubFilter("all")}
              className={`px-3 py-1 rounded-full text-xs ${subFilter === "all" ? "bg-gray-800 text-white" : "bg-gray-700 text-gray-300"} hover:bg-gray-800`}
            >
              All
            </button>
            <button
              onClick={() => setSubFilter("user")}
              className={`px-3 py-1 rounded-full text-xs ${subFilter === "user" ? "bg-gray-800 text-white" : "bg-gray-700 text-gray-300"} hover:bg-gray-800`}
            >
              By You
            </button>
            <button
              onClick={() => setSubFilter("beatflow")}
              className={`px-3 py-1 rounded-full text-xs ${subFilter === "beatflow" ? "bg-gray-800 text-white" : "bg-gray-700 text-gray-300"} hover:bg-gray-800`}
            >
              Beatflow
            </button>
          </div>
        )}
      </div>

      {/* Scrollable library: playlists & artists */}
      <div className="overflow-y-auto flex-1 px-2 pb-2 min-h-0">
        {(() => {
          if (filter === "all") {
            return (
              <>
                {playlistItems.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">Playlists</div>
                    {playlistItems.map(item => (
                      <SidebarListItem
                        key={item.id}
                        item={item}
                        onPlaylistSelect={onPlaylistSelect}
                        onPlayArtist={onPlayArtist}
                        onEditPlaylist={onEditPlaylist}
                        onDeletePlaylist={onDeletePlaylist}
                      />
                    ))}
                  </div>
                )}
                {artistItems.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">Artists</div>
                    {artistItems.map(item => (
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
              </>
            );
          }
          const itemsToRender =
            filter === "playlist"
              ? (
                  subFilter === "user"
                    ? playlistItems.filter(item => !item.isBeatflow)
                    : subFilter === "beatflow"
                    ? playlistItems.filter(item => item.isBeatflow)
                    : playlistItems
                )
              : filter === "artist"
              ? artistItems
              : albumItems;
          if (itemsToRender.length === 0) {
            return <div className="text-gray-400 text-center pt-4">No items found.</div>;
          }
          return itemsToRender.map(item => (
            <SidebarListItem
              key={item.id}
              item={item}
              onPlaylistSelect={filter === "playlist" ? onPlaylistSelect : undefined}
              onArtistSelect={filter === "artist" ? onArtistSelect : undefined}
              onShowRightPanel={filter !== "playlist" ? onShowRightPanel : undefined}
              onPlayArtist={onPlayArtist}
            />
          ));
        })()}
      </div>
      {/* Removed modal-based creation in favor of dedicated create route */}
    </aside>
  );
};

SideBar.propTypes = {
  musicData: PropTypes.array,
  playlists: PropTypes.array,
  onPlaylistSelect: PropTypes.func.isRequired,
  onArtistSelect: PropTypes.func.isRequired,
  onShowRightPanel: PropTypes.func.isRequired,
  onPlayArtist: PropTypes.func,
  onShowCreatePlaylist: PropTypes.func, // New prop type
  onEditPlaylist: PropTypes.func, // New prop type
  onDeletePlaylist: PropTypes.func, // New prop type
};

export default SideBar;
