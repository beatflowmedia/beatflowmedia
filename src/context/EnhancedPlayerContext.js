import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useState
} from "react";
import LegacyAudioEngine from "../engine/LegacyAudioEngine";
import MseEngine from "../engine/MseEngine";
import ProductionMseEngine from "../engine/ProductionMseEngine";
import WebAudioProcessor from "../engine/WebAudioProcessor";
import useQueue from "../hooks/useQueue";

// Enhanced PlayerContext with production-grade audio features
// Integrates gapless playback, crossfade, adaptive streaming, and advanced audio processing

// --------------------
// Enhanced State & Actions
// --------------------
const RepeatMode = {
  OFF: "OFF",
  ALL: "ALL",
  ONE: "ONE"
};

const EngineMode = {
  LEGACY: "LEGACY",
  MSE: "MSE",
  PRODUCTION: "PRODUCTION"
};

// Enhanced initial state
const initialState = {
  // Basic player state
  queue: [],
  currentIndex: 0,
  isPlaying: false,
  shuffleOn: false,
  repeatMode: RepeatMode.OFF,
  currentTime: 0,
  duration: 0,
  volume: 1,

  // Enhanced audio features
  engineMode: EngineMode.PRODUCTION,
  gaplessEnabled: true,
  crossfadeEnabled: true,
  adaptiveStreamingEnabled: true,

  // Audio processing
  audioProcessingEnabled: false,
  visualizationEnabled: false,
  eqEnabled: false,

  // Crossfade state
  crossfadeActive: false,
  crossfadeDuration: 8,

  // Quality and streaming
  currentQuality: "high",
  networkStatus: null,
  bufferStatus: null,

  // Analytics
  sessionAnalytics: {
    tracksPlayed: 0,
    totalPlaytime: 0,
    qualityChanges: 0,
    crossfadeEvents: 0,
    errors: []
  }
};

// Enhanced actions
const actions = {
  // Basic playback actions
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

  // Enhanced audio actions
  SET_ENGINE_MODE: "SET_ENGINE_MODE",
  TOGGLE_GAPLESS: "TOGGLE_GAPLESS",
  TOGGLE_CROSSFADE: "TOGGLE_CROSSFADE",
  TOGGLE_ADAPTIVE_STREAMING: "TOGGLE_ADAPTIVE_STREAMING",
  SET_CROSSFADE_DURATION: "SET_CROSSFADE_DURATION",
  SET_CROSSFADE_ACTIVE: "SET_CROSSFADE_ACTIVE",

  // Audio processing actions
  TOGGLE_AUDIO_PROCESSING: "TOGGLE_AUDIO_PROCESSING",
  TOGGLE_VISUALIZATION: "TOGGLE_VISUALIZATION",
  TOGGLE_EQ: "TOGGLE_EQ",

  // Quality and streaming actions
  SET_QUALITY: "SET_QUALITY",
  UPDATE_NETWORK_STATUS: "UPDATE_NETWORK_STATUS",
  UPDATE_BUFFER_STATUS: "UPDATE_BUFFER_STATUS",

  // Analytics actions
  UPDATE_ANALYTICS: "UPDATE_ANALYTICS",
  ADD_ERROR: "ADD_ERROR"
};

