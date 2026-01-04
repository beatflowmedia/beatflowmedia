// src/pages/CuratorEarnings.js
// Comprehensive curator earning potential and payment schedule page
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Slider,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  AttachMoney,
  Schedule,
  CheckCircle,
  Star,
  PlaylistPlay
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Pricing tiers based on playlist followers
const PRICING_TIERS = [
  {
    name: 'Emerging',
    followers: '0 - 1,000',
    priceRange: '$25 - $75',
    minPrice: 25,
    maxPrice: 75,
    avgPrice: 50,
    color: '#4CAF50'
  },
  {
    name: 'Growing',
    followers: '1,000 - 10,000',
    priceRange: '$75 - $200',
    minPrice: 75,
    maxPrice: 200,
    avgPrice: 137,
    color: '#2196F3'
  },
  {
    name: 'Established',
    followers: '10,000 - 50,000',
    priceRange: '$200 - $500',
    minPrice: 200,
    maxPrice: 500,
    avgPrice: 350,
    color: '#FF9800'
  },
  {
    name: 'Premium',
    followers: '50,000+',
    priceRange: '$500 - $1,000',
    minPrice: 500,
    maxPrice: 1000,
    avgPrice: 750,
    color: '#9C27B0'
  }
];

// Example success stories
const SUCCESS_STORIES = [
  {
    name: 'Sarah Chen',
    playlists: 8,
    followers: '47,000',
    monthlyPlacements: 25,
    avgPrice: 380,
    monthlyEarnings: 8550,
    tier: 'Established'
  },
  {
    name: 'Marcus Rivera',
    playlists: 5,
    followers: '28,000',
    monthlyPlacements: 18,
    avgPrice: 285,
    monthlyEarnings: 4617,
    tier: 'Established'
  },
  {
    name: 'Emily Taylor',
    playlists: 12,
    followers: '63,000',
    monthlyPlacements: 30,
    avgPrice: 620,
    monthlyEarnings: 16740,
    tier: 'Premium'
  },
  {
    name: 'David Park',
    playlists: 3,
    followers: '5,200',
    monthlyPlacements: 12,
    avgPrice: 125,
    monthlyEarnings: 1350,
    tier: 'Growing'
  }
];

