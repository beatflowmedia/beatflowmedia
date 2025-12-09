// src/layouts/AppShell.js
import React, { useState, useEffect, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import NavBar from "../components/NavBar";
import SideBar from "../components/SideBar";
import MusicPlayer from "../components/MusicPlayer";
import RightPanel from "../components/RightPanel";
import ErrorBoundary from "../components/ErrorBoundary";

import { usePlaylistManager } from "../hooks/usePlaylistManager";
import { useAuth } from "../context/AuthContext";
import musicData from "../musicData.json";
import { buildArtistInfo } from "../utils/buildArtistInfo";

import styles from "./LayoutGrid.module.css";

/**
 * AppShell - Modern grid-based layout container
 *
 * Layout Structure:
 * ┌─────────────────────────────────────┐
 * │           NavBar                     │
 * ├──────┬───────────────┬───────────────┤
 * │ Side │     Main      │  RightPanel   │
 * │ Bar  │   <Outlet/>   │  (optional)   │
 * ├──────┴───────────────┴───────────────┤
 * │         MusicPlayer                  │
 * └─────────────────────────────────────┘
 */
export default function AppShell() {
  const location = useLocation();
  const { user } = useAuth();
  const { playlists, createNewPlaylist, addSong, removeSong } = usePlaylistManager();

  // UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelVisible, setRightPanelVisible] = useState(false);
  const [rightPanelContent, setRightPanelContent] = useState(null);
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  // Playback State
  const [currentSong, setCurrentSong] = useState(musicData[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Favorites State
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("favorites")) || [];
    } catch {
      return [];
    }
  });

  // Persist favorites to localStorage
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Global play song event handler
  useEffect(() => {
    const handler = (e) => {
      setCurrentSong(e.detail);
      setIsPlaying(true);
      setSearchQuery("");
      setRightPanelVisible(false);
    };
    window.addEventListener("PLAY_SONG", handler);
    return () => window.removeEventListener("PLAY_SONG", handler);
  }, []);

  // Helper to dispatch play song event
  const playSong = (song) => {
    window.dispatchEvent(new CustomEvent("PLAY_SONG", { detail: song }));
  };

  // Right Panel Handlers
  const openRightPanel = (content) => {
    let info = null;
    if (content?.type === "artist") {
      info = buildArtistInfo(content.artistName, musicData);
    } else if (content?.type === "playlist") {
      info = content;
    }
    setRightPanelContent(info ? { ...content, info } : content);
    setRightPanelVisible(true);
  };

  const closeRightPanel = () => {
    setRightPanelVisible(false);
    setRightPanelContent(null);
  };

  // NavBar Handlers
  const handleHomeClick = () => {
    setSearchQuery("");
    // Navigation is handled by react-router
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    // TODO: Navigate to /search with query param
  };

  const handleExplorePremium = () => {
    // Navigate to premium page
    window.location.href = "/explore-premium";
  };

  const handleDownloadClick = () => {
    console.log("Download clicked");
  };

  const handleWhatsNewClick = () => {
    setShowWhatsNew((prev) => !prev);
  };

  // Sidebar Handlers
  const handlePlaylistSelect = (playlist) => {
    console.log("Playlist selected:", playlist);
    // TODO: Navigate to playlist page
  };

  const handleArtistSelect = (artistName) => {
    console.log("Artist selected:", artistName);
    // TODO: Navigate to artist page
  };

  const handlePlayArtist = (artistName) => {
    const songs = musicData.filter((song) => song.artist === artistName);
    if (songs[0]) playSong(songs[0]);
  };

  // Player Handlers
  const handleSongChange = (song) => {
    setCurrentSong(song);
  };

  const handlePlayPause = (song) => {
    setCurrentSong(song);
    setIsPlaying((prev) => (song.id !== currentSong?.id ? true : !prev));
  };

  // Toggle Favorite
  const toggleFavorite = (song) => {
    setFavorites((favs) =>
      favs.some((s) => s.id === song.id)
        ? favs.filter((s) => s.id !== song.id)
        : [...favs, song]
    );
  };

  // Compute container classes
  const containerClasses = [
    styles.appContainer,
    sidebarCollapsed && styles.sidebarCollapsed,
    rightPanelVisible && styles.rightPanelOpen,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClasses}>
      {/* NavBar */}
      <header className={styles.navbar}>
        <NavBar
          onHomeClick={handleHomeClick}
          onSearchChange={handleSearchChange}
          onExplorePremium={handleExplorePremium}
          onDownloadClick={handleDownloadClick}
          onWhatsNewClick={handleWhatsNewClick}
          isBellActive={showWhatsNew}
        />
      </header>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ""}`}>
        <SideBar
          musicData={musicData}
          playlists={playlists}
          onPlaylistSelect={handlePlaylistSelect}
          onArtistSelect={handleArtistSelect}
          onShowRightPanel={(artistName) =>
            openRightPanel({ type: "artist", artistName })
          }
          onCreatePlaylist={createNewPlaylist}
          onPlayArtist={handlePlayArtist}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </aside>

      {/* Main Content Area */}
      <main className={styles.main}>
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className={styles.loading}>
                <div>Loading...</div>
              </div>
            }
          >
            <Outlet
              context={{
                // Context passed to child routes
                currentSong,
                isPlaying,
                favorites,
                playlists,
                musicData,
                playSong,
                toggleFavorite,
                onAddSongToPlaylist: addSong,
                onRemoveSongFromPlaylist: removeSong,
                onCreatePlaylist: createNewPlaylist,
                onOpenRightPanel: openRightPanel,
                searchQuery,
              }}
            />
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Right Panel */}
      {rightPanelVisible && (
        <aside className={`${styles.rightPanel} ${!rightPanelVisible ? styles.hidden : ""}`}>
          <RightPanel
            visible={rightPanelVisible}
            content={rightPanelContent}
            onClose={closeRightPanel}
          />
        </aside>
      )}

      {/* Music Player */}
      <footer className={styles.player}>
        <MusicPlayer
          song={currentSong}
          songs={musicData}
          onSongChange={handleSongChange}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          onPlayPause={handlePlayPause}
        />
      </footer>

      {/* Toast Notifications */}
      <ToastContainer position="bottom-center" theme="dark" />
    </div>
  );
}
