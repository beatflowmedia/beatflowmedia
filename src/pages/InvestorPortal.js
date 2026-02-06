import { useState, useEffect, useCallback } from "react";
import { usePlayer } from '../context/PlayerContext';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import { TrendingUp, TrendingDown, AttachMoney, People, MusicNote, FileDownload, MonetizationOn, PlayArrow, LocationOn, Campaign } from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, query, where, orderBy, limit, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';

const METRIC_COLORS = {
  primary: '#1DB954',
  secondary: '#1ed760',
  accent: '#ff6b6b',
  warning: '#ffa726',
  info: '#29b6f6',
  success: '#66bb6a'
};

const TIME_PERIODS = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 3 Months', value: '3m' },
  { label: 'Last 6 Months', value: '6m' },
  { label: 'Last Year', value: '1y' },
  { label: 'All Time', value: 'all' }
];

const DASHBOARD_TABS = [
  'Overview',
  'Revenue',
  'User Growth',
  'Content',
  'Geographic',
  'Reports'
];

export default function InvestorPortal() {
  const { user } = useAuth();
  const { dispatch, actions } = usePlayer();

  // Play track function
  const handlePlayTrack = useCallback((track) => {
    dispatch({ type: actions.PLAY_SONG, payload: track });
  }, [dispatch, actions]);

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [timePeriod, setTimePeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalRevenue: 0,
      monthlyRecurringRevenue: 0,
      totalUsers: 0,
      activeUsers: 0,
      totalStreams: 0,
      totalTracks: 0,
      growth: {
        revenue: 0,
        users: 0,
        streams: 0
      }
    },
    revenueData: [],
    userGrowthData: [],
    contentData: [],
    geographicData: [],
    topArtists: [],
    topTracks: [],
    recentActivity: []
  });

  // UI state
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reportDateRange, setReportDateRange] = useState({
    start: '',
    end: ''
  });

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Load overview metrics
        await loadOverviewMetrics();

        // Load time-series data
        await loadTimeSeriesData();

        // Load content analytics
        await loadContentAnalytics();

        // Load geographic data
        await loadGeographicData();

        // Load recent activity
        await loadRecentActivity();

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    // Set up real-time listeners for key metrics
    const unsubscribes = setupRealTimeListeners();

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user, timePeriod]);

  // Load overview metrics
  const loadOverviewMetrics = async () => {
    try {
      // Load total revenue
      const revenueQuery = query(
        collection(db, 'revenue'),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      const revenueSnapshot = await getDocs(revenueQuery);
      const latestRevenue = revenueSnapshot.docs[0]?.data();

      // Load user metrics
      const usersQuery = query(
        collection(db, 'userMetrics'),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      const usersSnapshot = await getDocs(usersQuery);
      const latestUsers = usersSnapshot.docs[0]?.data();

      // Load content metrics
      const contentQuery = query(
        collection(db, 'contentMetrics'),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      const contentSnapshot = await getDocs(contentQuery);
      const latestContent = contentSnapshot.docs[0]?.data();

      setDashboardData(prev => ({
        ...prev,
        overview: {
          totalRevenue: latestRevenue?.totalRevenue || 0,
          monthlyRecurringRevenue: latestRevenue?.monthlyRecurringRevenue || 0,
          totalUsers: latestUsers?.totalUsers || 0,
          activeUsers: latestUsers?.activeUsers || 0,
          totalStreams: latestContent?.totalStreams || 0,
          totalTracks: latestContent?.totalTracks || 0,
          growth: {
            revenue: latestRevenue?.growth?.revenue || 0,
            users: latestUsers?.growth?.users || 0,
            streams: latestContent?.growth?.streams || 0
          }
        }
      }));
    } catch (error) {
      console.error('Error loading overview metrics:', error);
    }
  };

  // Load time-series data
  const loadTimeSeriesData = async () => {
    try {
      const endDate = new Date();
      const startDate = getStartDateForPeriod(timePeriod, endDate);

      // Load revenue data
      const revenueQuery = query(
        collection(db, 'dailyRevenue'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'asc')
      );
      const revenueSnapshot = await getDocs(revenueQuery);
      const revenueData = revenueSnapshot.docs.map(doc => ({
        date: doc.data().date.toDate().toLocaleDateString(),
        revenue: doc.data().revenue,
        subscriptions: doc.data().subscriptions,
        oneTime: doc.data().oneTime
      }));

      // Load user growth data
      const userGrowthQuery = query(
        collection(db, 'dailyUserGrowth'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'asc')
      );
      const userGrowthSnapshot = await getDocs(userGrowthQuery);
      const userGrowthData = userGrowthSnapshot.docs.map(doc => ({
        date: doc.data().date.toDate().toLocaleDateString(),
        newUsers: doc.data().newUsers,
        totalUsers: doc.data().totalUsers,
        churn: doc.data().churn
      }));

      setDashboardData(prev => ({
        ...prev,
        revenueData,
        userGrowthData
      }));
    } catch (error) {
      console.error('Error loading time-series data:', error);
    }
  };

  // Load content analytics
  const loadContentAnalytics = async () => {
    try {
      // Load top artists
      const topArtistsQuery = query(
        collection(db, 'artists'),
        orderBy('totalStreams', 'desc'),
        limit(10)
      );
      const topArtistsSnapshot = await getDocs(topArtistsQuery);
      const topArtists = topArtistsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Load top tracks
      const topTracksQuery = query(
        collection(db, 'songs'),
        orderBy('playCount', 'desc'),
        limit(10)
      );
      const topTracksSnapshot = await getDocs(topTracksQuery);
      const topTracks = topTracksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Load content growth data
      const contentQuery = query(
        collection(db, 'dailyContent'),
        orderBy('date', 'desc'),
        limit(30)
      );
      const contentSnapshot = await getDocs(contentQuery);
      const contentData = contentSnapshot.docs.map(doc => ({
        date: doc.data().date.toDate().toLocaleDateString(),
        newTracks: doc.data().newTracks,
        newArtists: doc.data().newArtists,
        totalStreams: doc.data().totalStreams
      })).reverse();

      setDashboardData(prev => ({
        ...prev,
        topArtists,
        topTracks,
        contentData
      }));
    } catch (error) {
      console.error('Error loading content analytics:', error);
    }
  };

  // Load geographic data
  const loadGeographicData = async () => {
    try {
      const geoQuery = query(
        collection(db, 'geographicMetrics'),
        orderBy('users', 'desc'),
        limit(20)
      );
      const geoSnapshot = await getDocs(geoQuery);
      const geographicData = geoSnapshot.docs.map(doc => ({
        country: doc.id,
        ...doc.data()
      }));

      setDashboardData(prev => ({
        ...prev,
        geographicData
      }));
    } catch (error) {
      console.error('Error loading geographic data:', error);
    }
  };

  // Load recent activity
  const loadRecentActivity = async () => {
    try {
      const activityQuery = query(
        collection(db, 'platformActivity'),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      const activitySnapshot = await getDocs(activityQuery);
      const recentActivity = activitySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setDashboardData(prev => ({
        ...prev,
        recentActivity
      }));
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  // Set up real-time listeners
  const setupRealTimeListeners = () => {
    const unsubscribes = [];

    // Real-time revenue updates
    const revenueUnsubscribe = onSnapshot(
      query(collection(db, 'revenue'), orderBy('timestamp', 'desc'), limit(1)),
      (snapshot) => {
        if (!snapshot.empty) {
          const latestRevenue = snapshot.docs[0].data();
          setDashboardData(prev => ({
            ...prev,
            overview: {
              ...prev.overview,
              totalRevenue: latestRevenue.totalRevenue,
              monthlyRecurringRevenue: latestRevenue.monthlyRecurringRevenue
            }
          }));
        }
      }
    );

    unsubscribes.push(revenueUnsubscribe);
    return unsubscribes;
  };

  // Utility functions
  const getStartDateForPeriod = (period, endDate) => {
    const date = new Date(endDate);
    switch (period) {
      case '7d':
        date.setDate(date.getDate() - 7);
        break;
      case '30d':
        date.setDate(date.getDate() - 30);
        break;
      case '3m':
        date.setMonth(date.getMonth() - 3);
        break;
      case '6m':
        date.setMonth(date.getMonth() - 6);
        break;
      case '1y':
        date.setFullYear(date.getFullYear() - 1);
        break;
      default:
        date.setFullYear(2020, 0, 1); // Platform start date
    }
    return date;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getGrowthColor = (growth) => {
    return growth >= 0 ? METRIC_COLORS.success : METRIC_COLORS.accent;
  };

  const getGrowthIcon = (growth) => {
    return growth >= 0 ? <TrendingUp /> : <TrendingDown />;
  };

  // Event handlers
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleTimePeriodChange = (event) => {
    setTimePeriod(event.target.value);
  };

  const handleExportReport = () => {
    setReportDialogOpen(true);
  };

  const generateReport = async () => {
    try {
      // Generate and download report based on reportType and dateRange
      const reportData = {
        type: reportType,
        dateRange: reportDateRange,
        data: dashboardData,
        generatedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `beatflow-${reportType}-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setReportDialogOpen(false);
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Overview
        return (
          <Grid container spacing={3}>
            {/* Key Metrics Cards */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'grey.800', border: '1px solid', borderColor: 'grey.700' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ color: METRIC_COLORS.primary, fontWeight: 'bold' }}>
                        {formatCurrency(dashboardData.overview.totalRevenue)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'grey.400' }}>
                        Total Revenue
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        {getGrowthIcon(dashboardData.overview.growth.revenue)}
                        <Typography
                          variant="caption"
                          sx={{ color: getGrowthColor(dashboardData.overview.growth.revenue), ml: 0.5 }}
                        >
                          {Math.abs(dashboardData.overview.growth.revenue)}%
                        </Typography>
                      </Box>
                    </Box>
                    <AttachMoney sx={{ color: METRIC_COLORS.primary, fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'grey.800', border: '1px solid', borderColor: 'grey.700' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {formatNumber(dashboardData.overview.totalUsers)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'grey.400' }}>
                        Total Users
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        {getGrowthIcon(dashboardData.overview.growth.users)}
                        <Typography
                          variant="caption"
                          sx={{ color: getGrowthColor(dashboardData.overview.growth.users), ml: 0.5 }}
                        >
                          {Math.abs(dashboardData.overview.growth.users)}%
                        </Typography>
                      </Box>
                    </Box>
                    <People sx={{ color: METRIC_COLORS.info, fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'grey.800', border: '1px solid', borderColor: 'grey.700' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {formatNumber(dashboardData.overview.totalStreams)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'grey.400' }}>
                        Total Streams
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        {getGrowthIcon(dashboardData.overview.growth.streams)}
                        <Typography
                          variant="caption"
                          sx={{ color: getGrowthColor(dashboardData.overview.growth.streams), ml: 0.5 }}
                        >
                          {Math.abs(dashboardData.overview.growth.streams)}%
                        </Typography>
                      </Box>
                    </Box>
                    <PlayArrow sx={{ color: METRIC_COLORS.warning, fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'grey.800', border: '1px solid', borderColor: 'grey.700' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {formatCurrency(dashboardData.overview.monthlyRecurringRevenue)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'grey.400' }}>
                        Monthly Recurring Revenue
                      </Typography>
                    </Box>
                    <MonetizationOn sx={{ color: METRIC_COLORS.success, fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Revenue Chart */}
            <Grid item xs={12} md={8}>
              <Card sx={{ bgcolor: 'grey.800', border: '1px solid', borderColor: 'grey.700' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                    Revenue Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dashboardData.revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="date" stroke="#888" />
                      <YAxis stroke="#888" />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: '#333',
                          border: '1px solid #555',
                          borderRadius: '4px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke={METRIC_COLORS.primary}
                        fill={METRIC_COLORS.primary}
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Top Artists */}
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: 'grey.800', border: '1px solid', borderColor: 'grey.700' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                    Top Artists
                  </Typography>
                  <List dense>
                    {dashboardData.topArtists.slice(0, 5).map((artist, index) => (
                      <ListItem key={artist.id} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar src={artist.imageUrl} sx={{ bgcolor: METRIC_COLORS.primary }}>
                            {artist.name?.[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={artist.name}
                          secondary={`${formatNumber(artist.totalStreams)} streams`}
                          primaryTypographyProps={{ color: 'white' }}
                          secondaryTypographyProps={{ color: 'grey.400' }}
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handlePlayTrack(artist)}
                              sx={{ color: METRIC_COLORS.primary }}
                            >
                              <PlayArrow />
                            </IconButton>
                            <Chip
                              label={`#${index + 1}`}
                              size="small"
                              sx={{ bgcolor: METRIC_COLORS.primary, color: 'white' }}
                            />
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 1: // Revenue
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'grey.800', border: '1px solid', borderColor: 'grey.700' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                    Revenue Breakdown
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <RechartsBarChart data={dashboardData.revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="date" stroke="#888" />
                      <YAxis stroke="#888" />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: '#333',
                          border: '1px solid #555',
                          borderRadius: '4px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="subscriptions" stackId="a" fill={METRIC_COLORS.primary} name="Subscriptions" />
                      <Bar dataKey="oneTime" stackId="a" fill={METRIC_COLORS.secondary} name="One-time Payments" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 2: // User Growth
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'grey.800', border: '1px solid', borderColor: 'grey.700' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                    User Growth & Retention
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={dashboardData.userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="date" stroke="#888" />
                      <YAxis stroke="#888" />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: '#333',
                          border: '1px solid #555',
                          borderRadius: '4px'
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="newUsers"
                        stroke={METRIC_COLORS.primary}
                        name="New Users"
                      />
                      <Line
                        type="monotone"
                        dataKey="totalUsers"
                        stroke={METRIC_COLORS.info}
                        name="Total Users"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 3: // Content
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{ bgcolor: 'grey.800', border: '1px solid', borderColor: 'grey.700' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                    Content Growth
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dashboardData.contentData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="date" stroke="#888" />
                      <YAxis stroke="#888" />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: '#333',
                          border: '1px solid #555',
                          borderRadius: '4px'
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="newTracks"
                        stackId="1"
                        stroke={METRIC_COLORS.primary}
                        fill={METRIC_COLORS.primary}
                        name="New Tracks"
                      />
                      <Area
                        type="monotone"
                        dataKey="newArtists"
                        stackId="2"
                        stroke={METRIC_COLORS.info}
                        fill={METRIC_COLORS.info}
                        name="New Artists"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: 'grey.800', border: '1px solid', borderColor: 'grey.700' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                    Top Tracks
                  </Typography>
                  <List dense>
                    {dashboardData.topTracks.slice(0, 5).map((track, index) => (
                      <ListItem key={track.id} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar src={track.coverUrl} sx={{ bgcolor: METRIC_COLORS.primary }}>
                            <MusicNote />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={track.title}
                          secondary={`${formatNumber(track.playCount)} plays`}
                          primaryTypographyProps={{ color: 'white' }}
                          secondaryTypographyProps={{ color: 'grey.400' }}
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handlePlayTrack(track)}
                              sx={{ color: METRIC_COLORS.primary }}
                            >
                              <PlayArrow />
                            </IconButton>
                            <Chip
                              label={`#${index + 1}`}
                              size="small"
                              sx={{ bgcolor: METRIC_COLORS.warning, color: 'white' }}
                            />
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 4: // Geographic
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'grey.800', border: '1px solid', borderColor: 'grey.700' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                    Geographic Distribution
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: 'grey.400' }}>Country</TableCell>
                          <TableCell sx={{ color: 'grey.400' }}>Users</TableCell>
                          <TableCell sx={{ color: 'grey.400' }}>Revenue</TableCell>
                          <TableCell sx={{ color: 'grey.400' }}>Growth</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dashboardData.geographicData.map((country) => (
                          <TableRow key={country.country}>
                            <TableCell sx={{ color: 'white' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LocationOn sx={{ color: 'grey.400' }} />
                                {country.country}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ color: 'white' }}>
                              {formatNumber(country.users)}
                            </TableCell>
                            <TableCell sx={{ color: 'white' }}>
                              {formatCurrency(country.revenue)}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getGrowthIcon(country.growth)}
                                <Typography
                                  variant="body2"
                                  sx={{ color: getGrowthColor(country.growth) }}
                                >
                                  {Math.abs(country.growth)}%
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 5: // Reports
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'grey.800', border: '1px solid', borderColor: 'grey.700' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ color: 'white' }}>
                      Platform Activity
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<FileDownload />}
                      onClick={handleExportReport}
                      sx={{
                        bgcolor: METRIC_COLORS.primary,
                        '&:hover': { bgcolor: METRIC_COLORS.secondary }
                      }}
                    >
                      Export Report
                    </Button>
                  </Box>
                  <List>
                    {dashboardData.recentActivity.map((activity) => (
                      <ListItem key={activity.id} sx={{ px: 0, borderBottom: '1px solid', borderColor: 'grey.700' }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: METRIC_COLORS.primary }}>
                            {activity.type === 'user_signup' && <People />}
                            {activity.type === 'track_upload' && <MusicNote />}
                            {activity.type === 'payment' && <AttachMoney />}
                            {activity.type === 'campaign' && <Campaign />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={activity.description}
                          secondary={new Date(activity.timestamp?.toDate()).toLocaleString()}
                          primaryTypographyProps={{ color: 'white' }}
                          secondaryTypographyProps={{ color: 'grey.400' }}
                        />
                        <ListItemSecondaryAction>
                          {activity.type === 'payment' && (
                            <Chip
                              label={formatCurrency(activity.amount)}
                              size="small"
                              sx={{ bgcolor: METRIC_COLORS.success, color: 'white' }}
                            />
                          )}
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.900', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: METRIC_COLORS.primary, mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'white' }}>
            Loading investor dashboard...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.900', color: 'white', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #1DB954, #1ed760)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Investor Portal
          </Typography>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: 'grey.400' }}>Time Period</InputLabel>
            <Select
              value={timePeriod}
              onChange={handleTimePeriodChange}
              label="Time Period"
              sx={{
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.600' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.500' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: METRIC_COLORS.primary }
              }}
            >
              {TIME_PERIODS.map((period) => (
                <MenuItem key={period.value} value={period.value}>
                  {period.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Typography variant="body1" sx={{ color: 'grey.400' }}>
          Real-time analytics and financial metrics for BeatFlow Media
        </Typography>
      </Box>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'grey.700', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: 'grey.400',
              '&.Mui-selected': { color: METRIC_COLORS.primary }
            },
            '& .MuiTabs-indicator': { backgroundColor: METRIC_COLORS.primary }
          }}
        >
          {DASHBOARD_TABS.map((tab) => (
            <Tab key={tab} label={tab} />
          ))}
        </Tabs>
      </Box>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Export Report Dialog */}
      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'grey.800', color: 'white' }
        }}
      >
        <DialogTitle>Export Report</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel sx={{ color: 'grey.400' }}>Report Type</InputLabel>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                label="Report Type"
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.600' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.500' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: METRIC_COLORS.primary }
                }}
              >
                <MenuItem value="financial">Financial Report</MenuItem>
                <MenuItem value="user_analytics">User Analytics</MenuItem>
                <MenuItem value="content_performance">Content Performance</MenuItem>
                <MenuItem value="geographic">Geographic Analysis</MenuItem>
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={reportDateRange.start}
                  onChange={(e) => setReportDateRange(prev => ({ ...prev, start: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': { borderColor: 'grey.600' },
                      '&:hover fieldset': { borderColor: 'grey.500' },
                      '&.Mui-focused fieldset': { borderColor: METRIC_COLORS.primary }
                    },
                    '& .MuiInputLabel-root': { color: 'grey.400' }
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={reportDateRange.end}
                  onChange={(e) => setReportDateRange(prev => ({ ...prev, end: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': { borderColor: 'grey.600' },
                      '&:hover fieldset': { borderColor: 'grey.500' },
                      '&.Mui-focused fieldset': { borderColor: METRIC_COLORS.primary }
                    },
                    '& .MuiInputLabel-root': { color: 'grey.400' }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)} sx={{ color: 'grey.400' }}>
            Cancel
          </Button>
          <Button
            onClick={generateReport}
            variant="contained"
            disabled={!reportType}
            sx={{
              bgcolor: METRIC_COLORS.primary,
              '&:hover': { bgcolor: METRIC_COLORS.secondary }
            }}
          >
            Generate Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}