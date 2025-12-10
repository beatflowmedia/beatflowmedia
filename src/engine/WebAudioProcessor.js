/**
 * WebAudioProcessor - Advanced Web Audio API integration
 * Provides real-time audio processing, effects, visualization, and analysis
 * for production-grade audio streaming applications.
 */
export default class WebAudioProcessor {
  constructor(options = {}) {
    // Configuration
    this.config = {
      sampleRate: 48000,
      bufferSize: 2048,
      enableEffects: true,
      enableVisualization: true,
      enableAnalysis: true,
      latencyHint: "interactive",
      ...options
    };

    // Web Audio API context
    this.audioContext = null;
    this.analyser = null;
    this.processor = null;

    // Audio nodes graph
    this.nodes = {
      input: null,
      output: null,
      gainNode: null,
      compressor: null,
      limiter: null,
      eq: {
        lowShelf: null,
        midPeaking1: null,
        midPeaking2: null,
        highShelf: null
      },
      effects: {
        reverb: null,
        delay: null,
        chorus: null,
        distortion: null
      },
      visualizer: null,
      analyzer: null
    };

    // Effects configuration
    this.effectsConfig = {
      reverb: {
        roomSize: 0.3,
        dampening: 0.5,
        wetGain: 0.1,
        dryGain: 0.9
      },
      delay: {
        delayTime: 0.3,
        feedback: 0.3,
        wetGain: 0.2
      },
      chorus: {
        rate: 1.5,
        depth: 0.025,
        wetGain: 0.2
      },
      eq: {
        lowShelfFreq: 320,
        lowShelfGain: 0,
        midPeaking1Freq: 800,
        midPeaking1Gain: 0,
        midPeaking1Q: 1,
        midPeaking2Freq: 3200,
        midPeaking2Gain: 0,
        midPeaking2Q: 1,
        highShelfFreq: 8000,
        highShelfGain: 0
      },
      compressor: {
        threshold: -24,
        knee: 30,
        ratio: 3,
        attack: 0.003,
        release: 0.25
      }
    };

    // Analysis data
    this.analysisData = {
      frequencyData: null,
      timeDomainData: null,
      rms: 0,
      peak: 0,
      spectralCentroid: 0,
      spectralRolloff: 0,
      zeroCrossingRate: 0,
      mfcc: [],
      tempo: 0,
      pitch: 0
    };

    // Visualization data
    this.visualizationData = {
      waveform: null,
      spectrum: null,
      spectrogram: [],
      peakHistory: [],
      rmsHistory: []
    };

    // Event callbacks
    this.callbacks = {
      onAnalysisUpdate: null,
      onVisualizationUpdate: null,
      onFeatureDetected: null,
      onError: null
    };

    // Real-time processing
    this.processingState = {
      isProcessing: false,
      frameCount: 0,
      lastAnalysisTime: 0,
      analysisInterval: 100, // ms
    };

    this._initializeContext();
  }

