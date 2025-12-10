import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Slider,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  LinearProgress,
  Chip,
  Grid,
  IconButton
} from "@mui/material";
import {
import { PlayArrow } from '@mui/icons-material/PlayArrow';
  PlayArrow,
  Stop,
  Settings,
  MusicNote,
  Equalizer,
  Waves
} from "@mui/icons-material";

/**
 * CrossfadeControls - Advanced crossfade control interface
 * Provides intuitive controls for crossfade duration, curve types, beat matching,
 * and real-time crossfade monitoring with professional DJ-style interface.
 */
const CrossfadeControls = ({
  crossfadeEngine,
  isActive = false,
  currentTrack = null,
  nextTrack = null,
  onCrossfadeStart = null,
  onCrossfadeStop = null,
  onConfigChange = null
}) => {
  const [config, setConfig] = useState({
    duration: 8,
    curve: "smooth",
    beatSync: true,
    autoEQ: true,
    enableAnalysis: true
  });

  const [crossfadeState, setCrossfadeState] = useState({
    active: false,
    progress: 0,
    timeRemaining: 0,
    phase: "idle", // 'idle', 'analyzing', 'ready', 'active', 'complete'
  });

  const [trackAnalysis, setTrackAnalysis] = useState({
    current: null,
    next: null
  });

  const [beatInfo, setBeatInfo] = useState({
    bpm: 0,
    confidence: 0,
    nextBeatIn: 0
  });

  // Crossfade curve options
  const curveOptions = [
    { value: "linear", label: "Linear", description: "Equal power fade" },
    { value: "smooth", label: "Smooth", description: "S-curve transition" },
    {
      value: "logarithmic",
      label: "Logarithmic",
      description: "Natural decay"
    },
    { value: "exponential", label: "Exponential", description: "Quick fade" },
  ];

  /**
   * Initialize crossfade engine listeners
   */
  useEffect(() => {
    if (!crossfadeEngine) return;

    const unsubscribers = [
      crossfadeEngine.onCrossfadeStart((info) => {
        setCrossfadeState((prev) => ({
          ...prev,
          active: true,
          phase: "active",
          timeRemaining: info.duration || config.duration
        }));
      }),

      crossfadeEngine.onCrossfadeProgress((progress) => {
        setCrossfadeState((prev) => ({
          ...prev,
          progress: progress.progress,
          timeRemaining: progress.timeRemaining
        }));
      }),

      crossfadeEngine.onCrossfadeComplete(() => {
        setCrossfadeState((prev) => ({
          ...prev,
          active: false,
          progress: 1,
          timeRemaining: 0,
          phase: "complete"
        }));

        // Reset to idle after a brief delay
        setTimeout(() => {
          setCrossfadeState((prev) => ({
            ...prev,
            phase: "idle",
            progress: 0
          }));
        }, 1000);
      }),

      crossfadeEngine.onBeatDetected((info) => {
        setBeatInfo({
          bpm: info.bpm,
          confidence: info.confidence,
          nextBeatIn: calculateNextBeatTime(info.bpm)
        });
      }),

      crossfadeEngine.onTempoAnalyzed((analysis) => {
        if (analysis) {
          setTrackAnalysis((prev) => ({
            ...prev,
            [analysis.position || "current"]: analysis
          }));
        }
      }),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub && unsub());
    };
  }, [crossfadeEngine, config.duration]);

  /**
   * Calculate time to next beat
   */
  const calculateNextBeatTime = (bpm) => {
    if (bpm <= 0) return 0;
    const beatDuration = 60 / bpm;
    const now = Date.now();
    return beatDuration - ((now / 1000) % beatDuration);
  };

  /**
   * Handle configuration changes
   */
  const handleConfigChange = (property, value) => {
    const newConfig = { ...config, [property]: value };
    setConfig(newConfig);

    // Update crossfade engine configuration
    if (crossfadeEngine) {
      crossfadeEngine.setConfig(newConfig);
    }

    // Notify parent component
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  };

  /**
   * Start crossfade with current configuration
   */
  const startCrossfade = async () => {
    if (!crossfadeEngine || !nextTrack || crossfadeState.active) return;

    setCrossfadeState((prev) => ({ ...prev, phase: "analyzing" }));

    try {
      await crossfadeEngine.startCrossfade({
        duration: config.duration,
        curve: config.curve,
        beatSync: config.beatSync,
        autoEQ: config.autoEQ
      });

      if (onCrossfadeStart) {
        onCrossfadeStart(config);
      }
    } catch (error) {
      console.error("Failed to start crossfade:", error);
      setCrossfadeState((prev) => ({ ...prev, phase: "idle" }));
    }
  };

  /**
   * Stop active crossfade
   */
  const stopCrossfade = () => {
    if (!crossfadeEngine || !crossfadeState.active) return;

    crossfadeEngine.stopCrossfade();
    setCrossfadeState({
      active: false,
      progress: 0,
      timeRemaining: 0,
      phase: "idle"
    });

    if (onCrossfadeStop) {
      onCrossfadeStop();
    }
  };

  /**
   * Get crossfade readiness status
   */
  const getCrossfadeReadiness = () => {
    if (!currentTrack || !nextTrack) {
      return { ready: false, reason: "No tracks loaded" };
    }

    if (crossfadeState.active) {
      return { ready: false, reason: "Crossfade in progress" };
    }

    if (config.beatSync && beatInfo.bpm === 0) {
      return { ready: false, reason: "Analyzing tempo..." };
    }

    return { ready: true, reason: "Ready to crossfade" };
  };

  const readiness = getCrossfadeReadiness();

  /**
   * Format time display
   */
  const formatTime = (seconds) => {
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
  };

  /**
   * Get phase color
   */
  const getPhaseColor = (phase) => {
    switch (phase) {
      case "analyzing":
        return "warning";
      case "ready":
        return "success";
      case "active":
        return "primary";
      case "complete":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Waves sx={{ mr: 1, color: "primary.main" }} />
        <Typography variant="h6">Crossfade Controls</Typography>
        <Box sx={{ ml: "auto" }}>
          <Chip
            label={crossfadeState.phase.toUpperCase()}
            color={getPhaseColor(crossfadeState.phase)}
            size="small"
          />
        </Box>
      </Box>

      {/* Track Information */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Current Track
            </Typography>
            {currentTrack ? (
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  {currentTrack.title || currentTrack.name}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {currentTrack.artist}
                </Typography>
                {trackAnalysis.current && (
                  <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                    <Chip
                      size="small"
                      label={`${trackAnalysis.current.bpm} BPM`}
                    />
                    <Chip
                      size="small"
                      label={`Key: ${trackAnalysis.current.key || "Unknown"}`}
                    />
                  </Box>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No track loaded
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={6}>
          <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Next Track
            </Typography>
            {nextTrack ? (
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  {nextTrack.title || nextTrack.name}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {nextTrack.artist}
                </Typography>
                {trackAnalysis.next && (
                  <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                    <Chip
                      size="small"
                      label={`${trackAnalysis.next.bpm} BPM`}
                    />
                    <Chip
                      size="small"
                      label={`Key: ${trackAnalysis.next.key || "Unknown"}`}
                    />
                  </Box>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No next track
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Crossfade Progress */}
      {crossfadeState.active && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2">Crossfade Progress</Typography>
            <Typography variant="body2">
              {formatTime(crossfadeState.timeRemaining)} remaining
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={crossfadeState.progress * 100}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      )}

      {/* Beat Information */}
      {config.beatSync && beatInfo.bpm > 0 && (
        <Box sx={{ mb: 3 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <MusicNote sx={{ mr: 1, color: "primary.main" }} />
              <Typography variant="subtitle2">Beat Sync Information</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="caption" color="textSecondary">
                  Tempo
                </Typography>
                <Typography variant="h6">{beatInfo.bpm} BPM</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="textSecondary">
                  Confidence
                </Typography>
                <Typography variant="h6">
                  {Math.round(beatInfo.confidence * 100)}%
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="textSecondary">
                  Next Beat
                </Typography>
                <Typography variant="h6">
                  {beatInfo.nextBeatIn.toFixed(1)}s
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      )}

      {/* Configuration Controls */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Crossfade Settings
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" gutterBottom>
              Duration: {config.duration}s
            </Typography>
            <Slider
              value={config.duration}
              onChange={(_, value) => handleConfigChange("duration", value)}
              min={2}
              max={30}
              step={0.5}
              marks={[
                { value: 2, label: "2s" },
                { value: 8, label: "8s" },
                { value: 15, label: "15s" },
                { value: 30, label: "30s" },
              ]}
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Crossfade Curve</InputLabel>
              <Select
                value={config.curve}
                onChange={(e) => handleConfigChange("curve", e.target.value)}
                label="Crossfade Curve"
              >
                {curveOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box>
                      <Typography variant="body2">{option.label}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {option.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={config.beatSync}
                onChange={(e) =>
                  handleConfigChange("beatSync", e.target.checked)
                }
                color="primary"
              />
            }
            label="Beat Sync"
          />
          <FormControlLabel
            control={
              <Switch
                checked={config.autoEQ}
                onChange={(e) => handleConfigChange("autoEQ", e.target.checked)}
                color="primary"
              />
            }
            label="Auto EQ Matching"
            sx={{ ml: 2 }}
          />
        </Box>
      </Box>

      {/* Control Buttons */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PlayArrow />}
          onClick={startCrossfade}
          disabled={!readiness.ready}
          size="large"
        >
          Start Crossfade
        </Button>

        {crossfadeState.active && (
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<Stop />}
            onClick={stopCrossfade}
            size="large"
          >
            Stop
          </Button>
        )}

        <IconButton
          color="default"
          onClick={() => {
            // Open advanced settings dialog
            console.log("Open advanced settings");
          }}
        >
          <Settings />
        </IconButton>
      </Box>

      {/* Status Message */}
      <Box sx={{ mt: 2, textAlign: "center" }}>
        <Typography
          variant="body2"
          color={readiness.ready ? "success.main" : "text.secondary"}
        >
          {readiness.reason}
        </Typography>
      </Box>

      {/* Crossfade Curve Preview */}
      {config.curve && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Crossfade Curve Preview
          </Typography>
          <Paper
            variant="outlined"
            sx={{ p: 2, height: 100, position: "relative" }}
          >
            <svg width="100%" height="100%" viewBox="0 0 200 100">
              <CrossfadeCurvePreview curve={config.curve} />
            </svg>
          </Paper>
        </Box>
      )}
    </Paper>
  );
};

/**
 * Crossfade curve preview component
 */
const CrossfadeCurvePreview = ({ curve }) => {
  const generateCurvePoints = (curveType) => {
    const points = [];
    const steps = 50;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
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
          const angle = (t * Math.PI) / 2;
          currentLevel = Math.cos(angle);
          nextLevel = Math.sin(angle);
          break;
      }

      points.push({
        x: t * 200,
        currentY: (1 - currentLevel) * 100,
        nextY: (1 - nextLevel) * 100
      });
    }

    return points;
  };

  const points = generateCurvePoints(curve);

  const currentPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.currentY}`)
    .join(" ");

  const nextPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.nextY}`)
    .join(" ");

  return (
    <g>
      {/* Grid lines */}
      <defs>
        <pattern id="grid" width="20" height="10" patternUnits="userSpaceOnUse">
          <path
            d="M 20 0 L 0 0 0 10"
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="200" height="100" fill="url(#grid)" />

      {/* Current track curve */}
      <path
        d={currentPath}
        fill="none"
        stroke="#1976d2"
        strokeWidth="2"
        opacity="0.8"
      />

      {/* Next track curve */}
      <path
        d={nextPath}
        fill="none"
        stroke="#dc004e"
        strokeWidth="2"
        opacity="0.8"
      />

      {/* Labels */}
      <text x="10" y="15" fontSize="10" fill="#1976d2">
        Current
      </text>
      <text x="140" y="95" fontSize="10" fill="#dc004e">
        Next
      </text>
    </g>
  );
};

export default CrossfadeControls;