function enhancedReducer(state = initialState, action) {
  switch (action.type) {
    // Basic player state updates
    case actions.SET_CURRENT_TIME:
      return { ...state, currentTime: action.payload };
    case actions.SET_DURATION:
      return { ...state, duration: action.payload };
    case actions.SET_VOLUME:
      return { ...state, volume: action.payload };

    // Enhanced playback actions
    case actions.PLAY_SONG: {
      const song = action.payload;
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
        isPlaying: true,
        sessionAnalytics: {
          ...state.sessionAnalytics,
          tracksPlayed: state.sessionAnalytics.tracksPlayed + 1
        }
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

    // Enhanced audio feature actions
    case actions.SET_ENGINE_MODE:
      return { ...state, engineMode: action.payload };

    case actions.TOGGLE_GAPLESS:
      return { ...state, gaplessEnabled: !state.gaplessEnabled };

    case actions.TOGGLE_CROSSFADE:
      return { ...state, crossfadeEnabled: !state.crossfadeEnabled };

    case actions.TOGGLE_ADAPTIVE_STREAMING:
      return {
        ...state,
        adaptiveStreamingEnabled: !state.adaptiveStreamingEnabled
      };

    case actions.SET_CROSSFADE_DURATION:
      return { ...state, crossfadeDuration: action.payload };

    case actions.SET_CROSSFADE_ACTIVE:
      return {
        ...state,
        crossfadeActive: action.payload,
        sessionAnalytics: action.payload
          ? {
              ...state.sessionAnalytics,
              crossfadeEvents: state.sessionAnalytics.crossfadeEvents + 1
            }
          : state.sessionAnalytics
      };

    // Audio processing actions
    case actions.TOGGLE_AUDIO_PROCESSING:
      return {
        ...state,
        audioProcessingEnabled: !state.audioProcessingEnabled
      };

    case actions.TOGGLE_VISUALIZATION:
      return { ...state, visualizationEnabled: !state.visualizationEnabled };

    case actions.TOGGLE_EQ:
      return { ...state, eqEnabled: !state.eqEnabled };

    // Quality and streaming actions
    case actions.SET_QUALITY:
      return {
        ...state,
        currentQuality: action.payload,
        sessionAnalytics: {
          ...state.sessionAnalytics,
          qualityChanges: state.sessionAnalytics.qualityChanges + 1
        }
      };

    case actions.UPDATE_NETWORK_STATUS:
      return { ...state, networkStatus: action.payload };

    case actions.UPDATE_BUFFER_STATUS:
      return { ...state, bufferStatus: action.payload };

    // Analytics actions
    case actions.UPDATE_ANALYTICS:
      return {
        ...state,
        sessionAnalytics: { ...state.sessionAnalytics, ...action.payload }
      };

    case actions.ADD_ERROR:
      return {
        ...state,
        sessionAnalytics: {
          ...state.sessionAnalytics,
          errors: [...state.sessionAnalytics.errors.slice(-49), action.payload], // Keep last 50 errors
        }
      };

    default:
      return state;
  }
}

const EnhancedPlayerContext = createContext();

export const EnhancedPlayerProvider = ({ children }) => {
  const [state, dispatchRaw] = useReducer(enhancedReducer, initialState);

  // Audio element and engine references
  const audioRef = useRef(null);
  const engineRef = useRef();
  const webAudioProcessorRef = useRef();

  // Initialization state
  const [engineInitialized, setEngineInitialized] = useState(false);
  const [queueInitialized, setQueueInitialized] = useState(false);

  // Firestore queue integration
  const {
    queue: persistedQueue,
    loading: queueLoading,
    error: queueError,
    add,
    removeAt: persistRemove,
    clear: persistClear,
    reorder: persistReorder
  } = useQueue();

  // Engine selection based on mode and capabilities
  const getEngineClass = () => {
    switch (state.engineMode) {
      case EngineMode.PRODUCTION:
        return ProductionMseEngine;
      case EngineMode.MSE:
        return MseEngine;
      case EngineMode.LEGACY:
      default:
        return LegacyAudioEngine;
    }
  };

  // Initialize engines when audio element is available
  useEffect(() => {
    if (audioRef.current && !engineInitialized) {
      initializeEngines();
    }
  }, [state.engineMode, engineInitialized]);

  // Initialize audio engines
  const initializeEngines = async () => {
    try {
      const EngineClass = getEngineClass();
      engineRef.current = new EngineClass(audioRef.current);

      // Initialize Web Audio Processor for enhanced features
      if (state.engineMode === EngineMode.PRODUCTION) {
        webAudioProcessorRef.current = new WebAudioProcessor({
          enableEffects: state.audioProcessingEnabled,
          enableVisualization: state.visualizationEnabled,
          enableAnalysis: true
        });

        // Connect audio element to Web Audio processor
        webAudioProcessorRef.current.connectSource(audioRef.current);

        // Start audio processing if enabled
        if (state.audioProcessingEnabled || state.visualizationEnabled) {
          webAudioProcessorRef.current.startProcessing();
        }
      }

      setupEngineEventListeners();
      setEngineInitialized(true);
    } catch (error) {
      console.error("Failed to initialize audio engines:", error);
      dispatchRaw({
        type: actions.ADD_ERROR,
        payload: {
          type: "engine_initialization",
          message: error.message,
          timestamp: Date.now()
        }
      });
    }
  };

  // Setup event listeners for the audio engine
  const setupEngineEventListeners = () => {
    const engine = engineRef.current;
    if (!engine) return;

    // Basic engine events
    const unsubscribers = [
      engine.onTimeUpdate((time) => {
        dispatchRaw({ type: actions.SET_CURRENT_TIME, payload: time });
      }),

      engine.onDurationChange((duration) => {
        dispatchRaw({ type: actions.SET_DURATION, payload: duration });
      }),

      engine.onVolumeChange((volume) => {
        dispatchRaw({ type: actions.SET_VOLUME, payload: volume });
      }),

      engine.onEnded(() => {
        dispatchRaw({ type: actions.SKIP_NEXT });
      }),
    ];

    // Enhanced engine events (ProductionMseEngine only)
    if (state.engineMode === EngineMode.PRODUCTION && engine.onBufferUpdate) {
      unsubscribers.push(
        engine.onBufferUpdate((bufferStatus) => {
          dispatchRaw({
            type: actions.UPDATE_BUFFER_STATUS,
            payload: bufferStatus
          });
        }),

        engine.onQualityChange((qualityInfo) => {
          dispatchRaw({ type: actions.SET_QUALITY, payload: qualityInfo.to });
        }),

        engine.onCrossfadeStart(() => {
          dispatchRaw({ type: actions.SET_CROSSFADE_ACTIVE, payload: true });
        }),

        engine.onCrossfadeComplete(() => {
          dispatchRaw({ type: actions.SET_CROSSFADE_ACTIVE, payload: false });
        }),

        engine.onError((error) => {
          dispatchRaw({ type: actions.ADD_ERROR, payload: error });
        }),

        engine.onAnalyticsUpdate((analytics) => {
          dispatchRaw({ type: actions.UPDATE_ANALYTICS, payload: analytics });
        }),
      );
    }

    // Web Audio Processor events
    if (webAudioProcessorRef.current) {
      const webAudio = webAudioProcessorRef.current;

      unsubscribers.push(
        webAudio.onAnalysisUpdate &&
          webAudio.onAnalysisUpdate((analysis) => {
            // Handle real-time audio analysis
          }),

        webAudio.onNetworkUpdate &&
          webAudio.onNetworkUpdate((networkStatus) => {
            dispatchRaw({
              type: actions.UPDATE_NETWORK_STATUS,
              payload: networkStatus
            });
          }),
      );
    }

    // Store unsubscribers for cleanup
    engineRef.current._unsubscribers = unsubscribers;
  };

  // Sync persisted queue on initial load
  useEffect(() => {
    if (
      !queueLoading &&
      !queueError &&
      !queueInitialized &&
      persistedQueue.length > 0
    ) {
      dispatchRaw({
        type: actions.SET_QUEUE,
        payload: { queue: persistedQueue, currentIndex: 0 }
      });
      setQueueInitialized(true);
    }
  }, [persistedQueue, queueLoading, queueError, queueInitialized]);

  // Load track when current index or queue changes
  useEffect(() => {
    if (!engineInitialized || !engineRef.current) return;

    const engine = engineRef.current;
    const currentTrack = state.queue[state.currentIndex];
    const nextTrack = state.queue[state.currentIndex + 1];

    if (currentTrack) {
      const loadOptions = {
        nextTrack: state.gaplessEnabled ? nextTrack : null,
        crossfade: state.crossfadeEnabled,
        quality: state.currentQuality
      };

      engine.load(currentTrack, loadOptions).catch((error) => {
        console.error("Failed to load track:", error);
        dispatchRaw({
          type: actions.ADD_ERROR,
          payload: {
            type: "track_load_failed",
            message: error.message,
            context: { trackId: currentTrack.id },
            timestamp: Date.now()
          }
        });
      });
    }
  }, [
    state.currentIndex,
    state.queue,
    engineInitialized,
    state.gaplessEnabled,
    state.crossfadeEnabled,
  ]);

  // Control playback when play state changes
  useEffect(() => {
    if (!engineInitialized || !engineRef.current) return;

    const engine = engineRef.current;
    if (state.isPlaying) {
      engine.play().catch((error) => {
        console.error("Playback failed:", error);
        dispatchRaw({ type: actions.TOGGLE_PLAY }); // Revert play state
      });
    } else {
      engine.pause();
    }
  }, [state.isPlaying, engineInitialized]);

  // Update engine configuration when settings change
  useEffect(() => {
    if (!engineInitialized || !engineRef.current) return;

    const engine = engineRef.current;

    // Update ProductionMseEngine configuration
    if (state.engineMode === EngineMode.PRODUCTION && engine.setConfig) {
      engine.setConfig({
        enableGapless: state.gaplessEnabled,
        enableCrossfade: state.crossfadeEnabled,
        enableAdaptive: state.adaptiveStreamingEnabled,
        crossfadeDuration: state.crossfadeDuration
      });
    }

    // Update adaptive streaming
    if (engine.setAdaptiveStreaming) {
      engine.setAdaptiveStreaming(state.adaptiveStreamingEnabled);
    }
  }, [
    state.gaplessEnabled,
    state.crossfadeEnabled,
    state.adaptiveStreamingEnabled,
    state.crossfadeDuration,
    engineInitialized,
  ]);

  // Update Web Audio Processor configuration
  useEffect(() => {
    if (!webAudioProcessorRef.current) return;

    const webAudio = webAudioProcessorRef.current;

    if (
      state.audioProcessingEnabled &&
      !webAudio.processingState.isProcessing
    ) {
      webAudio.startProcessing();
    } else if (
      !state.audioProcessingEnabled &&
      webAudio.processingState.isProcessing
    ) {
      webAudio.stopProcessing();
    }
  }, [state.audioProcessingEnabled]);

  // Handle global PLAY_SONG events
  useEffect(() => {
    const handler = (e) =>
      dispatchRaw({ type: actions.PLAY_SONG, payload: e.detail });
    window.addEventListener("PLAY_SONG", handler);
    return () => window.removeEventListener("PLAY_SONG", handler);
  }, []);

  // Media Session API integration
  useEffect(() => {
    const currentTrack = state.queue[state.currentIndex];

    if ("mediaSession" in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title || currentTrack.name || "",
        artist: currentTrack.artist || "",
        album: currentTrack.album || "",
        artwork: [
          {
            src: currentTrack.coverUrl || currentTrack.cover || "/favicon.ico",
            sizes: "512x512",
            type: "image/png"
          },
        ]
      });

      const mediaSessionHandlers = {
        play: () => dispatchRaw({ type: actions.TOGGLE_PLAY }),
        pause: () => dispatchRaw({ type: actions.TOGGLE_PLAY }),
        previoustrack: () => dispatchRaw({ type: actions.SKIP_PREVIOUS }),
        nexttrack: () => dispatchRaw({ type: actions.SKIP_NEXT }),
        seekbackward: (details) => {
          const offset = details.seekOffset || 10;
          const newTime = Math.max(state.currentTime - offset, 0);
          dispatchRaw({ type: actions.SET_CURRENT_TIME, payload: newTime });
        },
        seekforward: (details) => {
          const offset = details.seekOffset || 10;
          const newTime = Math.min(state.currentTime + offset, state.duration);
          dispatchRaw({ type: actions.SET_CURRENT_TIME, payload: newTime });
        }
      };

      Object.entries(mediaSessionHandlers).forEach(([action, handler]) => {
        navigator.mediaSession.setActionHandler(action, handler);
      });
    }
  }, [state.currentIndex, state.queue, state.currentTime, state.duration]);

  // Enhanced dispatch function with persistence and engine sync
  const dispatch = (action) => {
    console.log("EnhancedPlayerContext.dispatch action:", action);

    // Handle engine-specific actions
    switch (action.type) {
      case actions.SET_CURRENT_TIME:
        if (engineRef.current && engineRef.current.seek) {
          engineRef.current.seek(action.payload);
        }
        break;

      case actions.SET_VOLUME:
        if (engineRef.current && engineRef.current.setVolume) {
          engineRef.current.setVolume(action.payload);
        }
        break;

      case actions.SET_QUALITY:
        if (engineRef.current && engineRef.current.setQuality) {
          engineRef.current.setQuality(action.payload);
        }
        break;

      // Queue persistence actions
      case actions.ENQUEUE:
        add(action.payload.item);
        break;

      case actions.REMOVE_AT:
        persistRemove(action.payload);
        break;

      case actions.REORDER:
        persistReorder(action.payload.from, action.payload.to);
        break;

      case actions.CLEAR:
        persistClear();
        break;
    }

    dispatchRaw(action);
  };

  // Enhanced control methods
  const enhancedControls = {
    // Crossfade controls
    startCrossfade: (options = {}) => {
      if (engineRef.current && engineRef.current.startCrossfade) {
        return engineRef.current.startCrossfade({
          duration: state.crossfadeDuration,
          ...options
        });
      }
    },

    stopCrossfade: () => {
      if (engineRef.current && engineRef.current.stopCrossfade) {
        engineRef.current.stopCrossfade();
      }
    },

    // Quality controls
    setQuality: (quality) => {
      dispatch({ type: actions.SET_QUALITY, payload: quality });
    },

    toggleAdaptiveStreaming: () => {
      dispatch({ type: actions.TOGGLE_ADAPTIVE_STREAMING });
    },

    // Audio processing controls
    toggleAudioProcessing: () => {
      dispatch({ type: actions.TOGGLE_AUDIO_PROCESSING });
    },

    toggleVisualization: () => {
      dispatch({ type: actions.TOGGLE_VISUALIZATION });
    },

    toggleEQ: () => {
      dispatch({ type: actions.TOGGLE_EQ });
    },

    // Engine controls
    setEngineMode: (mode) => {
      dispatch({ type: actions.SET_ENGINE_MODE, payload: mode });
      setEngineInitialized(false); // Force re-initialization
    },

    // Analytics
    getAnalytics: () => state.sessionAnalytics,

    getEngineStatus: () => {
      if (engineRef.current && engineRef.current.getEngineStatus) {
        return engineRef.current.getEngineStatus();
      }
      return null;
    },

    // Web Audio access
    getWebAudioProcessor: () => webAudioProcessorRef.current,
    getAudioEngine: () => engineRef.current
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current?._unsubscribers) {
        engineRef.current._unsubscribers.forEach((unsub) => unsub());
      }
      if (engineRef.current?.destroy) {
        engineRef.current.destroy();
      }
      if (webAudioProcessorRef.current?.destroy) {
        webAudioProcessorRef.current.destroy();
      }
    };
  }, []);

  const contextValue = {
    state,
    dispatch,
    actions,
    enhancedControls,
    engineInitialized,
    RepeatMode,
    EngineMode
  };

  return (
    <EnhancedPlayerContext.Provider value={contextValue}>
      {children}
      <audio
        ref={audioRef}
        id="enhanced-audio-player"
        className="sr-only"
        aria-label="Enhanced audio player"
        crossOrigin="anonymous"
      />
    </EnhancedPlayerContext.Provider>
  );
};

export const useEnhancedPlayer = () => {
  const context = useContext(EnhancedPlayerContext);
  if (!context) {
    throw new Error(
      "useEnhancedPlayer must be used inside EnhancedPlayerProvider",
    );
  }
  return context;
};

// Export enhanced reducer and actions for testing
export { enhancedReducer, initialState, actions, RepeatMode, EngineMode };
