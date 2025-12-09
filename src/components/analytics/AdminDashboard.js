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
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  IconButton,
  Badge,
  Tabs,
  Tab
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  PlayArrow as PlayIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Cloud as CloudIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon as DownloadIcon,
  Settings as SettingsIcon,
  Notifications as NotificationIcon,
  Assessment as AssessmentIcon,
  Analytics as AnalyticsIcon,
  BusinessCenter as BusinessIcon
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { Avatar } from '@mui/material/Avatar';

// Platform overview metrics
const PlatformOverview = ({ data }) => {
  const metrics = {
    totalUsers: 1567890,
    activeUsers: 567890,
    totalArtists: 45678,
    totalTracks: 2345678,
    totalPlaylists: 456789,
    totalRevenue: 2567890.45,
    monthlyRevenue: 234567.89,
    systemUptime: 99.97,
    avgResponseTime: 125,
    errorRate: 0.12
  };

  const keyMetrics = [
    {
      title: "Total Users",
      value: metrics.totalUsers,
      subtitle: `${metrics.activeUsers.toLocaleString()} active`,
      icon: <PeopleIcon />,
      color: "primary",
      trend: "+12.5%"
    },
    {
      title: "Total Revenue",
      value: `$${metrics.totalRevenue.toLocaleString()}`,
      subtitle: `$${metrics.monthlyRevenue.toLocaleString()} this month`,
      icon: <MoneyIcon />,
      color: "success",
      trend: "+18.7%"
    },
    {
      title: "Content Library",
      value: metrics.totalTracks,
      subtitle: `${metrics.totalArtists.toLocaleString()} artists`,
      icon: <PlayIcon />,
      color: "secondary",
      trend: "+8.9%"
    },
    {
      title: "System Health",
      value: `${metrics.systemUptime}%`,
      subtitle: `${metrics.avgResponseTime}ms avg response`,
      icon: <SpeedIcon />,
      color: "info",
      trend: "+0.02%"
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
                  {metrics.errorRate}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Error Rate
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={2}>
              <Box textAlign="center">
                <Typography variant="h5" color="info.main">
                  2.4TB
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Daily Transfer
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={2}>
              <Box textAlign="center">
                <Typography variant="h5" color="secondary.main">
                  15.7M
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Daily Streams
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={2}>
              <Box textAlign="center">
                <Typography variant="h5" color="warning.main">
                  4.2s
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Avg Load Time
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={2}>
              <Box textAlign="center">
                <Typography variant="h5" color="error.main">
                  23
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Active Incidents
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
const BusinessMetrics = ({ data }) => {
  const businessData = {
    totalRevenue: 2567890.45,
    monthlyRecurring: 234567.89,
    conversionRate: 12.7,
    churnRate: 3.2,
    averageRevenuePer: {
      user: 45.67,
      artist: 234.56,
      play: 0.012
    },
    subscriptionBreakdown: {
      free: { users: 1200000, percentage: 76.5 },
      premium: { users: 300000, percentage: 19.1 },
      family: { users: 60000, percentage: 3.8 },
      student: { users: 7890, percentage: 0.5 }
    },
    topRevenueCountries: [
      { country: "United States", revenue: 1156789.23, percentage: 45.1 },
      { country: "Canada", revenue: 234567.89, percentage: 9.1 },
      { country: "United Kingdom", revenue: 189234.56, percentage: 7.4 },
      { country: "Germany", revenue: 145678.9, percentage: 5.7 },
      { country: "France", revenue: 123456.78, percentage: 4.8 },
    ]
  };

  return (
    <Card>
      <CardHeader title="Business Metrics" />
      <CardContent>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main">
                ${businessData.totalRevenue.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Revenue
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                ${businessData.monthlyRecurring.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Monthly Recurring
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="info.main">
                {businessData.conversionRate}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Conversion Rate
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main">
                {businessData.churnRate}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Churn Rate
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom>
          Subscription Distribution
        </Typography>
        {Object.entries(businessData.subscriptionBreakdown).map(
          ([tier, data]) => (
            <Box key={tier} mb={1}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography
                  variant="body2"
                  sx={{ textTransform: "capitalize" }}
                >
                  {tier} ({data.users.toLocaleString()} users)
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {data.percentage}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={data.percentage}
                color={
                  tier === "premium"
                    ? "primary"
                    : tier === "family"
                      ? "secondary"
                      : "info"
                }
                sx={{ height: 6, borderRadius: 1 }}
              />
            </Box>
          ),
        )}

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Top Revenue Countries
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Country</TableCell>
                <TableCell align="right">Revenue</TableCell>
                <TableCell align="right">Share</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {businessData.topRevenueCountries.map((country, index) => (
                <TableRow key={index}>
                  <TableCell>{country.country}</TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color="success.main"
                    >
                      ${country.revenue.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{country.percentage}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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
const AdminDashboard = ({ userRole }) => {
  const [timeRange, setTimeRange] = useState("24h");
  const [activeTab, setActiveTab] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState("30s");

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleRefreshIntervalChange = (event) => {
    setRefreshInterval(event.target.value);
  };

  if (userRole !== "admin") {
    return (
      <Box p={3}>
        <Alert severity="error">
          Access denied. Admin privileges required to view this dashboard.
        </Alert>
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
              <PlatformOverview />
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
