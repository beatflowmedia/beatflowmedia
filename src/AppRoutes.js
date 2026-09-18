// src/AppRoutes.js
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import AppShell from "./layouts/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy-loaded pages
const Home = lazy(() => import("./pages/Home"));
const Search = lazy(() => import("./pages/Search"));
const Playlist = lazy(() => import("./pages/Playlist"));
const Album = lazy(() => import("./pages/Album"));
const AlbumProjects = lazy(() => import("./pages/AlbumProjects"));
const Artist = lazy(() => import("./pages/ArtistSimple"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Playlists = lazy(() => import("./pages/Playlists"));
const PlaylistView = lazy(() => import("./components/PlaylistView"));
const WhatsNew = lazy(() => import("./components/WhatsNew"));
const ExplorePremium = lazy(() => import("./components/ExplorePremium"));
const BrowsePage = lazy(() => import("./pages/BrowsePage"));
const BrowseByCategory = lazy(() => import("./pages/BrowseByCategory"));
const SongPage = lazy(() => import("./pages/SongPage"));
const DebugSongPrice = lazy(() => import("./pages/DebugSongPrice"));
const Jobs = lazy(() => import("./pages/Jobs"));
const AdminApplications = lazy(() => import("./pages/AdminApplications"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const PurchaseSuccess = lazy(() => import("./pages/PurchaseSuccess"));
const PurchaseCancelled = lazy(() => import("./pages/PurchaseCancelled"));
const Downloads = lazy(() => import("./pages/Downloads"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const GenrePage = lazy(() => import("./pages/GenrePage"));
const AppealTakedown = lazy(() => import("./pages/AppealTakedown"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const GenreManagement = lazy(() => import("./pages/GenreManagement"));
const About = lazy(() => import("./pages/About"));
const ForTheRecord = lazy(() => import("./pages/ForTheRecord"));
const Support = lazy(() => import("./pages/Support"));
const SupportCategory = lazy(() => import("./pages/SupportCategory"));
const Contact = lazy(() => import("./pages/Contact"));
const MarketingLanding = lazy(() => import("./pages/MarketingLanding"));
const DiscoverWeekly = lazy(() => import("./pages/DiscoverWeekly"));

// Community pages
const Developers = lazy(() => import("./pages/Developers"));
const Community = lazy(() => import("./pages/Community"));

// Premium plan pages
const Audiobooks = lazy(() => import("./pages/Audiobooks"));

// Legal pages
const Legal = lazy(() => import("./pages/Legal"));
const Terms = lazy(() => import("./pages/Terms"));
const UserGuidelines = lazy(() => import("./pages/UserGuidelines"));
const PrivacyCenter = lazy(() => import("./pages/PrivacyCenter"));
const PrivacySettings = lazy(() => import("./pages/PrivacySettings"));
const DownloadData = lazy(() => import("./pages/DownloadData"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Cookies = lazy(() => import("./pages/Cookies"));
const CookieSettings = lazy(() => import("./pages/CookieSettings"));
const AboutAds = lazy(() => import("./pages/AboutAds"));
const AdPreferences = lazy(() => import("./pages/AdPreferences"));
const Accessibility = lazy(() => import("./pages/Accessibility"));
const NoticeAtCollection = lazy(() => import("./pages/NoticeAtCollection"));
const PrivacyChoices = lazy(() => import("./pages/PrivacyChoices"));
const SyncLicensing = lazy(() => import("./pages/SyncLicensing"));

// Blog pages
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));


// Loading component with skeleton UI
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center">
      <div className="text-center">
        <div className="loading-skeleton w-16 h-16 rounded-full mx-auto mb-4" />
        <div className="text-white text-lg font-medium">Loading BeatFlow...</div>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Wrap shared layout */}
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="search" element={<Search />} />
          <Route path="playlist/:id" element={<Playlist />} />
          <Route path="album/:id" element={<Album />} />
          <Route path="projects" element={<AlbumProjects />} />

          {/* Specific artist routes - must come BEFORE artist/:id */}
          <Route
            path="artist/genre-management"
            element={
              <ProtectedRoute requiredRole="artist" adminOnly={false}>
                <GenreManagement />
              </ProtectedRoute>
            }
          />

          {/* Dynamic artist route - must come AFTER specific routes */}
          <Route path="artist/:id" element={<Artist />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="playlists" element={<Playlists />} />
          <Route path="playlist-view" element={<PlaylistView />} />
          <Route path="whats-new" element={<WhatsNew />} />
          <Route path="explore-premium" element={<ExplorePremium />} />
          <Route path="browse" element={<BrowsePage />} />
          <Route path="browse/:category" element={<BrowseByCategory />} />
          <Route path="genre/:genre" element={<GenrePage />} />
          <Route path="category/:category" element={<CategoryPage />} />
          <Route path="made-for-you" element={<CategoryPage />} />
          <Route path="new-releases" element={<CategoryPage />} />
          <Route path="discover" element={<CategoryPage />} />
          <Route path="charts/:type" element={<CategoryPage />} />
          <Route path="song/:id" element={<SongPage />} />
          <Route path="debug-song-price" element={<DebugSongPrice />} />
          <Route path="discover-weekly" element={<DiscoverWeekly />} />
        </Route>

        {/* Admin routes - protected */}
        <Route
          path="admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/applications"
          element={
            <ProtectedRoute>
              <AdminApplications />
            </ProtectedRoute>
          }
        />

        {/* Standalone routes outside of AppShell */}
        <Route path="marketing/landing/:slug" element={<MarketingLanding />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="purchase/success" element={<PurchaseSuccess />} />
        <Route path="purchase/cancelled" element={<PurchaseCancelled />} />
        <Route path="downloads" element={<Downloads />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="appeal-takedown" element={<AppealTakedown />} />
        <Route path="about" element={<About />} />
        <Route path="for-the-record" element={<ForTheRecord />} />
        <Route path="support" element={<Support />} />
        <Route path="support/:region/category/:category" element={<SupportCategory />} />
        <Route path="contact" element={<Contact />} />

        {/* Community pages */}
        <Route path="community" element={<Community />} />
        <Route path="developers" element={<Developers />} />

        {/* Premium plan pages */}
        <Route path="audiobooks" element={<Audiobooks />} />

        {/* Legal pages */}
        <Route path="legal" element={<Legal />} />
        <Route path="terms" element={<Terms />} />
        <Route path="user-guidelines" element={<UserGuidelines />} />
        <Route path="privacy-center" element={<PrivacyCenter />} />
        <Route path="privacy-settings" element={<PrivacySettings />} />
        <Route path="download-data" element={<DownloadData />} />
        <Route path="privacy-policy" element={<PrivacyPolicy />} />
        <Route path="cookies" element={<Cookies />} />
        <Route path="cookie-settings" element={<CookieSettings />} />
        <Route path="about-ads" element={<AboutAds />} />
        <Route path="ad-preferences" element={<AdPreferences />} />
        <Route path="accessibility" element={<Accessibility />} />
        <Route path="notice-at-collection" element={<NoticeAtCollection />} />
        <Route path="privacy-choices" element={<PrivacyChoices />} />
        <Route path="sync-licensing" element={<SyncLicensing />} />

        {/* Blog pages */}
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:slug" element={<BlogPost />} />


        {/* Catch-all for 404 */}
        <Route path="*" element={<div className="p-6 text-center text-white">404 – Page Not Found</div>} />
      </Routes>
    </Suspense>
  );
}
