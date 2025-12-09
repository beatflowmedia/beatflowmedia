import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Slider,
  Button,
  Chip,
  Dialog,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery
} from "@mui/material";
import {
  PlayArrow,
  Settings,
  HighQuality,
  Waves
} from "@mui/icons-material";
import { useEnhancedPlayer } from "../context/EnhancedPlayerContext";
import AdvancedAudioControls from "./AdvancedAudioControls";
import PlaybackControls from "./PlaybackControls";
import { SkipNext } from '@mui/icons-material/SkipNext';
import { SkipPrevious } from '@mui/icons-material/SkipPrevious';
import { VolumeUp } from '@mui/icons-material/VolumeUp';
import { Pause } from '@mui/icons-material/Pause';
import { PlayArrow } from '@mui/icons-material/PlayArrow';

/**
 * EnhancedAudioPlayer - Complete audio player with production-grade features
 * Integrates all enhanced audio capabilities including gapless playback,
 * crossfade, adaptive streaming, visualization, and advanced controls.
 */
const EnhancedAudioPlayer = ({
  showAdvancedControls = false,
  compact = false,
  showVisualization = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { state, dispatch, actions, enhancedControls, engineInitialized } =
    useEnhancedPlayer();

  const [advancedDialogOpen, setAdvancedDialogOpen] = useState(false);
  const [statusInfo, setStatusInfo] = useState(null);

  // Get current track info
  const currentTrack = state.queue[state.currentIndex];
  const nextTrack = state.queue[state.currentIndex + 1];

  // Update status info periodically
  useEffect(() => {
    if (!engineInitialized) return;

    const updateInterval = setInterval(() => {
      const engineStatus = enhancedControls.getEngineStatus();
      setStatusInfo(engineStatus);
    }, 1000);

    return () => clearInterval(updateInterval);
  }, [engineInitialized, enhancedControls]);

  /**
   * Format time for display
   */
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  /**
   * Handle seek
   */
  const handleSeek = (_, value) => {
    dispatch({ type: actions.SET_CURRENT_TIME, payload: value });
  };

  /**
   * Handle volume change
   */
  const handleVolumeChange = (_, value) => {
    dispatch({ type: actions.SET_VOLUME, payload: value / 100 });
  };

  /**
   * Toggle play/pause
   */
  const togglePlayback = () => {
    dispatch({ type: actions.TOGGLE_PLAY });
  };

  /**
   * Skip to next track
   */
  const skipNext = () => {
    dispatch({ type: actions.SKIP_NEXT });
  };

  /**
   * Skip to previous track
   */
  const skipPrevious = () => {
    dispatch({ type: actions.SKIP_PREVIOUS });
  };

  /**
   * Get quality indicator color
   */
  const getQualityColor = (quality) => {
    switch (quality) {
      case "ultra":
        return "success";
      case "high":
        return "primary";
      case "medium":
        return "warning";
      case "low":
        return "error";
      default:
        return "default";
    }
  };

  /**
   * Get network status color
   */
  const getNetworkStatusColor = (quality) => {
    if (quality >= 0.8) return "success";
    if (quality >= 0.5) return "warning";
    return "error";
  };

  // Compact view for mobile or minimal UI
  if (compact) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          maxWidth: "100%"
        }}
      >
        {/* Track Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {currentTrack ? (
            <>
              <Typography variant="body2" noWrap>
                {currentTrack.title || currentTrack.name}
              </Typography>
              <Typography variant="caption" color="textSecondary" noWrap>
                {currentTrack.artist}
              </Typography>
            </>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No track loaded
            </Typography>
          )}
        </Box>

        {/* Playback Controls */}
        <IconButton onClick={skipPrevious} size="small">
          <SkipPrevious />
        </IconButton>

        <IconButton
          onClick={togglePlayback}
          sx={{
            bgcolor: "primary.main",
            color: "primary.contrastText",
            "&:hover": { bgcolor: "primary.dark" }
          }}
        >
          {state.isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>

        <IconButton onClick={skipNext} size="small">
          <SkipNext />
        </IconButton>

        {/* Status Indicators */}
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {state.crossfadeActive && (
            <Chip size="small" label="CROSSFADE" color="primary" />
          )}
          {state.gaplessEnabled && (
            <Chip size="small" label="GAPLESS" color="success" />
          )}
        </Box>

        {/* Advanced Controls Toggle */}
        <IconButton onClick={() => setAdvancedDialogOpen(true)} size="small">
          <Settings />
        </IconButton>
      </Paper>
    );
  }

  // Full player view
  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: "100%" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Waves sx={{ mr: 1, color: "primary.main" }} />
        <Typography variant="h6" sx={{ flex: 1 }}>
          Enhanced Audio Player
        </Typography>

        {/* Status Indicators */}
        <Box sx={{ display: "flex", gap: 1, mr: 2 }}>
          <Chip
            size="small"
            label={state.currentQuality.toUpperCase()}
            color={getQualityColor(state.currentQuality)}
          />

          {state.adaptiveStreamingEnabled && (
            <Chip size="small" label="ADAPTIVE" color="info" />
          )}

          {state.crossfadeActive && (
            <Chip size="small" label="CROSSFADE" color="primary" />
          )}

          {statusInfo?.bufferStatus && (
            <Chip
              size="small"
              label={`BUFFER: ${Math.round(statusInfo.bufferStatus.bufferedAhead)}s`}
              color={getNetworkStatusColor(
                statusInfo.bufferStatus.bufferHealth,
              )}
            />
          )}
        </Box>

        <IconButton onClick={() => setAdvancedDialogOpen(true)} color="primary">
          <Settings />
        </IconButton>
      </Box>

      {/* Track Information */}
      <Box sx={{ mb: 3 }}>
        {currentTrack ? (
          <Box>
            <Typography variant="h5" gutterBottom>
              {currentTrack.title || currentTrack.name}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
              {currentTrack.artist}
            </Typography>
            {currentTrack.album && (
              <Typography variant="body2" color="textSecondary">
                {currentTrack.album}
              </Typography>
            )}
          </Box>
        ) : (
          <Box>
            <Typography variant="h5" color="textSecondary">
              No track loaded
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Add tracks to your queue to start playing
            </Typography>
          </Box>
        )}

        {/* Next Track Preview */}
        {nextTrack && state.gaplessEnabled && (
          <Box
            sx={{ mt: 2, p: 1, bgcolor: "background.default", borderRadius: 1 }}
          >
            <Typography variant="caption" color="textSecondary">
              Up next:
            </Typography>
            <Typography variant="body2">
              {nextTrack.title || nextTrack.name} - {nextTrack.artist}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Progress Bar */}
      <Box sx={{ mb: 3 }}>
        <Slider
          value={state.currentTime}
          max={state.duration || 100}
          onChange={handleSeek}
          sx={{ mb: 1 }}
          disabled={!currentTrack}
        />

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption">
            {formatTime(state.currentTime)}
          </Typography>
          <Typography variant="caption">
            {formatTime(state.duration)}
          </Typography>
        </Box>
      </Box>

      {/* Main Controls */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 3
        }}
      >
        <PlaybackControls />
      </Box>

      {/* Volume Control */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <VolumeUp />
        <Slider
          value={state.volume * 100}
          onChange={handleVolumeChange}
          sx={{ flex: 1 }}
          max={100}
          min={0}
        />
        <Typography variant="body2" sx={{ minWidth: 40 }}>
          {Math.round(state.volume * 100)}%
        </Typography>
      </Box>

      {/* Enhanced Features Toggle */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button
          variant={state.gaplessEnabled ? "contained" : "outlined"}
          size="small"
          onClick={() => dispatch({ type: actions.TOGGLE_GAPLESS })}
        >
          Gapless
        </Button>

        <Button
          variant={state.crossfadeEnabled ? "contained" : "outlined"}
          size="small"
          onClick={() => dispatch({ type: actions.TOGGLE_CROSSFADE })}
        >
          Crossfade
        </Button>

        <Button
          variant={state.adaptiveStreamingEnabled ? "contained" : "outlined"}
          size="small"
          onClick={() => dispatch({ type: actions.TOGGLE_ADAPTIVE_STREAMING })}
        >
          Adaptive
        </Button>

        <Button
          variant={state.visualizationEnabled ? "contained" : "outlined"}
          size="small"
          onClick={() => enhancedControls.toggleVisualization()}
        >
          Visualizer
        </Button>

        {state.crossfadeEnabled && nextTrack && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => enhancedControls.startCrossfade()}
            disabled={state.crossfadeActive}
          >
            Start Crossfade
          </Button>
        )}
      </Box>

      {/* Advanced Controls Dialog */}
      <Dialog
        open={advancedDialogOpen}
        onClose={() => setAdvancedDialogOpen(false)}
        maxWidth="xl"
        fullWidth
        fullScreen={isMobile}
      >
        <AppBar sx={{ position: "relative" }}>
          <Toolbar>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              Advanced Audio Controls
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={() => setAdvancedDialogOpen(false)}
              aria-label="close"
            >
              <Close />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 2 }}>
          <AdvancedAudioControls
            productionEngine={enhancedControls.getAudioEngine()}
            webAudioProcessor={enhancedControls.getWebAudioProcessor()}
            onConfigChange={(config) => {
              console.log("Advanced config changed:", config);
            }}
          />
        </Box>
      </Dialog>

      {/* Engine Status (Development Mode) */}
      {process.env.NODE_ENV === "development" && statusInfo && (
        <Box
          sx={{ mt: 2, p: 1, bgcolor: "background.default", borderRadius: 1 }}
        >
          <Typography variant="caption" display="block">
            Engine: {engineInitialized ? "Ready" : "Initializing"} | Mode:{" "}
            {state.engineMode} | Tracks: {state.sessionAnalytics.tracksPlayed} |
            Errors: {state.sessionAnalytics.errors.length}
          </Typography>
          {statusInfo.analytics && (
            <Typography variant="caption" display="block">
              Playtime: {Math.round(statusInfo.analytics.totalPlaytime / 1000)}s
              | Quality Changes: {statusInfo.analytics.qualityChanges} |
              Crossfades: {statusInfo.analytics.crossfadeEvents}
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default EnhancedAudioPlayer;
