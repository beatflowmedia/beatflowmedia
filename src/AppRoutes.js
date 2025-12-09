// src/AppRoutes.js
import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import AppShell from "./layouts/AppShell";
import { useAuth } from "./context/AuthContext";
import ArtistPortal from "./pages/ArtistPortal";
import CuratorPortal from "./pages/CuratorPortal";

// Lazy-loaded pages
const Home = lazy(() => import("./pages/Home"));
const Search = lazy(() => import("./pages/Search"));
const Playlist = lazy(() => import("./pages/Playlist"));
const Album = lazy(() => import("./pages/Album"));
const Artist = lazy(() => import("./pages/Artist"));
const CuratorInbox = lazy(() => import("./pages/CuratorInbox"));
const CampaignWizard = lazy(() => import("./pages/CampaignWizard"));
const InvestorPortal = lazy(() => import("./pages/InvestorPortal"));
const Favorites = lazy(() => import("./components/Favorites"));
const Playlists = lazy(() => import("./components/Playlists"));
const PlaylistView = lazy(() => import("./components/PlaylistView"));
const WhatsNew = lazy(() => import("./components/WhatsNew"));
const ExplorePremium = lazy(() => import("./components/ExplorePremium"));
const BrowsePage = lazy(() => import("./pages/BrowsePage"));
const SongPage = lazy(() => import("./pages/SongPage"));
const Jobs = lazy(() => import("./pages/Jobs"));
const ForArtists = lazy(() => import("./pages/ForArtists"));
const AgentsDashboard = lazy(() => import("./pages/AgentsDashboard"));

export default function AppRoutes() {
  const { user, role } = useAuth();
  return (
    <Suspense fallback={<div className="py-20 text-center text-white">Loading…</div>}>
      <Routes>
        {/* Wrap shared layout */}
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="search" element={<Search />} />
          <Route path="playlist/:id" element={<Playlist />} />
          <Route path="album/:id" element={<Album />} />
          <Route path="artist/:id" element={<Artist />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="playlists" element={<Playlists />} />
          <Route path="playlist-view" element={<PlaylistView />} />
          <Route path="whats-new" element={<WhatsNew />} />
          <Route path="explore-premium" element={<ExplorePremium />} />
          <Route path="browse" element={<BrowsePage />} />
        </Route>

        {/* Role-based portals (protected routes) */}
        {user && role === "artist" && (
          <>
            <Route path="artist-portal" element={<ArtistPortal userId={user.uid} stripeAccountId={user.stripeAccountId} />} />
            <Route path="campaign-wizard" element={<CampaignWizard />} />
          </>
        )}
        {user && role === "curator" && (
          <>
            <Route path="curator-portal" element={<CuratorPortal userId={user.uid} stripeAccountId={user.stripeAccountId} />} />
            <Route path="curator-inbox" element={<CuratorInbox />} />
          </>
        )}
        {user && role === "investor" && (
          <Route path="investor-portal" element={<InvestorPortal />} />
        )}

        {/* Standalone routes outside of AppShell */}
        <Route path="agents-dashboard" element={<AgentsDashboard />} />
        <Route path="song/:id" element={<SongPage />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="for-artists" element={<ForArtists />} />

        {/* Catch-all for 404 */}
        <Route path="*" element={<div className="p-6 text-center text-white">404 – Page Not Found</div>} />
      </Routes>
    </Suspense>
  );
}
