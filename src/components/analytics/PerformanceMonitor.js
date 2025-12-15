// src/components/analytics/PerformanceMonitor.js
// Real-time performance monitoring dashboard with alerting capabilities

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  IconButton
} from "@mui/material";
import {
  Speed as SpeedIcon,
  Error as ErrorIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from "@mui/icons-material";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title as ChartTooltip,
  Legend,
  Filler
} from "chart.js";
import AlertingSystem from "../../services/analytics/AlertingSystem";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler,
);

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    response_time: 0,
    error_rate: 0,
    throughput: 0,
    memory_usage: 0,
    cpu_usage: 0,
    disk_usage: 0,
    active_connections: 0,
    buffer_health: 100,
    cache_hit_ratio: 0
  });

  const [alerts, setAlerts] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [alertConfigOpen, setAlertConfigOpen] = useState(false);
  const [alertSettings, setAlertSettings] = useState({});
  const [performanceHistory, setPerformanceHistory] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const chartRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Initialize alerting system
    initializeAlerting();

    // Start monitoring
    startMonitoring();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const initializeAlerting = () => {
    // Subscribe to all alerts
    AlertingSystem.subscribe("*", handleAlert);

    // Get current alert settings
    const activeAlerts = AlertingSystem.getActiveAlerts();
    setAlertSettings(
      activeAlerts.reduce((settings, alert) => {
        settings[alert.id] = {
          enabled: alert.active,
          threshold: alert.threshold,
          severity: alert.severity
        };
        return settings;
      }, {}),
    );
  };

  const handleAlert = (alertEvent) => {
    setAlerts((prev) => [alertEvent, ...prev.slice(0, 9)]); // Keep last 10 alerts
    setAlertHistory((prev) => [alertEvent, ...prev.slice(0, 99)]); // Keep last 100 in history
  };

  const startMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (isMonitoring) {
        fetchMetrics();
      }
    }, 5000); // Update every 5 seconds
  };

  const fetchMetrics = async () => {
    try {
      // Simulate real-time metrics (replace with actual API calls)
      const newMetrics = {
        response_time: Math.random() * 2000 + 100, // 100-2100ms
        error_rate: Math.random() * 5, // 0-5%
        throughput: Math.random() * 1000 + 500, // 500-1500 req/min
        memory_usage: Math.random() * 40 + 50, // 50-90%
        cpu_usage: Math.random() * 30 + 20, // 20-50%
        disk_usage: Math.random() * 20 + 60, // 60-80%
        active_connections: Math.floor(Math.random() * 500 + 100), // 100-600
        buffer_health: Math.random() * 30 + 70, // 70-100%
        cache_hit_ratio: Math.random() * 20 + 75, // 75-95%
      };

      setMetrics(newMetrics);
      setLastUpdate(Date.now());

      // Add to history
      setPerformanceHistory((prev) => [
        ...prev.slice(-59), // Keep last 60 data points (5 minutes)
        {
          timestamp: Date.now(),
          ...newMetrics
        },
      ]);

      // Check alerts
      AlertingSystem.checkAlerts(newMetrics);
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    }
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    if (!isMonitoring) {
      startMonitoring();
    } else {
      clearInterval(intervalRef.current);
    }
  };

  const refreshMetrics = () => {
    fetchMetrics();
  };

  const getMetricStatus = (value, thresholds) => {
    if (value > thresholds.critical) return "critical";
    if (value > thresholds.warning) return "warning";
    return "healthy";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "critical":
        return "#f44336";
      case "warning":
        return "#ff9800";
      case "healthy":
        return "#4caf50";
      default:
        return "#2196f3";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "critical":
        return <ErrorIcon />;
      case "warning":
        return <WarningIcon />;
      case "healthy":
        return <CheckCircleIcon />;
      default:
        return <CheckCircleIcon />;
    }
  };

  const dismissAlert = (alertId) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  };

  const performanceChartData = {
    labels: performanceHistory.slice(-20).map((_, i) => i * 5 + "s"),
    datasets: [
      {
        label: "Response Time (ms)",
        data: performanceHistory.slice(-20).map((h) => h.response_time),
        borderColor: "#2196f3",
        backgroundColor: "rgba(33, 150, 243, 0.1)",
        fill: true,
        tension: 0.4
      },
      {
        label: "Error Rate (%)",
        data: performanceHistory.slice(-20).map((h) => h.error_rate),
        borderColor: "#f44336",
        backgroundColor: "rgba(244, 67, 54, 0.1)",
        fill: true,
        tension: 0.4,
        yAxisID: "y1"
      },
    ]
  };

  const performanceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: {
          display: true,
          text: "Response Time (ms)"
        }
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        title: {
          display: true,
          text: "Error Rate (%)"
        },
        grid: {
          drawOnChartArea: false
        }
      }
    },
    plugins: {
      legend: {
        position: "top"
      },
      title: {
        display: true,
        text: "Performance Trends (Last 100 seconds)"
      }
    }
  };

  const systemHealthData = {
    labels: ["CPU", "Memory", "Disk", "Network"],
    datasets: [
      {
        data: [
          metrics.cpu_usage,
          metrics.memory_usage,
          metrics.disk_usage,
          100 - metrics.cache_hit_ratio,
        ],
        backgroundColor: [
          getStatusColor(
            getMetricStatus(metrics.cpu_usage, { warning: 70, critical: 90 }),
          ),
          getStatusColor(
            getMetricStatus(metrics.memory_usage, {
              warning: 80,
              critical: 95
            }),
          ),
          getStatusColor(
            getMetricStatus(metrics.disk_usage, { warning: 85, critical: 95 }),
          ),
          getStatusColor(
            getMetricStatus(100 - metrics.cache_hit_ratio, {
              warning: 20,
              critical: 30
            }),
          ),
        ],
        borderWidth: 2,
        borderColor: "#fff"
      },
    ]
  };

  const systemHealthOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom"
      },
      title: {
        display: true,
        text: "System Resource Usage"
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3
        }}
      >
        <Typography variant="h4" component="h1">
          Performance Monitor
        </Typography>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Chip
            label={isMonitoring ? "Live" : "Paused"}
            color={isMonitoring ? "success" : "default"}
            icon={isMonitoring ? <CheckCircleIcon /> : <CancelIcon />}
          />

          <Typography variant="caption" color="text.secondary">
            Last update: {new Date(lastUpdate).toLocaleTimeString()}
          </Typography>

          <IconButton onClick={refreshMetrics} size="small">
            <RefreshIcon />
          </IconButton>

          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setAlertConfigOpen(true)}
            size="small"
          >
            Alert Settings
          </Button>

          <Button
            variant={isMonitoring ? "outlined" : "contained"}
            onClick={toggleMonitoring}
            color={isMonitoring ? "secondary" : "primary"}
            size="small"
          >
            {isMonitoring ? "Pause" : "Resume"}
          </Button>
        </Box>
      </Box>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}
          >
            <NotificationsIcon color="warning" />
            Active Alerts ({alerts.length})
          </Typography>

          {alerts.slice(0, 3).map((alert) => (
            <Alert
              key={alert.id}
              severity={
                alert.severity === "critical" ? "error" : alert.severity
              }
              onClose={() => dismissAlert(alert.id)}
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle2">{alert.message}</Typography>
              <Typography variant="caption" color="text.secondary">
                {alert.metric}: {alert.value} (threshold: {alert.threshold})
              </Typography>
            </Alert>
          ))}
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Key Metrics */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Key Performance Metrics
              </Typography>

              <Grid container spacing={2}>
                {[
                  {
                    label: "Response Time",
                    value: `${Math.round(metrics.response_time)}ms`,
                    icon: <SpeedIcon />,
                    status: getMetricStatus(metrics.response_time, {
                      warning: 1000,
                      critical: 2000
                    }),
                    trend:
                      performanceHistory.length > 1
                        ? metrics.response_time >
                          performanceHistory[performanceHistory.length - 2]
                            ?.response_time
                          ? "up"
                          : "down"
                        : "stable"
                  },
                  {
                    label: "Error Rate",
                    value: `${metrics.error_rate.toFixed(2)}%`,
                    icon: <ErrorIcon />,
                    status: getMetricStatus(metrics.error_rate, {
                      warning: 2,
                      critical: 5
                    }),
                    trend: "stable"
                  },
                  {
                    label: "Throughput",
                    value: `${Math.round(metrics.throughput)}/min`,
                    icon: <NetworkIcon />,
                    status: "healthy",
                    trend: "up"
                  },
                  {
                    label: "Active Connections",
                    value: metrics.active_connections.toString(),
                    icon: <NetworkIcon />,
                    status: "healthy",
                    trend: "stable"
                  },
                ].map((metric, index) => (
                  <Grid item xs={6} sm={3} key={index}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: "center", py: 2 }}>
                        <Box
                          sx={{ color: getStatusColor(metric.status), mb: 1 }}
                        >
                          {metric.icon}
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{ color: getStatusColor(metric.status) }}
                        >
                          {metric.value}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 0.5
                          }}
                        >
                          {metric.label}
                          {metric.trend === "up" && (
                            <TrendingUpIcon fontSize="small" />
                          )}
                          {metric.trend === "down" && (
                            <TrendingDownIcon fontSize="small" />
                          )}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* System Health */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                System Health
              </Typography>
              <Box sx={{ height: 200 }}>
                <Doughnut
                  data={systemHealthData}
                  options={systemHealthOptions}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Trends */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Performance Trends
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line
                  ref={chartRef}
                  data={performanceChartData}
                  options={performanceChartOptions}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Resource Usage Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Resource Usage
              </Typography>

              {[
                {
                  label: "CPU Usage",
                  value: metrics.cpu_usage,
                  icon: <SpeedIcon />,
                  max: 100
                },
                {
                  label: "Memory Usage",
                  value: metrics.memory_usage,
                  icon: <MemoryIcon />,
                  max: 100
                },
                {
                  label: "Disk Usage",
                  value: metrics.disk_usage,
                  icon: <StorageIcon />,
                  max: 100
                },
                {
                  label: "Cache Hit Ratio",
                  value: metrics.cache_hit_ratio,
                  icon: <StorageIcon />,
                  max: 100
                },
              ].map((resource, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {resource.icon}
                      <Typography variant="body2">{resource.label}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="bold">
                      {resource.value.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={resource.value}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "grey.200",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: getStatusColor(
                          getMetricStatus(resource.value, {
                            warning: 70,
                            critical: 90
                          }),
                        )
                      }
                    }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Buffer Health */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Audio Buffer Health
              </Typography>

              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography
                  variant="h3"
                  sx={{ color: getStatusColor("healthy") }}
                >
                  {metrics.buffer_health.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Buffer Health Score
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={metrics.buffer_health}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: "grey.200",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: getStatusColor(
                        getMetricStatus(100 - metrics.buffer_health, {
                          warning: 20,
                          critical: 40
                        }),
                      )
                    }
                  }}
                />
              </Box>

              <Typography variant="body2" color="text.secondary">
                High buffer health ensures smooth playback without
                interruptions. Current status:{" "}
                {metrics.buffer_health > 90
                  ? "Excellent"
                  : metrics.buffer_health > 70
                    ? "Good"
                    : "Needs Attention"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alert Configuration Dialog */}
      <Dialog
        open={alertConfigOpen}
        onClose={() => setAlertConfigOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Alert Configuration</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure alert thresholds and notification settings for performance
            monitoring.
          </Typography>

          {/* Alert settings would go here */}
          <Alert severity="info">
            Alert configuration interface coming soon. Currently using default
            thresholds.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertConfigOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PerformanceMonitor;
