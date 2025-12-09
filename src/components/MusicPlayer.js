// src/components/MusicPlayer.js
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  FaRandom,
  FaStepBackward,
  FaPlay,
  FaPause,
  FaStepForward,
  FaRedoAlt,
  FaVolumeUp,
  FaVolumeMute,
  FaClone,
} from "react-icons/fa";
import AddToPlaylistButton from "../utils/AddToPlaylistButton";
import { usePlaylistManager } from "../hooks/usePlaylistManager";
import MiniPlayerPortal from "./MiniPlayerPortal";
import { usePlayback } from "../context/PlaybackContext";
import { useAuth } from "../context/AuthContext";
import { usePlaybackResume } from "../utils/usePlaybackResume";
import PlayerAnalyticsClass from '../services/analytics/PlayerAnalytics';
const playerAnalytics = new PlayerAnalyticsClass();

// Repeat mode constants
const REPEAT_OFF = 0;
const REPEAT_ALL = 1;
const REPEAT_ONE = 2;

const MusicPlayer = ({
  song,
  songs,
  onSongChange,
  isPlaying,
  onPlayPause,
}) => {
  const audioRef = useRef(new Audio());
  const { playlists, addSong } = usePlaylistManager();
  const { user } = useAuth();
  const [mseEngine, setMseEngine] = useState(null);
  const [playbackToken, setPlaybackToken] = useState(null);
  const [manifestUrl, setManifestUrl] = useState(null);

  // --- HYBRID RESUME HOOK! ---
  usePlaybackResume(audioRef, song, user);

  // Request playback token and manifest when song changes
  useEffect(() => {
    if (!song) return;
    async function fetchPlaybackToken() {
      try {
        const res = await fetch('/api/playback/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ asset_id: song.id, bitrate: song.bitrate || 256 })
        });
        const data = await res.json();
        setPlaybackToken(data.playback_token);
        setManifestUrl(data.manifest_url);
      } catch (err) {
        console.error('Failed to fetch playback token:', err);
      }
    }
    fetchPlaybackToken();
  }, [song]);

  // Instantiate MseEngine when manifestUrl and playbackToken are available
  useEffect(() => {
    if (!manifestUrl || !playbackToken || !audioRef.current) return;
    // Dynamically import MseEngine to avoid SSR issues
    import('../engine/MseEngine').then(({ default: MseEngine }) => {
      const engine = new MseEngine(audioRef.current, playbackToken);
      engine.load({ streamUrl: manifestUrl });
      setMseEngine(engine);
    });
  }, [manifestUrl, playbackToken]);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState(REPEAT_OFF);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);
  const [miniPlayerVisible, setMiniPlayerVisible] = useState(false);

  const { setCurrentSongId, setDuration: setGlobalDuration } = usePlayback();

  // Audio Playback Logic
  useEffect(() => {
    if (!song) return;
    setCurrentSongId(song.id);
    // Analytics: Track track load
    playerAnalytics.trackTrackLoad(song, { manifestUrl });
    // If not using MseEngine, fallback to direct src
    if (!mseEngine) {
      const audio = audioRef.current;
      audio.src = `/music/${song.fileName}`;
      audio.load();
      if (isPlaying) {
        audio.play().catch((err) => console.error("Autoplay failed:", err));
        // Analytics: Track play start
        playerAnalytics.trackPlayStart(song);
      }
    } else {
      if (isPlaying) {
        mseEngine.play();
        // Analytics: Track play start
        playerAnalytics.trackPlayStart(song);
      } else {
        mseEngine.pause();
        // Analytics: Track play pause
        playerAnalytics.trackPlayPause('user_action');
      }
    }
  }, [song, isPlaying, setCurrentSongId]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setDuration(audio.duration);
      setGlobalDuration(audio.duration);
    };
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
    };
  }, [song, setGlobalDuration]);

  // Next / Previous Song handlers
  const handleNextSong = useCallback(() => {
    if (!songs || !song) return;
    const idx = songs.findIndex((s) => s.id === song.id);
    if (idx === -1) return;
    const newIndex = shuffle
      ? Math.floor(Math.random() * songs.length)
      : (idx + 1) % songs.length;
    onSongChange(songs[newIndex]);
    if (onPlayPause) onPlayPause(songs[newIndex]);
  }, [song, songs, shuffle, onSongChange, onPlayPause]);

  const handlePrevSong = useCallback(() => {
    if (!songs || !song) return;
    const idx = songs.findIndex((s) => s.id === song.id);
    if (idx === -1) return;
    const newIndex = (idx - 1 + songs.length) % songs.length;
    onSongChange(songs[newIndex]);
    if (onPlayPause) onPlayPause(songs[newIndex]);
  }, [song, songs, onSongChange, onPlayPause]);

  // Repeat mode cycle handler
  const cycleRepeatMode = () => {
    setRepeatMode((prevMode) => (prevMode + 1) % 3);
  };

  // Handle song end event
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => {
      // Analytics: Track play end
      playerAnalytics.trackPlayEnd('natural_end');
      if (repeatMode === REPEAT_ONE) {
        audio.currentTime = 0;
        audio.play();
      } else if (repeatMode === REPEAT_ALL) {
        const idx = songs.findIndex((s) => s.id === song.id);
        const nextIndex = (idx + 1) % songs.length;
        onSongChange(songs[nextIndex]);
        if (onPlayPause) onPlayPause(songs[nextIndex]);
      } else {
        const idx = songs.findIndex((s) => s.id === song.id);
        if (idx === songs.length - 1) {
          if (onPlayPause) onPlayPause(song);
        } else {
          onSongChange(songs[idx + 1]);
          if (onPlayPause) onPlayPause(songs[idx + 1]);
        }
      }
    };
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [song, songs, repeatMode, onSongChange, onPlayPause]);

  // Helpers
  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
    }
    setIsMuted(!isMuted);
  };

  const formatTime = (timeInSec) => {
    if (!timeInSec || isNaN(timeInSec)) return "0:00";
    const minutes = Math.floor(timeInSec / 60);
    const seconds = Math.floor(timeInSec % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleSeek = (e) => {
  const seekVal = parseFloat(e.target.value);
  // Analytics: Track seek event
  playerAnalytics.trackSeek(currentTime, seekVal, 'user_seek');
  audioRef.current.currentTime = seekVal;
  setCurrentTime(seekVal);
  };

  const handleOpenMiniPlayer = () => setMiniPlayerVisible(true);

  return (
    <>
      <div
        className="fixed bottom-0 left-0 w-full bg-black text-white border-t border-gray-800 flex items-center px-4"
        style={{ height: "60px" }}
      >
        {/* LEFT: Cover + Title/Artist */}
        <div className="flex items-center min-w-[180px] w-1/5">
          <img
            src={song.cover || "https://via.placeholder.com/50"}
            alt="cover"
            className="w-12 h-12 object-cover rounded mr-3"
          />
          <div className="leading-tight">
            <p className="font-bold text-sm">{song.title}</p>
            <p className="text-xs text-gray-400">{song.artist}</p>
          </div>
        </div>

        {/* CENTER: Playback Controls + Seek */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="flex items-center gap-4 mb-1">
            <button
              onClick={() => setShuffle(!shuffle)}
              className={`text-gray-400 hover:text-white ${shuffle ? "text-white" : ""}`}
              title="Shuffle"
            >
              <FaRandom size={16} />
            </button>
            <button
              onClick={handlePrevSong}
              className="text-gray-400 hover:text-white"
              title="Previous"
            >
              <FaStepBackward size={18} />
            </button>
            <button
              onClick={() => onPlayPause(song)}
              className="bg-white text-black rounded-full w-8 h-8 flex items-center justify-center hover:scale-105 transition"
              title="Play/Pause"
            >
              {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} />}
            </button>
            <button
              onClick={handleNextSong}
              className="text-gray-400 hover:text-white"
              title="Next"
            >
              <FaStepForward size={18} />
            </button>
            <button
              onClick={cycleRepeatMode}
              className={`relative text-gray-400 hover:text-white ${
                repeatMode !== REPEAT_OFF ? "text-white" : ""
              }`}
              title={
                repeatMode === REPEAT_ONE
                  ? "Repeat One"
                  : repeatMode === REPEAT_ALL
                  ? "Repeat All"
                  : "Repeat Off"
              }
            >
              {repeatMode === REPEAT_ONE ? (
                <div className="relative">
                  <FaRedoAlt size={16} />
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-black">
                    1
                  </span>
                </div>
              ) : (
                <FaRedoAlt size={16} />
              )}
            </button>
          </div>
          {/* Seek Bar Row */}
          <div className="flex items-center gap-2 w-full px-4">
            <span className="text-xs text-gray-400">{formatTime(currentTime)}</span>
            <input
              type="range"
              className="flex-1 accent-gray-300 h-1 cursor-pointer"
              min={0}
              max={duration || 0}
              step="0.01"
              value={currentTime}
              onChange={handleSeek}
            />
            <span className="text-xs text-gray-400">{formatTime(duration)}</span>
          </div>
        </div>

        {/* RIGHT: AddToPlaylist, Volume, Mini Player Toggle */}
        <div className="flex items-center justify-end w-1/5 gap-3">
          <AddToPlaylistButton song={song} playlists={playlists} addSong={addSong} />
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="text-gray-400 hover:text-white">
              {isMuted ? <FaVolumeMute size={14} /> : <FaVolumeUp size={14} />}
            </button>
            <input
              type="range"
              className="w-16 accent-gray-300 cursor-pointer"
              min={0}
              max={1}
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
            />
          </div>
          <button
            onClick={handleOpenMiniPlayer}
            className="text-gray-400 hover:text-white"
            title="Open mini player"
          >
            <FaClone size={14} />
          </button>
        </div>
      </div>

      {/* Mini Player Portal */}
      <MiniPlayerPortal
        visible={miniPlayerVisible}
        song={song}
        isPlaying={isPlaying}
        onTogglePlay={() => onPlayPause(song)}
        onClose={() => setMiniPlayerVisible(false)}
        shuffle={shuffle}
        onShuffleToggle={() => setShuffle(!shuffle)}
        onPrevSong={handlePrevSong}
        onNextSong={handleNextSong}
        repeatMode={repeatMode}
        onCycleRepeat={cycleRepeatMode}
      />
    </>
  );
};

export default MusicPlayer;