export default function CuratorEarnings() {
  const navigate = useNavigate();
  const [placementsPerMonth, setPlacementsPerMonth] = useState(15);
  const [selectedTier, setSelectedTier] = useState(PRICING_TIERS[1]); // Growing tier

  // Calculate earnings
  const curatorEarnings = (selectedTier.avgPrice * placementsPerMonth * 0.9).toFixed(2);
  const platformFee = (selectedTier.avgPrice * placementsPerMonth * 0.1).toFixed(2);
  const totalRevenue = (selectedTier.avgPrice * placementsPerMonth).toFixed(2);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#121212', py: 8 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 'bold',
              color: '#fff',
              mb: 2,
              fontSize: { xs: '2rem', md: '3rem' }
            }}
          >
            Curator Earning Potential
          </Typography>
          <Typography variant="h6" sx={{ color: '#b3b3b3', mb: 4, maxWidth: '800px', mx: 'auto' }}>
            See how much you can earn as a BeatFlow Media curator. You keep <strong style={{ color: '#1DB954' }}>90%</strong> of every placement fee.
          </Typography>

          <Alert severity="success" sx={{ maxWidth: '600px', mx: 'auto', mb: 4 }}>
            <Typography variant="body2">
              <strong>Transparent Pricing:</strong> Artists pay $25-$1,000 per submission. You set your rates based on your playlist reach and engagement.
            </Typography>
          </Alert>
        </Box>

        {/* Interactive Earnings Calculator */}
        <Paper sx={{ p: 4, mb: 6, bgcolor: '#1e1e1e', color: '#fff' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#1DB954' }}>
            <AttachMoney sx={{ mr: 1, verticalAlign: 'middle' }} />
            Calculate Your Potential Earnings
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="body1" sx={{ mb: 2, color: '#b3b3b3' }}>
                Select Your Playlist Tier:
              </Typography>
              <Grid container spacing={2}>
                {PRICING_TIERS.map((tier) => (
                  <Grid item xs={6} sm={3} key={tier.name}>
                    <Card
                      sx={{
                        bgcolor: selectedTier.name === tier.name ? tier.color : '#2a2a2a',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        '&:hover': { transform: 'translateY(-4px)' },
                        border: selectedTier.name === tier.name ? `2px solid ${tier.color}` : 'none'
                      }}
                      onClick={() => setSelectedTier(tier)}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#fff', mb: 1 }}>
                          {tier.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#b3b3b3', display: 'block', mb: 1 }}>
                          {tier.followers}
                        </Typography>
                        <Chip
                          label={tier.priceRange}
                          size="small"
                          sx={{ bgcolor: selectedTier.name === tier.name ? '#000' : '#1e1e1e', color: '#1DB954', fontSize: '0.7rem' }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ mt: 4 }}>
                <Typography variant="body1" sx={{ mb: 2, color: '#b3b3b3' }}>
                  Placements Per Month: <strong style={{ color: '#1DB954' }}>{placementsPerMonth}</strong>
                </Typography>
                <Slider
                  value={placementsPerMonth}
                  onChange={(e, val) => setPlacementsPerMonth(val)}
                  min={1}
                  max={50}
                  marks
                  valueLabelDisplay="auto"
                  sx={{
                    color: '#1DB954',
                    '& .MuiSlider-thumb': { bgcolor: '#1DB954' },
                    '& .MuiSlider-track': { bgcolor: '#1DB954' },
                    '& .MuiSlider-rail': { bgcolor: '#404040' }
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ bgcolor: '#2a2a2a', p: 3, borderRadius: 2, border: '2px solid #1DB954' }}>
                <Typography variant="h6" sx={{ mb: 3, color: '#1DB954' }}>
                  Your Monthly Earnings
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#b3b3b3', mb: 0.5 }}>
                    Total Revenue
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>
                    ${totalRevenue}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2, bgcolor: '#404040' }} />

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                      Your Earnings (90%)
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#1DB954', fontWeight: 'bold' }}>
                      ${curatorEarnings}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                      Platform Fee (10%)
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ff5722' }}>
                      -${platformFee}
                    </Typography>
                  </Box>
                </Box>

                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="caption">
                    <strong>Yearly Potential:</strong> ${(curatorEarnings * 12).toLocaleString()}
                  </Typography>
                </Alert>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Pricing Tiers Table */}
        <Paper sx={{ mb: 6, bgcolor: '#1e1e1e' }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #404040' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1DB954' }}>
              <PlaylistPlay sx={{ mr: 1, verticalAlign: 'middle' }} />
              Pricing Tiers by Playlist Size
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#b3b3b3', fontWeight: 'bold' }}>Tier</TableCell>
                  <TableCell sx={{ color: '#b3b3b3', fontWeight: 'bold' }}>Followers</TableCell>
                  <TableCell sx={{ color: '#b3b3b3', fontWeight: 'bold' }}>Suggested Price</TableCell>
                  <TableCell sx={{ color: '#b3b3b3', fontWeight: 'bold' }}>You Earn (90%)</TableCell>
                  <TableCell sx={{ color: '#b3b3b3', fontWeight: 'bold' }}>Example (15/mo)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {PRICING_TIERS.map((tier) => (
                  <TableRow key={tier.name} sx={{ '&:hover': { bgcolor: '#2a2a2a' } }}>
                    <TableCell>
                      <Chip
                        label={tier.name}
                        sx={{ bgcolor: tier.color, color: '#fff', fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#fff' }}>{tier.followers}</TableCell>
                    <TableCell sx={{ color: '#1DB954', fontWeight: 'bold' }}>{tier.priceRange}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>
                      ${(tier.minPrice * 0.9).toFixed(0)} - ${(tier.maxPrice * 0.9).toFixed(0)}
                    </TableCell>
                    <TableCell sx={{ color: '#1DB954', fontWeight: 'bold' }}>
                      ${((tier.avgPrice * 15 * 0.9)).toLocaleString()}/mo
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Success Stories */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#fff', mb: 3, textAlign: 'center' }}>
            <Star sx={{ color: '#FFD700', mr: 1, verticalAlign: 'middle' }} />
            Real Curator Success Stories
          </Typography>
          <Grid container spacing={3}>
            {SUCCESS_STORIES.map((story) => (
              <Grid item xs={12} sm={6} md={3} key={story.name}>
                <Card sx={{ bgcolor: '#1e1e1e', height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold', mb: 1 }}>
                      {story.name}
                    </Typography>
                    <Chip
                      label={story.tier}
                      size="small"
                      sx={{ mb: 2, bgcolor: PRICING_TIERS.find(t => t.name === story.tier)?.color }}
                    />
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                        📊 {story.playlists} Playlists
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                        👥 {story.followers} Followers
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                        🎵 {story.monthlyPlacements} Placements/mo
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                        💰 ${story.avgPrice} Avg Price
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 2, bgcolor: '#404040' }} />
                    <Typography variant="h5" sx={{ color: '#1DB954', fontWeight: 'bold' }}>
                      ${story.monthlyEarnings.toLocaleString()}/mo
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#b3b3b3' }}>
                      ${(story.monthlyEarnings * 12).toLocaleString()}/year
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Payment Schedule */}
        <Paper sx={{ p: 4, mb: 6, bgcolor: '#1e1e1e' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#1DB954' }}>
            <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
            Payment Schedule & How It Works
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                Payment Timeline
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircle sx={{ color: '#1DB954', mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                    <strong style={{ color: '#fff' }}>Day 1:</strong> Artist submits track + pays placement fee
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircle sx={{ color: '#1DB954', mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                    <strong style={{ color: '#fff' }}>Days 1-7:</strong> You review and accept/reject submission
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircle sx={{ color: '#1DB954', mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                    <strong style={{ color: '#fff' }}>Days 8-14:</strong> Add track to your playlist
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircle sx={{ color: '#1DB954', mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                    <strong style={{ color: '#fff' }}>Day 15:</strong> Payment released from escrow
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle sx={{ color: '#1DB954', mr: 1, fontSize: '1.2rem' }} />
                  <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                    <strong style={{ color: '#fff' }}>24-48 hours later:</strong> Funds in your Stripe account
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                Payout Details
              </Typography>
              <Box sx={{ bgcolor: '#2a2a2a', p: 2, borderRadius: 2, mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#b3b3b3', mb: 1 }}>
                  💳 <strong style={{ color: '#fff' }}>Payment Method:</strong> Stripe Connect (direct deposit)
                </Typography>
                <Typography variant="body2" sx={{ color: '#b3b3b3', mb: 1 }}>
                  ⚡ <strong style={{ color: '#fff' }}>Payout Speed:</strong> 24-48 hours after placement verification
                </Typography>
                <Typography variant="body2" sx={{ color: '#b3b3b3', mb: 1 }}>
                  💰 <strong style={{ color: '#fff' }}>Minimum:</strong> No minimum payout (paid per placement)
                </Typography>
                <Typography variant="body2" sx={{ color: '#b3b3b3', mb: 1 }}>
                  📊 <strong style={{ color: '#fff' }}>Your Share:</strong> 90% of placement fee
                </Typography>
                <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                  🏦 <strong style={{ color: '#fff' }}>Bank Transfer:</strong> 2 business days after Stripe payout
                </Typography>
              </Box>

              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>Escrow Protection:</strong> Funds are held in escrow until you add the track to your playlist. This protects both you and the artist.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </Paper>

        {/* CTA */}
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold', mb: 2 }}>
            Ready to Start Earning?
          </Typography>
          <Typography variant="body1" sx={{ color: '#b3b3b3', mb: 4, maxWidth: '600px', mx: 'auto' }}>
            Join BeatFlow Media as a curator and start earning from your playlists today. It's free to apply, and you set your own rates.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/curator-application')}
            sx={{
              bgcolor: '#1DB954',
              color: '#fff',
              px: 6,
              py: 2,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              '&:hover': { bgcolor: '#1ed760' }
            }}
          >
            Apply to Become a Curator →
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
