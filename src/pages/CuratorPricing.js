// src/pages/CuratorPricing.js
// Marketing and information page for curators
import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Paper,
  Divider
} from '@mui/material';
import {
  Check,
  MusicNote,
  Star,
  TrendingUp,
  People,
  PlaylistPlay,
  AttachMoney,
  Dashboard
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';

const CURATOR_BENEFITS = [
  {
    icon: <PlaylistPlay />,
    title: 'Playlist Management',
    description: 'Create and manage unlimited playlists across all genres'
  },
  {
    icon: <People />,
    title: 'Artist Submissions',
    description: 'Review and curate submissions from emerging artists'
  },
  {
    icon: <AttachMoney />,
    title: 'Earn Revenue',
    description: 'Get paid for successful playlist placements and curator services'
  },
  {
    icon: <TrendingUp />,
    title: 'Analytics Dashboard',
    description: 'Track playlist performance, followers, and engagement metrics'
  },
  {
    icon: <Star />,
    title: 'Featured Curator',
    description: 'Get featured on BeatFlow\'s curator spotlight'
  },
  {
    icon: <Dashboard />,
    title: 'Curator Tools',
    description: 'Access advanced tools for playlist optimization and discovery'
  }
];

const FEATURES = [
  'Unlimited playlist creation',
  'Artist submission inbox',
  'Revenue tracking & payouts',
  'Detailed analytics dashboard',
  'Curator profile page',
  'Direct artist messaging',
  'Playlist collaboration tools',
  'Featured curator opportunities',
  'Priority customer support',
  'Access to exclusive curator community'
];

export default function CuratorPricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleApply = () => {
    if (!user) {
      // Redirect to sign in
      navigate('/?signin=true');
      return;
    }

    // Redirect to curator application form
    navigate('/curator-application');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#121212', py: 8 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              bgcolor: 'rgba(29, 185, 84, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3
            }}
          >
            <PlaylistPlay sx={{ fontSize: 60, color: '#1DB954' }} />
          </Box>
          <Typography variant="h2" sx={{ fontWeight: 'bold', color: 'white', mb: 2 }}>
            Become a BeatFlow Curator
          </Typography>
          <Typography variant="h5" sx={{ color: 'text.secondary', mb: 4 }}>
            Help artists get discovered and earn revenue for your curation expertise
          </Typography>
          <Chip
            label="Application-Based Program"
            sx={{ bgcolor: '#1DB954', color: 'white', fontSize: '1rem', py: 2.5 }}
          />
        </Box>

        {/* Benefits Grid */}
        <Grid container spacing={3} sx={{ mb: 8 }}>
          {CURATOR_BENEFITS.map((benefit, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card sx={{ bgcolor: '#1e1e1e', height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box
                      sx={{
                        bgcolor: 'rgba(29, 185, 84, 0.1)',
                        borderRadius: 2,
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {React.cloneElement(benefit.icon, { sx: { color: '#1DB954', fontSize: 32 } })}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
                        {benefit.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {benefit.description}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Main Pricing Card */}
        <Paper sx={{ p: 6, bgcolor: '#1e1e1e', mb: 6, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1DB954', mb: 2 }}>
            Free to Join
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            No upfront costs - earn revenue from your curation work
          </Typography>

          <Divider sx={{ my: 4, borderColor: '#3a3a3a' }} />

          <Typography variant="h6" sx={{ color: 'white', mb: 3, textAlign: 'left' }}>
            What You Get:
          </Typography>

          <List sx={{ textAlign: 'left' }}>
            {FEATURES.map((feature, index) => (
              <ListItem key={index} sx={{ py: 1 }}>
                <ListItemIcon>
                  <Check sx={{ color: '#1DB954' }} />
                </ListItemIcon>
                <ListItemText
                  primary={feature}
                  primaryTypographyProps={{
                    sx: { color: 'white' }
                  }}
                />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 4, borderColor: '#3a3a3a' }} />

          <Box sx={{ bgcolor: 'rgba(29, 185, 84, 0.1)', p: 3, borderRadius: 2, mb: 4 }}>
            <Typography variant="h6" sx={{ color: '#1DB954', mb: 2 }}>
              How Curators Earn
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong style={{ color: 'white' }}>Playlist Placements</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Earn when artists pay for playlist submissions
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong style={{ color: 'white' }}>Royalty Sharing</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Share in playlist streaming revenue
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong style={{ color: 'white' }}>Premium Features</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Offer exclusive curation services
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Button
            variant="contained"
            size="large"
            onClick={handleApply}
            disabled={loading}
            sx={{
              bgcolor: '#1DB954',
              color: 'white',
              py: 2,
              px: 8,
              fontSize: '1.2rem',
              fontWeight: 'bold',
              '&:hover': { bgcolor: '#1ed760' }
            }}
          >
            {loading ? 'Processing...' : 'Apply to Become a Curator'}
          </Button>

          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 3 }}>
            Applications are reviewed within 3-5 business days
          </Typography>
        </Paper>

        {/* Requirements Section */}
        <Paper sx={{ p: 4, bgcolor: '#2a2a2a' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white', mb: 3 }}>
            Curator Requirements
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                ✓ Active BeatFlow account
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                ✓ Proven playlist curation experience
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                ✓ Understanding of music genres and trends
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                ✓ Commitment to quality curation
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                ✓ Responsive to artist submissions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                ✓ Professional communication skills
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Container>

      {/* Footer */}
      <Footer />
    </Box>
  );
}
