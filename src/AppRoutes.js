// src/AppRoutes.js
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import AppShell from "./layouts/AppShell";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy-loaded pages
const Home = lazy(() => import("./pages/Home"));
const Search = lazy(() => import("./pages/Search"));
const Playlist = lazy(() => import("./pages/Playlist"));
const Album = lazy(() => import("./pages/Album"));
const Artist = lazy(() => import("./pages/ArtistSimple"));
const ArtistPortal = lazy(() => import("./pages/ArtistPortal"));
const CuratorPortal = lazy(() => import("./pages/CuratorPortal"));
const CuratorInbox = lazy(() => import("./pages/CuratorInbox"));
const CampaignWizard = lazy(() => import("./pages/CampaignWizard"));
const InvestorPortal = lazy(() => import("./pages/InvestorPortal"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Playlists = lazy(() => import("./pages/Playlists"));
const PlaylistView = lazy(() => import("./components/PlaylistView"));
const WhatsNew = lazy(() => import("./components/WhatsNew"));
const ExplorePremium = lazy(() => import("./components/ExplorePremium"));
const BrowsePage = lazy(() => import("./pages/BrowsePage"));
const SongPage = lazy(() => import("./pages/SongPage"));
const Jobs = lazy(() => import("./pages/Jobs"));
const ForArtists = lazy(() => import("./pages/ForArtists"));
const ArtistSubmissionPricing = lazy(() => import("./pages/ArtistSubmissionPricing"));
const CuratorPricing = lazy(() => import("./pages/CuratorPricing"));
const CuratorEarnings = lazy(() => import("./pages/CuratorEarnings"));
const CuratorApplication = lazy(() => import("./pages/CuratorApplication"));
const AgentsDashboard = lazy(() => import("./pages/AgentsDashboard"));
const Advertisements = lazy(() => import("./pages/Advertisements"));
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
const ArtistDashboardNew = lazy(() => import("./pages/ArtistDashboardNew"));
const ArtistProfileManager = lazy(() => import("./pages/ArtistProfileManager"));
// const PodcasterDashboard = lazy(() => import("./pages/PodcasterDashboard"));
const SupportCategory = lazy(() => import("./pages/SupportCategory"));
const Contact = lazy(() => import("./pages/Contact"));
const Investors = lazy(() => import("./pages/Investors"));
const InvestorDeck = lazy(() => import("./pages/InvestorDeck"));
const Wrapped2024 = lazy(() => import("./pages/Wrapped2024"));
const MarketingLanding = lazy(() => import("./pages/MarketingLanding"));
const DiscoverWeekly = lazy(() => import("./pages/DiscoverWeekly"));
const SmartLink = lazy(() => import("./pages/SmartLink"));

// Community pages
const Developers = lazy(() => import("./pages/Developers"));
const Vendors = lazy(() => import("./pages/Vendors"));
const VendorApplication = lazy(() => import("./pages/VendorApplication"));
const Advertising = lazy(() => import("./pages/Advertising"));
const Community = lazy(() => import("./pages/Community"));

// Advertising pages
const GetStarted = lazy(() => import("./pages/GetStarted"));
const AdFormats = lazy(() => import("./pages/AdFormats"));
const Goals = lazy(() => import("./pages/Goals"));
const NewsInspiration = lazy(() => import("./pages/NewsInspiration"));
const CreativeLab = lazy(() => import("./pages/CreativeLab"));
const CreativeQuote = lazy(() => import("./pages/CreativeQuote"));
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
const Terms = lazy(() => import("./pages/Terms"));
const UserGuidelines = lazy(() => import("./pages/UserGuidelines"));
const Nda = lazy(() => import("./pages/NDA"));
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

// Studio pages
const StudioLayout = lazy(() => import("./pages/studio/StudioLayout"));
const StudioHome = lazy(() => import("./pages/studio/StudioHome"));
const StudioServices = lazy(() => import("./pages/studio/StudioServices"));
const AudioKits = lazy(() => import("./pages/studio/AudioKits"));
const MoodLibrary = lazy(() => import("./pages/studio/MoodLibrary"));
const InvisibleServices = lazy(() => import("./pages/studio/InvisibleServices"));
const StudioSamples = lazy(() => import("./pages/studio/StudioSamples"));
const Consultation = lazy(() => import("./pages/studio/Consultation"));
const StudioAbout = lazy(() => import("./pages/studio/StudioAbout"));

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
  const { user, role } = useAuth();
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Wrap shared layout */}
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="search" element={<Search />} />
          <Route path="playlist/:id" element={<Playlist />} />
          <Route path="album/:id" element={<Album />} />

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
          <Route path="genre/:genre" element={<GenrePage />} />
          <Route path="category/:category" element={<CategoryPage />} />
          <Route path="made-for-you" element={<CategoryPage />} />
          <Route path="new-releases" element={<CategoryPage />} />
          <Route path="discover" element={<CategoryPage />} />
          <Route path="charts/:type" element={<CategoryPage />} />
          <Route path="song/:id" element={<SongPage />} />
          <Route path="discover-weekly" element={<DiscoverWeekly />} />
        </Route>

        {/* Standalone Artist Dashboard - outside AppShell */}
        <Route path="artist/dashboard" element={<ArtistDashboardNew />} />

        {/* Standalone Curator Portal - outside AppShell */}
        <Route path="curator-portal" element={<CuratorPortal />} />
        <Route path="curator-inbox" element={<CuratorInbox />} />

        {/* Role-based portals (protected routes) */}
        {user && role === "artist" && (
          <>
            <Route path="artist-portal" element={<ArtistPortal userId={user.uid} stripeAccountId={user.stripeAccountId} />} />
            <Route path="campaign-wizard" element={<CampaignWizard />} />
          </>
        )}
        {/* {user && role === "podcaster" && (
          <>
            <Route path="podcaster/dashboard" element={<PodcasterDashboard />} />
          </>
        )} */}
        {user && role === "investor" && (
          <Route path="investor-portal" element={<InvestorPortal />} />
        )}

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

        {/* Public admin routes inside AppShell */}
        <Route element={<AppShell />}>
          <Route path="ads" element={<Advertisements />} />
          <Route path="advertisements" element={<Advertisements />} />
        </Route>

        {/* Standalone routes outside of AppShell */}
        <Route path="agents-dashboard" element={<AgentsDashboard />} />
        <Route path="marketing/landing/:slug" element={<MarketingLanding />} />
        <Route path="link/:slug" element={<SmartLink />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="artist-pricing" element={<ArtistSubmissionPricing />} />
        <Route path="become-curator" element={<CuratorPricing />} />
        <Route path="curator-earnings" element={<CuratorEarnings />} />
        <Route path="curator-application" element={<CuratorApplication />} />
        <Route path="purchase/success" element={<PurchaseSuccess />} />
        <Route path="purchase/cancelled" element={<PurchaseCancelled />} />
        <Route path="downloads" element={<Downloads />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="for-artists" element={<ForArtists />} />
        <Route path="artist-profile" element={<ArtistProfileManager />} />
        <Route path="appeal-takedown" element={<AppealTakedown />} />
        <Route path="about" element={<About />} />
        <Route path="for-the-record" element={<ForTheRecord />} />
        <Route path="support" element={<Support />} />
        <Route path="support/:region/category/:category" element={<SupportCategory />} />
        <Route path="contact" element={<Contact />} />
        <Route path="investors" element={<Investors />} />
        <Route path="investor-deck" element={<InvestorDeck />} />
        <Route path="wrapped2024" element={<Wrapped2024 />} />

        {/* Community pages */}
        <Route path="community" element={<Community />} />
        <Route path="developers" element={<Developers />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="vendor-application" element={<VendorApplication />} />
        <Route path="advertising" element={<Advertising />} />

        {/* Advertising pages */}
        <Route path="get-started" element={<GetStarted />} />
        <Route path="ad-formats" element={<AdFormats />} />
        <Route path="goals" element={<Goals />} />
        <Route path="news-inspiration" element={<NewsInspiration />} />
        <Route path="creative-lab" element={<CreativeLab />} />
        <Route path="creative-quote" element={<CreativeQuote />} />
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
        <Route path="terms" element={<Terms />} />
        <Route path="user-guidelines" element={<UserGuidelines />} />
        <Route path="nda" element={<Nda />} />
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

        {/* Studio portal routes */}
        <Route path="studio" element={<StudioLayout />}>
          <Route index element={<StudioHome />} />
          <Route path="services" element={<StudioServices />} />
          <Route path="audio-kits" element={<AudioKits />} />
          <Route path="mood-library" element={<MoodLibrary />} />
          <Route path="invisible-services" element={<InvisibleServices />} />
          <Route path="samples" element={<StudioSamples />} />
          <Route path="consultation" element={<Consultation />} />
          <Route path="about" element={<StudioAbout />} />
        </Route>

        {/* Catch-all for 404 */}
        <Route path="*" element={<div className="p-6 text-center text-white">404 – Page Not Found</div>} />
      </Routes>
    </Suspense>
  );
}
