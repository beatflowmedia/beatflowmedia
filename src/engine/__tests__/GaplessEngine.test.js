import GaplessEngine from "../GaplessEngine";

// Mock Web APIs
const mockMediaSource = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  addSourceBuffer: jest.fn(),
  endOfStream: jest.fn(),
  readyState: "open"
};

const mockSourceBuffer = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  appendBuffer: jest.fn(),
  remove: jest.fn(),
  updating: false,
  mode: "segments"
};

const mockAudioElement = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  load: jest.fn(),
  currentTime: 0,
  duration: 180,
  volume: 1,
  paused: false,
  buffered: {
    length: 1,
    start: () => 0,
    end: () => 10
  },
  src: ""
};

// Mock fetch
global.fetch = jest.fn();
global.MediaSource = jest.fn(() => mockMediaSource);
global.URL = {
  createObjectURL: jest.fn().mockReturnValue("blob:mock-url"),
  revokeObjectURL: jest.fn()
};

describe("GaplessEngine", () => {
  let engine;
  let audioElement;

  beforeEach(() => {
    jest.clearAllMocks();
    audioElement = { ...mockAudioElement };
    engine = new GaplessEngine(audioElement);

    // Setup default mocks
    mockMediaSource.addSourceBuffer.mockReturnValue(mockSourceBuffer);
    fetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
    });
  });

  afterEach(() => {
    if (engine) {
      engine._cleanup();
    }
  });

  describe("Constructor", () => {
    it("should initialize with valid audio element", () => {
      expect(engine.audio).toBe(audioElement);
      expect(engine.config.segmentDuration).toBe(2);
      expect(engine.config.bufferAhead).toBe(10);
    });

    it("should throw error with invalid audio element", () => {
      expect(() => new GaplessEngine(null)).toThrow(
        "GaplessEngine requires an HTMLAudioElement",
      );
      expect(() => new GaplessEngine({})).toThrow(
        "GaplessEngine requires an HTMLAudioElement",
      );
    });

    it("should initialize with default configuration", () => {
      expect(engine.config).toMatchObject({
        segmentDuration: 2,
        bufferAhead: 10,
        preloadBuffer: 15,
        maxBuffer: 30,
        lowWaterMark: 3,
        highWaterMark: 25,
        gaplessPreloadTime: 5,
        adaptiveThreshold: 0.5
      });
    });
  });

  describe("Track Loading", () => {
    const mockTrack = {
      id: "test-track",
      title: "Test Track",
      fileName: "test.mp3",
      streamUrl: "/stream/test"
    };

    it("should load track successfully", async () => {
      // Mock MediaSource sourceopen event
      const sourceOpenCallback =
        mockMediaSource.addEventListener.mock.calls.find(
          (call) => call[0] === "sourceopen",
        )?.[1];

      const loadPromise = engine.load(mockTrack);

      // Simulate sourceopen event
      if (sourceOpenCallback) {
        await sourceOpenCallback();
      }

      await expect(loadPromise).resolves.toBeUndefined();
      expect(engine.currentTrack).toBe(mockTrack);
      expect(mockMediaSource.addSourceBuffer).toHaveBeenCalled();
    });

    it("should load track with next track for gapless preparation", async () => {
      const nextTrack = { id: "next-track", title: "Next Track" };

      const sourceOpenCallback =
        mockMediaSource.addEventListener.mock.calls.find(
          (call) => call[0] === "sourceopen",
        )?.[1];

      const loadPromise = engine.load(mockTrack, nextTrack);

      if (sourceOpenCallback) {
        await sourceOpenCallback();
      }

      await expect(loadPromise).resolves.toBeUndefined();
      expect(engine.currentTrack).toBe(mockTrack);
      expect(engine.nextTrack).toBe(nextTrack);
    });

    it("should handle load timeout", async () => {
      jest.useFakeTimers();

      const loadPromise = engine.load(mockTrack);

      // Fast-forward past timeout
      jest.advanceTimersByTime(10000);

      await expect(loadPromise).rejects.toThrow("Track load timeout");

      jest.useRealTimers();
    });

    it("should cleanup previous MediaSource before loading new track", async () => {
      // Load first track
      const sourceOpenCallback =
        mockMediaSource.addEventListener.mock.calls.find(
          (call) => call[0] === "sourceopen",
        )?.[1];

      await engine.load(mockTrack);
      if (sourceOpenCallback) {
        await sourceOpenCallback();
      }

      expect(global.URL.revokeObjectURL).not.toHaveBeenCalled();

      // Load second track
      const secondTrack = { id: "second-track", title: "Second Track" };
      await engine.load(secondTrack);

      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe("Playback Control", () => {
    beforeEach(async () => {
      const mockTrack = { id: "test", title: "Test" };
      await engine.load(mockTrack);
    });

    it("should start playback", async () => {
      await engine.play();
      expect(audioElement.play).toHaveBeenCalled();
    });

    it("should pause playback", () => {
      engine.pause();
      expect(audioElement.pause).toHaveBeenCalled();
    });

    it("should set volume within valid range", () => {
      engine.setVolume(0.5);
      expect(audioElement.volume).toBe(0.5);

      engine.setVolume(-0.1);
      expect(audioElement.volume).toBe(0);

      engine.setVolume(1.5);
      expect(audioElement.volume).toBe(1);
    });
  });

  describe("Buffer Management", () => {
    beforeEach(async () => {
      const mockTrack = { id: "test", title: "Test" };
      const sourceOpenCallback =
        mockMediaSource.addEventListener.mock.calls.find(
          (call) => call[0] === "sourceopen",
        )?.[1];

      await engine.load(mockTrack);
      if (sourceOpenCallback) {
        await sourceOpenCallback();
      }
    });

    it("should calculate buffered ahead correctly", () => {
      audioElement.currentTime = 5;
      audioElement.buffered = {
        length: 1,
        start: () => 0,
        end: () => 15
      };

      const bufferedAhead = engine._getBufferedAhead(5);
      expect(bufferedAhead).toBe(10);
    });

    it("should return 0 when current time not in buffered range", () => {
      audioElement.currentTime = 20;
      audioElement.buffered = {
        length: 1,
        start: () => 0,
        end: () => 15
      };

      const bufferedAhead = engine._getBufferedAhead(20);
      expect(bufferedAhead).toBe(0);
    });

    it("should calculate target buffer based on network quality", () => {
      engine.bufferState.networkQuality = 0.5;
      const targetBuffer = engine._calculateTargetBuffer();
      expect(targetBuffer).toBe(5); // baseBuffer (10) * quality (0.5)
    });

    it("should respect minimum target buffer", () => {
      engine.bufferState.networkQuality = 0.1;
      const targetBuffer = engine._calculateTargetBuffer();
      expect(targetBuffer).toBe(engine.config.lowWaterMark);
    });
  });

  describe("Seeking", () => {
    beforeEach(async () => {
      const mockTrack = { id: "test", title: "Test" };
      await engine.load(mockTrack);
    });

    it("should seek to specified time", async () => {
      const targetTime = 30;
      await engine.seek(targetTime);
      expect(audioElement.currentTime).toBe(targetTime);
    });

    it("should update segment index on seek", async () => {
      const targetTime = 30;
      await engine.seek(targetTime);

      const expectedSegmentIndex = Math.floor(
        targetTime / engine.config.segmentDuration,
      );
      expect(engine.bufferState.segmentIndex).toBe(expectedSegmentIndex);
    });

    it("should clear buffers around seek time", async () => {
      mockSourceBuffer.updating = false;
      audioElement.buffered = {
        length: 1,
        start: () => 0,
        end: () => 60
      };

      await engine.seek(30);
      expect(mockSourceBuffer.remove).toHaveBeenCalled();
    });
  });

  describe("Gapless Transition", () => {
    beforeEach(async () => {
      const mockTrack = { id: "test", title: "Test" };
      await engine.load(mockTrack);
    });

    it("should prepare gapless transition when time conditions met", async () => {
      const nextTrack = { id: "next", title: "Next Track" };
      audioElement.currentTime = 175; // Near end of 180s track
      audioElement.duration = 180;

      await engine.prepareGaplessTransition(nextTrack);
      expect(engine.nextTrack).toBe(nextTrack);
    });

    it("should not prepare gapless transition when too far from end", async () => {
      const nextTrack = { id: "next", title: "Next Track" };
      audioElement.currentTime = 60; // Far from end
      audioElement.duration = 180;

      await engine.prepareGaplessTransition(nextTrack);
      expect(engine.bufferState.isPreloading).toBe(false);
    });

    it("should execute gapless transition when ready", async () => {
      const nextTrack = { id: "next", title: "Next Track" };
      engine.nextTrack = nextTrack;
      engine.bufferState.nextTrackReady = true;

      const loadSpy = jest.spyOn(engine, "load").mockResolvedValue();
      const playSpy = jest.spyOn(engine, "play").mockResolvedValue();

      await engine.executeGaplessTransition();

      expect(loadSpy).toHaveBeenCalledWith(nextTrack);
      expect(playSpy).toHaveBeenCalled();
      expect(engine.bufferState.gaplessTransitionPending).toBe(false);
    });

    it("should throw error when gapless transition not ready", async () => {
      engine.nextTrack = null;
      await expect(engine.executeGaplessTransition()).rejects.toThrow(
        "Next track not ready for gapless transition",
      );
    });
  });

  describe("Network Metrics", () => {
    it("should update network metrics after segment load", async () => {
      const initialTime = Date.now();
      const bytes = 1024;
      const timeMs = 100;

      engine._updateNetworkMetrics(bytes, timeMs);

      expect(engine.metrics.downloadSpeedKbps).toBeGreaterThan(0);
      expect(engine.bufferState.networkQuality).toBeGreaterThan(0);
    });

    it("should calculate network quality based on speed", () => {
      // High speed should result in high quality
      engine._updateNetworkMetrics(1024 * 1024, 100); // 1MB in 100ms = high speed
      expect(engine.bufferState.networkQuality).toBeCloseTo(1.0, 1);

      // Low speed should result in lower quality
      engine._updateNetworkMetrics(1024, 1000); // 1KB in 1000ms = low speed
      expect(engine.bufferState.networkQuality).toBeLessThan(0.1);
    });

    it("should keep limited number of measurements", () => {
      // Add more measurements than the window size
      for (let i = 0; i < 15; i++) {
        engine._updateNetworkMetrics(1024, 100);
      }

      expect(engine.networkMonitor.downloadTimes.length).toBeLessThanOrEqual(
        engine.networkMonitor.measurementWindow,
      );
    });
  });

  describe("Buffer Status", () => {
    beforeEach(async () => {
      const mockTrack = { id: "test", title: "Test" };
      await engine.load(mockTrack);
    });

    it("should return comprehensive buffer status", () => {
      audioElement.currentTime = 10;
      audioElement.buffered = {
        length: 1,
        start: () => 5,
        end: () => 20
      };

      const status = engine.getBufferStatus();

      expect(status).toMatchObject({
        bufferedAhead: expect.any(Number),
        bufferedBehind: expect.any(Number),
        totalBuffered: expect.any(Number),
        bufferHealth: expect.any(Number),
        networkQuality: expect.any(Number),
        isPreloading: expect.any(Boolean),
        nextTrackReady: expect.any(Boolean),
        qualityLevel: expect.any(String)
      });
    });

    it("should calculate buffered behind correctly", () => {
      audioElement.currentTime = 15;
      audioElement.buffered = {
        length: 2,
        start: (i) => (i === 0 ? 0 : 10),
        end: (i) => (i === 0 ? 5 : 20)
      };

      const status = engine.getBufferStatus();
      expect(status.bufferedBehind).toBe(5); // First range: 0-5
    });
  });

  describe("Event Handling", () => {
    it("should register time update callback", () => {
      const callback = jest.fn();
      const unsubscribe = engine.onTimeUpdate(callback);

      expect(audioElement.addEventListener).toHaveBeenCalledWith(
        "timeupdate",
        expect.any(Function),
      );
      expect(typeof unsubscribe).toBe("function");
    });

    it("should call time update callback with current time", () => {
      const callback = jest.fn();
      audioElement.currentTime = 42;

      const unsubscribe = engine.onTimeUpdate(callback);

      // Simulate timeupdate event
      const eventHandler = audioElement.addEventListener.mock.calls.find(
        (call) => call[0] === "timeupdate",
      )?.[1];

      if (eventHandler) {
        eventHandler();
        expect(callback).toHaveBeenCalledWith(42);
      }
    });

    it("should unsubscribe event listeners", () => {
      const callback = jest.fn();
      const unsubscribe = engine.onTimeUpdate(callback);

      unsubscribe();
      expect(audioElement.removeEventListener).toHaveBeenCalledWith(
        "timeupdate",
        expect.any(Function),
      );
    });

    it("should handle ended event with gapless transition", () => {
      const callback = jest.fn();
      engine.bufferState.nextTrackReady = true;
      engine.nextTrack = { id: "next", title: "Next" };

      const executeGaplessTransitionSpy = jest
        .spyOn(engine, "executeGaplessTransition")
        .mockResolvedValue();

      const unsubscribe = engine.onEnded(callback);

      const eventHandler = audioElement.addEventListener.mock.calls.find(
        (call) => call[0] === "ended",
      )?.[1];

      if (eventHandler) {
        eventHandler();
        expect(executeGaplessTransitionSpy).toHaveBeenCalled();
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle fetch errors gracefully", async () => {
      fetch.mockRejectedValueOnce(new Error("Network error"));

      const mockTrack = { id: "test", title: "Test" };

      await expect(engine.load(mockTrack)).rejects.toThrow();
    });

    it("should handle source buffer errors", async () => {
      const mockTrack = { id: "test", title: "Test" };
      mockSourceBuffer.appendBuffer.mockImplementation(() => {
        throw new Error("SourceBuffer error");
      });

      const sourceOpenCallback =
        mockMediaSource.addEventListener.mock.calls.find(
          (call) => call[0] === "sourceopen",
        )?.[1];

      const loadPromise = engine.load(mockTrack);

      if (sourceOpenCallback) {
        await expect(sourceOpenCallback()).rejects.toThrow();
      }
    });
  });

  describe("Cleanup", () => {
    it("should cleanup resources properly", async () => {
      const mockTrack = { id: "test", title: "Test" };
      await engine.load(mockTrack);

      await engine._cleanup();

      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
      expect(engine.mediaSource).toBeNull();
      expect(engine.sourceBuffer).toBeNull();
    });

    it("should handle cleanup errors gracefully", async () => {
      mockMediaSource.endOfStream.mockImplementation(() => {
        throw new Error("Cleanup error");
      });

      // Should not throw
      await expect(engine._cleanup()).resolves.toBeUndefined();
    });
  });
});
