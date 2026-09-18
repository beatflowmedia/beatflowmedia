// src/layouts/AppShell.js
import { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import NavBar from "../components/NavBar";
import CategoryNav from "../components/CategoryNav";
import MusicPlayer from "../components/MusicPlayer";
import RightPanel from "../components/RightPanel";
import ErrorBoundary from "../components/ErrorBoundary";

import { usePlayerActions } from "../hooks/usePlayerActions";
import { db } from "../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import { buildArtistInfo } from "../utils/buildArtistInfo";

import styles from "./LayoutGrid.module.css";

/**
 * AppShell - Music licensing marketplace layout
 *
 * Layout Structure:
 * ┌─────────────────────────────────────┐
 * │           NavBar                     │
 * ├─────────────────────────────────────┤
 * │        CategoryNav                   │
 * ├───────────────┬───────────────────── ┤
 * │     Main      │  RightPanel          │
 * │   <Outlet/>   │  (optional)          │
 * ├───────────────┴───────────────────── ┤
 * │         MusicPlayer (preview)        │
 * └─────────────────────────────────────┘
 */
export default function AppShell() {
  // Load songs from Firebase (single source of truth)
  const [firebaseSongs, setFirebaseSongs] = useState([]);
  const allSongs = useMemo(() => firebaseSongs, [firebaseSongs]);

  // Use unified player actions hook (replaces local state + event system)
  const { playSong, currentSong, isPlaying } = usePlayerActions(firebaseSongs);

  // UI State
  const [rightPanelVisible, setRightPanelVisible] = useState(false);
  const [rightPanelContent, setRightPanelContent] = useState(null);
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Load songs from Firebase (for search/browse - don't sync queue constantly)
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
    // Toggle queue if it's already open
    if (content?.type === 'queue' && rightPanelVisible && rightPanelContent?.type === 'queue') {
      setRightPanelVisible(false);
      setRightPanelContent(null);
      return;
    }

    let info = null;
    if (content?.type === "artist") {
      info = buildArtistInfo(content.artistName, allSongs);
    } else if (content?.type === "playlist") {
      info = content;
    }
    setRightPanelContent(info ? { ...content, info } : content);
    setRightPanelVisible(true);
  }, [allSongs, rightPanelVisible, rightPanelContent]);

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


  // Memoize outlet context to prevent unnecessary re-renders
  const outletContext = useMemo(() => ({
    currentSong,
    isPlaying,
    musicData: allSongs, // All available tracks in marketplace
    playSong,
    onOpenRightPanel: openRightPanel,
    searchQuery,
  }), [currentSong, isPlaying, allSongs, playSong, openRightPanel, searchQuery]);

  // Compute container classes
  const containerClasses = [
    styles.appContainer,
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

      {/* Category Navigation */}
      <div className={styles.categoryNav}>
        <CategoryNav />
      </div>

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
        <MusicPlayer onShowRightPanel={openRightPanel} />
      </footer>

      {/* Toast Notifications */}
      <ToastContainer position="bottom-center" theme="dark" />
    </div>
  );
}
