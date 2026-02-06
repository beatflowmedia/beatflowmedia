import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef
} from "react";
import LegacyAudioEngine from "../engine/LegacyAudioEngine";
import MseEngine from "../engine/MseEngine";
import useQueue from "../hooks/useQueue";
import { trackPlay } from "../services/engagementMetrics";
import { trackSongCompletion, trackSongSkip } from "../services/conversionTracking";
import { useAuth } from "./AuthContext";

// --------------------
// Reducer & State
// --------------------
const RepeatMode = {
  OFF: "OFF",
  ALL: "ALL",
  ONE: "ONE"
};

// Initial state
const initialState = {
  queue: [],
  currentIndex: 0,
  isPlaying: false,
  shuffleOn: false,
  repeatMode: RepeatMode.OFF,
  currentTime: 0,
  duration: 0,
  volume: 1
};

// Actions
const actions = {
  SET_QUEUE: "SET_QUEUE",
  PLAY_SONG: "PLAY_SONG",
  PLAY_AT: "PLAY_AT",
  TOGGLE_PLAY: "TOGGLE_PLAY",
  SKIP_NEXT: "SKIP_NEXT",
  SKIP_PREVIOUS: "SKIP_PREVIOUS",
  TOGGLE_SHUFFLE: "TOGGLE_SHUFFLE",
  CYCLE_REPEAT: "CYCLE_REPEAT",
  ENQUEUE: "ENQUEUE",
  REMOVE_AT: "REMOVE_AT",
  REORDER: "REORDER",
  CLEAR: "CLEAR",
  SET_CURRENT_TIME: "SET_CURRENT_TIME",
  SET_DURATION: "SET_DURATION",
  SET_VOLUME: "SET_VOLUME",
  SYNC_QUEUE: "SYNC_QUEUE"
};

