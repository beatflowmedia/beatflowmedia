// src/components/analytics/RevenueAnalytics.js
// Revenue analytics with music industry royalty tracking and compliance

import { useState, useEffect } from "react";
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
  Alert,
  IconButton
} from "@mui/material";
import {
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  Receipt as ReceiptIcon,
  PieChart as PieChartIcon as DownloadIcon,
  Gavel as LegalIcon,
  Security as SecurityIcon as GlobalIcon,
  Star as StarIcon
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { Avatar } from '@mui/material/Avatar';
import { Tooltip } from '@mui/material/Tooltip';

// Revenue overview component
const RevenueOverview = ({ data, userRole }) => {
  const overview = {
    totalRevenue: 125847.89,
    monthlyRevenue: 42349.12,
    royaltyRevenue: 89234.56,
    subscriptionRevenue: 36613.33,
    revenueGrowth: 15.7,
    royaltyGrowth: 12.3,
    subscriptionGrowth: 22.1
  };

  const getTrendIcon = (growth) => {
    return growth > 0 ? (
      <TrendingUpIcon color="success" fontSize="small" />
    ) : (
      <TrendingDownIcon color="error" fontSize="small" />
    );
  };

  const getTrendColor = (growth) => {
    return growth > 0 ? "success.main" : "error.main";
  };

  return (
    <Card>
      <CardHeader
        title="Revenue Overview"
        action={
          userRole === "admin" && (
            <Tooltip title="Download Revenue Report">
              <IconButton>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          )
        }
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Avatar sx={{ bgcolor: "success.light", mx: "auto", mb: 1 }}>
                <MoneyIcon />
              </Avatar>
              <Typography variant="h4" color="success.main">
                ${overview.totalRevenue.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Total Revenue (30d)
              </Typography>
              <Box display="flex" justifyContent="center" alignItems="center">
                {getTrendIcon(overview.revenueGrowth)}
                <Typography
                  variant="body2"
                  color={getTrendColor(overview.revenueGrowth)}
                  ml={0.5}
                >
                  {overview.revenueGrowth > 0 ? "+" : ""}
                  {overview.revenueGrowth}%
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Avatar sx={{ bgcolor: "primary.light", mx: "auto", mb: 1 }}>
                <BankIcon />
              </Avatar>
              <Typography variant="h4" color="primary">
                ${overview.royaltyRevenue.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Royalty Revenue
              </Typography>
              <Box display="flex" justifyContent="center" alignItems="center">
                {getTrendIcon(overview.royaltyGrowth)}
                <Typography
                  variant="body2"
                  color={getTrendColor(overview.royaltyGrowth)}
                  ml={0.5}
                >
                  {overview.royaltyGrowth > 0 ? "+" : ""}
                  {overview.royaltyGrowth}%
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Avatar sx={{ bgcolor: "secondary.light", mx: "auto", mb: 1 }}>
                <CardIcon />
              </Avatar>
              <Typography variant="h4" color="secondary">
                ${overview.subscriptionRevenue.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Subscription Revenue
              </Typography>
              <Box display="flex" justifyContent="center" alignItems="center">
                {getTrendIcon(overview.subscriptionGrowth)}
                <Typography
                  variant="body2"
                  color={getTrendColor(overview.subscriptionGrowth)}
                  ml={0.5}
                >
                  {overview.subscriptionGrowth > 0 ? "+" : ""}
                  {overview.subscriptionGrowth}%
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Avatar sx={{ bgcolor: "info.light", mx: "auto", mb: 1 }}>
                <ReceiptIcon />
              </Avatar>
              <Typography variant="h4" color="info.main">
                ${overview.monthlyRevenue.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                This Month
              </Typography>
              <Typography variant="body2" color="textSecondary">
                ${(overview.monthlyRevenue / 30).toFixed(0)}/day avg
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Revenue breakdown */}
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Revenue Breakdown
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Royalties (
                {(
                  (overview.royaltyRevenue / overview.totalRevenue) *
                  100
                ).toFixed(1)}
                %)
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(overview.royaltyRevenue / overview.totalRevenue) * 100}
                color="primary"
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Subscriptions (
                {(
                  (overview.subscriptionRevenue / overview.totalRevenue) *
                  100
                ).toFixed(1)}
                %)
              </Typography>
              <LinearProgress
                variant="determinate"
                value={
                  (overview.subscriptionRevenue / overview.totalRevenue) * 100
                }
                color="secondary"
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

// Royalty distribution component
const RoyaltyDistribution = ({ data, userRole }) => {
  const royalties = [
    {
      artist: "Luna Eclipse",
      trackTitle: "Midnight Dreams",
      plays: 145820,
      revenue: 1458.2,
      territory: "US",
      royaltyRate: 0.01
    },
    {
      artist: "Synth Wave",
      trackTitle: "Electric Vibes",
      plays: 98456,
      revenue: 984.56,
      territory: "CA",
      royaltyRate: 0.01
    },
    {
      artist: "Echo Chamber",
      trackTitle: "Resonance",
      plays: 76543,
      revenue: 765.43,
      territory: "UK",
      royaltyRate: 0.01
    },
    {
      artist: "Digital Harmony",
      trackTitle: "Pixel Dreams",
      plays: 65432,
      revenue: 654.32,
      territory: "DE",
      royaltyRate: 0.01
    },
    {
      artist: "Neon Nights",
      trackTitle: "City Lights",
      plays: 54321,
      revenue: 543.21,
      territory: "FR",
      royaltyRate: 0.01
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Top Royalty Earnings (30d)"
        action={
          <Chip
            label="Compliance Verified"
            color="success"
            size="small"
            icon={<LegalIcon />}
          />
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Artist/Track</TableCell>
                <TableCell align="right">Plays</TableCell>
                <TableCell align="right">Territory</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell align="right">Revenue</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {royalties.map((royalty, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {royalty.artist}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {royalty.trackTitle}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {royalty.plays.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={royalty.territory}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    ${royalty.royaltyRate.toFixed(4)}
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color="success.main"
                    >
                      ${royalty.revenue.toFixed(2)}
                    </Typography>
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

// Subscription analytics component
const SubscriptionAnalytics = ({ data }) => {
  const subscriptionData = {
    totalSubscribers: 45890,
    newSubscriptions: 1234,
    cancellations: 234,
    churnRate: 5.2,
    mrr: 36613.33, // Monthly Recurring Revenue
    arpu: 12.99, // Average Revenue Per User
    ltv: 89.5, // Lifetime Value
    tiers: {
      free: { count: 125000, revenue: 0 },
      premium: { count: 35400, revenue: 31500 },
      family: { count: 8900, revenue: 4200 },
      student: { count: 1590, revenue: 913 }
    }
  };

  return (
    <Card>
      <CardHeader title="Subscription Analytics" />
      <CardContent>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                {subscriptionData.totalSubscribers.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Subscribers
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main">
                ${subscriptionData.mrr.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Monthly Recurring Revenue
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="info.main">
                ${subscriptionData.arpu}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Average Revenue Per User
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main">
                {subscriptionData.churnRate}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Monthly Churn Rate
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom>
          Subscription Tiers
        </Typography>
        {Object.entries(subscriptionData.tiers).map(([tier, data]) => {
          const percentage =
            (data.count / subscriptionData.totalSubscribers) * 100;
          return (
            <Box key={tier} mb={2}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography
                  variant="body1"
                  sx={{ textTransform: "capitalize" }}
                >
                  {tier}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {data.count.toLocaleString()} users | $
                  {data.revenue.toLocaleString()}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={percentage}
                color={
                  tier === "premium"
                    ? "primary"
                    : tier === "family"
                      ? "secondary"
                      : "info"
                }
                sx={{ height: 8, borderRadius: 1 }}
              />
              <Typography variant="body2" color="textSecondary" mt={0.5}>
                {percentage.toFixed(1)}% of total subscribers
              </Typography>
            </Box>
          );
        })}
      </CardContent>
    </Card>
  );
};

// Geographic revenue distribution
const GeographicRevenue = ({ data }) => {
  const territories = [
    {
      code: "US",
      name: "United States",
      revenue: 45230.5,
      percentage: 35.9,
      growth: 12.5
    },
    {
      code: "CA",
      name: "Canada",
      revenue: 12450.3,
      percentage: 9.9,
      growth: 8.7
    },
    {
      code: "UK",
      name: "United Kingdom",
      revenue: 9876.2,
      percentage: 7.8,
      growth: 15.2
    },
    {
      code: "DE",
      name: "Germany",
      revenue: 8765.1,
      percentage: 7.0,
      growth: 22.1
    },
    {
      code: "FR",
      name: "France",
      revenue: 7654.0,
      percentage: 6.1,
      growth: 18.9
    },
    {
      code: "AU",
      name: "Australia",
      revenue: 6543.9,
      percentage: 5.2,
      growth: 11.3
    },
    {
      code: "JP",
      name: "Japan",
      revenue: 5432.8,
      percentage: 4.3,
      growth: 7.8
    },
    {
      code: "Others",
      name: "Other Territories",
      revenue: 29895.17,
      percentage: 23.8,
      growth: 14.6
    },
  ];

  return (
    <Card>
      <CardHeader title="Revenue by Territory" />
      <CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Territory</TableCell>
                <TableCell align="right">Revenue</TableCell>
                <TableCell align="right">Share</TableCell>
                <TableCell align="right">Growth</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {territories.map((territory) => (
                <TableRow key={territory.code}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar
                        sx={{ width: 24, height: 24, mr: 1, fontSize: 10 }}
                      >
                        {territory.code.substring(0, 2)}
                      </Avatar>
                      {territory.name}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      ${territory.revenue.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${territory.percentage}%`}
                      size="small"
                      color={territory.percentage > 10 ? "primary" : "default"}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="flex-end"
                    >
                      {territory.growth > 0 ? (
                        <TrendingUpIcon color="success" fontSize="small" />
                      ) : (
                        <TrendingDownIcon color="error" fontSize="small" />
                      )}
                      <Typography
                        variant="body2"
                        color={
                          territory.growth > 0 ? "success.main" : "error.main"
                        }
                        ml={0.5}
                      >
                        {territory.growth > 0 ? "+" : ""}
                        {territory.growth}%
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
  );
};

// Payment analytics
const PaymentAnalytics = ({ data }) => {
  const paymentData = {
    successRate: 97.8,
    failureRate: 2.2,
    avgTransactionValue: 12.99,
    totalTransactions: 34567,
    refunds: 123,
    chargebacks: 5,
    methods: {
      "Credit Card": 65.2,
      PayPal: 22.1,
      "Apple Pay": 8.7,
      "Google Pay": 4.0
    }
  };

  return (
    <Card>
      <CardHeader title="Payment Analytics" />
      <CardContent>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main">
                {paymentData.successRate}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Success Rate
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                ${paymentData.avgTransactionValue}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Avg Transaction
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="info.main">
                {paymentData.totalTransactions.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Transactions
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main">
                {paymentData.refunds}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Refunds (30d)
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom>
          Payment Methods
        </Typography>
        {Object.entries(paymentData.methods).map(([method, percentage]) => (
          <Box key={method} mb={2}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body1">{method}</Typography>
              <Typography variant="body2" color="textSecondary">
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
        ))}

        {paymentData.chargebacks > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {paymentData.chargebacks} chargebacks in the last 30 days. Monitor
            for fraud patterns.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

// Main revenue analytics component
const RevenueAnalytics = ({ data, realtimeData, userRole }) => {
  const [timeRange, setTimeRange] = useState("30d");
  const [currency, setCurrency] = useState("USD");

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const handleCurrencyChange = (event) => {
    setCurrency(event.target.value);
  };

  const hasRevenueAccess =
    userRole === "admin" || userRole === "artist" || userRole === "finance";

  if (!hasRevenueAccess) {
    return (
      <Box p={3}>
        <Alert severity="warning">
          You don't have permission to view revenue analytics. Contact your
          administrator for access.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Controls */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6">Revenue Analytics</Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={handleTimeRangeChange}
            >
              <MenuItem value="24h">Last 24h</MenuItem>
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last Year</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Currency</InputLabel>
            <Select
              value={currency}
              label="Currency"
              onChange={handleCurrencyChange}
            >
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="EUR">EUR</MenuItem>
              <MenuItem value="GBP">GBP</MenuItem>
              <MenuItem value="CAD">CAD</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<DownloadIcon />}>
            Export Revenue Report
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Revenue overview */}
        <Grid item xs={12}>
          <RevenueOverview data={data} userRole={userRole} />
        </Grid>

        {/* Royalty distribution */}
        <Grid item xs={12} md={8}>
          <RoyaltyDistribution data={data} userRole={userRole} />
        </Grid>

        {/* Payment analytics */}
        <Grid item xs={12} md={4}>
          <PaymentAnalytics data={data} />
        </Grid>

        {/* Subscription analytics */}
        <Grid item xs={12} md={6}>
          <SubscriptionAnalytics data={data} />
        </Grid>

        {/* Geographic revenue */}
        <Grid item xs={12} md={6}>
          <GeographicRevenue data={data} />
        </Grid>

        {/* Compliance notice */}
        <Grid item xs={12}>
          <Alert severity="info" icon={<SecurityIcon />}>
            <Box>
              <Typography variant="body1" fontWeight="bold">
                Royalty Compliance Status
              </Typography>
              <Typography variant="body2">
                All royalty calculations are compliant with industry standards.
                Reports are automatically generated for territorial licensing
                authorities. Last audit: March 2024 | Next audit: June 2024
              </Typography>
            </Box>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RevenueAnalytics;
