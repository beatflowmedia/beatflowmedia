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
import { incrementPlayCount } from "../hooks/useSongPlays";

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
  SET_VOLUME: "SET_VOLUME"
};

function reducer(state = initialState, action) {
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
      const { queue, currentIndex, shuffleOn, repeatMode } = state;
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
    default:
      return state;
  }
}

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const [state, dispatchRaw] = useReducer(reducer, initialState);
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
  }, [EngineClass]);
  // Track if we've initialized queue from Firestore
  const [queueInitialized, setQueueInitialized] = React.useState(false);
  // Track if play count has been incremented for current song
  const playCountIncrementedRef = useRef(false);
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
    if (!engine || !item) return;
    engine.load(item);
    // Reset play count flag when loading new track
    playCountIncrementedRef.current = false;
    // Auto-play when switching tracks if already playing
    if (state.isPlaying) {
      engine.play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentIndex]);

  // Control play/pause when isPlaying flag changes
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (state.isPlaying) {
      engine.play();
    } else {
      engine.pause();
    }
  }, [state.isPlaying]);

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
    const unsubTime = engine.onTimeUpdate((time) => {
      dispatchRaw({ type: actions.SET_CURRENT_TIME, payload: time });

      // Increment play count when song reaches 50% of duration
      const item = state.queue[state.currentIndex];
      if (
        item?.id &&
        state.duration > 0 &&
        time >= state.duration / 2 &&
        !playCountIncrementedRef.current
      ) {
        playCountIncrementedRef.current = true;
        incrementPlayCount(item.id);
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
  }, [state.queue, state.currentIndex, state.duration]);

  // Enhanced dispatch that also persists queue changes and syncs playback engine
  const dispatch = (action) => {
    console.log("PlayerContext.dispatch action:", action);
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
    }
  }, [state.currentIndex, state.queue, state.currentTime, state.duration]);

  return (
    <PlayerContext.Provider value={{ state, dispatch, actions, audioRef }}>
      {children}
      {/* Single audio element, hidden and controlled via context; native controls removed to avoid duplicate cursors */}
      <audio
        ref={audioRef}
        id="audio-player"
        className="sr-only"
        aria-label="Audio player"
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
