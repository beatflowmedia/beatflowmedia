/**
 * CrossfadeEngine - Advanced Web Audio API-based crossfading system
 * Provides production-grade smooth transitions between tracks with intelligent
 * beat-matching, tempo analysis, and customizable crossfade curves.
 */
export default class CrossfadeEngine {
  constructor() {
    // Web Audio API context
    this.audioContext = null;
    this.analyser = null;

    // Crossfade configuration
    this.config = {
      crossfadeDuration: 8, // Default crossfade duration in seconds
      minCrossfadeDuration: 2, // Minimum crossfade duration
      maxCrossfadeDuration: 15, // Maximum crossfade duration
      beatMatchingEnabled: true, // Enable beat-matching analysis
      autoEQEnabled: true, // Enable automatic EQ matching
      crossfadeCurve: "smooth", // linear, smooth, logarithmic, exponential
      preAnalysisTime: 30, // Seconds to analyze for beat detection
    };

    // Audio nodes
    this.nodes = {
      currentTrackGain: null,
      nextTrackGain: null,
      masterGain: null,
      analyserNode: null,
      compressor: null,
      eq: {
        lowShelf: null,
        midPeaking: null,
        highShelf: null
      }
    };

    // Track analysis data
    this.trackAnalysis = {
      current: null,
      next: null
    };

    // Crossfade state
    this.crossfadeState = {
      isActive: false,
      startTime: 0,
      duration: 0,
      curve: null,
      beatSyncOffset: 0
    };

    // Audio analysis buffers
    this.analysisBuffers = {
      frequencyData: null,
      timeDomainData: null,
      bufferLength: 0
    };

    // Event callbacks
    this.callbacks = {
      onCrossfadeStart: null,
      onCrossfadeProgress: null,
      onCrossfadeComplete: null,
      onBeatDetected: null,
      onTempoAnalyzed: null
    };

    // Beat detection
    this.beatDetection = {
      enabled: false,
      bpm: 120,
      lastBeatTime: 0,
      beatHistory: [],
      confidenceScore: 0
    };

    // Performance monitoring
    this.metrics = {
      crossfadeQuality: 1.0,
      cpuUsage: 0,
      latency: 0
    };

    this._initializeAudioContext();
  }

