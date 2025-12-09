// src/components/analytics/RealtimeMetrics.js
// Real-time metrics display with live updating charts

import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Paper,
  Divider
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as SteadyIcon,
  PlayArrow as PlayIcon,
  People as PeopleIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { Avatar } from '@mui/material/Avatar';

// Simple line chart component for real-time data
const MiniChart = ({ data, color, height = 60 }) => {
  const canvasRef = useRef(null);
  const theme = useTheme();

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { width, height: canvasHeight } = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, width, canvasHeight);

    // Calculate dimensions
    const padding = 4;
    const chartWidth = width - 2 * padding;
    const chartHeight = canvasHeight - 2 * padding;

    // Find min/max values
    const values = data.map((d) => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    // Draw line
    ctx.strokeStyle = color || theme.palette.primary.main;
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + ((maxValue - point.value) / range) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw fill area
    if (data.length > 1) {
      ctx.fillStyle = `${color || theme.palette.primary.main}20`;
      ctx.beginPath();

      data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = padding + ((maxValue - point.value) / range) * chartHeight;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      // Close the path to bottom
      ctx.lineTo(padding + chartWidth, padding + chartHeight);
      ctx.lineTo(padding, padding + chartHeight);
      ctx.closePath();
      ctx.fill();
    }
  }, [data, color, theme]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={height}
      style={{ width: "100%", height: `${height}px` }}
    />
  );
};

