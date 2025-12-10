import ProductionMseEngine from "../ProductionMseEngine";
import GaplessEngine from "../GaplessEngine";
import CrossfadeEngine from "../CrossfadeEngine";
import AdaptiveEngine from "../AdaptiveEngine";

// Mock the sub-engines
jest.mock("../GaplessEngine");
jest.mock("../CrossfadeEngine");
jest.mock("../AdaptiveEngine");

const mockAudioElement = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  currentTime: 0,
  duration: 180,
  volume: 1
};

describe("ProductionMseEngine", () => {
  let engine;
  let mockGaplessEngine;
  let mockCrossfadeEngine;
  let mockAdaptiveEngine;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock instances
    mockGaplessEngine = {
      load: jest.fn().mockResolvedValue(),
      play: jest.fn().mockResolvedValue(),
      pause: jest.fn(),
      seek: jest.fn().mockResolvedValue(),
      setVolume: jest.fn(),
      onTimeUpdate: jest.fn().mockReturnValue(() => {}),
      onDurationChange: jest.fn().mockReturnValue(() => {}),
      onVolumeChange: jest.fn().mockReturnValue(() => {}),
      onEnded: jest.fn().mockReturnValue(() => {}),
      onBufferUpdate: jest.fn(),
      onGaplessReady: jest.fn(),
      prepareGaplessTransition: jest.fn().mockResolvedValue(),
      getBufferStatus: jest.fn().mockReturnValue({
        bufferedAhead: 10,
        bufferHealth: 1.0,
        networkQuality: 0.8
      }),
      config: { bufferAhead: 10 },
      _cleanup: jest.fn()
    };

    mockCrossfadeEngine = {
      connectAudioElement: jest.fn(),
      analyzeTrack: jest.fn().mockResolvedValue(),
      startCrossfade: jest.fn().mockResolvedValue(),
      stopCrossfade: jest.fn(),
      onCrossfadeStart: jest.fn(),
      onCrossfadeComplete: jest.fn(),
      onBeatDetected: jest.fn(),
      setConfig: jest.fn(),
      getCurrentAnalysis: jest.fn().mockReturnValue({}),
      setVolume: jest.fn(),
      audioContext: { sampleRate: 48000 },
      destroy: jest.fn()
    };

    mockAdaptiveEngine = {
      setAdaptiveStreaming: jest.fn(),
      setUserPreferredQuality: jest.fn(),
      updateBufferHealth: jest.fn(),
      onQualityChange: jest.fn(),
      onNetworkUpdate: jest.fn(),
      getStreamingState: jest.fn().mockReturnValue({
        currentQuality: "high",
        networkMetrics: { bandwidth: 1000, stability: 0.8 }
      }),
      destroy: jest.fn()
    };

    // Setup mock constructors
    GaplessEngine.mockImplementation(() => mockGaplessEngine);
    CrossfadeEngine.mockImplementation(() => mockCrossfadeEngine);
    AdaptiveEngine.mockImplementation(() => mockAdaptiveEngine);

    engine = new ProductionMseEngine(mockAudioElement);
  });

  afterEach(() => {
    if (engine) {
      engine.destroy();
    }
  });

  describe("Initialization", () => {
    it("should initialize with valid audio element", () => {
      expect(engine.audio).toBe(mockAudioElement);
      expect(GaplessEngine).toHaveBeenCalledWith(mockAudioElement);
      expect(CrossfadeEngine).toHaveBeenCalled();
      expect(AdaptiveEngine).toHaveBeenCalled();
    });

    it("should throw error with invalid audio element", () => {
      expect(() => new ProductionMseEngine(null)).toThrow(
        "ProductionMseEngine requires an HTMLAudioElement",
      );
    });

    it("should initialize with default configuration", () => {
      expect(engine.config).toMatchObject({
        enableGapless: true,
        enableCrossfade: true,
        enableAdaptive: true,
        frameAccurateSeeking: true,
        preloadNextTrack: true,
        analyticsEnabled: true
      });
    });

    it("should set up event listeners between engines", () => {
      expect(mockGaplessEngine.onBufferUpdate).toHaveBeenCalled();
      expect(mockGaplessEngine.onGaplessReady).toHaveBeenCalled();
      expect(mockCrossfadeEngine.onCrossfadeStart).toHaveBeenCalled();
      expect(mockCrossfadeEngine.onCrossfadeComplete).toHaveBeenCalled();
      expect(mockCrossfadeEngine.onBeatDetected).toHaveBeenCalled();
      expect(mockAdaptiveEngine.onQualityChange).toHaveBeenCalled();
      expect(mockAdaptiveEngine.onNetworkUpdate).toHaveBeenCalled();
    });
  });

  describe("Track Loading", () => {
    const mockTrack = {
      id: "test-track",
      title: "Test Track",
      artist: "Test Artist",
      fileName: "test.mp3"
    };

    it("should load track with enhanced features", async () => {
      await engine.load(mockTrack);

      expect(mockGaplessEngine.load).toHaveBeenCalledWith(mockTrack, null);
      expect(engine.state.currentTrack).toBe(mockTrack);
      expect(engine.analytics.tracksPlayed).toBe(1);
    });

    it("should load track with next track for gapless", async () => {
      const nextTrack = { id: "next", title: "Next Track" };
      const options = { nextTrack, preload: true };

      await engine.load(mockTrack, options);

      expect(mockGaplessEngine.load).toHaveBeenCalledWith(mockTrack, nextTrack);
      expect(engine.state.nextTrack).toBe(nextTrack);
    });

    it("should set quality when specified", async () => {
      const options = { quality: "ultra" };

      await engine.load(mockTrack, options);

      expect(mockAdaptiveEngine.setUserPreferredQuality).toHaveBeenCalledWith(
        "ultra",
      );
    });

    it("should analyze track for crossfade when enabled", async () => {
      const options = { crossfade: true };

      await engine.load(mockTrack, options);

      expect(mockCrossfadeEngine.analyzeTrack).toHaveBeenCalledWith(
        mockAudioElement,
        "current",
      );
    });

    it("should handle load errors gracefully", async () => {
      mockGaplessEngine.load.mockRejectedValue(new Error("Load failed"));

      await expect(engine.load(mockTrack)).rejects.toThrow("Load failed");
      expect(engine.analytics.errors.length).toBe(1);
    });
  });

  describe("Playback Control", () => {
    beforeEach(async () => {
      await engine.load({ id: "test", title: "Test Track" });
    });

    it("should play track", async () => {
      await engine.play();

      expect(mockGaplessEngine.play).toHaveBeenCalled();
    });

    it("should pause track", () => {
      engine.pause();

      expect(mockGaplessEngine.pause).toHaveBeenCalled();
    });

    it("should handle play errors", async () => {
      mockGaplessEngine.play.mockRejectedValue(new Error("Play failed"));

      await expect(engine.play()).rejects.toThrow("Play failed");
      expect(engine.analytics.errors.length).toBe(1);
    });
  });

  describe("Enhanced Seeking", () => {
    beforeEach(async () => {
      await engine.load({ id: "test", title: "Test Track" });
    });

    it("should perform frame-accurate seeking", async () => {
      const targetTime = 30.5;

      await engine.seek(targetTime, "frame");

      expect(mockGaplessEngine.seek).toHaveBeenCalled();
      expect(engine.analytics.seekEvents).toBe(1);
    });

    it("should perform second-accurate seeking", async () => {
      const targetTime = 30.567;

      await engine.seek(targetTime, "second");

      expect(mockGaplessEngine.seek).toHaveBeenCalledWith(30.5); // Rounded to 100ms
    });

    it("should perform rough seeking by default", async () => {
      const targetTime = 30;

      await engine.seek(targetTime);

      expect(mockGaplessEngine.seek).toHaveBeenCalledWith(targetTime);
    });

    it("should handle seek errors", async () => {
      mockGaplessEngine.seek.mockRejectedValue(new Error("Seek failed"));

      await expect(engine.seek(30)).rejects.toThrow("Seek failed");
      expect(engine.analytics.errors.length).toBe(1);
    });
  });

  describe("Volume Control", () => {
    it("should set volume through gapless engine when not crossfading", () => {
      engine.setVolume(0.5);

      expect(mockGaplessEngine.setVolume).toHaveBeenCalledWith(0.5);
    });

    it("should set volume through crossfade engine when crossfading", () => {
      engine.state.crossfadeActive = true;

      engine.setVolume(0.7);

      expect(mockCrossfadeEngine.setVolume).toHaveBeenCalledWith(0.7);
    });

    it("should clamp volume to valid range", () => {
      engine.setVolume(-0.5);
      expect(mockGaplessEngine.setVolume).toHaveBeenCalledWith(0);

      engine.setVolume(1.5);
      expect(mockGaplessEngine.setVolume).toHaveBeenCalledWith(1);
    });
  });

  describe("Crossfade Management", () => {
    beforeEach(async () => {
      const track = { id: "current", title: "Current Track" };
      const nextTrack = { id: "next", title: "Next Track" };
      await engine.load(track, { nextTrack });
    });

    it("should start crossfade with default options", async () => {
      await engine.startCrossfade();

      expect(mockCrossfadeEngine.startCrossfade).toHaveBeenCalledWith({
        duration: 8,
        curve: "smooth",
        beatSync: true
      });
    });

    it("should start crossfade with custom options", async () => {
      const options = {
        duration: 12,
        curve: "linear",
        beatSync: false
      };

      await engine.startCrossfade(options);

      expect(mockCrossfadeEngine.startCrossfade).toHaveBeenCalledWith({
        duration: 12,
        curve: "linear",
        beatSync: false
      });
    });

    it("should throw error when crossfade not available", async () => {
      engine.state.nextTrack = null;

      await expect(engine.startCrossfade()).rejects.toThrow(
        "Crossfade not available",
      );
    });

    it("should handle crossfade completion", () => {
      const originalTrack = engine.state.currentTrack;
      const nextTrack = engine.state.nextTrack;

      // Simulate crossfade completion
      const onCompleteCallback =
        mockCrossfadeEngine.onCrossfadeComplete.mock.calls[0][0];
      onCompleteCallback();

      expect(engine.state.crossfadeActive).toBe(false);
    });
  });

  describe("Configuration Management", () => {
    it("should update engine configuration", () => {
      const newConfig = {
        enableCrossfade: false,
        crossfadeDuration: 12,
        enableAdaptive: false
      };

      engine.setConfig(newConfig);

      expect(engine.config.enableCrossfade).toBe(false);
      expect(engine.config.crossfadeDuration).toBe(12);
      expect(engine.config.enableAdaptive).toBe(false);

      expect(mockAdaptiveEngine.setAdaptiveStreaming).toHaveBeenCalledWith(
        false,
      );
      expect(mockCrossfadeEngine.setConfig).toHaveBeenCalledWith({
        crossfadeDuration: 12
      });
    });

    it("should set quality preference", () => {
      engine.setQuality("medium");

      expect(mockAdaptiveEngine.setUserPreferredQuality).toHaveBeenCalledWith(
        "medium",
      );
    });

    it("should enable/disable adaptive streaming", () => {
      engine.setAdaptiveStreaming(false);

      expect(engine.config.enableAdaptive).toBe(false);
      expect(mockAdaptiveEngine.setAdaptiveStreaming).toHaveBeenCalledWith(
        false,
      );
    });
  });

  describe("Queue Management", () => {
    it("should queue next track", () => {
      const track = { id: "queued", title: "Queued Track" };

      engine.queueNextTrack(track);

      expect(engine.state.queuedTracks).toContain(track);
      expect(engine.state.nextTrack).toBe(track);
    });

    it("should add to queue when next track already exists", () => {
      engine.state.nextTrack = { id: "existing", title: "Existing Next" };
      const track = { id: "queued", title: "Queued Track" };

      engine.queueNextTrack(track);

      expect(engine.state.queuedTracks).toContain(track);
      expect(engine.state.nextTrack).not.toBe(track);
    });

    it("should clear queue", () => {
      engine.state.queuedTracks = [{ id: "1" }, { id: "2" }];
      engine.state.nextTrack = { id: "next" };

      engine.clearQueue();

      expect(engine.state.queuedTracks).toEqual([]);
      expect(engine.state.nextTrack).toBeNull();
    });
  });

  describe("Engine Status", () => {
    it("should return comprehensive engine status", () => {
      const status = engine.getEngineStatus();

      expect(status).toMatchObject({
        isInitialized: expect.any(Boolean),
        currentTrack: engine.state.currentTrack,
        nextTrack: engine.state.nextTrack,
        playbackMode: engine.state.playbackMode,
        crossfadeActive: engine.state.crossfadeActive,
        bufferStatus: expect.any(Object),
        streamingState: expect.any(Object),
        audioAnalysis: expect.any(Object),
        analytics: expect.any(Object),
        performance: expect.any(Object),
        config: expect.any(Object)
      });
    });
  });

  describe("Event Handling", () => {
    it("should wrap time update events with analytics", () => {
      const callback = jest.fn();

      engine.onTimeUpdate(callback);

      expect(mockGaplessEngine.onTimeUpdate).toHaveBeenCalled();

      // Simulate time update
      const wrappedCallback = mockGaplessEngine.onTimeUpdate.mock.calls[0][0];
      wrappedCallback(42);

      expect(callback).toHaveBeenCalledWith(42);
    });

    it("should wrap ended events with analytics", () => {
      const callback = jest.fn();

      engine.onEnded(callback);

      expect(mockGaplessEngine.onEnded).toHaveBeenCalled();

      // Simulate ended event
      const wrappedCallback = mockGaplessEngine.onEnded.mock.calls[0][0];
      wrappedCallback();

      expect(callback).toHaveBeenCalled();
    });

    it("should register custom event handlers", () => {
      const handlers = {
        onTrackChange: jest.fn(),
        onCrossfadeStart: jest.fn(),
        onQualityChange: jest.fn(),
        onError: jest.fn()
      };

      engine.onTrackChange(handlers.onTrackChange);
      engine.onCrossfadeStart(handlers.onCrossfadeStart);
      engine.onQualityChange(handlers.onQualityChange);
      engine.onError(handlers.onError);

      expect(engine.eventHandlers.onTrackChange).toBe(handlers.onTrackChange);
      expect(engine.eventHandlers.onCrossfadeStart).toBe(
        handlers.onCrossfadeStart,
      );
      expect(engine.eventHandlers.onQualityChange).toBe(
        handlers.onQualityChange,
      );
      expect(engine.eventHandlers.onError).toBe(handlers.onError);
    });
  });

  describe("Analytics and Monitoring", () => {
    it("should track play analytics", async () => {
      await engine.load({ id: "test", title: "Test" });
      await engine.play();

      expect(engine.analytics.lastPlayStart).toBeDefined();
    });

    it("should track pause analytics", () => {
      engine.analytics.lastPlayStart = Date.now() - 1000;

      engine.pause();

      expect(engine.analytics.totalPlaytime).toBeGreaterThan(0);
    });

    it("should track seek analytics", async () => {
      await engine.load({ id: "test", title: "Test" });
      await engine.seek(30);

      expect(engine.analytics.seekEvents).toBe(1);
      expect(engine.analytics.lastSeekTime).toBe(30);
    });

    it("should track error analytics", () => {
      const error = new Error("Test error");
      const context = { track: "test-track" };

      engine._handleError("test_error", error, context);

      expect(engine.analytics.errors).toHaveLength(1);
      expect(engine.analytics.errors[0]).toMatchObject({
        type: "test_error",
        message: "Test error",
        context,
        timestamp: expect.any(Number)
      });
    });

    it("should limit error history size", () => {
      // Add more than 50 errors
      for (let i = 0; i < 55; i++) {
        engine._handleError("test_error", new Error(`Error ${i}`));
      }

      expect(engine.analytics.errors).toHaveLength(50);
    });
  });

  describe("Network Quality Adaptation", () => {
    it("should adjust buffer strategy based on network quality", () => {
      const networkInfo = { stability: 0.3, bandwidth: 200 };
      const originalBufferAhead = mockGaplessEngine.config.bufferAhead;

      // Simulate network update
      const onNetworkUpdate =
        mockAdaptiveEngine.onNetworkUpdate.mock.calls[0][0];
      onNetworkUpdate(networkInfo);

      // Should increase buffer for unstable network
      expect(mockGaplessEngine.config.bufferAhead).toBeGreaterThan(
        originalBufferAhead,
      );
    });

    it("should reduce buffer for stable networks", () => {
      mockGaplessEngine.config.bufferAhead = 20; // High buffer
      const networkInfo = { stability: 0.9, bandwidth: 2000 };

      // Simulate network update
      const onNetworkUpdate =
        mockAdaptiveEngine.onNetworkUpdate.mock.calls[0][0];
      onNetworkUpdate(networkInfo);

      // Should reduce buffer for stable network
      expect(mockGaplessEngine.config.bufferAhead).toBeLessThan(20);
    });
  });

  describe("Beat Detection Integration", () => {
    it("should handle beat detection for intelligent crossfade timing", async () => {
      await engine.load({ id: "current", title: "Current" });
      engine.state.nextTrack = { id: "next", title: "Next" };
      mockAudioElement.duration = 180;
      mockAudioElement.currentTime = 170; // Near end

      const beatInfo = { bpm: 128, confidence: 0.8 };

      // Simulate beat detection
      const onBeatDetected =
        mockCrossfadeEngine.onBeatDetected.mock.calls[0][0];
      onBeatDetected(beatInfo);

      // Should consider starting crossfade
      // (Actual implementation would use setTimeout, so we'd need to mock timers for full testing)
    });

    it("should ignore beat detection when conditions not met", async () => {
      await engine.load({ id: "current", title: "Current" });
      engine.state.nextTrack = null; // No next track

      const beatInfo = { bpm: 128, confidence: 0.8 };

      // Should not throw or start crossfade
      const onBeatDetected =
        mockCrossfadeEngine.onBeatDetected.mock.calls[0][0];
      expect(() => onBeatDetected(beatInfo)).not.toThrow();
    });
  });

  describe("Resource Cleanup", () => {
    it("should cleanup all resources on destroy", () => {
      engine.destroy();

      expect(mockGaplessEngine._cleanup).toHaveBeenCalled();
      expect(mockCrossfadeEngine.destroy).toHaveBeenCalled();
      expect(mockAdaptiveEngine.destroy).toHaveBeenCalled();
      expect(engine.state.isInitialized).toBe(false);
    });

    it("should clear event handlers on destroy", () => {
      engine.eventHandlers.onTrackChange = jest.fn();
      engine.eventHandlers.onError = jest.fn();

      engine.destroy();

      expect(
        Object.values(engine.eventHandlers).every(
          (handler) => handler === null,
        ),
      ).toBe(true);
    });
  });

  describe("Error Recovery", () => {
    it("should emit error events", () => {
      const onError = jest.fn();
      engine.onError(onError);

      const error = new Error("Test error");
      engine._handleError("test_error", error);

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "test_error",
          message: "Test error"
        }),
      );
    });

    it("should handle event handler errors gracefully", () => {
      const errorHandler = jest.fn().mockImplementation(() => {
        throw new Error("Handler error");
      });

      engine.onTrackChange(errorHandler);

      // Should not throw when emitting event
      expect(() => engine._emitEvent("onTrackChange", {})).not.toThrow();
    });
  });
});
