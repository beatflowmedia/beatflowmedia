// src/App.js
import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
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

const Home           = lazy(() => import("./pages/Home"));
const Favorites      = lazy(() => import("./components/Favorites"));
const Playlists      = lazy(() => import("./components/Playlists"));
const PlaylistView   = lazy(() => import("./components/PlaylistView"));
const WhatsNew       = lazy(() => import("./components/WhatsNew"));
const ExplorePremium = lazy(() => import("./components/ExplorePremium"));
const BrowsePage     = lazy(() => import("./pages/BrowsePage"));
const SearchResults  = lazy(() => import("./components/SearchResultsMain"));
const SongPage       = lazy(() => import("./pages/SongPage"));

function AppShell() {
  const [page, setPage]           = useState("home");
  const [showWhatsNew, setShow]   = useState(false);
  const [rightVisible, setRight]  = useState(false);
  const [currentSong, setSong]    = useState(musicData[0] || null);
  const [isPlaying, setPlaying]   = useState(false);
  const [searchQuery, setSearch]  = useState("");
  const [selectedPlaylist, setPL] = useState(null);
  const [selectedArtist, setArt]  = useState(null);
  const [artistInfo, setInfo]     = useState(null);

  const [favorites, setFavs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("favorites")) || []; }
    catch { return []; }
  });

  const { playlists, createNewPlaylist, addSong, removeSong } = usePlaylistManager();

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // SPA "play song" event
  useEffect(() => {
    const handler = (e) => {
      setSong(e.detail);
      setPlaying(true);
      setSearch("");
      setRight(true);
    };
    window.addEventListener("PLAY_SONG", handler);
    return () => window.removeEventListener("PLAY_SONG", handler);
  }, []);

  const playSong = song => window.dispatchEvent(new CustomEvent("PLAY_SONG", { detail: song }));

  // -- THE MAIN PLAYBACK CONTROL HANDLER: --
  const handlePlayPause = (song) => {
    if (!currentSong || song.id !== currentSong.id) {
      setSong(song);
      setPlaying(true);
    } else {
      setPlaying(prev => !prev);
    }
  };

  const selectArtist = name => {
    if (!name) return;
    const info = buildArtistInfo(name, musicData);
    setArt(name);
    setInfo(info);
    setPL(null);
    setSearch("");
    if (info?.songs?.[0]) playSong(info.songs[0]);
  };

  const renderContent = () => {
    if (searchQuery) {
      return (
        <SearchResults
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
            onSelectPlaylist={setPL}
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
            onPlayPause={handlePlayPause} // <-- Unified play/pause handler
            onToggleFavorite={s =>
              setFavs(f =>
                f.some(x => x.id === s.id) ? f.filter(x => x.id !== s.id) : [...f, s]
              )
            }
            favorites={favorites}
            selectedArtist={selectedArtist}
            onClearArtist={() => setArt(null)}
            currentSong={currentSong}
            isPlaying={isPlaying}
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
          onSearchChange={setSearch}
          onExplorePremium={() => setPage("explorePremium")}
          onDownloadClick={() => toast.info("Download clicked")}
          onWhatsNewClick={() => setShow(v => !v)}
          isBellActive={showWhatsNew}
        />
      </header>
      <div className="flex flex-1 overflow-hidden">
        <SideBar
          musicData={musicData}
          playlists={playlists}
          onNavigate={setPage}
          onArtistSelect={selectArtist}
          onPlaylistSelect={pl => { setPL(pl); setPage("playlistView"); }}
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
          onClose={() => setRight(false)}
        />
      </div>
      <footer className="flex-shrink-0">
        <MusicPlayer
          song={currentSong}
          songs={musicData}
          onSongChange={setSong}
          isPlaying={isPlaying}
          setIsPlaying={setPlaying}
          onPlayPause={handlePlayPause} // <-- Unified play/pause handler
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
          <Route
            exact
            path="/song/:id"
            render={props => (
              <Suspense fallback={<div>Loading…</div>}>
                <SongPage {...props} />
              </Suspense>
            )}
          />
          <Route path="/" component={AppShell} />
        </Switch>
      </BrowserRouter>
    </AuthProvider>
  );
}
