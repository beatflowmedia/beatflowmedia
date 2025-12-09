// src/components/analytics/PlaybackAnalytics.js
// Playback analytics with detailed music industry metrics

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
  Divider
} from "@mui/material";
import {
  PlayArrow as PlayIcon as SkipIcon as VolumeIcon,
  HighQuality as QualityIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
  Album as AlbumIcon,
  Person as ArtistIcon as GlobalIcon
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { Avatar } from '@mui/material/Avatar';

// Chart component for playback trends
const PlaybackChart = ({ data, metric, title }) => {
  const theme = useTheme();

  // Simple bar chart for playback data
  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <Box p={2} textAlign="center">
          <Typography color="textSecondary">No data available</Typography>
        </Box>
      );
    }

    const maxValue = Math.max(...data.map((d) => d[metric] || 0));

    return (
      <Box p={2}>
        {data.slice(-10).map((item, index) => (
          <Box key={index} mb={1}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2">
                {item.date || item.name || `Item ${index + 1}`}
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {(item[metric] || 0).toLocaleString()}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={((item[metric] || 0) / maxValue) * 100}
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Card>
      <CardHeader title={title} />
      <CardContent sx={{ pt: 0 }}>{renderChart()}</CardContent>
    </Card>
  );
};

// Top tracks component
const TopTracks = ({ tracks = [] }) => {
  return (
    <Card>
      <CardHeader title="Top Tracks (24h)" />
      <CardContent sx={{ pt: 0 }}>
        <List>
          {tracks.slice(0, 10).map((track, index) => (
            <React.Fragment key={track.id || index}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "primary.light" }}>{index + 1}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body1" noWrap>
                        {track.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {track.playCount?.toLocaleString()} plays
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        {track.artist}
                      </Typography>
                      <Box display="flex" gap={1} mt={0.5}>
                        <Chip
                          label={`${track.completionRate}% completion`}
                          size="small"
                          color={
                            track.completionRate > 80 ? "success" : "default"
                          }
                        />
                        <Chip
                          label={`${track.avgDuration}s avg`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
              {index < tracks.length - 1 && index < 9 && (
                <Divider variant="inset" component="li" />
              )}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

// Quality metrics component
const QualityMetrics = ({ data }) => {
  const qualityDistribution = data?.qualityDistribution || {};
  const qualityData = Object.entries(qualityDistribution).map(
    ([quality, percentage]) => ({
      quality,
      percentage
    }),
  );

  return (
    <Card>
      <CardHeader title="Audio Quality Distribution" />
      <CardContent>
        <Grid container spacing={2}>
          {qualityData.map((item) => (
            <Grid item xs={6} sm={3} key={item.quality}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {item.percentage}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {item.quality.toUpperCase()}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Box mt={3}>
          <Typography variant="body2" gutterBottom>
            Average Bitrate: {data?.avgBitrate || 256} kbps
          </Typography>
          <LinearProgress
            variant="determinate"
            value={((data?.avgBitrate || 256) / 320) * 100}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>

        <Box mt={2}>
          <Typography variant="body2" gutterBottom>
            Quality Switches: {data?.qualitySwitches || 0} (last 24h)
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Adaptive streaming effectiveness:{" "}
            {data?.adaptiveEffectiveness || 85}%
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// Geographic distribution component
const GeographicDistribution = ({ data = [] }) => {
  return (
    <Card>
      <CardHeader title="Geographic Distribution" />
      <CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Territory</TableCell>
                <TableCell align="right">Plays</TableCell>
                <TableCell align="right">Revenue</TableCell>
                <TableCell align="right">Avg Duration</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.slice(0, 10).map((territory) => (
                <TableRow key={territory.code}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar
                        sx={{ width: 24, height: 24, mr: 1, fontSize: 12 }}
                      >
                        {territory.code}
                      </Avatar>
                      {territory.name}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {territory.plays?.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    ${territory.revenue?.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">{territory.avgDuration}s</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

// Royalty analytics component
const RoyaltyAnalytics = ({ data, userRole }) => {
  if (userRole !== "admin" && userRole !== "artist") {
    return null;
  }

  return (
    <Card>
      <CardHeader title="Royalty Analytics" />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                {data?.royaltyQualifyingPlays?.toLocaleString() || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Qualifying Plays
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main">
                ${data?.totalRoyalties?.toFixed(2) || "0.00"}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Royalties
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="info.main">
                ${data?.avgRoyaltyPerPlay?.toFixed(4) || "0.0000"}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Avg per Play
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main">
                {data?.royaltyRate?.toFixed(2) || 0}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Qualification Rate
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box mt={3}>
          <Typography variant="body2" gutterBottom>
            Revenue by Subscription Tier
          </Typography>
          {data?.revenueByTier &&
            Object.entries(data.revenueByTier).map(([tier, amount]) => (
              <Box
                key={tier}
                display="flex"
                justifyContent="space-between"
                mb={1}
              >
                <Typography
                  variant="body2"
                  sx={{ textTransform: "capitalize" }}
                >
                  {tier}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  ${amount.toFixed(2)}
                </Typography>
              </Box>
            ))}
        </Box>
      </CardContent>
    </Card>
  );
};

// Main playback analytics component
const PlaybackAnalytics = ({ data, realtimeData, userRole }) => {
  const [timeRange, setTimeRange] = useState("24h");
  const [selectedMetric, setSelectedMetric] = useState("plays");

  // Sample data structure
  const playbackData = {
    overview: {
      totalPlays: 125420,
      uniqueListeners: 8934,
      totalDuration: 2847293, // in seconds
      avgSessionDuration: 18.5, // in minutes
      completionRate: 73.2,
      skipRate: 14.8,
      repeatRate: 8.3
    },
    qualityDistribution: {
      low: 15,
      medium: 35,
      high: 45,
      lossless: 5
    },
    avgBitrate: 284,
    qualitySwitches: 1247,
    adaptiveEffectiveness: 87,
    topTracks: [
      {
        id: 1,
        title: "Midnight Dreams",
        artist: "Luna Eclipse",
        playCount: 3421,
        completionRate: 89,
        avgDuration: 187
      },
      {
        id: 2,
        title: "Electric Vibes",
        artist: "Synth Wave",
        playCount: 2987,
        completionRate: 76,
        avgDuration: 203
      },
      // ... more tracks
    ],
    geographicData: [
      {
        code: "US",
        name: "United States",
        plays: 45230,
        revenue: 452.3,
        avgDuration: 165
      },
      {
        code: "CA",
        name: "Canada",
        plays: 12450,
        revenue: 124.5,
        avgDuration: 178
      },
      // ... more territories
    ],
    royaltyData: {
      royaltyQualifyingPlays: 98234,
      totalRoyalties: 1247.89,
      avgRoyaltyPerPlay: 0.0127,
      royaltyRate: 78.3,
      revenueByTier: {
        premium: 789.23,
        family: 234.56,
        student: 123.45,
        free: 100.65
      }
    },
    trends: {
      daily: [
        { date: "2024-01-01", plays: 4523, duration: 12456 },
        { date: "2024-01-02", plays: 5234, duration: 14567 },
        // ... more daily data
      ]
    }
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const handleMetricChange = (event) => {
    setSelectedMetric(event.target.value);
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
        <Typography variant="h6">Playback Analytics</Typography>
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
            <InputLabel>Metric</InputLabel>
            <Select
              value={selectedMetric}
              label="Metric"
              onChange={handleMetricChange}
            >
              <MenuItem value="plays">Plays</MenuItem>
              <MenuItem value="duration">Duration</MenuItem>
              <MenuItem value="users">Unique Users</MenuItem>
              <MenuItem value="revenue">Revenue</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<TrendingUpIcon />}>
            Export Data
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Overview metrics */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Playback Overview" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Avatar
                      sx={{ bgcolor: "primary.light", mx: "auto", mb: 1 }}
                    >
                      <PlayIcon />
                    </Avatar>
                    <Typography variant="h4" color="primary">
                      {playbackData.overview.totalPlays.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Plays
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Avatar
                      sx={{ bgcolor: "secondary.light", mx: "auto", mb: 1 }}
                    >
                      <ArtistIcon />
                    </Avatar>
                    <Typography variant="h4" color="secondary">
                      {playbackData.overview.uniqueListeners.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Unique Listeners
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Avatar
                      sx={{ bgcolor: "success.light", mx: "auto", mb: 1 }}
                    >
                      <TimerIcon />
                    </Avatar>
                    <Typography variant="h4" color="success.main">
                      {playbackData.overview.avgSessionDuration.toFixed(1)}m
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Avg Session
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Avatar sx={{ bgcolor: "info.light", mx: "auto", mb: 1 }}>
                      <QualityIcon />
                    </Avatar>
                    <Typography variant="h4" color="info.main">
                      {playbackData.overview.completionRate}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Completion Rate
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Additional metrics */}
              <Box mt={3}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Skip Rate
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={playbackData.overview.skipRate}
                      color="warning"
                      sx={{ mt: 0.5 }}
                    />
                    <Typography variant="body2" mt={0.5}>
                      {playbackData.overview.skipRate}%
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Repeat Rate
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={playbackData.overview.repeatRate}
                      color="success"
                      sx={{ mt: 0.5 }}
                    />
                    <Typography variant="body2" mt={0.5}>
                      {playbackData.overview.repeatRate}%
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      Quality Score
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={85}
                      color="info"
                      sx={{ mt: 0.5 }}
                    />
                    <Typography variant="body2" mt={0.5}>
                      85/100
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Charts and trends */}
        <Grid item xs={12} md={8}>
          <PlaybackChart
            data={playbackData.trends.daily}
            metric={selectedMetric}
            title={`${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Trends`}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <QualityMetrics data={playbackData} />
        </Grid>

        {/* Top tracks */}
        <Grid item xs={12} md={6}>
          <TopTracks tracks={playbackData.topTracks} />
        </Grid>

        {/* Geographic distribution */}
        <Grid item xs={12} md={6}>
          <GeographicDistribution data={playbackData.geographicData} />
        </Grid>

        {/* Royalty analytics (if permitted) */}
        {(userRole === "admin" || userRole === "artist") && (
          <Grid item xs={12}>
            <RoyaltyAnalytics
              data={playbackData.royaltyData}
              userRole={userRole}
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default PlaybackAnalytics;
