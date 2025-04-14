import React, { useState, useEffect } from "react";
import NavBar from "./components/NavBar";
import SideBar from "./components/SideBar";
import MusicPlayer from "./components/MusicPlayer";
import RightPanel from "./components/RightPanel";
import Home from "./pages/Home";
import Favorites from "./components/Favorites";
import Playlists from "./components/Playlists";
import PlaylistView from "./components/PlaylistView";
import WhatsNew from "./components/WhatsNew";
import ExplorePremium from "./components/ExplorePremium";
import BrowsePage from "./pages/BrowsePage";
import SearchResultsMain from "./components/SearchResultsMain";
import musicData from "./musicData.json";
import { usePlaylistManager } from "./hooks/usePlaylistManager";
import { buildArtistInfo } from "./utils/buildArtistInfo";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function loadLocalStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [rightPanelVisible, setRightPanelVisible] = useState(false);
  const [currentSong, setCurrentSong] = useState(musicData[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [favorites, setFavorites] = useState(loadLocalStorage("favorites", []));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [artistInfo, setArtistInfo] = useState(null);

  const { playlists, createNewPlaylist, addSong, removeSong } = usePlaylistManager();

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    setSelectedPlaylist(null);
    setSelectedArtist(null);
    setSearchQuery(""); // clear search when navigating
  };

  const handleSongSelect = (song) => {
    if (!song) return;
    setCurrentSong(song);
    setIsPlaying(true);
    setSearchQuery(""); // clear search when song is selected
    setRightPanelVisible(true);
  };

  const handleArtistSelect = (artistName) => {
    if (!artistName) return;
    const info = buildArtistInfo(artistName, musicData);
    setSelectedArtist(artistName);
    setArtistInfo(info);
    setSelectedPlaylist(null);
    setSearchQuery(""); // clear search when artist is selected
    if (info?.songs?.length > 0) handleSongSelect(info.songs[0]);
  };

  const handleSelectPlaylist = (playlist) => {
    if (!playlist?.songs) return;
    setSelectedPlaylist(playlist);
    setSelectedArtist(null);
    setSearchQuery("");
    setCurrentPage("home");
  };

  const clearArtistFilter = () => {
    setSelectedArtist(null);
    setArtistInfo(null);
  };

  const toggleFavorite = (song) => {
    if (!song) return;
    setFavorites((prev) =>
      prev.some((fav) => fav.id === song.id)
        ? prev.filter((fav) => fav.id !== song.id)
        : [...prev, song]
    );
  };

  const handleAddSongToPlaylist = async (playlistId, song) => {
    if (!song) return toast.error("⚠️ No song selected.");
    if (selectedPlaylist?.id === playlistId) {
      setSelectedPlaylist((prev) => ({
        ...prev,
        songs: [...prev.songs, song],
      }));
    }
    try {
      await addSong(playlistId, song);
      toast.success(`✅ "${song.title}" added to playlist!`);
    } catch (error) {
      toast.error("Error adding song: " + error.message);
    }
  };

  const handleRemoveSongFromPlaylist = async (playlistId, song) => {
    if (selectedPlaylist?.id === playlistId) {
      setSelectedPlaylist((prev) => ({
        ...prev,
        songs: prev.songs.filter((s) => s.id !== song.id),
      }));
    }
    try {
      await removeSong(playlistId, song);
      toast.success(`🗑️ Removed "${song.title}" from playlist.`);
    } catch (error) {
      toast.error("Error removing song: " + error.message);
    }
  };

  const renderMainContent = () => {
    if (searchQuery.trim() !== "") {
      return (
        <SearchResultsMain
          query={searchQuery}
          musicData={musicData}
          onPlaySong={handleSongSelect}
          onArtistSelect={handleArtistSelect}
        />
      );
    }

    if (showWhatsNew) return <WhatsNew />;

    switch (currentPage) {
      case "favorites":
        return <Favorites favorites={favorites} onSongSelect={handleSongSelect} />;
      case "playlists":
        return (
          <Playlists
            playlists={playlists}
            onCreateNewPlaylist={async () => {
              const name = prompt("Enter a name for your new playlist:");
              if (!name) return;
              try {
                await createNewPlaylist(name);
                toast.success(`✅ Playlist "${name}" created!`);
              } catch (error) {
                toast.error("❌ Failed to create playlist: " + error.message);
              }
            }}
            onAddSongToPlaylist={handleAddSongToPlaylist}
            selectedSong={currentSong}
            onSelectPlaylist={handleSelectPlaylist}
          />
        );
      case "playlistView":
        return (
          <PlaylistView
            playlist={selectedPlaylist}
            onSongSelect={handleSongSelect}
            onRemoveSong={handleRemoveSongFromPlaylist}
          />
        );
      case "explorePremium":
        return <ExplorePremium />;
      case "browse":
        return <BrowsePage />;
      default:
        return (
          <Home
            musicData={musicData}
            onSongSelect={handleSongSelect}
            onToggleFavorite={toggleFavorite}
            favorites={favorites}
            selectedArtist={selectedArtist}
            selectedPlaylist={selectedPlaylist}
            onClearArtist={clearArtistFilter}
            onTogglePlay={(playing) => setIsPlaying(playing)}
            currentSong={currentSong}
            isPlaying={isPlaying}
            playlists={playlists}
            onAddSongToPlaylist={handleAddSongToPlaylist}
            onRemoveSongFromPlaylist={handleRemoveSongFromPlaylist}
          />
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <NavBar
        onWhatsNewClick={() => setShowWhatsNew(!showWhatsNew)}
        isBellActive={showWhatsNew}
        onExplorePremium={() => setCurrentPage("explorePremium")}
        onBrowseClick={() => setCurrentPage("browse")}
        onSearchChange={setSearchQuery}
      />
      <div className="flex flex-1 overflow-hidden">
        <SideBar
          musicData={musicData}
          playlists={playlists}
          onNavigate={handleNavigate}
          onArtistSelect={handleArtistSelect}
          onPlaylistSelect={handleSelectPlaylist}
          onCreatePlaylist={createNewPlaylist}
        />
        <div className={`flex-1 p-6 pt-20 overflow-auto transition-all duration-300 ${rightPanelVisible ? "w-2/3" : "w-full"}`}>
          {renderMainContent()}
        </div>
        <RightPanel visible={rightPanelVisible} artistInfo={artistInfo} onClose={() => setRightPanelVisible(false)} />
      </div>
      <MusicPlayer
        song={currentSong}
        songs={musicData}
        onSongChange={setCurrentSong}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />
      <ToastContainer position="bottom-center" />
    </div>
  );
}

export default App;
