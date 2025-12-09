import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Button,
  Chip,
  Alert,
  LinearProgress
} from "@mui/material";
import {
  Equalizer,
  Waves,
  Settings,
  Speed,
  HighQuality,
  NetworkCheck
} from "@mui/icons-material";
import AudioVisualizer from "./AudioVisualizer";
import CrossfadeControls from "./CrossfadeControls";
import { VolumeUp } from '@mui/icons-material/VolumeUp';

/**
 * AdvancedAudioControls - Complete audio control interface
 * Integrates all enhanced audio features including visualizer, crossfade controls,
 * EQ, adaptive streaming, buffer monitoring, and quality controls.
 */
const AdvancedAudioControls = ({
  productionEngine,
  webAudioProcessor,
  onConfigChange = null
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [engineStatus, setEngineStatus] = useState(null);
  const [audioAnalysis, setAudioAnalysis] = useState(null);
  const [networkStatus, setNetworkStatus] = useState(null);

  // Engine configuration state
  const [engineConfig, setEngineConfig] = useState({
    enableGapless: true,
    enableCrossfade: true,
    enableAdaptive: true,
    frameAccurateSeeking: true,
    analyticsEnabled: true
  });

  // Audio processing configuration
  const [audioConfig, setAudioConfig] = useState({
    enableEffects: false,
    enableVisualization: true,
    enableAnalysis: true
  });

  // EQ configuration
  const [eqConfig, setEqConfig] = useState({
    lowShelfGain: 0,
    lowShelfFreq: 320,
    midPeaking1Gain: 0,
    midPeaking1Freq: 800,
    midPeaking1Q: 1,
    midPeaking2Gain: 0,
    midPeaking2Freq: 3200,
    midPeaking2Q: 1,
    highShelfGain: 0,
    highShelfFreq: 8000
  });

  // Quality and streaming configuration
  const [streamingConfig, setStreamingConfig] = useState({
    quality: "high",
    adaptiveStreaming: true,
    bufferSize: "auto"
  });

  const qualityOptions = [
    { value: "low", label: "Low (128 kbps)", bandwidth: "150 kbps" },
    { value: "medium", label: "Medium (256 kbps)", bandwidth: "300 kbps" },
    { value: "high", label: "High (320 kbps)", bandwidth: "400 kbps" },
    { value: "ultra", label: "Ultra (Lossless)", bandwidth: "1.5 Mbps" },
  ];

  /**
   * Initialize engine listeners
   */
  useEffect(() => {
    if (!productionEngine) return;

    const unsubscribers = [
      // Engine status updates
      setInterval(() => {
        const status = productionEngine.getEngineStatus();
        setEngineStatus(status);
      }, 1000),

      // Audio analysis updates
      productionEngine.onAnalyticsUpdate((analytics) => {
        setAudioAnalysis(analytics);
      }),

      // Quality change notifications
      productionEngine.onQualityChange((qualityInfo) => {
        console.log("Quality changed:", qualityInfo);
      }),

      // Buffer status updates
      productionEngine.onBufferUpdate((bufferInfo) => {
        // Handle buffer status updates
      }),

      // Error handling
      productionEngine.onError((error) => {
        console.error("Production engine error:", error);
      }),
    ];

    return () => {
      unsubscribers.forEach((unsub) => {
        if (typeof unsub === "function") unsub();
        else if (typeof unsub === "number") clearInterval(unsub);
      });
    };
  }, [productionEngine]);

  /**
   * Initialize web audio processor listeners
   */
  useEffect(() => {
    if (!webAudioProcessor) return;

    const unsubscribers = [
      webAudioProcessor.onAnalysisUpdate((analysis) => {
        // Real-time audio analysis updates handled by visualizer
      }),

      webAudioProcessor.onNetworkUpdate?.((network) => {
        setNetworkStatus(network);
      }),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub && unsub());
    };
  }, [webAudioProcessor]);

  /**
   * Handle engine configuration changes
   */
  const handleEngineConfigChange = (property, value) => {
    const newConfig = { ...engineConfig, [property]: value };
    setEngineConfig(newConfig);

    if (productionEngine) {
      productionEngine.setConfig(newConfig);
    }

    if (onConfigChange) {
      onConfigChange({ engine: newConfig });
    }
  };

  /**
   * Handle audio processing configuration changes
   */
  const handleAudioConfigChange = (property, value) => {
    const newConfig = { ...audioConfig, [property]: value };
    setAudioConfig(newConfig);

    if (
      webAudioProcessor &&
      newConfig.enableEffects !== audioConfig.enableEffects
    ) {
      // Toggle effects processing
      console.log("Effects toggled:", newConfig.enableEffects);
    }

    if (onConfigChange) {
      onConfigChange({ audio: newConfig });
    }
  };

  /**
   * Handle EQ changes
   */
  const handleEQChange = (band, property, value) => {
    const key = `${band}${property.charAt(0).toUpperCase() + property.slice(1)}`;
    const newConfig = { ...eqConfig, [key]: value };
    setEqConfig(newConfig);

    if (webAudioProcessor) {
      const frequency = newConfig[`${band}Freq`];
      const gain = newConfig[`${band}Gain`];
      const q = newConfig[`${band}Q`] || 1;

      webAudioProcessor.setEQ(band, frequency, gain, q);
    }
  };

  /**
   * Handle streaming configuration changes
   */
  const handleStreamingConfigChange = (property, value) => {
    const newConfig = { ...streamingConfig, [property]: value };
    setStreamingConfig(newConfig);

    if (productionEngine) {
      if (property === "quality") {
        productionEngine.setQuality(value);
      } else if (property === "adaptiveStreaming") {
        productionEngine.setAdaptiveStreaming(value);
      }
    }

    if (onConfigChange) {
      onConfigChange({ streaming: newConfig });
    }
  };

  /**
   * Reset EQ to flat
   */
  const resetEQ = () => {
    const flatEQ = {
      lowShelfGain: 0,
      midPeaking1Gain: 0,
      midPeaking2Gain: 0,
      highShelfGain: 0
    };

    setEqConfig((prev) => ({ ...prev, ...flatEQ }));

    if (webAudioProcessor) {
      Object.keys(flatEQ).forEach((key) => {
        const band = key.replace("Gain", "");
        webAudioProcessor.setEQ(
          band,
          eqConfig[`${band}Freq`],
          0,
          eqConfig[`${band}Q`] || 1,
        );
      });
    }
  };

  /**
   * Tab panel component
   */
  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`advanced-audio-tabpanel-${index}`}
      aria-labelledby={`advanced-audio-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  /**
   * Get status color based on value
   */
  const getStatusColor = (value, thresholds) => {
    if (value >= thresholds.good) return "success";
    if (value >= thresholds.warning) return "warning";
    return "error";
  };

  return (
    <Paper elevation={3} sx={{ width: "100%", maxWidth: 1200, mx: "auto" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          aria-label="advanced audio controls tabs"
        >
          <Tab icon={<Waves />} label="Visualizer" />
          <Tab icon={<Equalizer />} label="Crossfade" />
          <Tab icon={<VolumeUp />} label="EQ & Effects" />
          <Tab icon={<HighQuality />} label="Quality" />
          <Tab icon={<Settings />} label="Engine" />
        </Tabs>
      </Box>

      {/* Status Bar */}
      {engineStatus && (
        <Box
          sx={{
            p: 2,
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider"
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Chip
                size="small"
                label={engineStatus.isInitialized ? "READY" : "INITIALIZING"}
                color={engineStatus.isInitialized ? "success" : "warning"}
              />
            </Grid>
            {engineStatus.bufferStatus && (
              <Grid item>
                <Typography variant="caption">
                  Buffer: {engineStatus.bufferStatus.bufferedAhead.toFixed(1)}s
                </Typography>
              </Grid>
            )}
            {engineStatus.streamingState && (
              <Grid item>
                <Typography variant="caption">
                  Quality:{" "}
                  {engineStatus.streamingState.currentQuality.toUpperCase()}
                </Typography>
              </Grid>
            )}
            {networkStatus && (
              <Grid item>
                <Typography variant="caption">
                  Network: {Math.round(networkStatus.bandwidth)} kbps
                </Typography>
              </Grid>
            )}
            {engineStatus.crossfadeActive && (
              <Grid item>
                <Chip size="small" label="CROSSFADE ACTIVE" color="primary" />
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        {/* Visualizer Tab */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <AudioVisualizer
              webAudioProcessor={webAudioProcessor}
              width={800}
              height={300}
              type="combined"
              colorScheme="spotify"
              showControls={true}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Visualization Settings
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={audioConfig.enableVisualization}
                      onChange={(e) =>
                        handleAudioConfigChange(
                          "enableVisualization",
                          e.target.checked,
                        )
                      }
                    />
                  }
                  label="Enable Visualization"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={audioConfig.enableAnalysis}
                      onChange={(e) =>
                        handleAudioConfigChange(
                          "enableAnalysis",
                          e.target.checked,
                        )
                      }
                    />
                  }
                  label="Enable Analysis"
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Audio Analysis
                </Typography>
                {audioAnalysis ? (
                  <Box>
                    <Typography variant="body2">
                      Tracks Played: {audioAnalysis.tracksPlayed}
                    </Typography>
                    <Typography variant="body2">
                      Total Playtime:{" "}
                      {Math.round(audioAnalysis.totalPlaytime / 1000)}s
                    </Typography>
                    <Typography variant="body2">
                      Quality Changes: {audioAnalysis.qualityChanges}
                    </Typography>
                    <Typography variant="body2">
                      Crossfade Events: {audioAnalysis.crossfadeEvents}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No analysis data available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {/* Crossfade Tab */}
        <CrossfadeControls
          crossfadeEngine={productionEngine?.crossfadeEngine}
          currentTrack={engineStatus?.currentTrack}
          nextTrack={engineStatus?.nextTrack}
          isActive={engineStatus?.crossfadeActive}
          onConfigChange={(config) => onConfigChange?.({ crossfade: config })}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {/* EQ & Effects Tab */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2
                  }}
                >
                  <Typography variant="h6">Equalizer</Typography>
                  <Button onClick={resetEQ} size="small">
                    Reset
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  {/* Low Shelf */}
                  <Grid item xs={12} sm={3}>
                    <Typography variant="body2" gutterBottom>
                      Bass ({eqConfig.lowShelfFreq} Hz)
                    </Typography>
                    <Slider
                      orientation="vertical"
                      value={eqConfig.lowShelfGain}
                      onChange={(_, value) =>
                        handleEQChange("lowShelf", "gain", value)
                      }
                      min={-12}
                      max={12}
                      step={0.5}
                      marks={[
                        { value: -12, label: "-12" },
                        { value: 0, label: "0" },
                        { value: 12, label: "+12" },
                      ]}
                      sx={{ height: 200 }}
                      valueLabelDisplay="auto"
                    />
                  </Grid>

                  {/* Mid Peaking 1 */}
                  <Grid item xs={12} sm={3}>
                    <Typography variant="body2" gutterBottom>
                      Mid 1 ({eqConfig.midPeaking1Freq} Hz)
                    </Typography>
                    <Slider
                      orientation="vertical"
                      value={eqConfig.midPeaking1Gain}
                      onChange={(_, value) =>
                        handleEQChange("midPeaking1", "gain", value)
                      }
                      min={-12}
                      max={12}
                      step={0.5}
                      marks={[
                        { value: -12, label: "-12" },
                        { value: 0, label: "0" },
                        { value: 12, label: "+12" },
                      ]}
                      sx={{ height: 200 }}
                      valueLabelDisplay="auto"
                    />
                  </Grid>

                  {/* Mid Peaking 2 */}
                  <Grid item xs={12} sm={3}>
                    <Typography variant="body2" gutterBottom>
                      Mid 2 ({eqConfig.midPeaking2Freq} Hz)
                    </Typography>
                    <Slider
                      orientation="vertical"
                      value={eqConfig.midPeaking2Gain}
                      onChange={(_, value) =>
                        handleEQChange("midPeaking2", "gain", value)
                      }
                      min={-12}
                      max={12}
                      step={0.5}
                      marks={[
                        { value: -12, label: "-12" },
                        { value: 0, label: "0" },
                        { value: 12, label: "+12" },
                      ]}
                      sx={{ height: 200 }}
                      valueLabelDisplay="auto"
                    />
                  </Grid>

                  {/* High Shelf */}
                  <Grid item xs={12} sm={3}>
                    <Typography variant="body2" gutterBottom>
                      Treble ({eqConfig.highShelfFreq} Hz)
                    </Typography>
                    <Slider
                      orientation="vertical"
                      value={eqConfig.highShelfGain}
                      onChange={(_, value) =>
                        handleEQChange("highShelf", "gain", value)
                      }
                      min={-12}
                      max={12}
                      step={0.5}
                      marks={[
                        { value: -12, label: "-12" },
                        { value: 0, label: "0" },
                        { value: 12, label: "+12" },
                      ]}
                      sx={{ height: 200 }}
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Audio Effects
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={audioConfig.enableEffects}
                      onChange={(e) =>
                        handleAudioConfigChange(
                          "enableEffects",
                          e.target.checked,
                        )
                      }
                    />
                  }
                  label="Enable Effects Processing"
                />
                {/* Additional effect controls would go here */}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        {/* Quality Tab */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Streaming Quality
                </Typography>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Quality Level</InputLabel>
                  <Select
                    value={streamingConfig.quality}
                    onChange={(e) =>
                      handleStreamingConfigChange("quality", e.target.value)
                    }
                    label="Quality Level"
                  >
                    {qualityOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box>
                          <Typography variant="body2">
                            {option.label}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {option.bandwidth}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      checked={streamingConfig.adaptiveStreaming}
                      onChange={(e) =>
                        handleStreamingConfigChange(
                          "adaptiveStreaming",
                          e.target.checked,
                        )
                      }
                    />
                  }
                  label="Adaptive Streaming"
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Network Status
                </Typography>
                {engineStatus?.streamingState ? (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Current Quality:{" "}
                        {engineStatus.streamingState.currentQuality.toUpperCase()}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Bandwidth:{" "}
                        {Math.round(
                          engineStatus.streamingState.networkMetrics.bandwidth,
                        )}{" "}
                        kbps
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Stability:{" "}
                        {Math.round(
                          engineStatus.streamingState.networkMetrics.stability *
                            100,
                        )}
                        %
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption">
                        Network Stability
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={
                          engineStatus.streamingState.networkMetrics.stability *
                          100
                        }
                        color={getStatusColor(
                          engineStatus.streamingState.networkMetrics.stability,
                          {
                            good: 0.8,
                            warning: 0.5
                          },
                        )}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>

                    {engineStatus.streamingState.performanceMetrics && (
                      <Box>
                        <Typography variant="caption">
                          Streaming Quality Score
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={
                            engineStatus.streamingState.performanceMetrics
                              .streamingQualityScore * 100
                          }
                          color={getStatusColor(
                            engineStatus.streamingState.performanceMetrics
                              .streamingQualityScore,
                            {
                              good: 0.8,
                              warning: 0.6
                            },
                          )}
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No network data available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        {/* Engine Tab */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Engine Configuration
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={engineConfig.enableGapless}
                      onChange={(e) =>
                        handleEngineConfigChange(
                          "enableGapless",
                          e.target.checked,
                        )
                      }
                    />
                  }
                  label="Gapless Playback"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={engineConfig.enableCrossfade}
                      onChange={(e) =>
                        handleEngineConfigChange(
                          "enableCrossfade",
                          e.target.checked,
                        )
                      }
                    />
                  }
                  label="Crossfade Transitions"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={engineConfig.enableAdaptive}
                      onChange={(e) =>
                        handleEngineConfigChange(
                          "enableAdaptive",
                          e.target.checked,
                        )
                      }
                    />
                  }
                  label="Adaptive Streaming"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={engineConfig.frameAccurateSeeking}
                      onChange={(e) =>
                        handleEngineConfigChange(
                          "frameAccurateSeeking",
                          e.target.checked,
                        )
                      }
                    />
                  }
                  label="Frame-Accurate Seeking"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={engineConfig.analyticsEnabled}
                      onChange={(e) =>
                        handleEngineConfigChange(
                          "analyticsEnabled",
                          e.target.checked,
                        )
                      }
                    />
                  }
                  label="Analytics & Monitoring"
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Engine Status
                </Typography>
                {engineStatus ? (
                  <Box>
                    <Typography variant="body2">
                      Status:{" "}
                      {engineStatus.isInitialized
                        ? "Initialized"
                        : "Initializing"}
                    </Typography>
                    <Typography variant="body2">
                      Mode: {engineStatus.playbackMode}
                    </Typography>
                    {engineStatus.bufferStatus && (
                      <>
                        <Typography variant="body2">
                          Buffer Health:{" "}
                          {Math.round(
                            engineStatus.bufferStatus.bufferHealth * 100,
                          )}
                          %
                        </Typography>
                        <Typography variant="body2">
                          Network Quality:{" "}
                          {Math.round(
                            engineStatus.bufferStatus.networkQuality * 100,
                          )}
                          %
                        </Typography>
                      </>
                    )}
                    {engineStatus.analytics && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2">
                          Session Analytics
                        </Typography>
                        <Typography variant="caption" display="block">
                          Errors: {engineStatus.analytics.errors.length}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Seek Events: {engineStatus.analytics.seekEvents}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Engine not available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Paper>
  );
};

export default AdvancedAudioControls;
