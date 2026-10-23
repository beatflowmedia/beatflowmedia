// src/components/analytics/AdminDashboard.js
// Comprehensive admin dashboard for platform oversight and management

import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Badge,
  Tabs,
  Tab,
  CircularProgress
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  PlayArrow as PlayIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  Notifications as NotificationIcon,
  Assessment as AssessmentIcon,
  Analytics as AnalyticsIcon,
  BusinessCenter as BusinessIcon
} from "@mui/icons-material";
import { adminAnalytics } from "../../services/adminAnalytics";
import { loadBusinessMetrics, formatMoney } from '../../services/businessMetrics';

// Platform overview metrics
const PlatformOverview = ({ data }) => {
  // Use real data if available, otherwise show loading state
  const metrics = data || {
    totalUsers: 0,
    totalSongs: 0,
    totalArtists: 0,
    totalAlbums: 0,
    totalPlaylists: 0,
    totalApplications: 0,
    pendingApplications: 0,
    errorRate: 0
  };

  const keyMetrics = [
    {
      title: "Total Users",
      value: metrics.totalUsers || 0,
      subtitle: `${metrics.totalApplications || 0} job applications`,
      icon: <PeopleIcon />,
      color: "primary",
      trend: "+5.2%"
    },
    {
      title: "Music Library",
      value: metrics.totalSongs || 0,
      subtitle: `${metrics.totalAlbums || 0} albums`,
      icon: <PlayIcon />,
      color: "success",
      trend: "+12.3%"
    },
    {
      title: "Artists",
      value: metrics.totalArtists || 0,
      subtitle: `${metrics.totalPlaylists || 0} playlists`,
      icon: <BusinessIcon />,
      color: "secondary",
      trend: "+8.7%"
    },
    {
      title: "Pending Apps",
      value: metrics.pendingApplications || 0,
      subtitle: "Job applications",
      icon: <AssessmentIcon />,
      color: "warning",
      trend: "+3.1%"
    },
  ];

  return (
    <Card>
      <CardHeader title="Platform Overview" />
      <CardContent>
        <Grid container spacing={3}>
          {keyMetrics.map((metric, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Box textAlign="center">
                <Avatar
                  sx={{ bgcolor: `${metric.color}.light`, mx: "auto", mb: 1 }}
                >
                  {metric.icon}
                </Avatar>
                <Typography variant="h4" color={`${metric.color}.main`}>
                  {typeof metric.value === "number"
                    ? metric.value.toLocaleString()
                    : metric.value}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {metric.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  fontSize="0.75rem"
                >
                  {metric.subtitle}
                </Typography>
                <Chip
                  label={metric.trend}
                  color={metric.trend.includes("+") ? "success" : "error"}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Additional platform stats */}
        <Box mt={3}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={2}>
              <Box textAlign="center">
                <Typography variant="h5" color="primary">
                  {metrics.totalPlaylists.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Playlists
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={2}>
              <Box textAlign="center">
                <Typography variant="h5" color="success.main">
                  {(metrics.errorRate || 0).toFixed(2)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Error Rate
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={2}>
              <Box textAlign="center">
                <Typography variant="h5" color="secondary.main">
                  {(metrics.totalPlays || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Plays
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={2}>
              <Box textAlign="center">
                <Typography variant="h5" color="info.main">
                  {(metrics.totalLikes || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Likes
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={2}>
              <Box textAlign="center">
                <Typography variant="h5" color="warning.main">
                  {(metrics.totalFollows || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Follows
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

// Real-time system status
const SystemStatus = ({ data }) => {
  const services = [
    {
      name: "Web Application",
      status: "healthy",
      uptime: "99.98%",
      responseTime: "125ms",
      load: 45,
      instances: 12
    },
    {
      name: "API Gateway",
      status: "healthy",
      uptime: "99.97%",
      responseTime: "89ms",
      load: 67,
      instances: 8
    },
    {
      name: "Database Cluster",
      status: "warning",
      uptime: "99.95%",
      responseTime: "245ms",
      load: 82,
      instances: 6
    },
    {
      name: "Content Delivery",
      status: "healthy",
      uptime: "99.99%",
      responseTime: "45ms",
      load: 34,
      instances: 24
    },
    {
      name: "Analytics Pipeline",
      status: "healthy",
      uptime: "99.94%",
      responseTime: "156ms",
      load: 56,
      instances: 4
    },
    {
      name: "DRM Services",
      status: "error",
      uptime: "98.87%",
      responseTime: "890ms",
      load: 98,
      instances: 3
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

  const getLoadColor = (load) => {
    if (load > 90) return "error";
    if (load > 70) return "warning";
    return "success";
  };

  return (
    <Card>
      <CardHeader
        title="Real-time System Status"
        action={
          <Badge
            badgeContent={services.filter((s) => s.status !== "healthy").length}
            color="error"
          >
            <SecurityIcon />
          </Badge>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Service</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Uptime</TableCell>
                <TableCell align="right">Response</TableCell>
                <TableCell align="right">Load</TableCell>
                <TableCell align="right">Instances</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {services.map((service, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {service.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={service.status}
                      color={getStatusColor(service.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">{service.uptime}</TableCell>
                  <TableCell align="right">{service.responseTime}</TableCell>
                  <TableCell align="right">
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="flex-end"
                    >
                      <Box width="40px" mr={1}>
                        <LinearProgress
                          variant="determinate"
                          value={service.load}
                          color={getLoadColor(service.load)}
                          sx={{ height: 4 }}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        color={`${getLoadColor(service.load)}.main`}
                      >
                        {service.load}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">{service.instances}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

// Revenue and business metrics
// Revenue and business metrics, READ rather than declared.
//
// THIS PANEL SHOWED $2,567,890.45 IN TOTAL REVENUE, $234,567.89 monthly recurring,
// 1,200,000 free users and a five-country revenue breakdown. Every figure was a literal
// inside this component, which took a `data` prop and ignored it. The file made no
// Firestore call at all.
//
// Percy, looking at it: "this appears to be hardcoded (false)". He has four purchases.
//
// A number on an admin screen is the basis for a decision, and $2.5m is the kind of
// figure somebody plans a year around or repeats to an investor. So it is read now --
// and the figures that CANNOT be read say so, because inventing a plausible one is
// exactly how $2.5m got on a screen.
const BusinessMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    loadBusinessMetrics()
      .then((m) => { if (alive) setMetrics(m); })
      .catch((err) => {
        console.error('BusinessMetrics: load failed —', err);
        if (alive) setError(err.message || 'Could not read business metrics.');
      });
    return () => { alive = false; };
  }, []);

  if (error) {
    return (
      <Card>
        <CardHeader title="Business Metrics" />
        <CardContent><Alert severity="error">{error}</Alert></CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader title="Business Metrics" />
        <CardContent><Typography color="textSecondary">Reading…</Typography></CardContent>
      </Card>
    );
  }

  /** A figure, or the reason there isn't one. Never a zero standing in for both:
   *  "nothing sold" and "never measured" are different facts. */
  const Figure = ({ metric, label, format, color }) => (
    <Grid item xs={6} md={3}>
      <Box textAlign="center">
        {metric.known ? (
          <Typography variant="h4" color={color || 'success.main'}>
            {format ? format(metric.value) : metric.value.toLocaleString()}
          </Typography>
        ) : (
          <Typography variant="h6" color="textSecondary" sx={{ opacity: 0.6 }}>
            not tracked
          </Typography>
        )}
        <Typography variant="body2" color="textSecondary">{label}</Typography>
        {!metric.known && (
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5, opacity: 0.75 }}>
            {metric.reason}
          </Typography>
        )}
      </Box>
    </Grid>
  );

  return (
    <Card>
      <CardHeader title="Business Metrics" />
      <CardContent>
        <Grid container spacing={3} mb={3}>
          <Figure metric={metrics.revenue} label="Total Revenue" format={formatMoney} />
          <Figure metric={metrics.purchases} label="Completed Purchases" color="primary" />
          <Figure metric={metrics.users} label="Users" color="info.main" />
          <Figure metric={metrics.activeSubscriptions} label="Active Subscriptions" color="info.main" />
        </Grid>

        <Grid container spacing={3} mb={3}>
          <Figure metric={metrics.songs} label="Songs" color="primary" />
          <Figure metric={metrics.collections} label="Collections" color="primary" />
          <Figure metric={metrics.albums} label="Albums" color="primary" />
          <Figure metric={metrics.monthlyRecurring} label="Monthly Recurring" />
        </Grid>

        {/* WHAT IS NOT MEASURED, LISTED RATHER THAN OMITTED. Dropping these silently
          * would leave the panel looking complete; a reader would never learn that
          * churn and conversion are unavailable rather than zero. Each says what it
          * would take, so the gap is actionable instead of mysterious. */}
        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
          Not measured
        </Typography>
        <List dense>
          {[
            ['Churn rate', metrics.churnRate],
            ['Conversion rate', metrics.conversionRate],
            ['Revenue by country', metrics.revenueByCountry],
            ['Subscription tiers', metrics.subscriptionTiers]
          ].map(([label, metric]) => (
            <ListItem key={label} disableGutters>
              <ListItemText
                primary={label}
                secondary={metric.reason}
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

// Active incidents and alerts
const IncidentsAndAlerts = ({ data }) => {
  const incidents = [
    {
      id: "INC-001",
      title: "DRM Service Degradation",
      severity: "high",
      status: "investigating",
      created: "15 minutes ago",
      affected: "Asia-Pacific users",
      eta: "2 hours"
    },
    {
      id: "INC-002",
      title: "Database Connection Timeout",
      severity: "medium",
      status: "monitoring",
      created: "1 hour ago",
      affected: "API responses",
      eta: "30 minutes"
    },
    {
      id: "INC-003",
      title: "CDN Cache Miss Rate High",
      severity: "low",
      status: "resolved",
      created: "3 hours ago",
      affected: "Load times",
      eta: "Resolved"
    },
  ];

  const alerts = [
    {
      type: "performance",
      message: "API latency above threshold (>200ms)",
      time: "5 minutes ago",
      level: "warning"
    },
    {
      type: "security",
      message: "Multiple failed login attempts detected",
      time: "12 minutes ago",
      level: "high"
    },
    {
      type: "capacity",
      message: "Storage utilization at 85%",
      time: "25 minutes ago",
      level: "medium"
    },
    {
      type: "business",
      message: "Conversion rate dropped 2% from yesterday",
      time: "1 hour ago",
      level: "low"
    },
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "investigating":
        return "error";
      case "monitoring":
        return "warning";
      case "resolved":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Active Incidents"
            action={
              <Badge
                badgeContent={
                  incidents.filter((i) => i.status !== "resolved").length
                }
                color="error"
              >
                <ErrorIcon />
              </Badge>
            }
          />
          <CardContent sx={{ pt: 0 }}>
            <List dense>
              {incidents.map((incident, index) => (
                <React.Fragment key={incident.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: `${getSeverityColor(incident.severity)}.light`
                        }}
                      >
                        <ErrorIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography variant="body1">
                            {incident.title}
                          </Typography>
                          <Chip
                            label={incident.status}
                            color={getStatusColor(incident.status)}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            {incident.id} • {incident.affected}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Created {incident.created} • ETA: {incident.eta}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < incidents.length - 1 && (
                    <Divider variant="inset" component="li" />
                  )}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Recent Alerts"
            action={
              <Badge badgeContent={alerts.length} color="warning">
                <NotificationIcon />
              </Badge>
            }
          />
          <CardContent sx={{ pt: 0 }}>
            <List dense>
              {alerts.map((alert, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: `${getSeverityColor(alert.level)}.light`
                        }}
                      >
                        <WarningIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={alert.message}
                      secondary={
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography variant="body2" color="textSecondary">
                            {alert.time}
                          </Typography>
                          <Chip
                            label={alert.type}
                            color={getSeverityColor(alert.level)}
                            size="small"
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < alerts.length - 1 && (
                    <Divider variant="inset" component="li" />
                  )}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Main admin dashboard component
const AdminDashboard = () => {
  const [timeRange, setTimeRange] = useState("24h");
  const [activeTab, setActiveTab] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState("30s");
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch analytics data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await adminAnalytics.getAllAnalytics();
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Auto-refresh based on interval
    const intervalMs = refreshInterval === '30s' ? 30000 : 60000;
    const interval = setInterval(fetchData, intervalMs);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleRefreshIntervalChange = (event) => {
    setRefreshInterval(event.target.value);
  };

  // Access control is handled by ProtectedRoute wrapper, no need to check here

  if (loading && !analyticsData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const tabs = [
    { label: "Overview", icon: <DashboardIcon /> },
    { label: "Business", icon: <BusinessIcon /> },
    { label: "System", icon: <SpeedIcon /> },
    { label: "Analytics", icon: <AnalyticsIcon /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <PlatformOverview data={analyticsData?.platform} />
            </Grid>
            <Grid item xs={12}>
              <IncidentsAndAlerts />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <BusinessMetrics />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <SystemStatus />
            </Grid>
          </Grid>
        );
      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info">
                Advanced analytics features coming soon. Use the main Analytics
                Dashboard for detailed insights.
              </Alert>
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Admin Dashboard</Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={handleTimeRangeChange}
            >
              <MenuItem value="1h">Last Hour</MenuItem>
              <MenuItem value="24h">Last 24h</MenuItem>
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Refresh</InputLabel>
            <Select
              value={refreshInterval}
              label="Refresh"
              onChange={handleRefreshIntervalChange}
            >
              <MenuItem value="10s">Every 10s</MenuItem>
              <MenuItem value="30s">Every 30s</MenuItem>
              <MenuItem value="1m">Every 1m</MenuItem>
              <MenuItem value="5m">Every 5m</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<DownloadIcon />}>
            Export Report
          </Button>
          <Button variant="contained" startIcon={<SettingsIcon />}>
            Settings
          </Button>
        </Box>
      </Box>

      {/* Tab navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
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

      {/* Tab content */}
      {renderTabContent()}

      {/* Global status indicator */}
      <Box position="fixed" bottom={16} right={16}>
        <Chip
          icon={<CheckIcon />}
          label="All Systems Operational"
          color="success"
          sx={{ boxShadow: 2 }}
        />
      </Box>
    </Box>
  );
};

export default AdminDashboard;
