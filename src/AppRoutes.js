// src/AppRoutes.js
import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import AppShell from "./AppShell";

// Lazy-loaded create playlist page
const CreatePlaylist = lazy(() => import("./pages/CreatePlaylist"));

// Lazy-loaded pages
const Home = lazy(() => import("./pages/Home"));
const Favorites = lazy(() => import("./components/Favorites"));
const Playlists = lazy(() => import("./components/Playlists"));
const PlaylistView = lazy(() => import("./components/PlaylistView"));
const WhatsNew = lazy(() => import("./components/WhatsNew"));
const ExplorePremium = lazy(() => import("./components/ExplorePremium"));
const BrowsePage = lazy(() => import("./pages/BrowsePage"));
const SongPage = lazy(() => import("./pages/SongPage"));
const Jobs = lazy(() => import("./pages/Jobs"));
const ForArtists = lazy(() => import("./pages/ForArtists"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-white">Loading…</div>}>
      <Routes>
        {/* Wrap shared layout */}
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="playlists" element={<Playlists />} />
          <Route path="playlist-view" element={<PlaylistView />} />
          <Route path="create-playlist" element={<CreatePlaylist />} />
          <Route path="whats-new" element={<WhatsNew />} />
          <Route path="explore-premium" element={<ExplorePremium />} />
          <Route path="browse" element={<BrowsePage />} />
        </Route>

        {/* Standalone routes outside of AppShell */}
        <Route path="song/:id" element={<SongPage />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="for-artists" element={<ForArtists />} />

        {/* Catch-all for 404 */}
        <Route path="*" element={<div className="p-6 text-center text-white">404 – Page Not Found</div>} />
      </Routes>
    </Suspense>
  );
}
