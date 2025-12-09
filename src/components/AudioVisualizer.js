import React, { useRef, useEffect, useState , useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Slider,
  Button,
  Switch,
  FormControlLabel
} from "@mui/material";

/**
 * AudioVisualizer - Real-time audio visualization component
 * Provides spectrum analyzer, waveform display, and various audio visualizations
 * using HTML5 Canvas and Web Audio API data.
 */
const AudioVisualizer = ({
  webAudioProcessor,
  width = 800,
  height = 400,
  type = "spectrum", // 'spectrum', 'waveform', 'spectrogram', 'combined'
  style = "bars", // 'bars', 'line', 'filled'
  colorScheme = "spotify", // 'spotify', 'rainbow', 'monochrome', 'neon'
  showControls = true,
  onVisualizationUpdate = null
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [visualizationData, setVisualizationData] = useState(null);
  const [config, setConfig] = useState({
    sensitivity: 1.0,
    smoothing: 0.8,
    minDecibels: -90,
    maxDecibels: -10,
    fftSize: 2048
  });

  // Color schemes
  const colorSchemes = {
    spotify: {
      primary: "#1DB954",
      secondary: "#1ed760",
      background: "#191414",
      gradient: ["#1DB954", "#1ed760", "#22ff66"]
    },
    rainbow: {
      primary: "#ff0080",
      secondary: "#8000ff",
      background: "#000011",
      gradient: [
        "#ff0080",
        "#ff8000",
        "#ffff00",
        "#80ff00",
        "#00ff80",
        "#0080ff",
        "#8000ff",
      ]
    },
    monochrome: {
      primary: "#ffffff",
      secondary: "#cccccc",
      background: "#000000",
      gradient: ["#333333", "#666666", "#999999", "#cccccc", "#ffffff"]
    },
    neon: {
      primary: "#00ffff",
      secondary: "#ff00ff",
      background: "#001122",
      gradient: ["#00ffff", "#0080ff", "#8000ff", "#ff00ff", "#ff0080"]
    }
  };

  const currentScheme = colorSchemes[colorScheme] || colorSchemes.spotify;

  /**
   * Initialize visualization
   */
  useEffect(() => {
    if (webAudioProcessor && canvasRef.current) {
      // Set up Web Audio API data listener
      webAudioProcessor.onVisualizationUpdate((data) => {
        setVisualizationData(data);
        if (onVisualizationUpdate) {
          onVisualizationUpdate(data);
        }
      });

      // Start animation loop
      setIsAnimating(true);
      startAnimation();

      return () => {
        stopAnimation();
      };
    }
  }, [webAudioProcessor]);

  /**
   * Start animation loop
   */
  const startAnimation = useCallback(() => {
    if (animationRef.current) return;

    const animate = () => {
      if (canvasRef.current && visualizationData) {
        drawVisualization();
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [visualizationData, type, style, currentScheme, config]);

  /**
   * Stop animation loop
   */
  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsAnimating(false);
  }, []);

  /**
   * Draw visualization on canvas
   */
  const drawVisualization = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visualizationData) return;

    const ctx = canvas.getContext("2d");
    const { width: canvasWidth, height: canvasHeight } = canvas;

    // Clear canvas
    ctx.fillStyle = currentScheme.background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    switch (type) {
      case "spectrum":
        drawSpectrum(ctx, canvasWidth, canvasHeight);
        break;
      case "waveform":
        drawWaveform(ctx, canvasWidth, canvasHeight);
        break;
      case "spectrogram":
        drawSpectrogram(ctx, canvasWidth, canvasHeight);
        break;
      case "combined":
        drawCombined(ctx, canvasWidth, canvasHeight);
        break;
      default:
        drawSpectrum(ctx, canvasWidth, canvasHeight);
    }
  }, [visualizationData, type, style, currentScheme, config]);

  /**
   * Draw spectrum analyzer
   */
  const drawSpectrum = (ctx, canvasWidth, canvasHeight) => {
    if (!visualizationData.spectrum) return;

    const spectrum = visualizationData.spectrum;
    const barWidth = canvasWidth / spectrum.length;
    const maxHeight = canvasHeight - 20;

    for (let i = 0; i < spectrum.length; i++) {
      const barHeight = (spectrum[i] / 255) * maxHeight * config.sensitivity;
      const x = i * barWidth;
      const y = canvasHeight - barHeight;

      if (style === "bars") {
        // Draw frequency bars
        const colorIndex = Math.floor(
          (i / spectrum.length) * currentScheme.gradient.length,
        );
        ctx.fillStyle =
          currentScheme.gradient[colorIndex] || currentScheme.primary;
        ctx.fillRect(x, y, barWidth - 1, barHeight);

        // Add glow effect
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.fillRect(x, y, barWidth - 1, barHeight);
        ctx.shadowBlur = 0;
      } else if (style === "line") {
        // Draw spectrum line
        ctx.strokeStyle = currentScheme.primary;
        ctx.lineWidth = 2;

        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        if (i === spectrum.length - 1) {
          ctx.stroke();
        }
      } else if (style === "filled") {
        // Draw filled area
        ctx.fillStyle = createGradient(ctx, 0, 0, 0, canvasHeight);

        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(x, canvasHeight);
          ctx.lineTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        if (i === spectrum.length - 1) {
          ctx.lineTo(canvasWidth, canvasHeight);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // Draw peak indicators
    drawPeakIndicators(ctx, canvasWidth, canvasHeight);
  };

  /**
   * Draw waveform
   */
  const drawWaveform = (ctx, canvasWidth, canvasHeight) => {
    if (!visualizationData.waveform) return;

    const waveform = visualizationData.waveform;
    const sliceWidth = canvasWidth / waveform.length;
    const centerY = canvasHeight / 2;

    ctx.lineWidth = 2;
    ctx.strokeStyle = currentScheme.primary;
    ctx.beginPath();

    for (let i = 0; i < waveform.length; i++) {
      const v = waveform[i] / 255;
      const y = centerY + (v - 0.5) * canvasHeight * config.sensitivity;
      const x = i * sliceWidth;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Add waveform reflection
    ctx.globalAlpha = 0.3;
    ctx.scale(1, -1);
    ctx.translate(0, -canvasHeight);
    ctx.stroke();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
  };

  /**
   * Draw spectrogram (time-frequency analysis)
   */
  const drawSpectrogram = (ctx, canvasWidth, canvasHeight) => {
    // Implementation would shift previous data and add new column
    // This is a simplified version
    if (!visualizationData.spectrum) return;

    const spectrum = visualizationData.spectrum;
    const columnWidth = 2;
    const x = canvasWidth - columnWidth;

    // Shift existing data left
    const imageData = ctx.getImageData(
      columnWidth,
      0,
      canvasWidth - columnWidth,
      canvasHeight,
    );
    ctx.putImageData(imageData, 0, 0);

    // Draw new column
    for (let i = 0; i < spectrum.length; i++) {
      const intensity = spectrum[i] / 255;
      const y = canvasHeight - (i / spectrum.length) * canvasHeight;
      const colorIndex = Math.floor(
        intensity * (currentScheme.gradient.length - 1),
      );

      ctx.fillStyle =
        currentScheme.gradient[colorIndex] || currentScheme.background;
      ctx.fillRect(x, y, columnWidth, canvasHeight / spectrum.length);
    }
  };

  /**
   * Draw combined visualization
   */
  const drawCombined = (ctx, canvasWidth, canvasHeight) => {
    const halfHeight = canvasHeight / 2;

    // Top half: Spectrum
    ctx.save();
    ctx.rect(0, 0, canvasWidth, halfHeight);
    ctx.clip();
    drawSpectrum(ctx, canvasWidth, halfHeight);
    ctx.restore();

    // Bottom half: Waveform
    ctx.save();
    ctx.translate(0, halfHeight);
    ctx.rect(0, 0, canvasWidth, halfHeight);
    ctx.clip();
    drawWaveform(ctx, canvasWidth, halfHeight);
    ctx.restore();

    // Divider line
    ctx.strokeStyle = currentScheme.secondary;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, halfHeight);
    ctx.lineTo(canvasWidth, halfHeight);
    ctx.stroke();
  };

  /**
   * Draw peak level indicators
   */
  const drawPeakIndicators = (ctx, canvasWidth, canvasHeight) => {
    if (!visualizationData.peakHistory) return;

    const peaks = visualizationData.peakHistory;
    const rms = visualizationData.rmsHistory;

    if (peaks.length === 0) return;

    const currentPeak = peaks[peaks.length - 1];
    const currentRMS = rms[rms.length - 1];

    // Peak meter on the right side
    const meterWidth = 20;
    const meterX = canvasWidth - meterWidth - 10;
    const meterHeight = canvasHeight - 40;
    const meterY = 20;

    // Background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

    // RMS level
    const rmsHeight = currentRMS * meterHeight;
    ctx.fillStyle = currentScheme.secondary;
    ctx.fillRect(
      meterX,
      meterY + meterHeight - rmsHeight,
      meterWidth,
      rmsHeight,
    );

    // Peak level
    const peakY = meterY + meterHeight - currentPeak * meterHeight;
    ctx.fillStyle = currentPeak > 0.9 ? "#ff4444" : currentScheme.primary;
    ctx.fillRect(meterX, peakY - 2, meterWidth, 4);

    // Labels
    ctx.fillStyle = "#ffffff";
    ctx.font = "10px monospace";
    ctx.fillText("PEAK", meterX - 30, meterY + 10);
    ctx.fillText("RMS", meterX - 30, meterY + 25);
  };

  /**
   * Create gradient for visualization
   */
  const createGradient = (ctx, x1, y1, x2, y2) => {
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    currentScheme.gradient.forEach((color, index) => {
      gradient.addColorStop(index / (currentScheme.gradient.length - 1), color);
    });
    return gradient;
  };

  /**
   * Handle configuration changes
   */
  const handleConfigChange = (property, value) => {
    setConfig((prev) => ({ ...prev, [property]: value }));
  };

  /**
   * Toggle animation
   */
  const toggleAnimation = () => {
    if (isAnimating) {
      stopAnimation();
    } else {
      startAnimation();
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Audio Visualizer
      </Typography>

      <Box sx={{ mb: 2 }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            width: "100%",
            maxWidth: width,
            height: "auto",
            border: "1px solid #333",
            borderRadius: "4px",
            background: currentScheme.background
          }}
        />
      </Box>

      {showControls && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isAnimating}
                  onChange={toggleAnimation}
                  color="primary"
                />
              }
              label="Animation"
            />

            <Button
              variant="outlined"
              onClick={() => {
                const canvas = canvasRef.current;
                if (canvas) {
                  const ctx = canvas.getContext("2d");
                  ctx.fillStyle = currentScheme.background;
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
              }}
            >
              Clear
            </Button>
          </Box>

          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Typography variant="body2" sx={{ minWidth: 80 }}>
              Sensitivity:
            </Typography>
            <Slider
              value={config.sensitivity}
              onChange={(_, value) => handleConfigChange("sensitivity", value)}
              min={0.1}
              max={3.0}
              step={0.1}
              sx={{ flex: 1 }}
              valueLabelDisplay="auto"
            />
          </Box>

          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Typography variant="body2" sx={{ minWidth: 80 }}>
              Smoothing:
            </Typography>
            <Slider
              value={config.smoothing}
              onChange={(_, value) => handleConfigChange("smoothing", value)}
              min={0.0}
              max={1.0}
              step={0.1}
              sx={{ flex: 1 }}
              valueLabelDisplay="auto"
            />
          </Box>

          {visualizationData && (
            <Box
              sx={{
                display: "flex",
                gap: 2,
                fontSize: "0.8rem",
                color: "text.secondary"
              }}
            >
              <span>
                Peak:{" "}
                {(
                  visualizationData.peakHistory?.[
                    visualizationData.peakHistory.length - 1
                  ] || 0
                ).toFixed(3)}
              </span>
              <span>
                RMS:{" "}
                {(
                  visualizationData.rmsHistory?.[
                    visualizationData.rmsHistory.length - 1
                  ] || 0
                ).toFixed(3)}
              </span>
              <span>FPS: {Math.round(1000 / 16)}</span>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default AudioVisualizer;
