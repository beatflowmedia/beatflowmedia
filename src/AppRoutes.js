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
const Artist = lazy(() => import("./pages/ArtistSimple"));
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
const Advertisements = lazy(() => import("./pages/Advertisements"));
const About = lazy(() => import("./pages/About"));
const ForTheRecord = lazy(() => import("./pages/ForTheRecord"));
const Support = lazy(() => import("./pages/Support"));
const SupportCategory = lazy(() => import("./pages/SupportCategory"));
const Contact = lazy(() => import("./pages/Contact"));
const Investors = lazy(() => import("./pages/Investors"));
const Wrapped2024 = lazy(() => import("./pages/Wrapped2024"));

// Community pages
const Developers = lazy(() => import("./pages/Developers"));
const Vendors = lazy(() => import("./pages/Vendors"));
const Advertising = lazy(() => import("./pages/Advertising"));

// Advertising pages
const GetStarted = lazy(() => import("./pages/GetStarted"));
const AdFormats = lazy(() => import("./pages/AdFormats"));
const Goals = lazy(() => import("./pages/Goals"));
const NewsInspiration = lazy(() => import("./pages/NewsInspiration"));
const CreativeLab = lazy(() => import("./pages/CreativeLab"));
const AdSignup = lazy(() => import("./pages/AdSignup"));

// Advertising resource pages
const HelpCenter = lazy(() => import("./pages/resources/HelpCenter"));
const AdSpecs = lazy(() => import("./pages/resources/AdSpecs"));
const WrappedAdvertisers2024 = lazy(() => import("./pages/resources/Wrapped2024"));
const CreativeBestPractices = lazy(() => import("./pages/resources/CreativeBestPractices"));
const Partners = lazy(() => import("./pages/resources/Partners"));
const AnalyticsHelpCenter = lazy(() => import("./pages/resources/AnalyticsHelpCenter"));

// Premium plan pages
const Individual = lazy(() => import("./pages/Individual"));
const Student = lazy(() => import("./pages/Student"));
const Duo = lazy(() => import("./pages/Duo"));
const Family = lazy(() => import("./pages/Family"));
const Audiobooks = lazy(() => import("./pages/Audiobooks"));

// Legal pages
const Legal = lazy(() => import("./pages/Legal"));
const Nda = lazy(() => import("./pages/Nda"));
const PrivacyCenter = lazy(() => import("./pages/PrivacyCenter"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Cookies = lazy(() => import("./pages/Cookies"));
const AboutAds = lazy(() => import("./pages/AboutAds"));
const Accessibility = lazy(() => import("./pages/Accessibility"));
const NoticeAtCollection = lazy(() => import("./pages/NoticeAtCollection"));
const PrivacyChoices = lazy(() => import("./pages/PrivacyChoices"));

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

        {/* Admin routes inside AppShell */}
        <Route element={<AppShell />}>
          <Route path="ads" element={<Advertisements />} />
          <Route path="advertisements" element={<Advertisements />} />
        </Route>

        {/* Standalone routes outside of AppShell */}
        <Route path="agents-dashboard" element={<AgentsDashboard />} />
        <Route path="song/:id" element={<SongPage />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="for-artists" element={<ForArtists />} />
        <Route path="about" element={<About />} />
        <Route path="for-the-record" element={<ForTheRecord />} />
        <Route path="support" element={<Support />} />
        <Route path="support/:region/category/:category" element={<SupportCategory />} />
        <Route path="contact" element={<Contact />} />
        <Route path="investors" element={<Investors />} />
        <Route path="wrapped2024" element={<Wrapped2024 />} />

        {/* Community pages */}
        <Route path="developers" element={<Developers />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="advertising" element={<Advertising />} />

        {/* Advertising pages */}
        <Route path="get-started" element={<GetStarted />} />
        <Route path="ad-formats" element={<AdFormats />} />
        <Route path="goals" element={<Goals />} />
        <Route path="news-inspiration" element={<NewsInspiration />} />
        <Route path="creative-lab" element={<CreativeLab />} />
        <Route path="ad-signup" element={<AdSignup />} />

        {/* Advertising resource pages */}
        <Route path="resources/help-center" element={<HelpCenter />} />
        <Route path="resources/ad-specs" element={<AdSpecs />} />
        <Route path="resources/wrapped-2024" element={<WrappedAdvertisers2024 />} />
        <Route path="resources/creative-best-practices" element={<CreativeBestPractices />} />
        <Route path="resources/partners" element={<Partners />} />
        <Route path="resources/analytics-help-center" element={<AnalyticsHelpCenter />} />

        {/* Premium plan pages */}
        <Route path="individual" element={<Individual />} />
        <Route path="student" element={<Student />} />
        <Route path="duo" element={<Duo />} />
        <Route path="family" element={<Family />} />
        <Route path="audiobooks" element={<Audiobooks />} />

        {/* Legal pages */}
        <Route path="legal" element={<Legal />} />
        <Route path="nda" element={<Nda />} />
        <Route path="privacy-center" element={<PrivacyCenter />} />
        <Route path="privacy-policy" element={<PrivacyPolicy />} />
        <Route path="cookies" element={<Cookies />} />
        <Route path="about-ads" element={<AboutAds />} />
        <Route path="accessibility" element={<Accessibility />} />
        <Route path="notice-at-collection" element={<NoticeAtCollection />} />
        <Route path="privacy-choices" element={<PrivacyChoices />} />

        {/* Catch-all for 404 */}
        <Route path="*" element={<div className="p-6 text-center text-white">404 – Page Not Found</div>} />
      </Routes>
    </Suspense>
  );
}
