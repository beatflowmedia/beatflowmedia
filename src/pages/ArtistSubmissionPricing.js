// src/pages/ArtistSubmissionPricing.js
// Pricing page for artist music submissions
import { useState } from "react";
import { Helmet } from 'react-helmet-async';
import { useModal } from '../hooks/useModal';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  Divider
} from '@mui/material';
import { Check, MusicNote, Star, Bolt } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PRICING_TIER = {
  id: 'annual',
  name: 'Artist Membership',
  price: 25.00,
  description: 'Join BeatFlow as an artist',
  interval: 'year',
  features: [
    'Unlimited track uploads',
    'Unlimited album releases',
    'Professional metadata tagging',
    'Multi-genre classification',
    'Admin review within 3-5 days',
    'Lifetime hosting on BeatFlow',
    'Detailed track analytics',
    'Artist profile page',
    'Direct listener engagement',
    'Featured artist opportunities',
    'Priority customer support',
    'Annual membership renewal'
  ],
  color: '#1DB954'
};

export default function ArtistSubmissionPricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showAlert } = useModal();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (!user) {
      navigate('/for-artists');
      return;
    }

    setLoading(true);
    try {
      // Call Stripe checkout
      const response = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: 'annual',
          itemType: 'artist_membership',
          userId: user.uid,
          email: user.email,
          price: 2500 // $25 in cents
        })
      });

      const { url, error } = await response.json();

      if (error) {
        await showAlert('Error', 'Error creating checkout: ' + error, 'error');
        setLoading(false);
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      await showAlert('Error', 'Failed to start checkout process', 'error');
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Join BeatFlow - Artist Membership $25/year</title>
        <meta property="og:title" content="Join BeatFlow - Artist Membership $25/year" />
        <meta property="og:description" content="Upload your music, reach new listeners, and grow your fanbase." />
        <meta property="og:image" content="https://beatflowmediagroup.com/images/beatflow-share.png" />
        <meta property="og:url" content="https://beatflowmediagroup.com/artist-pricing" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Join BeatFlow - Artist Membership $25/year" />
        <meta name="twitter:description" content="Upload your music, reach new listeners, and grow your fanbase." />
        <meta name="twitter:image" content="https://beatflowmediagroup.com/images/beatflow-share.png" />
      </Helmet>
      <Box sx={{ minHeight: '100vh', bgcolor: '#121212', py: 8 }}>
        <Container maxWidth="lg">
        {/* Hero Section with Image */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Box
            sx={{
              width: '100%',
              height: 300,
              backgroundImage: 'url(https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&auto=format&fit=crop)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: 4,
              mb: 4,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(18,18,18,0.9) 100%)',
                borderRadius: 4
              }
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                bottom: 40,
                left: 0,
                right: 0,
                zIndex: 1
              }}
            >
              <MusicNote sx={{ fontSize: 60, color: '#1DB954', mb: 2 }} />
              <Typography variant="h2" sx={{ fontWeight: 'bold', color: 'white', mb: 2 }}>
                Get Your Music on BeatFlow
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', maxWidth: 700, mx: 'auto' }}>
                Upload your music, reach new listeners, and grow your fanbase.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Pricing Card */}
        <Box sx={{ maxWidth: 800, mx: 'auto', mb: 8 }}>
          <Card
            sx={{
              bgcolor: 'rgba(29, 185, 84, 0.1)',
              border: '3px solid #1DB954',
              position: 'relative'
            }}
          >
            <CardContent sx={{ p: 6 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white', mb: 2 }}>
                  {PRICING_TIER.name}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  {PRICING_TIER.description}
                </Typography>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="h2" sx={{ fontWeight: 'bold', color: PRICING_TIER.color }}>
                    ${PRICING_TIER.price}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    per year
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#1ed760', mt: 1 }}>
                    Unlimited uploads • Just $2.08/month
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handlePurchase}
                  disabled={loading}
                  sx={{
                    bgcolor: PRICING_TIER.color,
                    color: 'black',
                    fontWeight: 'bold',
                    py: 2,
                    fontSize: '1.1rem',
                    mb: 4,
                    '&:hover': {
                      bgcolor: '#1ed760'
                    }
                  }}
                >
                  {loading ? 'Processing...' : 'Join Now - $25/Year'}
                </Button>
              </Box>

              <Grid container spacing={2}>
                {PRICING_TIER.features.map((feature, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Check sx={{ color: PRICING_TIER.color, fontSize: 24, flexShrink: 0 }} />
                      <Typography variant="body1" color="text.primary">
                        {feature}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Box>

        {/* Features Section with Images */}
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white', mb: 6, textAlign: 'center' }}>
          Why Upload to BeatFlow?
        </Typography>

        <Grid container spacing={4} sx={{ mb: 8 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ overflow: 'hidden', bgcolor: '#1e1e1e', height: '100%' }}>
              <Box
                sx={{
                  width: '100%',
                  height: 200,
                  backgroundImage: 'url(https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&auto=format&fit=crop)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Star sx={{ fontSize: 40, color: '#1DB954', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
                  Quality First
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Every submission is carefully reviewed to maintain our platform's high quality standards
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ overflow: 'hidden', bgcolor: '#1e1e1e', height: '100%' }}>
              <Box
                sx={{
                  width: '100%',
                  height: 200,
                  backgroundImage: 'url(https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <MusicNote sx={{ fontSize: 40, color: '#1DB954', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
                  Lifetime Hosting
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your music stays on BeatFlow forever. No recurring hosting fees.
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ overflow: 'hidden', bgcolor: '#1e1e1e', height: '100%' }}>
              <Box
                sx={{
                  width: '100%',
                  height: 200,
                  backgroundImage: 'url(https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=600&auto=format&fit=crop)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Bolt sx={{ fontSize: 40, color: '#1DB954', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
                  Fast Review
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Most tracks are reviewed and live within 3-5 business days
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* FAQ */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white', mb: 4, textAlign: 'center' }}>
            Frequently Asked Questions
          </Typography>
          <Paper sx={{ p: 4, bgcolor: '#1e1e1e' }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                What happens after I join?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                After payment, you get instant access to upload unlimited tracks for 12 months. Your membership status will be active immediately.
              </Typography>
            </Box>
            <Divider sx={{ my: 3, borderColor: '#333' }} />
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                Is there really no limit on uploads?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Yes! Upload as many tracks, EPs, and albums as you want during your membership year. No hidden fees or per-upload charges.
              </Typography>
            </Box>
            <Divider sx={{ my: 3, borderColor: '#333' }} />
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                What happens after one year?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your membership will expire after 12 months. You'll need to renew for another year to continue uploading new music. Your existing music stays live forever.
              </Typography>
            </Box>
            <Divider sx={{ my: 3, borderColor: '#333' }} />
            <Box>
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                What if my track is rejected?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                If your track doesn't meet our quality standards, we'll provide feedback and you can resubmit as many times as needed - all included in your membership.
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* CTA */}
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h5" sx={{ color: 'white', mb: 3 }}>
            Ready to share your music with the world?
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/for-artists')}
            sx={{
              bgcolor: '#1DB954',
              color: 'white',
              px: 6,
              py: 2,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              '&:hover': { bgcolor: '#1ed760' }
            }}
          >
            Get Started Now
          </Button>
        </Box>
        </Container>
      </Box>
    </>
  );
}
