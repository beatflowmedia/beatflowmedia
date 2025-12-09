// src/components/analytics/ArtistDashboard.js
// Business intelligence dashboard specifically designed for artists

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
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  PlayArrow as PlayIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon as GlobalIcon,
  Star as StarIcon as DownloadIcon,
  Album as AlbumIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { Avatar } from '@mui/material/Avatar';

// Artist performance overview
const ArtistPerformanceOverview = ({ data }) => {
  const performance = {
    totalPlays: 1245678,
    monthlyPlays: 234567,
    totalEarnings: 12456.78,
    monthlyEarnings: 2345.67,
    totalFans: 45789,
    newFans: 1234,
    averageCompletion: 78.5,
    topTerritory: "United States"
  };

  const metrics = [
    {
      title: "Total Plays",
      value: performance.totalPlays,
      change: "+15.2%",
      icon: <PlayIcon />,
      color: "primary"
    },
    {
      title: "Monthly Earnings",
      value: `$${performance.monthlyEarnings.toLocaleString()}`,
      change: "+23.1%",
      icon: <MoneyIcon />,
      color: "success"
    },
    {
      title: "Total Fans",
      value: performance.totalFans,
      change: "+8.7%",
      icon: <PersonIcon />,
      color: "secondary"
    },
    {
      title: "Completion Rate",
      value: `${performance.averageCompletion}%`,
      change: "+2.3%",
      icon: <StarIcon />,
      color: "info"
    },
  ];

  return (
    <Card>
      <CardHeader title="Performance Overview" />
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
                <Chip
                  label={metric.change}
                  color="success"
                  size="small"
                  icon={<TrendingUpIcon />}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

// Top tracks performance
const TopTracksPerformance = ({ data }) => {
  const tracks = [
    {
      id: 1,
      title: "Midnight Dreams",
      album: "Nocturnal Visions",
      plays: 245678,
      earnings: 2456.78,
      completion: 85.2,
      likes: 12345,
      shares: 567,
      trend: "up"
    },
    {
      id: 2,
      title: "Electric Horizon",
      album: "Digital Landscapes",
      plays: 189234,
      earnings: 1892.34,
      completion: 78.9,
      likes: 9876,
      shares: 432,
      trend: "up"
    },
    {
      id: 3,
      title: "Ocean Waves",
      album: "Natural Sounds",
      plays: 156789,
      earnings: 1567.89,
      completion: 92.1,
      likes: 8765,
      shares: 321,
      trend: "stable"
    },
    {
      id: 4,
      title: "City Lights",
      album: "Urban Symphony",
      plays: 134567,
      earnings: 1345.67,
      completion: 76.4,
      likes: 7654,
      shares: 289,
      trend: "down"
    },
    {
      id: 5,
      title: "Silent Echo",
      album: "Minimalist",
      plays: 123456,
      earnings: 1234.56,
      completion: 88.7,
      likes: 6543,
      shares: 234,
      trend: "up"
    },
  ];

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "up":
        return <TrendingUpIcon color="success" fontSize="small" />;
      case "down":
        return (
          <TrendingUpIcon
            color="error"
            fontSize="small"
            sx={{ transform: "rotate(180deg)" }}
          />
        );
      default:
        return (
          <TrendingUpIcon
            color="disabled"
            fontSize="small"
            sx={{ transform: "rotate(90deg)" }}
          />
        );
    }
  };

  return (
    <Card>
      <CardHeader
        title="Top Tracks Performance"
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
                <TableCell>Track</TableCell>
                <TableCell align="right">Plays</TableCell>
                <TableCell align="right">Earnings</TableCell>
                <TableCell align="right">Completion</TableCell>
                <TableCell align="right">Engagement</TableCell>
                <TableCell align="center">Trend</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tracks.map((track) => (
                <TableRow key={track.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {track.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {track.album}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {track.plays.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color="success.main"
                    >
                      ${track.earnings.toFixed(2)}
                    </Typography>
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
                          value={track.completion}
                          color={track.completion > 80 ? "success" : "warning"}
                          sx={{ height: 4 }}
                        />
                      </Box>
                      {track.completion}%
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box>
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="flex-end"
                        mb={0.5}
                      >
                        <FavoriteIcon
                          fontSize="small"
                          color="error"
                          sx={{ mr: 0.5 }}
                        />
                        <Typography variant="body2">
                          {track.likes.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="flex-end"
                      >
                        <ShareIcon
                          fontSize="small"
                          color="primary"
                          sx={{ mr: 0.5 }}
                        />
                        <Typography variant="body2">{track.shares}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {getTrendIcon(track.trend)}
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

// Revenue analytics for artists
const ArtistRevenueAnalytics = ({ data }) => {
  const revenueData = {
    totalEarnings: 12456.78,
    thisMonth: 2345.67,
    lastMonth: 1987.45,
    royaltyRate: 0.01,
    payoutSchedule: "Monthly",
    nextPayout: "2024-02-01",
    pendingRoyalties: 567.89,
    territoryBreakdown: {
      "United States": 45.2,
      Canada: 12.8,
      "United Kingdom": 10.5,
      Germany: 8.7,
      France: 6.3,
      Others: 16.5
    }
  };

  const monthlyTrend = [
    { month: "Oct", earnings: 1567.89 },
    { month: "Nov", earnings: 1789.23 },
    { month: "Dec", earnings: 1987.45 },
    { month: "Jan", earnings: 2345.67 },
  ];

  return (
    <Card>
      <CardHeader title="Revenue Analytics" />
      <CardContent>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main">
                ${revenueData.totalEarnings.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Earnings
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                ${revenueData.thisMonth.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                This Month
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main">
                ${revenueData.pendingRoyalties.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Pending Royalties
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="info.main">
                ${revenueData.royaltyRate.toFixed(4)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Per Play Rate
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom>
          Revenue by Territory
        </Typography>
        {Object.entries(revenueData.territoryBreakdown).map(
          ([territory, percentage]) => (
            <Box key={territory} mb={1}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2">{territory}</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {percentage}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={percentage}
                color="primary"
                sx={{ height: 6, borderRadius: 1 }}
              />
            </Box>
          ),
        )}

        <Alert severity="info" sx={{ mt: 2 }}>
          Next payout scheduled for {revenueData.nextPayout}. Payments are
          processed {revenueData.payoutSchedule.toLowerCase()}.
        </Alert>
      </CardContent>
    </Card>
  );
};

// Fan engagement metrics
const FanEngagement = ({ data }) => {
  const fanData = {
    totalFans: 45789,
    newFansThisMonth: 1234,
    fanGrowthRate: 8.7,
    averageListensPerFan: 12.4,
    topFanCountries: [
      { country: "United States", fans: 15234, percentage: 33.3 },
      { country: "Canada", fans: 5678, percentage: 12.4 },
      { country: "United Kingdom", fans: 4567, percentage: 10.0 },
      { country: "Germany", fans: 3456, percentage: 7.5 },
      { country: "France", fans: 2890, percentage: 6.3 },
    ],
    fanActivities: [
      { activity: "Added to Playlist", count: 12345 },
      { activity: "Shared Track", count: 5678 },
      { activity: "Liked Track", count: 23456 },
      { activity: "Followed Artist", count: 1234 },
    ]
  };

  return (
    <Card>
      <CardHeader title="Fan Engagement" />
      <CardContent>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                {fanData.totalFans.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Fans
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main">
                {fanData.newFansThisMonth.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                New This Month
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="info.main">
                {fanData.fanGrowthRate}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Growth Rate
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="secondary">
                {fanData.averageListensPerFan}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Avg Listens/Fan
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom>
          Top Fan Countries
        </Typography>
        <List dense>
          {fanData.topFanCountries.map((country, index) => (
            <React.Fragment key={country.country}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar
                    sx={{ bgcolor: "primary.light", width: 32, height: 32 }}
                  >
                    {index + 1}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body1">{country.country}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {country.fans.toLocaleString()} ({country.percentage}%)
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < fanData.topFanCountries.length - 1 && (
                <Divider variant="inset" component="li" />
              )}
            </React.Fragment>
          ))}
        </List>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Fan Activities (30 days)
        </Typography>
        {fanData.fanActivities.map((activity, index) => (
          <Box key={index} mb={1}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2">{activity.activity}</Typography>
              <Typography variant="body2" fontWeight="bold">
                {activity.count.toLocaleString()}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(activity.count / 25000) * 100}
              color="secondary"
              sx={{ height: 4, borderRadius: 1 }}
            />
          </Box>
        ))}
      </CardContent>
    </Card>
  );
};

// Release performance tracking
const ReleasePerformance = ({ data }) => {
  const releases = [
    {
      id: 1,
      title: "Nocturnal Visions",
      type: "Album",
      releaseDate: "2024-01-15",
      tracks: 12,
      totalPlays: 456789,
      earnings: 4567.89,
      daysActive: 15,
      peakPosition: 15
    },
    {
      id: 2,
      title: "Electric Horizon (Single)",
      type: "Single",
      releaseDate: "2023-12-01",
      tracks: 1,
      totalPlays: 189234,
      earnings: 1892.34,
      daysActive: 60,
      peakPosition: 8
    },
    {
      id: 3,
      title: "Digital Landscapes",
      type: "EP",
      releaseDate: "2023-10-20",
      tracks: 5,
      totalPlays: 234567,
      earnings: 2345.67,
      daysActive: 102,
      peakPosition: 22
    },
  ];

  return (
    <Card>
      <CardHeader title="Release Performance" />
      <CardContent sx={{ pt: 0 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Release</TableCell>
                <TableCell align="right">Plays</TableCell>
                <TableCell align="right">Earnings</TableCell>
                <TableCell align="right">Days Active</TableCell>
                <TableCell align="right">Peak Position</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {releases.map((release) => (
                <TableRow key={release.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {release.title}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={release.type}
                          size="small"
                          color="primary"
                        />
                        <Typography variant="body2" color="textSecondary">
                          {release.tracks} tracks
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {release.totalPlays.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color="success.main"
                    >
                      ${release.earnings.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{release.daysActive}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`#${release.peakPosition}`}
                      size="small"
                      color={
                        release.peakPosition <= 10
                          ? "success"
                          : release.peakPosition <= 20
                            ? "warning"
                            : "default"
                      }
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

// Main artist dashboard component
const ArtistDashboard = ({ artistId, userRole }) => {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("plays");

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const handleMetricChange = (event) => {
    setSelectedMetric(event.target.value);
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
        <Typography variant="h4">Artist Analytics Dashboard</Typography>
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
              <MenuItem value="1y">Last Year</MenuItem>
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
          <ArtistPerformanceOverview />
        </Grid>

        {/* Top tracks */}
        <Grid item xs={12} md={8}>
          <TopTracksPerformance />
        </Grid>

        {/* Revenue analytics */}
        <Grid item xs={12} md={4}>
          <ArtistRevenueAnalytics />
        </Grid>

        {/* Fan engagement */}
        <Grid item xs={12} md={6}>
          <FanEngagement />
        </Grid>

        {/* Release performance */}
        <Grid item xs={12} md={6}>
          <ReleasePerformance />
        </Grid>

        {/* Insights and recommendations */}
        <Grid item xs={12}>
          <Alert severity="info" icon={<AssessmentIcon />}>
            <Typography variant="body1" fontWeight="bold">
              AI-Powered Insights
            </Typography>
            <Typography variant="body2">
              • Your completion rate has improved by 5% this month - fans are
              engaging more with your full tracks • "Midnight Dreams" is
              performing exceptionally well in the US market - consider targeted
              promotion • Fan growth is accelerating - your recent releases are
              resonating with new audiences • Revenue per play has increased 12%
              - your content quality improvements are paying off
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ArtistDashboard;
