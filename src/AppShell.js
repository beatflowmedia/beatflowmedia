import React, { useState, useEffect, Suspense } from "react";
import NavBar from "./components/NavBar";
import SideBar from "./components/SideBar";
import MusicPlayer from "./components/MusicPlayer";
import RightPanel from "./components/RightPanel";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { usePlaylistManager } from "./hooks/usePlaylistManager";
import musicData from "./musicData.json";
import { buildArtistInfo } from "./utils/buildArtistInfo";
import SearchResults from "./components/SearchResultsMain";
import Favorites from "./components/Favorites";
import Playlists from "./components/Playlists";
import PlaylistView from "./components/PlaylistView";
import WhatsNew from "./components/WhatsNew";
import ExplorePremium from "./components/ExplorePremium";
import BrowsePage from "./pages/BrowsePage";
import Home from "./pages/Home";

export default function AppShell() {
  const [page, setPage] = useState("home");
  const [showWhatsNew, setShow] = useState(false);
  const [currentSong, setSong] = useState(musicData[0] || null);
  const [isPlaying, setPlaying] = useState(false);
  const [searchQuery, setSearch] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [favorites, setFavs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("favorites")) || [];
    } catch {
      return [];
    }
  });

  const [rightVisible, setRight] = useState(false);
  const [rightPanelContent, setRightPanelContent] = useState(null);
  const { playlists, createNewPlaylist, addSong, removeSong } = usePlaylistManager();

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const handler = (e) => {
      setSong(e.detail);
      setPlaying(true);
      setSearch("");
      setRight(false);
    };
    window.addEventListener("PLAY_SONG", handler);
    return () => window.removeEventListener("PLAY_SONG", handler);
  }, []);

  const playSong = (song) =>
    window.dispatchEvent(new CustomEvent("PLAY_SONG", { detail: song }));

  const openRightPanel = (content) => {
    let info = null;
    if (content?.type === "artist") {
      info = buildArtistInfo(content.artistName, musicData);
    } else if (content?.type === "playlist") {
      info = content;
    }
    setRightPanelContent(info ? { ...content, info } : content);
    setRight(true);
  };

  const closeRightPanel = () => {
    setRight(false);
    setRightPanelContent(null);
  };

  const renderContent = () => {
    if (searchQuery) {
      return (
        <SearchResults
          query={searchQuery}
          musicData={musicData}
          onPlaySong={playSong}
          onOpenRightPanel={openRightPanel}
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
            onOpenRightPanel={openRightPanel}
          />
        );
      case "playlistView":
        return (
          <PlaylistView
            playlist={selectedPlaylist}
            onSongSelect={playSong}
            onRemoveSong={removeSong}
            onOpenRightPanel={openRightPanel}
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
            selectedArtist={selectedArtist}
            selectedPlaylist={selectedPlaylist}
            onSongSelect={playSong}
            onPlayPause={(song) =>
              setSong(song) ||
              setPlaying((prev) => (song.id !== currentSong?.id ? true : !prev))
            }
            onToggleFavorite={(s) =>
              setFavs((f) =>
                f.some((x) => x.id === s.id)
                  ? f.filter((x) => x.id !== s.id)
                  : [...f, s]
              )
            }
            favorites={favorites}
            currentSong={currentSong}
            isPlaying={isPlaying}
            playlists={playlists}
            onAddSongToPlaylist={addSong}
            onRemoveSongFromPlaylist={removeSong}
            onCreatePlaylist={createNewPlaylist}
            onOpenRightPanel={openRightPanel}
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="flex-shrink-0 z-20">
        <NavBar
          onHomeClick={() => {
            setSelectedArtist(null);
            setSelectedPlaylist(null);
            setPage("home");
          }}
          onSearchChange={setSearch}
          onExplorePremium={() => setPage("explorePremium")}
          onDownloadClick={() => toast.info("Download clicked")}
          onWhatsNewClick={() => setShow((v) => !v)}
          isBellActive={showWhatsNew}
        />
      </header>
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <SideBar
          musicData={musicData}
          playlists={playlists}
          onPlaylistSelect={(pl) => {
            setSelectedPlaylist(pl);
            setSelectedArtist(null);
            setPage("home");
          }}
          onArtistSelect={(name) => {
            setSelectedArtist(name);
            setSelectedPlaylist(null);
            setPage("home");
          }}
          onShowRightPanel={(artistName) =>
            openRightPanel({ type: "artist", artistName })
          }
          onCreatePlaylist={createNewPlaylist}
          onPlayArtist={(name) => {
            const songs = musicData.filter((song) => song.artist === name);
            if (songs[0]) playSong(songs[0]);
          }}
        />
        <main
          className={`flex-1 p-6 overflow-y-auto transition-all duration-300 min-w-0 ${
            rightVisible ? "mr-96" : ""
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
          content={rightPanelContent}
          onClose={closeRightPanel}
        />
      </div>
      <footer className="flex-shrink-0 z-10">
        <MusicPlayer
          song={currentSong}
          songs={musicData}
          onSongChange={setSong}
          isPlaying={isPlaying}
          setIsPlaying={setPlaying}
          onPlayPause={(song) =>
            setSong(song) ||
            setPlaying((prev) => (song.id !== currentSong?.id ? true : !prev))
          }
        />
        <ToastContainer position="bottom-center" />
      </footer>
    </div>
  );
}
