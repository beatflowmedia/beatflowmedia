// src/components/analytics/PerformanceMonitoring.js
// Performance monitoring dashboard with real-time metrics and alerting

import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Alert,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from "@mui/material";
import {
import { Avatar } from '@mui/material/Avatar';
import { Tooltip } from '@mui/material/Tooltip';
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  CloudQueue as CloudIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon
} from "@mui/icons-material";

// Performance metric card
const PerformanceMetric = ({
  title,
  value,
  unit,
  threshold,
  status,
  trend,
  icon
}) => {
  const getStatusColor = () => {
    switch (status) {
      case "healthy":
        return "success";
      case "warning":
        return "warning";
      case "critical":
        return "error";
      default:
        return "info";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "healthy":
        return <CheckIcon />;
      case "warning":
        return <WarningIcon />;
      case "critical":
        return <ErrorIcon />;
      default:
        return icon;
    }
  };

  return (
    <Card>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Typography variant="body2" color="textSecondary">
            {title}
          </Typography>
          <Avatar
            sx={{ bgcolor: `${getStatusColor()}.light`, width: 32, height: 32 }}
          >
            {getStatusIcon()}
          </Avatar>
        </Box>

        <Typography
          variant="h4"
          color={`${getStatusColor()}.main`}
          gutterBottom
        >
          {typeof value === "number" ? value.toLocaleString() : value}
          {unit}
        </Typography>

        {threshold && (
          <Box mb={1}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Threshold: {threshold}
              {unit}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min((value / threshold) * 100, 100)}
              color={getStatusColor()}
              sx={{ height: 6, borderRadius: 1 }}
            />
          </Box>
        )}

        {trend && (
          <Typography variant="body2" color="textSecondary">
            {trend > 0 ? "+" : ""}
            {trend}% from last hour
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

// System health overview
const SystemHealthOverview = ({ systemStatus }) => {
  const services = [
    {
      name: "Analytics Service",
      status: systemStatus.analyticsService || "healthy",
      uptime: "99.98%",
      responseTime: "45ms",
      lastCheck: "30s ago"
    },
    {
      name: "Data Warehouse",
      status: systemStatus.dataWarehouse || "healthy",
      uptime: "99.95%",
      responseTime: "120ms",
      lastCheck: "1m ago"
    },
    {
      name: "Streaming Pipeline",
      status: systemStatus.streaming || "healthy",
      uptime: "99.92%",
      responseTime: "25ms",
      lastCheck: "15s ago"
    },
    {
      name: "CDN Network",
      status: "healthy",
      uptime: "99.99%",
      responseTime: "12ms",
      lastCheck: "10s ago"
    },
    {
      name: "Audio Processing",
      status: "healthy",
      uptime: "99.94%",
      responseTime: "200ms",
      lastCheck: "45s ago"
    },
    {
      name: "DRM Services",
      status: "warning",
      uptime: "99.89%",
      responseTime: "180ms",
      lastCheck: "20s ago"
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
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

  return (
    <Card>
      <CardHeader
        title="System Health Overview"
        action={
          <Tooltip title="Refresh Status">
            <IconButton size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <List dense>
          {services.map((service, index) => (
            <React.Fragment key={service.name}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar
                    sx={{ bgcolor: `${getStatusColor(service.status)}.light` }}
                  >
                    <CheckIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body1">{service.name}</Typography>
                      <Chip
                        label={service.status}
                        color={getStatusColor(service.status)}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Uptime: {service.uptime} | Response:{" "}
                        {service.responseTime}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Last check: {service.lastCheck}
                      </Typography>
                    </Box>
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

// Real-time alerts
const RealTimeAlerts = ({ alerts = [] }) => {
  const sampleAlerts = [
    {
      id: 1,
      severity: "warning",
      message: "High latency detected in EU-West region (>500ms)",
      timestamp: "2 minutes ago",
      source: "CDN Monitor"
    },
    {
      id: 2,
      severity: "info",
      message: "Buffer underrun rate increased to 2.3%",
      timestamp: "5 minutes ago",
      source: "Audio Engine"
    },
    {
      id: 3,
      severity: "error",
      message: "DRM license server timeout in Asia-Pacific",
      timestamp: "8 minutes ago",
      source: "DRM Service"
    },
    {
      id: 4,
      severity: "warning",
      message: "Memory usage above 85% on analytics cluster",
      timestamp: "12 minutes ago",
      source: "System Monitor"
    },
  ];

  const alertsToShow = alerts.length > 0 ? alerts : sampleAlerts;

  return (
    <Card>
      <CardHeader title="Real-time Alerts" />
      <CardContent sx={{ pt: 0 }}>
        {alertsToShow.length === 0 ? (
          <Box textAlign="center" py={3}>
            <CheckIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="body2" color="textSecondary">
              No active alerts
            </Typography>
          </Box>
        ) : (
          <List dense>
            {alertsToShow.map((alert, index) => (
              <React.Fragment key={alert.id || index}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: `${alert.severity}.light` }}>
                      {alert.severity === "error" ? (
                        <ErrorIcon />
                      ) : alert.severity === "warning" ? (
                        <WarningIcon />
                      ) : (
                        <CheckIcon />
                      )}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={alert.message}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          {alert.source} • {alert.timestamp}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < alertsToShow.length - 1 && (
                  <Divider variant="inset" component="li" />
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

// Performance metrics table
const PerformanceMetricsTable = ({ data }) => {
  const metrics = [
    {
      metric: "API Response Time",
      current: "125ms",
      target: "<200ms",
      p95: "180ms",
      p99: "350ms",
      status: "healthy"
    },
    {
      metric: "Audio Buffer Health",
      current: "95%",
      target: ">90%",
      p95: "88%",
      p99: "75%",
      status: "healthy"
    },
    {
      metric: "CDN Cache Hit Rate",
      current: "87%",
      target: ">85%",
      p95: "89%",
      p99: "92%",
      status: "healthy"
    },
    {
      metric: "DRM License Time",
      current: "450ms",
      target: "<500ms",
      p95: "480ms",
      p99: "620ms",
      status: "warning"
    },
    {
      metric: "Database Query Time",
      current: "35ms",
      target: "<50ms",
      p95: "45ms",
      p99: "75ms",
      status: "healthy"
    },
    {
      metric: "Stream Startup Time",
      current: "1.2s",
      target: "<2s",
      p95: "1.8s",
      p99: "2.5s",
      status: "healthy"
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "healthy":
        return "success";
      case "warning":
        return "warning";
      case "critical":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Card>
      <CardHeader title="Performance Metrics Detail" />
      <CardContent sx={{ pt: 0 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Metric</TableCell>
                <TableCell align="right">Current</TableCell>
                <TableCell align="right">Target</TableCell>
                <TableCell align="right">P95</TableCell>
                <TableCell align="right">P99</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {metrics.map((metric, index) => (
                <TableRow key={index}>
                  <TableCell component="th" scope="row">
                    {metric.metric}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {metric.current}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{metric.target}</TableCell>
                  <TableCell align="right">{metric.p95}</TableCell>
                  <TableCell align="right">{metric.p99}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={metric.status}
                      color={getStatusColor(metric.status)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

// Resource utilization
const ResourceUtilization = ({ data }) => {
  const resources = [
    { name: "CPU Usage", value: 45, max: 100, unit: "%", status: "healthy" },
    { name: "Memory Usage", value: 68, max: 100, unit: "%", status: "warning" },
    {
      name: "Storage Usage",
      value: 32,
      max: 100,
      unit: "%",
      status: "healthy"
    },
    {
      name: "Network I/O",
      value: 124,
      max: 1000,
      unit: "Mbps",
      status: "healthy"
    },
    { name: "Disk I/O", value: 45, max: 100, unit: "MB/s", status: "healthy" },
    { name: "Cache Usage", value: 78, max: 100, unit: "%", status: "healthy" },
  ];

  return (
    <Card>
      <CardHeader title="Resource Utilization" />
      <CardContent>
        <Grid container spacing={2}>
          {resources.map((resource, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">{resource.name}</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {resource.value}
                    {resource.unit}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(resource.value / resource.max) * 100}
                  color={resource.status === "warning" ? "warning" : "primary"}
                  sx={{ height: 8, borderRadius: 1 }}
                />
                <Typography variant="body2" color="textSecondary" mt={0.5}>
                  Max: {resource.max}
                  {resource.unit}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

// Main performance monitoring component
const PerformanceMonitoring = ({ data, realtimeData, systemStatus }) => {
  const [timeRange, setTimeRange] = useState("1h");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sample performance data
  const performanceData = {
    apiLatency: 125,
    bufferHealth: 95,
    errorRate: 0.12,
    throughput: 45670,
    concurrentStreams: 12450,
    cdnHitRate: 87
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  return (
    <Box>
      {/* Controls */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6">Performance Monitoring</Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={handleTimeRangeChange}
            >
              <MenuItem value="5m">Last 5 minutes</MenuItem>
              <MenuItem value="1h">Last Hour</MenuItem>
              <MenuItem value="24h">Last 24 hours</MenuItem>
              <MenuItem value="7d">Last 7 days</MenuItem>
            </Select>
          </FormControl>
          <Chip
            icon={<TimelineIcon />}
            label={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            color={autoRefresh ? "success" : "default"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            clickable
          />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Key performance metrics */}
        <Grid item xs={12} sm={6} md={4}>
          <PerformanceMetric
            title="API Latency"
            value={performanceData.apiLatency}
            unit="ms"
            threshold={200}
            status="healthy"
            trend={-5.2}
            icon={<SpeedIcon />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <PerformanceMetric
            title="Buffer Health"
            value={performanceData.bufferHealth}
            unit="%"
            threshold={90}
            status="healthy"
            trend={2.1}
            icon={<NetworkIcon />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <PerformanceMetric
            title="Error Rate"
            value={performanceData.errorRate}
            unit="%"
            threshold={1}
            status="healthy"
            trend={-0.05}
            icon={<ErrorIcon />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <PerformanceMetric
            title="Throughput"
            value={performanceData.throughput}
            unit=" req/min"
            threshold={50000}
            status="healthy"
            trend={8.7}
            icon={<AnalyticsIcon />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <PerformanceMetric
            title="Concurrent Streams"
            value={performanceData.concurrentStreams}
            unit=""
            threshold={15000}
            status="healthy"
            trend={12.4}
            icon={<CloudIcon />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <PerformanceMetric
            title="CDN Hit Rate"
            value={performanceData.cdnHitRate}
            unit="%"
            threshold={85}
            status="healthy"
            trend={1.2}
            icon={<StorageIcon />}
          />
        </Grid>

        {/* System health overview */}
        <Grid item xs={12} md={8}>
          <SystemHealthOverview systemStatus={systemStatus} />
        </Grid>

        {/* Real-time alerts */}
        <Grid item xs={12} md={4}>
          <RealTimeAlerts alerts={systemStatus.alerts} />
        </Grid>

        {/* Performance metrics table */}
        <Grid item xs={12} md={8}>
          <PerformanceMetricsTable data={data} />
        </Grid>

        {/* Resource utilization */}
        <Grid item xs={12} md={4}>
          <ResourceUtilization data={data} />
        </Grid>

        {/* Performance summary */}
        <Grid item xs={12}>
          <Alert severity="info" icon={<TimelineIcon />}>
            <Typography variant="body1" fontWeight="bold">
              Performance Summary
            </Typography>
            <Typography variant="body2">
              All systems are operating within normal parameters. Average
              response time is 12% faster than last week. Buffer health improved
              by 3% due to CDN optimizations. Next scheduled maintenance: Sunday
              2:00 AM UTC.
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PerformanceMonitoring;
