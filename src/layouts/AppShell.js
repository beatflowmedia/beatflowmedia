// src/layouts/AppShell.js
import { useState, useEffect, useRef, Suspense, useMemo, useCallback } from "react";
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop: collapse to icons-only
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile: slide sidebar in/out
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

  // Mobile Sidebar - Close on click outside (mobile only)
  const sidebarRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only handle on mobile (check window width)
      if (window.innerWidth >= 768) return;

      // If sidebar is open and click is outside sidebar and toggle button
      if (
        mobileMenuOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest('[aria-label="Toggle Library"]')
      ) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      // Small delay to prevent immediate close from the same click that opened it
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [mobileMenuOpen]);

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
    // Close mobile sidebar after selection (mobile only)
    if (window.innerWidth < 768) {
      setMobileMenuOpen(false);
    }
  };

  const handleArtistSelect = (artistName) => {
    navigate(`/artist/${encodeURIComponent(artistName)}`);
    // Close mobile sidebar after selection (mobile only)
    if (window.innerWidth < 768) {
      setMobileMenuOpen(false);
    }
  };

  // Memoize outlet context to prevent unnecessary re-renders
  const outletContext = useMemo(() => ({
    currentSong,
    isPlaying,
    playlists,
    musicData: allSongs, // Include both JSON and Firebase songs
    playSong,
    onAddSongToPlaylist: addSong,
    onRemoveSongFromPlaylist: removeSong,
    onCreatePlaylist: createNewPlaylist,
    onOpenRightPanel: openRightPanel,
    searchQuery,
  }), [currentSong, isPlaying, playlists, allSongs, playSong, addSong, removeSong, createNewPlaylist, openRightPanel, searchQuery]);

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
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          isMobileMenuOpen={mobileMenuOpen}
        />
      </header>

      {/* Sidebar */}
      <aside ref={sidebarRef} className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ""} ${mobileMenuOpen ? styles.open : ""}`}>
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
