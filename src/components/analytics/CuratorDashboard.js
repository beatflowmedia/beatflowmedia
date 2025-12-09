// src/components/analytics/CuratorDashboard.js
// Business intelligence dashboard for playlist curators and content managers

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
  Badge
} from "@mui/material";
import {
  PlaylistPlay as PlaylistIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  Visibility as ViewIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon as DownloadIcon,
  Add as AddIcon,
  Remove as RemoveIcon as ShuffleIcon,
  BarChart as ChartIcon,
  Psychology as AiIcon,
  Recommend as RecommendIcon
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { Avatar } from '@mui/material/Avatar';

// Curator performance overview
const CuratorPerformanceOverview = ({ data }) => {
  const performance = {
    totalPlaylists: 127,
    activePlaylists: 89,
    totalFollowers: 234567,
    monthlyGrowth: 12.5,
    avgPlaylistSize: 42,
    totalPlays: 5678901,
    engagementRate: 85.7,
    curatorRating: 4.8
  };

  const metrics = [
    {
      title: "Total Playlists",
      value: performance.totalPlaylists,
      subtitle: `${performance.activePlaylists} active`,
      icon: <PlaylistIcon />,
      color: "primary"
    },
    {
      title: "Total Followers",
      value: performance.totalFollowers,
      subtitle: `+${performance.monthlyGrowth}% this month`,
      icon: <PeopleIcon />,
      color: "secondary"
    },
    {
      title: "Total Plays",
      value: performance.totalPlays,
      subtitle: "Across all playlists",
      icon: <TrendingUpIcon />,
      color: "success"
    },
    {
      title: "Engagement Rate",
      value: `${performance.engagementRate}%`,
      subtitle: "Above platform average",
      icon: <StarIcon />,
      color: "info"
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Curator Performance Overview"
        action={
          <Box display="flex" alignItems="center" gap={1}>
            <Rating
              value={performance.curatorRating}
              precision={0.1}
              readOnly
              size="small"
            />
            <Typography variant="body2" color="textSecondary">
              {performance.curatorRating}/5.0
            </Typography>
          </Box>
        }
      />
      <CardContent>
        <Grid container spacing={3}>
          {metrics.map((metric, index) => (
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
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

// Top performing playlists
const TopPerformingPlaylists = ({ data }) => {
  const playlists = [
    {
      id: 1,
      name: "Indie Rock Essentials",
      followers: 45678,
      totalPlays: 567890,
      avgCompletion: 78.5,
      engagement: 92.1,
      tracks: 47,
      lastUpdated: "2 days ago",
      trend: "up",
      growthRate: 15.2
    },
    {
      id: 2,
      name: "Electronic Vibes",
      followers: 34567,
      totalPlays: 456789,
      avgCompletion: 85.2,
      engagement: 88.7,
      tracks: 52,
      lastUpdated: "1 day ago",
      trend: "up",
      growthRate: 8.9
    },
    {
      id: 3,
      name: "Chill Sunday",
      followers: 28901,
      totalPlays: 378901,
      avgCompletion: 91.3,
      engagement: 95.4,
      tracks: 35,
      lastUpdated: "3 days ago",
      trend: "stable",
      growthRate: 2.1
    },
    {
      id: 4,
      name: "Workout Motivation",
      followers: 23456,
      totalPlays: 289012,
      avgCompletion: 76.8,
      engagement: 82.3,
      tracks: 68,
      lastUpdated: "5 days ago",
      trend: "down",
      growthRate: -3.2
    },
    {
      id: 5,
      name: "Jazz Classics",
      followers: 19876,
      totalPlays: 234567,
      avgCompletion: 89.6,
      engagement: 87.9,
      tracks: 41,
      lastUpdated: "1 week ago",
      trend: "up",
      growthRate: 6.7
    },
  ];

  const getTrendIcon = (trend, growthRate) => {
    switch (trend) {
      case "up":
        return (
          <Box display="flex" alignItems="center" color="success.main">
            <TrendingUpIcon fontSize="small" />
            <Typography variant="body2" ml={0.5}>
              +{growthRate}%
            </Typography>
          </Box>
        );
      case "down":
        return (
          <Box display="flex" alignItems="center" color="error.main">
            <TrendingUpIcon
              fontSize="small"
              sx={{ transform: "rotate(180deg)" }}
            />
            <Typography variant="body2" ml={0.5}>
              {growthRate}%
            </Typography>
          </Box>
        );
      default:
        return (
          <Box display="flex" alignItems="center" color="text.secondary">
            <TrendingUpIcon
              fontSize="small"
              sx={{ transform: "rotate(90deg)" }}
            />
            <Typography variant="body2" ml={0.5}>
              {growthRate}%
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Card>
      <CardHeader
        title="Top Performing Playlists"
        action={
          <Button size="small" startIcon={<DownloadIcon />}>
            Export
          </Button>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Playlist</TableCell>
                <TableCell align="right">Followers</TableCell>
                <TableCell align="right">Plays</TableCell>
                <TableCell align="right">Completion</TableCell>
                <TableCell align="right">Engagement</TableCell>
                <TableCell align="center">Trend</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {playlists.map((playlist) => (
                <TableRow key={playlist.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {playlist.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {playlist.tracks} tracks • Updated{" "}
                        {playlist.lastUpdated}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {playlist.followers.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    {playlist.totalPlays.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="flex-end"
                    >
                      <Box width="40px" mr={1}>
                        <LinearProgress
                          variant="determinate"
                          value={playlist.avgCompletion}
                          color={
                            playlist.avgCompletion > 80 ? "success" : "warning"
                          }
                          sx={{ height: 4 }}
                        />
                      </Box>
                      {playlist.avgCompletion}%
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${playlist.engagement}%`}
                      color={
                        playlist.engagement > 90
                          ? "success"
                          : playlist.engagement > 80
                            ? "warning"
                            : "default"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {getTrendIcon(playlist.trend, playlist.growthRate)}
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

// Content discovery and recommendations
const ContentDiscovery = ({ data }) => {
  const discoveryData = {
    newTracks: 1234,
    pendingReviews: 56,
    approvedTracks: 789,
    rejectedTracks: 45,
    trendingtracks: [
      {
        id: 1,
        title: "Cosmic Journey",
        artist: "Space Odyssey",
        score: 95,
        genre: "Electronic"
      },
      {
        id: 2,
        title: "Urban Dreams",
        artist: "City Sounds",
        score: 92,
        genre: "Hip Hop"
      },
      {
        id: 3,
        title: "Forest Whispers",
        artist: "Nature Collective",
        score: 89,
        genre: "Ambient"
      },
      {
        id: 4,
        title: "Neon Nights",
        artist: "Synth Masters",
        score: 87,
        genre: "Synthwave"
      },
      {
        id: 5,
        title: "Ocean Breeze",
        artist: "Coastal Vibes",
        score: 85,
        genre: "Chill"
      },
    ],
    aiRecommendations: 23,
    curatorPicks: 12
  };

  return (
    <Card>
      <CardHeader
        title="Content Discovery"
        action={
          <Badge badgeContent={discoveryData.pendingReviews} color="warning">
            <RecommendIcon />
          </Badge>
        }
      />
      <CardContent>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                {discoveryData.newTracks}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                New Tracks
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main">
                {discoveryData.pendingReviews}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Pending Reviews
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main">
                {discoveryData.approvedTracks}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Approved
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="info.main">
                {discoveryData.aiRecommendations}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                AI Recommendations
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom>
          Trending Tracks for Your Playlists
        </Typography>
        <List dense>
          {discoveryData.trendingtracks.map((track, index) => (
            <React.Fragment key={track.id}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar
                    sx={{ bgcolor: "success.light", width: 32, height: 32 }}
                  >
                    {track.score}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box>
                        <Typography variant="body1">{track.title}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {track.artist} • {track.genre}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1}>
                        <IconButton size="small" color="success">
                          <AddIcon />
                        </IconButton>
                        <IconButton size="small">
                          <ViewIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
              {index < discoveryData.trendingtracks.length - 1 && (
                <Divider variant="inset" component="li" />
              )}
            </React.Fragment>
          ))}
        </List>

        <Button
          variant="outlined"
          startIcon={<AiIcon />}
          fullWidth
          sx={{ mt: 2 }}
        >
          Get AI-Powered Recommendations
        </Button>
      </CardContent>
    </Card>
  );
};

// Playlist analytics and insights
const PlaylistAnalytics = ({ data }) => {
  const analyticsData = {
    totalEngagement: 87.5,
    skipRate: 12.3,
    addToPlaylistRate: 8.9,
    shareRate: 5.4,
    avgSessionLength: 28.5,
    peakListeningHours: ["6-9 AM", "12-2 PM", "6-9 PM"],
    topGenres: [
      { genre: "Indie Rock", percentage: 32.1 },
      { genre: "Electronic", percentage: 24.7 },
      { genre: "Alternative", percentage: 18.9 },
      { genre: "Ambient", percentage: 12.4 },
      { genre: "Jazz", percentage: 11.9 },
    ],
    playlistHealth: {
      freshness: 85, // How often playlists are updated
      diversity: 78, // Genre/artist diversity
      quality: 92, // Track quality score
      engagement: 87, // User engagement
    }
  };

  const healthMetrics = [
    {
      name: "Freshness",
      value: analyticsData.playlistHealth.freshness,
      color: "primary"
    },
    {
      name: "Diversity",
      value: analyticsData.playlistHealth.diversity,
      color: "secondary"
    },
    {
      name: "Quality",
      value: analyticsData.playlistHealth.quality,
      color: "success"
    },
    {
      name: "Engagement",
      value: analyticsData.playlistHealth.engagement,
      color: "info"
    },
  ];

  return (
    <Card>
      <CardHeader title="Playlist Analytics & Insights" />
      <CardContent>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main">
                {analyticsData.totalEngagement}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Engagement Rate
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main">
                {analyticsData.skipRate}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Skip Rate
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                {analyticsData.addToPlaylistRate}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Add to Playlist
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="secondary">
                {analyticsData.avgSessionLength}m
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Avg Session
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom>
          Playlist Health Score
        </Typography>
        <Grid container spacing={2} mb={3}>
          {healthMetrics.map((metric, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <Box textAlign="center">
                <Typography variant="h5" color={`${metric.color}.main`}>
                  {metric.value}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {metric.name}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={metric.value}
                  color={metric.color}
                  sx={{ mt: 0.5, height: 4 }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>

        <Typography variant="h6" gutterBottom>
          Top Genres in Your Playlists
        </Typography>
        {analyticsData.topGenres.map((genre, index) => (
          <Box key={index} mb={1}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2">{genre.genre}</Typography>
              <Typography variant="body2" fontWeight="bold">
                {genre.percentage}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={genre.percentage}
              color="primary"
              sx={{ height: 6, borderRadius: 1 }}
            />
          </Box>
        ))}

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Peak listening hours:</strong>{" "}
            {analyticsData.peakListeningHours.join(", ")}
            <br />
            Consider updating playlists during these times for maximum impact.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

// Curator insights and recommendations
const CuratorInsights = ({ data }) => {
  const insights = [
    {
      type: "optimization",
      title: "Playlist Optimization Opportunity",
      message:
        '"Electronic Vibes" has high skip rates in the middle section. Consider reordering tracks 15-25.',
      priority: "high",
      action: "Reorder Tracks"
    },
    {
      type: "trending",
      title: "Trending Genre Alert",
      message:
        'Synthwave is trending 47% above average. Your "Neon Nights" playlist is well-positioned.',
      priority: "medium",
      action: "Add More Tracks"
    },
    {
      type: "engagement",
      title: "High Engagement Detected",
      message:
        '"Chill Sunday" has 95% engagement rate. Consider creating similar ambient playlists.',
      priority: "low",
      action: "Create Similar"
    },
    {
      type: "freshness",
      title: "Update Reminder",
      message:
        '"Jazz Classics" hasn\'t been updated in 7 days. Fresh content improves discovery.',
      priority: "medium",
      action: "Update Playlist"
    },
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
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

  const getInsightIcon = (type) => {
    switch (type) {
      case "optimization":
        return <ChartIcon />;
      case "trending":
        return <TrendingUpIcon />;
      case "engagement":
        return <FavoriteIcon />;
      case "freshness":
        return <ScheduleIcon />;
      default:
        return <AiIcon />;
    }
  };

  return (
    <Card>
      <CardHeader
        title="AI-Powered Curator Insights"
        action={
          <Chip
            label="4 New Insights"
            color="primary"
            size="small"
            icon={<AiIcon />}
          />
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <List>
          {insights.map((insight, index) => (
            <React.Fragment key={index}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: `${getPriorityColor(insight.priority)}.light`
                    }}
                  >
                    {getInsightIcon(insight.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body1" fontWeight="bold">
                        {insight.title}
                      </Typography>
                      <Chip
                        label={insight.priority}
                        color={getPriorityColor(insight.priority)}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" mb={1}>
                        {insight.message}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        color={getPriorityColor(insight.priority)}
                      >
                        {insight.action}
                      </Button>
                    </Box>
                  }
                />
              </ListItem>
              {index < insights.length - 1 && (
                <Divider variant="inset" component="li" />
              )}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

// Main curator dashboard component
const CuratorDashboard = ({ curatorId, userRole }) => {
  const [timeRange, setTimeRange] = useState("30d");
  const [playlistFilter, setPlaylistFilter] = useState("all");

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const handlePlaylistFilterChange = (event) => {
    setPlaylistFilter(event.target.value);
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
        <Typography variant="h4">Curator Dashboard</Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={handleTimeRangeChange}
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Playlists</InputLabel>
            <Select
              value={playlistFilter}
              label="Playlists"
              onChange={handlePlaylistFilterChange}
            >
              <MenuItem value="all">All Playlists</MenuItem>
              <MenuItem value="active">Active Only</MenuItem>
              <MenuItem value="trending">Trending</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<DownloadIcon />}>
            Export Report
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Performance overview */}
        <Grid item xs={12}>
          <CuratorPerformanceOverview />
        </Grid>

        {/* Top performing playlists */}
        <Grid item xs={12} md={8}>
          <TopPerformingPlaylists />
        </Grid>

        {/* Content discovery */}
        <Grid item xs={12} md={4}>
          <ContentDiscovery />
        </Grid>

        {/* Playlist analytics */}
        <Grid item xs={12} md={6}>
          <PlaylistAnalytics />
        </Grid>

        {/* AI insights */}
        <Grid item xs={12} md={6}>
          <CuratorInsights />
        </Grid>

        {/* Summary and recommendations */}
        <Grid item xs={12}>
          <Alert severity="success" icon={<StarIcon />}>
            <Typography variant="body1" fontWeight="bold">
              Curator Performance Summary
            </Typography>
            <Typography variant="body2">
              Excellent work! Your playlists are performing 23% above platform
              average. "Indie Rock Essentials" is trending and gaining 15% more
              followers weekly. Consider expanding your electronic music
              curation based on high engagement rates. You have 56 tracks
              pending review and 23 AI recommendations waiting.
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CuratorDashboard;
