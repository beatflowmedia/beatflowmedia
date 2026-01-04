import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { curatorPaymentService } from '../services/curatorPaymentService';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import { FaDollarSign, FaClock, FaCheckCircle, FaChartLine } from 'react-icons/fa';

export default function CuratorRevenueDashboard() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, [user]);

  const loadEarnings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await curatorPaymentService.getCuratorEarnings(user.uid);
      setEarnings(data);
    } catch (error) {
      console.error('Error loading earnings:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const stats = [
    {
      label: 'Total Earnings',
      value: `$${earnings?.totalEarnings?.toFixed(2) || '0.00'}`,
      icon: <FaDollarSign size={32} color="#1db954" />,
      color: '#1db954',
      description: 'Lifetime curator earnings'
    },
    {
      label: 'Pending Earnings',
      value: `$${earnings?.pendingEarnings?.toFixed(2) || '0.00'}`,
      icon: <FaClock size={32} color="#ff9800" />,
      color: '#ff9800',
      description: 'In escrow, awaiting completion'
    },
    {
      label: 'Completed Payouts',
      value: `$${earnings?.completedEarnings?.toFixed(2) || '0.00'}`,
      icon: <FaCheckCircle size={32} color="#2196f3" />,
      color: '#2196f3',
      description: 'Successfully paid out'
    },
    {
      label: 'Total Placements',
      value: earnings?.placementCount || 0,
      icon: <FaChartLine size={32} color="#9c27b0" />,
      color: '#9c27b0',
      description: 'Tracks placed on playlists'
    }
  ];

  const completionRate = earnings?.placementCount > 0
    ? ((earnings.completedEarnings / earnings.totalEarnings) * 100).toFixed(0)
    : 0;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff', mb: 3 }}>
        Revenue Dashboard
      </Typography>

      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ bgcolor: '#181818', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#b3b3b3', mb: 1 }}>
                      {stat.label}
                    </Typography>
                    <Typography variant="h4" sx={{ color: stat.color, fontWeight: 'bold' }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box sx={{ opacity: 0.8 }}>
                    {stat.icon}
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ color: '#808080' }}>
                  {stat.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Earnings Breakdown */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: '#181818', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', mb: 3, fontWeight: 'bold' }}>
                Earnings Breakdown
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                    Completed
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#1db954', fontWeight: 'bold' }}>
                    ${earnings?.completedEarnings?.toFixed(2) || '0.00'}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={completionRate}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: '#404040',
                    '& .MuiLinearProgress-bar': { bgcolor: '#1db954' }
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                    Pending (In Escrow)
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                    ${earnings?.pendingEarnings?.toFixed(2) || '0.00'}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={100 - completionRate}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: '#404040',
                    '& .MuiLinearProgress-bar': { bgcolor: '#ff9800' }
                  }}
                />
              </Box>

              <Box sx={{ mt: 3, p: 2, bgcolor: '#0a0a0a', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ color: '#b3b3b3', mb: 1 }}>
                  Average Earning per Placement
                </Typography>
                <Typography variant="h5" sx={{ color: '#1db954', fontWeight: 'bold' }}>
                  ${earnings?.placementCount > 0
                    ? (earnings.totalEarnings / earnings.placementCount).toFixed(2)
                    : '0.00'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: '#181818', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', mb: 3, fontWeight: 'bold' }}>
                Performance Insights
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ color: '#b3b3b3', mb: 1 }}>
                  Completion Rate
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                  <Typography variant="h4" sx={{ color: '#1db954', fontWeight: 'bold' }}>
                    {completionRate}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#808080' }}>
                    of earnings paid out
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ color: '#b3b3b3', mb: 1 }}>
                  Platform Fee (10%)
                </Typography>
                <Typography variant="h5" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                  ${((earnings?.totalEarnings || 0) * 0.111).toFixed(2)}
                </Typography>
                <Typography variant="caption" sx={{ color: '#808080' }}>
                  Total platform fees paid
                </Typography>
              </Box>

              <Box sx={{ p: 2, bgcolor: '#0a0a0a', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ color: '#b3b3b3', display: 'block', mb: 1 }}>
                  💡 Pro Tip
                </Typography>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  Accept quality submissions quickly to build your reputation and attract more artists!
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Payout Information */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: '#181818' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2, fontWeight: 'bold' }}>
                Payout Information
              </Typography>
              <Typography variant="body2" sx={{ color: '#b3b3b3', mb: 2 }}>
                Earnings are automatically released when you add accepted tracks to your playlists. Payouts are
                processed via Stripe Connect to your connected account.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 2, bgcolor: '#0a0a0a', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#808080' }}>
                      Platform Fee
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                      10%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 2, bgcolor: '#0a0a0a', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#808080' }}>
                      You Keep
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#1db954', fontWeight: 'bold' }}>
                      90%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 2, bgcolor: '#0a0a0a', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#808080' }}>
                      Payment Time
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                      24-48h
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
