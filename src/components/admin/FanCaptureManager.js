import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { db } from '../../firebaseConfig';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

/**
 * FanCaptureManager - Admin dashboard tab for managing email captures
 * Part of 2026 Hybrid Marketing Strategy (Direct-to-fan Retention)
 *
 * Shows all captured fan emails with incentive types and conversion data
 */
export default function FanCaptureManager() {
  const [captures, setCaptures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    thisWeek: 0,
    thisMonth: 0
  });

  useEffect(() => {
    const loadCaptures = async () => {
      try {
        const capturesQuery = query(
          collection(db, 'fanCaptures'),
          orderBy('createdAt', 'desc'),
          limit(100)
        );

        const snapshot = await getDocs(capturesQuery);
        const captureData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }));

        setCaptures(captureData);

        // Calculate stats
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        setStats({
          total: captureData.length,
          thisWeek: captureData.filter(c => c.createdAt >= oneWeekAgo).length,
          thisMonth: captureData.filter(c => c.createdAt >= oneMonthAgo).length
        });

        setLoading(false);
      } catch (error) {
        console.error('Error loading fan captures:', error);
        setLoading(false);
      }
    };

    loadCaptures();
  }, []);

  const getIncentiveColor = (type) => {
    switch (type) {
      case 'earlyAccess': return 'primary';
      case 'exclusiveTrack': return 'secondary';
      case 'behindTheScenes': return 'info';
      case 'discount': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, color: 'white' }}>
        Fan Email Captures
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: 'grey.400' }}>
        Manage and track fan email signups with exclusive content incentives
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Alert severity="success" sx={{ flex: 1 }}>
          <Typography variant="h6">{stats.total}</Typography>
          <Typography variant="caption">Total Captures</Typography>
        </Alert>
        <Alert severity="info" sx={{ flex: 1 }}>
          <Typography variant="h6">{stats.thisWeek}</Typography>
          <Typography variant="caption">This Week</Typography>
        </Alert>
        <Alert severity="warning" sx={{ flex: 1 }}>
          <Typography variant="h6">{stats.thisMonth}</Typography>
          <Typography variant="caption">This Month</Typography>
        </Alert>
      </Box>

      <TableContainer component={Paper} sx={{ bgcolor: 'grey.900' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Artist</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Incentive</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Source</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {captures.length > 0 ? (
              captures.map((capture) => (
                <TableRow key={capture.id}>
                  <TableCell sx={{ color: 'white' }}>{capture.email}</TableCell>
                  <TableCell sx={{ color: 'white' }}>{capture.name}</TableCell>
                  <TableCell sx={{ color: 'grey.400' }}>{capture.artistName}</TableCell>
                  <TableCell>
                    <Chip
                      label={capture.incentiveType || 'newsletter'}
                      size="small"
                      color={getIncentiveColor(capture.incentiveType)}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'grey.400' }}>{capture.source}</TableCell>
                  <TableCell sx={{ color: 'grey.400' }}>
                    {capture.createdAt?.toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ color: 'grey.500', py: 4 }}>
                  No fan captures yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
