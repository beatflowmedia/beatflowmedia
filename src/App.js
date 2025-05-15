// src/App.js
import React, { useState, useEffect, lazy, Suspense, memo } from "react";
import { BrowserRouter, Switch, Route, useLocation } from "react-router-dom"; // v5
import NavBar from "./components/NavBar";
import SideBar from "./components/SideBar";
import MusicPlayer from "./components/MusicPlayer";
import RightPanel from "./components/RightPanel";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { usePlaylistManager } from "./hooks/usePlaylistManager";
import { buildArtistInfo } from "./utils/buildArtistInfo";
import musicData from "./musicData.json";

const Home = lazy(() => import("./pages/Home"));
const Favorites = lazy(() => import("./components/Favorites"));
const Playlists = lazy(() => import("./components/Playlists"));
const PlaylistView = lazy(() => import("./components/PlaylistView"));
const WhatsNew = lazy(() => import("./components/WhatsNew"));
const ExplorePremium = lazy(() => import("./components/ExplorePremium"));
const BrowsePage = lazy(() => import("./pages/BrowsePage"));
const SearchResultsMain = lazy(() => import("./components/SearchResultsMain"));
// const SongPage = lazy(() => import("./pages/SongPage")); // enable when ready

function AppShell() {
  const location = useLocation();
  const [page, setPage] = useState("home");
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [rightVisible, setRightVisible] = useState(false);
  const [currentSong, setCurrentSong] = useState(musicData[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [artistInfo, setArtistInfo] = useState(null);

  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("favorites")) || [];
    } catch {
      return [];
    }
  });

  const { playlists, createNewPlaylist, addSong, removeSong } = usePlaylistManager();

  // Persist favorites to localStorage
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // On URL change, check for ?song=ID and auto-play it
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const songId = params.get("song");
    if (songId) {
      const match = musicData.find((s) => String(s.id) === songId);
      if (match) {
        setCurrentSong(match);
        setIsPlaying(true);
        setPage("home");
        setSearchQuery("");
        setRightVisible(true);
        // remove query so refresh won't replay
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [location.search]);

  const playSong = (song) => {
    if (!song) return;
    setCurrentSong(song);
    setIsPlaying(true);
    setSearchQuery("");
    setRightVisible(true);
  };

  const selectArtist = (name) => {
    if (!name) return;
    const info = buildArtistInfo(name, musicData);
    setSelectedArtist(name);
    setArtistInfo(info);
    setSelectedPlaylist(null);
    setSearchQuery("");
    if (info?.songs?.length) playSong(info.songs[0]);
  };

  const renderContent = () => {
    if (searchQuery) {
      return (
        <SearchResultsMain
          query={searchQuery}
          musicData={musicData}
          onPlaySong={playSong}
          onArtistSelect={selectArtist}
        />
      );
    }
    if (showWhatsNew) return <WhatsNew />;

    switch (page) {
      case "favorites":
        return <Favorites favorites={favorites} onSongSelect={playSong} />;
      case "playlists":
        return (
          <Playlists
            playlists={playlists}
            onCreateNewPlaylist={createNewPlaylist}
            onAddSongToPlaylist={addSong}
            selectedSong={currentSong}
            onSelectPlaylist={setSelectedPlaylist}
          />
        );
      case "playlistView":
        return (
          <PlaylistView
            playlist={selectedPlaylist}
            onSongSelect={playSong}
            onRemoveSong={removeSong}
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
            onSongSelect={playSong}
            onToggleFavorite={(s) =>
              setFavorites((f) =>
                f.some((x) => x.id === s.id)
                  ? f.filter((x) => x.id !== s.id)
                  : [...f, s]
              )
            }
            favorites={favorites}
            selectedArtist={selectedArtist}
            onClearArtist={() => setSelectedArtist(null)}
            currentSong={currentSong}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            playlists={playlists}
            onAddSongToPlaylist={addSong}
            onRemoveSongFromPlaylist={removeSong}
          />
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <header className="flex-shrink-0">
        <NavBar
          onHomeClick={() => setPage("home")}
          onSearchChange={setSearchQuery}
          onExplorePremium={() => setPage("explorePremium")}
          onDownloadClick={() => toast.info("Download clicked")}
          onWhatsNewClick={() => setShowWhatsNew((v) => !v)}
          isBellActive={showWhatsNew}
        />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <SideBar
          musicData={musicData}
          playlists={playlists}
          onNavigate={setPage}
          onArtistSelect={selectArtist}
          onPlaylistSelect={(pl) => {
            setSelectedPlaylist(pl);
            setPage("playlistView");
          }}
          onCreatePlaylist={createNewPlaylist}
        />

        <main
          className={`flex-1 p-6 overflow-y-auto transition-all duration-300 ${
            rightVisible ? "w-2/3" : "w-full"
          }`}
        >
          <ErrorBoundary>
            <Suspense fallback={<div className="py-20 text-center">Loading…</div>}>
              {renderContent()}
            </Suspense>
          </ErrorBoundary>
        </main>

        <RightPanel
          visible={rightVisible}
          artistInfo={artistInfo}
          onClose={() => setRightVisible(false)}
        />
      </div>

      <footer className="flex-shrink-0">
        <MusicPlayer
          song={currentSong}
          songs={musicData}
          onSongChange={setCurrentSong}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
        />
        <ToastContainer position="bottom-center" />
      </footer>
    </div>
  );
}

export default function RouterWrapper() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Switch>
          {/*
          <Route
            path="/song/:id"
            render={(props) => (
              <Suspense fallback={<div>Loading…</div>}>
                <SongPage {...props} />
              </Suspense>
            )}
          />
          */}
          <Route path="/" component={memo(AppShell)} />
        </Switch>
      </BrowserRouter>
    </AuthProvider>
  );
}