  /**
   * Initialize Web Audio API context and create audio graph
   */
  async _initializeAudioContext() {
    try {
      // Create audio context with optimal settings
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)({
        sampleRate: 48000,
        latencyHint: "interactive"
      });

      // Resume context if suspended (required by many browsers)
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      this._createAudioGraph();
    } catch (error) {
      console.error("Failed to initialize CrossfadeEngine:", error);
      throw error;
    }
  }

  /**
   * Create the complete audio processing graph
   */
  _createAudioGraph() {
    // Master gain (output)
    this.nodes.masterGain = this.audioContext.createGain();
    this.nodes.masterGain.connect(this.audioContext.destination);

    // Compressor for consistent levels
    this.nodes.compressor = this.audioContext.createDynamicsCompressor();
    this.nodes.compressor.threshold.setValueAtTime(
      -24,
      this.audioContext.currentTime,
    );
    this.nodes.compressor.knee.setValueAtTime(
      30,
      this.audioContext.currentTime,
    );
    this.nodes.compressor.ratio.setValueAtTime(
      3,
      this.audioContext.currentTime,
    );
    this.nodes.compressor.attack.setValueAtTime(
      0.003,
      this.audioContext.currentTime,
    );
    this.nodes.compressor.release.setValueAtTime(
      0.25,
      this.audioContext.currentTime,
    );
    this.nodes.compressor.connect(this.nodes.masterGain);

    // EQ section
    this._createEQNodes();

    // Track gain nodes
    this.nodes.currentTrackGain = this.audioContext.createGain();
    this.nodes.nextTrackGain = this.audioContext.createGain();
    this.nodes.nextTrackGain.gain.setValueAtTime(
      0,
      this.audioContext.currentTime,
    );

    // Connect track gains through EQ to compressor
    this.nodes.currentTrackGain.connect(this.nodes.eq.lowShelf);
    this.nodes.nextTrackGain.connect(this.nodes.eq.lowShelf);

    // Analyser for real-time audio analysis
    this.nodes.analyserNode = this.audioContext.createAnalyser();
    this.nodes.analyserNode.fftSize = 2048;
    this.nodes.analyserNode.smoothingTimeConstant = 0.8;
    this.nodes.currentTrackGain.connect(this.nodes.analyserNode);

    // Initialize analysis buffers
    this.analysisBuffers.bufferLength =
      this.nodes.analyserNode.frequencyBinCount;
    this.analysisBuffers.frequencyData = new Uint8Array(
      this.analysisBuffers.bufferLength,
    );
    this.analysisBuffers.timeDomainData = new Uint8Array(
      this.analysisBuffers.bufferLength,
    );
  }

  /**
   * Create EQ nodes for audio matching
   */
  _createEQNodes() {
    // Low shelf filter (bass)
    this.nodes.eq.lowShelf = this.audioContext.createBiquadFilter();
    this.nodes.eq.lowShelf.type = "lowshelf";
    this.nodes.eq.lowShelf.frequency.setValueAtTime(
      320,
      this.audioContext.currentTime,
    );
    this.nodes.eq.lowShelf.gain.setValueAtTime(
      0,
      this.audioContext.currentTime,
    );

    // Mid peaking filter
    this.nodes.eq.midPeaking = this.audioContext.createBiquadFilter();
    this.nodes.eq.midPeaking.type = "peaking";
    this.nodes.eq.midPeaking.frequency.setValueAtTime(
      1000,
      this.audioContext.currentTime,
    );
    this.nodes.eq.midPeaking.Q.setValueAtTime(1, this.audioContext.currentTime);
    this.nodes.eq.midPeaking.gain.setValueAtTime(
      0,
      this.audioContext.currentTime,
    );

    // High shelf filter (treble)
    this.nodes.eq.highShelf = this.audioContext.createBiquadFilter();
    this.nodes.eq.highShelf.type = "highshelf";
    this.nodes.eq.highShelf.frequency.setValueAtTime(
      3200,
      this.audioContext.currentTime,
    );
    this.nodes.eq.highShelf.gain.setValueAtTime(
      0,
      this.audioContext.currentTime,
    );

    // Connect EQ chain
    this.nodes.eq.lowShelf.connect(this.nodes.eq.midPeaking);
    this.nodes.eq.midPeaking.connect(this.nodes.eq.highShelf);
    this.nodes.eq.highShelf.connect(this.nodes.compressor);
  }

  /**
   * Connect an audio element to the crossfade engine
   */
  connectAudioElement(audioElement, trackPosition = "current") {
    if (!this.audioContext) {
      throw new Error("AudioContext not initialized");
    }

    try {
      // Create media element source
      const source = this.audioContext.createMediaElementSource(audioElement);

      // Connect to appropriate gain node
      if (trackPosition === "current") {
        source.connect(this.nodes.currentTrackGain);
      } else if (trackPosition === "next") {
        source.connect(this.nodes.nextTrackGain);
      }

      return source;
    } catch (error) {
      console.error("Failed to connect audio element:", error);
      throw error;
    }
  }

  /**
   * Analyze track for crossfade optimization
   */
  async analyzeTrack(audioElement, trackPosition = "current") {
    return new Promise((resolve) => {
      const analysis = {
        bpm: 0,
        key: null,
        energy: 0,
        spectralCentroid: 0,
        averageFrequencyData: new Array(this.analysisBuffers.bufferLength).fill(
          0,
        ),
        dynamicRange: 0,
        analyzedAt: Date.now()
      };

      // Start analysis
      const analysisDuration = Math.min(
        this.config.preAnalysisTime,
        audioElement.duration || 30,
      );
      const analysisStartTime = Math.max(
        0,
        (audioElement.duration || 30) - analysisDuration,
      );

      // Seek to analysis position
      audioElement.currentTime = analysisStartTime;

      const analysisInterval = setInterval(() => {
        this._updateAnalysis(analysis);

        // Complete analysis after duration
        if (audioElement.currentTime >= analysisStartTime + analysisDuration) {
          clearInterval(analysisInterval);
          this._finalizeTrackAnalysis(analysis);
          this.trackAnalysis[trackPosition] = analysis;
          resolve(analysis);
        }
      }, 100);

      // Timeout safety
      setTimeout(
        () => {
          clearInterval(analysisInterval);
          resolve(analysis);
        },
        (analysisDuration + 5) * 1000,
      );
    });
  }

  /**
   * Start crossfade between current and next track
   */
  async startCrossfade(options = {}) {
    if (this.crossfadeState.isActive) {
      console.warn("Crossfade already active");
      return;
    }

    const {
      duration = this.config.crossfadeDuration,
      curve = this.config.crossfadeCurve,
      beatSync = this.config.beatMatchingEnabled
    } = options;

    try {
      // Calculate optimal crossfade parameters
      const optimalDuration = this._calculateOptimalCrossfadeDuration(duration);
      const crossfadeCurve = this._generateCrossfadeCurve(
        curve,
        optimalDuration,
      );

      // Apply beat synchronization if enabled
      let startDelay = 0;
      if (beatSync && this.trackAnalysis.current && this.trackAnalysis.next) {
        startDelay = this._calculateBeatSyncDelay();
      }

      // Initialize crossfade state
      this.crossfadeState = {
        isActive: true,
        startTime: this.audioContext.currentTime + startDelay,
        duration: optimalDuration,
        curve: crossfadeCurve,
        beatSyncOffset: startDelay
      };

      // Start the crossfade
      await this._executeCrossfade();

      if (this.callbacks.onCrossfadeStart) {
        this.callbacks.onCrossfadeStart({
          duration: optimalDuration,
          curve,
          beatSyncOffset: startDelay
        });
      }
    } catch (error) {
      console.error("Crossfade start error:", error);
      this.crossfadeState.isActive = false;
      throw error;
    }
  }

  /**
   * Execute the crossfade automation
   */
  async _executeCrossfade() {
    const { startTime, duration, curve } = this.crossfadeState;
    const endTime = startTime + duration;

    // Apply EQ matching if enabled
    if (this.config.autoEQEnabled) {
      this._applyEQMatching();
    }

    // Create crossfade automation
    const currentGain = this.nodes.currentTrackGain.gain;
    const nextGain = this.nodes.nextTrackGain.gain;

    // Clear any existing automation
    currentGain.cancelScheduledValues(startTime);
    nextGain.cancelScheduledValues(startTime);

    // Apply crossfade curve
    for (let i = 0; i <= curve.length - 1; i++) {
      const time = startTime + (i / (curve.length - 1)) * duration;
      const currentLevel = curve[i].current;
      const nextLevel = curve[i].next;

      currentGain.linearRampToValueAtTime(currentLevel, time);
      nextGain.linearRampToValueAtTime(nextLevel, time);
    }

    // Monitor crossfade progress
    this._monitorCrossfadeProgress(startTime, endTime);
  }

  /**
   * Monitor crossfade progress and emit events
   */
  _monitorCrossfadeProgress(startTime, endTime) {
    const checkProgress = () => {
      const currentTime = this.audioContext.currentTime;

      if (currentTime >= endTime) {
        // Crossfade complete
        this.crossfadeState.isActive = false;

        if (this.callbacks.onCrossfadeComplete) {
          this.callbacks.onCrossfadeComplete();
        }
        return;
      }

      if (currentTime >= startTime) {
        // Calculate progress
        const progress = (currentTime - startTime) / (endTime - startTime);

        if (this.callbacks.onCrossfadeProgress) {
          this.callbacks.onCrossfadeProgress({
            progress: Math.min(1, progress),
            timeRemaining: Math.max(0, endTime - currentTime)
          });
        }
      }

      // Continue monitoring
      requestAnimationFrame(checkProgress);
    };

    requestAnimationFrame(checkProgress);
  }

  /**
   * Calculate optimal crossfade duration based on track analysis
   */
  _calculateOptimalCrossfadeDuration(requestedDuration) {
    let optimalDuration = requestedDuration;

    // Adjust based on BPM matching
    if (this.trackAnalysis.current && this.trackAnalysis.next) {
      const currentBPM = this.trackAnalysis.current.bpm;
      const nextBPM = this.trackAnalysis.next.bpm;

      if (currentBPM > 0 && nextBPM > 0) {
        // Calculate beat-aligned duration
        const avgBPM = (currentBPM + nextBPM) / 2;
        const beatDuration = 60 / avgBPM;
        const beatsInCrossfade = Math.round(requestedDuration / beatDuration);
        optimalDuration = beatsInCrossfade * beatDuration;
      }
    }

    return Math.max(
      this.config.minCrossfadeDuration,
      Math.min(this.config.maxCrossfadeDuration, optimalDuration),
    );
  }

  /**
   * Generate crossfade curve based on type
   */
  _generateCrossfadeCurve(curveType, duration) {
    const steps = Math.ceil(duration * 10); // 10 steps per second
    const curve = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps; // 0 to 1
      let currentLevel, nextLevel;

      switch (curveType) {
        case "linear":
          currentLevel = 1 - t;
          nextLevel = t;
          break;
        case "logarithmic":
          currentLevel =
            Math.log(1 + (Math.E - 1) * (1 - t)) / Math.log(Math.E);
          nextLevel = Math.log(1 + (Math.E - 1) * t) / Math.log(Math.E);
          break;
        case "exponential":
          currentLevel = Math.pow(1 - t, 2);
          nextLevel = Math.pow(t, 2);
          break;
        case "smooth":
        default:
          // Smooth S-curve using sine function
          const angle = (t * Math.PI) / 2;
          currentLevel = Math.cos(angle);
          nextLevel = Math.sin(angle);
          break;
      }

      curve.push({ current: currentLevel, next: nextLevel });
    }

    return curve;
  }

  /**
   * Calculate beat synchronization delay
   */
  _calculateBeatSyncDelay() {
    if (!this.trackAnalysis.current || !this.trackAnalysis.next) {
      return 0;
    }

    const currentBPM = this.trackAnalysis.current.bpm;
    const nextBPM = this.trackAnalysis.next.bpm;

    if (currentBPM <= 0 || nextBPM <= 0) {
      return 0;
    }

    // Calculate the next beat boundary
    const currentBeatDuration = 60 / currentBPM;
    const timeSinceLastBeat =
      (Date.now() - this.beatDetection.lastBeatTime) / 1000;
    const timeToNextBeat =
      currentBeatDuration - (timeSinceLastBeat % currentBeatDuration);

    return timeToNextBeat;
  }

  /**
   * Apply EQ matching between tracks
   */
  _applyEQMatching() {
    if (!this.trackAnalysis.current || !this.trackAnalysis.next) {
      return;
    }

    // Analyze frequency differences and apply compensating EQ
    const currentSpectrum = this.trackAnalysis.current.averageFrequencyData;
    const nextSpectrum = this.trackAnalysis.next.averageFrequencyData;

    // Calculate EQ adjustments (simplified)
    const bassRatio = this._calculateFrequencyRatio(
      currentSpectrum,
      nextSpectrum,
      0,
      10,
    );
    const midRatio = this._calculateFrequencyRatio(
      currentSpectrum,
      nextSpectrum,
      10,
      50,
    );
    const trebleRatio = this._calculateFrequencyRatio(
      currentSpectrum,
      nextSpectrum,
      50,
      100,
    );

    // Apply subtle EQ adjustments
    const currentTime = this.audioContext.currentTime;
    this.nodes.eq.lowShelf.gain.setValueAtTime(
      this._dbFromRatio(bassRatio),
      currentTime,
    );
    this.nodes.eq.midPeaking.gain.setValueAtTime(
      this._dbFromRatio(midRatio),
      currentTime,
    );
    this.nodes.eq.highShelf.gain.setValueAtTime(
      this._dbFromRatio(trebleRatio),
      currentTime,
    );
  }

  _calculateFrequencyRatio(spectrum1, spectrum2, startBin, endBin) {
    let sum1 = 0,
      sum2 = 0;
    for (let i = startBin; i < endBin && i < spectrum1.length; i++) {
      sum1 += spectrum1[i];
      sum2 += spectrum2[i];
    }
    return sum2 > 0 ? sum1 / sum2 : 1;
  }

  _dbFromRatio(ratio) {
    return Math.max(-6, Math.min(6, 20 * Math.log10(ratio)));
  }

  /**
   * Update real-time analysis
   */
  _updateAnalysis(analysis) {
    if (!this.nodes.analyserNode) return;

    // Get frequency and time domain data
    this.nodes.analyserNode.getByteFrequencyData(
      this.analysisBuffers.frequencyData,
    );
    this.nodes.analyserNode.getByteTimeDomainData(
      this.analysisBuffers.timeDomainData,
    );

    // Update analysis object
    this._updateFrequencyAnalysis(analysis);
    this._updateBeatDetection(analysis);
    this._updateEnergyAnalysis(analysis);
  }

  _updateFrequencyAnalysis(analysis) {
    const freqData = this.analysisBuffers.frequencyData;

    // Calculate spectral centroid
    let weightedSum = 0;
    let magnitudeSum = 0;

    for (let i = 0; i < freqData.length; i++) {
      const magnitude = freqData[i] / 255;
      weightedSum += i * magnitude;
      magnitudeSum += magnitude;
      analysis.averageFrequencyData[i] =
        (analysis.averageFrequencyData[i] + magnitude) / 2;
    }

    analysis.spectralCentroid =
      magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  _updateBeatDetection(analysis) {
    // Simplified beat detection based on energy in bass frequencies
    const bassEnergy = this.analysisBuffers.frequencyData
      .slice(0, 10)
      .reduce((sum, val) => sum + val, 0);
    const currentTime = Date.now();

    // Beat detection threshold
    if (bassEnergy > analysis.energy * 1.3) {
      const timeSinceLastBeat = currentTime - this.beatDetection.lastBeatTime;

      if (timeSinceLastBeat > 200) {
        // Minimum 200ms between beats
        this.beatDetection.lastBeatTime = currentTime;
        this.beatDetection.beatHistory.push(timeSinceLastBeat);

        // Keep only recent beats
        if (this.beatDetection.beatHistory.length > 8) {
          this.beatDetection.beatHistory.shift();
        }

        // Calculate BPM
        if (this.beatDetection.beatHistory.length >= 4) {
          const avgInterval =
            this.beatDetection.beatHistory.reduce((a, b) => a + b) /
            this.beatDetection.beatHistory.length;
          analysis.bpm = Math.round(60000 / avgInterval);
        }

        if (this.callbacks.onBeatDetected) {
          this.callbacks.onBeatDetected({
            bpm: analysis.bpm,
            confidence: this.beatDetection.confidenceScore
          });
        }
      }
    }

    analysis.energy = (analysis.energy + bassEnergy) / 2;
  }

  _updateEnergyAnalysis(analysis) {
    // Calculate RMS energy
    const timeData = this.analysisBuffers.timeDomainData;
    let sum = 0;

    for (let i = 0; i < timeData.length; i++) {
      const sample = (timeData[i] - 128) / 128;
      sum += sample * sample;
    }

    const rms = Math.sqrt(sum / timeData.length);
    analysis.energy = (analysis.energy + rms) / 2;
  }

  _finalizeTrackAnalysis(analysis) {
    // Calculate dynamic range
    analysis.dynamicRange = this._calculateDynamicRange();

    if (this.callbacks.onTempoAnalyzed) {
      this.callbacks.onTempoAnalyzed(analysis);
    }
  }

  _calculateDynamicRange() {
    // Simplified dynamic range calculation
    const freqData = this.analysisBuffers.frequencyData;
    const max = Math.max(...freqData);
    const avg = freqData.reduce((a, b) => a + b) / freqData.length;
    return max - avg;
  }

  /**
   * Set crossfade configuration
   */
  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current audio analysis data
   */
  getCurrentAnalysis() {
    if (!this.nodes.analyserNode) return null;

    this.nodes.analyserNode.getByteFrequencyData(
      this.analysisBuffers.frequencyData,
    );
    this.nodes.analyserNode.getByteTimeDomainData(
      this.analysisBuffers.timeDomainData,
    );

    return {
      frequencyData: Array.from(this.analysisBuffers.frequencyData),
      timeDomainData: Array.from(this.analysisBuffers.timeDomainData),
      bpm: this.beatDetection.bpm,
      energy:
        this.beatDetection.beatHistory.length > 0
          ? this.beatDetection.beatHistory[
              this.beatDetection.beatHistory.length - 1
            ]
          : 0
    };
  }

  /**
   * Set master volume
   */
  setVolume(volume) {
    if (this.nodes.masterGain) {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      this.nodes.masterGain.gain.setValueAtTime(
        clampedVolume,
        this.audioContext.currentTime,
      );
    }
  }

  /**
   * Stop any active crossfade
   */
  stopCrossfade() {
    if (!this.crossfadeState.isActive) return;

    // Reset gain values immediately
    const currentTime = this.audioContext.currentTime;
    this.nodes.currentTrackGain.gain.cancelScheduledValues(currentTime);
    this.nodes.nextTrackGain.gain.cancelScheduledValues(currentTime);
    this.nodes.currentTrackGain.gain.setValueAtTime(1, currentTime);
    this.nodes.nextTrackGain.gain.setValueAtTime(0, currentTime);

    this.crossfadeState.isActive = false;
  }

  // Event handler setters
  onCrossfadeStart(callback) {
    this.callbacks.onCrossfadeStart = callback;
  }

  onCrossfadeProgress(callback) {
    this.callbacks.onCrossfadeProgress = callback;
  }

  onCrossfadeComplete(callback) {
    this.callbacks.onCrossfadeComplete = callback;
  }

  onBeatDetected(callback) {
    this.callbacks.onBeatDetected = callback;
  }

  onTempoAnalyzed(callback) {
    this.callbacks.onTempoAnalyzed = callback;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stopCrossfade();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Clear callbacks
    Object.keys(this.callbacks).forEach((key) => {
      this.callbacks[key] = null;
    });
  }
}
