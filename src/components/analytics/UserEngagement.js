// src/components/analytics/UserEngagement.js
// User engagement analytics with behavioral insights

import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Tab,
  Tabs
} from "@mui/material";
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  ExitToApp as ExitIcon,
  Favorite as FavoriteIcon as PlaylistIcon as SearchIcon,
  Share as ShareIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  ThumbUp as ThumbUpIcon
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { Avatar } from '@mui/material/Avatar';

// User cohort analysis component
const CohortAnalysis = ({ data }) => {
  const cohorts = data?.cohorts || [];

  return (
    <Card>
      <CardHeader title="User Cohort Analysis" />
      <CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Cohort</TableCell>
                <TableCell align="right">Users</TableCell>
                <TableCell align="right">Week 1</TableCell>
                <TableCell align="right">Week 2</TableCell>
                <TableCell align="right">Week 4</TableCell>
                <TableCell align="right">Week 8</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cohorts.map((cohort) => (
                <TableRow key={cohort.date}>
                  <TableCell>{cohort.date}</TableCell>
                  <TableCell align="right">{cohort.users}</TableCell>
                  <TableCell align="right">
                    <Box display="flex" alignItems="center">
                      <Box width="40px" mr={1}>
                        <LinearProgress
                          variant="determinate"
                          value={cohort.week1}
                          sx={{ height: 6 }}
                        />
                      </Box>
                      {cohort.week1}%
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" alignItems="center">
                      <Box width="40px" mr={1}>
                        <LinearProgress
                          variant="determinate"
                          value={cohort.week2}
                          sx={{ height: 6 }}
                        />
                      </Box>
                      {cohort.week2}%
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" alignItems="center">
                      <Box width="40px" mr={1}>
                        <LinearProgress
                          variant="determinate"
                          value={cohort.week4}
                          sx={{ height: 6 }}
                        />
                      </Box>
                      {cohort.week4}%
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" alignItems="center">
                      <Box width="40px" mr={1}>
                        <LinearProgress
                          variant="determinate"
                          value={cohort.week8}
                          sx={{ height: 6 }}
                        />
                      </Box>
                      {cohort.week8}%
                    </Box>
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

// User segmentation component
const UserSegmentation = ({ data }) => {
  const segments = data?.segments || [];

  const getSegmentColor = (segment) => {
    switch (segment.toLowerCase()) {
      case "power users":
        return "success";
      case "regular users":
        return "primary";
      case "casual users":
        return "info";
      case "dormant users":
        return "warning";
      case "churned users":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Card>
      <CardHeader title="User Segmentation" />
      <CardContent>
        {segments.map((segment, index) => (
          <Box key={index} mb={2}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body1">{segment.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                {segment.count.toLocaleString()} users ({segment.percentage}%)
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={segment.percentage}
              color={getSegmentColor(segment.name)}
              sx={{ height: 8, borderRadius: 1 }}
            />
            <Typography variant="body2" color="textSecondary" mt={0.5}>
              Avg session: {segment.avgSession}min | Plays/month:{" "}
              {segment.playsPerMonth}
            </Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
};

// User journey analysis
const UserJourney = ({ data }) => {
  const journeySteps = [
    { step: "Discovery", users: 100000, conversion: 100 },
    { step: "Registration", users: 45000, conversion: 45 },
    { step: "First Play", users: 38000, conversion: 84.4 },
    { step: "Second Session", users: 25000, conversion: 65.8 },
    { step: "First Like", users: 18000, conversion: 72 },
    { step: "Playlist Creation", users: 12000, conversion: 66.7 },
    { step: "Premium Upgrade", users: 3500, conversion: 29.2 },
  ];

  return (
    <Card>
      <CardHeader title="User Journey Analysis" />
      <CardContent>
        <Box>
          {journeySteps.map((step, index) => (
            <Box key={index} mb={2}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Box display="flex" alignItems="center">
                  <Avatar
                    sx={{
                      bgcolor: "primary.light",
                      width: 32,
                      height: 32,
                      mr: 2,
                      fontSize: 14
                    }}
                  >
                    {index + 1}
                  </Avatar>
                  <Typography variant="body1">{step.step}</Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="body2" fontWeight="bold">
                    {step.users.toLocaleString()} users
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {step.conversion}% conversion
                  </Typography>
                </Box>
              </Box>
              {index < journeySteps.length - 1 && (
                <Box ml={4} mb={1}>
                  <LinearProgress
                    variant="determinate"
                    value={step.conversion}
                    color={
                      step.conversion > 70
                        ? "success"
                        : step.conversion > 50
                          ? "warning"
                          : "error"
                    }
                    sx={{ height: 4 }}
                  />
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

// Engagement metrics component
const EngagementMetrics = ({ data }) => {
  const metrics = {
    dailyActiveUsers: 23456,
    monthlyActiveUsers: 145789,
    avgSessionDuration: 24.5,
    sessionFrequency: 3.2,
    likesPerUser: 12.4,
    sharesPerUser: 2.1,
    playlistsPerUser: 1.8,
    searchesPerSession: 4.3
  };

  return (
    <Card>
      <CardHeader title="Engagement Metrics" />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Avatar sx={{ bgcolor: "primary.light", mx: "auto", mb: 1 }}>
                <PeopleIcon />
              </Avatar>
              <Typography variant="h4" color="primary">
                {metrics.dailyActiveUsers.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Daily Active Users
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Avatar sx={{ bgcolor: "secondary.light", mx: "auto", mb: 1 }}>
                <PeopleIcon />
              </Avatar>
              <Typography variant="h4" color="secondary">
                {metrics.monthlyActiveUsers.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Monthly Active Users
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Avatar sx={{ bgcolor: "success.light", mx: "auto", mb: 1 }}>
                <ScheduleIcon />
              </Avatar>
              <Typography variant="h4" color="success.main">
                {metrics.avgSessionDuration}m
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Avg Session Duration
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Avatar sx={{ bgcolor: "info.light", mx: "auto", mb: 1 }}>
                <TrendingUpIcon />
              </Avatar>
              <Typography variant="h4" color="info.main">
                {metrics.sessionFrequency.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Sessions per Week
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          User Actions per User
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box display="flex" alignItems="center" mb={1}>
              <FavoriteIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="body2">
                {metrics.likesPerUser} likes/month
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box display="flex" alignItems="center" mb={1}>
              <ShareIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body2">
                {metrics.sharesPerUser} shares/month
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box display="flex" alignItems="center" mb={1}>
              <PlaylistIcon color="secondary" sx={{ mr: 1 }} />
              <Typography variant="body2">
                {metrics.playlistsPerUser} playlists/month
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box display="flex" alignItems="center" mb={1}>
              <SearchIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="body2">
                {metrics.searchesPerSession} searches/session
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// Top user activities
const TopActivities = ({ data }) => {
  const activities = [
    {
      activity: "Track Liked",
      count: 45230,
      trend: "+12%",
      icon: <FavoriteIcon color="error" />
    },
    {
      activity: "Playlist Created",
      count: 12450,
      trend: "+8%",
      icon: <PlaylistIcon color="primary" />
    },
    {
      activity: "Track Shared",
      count: 8760,
      trend: "+24%",
      icon: <ShareIcon color="secondary" />
    },
    {
      activity: "Artist Followed",
      count: 6890,
      trend: "+15%",
      icon: <PersonAddIcon color="success" />
    },
    {
      activity: "Search Performed",
      count: 125430,
      trend: "+5%",
      icon: <SearchIcon color="info" />
    },
  ];

  return (
    <Card>
      <CardHeader title="Top User Activities (24h)" />
      <CardContent sx={{ pt: 0 }}>
        <List>
          {activities.map((activity, index) => (
            <React.Fragment key={index}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "background.paper" }}>
                    {activity.icon}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body1">
                        {activity.activity}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {activity.count.toLocaleString()}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Chip
                      label={activity.trend}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  }
                />
              </ListItem>
              {index < activities.length - 1 && (
                <Divider variant="inset" component="li" />
              )}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

// Retention analysis
const RetentionAnalysis = ({ data }) => {
  const retentionData = {
    day1: 85,
    day7: 42,
    day30: 28,
    day90: 18,
    churnRate: 15.2,
    avgLifetime: 45, // days
  };

  return (
    <Card>
      <CardHeader title="User Retention Analysis" />
      <CardContent>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={6} md={2}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main">
                {retentionData.day1}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Day 1 Retention
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={2}>
            <Box textAlign="center">
              <Typography variant="h4" color="info.main">
                {retentionData.day7}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Day 7 Retention
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={2}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main">
                {retentionData.day30}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Day 30 Retention
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={2}>
            <Box textAlign="center">
              <Typography variant="h4" color="error.main">
                {retentionData.day90}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Day 90 Retention
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={2}>
            <Box textAlign="center">
              <Typography variant="h4" color="error.main">
                {retentionData.churnRate}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Monthly Churn Rate
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={2}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                {retentionData.avgLifetime}d
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Avg User Lifetime
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="body2" color="textSecondary" mb={2}>
          Retention Rate by Day
        </Typography>
        <Box>
          {[
            { day: "Day 1", rate: retentionData.day1, color: "success" },
            { day: "Day 7", rate: retentionData.day7, color: "info" },
            { day: "Day 30", rate: retentionData.day30, color: "warning" },
            { day: "Day 90", rate: retentionData.day90, color: "error" },
          ].map((item) => (
            <Box key={item.day} mb={1}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2">{item.day}</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {item.rate}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={item.rate}
                color={item.color}
                sx={{ height: 6, borderRadius: 1 }}
              />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

// Main user engagement component
const UserEngagement = ({ data, realtimeData, userRole }) => {
  const [timeRange, setTimeRange] = useState("24h");
  const [activeTab, setActiveTab] = useState(0);

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Sample data
  const engagementData = {
    segments: [
      {
        name: "Power Users",
        count: 12450,
        percentage: 8.5,
        avgSession: 45,
        playsPerMonth: 120
      },
      {
        name: "Regular Users",
        count: 67890,
        percentage: 46.5,
        avgSession: 25,
        playsPerMonth: 45
      },
      {
        name: "Casual Users",
        count: 52340,
        percentage: 35.9,
        avgSession: 12,
        playsPerMonth: 15
      },
      {
        name: "Dormant Users",
        count: 13450,
        percentage: 9.1,
        avgSession: 3,
        playsPerMonth: 2
      },
    ],
    cohorts: [
      {
        date: "2024-01-01",
        users: 1250,
        week1: 85,
        week2: 58,
        week4: 34,
        week8: 22
      },
      {
        date: "2024-01-08",
        users: 1456,
        week1: 82,
        week2: 55,
        week4: 31,
        week8: 19
      },
      // ... more cohorts
    ]
  };

  const tabs = [
    { label: "Overview", icon: <TrendingUpIcon /> },
    { label: "Segmentation", icon: <PeopleIcon /> },
    { label: "Journey", icon: <StarIcon /> },
    { label: "Retention", icon: <ThumbUpIcon /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <EngagementMetrics data={engagementData} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TopActivities data={engagementData} />
            </Grid>
            <Grid item xs={12} md={6}>
              <RetentionAnalysis data={engagementData} />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <UserSegmentation data={engagementData} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TopActivities data={engagementData} />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <UserJourney data={engagementData} />
            </Grid>
            <Grid item xs={12} md={4}>
              <RetentionAnalysis data={engagementData} />
            </Grid>
          </Grid>
        );
      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <CohortAnalysis data={engagementData} />
            </Grid>
            <Grid item xs={12}>
              <RetentionAnalysis data={engagementData} />
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
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
        <Typography variant="h6">User Engagement Analytics</Typography>
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
          <Button variant="outlined" startIcon={<TrendingUpIcon />}>
            Export Report
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
    </Box>
  );
};

export default UserEngagement;