function reducer(state = initialState, action) {
  // Validate action structure
  if (!action || typeof action !== 'object') {
    console.error('Invalid action dispatched:', action);
    return state;
  }

  if (!action.type) {
    console.error('Action missing type property:', action);
    return state;
  }

  if (typeof action.type === 'function') {
    console.error('Action type cannot be a function. You may be dispatching an async action creator directly. Dispatch the result instead:', action);
    return state;
  }

  switch (action.type) {
    case actions.SET_CURRENT_TIME:
      return { ...state, currentTime: action.payload };
    case actions.SET_DURATION:
      return { ...state, duration: action.payload };
    case actions.SET_VOLUME:
      return { ...state, volume: action.payload };
    case actions.PLAY_SONG: {
      const song = action.payload;
      // if song exists, play at its index; else enqueue and play
      const existingIndex = state.queue.findIndex((i) => i?.id === song.id);
      let newQueue = state.queue;
      let newIndex = existingIndex;
      if (existingIndex === -1) {
        newIndex = newQueue.length;
        newQueue = [...newQueue, song];
      }
      return {
        ...state,
        queue: newQueue,
        currentIndex: newIndex,
        isPlaying: true
      };
    }
    case actions.SET_QUEUE:
      return {
        ...state,
        queue: action.payload.queue,
        currentIndex: action.payload.currentIndex
      };
    case actions.PLAY_AT: {
      const idx = action.payload;
      if (idx >= 0 && idx < state.queue.length) {
        return { ...state, currentIndex: idx, isPlaying: true };
      }
      return state;
    }
    case actions.TOGGLE_PLAY:
      return { ...state, isPlaying: !state.isPlaying };
    case actions.SKIP_NEXT: {
      const { queue, currentIndex, shuffleOn, repeatMode, currentTime } = state;

      // Track skip if user skipped before 30s (quality signal for 2026 Hybrid Strategy)
      const currentSong = queue[currentIndex];
      if (currentSong?.id && currentTime < 30 && currentTime > 0) {
        // Skip tracking will be handled in dispatch wrapper
        console.log('⏭️ Early skip detected at', currentTime + 's - Song:', currentSong.id);
      }

      if (shuffleOn && queue.length > 1) {
        let next;
        do {
          next = Math.floor(Math.random() * queue.length);
        } while (next === currentIndex);
        return { ...state, currentIndex: next, isPlaying: true };
      }
      if (currentIndex < queue.length - 1) {
        return { ...state, currentIndex: currentIndex + 1, isPlaying: true };
      }
      if (repeatMode === RepeatMode.ALL) {
        return { ...state, currentIndex: 0, isPlaying: true };
      }
      return { ...state, isPlaying: false };
    }
    case actions.SKIP_PREVIOUS: {
      // if playback past 3s, just rewind to start, else go to previous track
      if (state.currentTime > 3) {
        return { ...state, currentTime: 0 };
      }
      const prevIndex = Math.max(0, state.currentIndex - 1);
      return {
        ...state,
        currentIndex: prevIndex,
        isPlaying: true,
        currentTime: 0
      };
    }
    case actions.TOGGLE_SHUFFLE:
      return { ...state, shuffleOn: !state.shuffleOn };
    case actions.CYCLE_REPEAT: {
      const nextMode =
        state.repeatMode === RepeatMode.OFF
          ? RepeatMode.ALL
          : state.repeatMode === RepeatMode.ALL
            ? RepeatMode.ONE
            : RepeatMode.OFF;
      return { ...state, repeatMode: nextMode };
    }
    case actions.ENQUEUE: {
      const { item, position } = action.payload;
      const q = [...state.queue];
      if (
        typeof position === "number" &&
        position >= 0 &&
        position <= q.length
      ) {
        q.splice(position, 0, item);
      } else {
        q.push(item);
      }
      return { ...state, queue: q };
    }
    case actions.REMOVE_AT: {
      const idx = action.payload;
      const q = [...state.queue];
      q.splice(idx, 1);
      let { currentIndex } = state;
      if (idx < currentIndex) currentIndex -= 1;
      else if (idx === currentIndex) {
        if (q.length > 0) currentIndex = Math.min(idx, q.length - 1);
        else currentIndex = 0;
      }
      return { ...state, queue: q, currentIndex };
    }
    case actions.REORDER: {
      const { from, to } = action.payload;
      const q = [...state.queue];
      const [moved] = q.splice(from, 1);
      q.splice(to, 0, moved);
      let { currentIndex } = state;
      // Update currentIndex: if moving current song, jump to new position; else adjust for shift
      if (from === currentIndex) {
        currentIndex = to;
      } else if (from < currentIndex && to >= currentIndex) {
        currentIndex -= 1;
      } else if (from > currentIndex && to <= currentIndex) {
        currentIndex += 1;
      }
      return { ...state, queue: q, currentIndex };
    }
    case actions.CLEAR:
      return { ...state, queue: [], currentIndex: 0, isPlaying: false };
    case actions.SYNC_QUEUE: {
      // Sync queue with fresh Firebase data (updates coverUrl, artistImage, etc.)
      const freshSongsMap = new Map(
        action.payload.map(song => [song.id, song])
      );
      const syncedQueue = state.queue.map(queuedSong => {
        const freshData = freshSongsMap.get(queuedSong.id);
        return freshData ? { ...queuedSong, ...freshData } : queuedSong;
      });
      return { ...state, queue: syncedQueue };
    }
    default:
      return state;
  }
}

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const [state, dispatchRaw] = useReducer(reducer, initialState);
  const { user } = useAuth();
  // Ref to audio element in DOM
  const audioRef = useRef(null);
  // Choose engine class based on env flag
  const useMse = process.env.REACT_APP_USE_MSE === "true";
  const EngineClass = useMse ? MseEngine : LegacyAudioEngine;
  // Playback engine instance (created once audioRef is set)
  const engineRef = useRef();
  useEffect(() => {
    if (audioRef.current && !engineRef.current) {
      engineRef.current = new EngineClass(audioRef.current);
    }
  }, [EngineClass]); // eslint-disable-next-line react-hooks/exhaustive-deps
  // Track if we've initialized queue from Firestore
  const [queueInitialized, setQueueInitialized] = React.useState(false);
  // Track if play count has been incremented for current song
  const playCountIncrementedRef = useRef(false);
  // Track skip/completion metrics for current song (2026 Hybrid Strategy)
  const completionTrackedRef = useRef(false);
  const skipTrackedRef = useRef(false);
  const songStartTimeRef = useRef(0);
  // Track last loaded track index to prevent infinite loading loops
  const lastLoadedIndexRef = useRef(-1);
  // Firestore-persisted queue hooks
  const {
    queue: persistedQueue,
    loading: queueLoading,
    error: queueError,
    add,
    removeAt: persistRemove,
    clear: persistClear,
    reorder: persistReorder
  } = useQueue();

  // Sync persisted Firestore queue into PlayerContext only once on initial load
  useEffect(() => {
    if (!queueLoading && !queueError && !queueInitialized) {
      dispatchRaw({
        type: actions.SET_QUEUE,
        payload: { queue: persistedQueue, currentIndex: 0 }
      });
      setQueueInitialized(true);
    }
  }, [persistedQueue, queueLoading, queueError, queueInitialized]);

  // Load new track into engine when currentIndex changes
  useEffect(() => {
    const engine = engineRef.current;
    const item = state.queue[state.currentIndex];

    // Prevent loading if no engine or no item
    if (!engine || !item) {
      return;
    }

    // Don't load tracks on page mount unless user wants to play
    // This prevents slow initial loads
    if (!state.isPlaying && lastLoadedIndexRef.current === -1) {
      console.log('[PlayerContext] Skipping initial load until user clicks play');
      return;
    }

    // Only skip loading if we're trying to reload the exact same track at the same index
    // This allows track 0 to load on initial mount when playing
    if (lastLoadedIndexRef.current === state.currentIndex && audioRef.current?.src) {
      return;
    }

    console.log('[PlayerContext] Loading new track:', item.title || item.name, 'at index', state.currentIndex);
    lastLoadedIndexRef.current = state.currentIndex;

    // Load track asynchronously
    engine.load(item).then(() => {
      console.log('[PlayerContext] Track loaded successfully, readyState:', audioRef.current?.readyState);
      // Reset tracking flags when loading new track
      playCountIncrementedRef.current = false;
      completionTrackedRef.current = false;
      skipTrackedRef.current = false;
      songStartTimeRef.current = Date.now();

      // If we should be playing, start playback now that track is loaded
      if (state.isPlaying && audioRef.current) {
        console.log('[PlayerContext] Auto-playing after track load, readyState:', audioRef.current.readyState);

        // Use a small delay to ensure audio element is ready
        const attemptPlay = () => {
          engine.play().catch((error) => {
            if (error.name === 'NotAllowedError') {
              console.warn('[PlayerContext] Autoplay blocked after load');
              dispatchRaw({ type: actions.TOGGLE_PLAY });
            } else if (error.name === 'NotSupportedError') {
              console.error('[PlayerContext] Audio format not supported:', error);
            } else {
              console.error('[PlayerContext] Playback error after load:', error);
            }
          });
        };

        // If audio is ready, play immediately
        if (audioRef.current.readyState >= 2) {
          attemptPlay();
        } else {
          // Wait for audio to be ready
          audioRef.current.addEventListener('canplay', attemptPlay, { once: true });
        }
      }
    }).catch((error) => {
      console.error('[PlayerContext] Error loading track:', error);
      lastLoadedIndexRef.current = -1; // Reset on error to allow retry
    });
  }, [state.currentIndex, state.isPlaying]); // Depend on both currentIndex AND isPlaying

  // Control play/pause when user toggles (but track is already loaded)
  useEffect(() => {
    const engine = engineRef.current;
    const audioElement = audioRef.current;
    if (!engine || !audioElement) return;

    // Only handle play/pause for current loaded track (not track changes)
    // Track changes are handled in the load effect above
    if (!audioElement.src || audioElement.src === window.location.href) {
      return; // No source loaded yet
    }

    if (state.isPlaying) {
      // User pressed play on already-loaded track
      console.log('[PlayerContext] Resuming playback, readyState:', audioElement.readyState);
      engine.play().catch((error) => {
        if (error.name === 'NotAllowedError') {
          console.warn('[PlayerContext] Autoplay blocked');
          dispatchRaw({ type: actions.TOGGLE_PLAY });
        }
      });
    } else {
      // User pressed pause
      console.log('[PlayerContext] Pausing playback');
      engine.pause();
    }
  }, [state.isPlaying]); // Only depend on isPlaying, NOT currentIndex

  // Handle global PLAY_SONG events via reducer
  useEffect(() => {
    const handler = (e) =>
      dispatchRaw({ type: actions.PLAY_SONG, payload: e.detail });
    window.addEventListener("PLAY_SONG", handler);
    return () => window.removeEventListener("PLAY_SONG", handler);
  }, [dispatchRaw]);

  // Subscribe to engine events: time, duration, volume, ended
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const unsubTime = engine.onTimeUpdate((time) => {
      dispatchRaw({ type: actions.SET_CURRENT_TIME, payload: time });

      // Track play when song reaches 50% of duration (DRY - uses engagementMetrics service)
      const item = state.queue[state.currentIndex];
      if (
        item?.id &&
        state.duration > 0 &&
        time >= state.duration / 2 &&
        !playCountIncrementedRef.current
      ) {
        playCountIncrementedRef.current = true;
        console.log('🎵 Play count triggered at 50% - Song:', item.id, 'User:', user?.uid || 'anonymous', 'Time:', time, 'Duration:', state.duration);
        // Track play with metadata (handles race conditions with increment())
        trackPlay(user?.uid || 'anonymous', item.id, {
          duration: state.duration,
          completionRate: (time / state.duration) * 100,
          source: 'web',
          context: 'player'
        }).then(() => {
          console.log('✅ Play count tracked successfully for song:', item.id);
        }).catch(err => {
          console.error('❌ Failed to track play:', err);
        });
      }

      // Track completion when user listens to 80%+ of song (2026 Hybrid Strategy)
      if (
        item?.id &&
        state.duration > 0 &&
        time >= state.duration * 0.8 &&
        !completionTrackedRef.current
      ) {
        completionTrackedRef.current = true;
        const completionPercent = Math.round((time / state.duration) * 100);
        console.log('🎯 Completion tracking at 80% - Song:', item.id, 'Completion:', completionPercent + '%');
        trackSongCompletion(item, completionPercent);
      }
    });
    const unsubDuration = engine.onDurationChange((duration) =>
      dispatchRaw({ type: actions.SET_DURATION, payload: duration }),
    );
    const unsubVolume = engine.onVolumeChange((volume) =>
      dispatchRaw({ type: actions.SET_VOLUME, payload: volume }),
    );
    const unsubEnded = engine.onEnded(() =>
      dispatchRaw({ type: actions.SKIP_NEXT }),
    );
    return () => {
      unsubTime();
      unsubDuration();
      unsubVolume();
      unsubEnded();
    };
  }, [state.queue, state.currentIndex, state.duration, user]);

  // Enhanced dispatch that also persists queue changes and syncs playback engine
  const dispatch = (action) => {
    console.log("PlayerContext.dispatch action:", action);

    // Track skip before dispatching (2026 Hybrid Strategy - quality signal)
    if (action.type === actions.SKIP_NEXT) {
      const currentSong = state.queue[state.currentIndex];
      if (currentSong?.id && state.currentTime < 30 && state.currentTime > 0 && !skipTrackedRef.current) {
        skipTrackedRef.current = true;
        console.log('📊 Tracking early skip - Song:', currentSong.id, 'Time:', state.currentTime + 's');
        trackSongSkip(currentSong, Math.round(state.currentTime));
      }
    }

    // Sync engine on direct control actions
    switch (action.type) {
      case actions.SET_CURRENT_TIME:
        if (engineRef.current) engineRef.current.seek(action.payload);
        break;
      case actions.SET_VOLUME:
        if (engineRef.current) engineRef.current.setVolume(action.payload);
        break;
      case actions.ENQUEUE:
        console.log("PlayerContext ENQUEUE, payload:", action.payload);
        add(action.payload.item);
        break;
      case actions.REMOVE_AT:
        console.log("PlayerContext REMOVE_AT, payload:", action.payload);
        persistRemove(action.payload);
        break;
      case actions.REORDER:
        console.log("PlayerContext REORDER, payload:", action.payload);
        persistReorder(action.payload.from, action.payload.to);
        break;
      case actions.CLEAR:
        console.log("PlayerContext CLEAR");
        persistClear();
        break;
      default:
        break;
    }
    dispatchRaw(action);
  };

  // Media Session API integration
  useEffect(() => {
    const item = state.queue[state.currentIndex];
    if ("mediaSession" in navigator && item) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: item.title || item.name || "",
        artist: item.artist || "",
        album: item.album || "",
        artwork: [
          {
            src: item.coverUrl || item.cover || "/favicon.ico",
            sizes: "512x512",
            type: "image/png"
          },
        ]
      });

      // Set playback state
      navigator.mediaSession.playbackState = state.isPlaying ? "playing" : "paused";

      // Update position state
      if (state.duration > 0 && "setPositionState" in navigator.mediaSession) {
        try {
          navigator.mediaSession.setPositionState({
            duration: state.duration,
            playbackRate: 1.0,
            position: state.currentTime
          });
        } catch (error) {
          console.log("setPositionState not supported or invalid values");
        }
      }

      navigator.mediaSession.setActionHandler("play", () =>
        dispatchRaw({ type: actions.TOGGLE_PLAY }),
      );
      navigator.mediaSession.setActionHandler("pause", () =>
        dispatchRaw({ type: actions.TOGGLE_PLAY }),
      );
      navigator.mediaSession.setActionHandler("previoustrack", () =>
        dispatchRaw({ type: actions.SKIP_PREVIOUS }),
      );
      navigator.mediaSession.setActionHandler("nexttrack", () =>
        dispatchRaw({ type: actions.SKIP_NEXT }),
      );
      navigator.mediaSession.setActionHandler("seekbackward", (details) => {
        const offset = details.seekOffset || 10;
        const newTime = Math.max(state.currentTime - offset, 0);
        dispatchRaw({ type: actions.SET_CURRENT_TIME, payload: newTime });
      });
      navigator.mediaSession.setActionHandler("seekforward", (details) => {
        const offset = details.seekOffset || 10;
        const newTime = Math.min(state.currentTime + offset, state.duration);
        dispatchRaw({ type: actions.SET_CURRENT_TIME, payload: newTime });
      });
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== null && details.seekTime >= 0) {
          dispatchRaw({ type: actions.SET_CURRENT_TIME, payload: details.seekTime });
        }
      });
    }
  }, [state.currentIndex, state.queue, state.currentTime, state.duration, state.isPlaying]);

  return (
    <PlayerContext.Provider value={{ state, dispatch, actions, audioRef }}>
      {children}
      {/* Single audio element, hidden and controlled via context; native controls removed to avoid duplicate cursors */}
      <audio
        ref={audioRef}
        id="audio-player"
        className="sr-only"
        aria-label="Audio player"
        preload="auto"
        crossOrigin="anonymous"
      />
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
};

// Expose for testing
export { reducer, initialState, actions, RepeatMode };
