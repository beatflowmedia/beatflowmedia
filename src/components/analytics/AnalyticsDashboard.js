// src/components/analytics/AnalyticsDashboard.js
// Real-time analytics dashboard with Material-UI components

import React, { useState, useEffect , useCallback } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Tab,
  Tabs,
  Switch,
  FormControlLabel,
  Button,
  Chip,
  Alert,
  LinearProgress,
  IconButton
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  PlayArrow as PlayIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon as DownloadIcon,
  Timeline as TimelineIcon
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

import RealtimeMetrics from "./RealtimeMetrics";
import PlaybackAnalytics from "./PlaybackAnalytics";
import UserEngagement from "./UserEngagement";
import RevenueAnalytics from "./RevenueAnalytics";
import PerformanceMonitoring from "./PerformanceMonitoring";
import SecurityDashboard from "./SecurityDashboard";
import useAnalytics from "../../hooks/useAnalytics";
import { CircularProgress } from '@mui/material/CircularProgress';
import { Tooltip } from '@mui/material/Tooltip';

const AnalyticsDashboard = ({ userRole = "user", permissions = [] }) => {
  const theme = useTheme();
  const { analyticsService } = useAnalytics();

  // Dashboard state
  const [activeTab, setActiveTab] = useState(0);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Real-time data
  const [realtimeData, setRealtimeData] = useState({
    concurrentUsers: 0,
    currentPlays: 0,
    totalRevenue: 0,
    errorRate: 0,
    avgLatency: 0,
    bufferHealth: 100
  });

  // Historical data
  const [historicalData, setHistoricalData] = useState({
    last24h: [],
    last7d: [],
    last30d: []
  });

  // System status
  const [systemStatus, setSystemStatus] = useState({
    analyticsService: "healthy",
    dataWarehouse: "healthy",
    streaming: "healthy",
    alerts: []
  });

  // Tab configuration based on user role and permissions
  const getTabs = useCallback(() => {
    const baseTabs = [
      { label: "Overview", icon: <TrendingUpIcon />, component: "overview" },
      { label: "Playback", icon: <PlayIcon />, component: "playback" },
      { label: "Users", icon: <PeopleIcon />, component: "users" },
    ];

    // Add revenue tab for admin/artist roles
    if (
      userRole === "admin" ||
      userRole === "artist" ||
      permissions.includes("view_revenue")
    ) {
      baseTabs.push({
        label: "Revenue",
        icon: <MoneyIcon />,
        component: "revenue"
      });
    }

    // Add performance tab for admin/technical roles
    if (userRole === "admin" || permissions.includes("view_performance")) {
      baseTabs.push({
        label: "Performance",
        icon: <SpeedIcon />,
        component: "performance"
      });
    }

    // Add security tab for admin role
    if (userRole === "admin" || permissions.includes("view_security")) {
      baseTabs.push({
        label: "Security",
        icon: <SecurityIcon />,
        component: "security"
      });
    }

    return baseTabs;
  }, [userRole, permissions]);

  const tabs = getTabs();

  // Real-time data fetching
  useEffect(() => {
    if (!realTimeEnabled) return;

    const fetchRealtimeData = async () => {
      try {
        const metrics = await analyticsService.getMetrics();
        setRealtimeData((prevData) => ({
          ...prevData,
          ...metrics.realtime
        }));
      } catch (error) {
        console.error("Failed to fetch realtime data:", error);
        setError("Failed to fetch real-time data");
      }
    };

    const interval = setInterval(fetchRealtimeData, refreshInterval);
    fetchRealtimeData(); // Initial fetch

    return () => clearInterval(interval);
  }, [realTimeEnabled, refreshInterval, analyticsService]);

  // Historical data fetching
  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoading(true);
      try {
        const [last24h, last7d, last30d] = await Promise.all([
          analyticsService.getHistoricalData("24h"),
          analyticsService.getHistoricalData("7d"),
          analyticsService.getHistoricalData("30d"),
        ]);

        setHistoricalData({ last24h, last7d, last30d });
      } catch (error) {
        console.error("Failed to fetch historical data:", error);
        setError("Failed to fetch historical data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoricalData();
  }, [analyticsService]);

  // System status monitoring
  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const status = await analyticsService.getSystemStatus();
        setSystemStatus(status);
      } catch (error) {
        console.error("Failed to check system status:", error);
      }
    };

    const interval = setInterval(checkSystemStatus, 60000); // Every minute
    checkSystemStatus(); // Initial check

    return () => clearInterval(interval);
  }, [analyticsService]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle real-time toggle
  const handleRealTimeToggle = (event) => {
    setRealTimeEnabled(event.target.checked);
  };

  // Handle refresh
  const handleRefresh = () => {
    window.location.reload();
  };

  // Handle export
  const handleExport = async () => {
    try {
      setIsLoading(true);
      const exportData = await analyticsService.exportDashboardData({
        timeRange: "30d",
        format: "csv",
        includeRealtime: realTimeEnabled
      });

      // Trigger download
      const blob = new Blob([exportData], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics-dashboard-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export data:", error);
      setError("Failed to export dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  // Render overview tab content
  const renderOverview = () => (
    <Grid container spacing={3}>
      {/* Real-time metrics */}
      <Grid item xs={12}>
        <RealtimeMetrics
          data={realtimeData}
          systemStatus={systemStatus}
          isLoading={isLoading}
        />
      </Grid>

      {/* Key performance indicators */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Key Performance Indicators" />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {realtimeData.concurrentUsers?.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Concurrent Users
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {realtimeData.currentPlays?.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Streams
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    ${realtimeData.totalRevenue?.toFixed(2) || "0.00"}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Today's Revenue
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography
                    variant="h4"
                    color={realtimeData.errorRate > 5 ? "error" : "primary"}
                  >
                    {(realtimeData.errorRate || 0).toFixed(2)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Error Rate
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* System health */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="System Health" />
          <CardContent>
            <Box mb={2}>
              <Typography variant="body2" gutterBottom>
                Analytics Service
              </Typography>
              <LinearProgress
                variant="determinate"
                value={systemStatus.analyticsService === "healthy" ? 100 : 0}
                color={
                  systemStatus.analyticsService === "healthy"
                    ? "success"
                    : "error"
                }
              />
            </Box>
            <Box mb={2}>
              <Typography variant="body2" gutterBottom>
                Data Warehouse
              </Typography>
              <LinearProgress
                variant="determinate"
                value={systemStatus.dataWarehouse === "healthy" ? 100 : 0}
                color={
                  systemStatus.dataWarehouse === "healthy" ? "success" : "error"
                }
              />
            </Box>
            <Box mb={2}>
              <Typography variant="body2" gutterBottom>
                Streaming Pipeline
              </Typography>
              <LinearProgress
                variant="determinate"
                value={systemStatus.streaming === "healthy" ? 100 : 0}
                color={
                  systemStatus.streaming === "healthy" ? "success" : "error"
                }
              />
            </Box>
            <Box>
              <Typography variant="body2" gutterBottom>
                Buffer Health
              </Typography>
              <LinearProgress
                variant="determinate"
                value={realtimeData.bufferHealth || 100}
                color={realtimeData.bufferHealth < 70 ? "warning" : "success"}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Active alerts */}
      {systemStatus.alerts && systemStatus.alerts.length > 0 && (
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Active Alerts" />
            <CardContent>
              {systemStatus.alerts.map((alert, index) => (
                <Alert key={index} severity={alert.severity} sx={{ mb: 1 }}>
                  {alert.message}
                </Alert>
              ))}
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  // Render tab content
  const renderTabContent = () => {
    const currentTab = tabs[activeTab];
    if (!currentTab) return null;

    switch (currentTab.component) {
      case "overview":
        return renderOverview();
      case "playback":
        return (
          <PlaybackAnalytics
            data={historicalData}
            realtimeData={realtimeData}
            userRole={userRole}
          />
        );
      case "users":
        return (
          <UserEngagement
            data={historicalData}
            realtimeData={realtimeData}
            userRole={userRole}
          />
        );
      case "revenue":
        return (
          <RevenueAnalytics
            data={historicalData}
            realtimeData={realtimeData}
            userRole={userRole}
          />
        );
      case "performance":
        return (
          <PerformanceMonitoring
            data={historicalData}
            realtimeData={realtimeData}
            systemStatus={systemStatus}
          />
        );
      case "security":
        return (
          <SecurityDashboard
            data={historicalData}
            realtimeData={realtimeData}
            systemStatus={systemStatus}
          />
        );
      default:
        return <Typography>Content not available</Typography>;
    }
  };

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={handleRefresh}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{ width: "100%", bgcolor: "background.default", minHeight: "100vh" }}
    >
      {/* Dashboard header */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h4" component="h1">
            Analytics Dashboard
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              icon={<TimelineIcon />}
              label={realTimeEnabled ? "Real-time" : "Static"}
              color={realTimeEnabled ? "success" : "default"}
              size="small"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={realTimeEnabled}
                  onChange={handleRealTimeToggle}
                  size="small"
                />
              }
              label="Real-time"
            />
            <Tooltip title="Export Data">
              <IconButton onClick={handleExport} disabled={isLoading}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} disabled={isLoading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Tab navigation */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              icon={tab.icon}
              label={tab.label}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {/* Loading overlay */}
      {isLoading && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgcolor="rgba(0, 0, 0, 0.1)"
          zIndex={9999}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Tab content */}
      <Box sx={{ p: 3 }}>{renderTabContent()}</Box>
    </Box>
  );
};

export default AnalyticsDashboard;
