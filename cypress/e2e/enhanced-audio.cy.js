/**
 * Enhanced Audio Features E2E Tests
 * Tests the complete production-grade audio streaming experience
 * including gapless playback, crossfades, adaptive streaming, and UI controls
 */

describe('Enhanced Audio Features', () => {
  beforeEach(() => {
    // Mock Web APIs that Cypress doesn't support by default
    cy.window().then((win) => {
      // Mock MediaSource API
      win.MediaSource = class MockMediaSource extends EventTarget {
        constructor() {
          super();
          this.readyState = 'closed';
          this.sourceBuffers = [];
          this.duration = NaN;
        }

        addSourceBuffer(mimeType) {
          const sourceBuffer = new MockSourceBuffer();
          this.sourceBuffers.push(sourceBuffer);
          return sourceBuffer;
        }

        endOfStream() {
          this.readyState = 'ended';
        }

        static isTypeSupported(type) {
          return true;
        }
      };

      // Mock SourceBuffer API
      win.MockSourceBuffer = class MockSourceBuffer extends EventTarget {
        constructor() {
          super();
          this.updating = false;
          this.buffered = {
            length: 0,
            start: () => 0,
            end: () => 0,
          };
        }

        appendBuffer(data) {
          this.updating = true;
          setTimeout(() => {
            this.updating = false;
            this.dispatchEvent(new Event('updateend'));
          }, 10);
        }

        remove(start, end) {
          this.updating = true;
          setTimeout(() => {
            this.updating = false;
            this.dispatchEvent(new Event('updateend'));
          }, 10);
        }
      };

      // Mock Web Audio API
      const mockAudioContext = {
        currentTime: 0,
        sampleRate: 48000,
        state: 'running',
        destination: {},
        resume: () => Promise.resolve(),
        close: () => Promise.resolve(),
        createGain: () => ({
          connect: () => {},
          disconnect: () => {},
          gain: {
            setValueAtTime: () => {},
            linearRampToValueAtTime: () => {},
            cancelScheduledValues: () => {},
            value: 1,
          },
        }),
        createAnalyser: () => ({
          connect: () => {},
          disconnect: () => {},
          fftSize: 2048,
          frequencyBinCount: 1024,
          getByteFrequencyData: () => {},
          getByteTimeDomainData: () => {},
        }),
        createBiquadFilter: () => ({
          connect: () => {},
          disconnect: () => {},
          frequency: { setValueAtTime: () => {} },
          gain: { setValueAtTime: () => {} },
          Q: { setValueAtTime: () => {} },
        }),
        createDynamicsCompressor: () => ({
          connect: () => {},
          disconnect: () => {},
          threshold: { setValueAtTime: () => {} },
          knee: { setValueAtTime: () => {} },
          ratio: { setValueAtTime: () => {} },
          attack: { setValueAtTime: () => {} },
          release: { setValueAtTime: () => {} },
        }),
        createConvolver: () => ({
          connect: () => {},
          disconnect: () => {},
          buffer: null,
        }),
        createDelay: () => ({
          connect: () => {},
          disconnect: () => {},
          delayTime: { setValueAtTime: () => {} },
        }),
        createOscillator: () => ({
          connect: () => {},
          disconnect: () => {},
          frequency: { setValueAtTime: () => {} },
          start: () => {},
          stop: () => {},
        }),
        createMediaElementSource: () => ({
          connect: () => {},
          disconnect: () => {},
        }),
        createBuffer: () => ({
          getChannelData: () => new Float32Array(1024),
        }),
      };

      win.AudioContext = function() { return mockAudioContext; };
      win.webkitAudioContext = function() { return mockAudioContext; };

      // Mock fetch for segment loading
      cy.intercept('GET', '/music/**', { fixture: 'audio-segment.mp3' });
      cy.intercept('GET', '**/*.init', { fixture: 'audio-init.mp4' });
      cy.intercept('GET', '**/*.aac', { fixture: 'audio-segment.aac' });
    });

    cy.visit('/');
  });

  describe('Production MSE Engine Integration', () => {
    it('should initialize enhanced audio engine successfully', () => {
      // Navigate to a page with audio player
      cy.get('[data-testid="audio-player"]').should('exist');

      // Verify engine initialization
      cy.window().its('audioEngine').should('exist');
      cy.window().its('audioEngine.state.isInitialized').should('be.true');
    });

    it('should load track with enhanced features', () => {
      const testTrack = {
        id: 'test-track-1',
        title: 'Test Song',
        artist: 'Test Artist',
        fileName: 'test-song.mp3',
      };

      cy.window().then((win) => {
        // Simulate track loading
        win.audioEngine.load(testTrack);
      });

      // Verify track loaded
      cy.get('[data-testid="current-track-title"]').should('contain', 'Test Song');
      cy.get('[data-testid="current-track-artist"]').should('contain', 'Test Artist');
    });

    it('should handle playback controls', () => {
      // Load a track first
      cy.window().then((win) => {
        win.audioEngine.load({
          id: 'test-track',
          title: 'Test Track',
          fileName: 'test.mp3',
        });
      });

      // Test play button
      cy.get('[data-testid="play-button"]').click();
      cy.get('[data-testid="play-button"]').should('have.attr', 'aria-label', 'Pause');

      // Test pause button
      cy.get('[data-testid="play-button"]').click();
      cy.get('[data-testid="play-button"]').should('have.attr', 'aria-label', 'Play');

      // Test volume control
      cy.get('[data-testid="volume-slider"]').invoke('val', 50).trigger('input');
      cy.window().its('audioEngine.audio.volume').should('be.closeTo', 0.5, 0.1);
    });
  });

  describe('Gapless Playback', () => {
    beforeEach(() => {
      // Setup test playlist for gapless testing
      const testPlaylist = [
        { id: '1', title: 'Track 1', fileName: 'track1.mp3' },
        { id: '2', title: 'Track 2', fileName: 'track2.mp3' },
        { id: '3', title: 'Track 3', fileName: 'track3.mp3' },
      ];

      cy.window().then((win) => {
        win.testPlaylist = testPlaylist;
      });
    });

    it('should preload next track for gapless transition', () => {
      cy.window().then((win) => {
        const [track1, track2] = win.testPlaylist;

        // Load first track with next track specified
        win.audioEngine.load(track1, track2);

        // Verify next track is queued
        expect(win.audioEngine.state.nextTrack).to.deep.equal(track2);
      });
    });

    it('should show buffer status information', () => {
      cy.get('[data-testid="advanced-audio-controls"]').should('exist');
      cy.get('[data-testid="buffer-status"]').should('contain', 'Buffer:');
      cy.get('[data-testid="buffer-health"]').should('exist');
    });

    it('should display gapless preparation status', () => {
      cy.window().then((win) => {
        const [track1, track2] = win.testPlaylist;
        win.audioEngine.load(track1, track2);

        // Simulate near end of track
        win.audioEngine.audio.currentTime = 175;
        win.audioEngine.audio.duration = 180;

        // Trigger gapless preparation check
        win.audioEngine._checkGaplessOpportunity();
      });

      cy.get('[data-testid="gapless-status"]').should('contain', 'Ready');
    });
  });

  describe('Crossfade Controls', () => {
    it('should display crossfade control panel', () => {
      // Navigate to advanced controls
      cy.get('[data-testid="advanced-controls-tab"]').click();
      cy.get('[data-testid="crossfade-tab"]').click();

      // Verify crossfade controls are present
      cy.get('[data-testid="crossfade-controls"]').should('be.visible');
      cy.get('[data-testid="crossfade-duration-slider"]').should('exist');
      cy.get('[data-testid="crossfade-curve-select"]').should('exist');
      cy.get('[data-testid="beat-sync-toggle"]').should('exist');
    });

    it('should configure crossfade settings', () => {
      cy.get('[data-testid="advanced-controls-tab"]').click();
      cy.get('[data-testid="crossfade-tab"]').click();

      // Change crossfade duration
      cy.get('[data-testid="crossfade-duration-slider"]')
        .invoke('val', 12)
        .trigger('input');

      // Change crossfade curve
      cy.get('[data-testid="crossfade-curve-select"]').click();
      cy.get('[data-value="logarithmic"]').click();

      // Toggle beat sync
      cy.get('[data-testid="beat-sync-toggle"]').click();

      // Verify settings are applied
      cy.window().then((win) => {
        const config = win.audioEngine.crossfadeEngine.config;
        expect(config.crossfadeDuration).to.equal(12);
        expect(config.crossfadeCurve).to.equal('logarithmic');
      });
    });

    it('should show track analysis information', () => {
      cy.get('[data-testid="advanced-controls-tab"]').click();
      cy.get('[data-testid="crossfade-tab"]').click();

      // Mock track analysis data
      cy.window().then((win) => {
        win.audioEngine.crossfadeEngine.trackAnalysis.current = {
          bpm: 128,
          key: 'C major',
          energy: 0.7,
        };
      });

      cy.get('[data-testid="current-track-bpm"]').should('contain', '128 BPM');
      cy.get('[data-testid="current-track-key"]').should('contain', 'C major');
    });

    it('should initiate crossfade transition', () => {
      // Setup tracks for crossfade
      cy.window().then((win) => {
        const [track1, track2] = win.testPlaylist;
        win.audioEngine.load(track1, track2);

        // Mock track analysis for both tracks
        win.audioEngine.crossfadeEngine.trackAnalysis = {
          current: { bpm: 120, energy: 0.6 },
          next: { bpm: 125, energy: 0.7 },
        };
      });

      cy.get('[data-testid="advanced-controls-tab"]').click();
      cy.get('[data-testid="crossfade-tab"]').click();

      // Start crossfade
      cy.get('[data-testid="start-crossfade-button"]').click();

      // Verify crossfade is active
      cy.get('[data-testid="crossfade-progress"]').should('be.visible');
      cy.get('[data-testid="crossfade-status"]').should('contain', 'ACTIVE');
    });

    it('should display beat sync information when enabled', () => {
      cy.get('[data-testid="advanced-controls-tab"]').click();
      cy.get('[data-testid="crossfade-tab"]').click();

      // Enable beat sync
      cy.get('[data-testid="beat-sync-toggle"]').check();

      // Mock beat detection
      cy.window().then((win) => {
        win.audioEngine.crossfadeEngine.beatDetection = {
          bpm: 120,
          confidence: 0.85,
        };
      });

      cy.get('[data-testid="beat-info-panel"]').should('be.visible');
      cy.get('[data-testid="detected-bpm"]').should('contain', '120 BPM');
      cy.get('[data-testid="beat-confidence"]').should('contain', '85%');
    });
  });

  describe('Audio Visualization', () => {
    it('should display real-time audio visualizer', () => {
      cy.get('[data-testid="advanced-controls-tab"]').click();
      cy.get('[data-testid="visualizer-tab"]').click();

      cy.get('[data-testid="audio-visualizer"]').should('be.visible');
      cy.get('[data-testid="visualizer-canvas"]').should('exist');
    });

    it('should switch between visualization modes', () => {
      cy.get('[data-testid="advanced-controls-tab"]').click();
      cy.get('[data-testid="visualizer-tab"]').click();

      // Test different visualization types
      const visualizerTypes = ['spectrum', 'waveform', 'spectrogram', 'combined'];

      visualizerTypes.forEach((type) => {
        cy.get('[data-testid="visualizer-type-select"]').select(type);
        cy.get('[data-testid="visualizer-canvas"]').should('be.visible');
      });
    });

    it('should adjust visualizer sensitivity', () => {
      cy.get('[data-testid="advanced-controls-tab"]').click();
      cy.get('[data-testid="visualizer-tab"]').click();

      cy.get('[data-testid="sensitivity-slider"]')
        .invoke('val', 2.0)
        .trigger('input');

      cy.get('[data-testid="sensitivity-value"]').should('contain', '2.0');
    });

    it('should toggle visualization animation', () => {
      cy.get('[data-testid="advanced-controls-tab"]').click();
      cy.get('[data-testid="visualizer-tab"]').click();

      // Stop animation
      cy.get('[data-testid="animation-toggle"]').uncheck();
      cy.get('[data-testid="animation-status"]').should('contain', 'Stopped');

      // Start animation
      cy.get('[data-testid="animation-toggle"]').check();
      cy.get('[data-testid="animation-status"]').should('contain', 'Running');
    });
  });

  describe('EQ and Audio Effects', () => {
    it('should display EQ controls', () => {
      cy.get('[data-testid="advanced-controls-tab"]').click();
      cy.get('[data-testid="eq-effects-tab"]').click();

      // Verify EQ bands are present
      cy.get('[data-testid="eq-low-shelf"]').should('exist');
      cy.get('[data-testid="eq-mid-peaking-1"]').should('exist');
      cy.get('[data-testid="eq-mid-peaking-2"]').should('exist');
      cy.get('[data-testid="eq-high-shelf"]').should('exist');
    });

    it('should adjust EQ bands', () => {
      cy.get('[data-testid="advanced-controls-tab"]').click();
      cy.get('[data-testid="eq-effects-tab"]').click();

      // Adjust bass
      cy.get('[data-testid="eq-low-shelf"]')
        .invoke('val', 3)
        .trigger('input');

      // Adjust treble
      cy.get('[data-testid="eq-high-shelf"]')
        .invoke('val', -2)
        .trigger('input');

      // Verify EQ values are applied
      cy.window().then((win) => {
        // Values should be applied to Web Audio API nodes
        expect(win.audioEngine.webAudioProcessor).to.exist;
      });
    });

    it('should reset EQ to flat', () => {
      cy.get('[data-testid="advanced-controls-tab"]').click();
      cy.get('[data-testid="eq-effects-tab"]').click();

      // Adjust some EQ bands first
      cy.get('[data-testid="eq-low-shelf"]').invoke('val', 5).trigger('input');
      cy.get('[data-testid="eq-high-shelf"]').invoke('val', -3).trigger('input');

      // Reset EQ
      cy.get('[data-testid="eq-reset-button"]').click();

      // Verify all bands are reset to 0
      cy.get('[data-testid="eq-low-shelf"]').should('have.value', '0');
      cy.get('[data-testid="eq-mid-peaking-1"]').should('have.value', '0');
      cy.get('[data-testid="eq-mid-peaking-2"]').should('have.value', '0');
      cy.get('[data-testid="eq-high-shelf"]').should('have.value', '0');
    });

    it('should toggle audio effects', () => {
      cy.get('[data-testid="advanced-controls-tab"]').click();
      cy.get('[data-testid="eq-effects-tab"]').click();

      // Enable effects processing
      cy.get('[data-testid="enable-effects-toggle"]').check();
      cy.get('[data-testid="effects-status"]').should('contain', 'Enabled');

      // Disable effects processing
      cy.get('[data-testid="enable-effects-toggle"]').uncheck();
      cy.get('[data-testid="effects-status"]').should('contain', 'Disabled');
    });
  });

  describe('Adaptive Streaming Quality', () => {
    it('should display quality controls', () => {
      cy.get('[data-testid="advanced-controls-tab"]').click();
      cy.get('[data-testid="quality-tab"]').click();

      cy.get('[data-testid="quality-level-select"]').should('exist');
      cy.get('[data-testid="adaptive-streaming-toggle"]').should('exist');
      cy.get('[data-testid="network-status"]').should('be.visible');
    });

    it('should change quality level manually', () => {
      cy.get('[data-testid="advanced-controls-tab"]').click();
      cy.get('[data-testid="quality-tab"]').click();

      // Change to high quality
      cy.get('[data-testid="quality-level-select"]').select('high');
      cy.get('[data-testid="current-quality"]').should('contain', 'HIGH');

      // Change to low quality
      cy.get('[data-testid="quality-level-select"]').select('low');
      cy.get('[data-testid="current-quality"]').should('contain', 'LOW');
    });

    it('should toggle adaptive streaming', () => {
      cy.get('[data-testid="advanced-controls-tab"]').click();
      cy.get('[data-testid="quality-tab"]').click();

      // Disable adaptive streaming
      cy.get('[data-testid="adaptive-streaming-toggle"]').uncheck();
      cy.get('[data-testid="adaptive-status"]').should('contain', 'Manual');

      // Enable adaptive streaming
      cy.get('[data-testid="adaptive-streaming-toggle"]').check();
      cy.get('[data-testid="adaptive-status"]').should('contain', 'Adaptive');
    });

    it('should display network metrics', () => {
      cy.get('[data-testid="advanced-controls-tab"]').click();
      cy.get('[data-testid="quality-tab"]').click();

      // Mock network status
      cy.window().then((win) => {
        win.audioEngine.adaptiveEngine.networkMetrics = {
          bandwidth: 1200,
          latency: 45,
          stability: 0.85,
        };
      });

      cy.get('[data-testid="bandwidth-display"]').should('contain', '1200 kbps');
      cy.get('[data-testid="latency-display"]').should('contain', '45ms');
      cy.get('[data-testid="stability-display"]').should('contain', '85%');
    });
  });

  describe('Engine Configuration', () => {
    it('should display engine settings', () => {
      cy.get('[data-testid="advanced-controls-tab"]').click();
      cy.get('[data-testid="engine-tab"]').click();

      cy.get('[data-testid="enable-gapless-toggle"]').should('exist');
      cy.get('[data-testid="enable-crossfade-toggle"]').should('exist');
      cy.get('[data-testid="enable-adaptive-toggle"]').should('exist');
      cy.get('[data-testid="frame-accurate-seeking-toggle"]').should('exist');
    });

    it('should configure engine features', () => {
      cy.get('[data-testid="advanced-controls-tab"]').click();
      cy.get('[data-testid="engine-tab"]').click();

      // Toggle gapless playback
      cy.get('[data-testid="enable-gapless-toggle"]').uncheck();
      cy.get('[data-testid="gapless-status"]').should('contain', 'Disabled');

      // Toggle crossfade
      cy.get('[data-testid="enable-crossfade-toggle"]').uncheck();
      cy.get('[data-testid="crossfade-status"]').should('contain', 'Disabled');

      // Re-enable features
      cy.get('[data-testid="enable-gapless-toggle"]').check();
      cy.get('[data-testid="enable-crossfade-toggle"]').check();
    });

    it('should display engine status and analytics', () => {
      cy.get('[data-testid="advanced-controls-tab"]').click();
      cy.get('[data-testid="engine-tab"]').click();

      cy.get('[data-testid="engine-status"]').should('contain', 'Initialized');
      cy.get('[data-testid="tracks-played"]').should('exist');
      cy.get('[data-testid="quality-changes"]').should('exist');
      cy.get('[data-testid="crossfade-events"]').should('exist');
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Simulate network failure
      cy.intercept('GET', '/music/**', { forceNetworkError: true });

      cy.window().then((win) => {
        win.audioEngine.load({
          id: 'test-track',
          title: 'Test Track',
          fileName: 'failing-track.mp3',
        });
      });

      // Should show error state but not crash
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.get('[data-testid="audio-player"]').should('exist');
    });

    it('should maintain responsive UI during heavy audio processing', () => {
      // Enable all features for maximum processing load
      cy.get('[data-testid="advanced-controls-tab"]').click();

      // Enable visualizer
      cy.get('[data-testid="visualizer-tab"]').click();
      cy.get('[data-testid="animation-toggle"]').check();

      // Enable effects
      cy.get('[data-testid="eq-effects-tab"]').click();
      cy.get('[data-testid="enable-effects-toggle"]').check();

      // UI should remain responsive
      cy.get('[data-testid="play-button"]').should('be.visible');
      cy.get('[data-testid="play-button"]').click({ timeout: 1000 });
    });

    it('should recover from audio context suspension', () => {
      cy.window().then((win) => {
        // Simulate audio context suspension
        if (win.audioEngine.webAudioProcessor?.audioContext) {
          Object.defineProperty(win.audioEngine.webAudioProcessor.audioContext, 'state', {
            value: 'suspended',
            writable: true,
          });
        }
      });

      // Trigger user interaction to resume context
      cy.get('[data-testid="play-button"]').click();

      // Should attempt to resume and handle gracefully
      cy.get('[data-testid="audio-status"]').should('not.contain', 'Error');
    });
  });

  describe('Accessibility', () => {
    it('should provide proper ARIA labels for controls', () => {
      cy.get('[data-testid="play-button"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="volume-slider"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="seek-slider"]').should('have.attr', 'aria-label');
    });

    it('should support keyboard navigation', () => {
      // Tab through controls
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'play-button');

      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'previous-button');

      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'next-button');
    });

    it('should announce track changes to screen readers', () => {
      cy.get('[aria-live="polite"]').should('exist');

      cy.window().then((win) => {
        win.audioEngine.load({
          id: 'new-track',
          title: 'New Song',
          artist: 'New Artist',
        });
      });

      cy.get('[aria-live="polite"]').should('contain', 'Now playing: New Song by New Artist');
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('should adapt controls for mobile layout', () => {
      cy.get('[data-testid="audio-player"]').should('be.visible');
      cy.get('[data-testid="play-button"]').should('be.visible');

      // Advanced controls should be accessible
      cy.get('[data-testid="advanced-controls-toggle"]').click();
      cy.get('[data-testid="advanced-audio-controls"]').should('be.visible');
    });

    it('should optimize visualizer for mobile performance', () => {
      cy.get('[data-testid="advanced-controls-toggle"]').click();
      cy.get('[data-testid="visualizer-tab"]').click();

      // Visualizer should be present but possibly with reduced complexity
      cy.get('[data-testid="audio-visualizer"]').should('exist');
      cy.get('[data-testid="mobile-optimized"]').should('exist');
    });

    it('should handle touch interactions', () => {
      cy.get('[data-testid="play-button"]').trigger('touchstart');
      cy.get('[data-testid="play-button"]').trigger('touchend');

      // Should handle touch the same as click
      cy.get('[data-testid="play-button"]').should('have.attr', 'aria-label', 'Pause');
    });
  });
});