// Metric card component
const MetricCard = ({
  title,
  value,
  previousValue,
  unit = "",
  icon,
  color = "primary",
  chartData = [],
  format = "number"
}) => {
  const theme = useTheme();

  // Calculate trend
  const getTrend = () => {
    if (previousValue === undefined || previousValue === null) return null;

    const change = value - previousValue;
    const percentChange =
      previousValue !== 0 ? (change / previousValue) * 100 : 0;

    return {
      change,
      percentChange,
      direction: change > 0 ? "up" : change < 0 ? "down" : "steady"
    };
  };

  const trend = getTrend();

  // Format value based on type
  const formatValue = (val) => {
    if (format === "currency") {
      return `$${val.toLocaleString()}`;
    } else if (format === "percentage") {
      return `${val.toFixed(1)}%`;
    } else if (format === "duration") {
      const minutes = Math.floor(val / 60);
      const seconds = val % 60;
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    } else {
      return val.toLocaleString();
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;

    switch (trend.direction) {
      case "up":
        return <TrendingUpIcon fontSize="small" color="success" />;
      case "down":
        return <TrendingDownIcon fontSize="small" color="error" />;
      default:
        return <SteadyIcon fontSize="small" color="disabled" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return "textSecondary";

    switch (trend.direction) {
      case "up":
        return "success.main";
      case "down":
        return "error.main";
      default:
        return "text.secondary";
    }
  };

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={1}
        >
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {title}
          </Typography>
          <Avatar sx={{ bgcolor: `${color}.light`, width: 32, height: 32 }}>
            {icon}
          </Avatar>
        </Box>

        <Typography
          variant="h4"
          component="div"
          color={`${color}.main`}
          gutterBottom
        >
          {formatValue(value)}
          {unit}
        </Typography>

        {trend && (
          <Box display="flex" alignItems="center" mb={1}>
            {getTrendIcon()}
            <Typography
              variant="body2"
              color={getTrendColor()}
              sx={{ ml: 0.5 }}
            >
              {trend.percentChange > 0 ? "+" : ""}
              {trend.percentChange.toFixed(1)}%
            </Typography>
          </Box>
        )}

        {chartData.length > 0 && (
          <Box mt={1}>
            <MiniChart data={chartData} color={theme.palette[color]?.main} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// System status component
const SystemStatus = ({ status }) => {
  const getStatusColor = (service) => {
    switch (status[service]) {
      case "healthy":
        return "success";
      case "warning":
        return "warning";
      case "error":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (service) => {
    switch (status[service]) {
      case "healthy":
        return <CheckIcon />;
      case "warning":
        return <WarningIcon />;
      case "error":
        return <SecurityIcon />;
      default:
        return <SpeedIcon />;
    }
  };

  const services = [
    { key: "analyticsService", label: "Analytics Service" },
    { key: "dataWarehouse", label: "Data Warehouse" },
    { key: "streaming", label: "Streaming Pipeline" },
    { key: "realtime", label: "Real-time Processing" },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          System Status
        </Typography>
        <List dense>
          {services.map((service, index) => (
            <React.Fragment key={service.key}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar
                    sx={{ bgcolor: `${getStatusColor(service.key)}.light` }}
                  >
                    {getStatusIcon(service.key)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={service.label}
                  secondary={
                    <Chip
                      label={status[service.key] || "unknown"}
                      color={getStatusColor(service.key)}
                      size="small"
                    />
                  }
                />
              </ListItem>
              {index < services.length - 1 && (
                <Divider variant="inset" component="li" />
              )}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

// Main real-time metrics component
const RealtimeMetrics = ({ data, systemStatus, isLoading }) => {
  const [historicalData, setHistoricalData] = useState({
    concurrentUsers: [],
    currentPlays: [],
    totalRevenue: [],
    errorRate: [],
    avgLatency: []
  });

  // Update historical data for charts
  useEffect(() => {
    const timestamp = Date.now();

    setHistoricalData((prev) => ({
      concurrentUsers: [
        ...prev.concurrentUsers.slice(-29),
        { timestamp, value: data.concurrentUsers || 0 },
      ],
      currentPlays: [
        ...prev.currentPlays.slice(-29),
        { timestamp, value: data.currentPlays || 0 },
      ],
      totalRevenue: [
        ...prev.totalRevenue.slice(-29),
        { timestamp, value: data.totalRevenue || 0 },
      ],
      errorRate: [
        ...prev.errorRate.slice(-29),
        { timestamp, value: data.errorRate || 0 },
      ],
      avgLatency: [
        ...prev.avgLatency.slice(-29),
        { timestamp, value: data.avgLatency || 0 },
      ]
    }));
  }, [data]);

  // Get previous values for trend calculation
  const getPreviousValue = (metric) => {
    const history = historicalData[metric];
    return history.length > 1 ? history[history.length - 2].value : undefined;
  };

  if (isLoading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Real-time Metrics
        </Typography>
        <LinearProgress />
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Real-time Metrics
      </Typography>

      <Grid container spacing={3}>
        {/* Key metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Concurrent Users"
            value={data.concurrentUsers || 0}
            previousValue={getPreviousValue("concurrentUsers")}
            icon={<PeopleIcon />}
            color="primary"
            chartData={historicalData.concurrentUsers}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Streams"
            value={data.currentPlays || 0}
            previousValue={getPreviousValue("currentPlays")}
            icon={<PlayIcon />}
            color="secondary"
            chartData={historicalData.currentPlays}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Revenue (Today)"
            value={data.totalRevenue || 0}
            previousValue={getPreviousValue("totalRevenue")}
            icon={<TrendingUpIcon />}
            color="success"
            format="currency"
            chartData={historicalData.totalRevenue}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Error Rate"
            value={data.errorRate || 0}
            previousValue={getPreviousValue("errorRate")}
            icon={<WarningIcon />}
            color="error"
            format="percentage"
            unit="%"
            chartData={historicalData.errorRate}
          />
        </Grid>

        {/* Performance metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg Latency"
            value={data.avgLatency || 0}
            previousValue={getPreviousValue("avgLatency")}
            icon={<SpeedIcon />}
            color="info"
            unit="ms"
            chartData={historicalData.avgLatency}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Buffer Health"
            value={data.bufferHealth || 100}
            icon={<CheckIcon />}
            color="success"
            format="percentage"
            unit="%"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="CDN Hit Rate"
            value={data.cdnHitRate || 85}
            icon={<SpeedIcon />}
            color="info"
            format="percentage"
            unit="%"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Storage Usage"
            value={data.storageUsage || 45}
            icon={<SecurityIcon />}
            color="warning"
            format="percentage"
            unit="%"
          />
        </Grid>

        {/* System status */}
        <Grid item xs={12} md={6}>
          <SystemStatus status={systemStatus} />
        </Grid>

        {/* Live activity feed */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Live Activity
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Recent system events and user activities
              </Typography>
              <Box mt={2}>
                <Typography variant="body2">
                  • New user session started - US East
                </Typography>
                <Typography variant="body2">
                  • Quality switched to HD - 45 users
                </Typography>
                <Typography variant="body2">
                  • Crossfade event completed - Track #1249
                </Typography>
                <Typography variant="body2">
                  • Buffer underrun detected - EU West
                </Typography>
                <Typography variant="body2">
                  • New playlist created - "My Favorites"
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RealtimeMetrics;