  /**
   * Initialize Web Audio API context
   */
  async _initializeContext() {
    try {
      // Create audio context with optimal settings
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)({
        sampleRate: this.config.sampleRate,
        latencyHint: this.config.latencyHint
      });

      // Resume context if suspended
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      // Create audio processing graph
      this._createAudioGraph();

      // Initialize analysis buffers
      this._initializeAnalysis();

      console.log("WebAudioProcessor initialized successfully");
    } catch (error) {
      console.error("Failed to initialize WebAudioProcessor:", error);
      this._emitError(error);
      throw error;
    }
  }

  /**
   * Create the complete audio processing graph
   */
  _createAudioGraph() {
    // Input and output nodes
    this.nodes.input = this.audioContext.createGain();
    this.nodes.output = this.audioContext.createGain();

    // Master gain control
    this.nodes.gainNode = this.audioContext.createGain();

    // Create EQ nodes
    this._createEQNodes();

    // Create effects nodes
    this._createEffectsNodes();

    // Create dynamics processing
    this._createDynamicsNodes();

    // Create analysis nodes
    this._createAnalysisNodes();

    // Connect the audio graph
    this._connectAudioGraph();
  }

  /**
   * Create EQ filter nodes
   */
  _createEQNodes() {
    const eq = this.nodes.eq;
    const config = this.effectsConfig.eq;

    // Low shelf filter
    eq.lowShelf = this.audioContext.createBiquadFilter();
    eq.lowShelf.type = "lowshelf";
    eq.lowShelf.frequency.setValueAtTime(
      config.lowShelfFreq,
      this.audioContext.currentTime,
    );
    eq.lowShelf.gain.setValueAtTime(
      config.lowShelfGain,
      this.audioContext.currentTime,
    );

    // Mid peaking filters
    eq.midPeaking1 = this.audioContext.createBiquadFilter();
    eq.midPeaking1.type = "peaking";
    eq.midPeaking1.frequency.setValueAtTime(
      config.midPeaking1Freq,
      this.audioContext.currentTime,
    );
    eq.midPeaking1.Q.setValueAtTime(
      config.midPeaking1Q,
      this.audioContext.currentTime,
    );
    eq.midPeaking1.gain.setValueAtTime(
      config.midPeaking1Gain,
      this.audioContext.currentTime,
    );

    eq.midPeaking2 = this.audioContext.createBiquadFilter();
    eq.midPeaking2.type = "peaking";
    eq.midPeaking2.frequency.setValueAtTime(
      config.midPeaking2Freq,
      this.audioContext.currentTime,
    );
    eq.midPeaking2.Q.setValueAtTime(
      config.midPeaking2Q,
      this.audioContext.currentTime,
    );
    eq.midPeaking2.gain.setValueAtTime(
      config.midPeaking2Gain,
      this.audioContext.currentTime,
    );

    // High shelf filter
    eq.highShelf = this.audioContext.createBiquadFilter();
    eq.highShelf.type = "highshelf";
    eq.highShelf.frequency.setValueAtTime(
      config.highShelfFreq,
      this.audioContext.currentTime,
    );
    eq.highShelf.gain.setValueAtTime(
      config.highShelfGain,
      this.audioContext.currentTime,
    );
  }

  /**
   * Create audio effects nodes
   */
  _createEffectsNodes() {
    // Reverb
    this.nodes.effects.reverb = this._createReverb();

    // Delay
    this.nodes.effects.delay = this._createDelay();

    // Chorus
    this.nodes.effects.chorus = this._createChorus();
  }

  /**
   * Create reverb effect
   */
  _createReverb() {
    const convolver = this.audioContext.createConvolver();
    const reverbGain = this.audioContext.createGain();
    const config = this.effectsConfig.reverb;

    // Generate impulse response for reverb
    const impulseResponse = this._generateReverbImpulse(
      config.roomSize,
      config.dampening,
    );
    convolver.buffer = impulseResponse;

    reverbGain.gain.setValueAtTime(
      config.wetGain,
      this.audioContext.currentTime,
    );

    return { convolver, wetGain: reverbGain };
  }

  /**
   * Create delay effect
   */
  _createDelay() {
    const delayNode = this.audioContext.createDelay(1.0);
    const feedbackGain = this.audioContext.createGain();
    const wetGain = this.audioContext.createGain();
    const config = this.effectsConfig.delay;

    delayNode.delayTime.setValueAtTime(
      config.delayTime,
      this.audioContext.currentTime,
    );
    feedbackGain.gain.setValueAtTime(
      config.feedback,
      this.audioContext.currentTime,
    );
    wetGain.gain.setValueAtTime(config.wetGain, this.audioContext.currentTime);

    // Connect feedback loop
    delayNode.connect(feedbackGain);
    feedbackGain.connect(delayNode);
    delayNode.connect(wetGain);

    return { delayNode, feedbackGain, wetGain };
  }

  /**
   * Create chorus effect
   */
  _createChorus() {
    const delayNode = this.audioContext.createDelay(0.05);
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    const wetGain = this.audioContext.createGain();
    const config = this.effectsConfig.chorus;

    // Configure LFO
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(config.rate, this.audioContext.currentTime);
    lfoGain.gain.setValueAtTime(config.depth, this.audioContext.currentTime);
    wetGain.gain.setValueAtTime(config.wetGain, this.audioContext.currentTime);

    // Connect LFO to delay modulation
    lfo.connect(lfoGain);
    lfoGain.connect(delayNode.delayTime);
    delayNode.connect(wetGain);

    // Start LFO
    lfo.start();

    return { delayNode, lfo, lfoGain, wetGain };
  }

  /**
   * Create dynamics processing nodes
   */
  _createDynamicsNodes() {
    const config = this.effectsConfig.compressor;

    // Compressor
    this.nodes.compressor = this.audioContext.createDynamicsCompressor();
    this.nodes.compressor.threshold.setValueAtTime(
      config.threshold,
      this.audioContext.currentTime,
    );
    this.nodes.compressor.knee.setValueAtTime(
      config.knee,
      this.audioContext.currentTime,
    );
    this.nodes.compressor.ratio.setValueAtTime(
      config.ratio,
      this.audioContext.currentTime,
    );
    this.nodes.compressor.attack.setValueAtTime(
      config.attack,
      this.audioContext.currentTime,
    );
    this.nodes.compressor.release.setValueAtTime(
      config.release,
      this.audioContext.currentTime,
    );

    // Limiter (additional compressor with high ratio)
    this.nodes.limiter = this.audioContext.createDynamicsCompressor();
    this.nodes.limiter.threshold.setValueAtTime(
      -3,
      this.audioContext.currentTime,
    );
    this.nodes.limiter.knee.setValueAtTime(0, this.audioContext.currentTime);
    this.nodes.limiter.ratio.setValueAtTime(20, this.audioContext.currentTime);
    this.nodes.limiter.attack.setValueAtTime(
      0.001,
      this.audioContext.currentTime,
    );
    this.nodes.limiter.release.setValueAtTime(
      0.01,
      this.audioContext.currentTime,
    );
  }

  /**
   * Create analysis nodes
   */
  _createAnalysisNodes() {
    // Main analyser
    this.nodes.analyzer = this.audioContext.createAnalyser();
    this.nodes.analyzer.fftSize = this.config.bufferSize;
    this.nodes.analyzer.smoothingTimeConstant = 0.8;

    // Visualization analyser (higher resolution)
    this.nodes.visualizer = this.audioContext.createAnalyser();
    this.nodes.visualizer.fftSize = 4096;
    this.nodes.visualizer.smoothingTimeConstant = 0.3;

    // ScriptProcessor for real-time analysis
    if (this.audioContext.createScriptProcessor) {
      this.nodes.processor = this.audioContext.createScriptProcessor(
        this.config.bufferSize,
        2,
        2,
      );
      this.nodes.processor.onaudioprocess = this._processAudioData.bind(this);
    } else if (this.audioContext.audioWorklet) {
      // Use AudioWorklet for better performance (future enhancement)
      this._initializeAudioWorklet();
    }
  }

  /**
   * Connect all audio nodes in the processing graph
   */
  _connectAudioGraph() {
    // Main signal path: Input -> EQ -> Effects -> Dynamics -> Output
    let currentNode = this.nodes.input;

    // Connect EQ chain
    currentNode.connect(this.nodes.eq.lowShelf);
    this.nodes.eq.lowShelf.connect(this.nodes.eq.midPeaking1);
    this.nodes.eq.midPeaking1.connect(this.nodes.eq.midPeaking2);
    this.nodes.eq.midPeaking2.connect(this.nodes.eq.highShelf);
    currentNode = this.nodes.eq.highShelf;

    // Connect effects (parallel processing)
    if (this.config.enableEffects) {
      const effectsMix = this.audioContext.createGain();

      // Dry signal
      currentNode.connect(effectsMix);

      // Wet signals (effects)
      if (this.nodes.effects.reverb) {
        currentNode.connect(this.nodes.effects.reverb.convolver);
        this.nodes.effects.reverb.convolver.connect(
          this.nodes.effects.reverb.wetGain,
        );
        this.nodes.effects.reverb.wetGain.connect(effectsMix);
      }

      if (this.nodes.effects.delay) {
        currentNode.connect(this.nodes.effects.delay.delayNode);
        this.nodes.effects.delay.wetGain.connect(effectsMix);
      }

      if (this.nodes.effects.chorus) {
        currentNode.connect(this.nodes.effects.chorus.delayNode);
        this.nodes.effects.chorus.wetGain.connect(effectsMix);
      }

      currentNode = effectsMix;
    }

    // Connect dynamics processing
    currentNode.connect(this.nodes.compressor);
    this.nodes.compressor.connect(this.nodes.limiter);
    this.nodes.limiter.connect(this.nodes.gainNode);

    // Connect to output
    this.nodes.gainNode.connect(this.nodes.output);

    // Connect analysis nodes (tapped from different points)
    this.nodes.gainNode.connect(this.nodes.analyzer);
    this.nodes.gainNode.connect(this.nodes.visualizer);

    if (this.nodes.processor) {
      this.nodes.gainNode.connect(this.nodes.processor);
      this.nodes.processor.connect(this.audioContext.destination);
    }

    // Connect to audio context destination
    this.nodes.output.connect(this.audioContext.destination);
  }

  /**
   * Initialize analysis buffers
   */
  _initializeAnalysis() {
    const analyserBufferLength = this.nodes.analyzer.frequencyBinCount;
    const visualizerBufferLength = this.nodes.visualizer.frequencyBinCount;

    this.analysisData.frequencyData = new Uint8Array(analyserBufferLength);
    this.analysisData.timeDomainData = new Uint8Array(analyserBufferLength);

    this.visualizationData.waveform = new Uint8Array(visualizerBufferLength);
    this.visualizationData.spectrum = new Uint8Array(visualizerBufferLength);
  }

  /**
   * Connect audio source to the processor
   */
  connectSource(audioElement) {
    try {
      const source = this.audioContext.createMediaElementSource(audioElement);
      source.connect(this.nodes.input);
      return source;
    } catch (error) {
      console.error("Failed to connect audio source:", error);
      this._emitError(error);
      throw error;
    }
  }

  /**
   * Start real-time audio processing
   */
  startProcessing() {
    if (this.processingState.isProcessing) return;

    this.processingState.isProcessing = true;
    this.processingState.frameCount = 0;
    this.processingState.lastAnalysisTime = Date.now();

    // Start analysis loop
    this._analysisLoop();

    console.log("Audio processing started");
  }

  /**
   * Stop real-time audio processing
   */
  stopProcessing() {
    this.processingState.isProcessing = false;
    console.log("Audio processing stopped");
  }

  /**
   * Real-time analysis loop
   */
  _analysisLoop() {
    if (!this.processingState.isProcessing) return;

    const now = Date.now();
    if (
      now - this.processingState.lastAnalysisTime >=
      this.processingState.analysisInterval
    ) {
      this._performAnalysis();
      this._updateVisualization();
      this.processingState.lastAnalysisTime = now;
    }

    requestAnimationFrame(() => this._analysisLoop());
  }

  /**
   * Perform audio analysis
   */
  _performAnalysis() {
    // Get frequency and time domain data
    this.nodes.analyzer.getByteFrequencyData(this.analysisData.frequencyData);
    this.nodes.analyzer.getByteTimeDomainData(this.analysisData.timeDomainData);

    // Calculate RMS and peak levels
    this._calculateLevels();

    // Calculate spectral features
    this._calculateSpectralFeatures();

    // Detect audio features
    this._detectFeatures();

    // Emit analysis update
    if (this.callbacks.onAnalysisUpdate) {
      this.callbacks.onAnalysisUpdate({
        ...this.analysisData,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Update visualization data
   */
  _updateVisualization() {
    // Get high-resolution data for visualization
    this.nodes.visualizer.getByteFrequencyData(this.visualizationData.spectrum);
    this.nodes.visualizer.getByteTimeDomainData(
      this.visualizationData.waveform,
    );

    // Update history for visualizations
    this.visualizationData.peakHistory.push(this.analysisData.peak);
    this.visualizationData.rmsHistory.push(this.analysisData.rms);

    // Keep history length manageable
    if (this.visualizationData.peakHistory.length > 100) {
      this.visualizationData.peakHistory.shift();
      this.visualizationData.rmsHistory.shift();
    }

    // Emit visualization update
    if (this.callbacks.onVisualizationUpdate) {
      this.callbacks.onVisualizationUpdate({
        ...this.visualizationData,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Calculate audio levels (RMS and peak)
   */
  _calculateLevels() {
    const timeDomainData = this.analysisData.timeDomainData;
    let sum = 0;
    let peak = 0;

    for (let i = 0; i < timeDomainData.length; i++) {
      const sample = (timeDomainData[i] - 128) / 128;
      sum += sample * sample;
      peak = Math.max(peak, Math.abs(sample));
    }

    this.analysisData.rms = Math.sqrt(sum / timeDomainData.length);
    this.analysisData.peak = peak;
  }

  /**
   * Calculate spectral features
   */
  _calculateSpectralFeatures() {
    const frequencyData = this.analysisData.frequencyData;
    let weightedSum = 0;
    let magnitudeSum = 0;
    let rolloffSum = 0;
    const rolloffThreshold = 0.85;

    // Calculate spectral centroid and rolloff
    for (let i = 0; i < frequencyData.length; i++) {
      const magnitude = frequencyData[i] / 255;
      weightedSum += i * magnitude;
      magnitudeSum += magnitude;

      if (rolloffSum < rolloffThreshold * magnitudeSum) {
        rolloffSum += magnitude;
        this.analysisData.spectralRolloff = i;
      }
    }

    this.analysisData.spectralCentroid =
      magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;

    // Calculate zero crossing rate
    this._calculateZeroCrossingRate();
  }

  /**
   * Calculate zero crossing rate
   */
  _calculateZeroCrossingRate() {
    const timeDomainData = this.analysisData.timeDomainData;
    let crossings = 0;

    for (let i = 1; i < timeDomainData.length; i++) {
      const current = timeDomainData[i] - 128;
      const previous = timeDomainData[i - 1] - 128;

      if ((current >= 0 && previous < 0) || (current < 0 && previous >= 0)) {
        crossings++;
      }
    }

    this.analysisData.zeroCrossingRate = crossings / timeDomainData.length;
  }

  /**
   * Detect audio features
   */
  _detectFeatures() {
    // Simple onset detection based on spectral flux
    const currentSpectralEnergy = this.analysisData.frequencyData.reduce(
      (sum, val) => sum + val,
      0,
    );

    if (this.previousSpectralEnergy) {
      const spectralFlux = Math.max(
        0,
        currentSpectralEnergy - this.previousSpectralEnergy,
      );

      // Detect onset if spectral flux is above threshold
      if (spectralFlux > this.onsetThreshold) {
        if (this.callbacks.onFeatureDetected) {
          this.callbacks.onFeatureDetected({
            type: "onset",
            strength: spectralFlux,
            timestamp: Date.now()
          });
        }
      }
    }

    this.previousSpectralEnergy = currentSpectralEnergy;
    this.onsetThreshold = this.onsetThreshold || currentSpectralEnergy * 1.5;
  }

  /**
   * Process audio data (ScriptProcessor callback)
   */
  _processAudioData(event) {
    const inputBuffer = event.inputBuffer;
    const outputBuffer = event.outputBuffer;

    // Pass through audio (processing is handled by the node graph)
    for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++) {
      const inputData = inputBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);

      for (let sample = 0; sample < inputBuffer.length; sample++) {
        outputData[sample] = inputData[sample];
      }
    }

    this.processingState.frameCount++;
  }

  /**
   * Generate reverb impulse response
   */
  _generateReverbImpulse(roomSize, dampening) {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * roomSize;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);

      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - dampening, i / length);
        channelData[i] = (Math.random() * 2 - 1) * decay;
      }
    }

    return impulse;
  }

  /**
   * Set EQ parameters
   */
  setEQ(band, frequency, gain, q = 1) {
    const currentTime = this.audioContext.currentTime;

    switch (band) {
      case "lowShelf":
        this.nodes.eq.lowShelf.frequency.setValueAtTime(frequency, currentTime);
        this.nodes.eq.lowShelf.gain.setValueAtTime(gain, currentTime);
        break;
      case "midPeaking1":
        this.nodes.eq.midPeaking1.frequency.setValueAtTime(
          frequency,
          currentTime,
        );
        this.nodes.eq.midPeaking1.gain.setValueAtTime(gain, currentTime);
        this.nodes.eq.midPeaking1.Q.setValueAtTime(q, currentTime);
        break;
      case "midPeaking2":
        this.nodes.eq.midPeaking2.frequency.setValueAtTime(
          frequency,
          currentTime,
        );
        this.nodes.eq.midPeaking2.gain.setValueAtTime(gain, currentTime);
        this.nodes.eq.midPeaking2.Q.setValueAtTime(q, currentTime);
        break;
      case "highShelf":
        this.nodes.eq.highShelf.frequency.setValueAtTime(
          frequency,
          currentTime,
        );
        this.nodes.eq.highShelf.gain.setValueAtTime(gain, currentTime);
        break;
    }
  }

  /**
   * Set effect parameters
   */
  setEffect(effectName, parameter, value) {
    const currentTime = this.audioContext.currentTime;

    switch (effectName) {
      case "reverb":
        if (parameter === "wetGain" && this.nodes.effects.reverb) {
          this.nodes.effects.reverb.wetGain.gain.setValueAtTime(
            value,
            currentTime,
          );
        }
        break;
      case "delay":
        if (this.nodes.effects.delay) {
          if (parameter === "delayTime") {
            this.nodes.effects.delay.delayNode.delayTime.setValueAtTime(
              value,
              currentTime,
            );
          } else if (parameter === "feedback") {
            this.nodes.effects.delay.feedbackGain.gain.setValueAtTime(
              value,
              currentTime,
            );
          } else if (parameter === "wetGain") {
            this.nodes.effects.delay.wetGain.gain.setValueAtTime(
              value,
              currentTime,
            );
          }
        }
        break;
      case "chorus":
        if (this.nodes.effects.chorus) {
          if (parameter === "rate") {
            this.nodes.effects.chorus.lfo.frequency.setValueAtTime(
              value,
              currentTime,
            );
          } else if (parameter === "depth") {
            this.nodes.effects.chorus.lfoGain.gain.setValueAtTime(
              value,
              currentTime,
            );
          } else if (parameter === "wetGain") {
            this.nodes.effects.chorus.wetGain.gain.setValueAtTime(
              value,
              currentTime,
            );
          }
        }
        break;
    }
  }

  /**
   * Set master volume
   */
  setVolume(volume) {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.nodes.gainNode.gain.setValueAtTime(
      clampedVolume,
      this.audioContext.currentTime,
    );
  }

  /**
   * Get current analysis data
   */
  getAnalysisData() {
    return { ...this.analysisData };
  }

  /**
   * Get current visualization data
   */
  getVisualizationData() {
    return { ...this.visualizationData };
  }

  // Event handler setters
  onAnalysisUpdate(callback) {
    this.callbacks.onAnalysisUpdate = callback;
  }

  onVisualizationUpdate(callback) {
    this.callbacks.onVisualizationUpdate = callback;
  }

  onFeatureDetected(callback) {
    this.callbacks.onFeatureDetected = callback;
  }

  onError(callback) {
    this.callbacks.onError = callback;
  }

  /**
   * Emit error event
   */
  _emitError(error) {
    if (this.callbacks.onError) {
      this.callbacks.onError(error);
    }
  }

  /**
   * Initialize AudioWorklet (future enhancement)
   */
  async _initializeAudioWorklet() {
    try {
      await this.audioContext.audioWorklet.addModule(
        "/audio-processor-worklet.js",
      );
      this.nodes.processor = new AudioWorkletNode(
        this.audioContext,
        "audio-processor",
      );
    } catch (error) {
      console.warn(
        "AudioWorklet not available, using ScriptProcessor fallback",
      );
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopProcessing();

    // Stop any oscillators
    if (this.nodes.effects.chorus?.lfo) {
      this.nodes.effects.chorus.lfo.stop();
    }

    // Disconnect all nodes
    Object.values(this.nodes).forEach((node) => {
      if (node && typeof node.disconnect === "function") {
        try {
          node.disconnect();
        } catch (error) {
          // Ignore disconnect errors
        }
      }
    });

    // Close audio context
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
