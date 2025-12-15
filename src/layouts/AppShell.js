// src/layouts/AppShell.js
import { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import NavBar from "../components/NavBar";
import SideBar from "../components/SideBar";
import MusicPlayer from "../components/MusicPlayer";
import RightPanel from "../components/RightPanel";
import ErrorBoundary from "../components/ErrorBoundary";

import { usePlaylistManager } from "../hooks/usePlaylistManager";
import { usePlayerActions } from "../hooks/usePlayerActions";
import { db } from "../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
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
  const navigate = useNavigate();
  const { playlists, createNewPlaylist, addSong, removeSong } = usePlaylistManager();

  // Load songs from Firebase for sidebar (combines with local musicData.json)
  const [firebaseSongs, setFirebaseSongs] = useState([]);
  const allSongs = useMemo(() => [...musicData, ...firebaseSongs], [firebaseSongs]);

  // Use unified player actions hook (replaces local state + event system)
  const { playSong, playArtist, currentSong, isPlaying } = usePlayerActions(musicData);

  // UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelVisible, setRightPanelVisible] = useState(false);
  const [rightPanelContent, setRightPanelContent] = useState(null);
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Load songs from Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "songs"), (snapshot) => {
      const songs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.data().id || doc.id,  // Preserve original id if exists
        artist: doc.data().artistName || doc.data().artist
      }));
      setFirebaseSongs(songs);
    });

    return () => unsubscribe();
  }, []);

  // Right Panel Handlers
  const openRightPanel = useCallback((content) => {
    let info = null;
    if (content?.type === "artist") {
      info = buildArtistInfo(content.artistName, allSongs);
    } else if (content?.type === "playlist") {
      info = content;
    }
    setRightPanelContent(info ? { ...content, info } : content);
    setRightPanelVisible(true);
  }, [allSongs]);

  const closeRightPanel = useCallback(() => {
    setRightPanelVisible(false);
    setRightPanelContent(null);
  }, []);

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
    navigate(`/playlist/${playlist.id}`);
  };

  const handleArtistSelect = (artistName) => {
    navigate(`/artist/${encodeURIComponent(artistName)}`);
  };

  // Memoize outlet context to prevent unnecessary re-renders
  const outletContext = useMemo(() => ({
    currentSong,
    isPlaying,
    playlists,
    musicData,
    playSong,
    onAddSongToPlaylist: addSong,
    onRemoveSongFromPlaylist: removeSong,
    onCreatePlaylist: createNewPlaylist,
    onOpenRightPanel: openRightPanel,
    searchQuery,
  }), [currentSong, isPlaying, playlists, playSong, addSong, removeSong, createNewPlaylist, openRightPanel, searchQuery]);

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
          musicData={allSongs}
          playlists={playlists}
          onPlaylistSelect={handlePlaylistSelect}
          onArtistSelect={handleArtistSelect}
          onShowRightPanel={(artistName) =>
            openRightPanel({ type: "artist", artistName })
          }
          onCreatePlaylist={createNewPlaylist}
          onPlayArtist={playArtist}
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
            <Outlet context={outletContext} />
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Right Panel */}
      <aside className={`${styles.rightPanel} ${!rightPanelVisible ? styles.hidden : ""}`}>
        {rightPanelVisible && (
          <RightPanel
            visible={rightPanelVisible}
            content={rightPanelContent}
            onClose={closeRightPanel}
          />
        )}
      </aside>

      {/* Music Player */}
      <footer className={styles.player}>
        <MusicPlayer />
      </footer>

      {/* Toast Notifications */}
      <ToastContainer position="bottom-center" theme="dark" />
    </div>
  );
}
