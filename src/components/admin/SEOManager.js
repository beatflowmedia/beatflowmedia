import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  CheckCircle,
  Refresh,
  Download,
  Web,
  TrendingUp,
  Code
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebaseConfig';

/**
 * SEOManager - Admin dashboard tab for SEO optimization
 * Part of 2026 Hybrid Marketing Strategy (SEO Enhancement)
 *
 * Manages XML sitemap generation, meta tags, and Schema.org markup
 */
export default function SEOManager() {
  const [generating, setGenerating] = useState(false);
  const [sitemapStats, setSitemapStats] = useState(null);

  const handleGenerateSitemap = async () => {
    setGenerating(true);
    try {
      const generateSitemap = httpsCallable(functions, 'generateSitemap');
      const result = await generateSitemap();

      setSitemapStats({
        urlCount: result.data.urlCount,
        generatedAt: new Date()
      });

      toast.success(`Sitemap generated with ${result.data.urlCount} URLs`);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      toast.error('Failed to generate sitemap');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, color: 'white' }}>
        SEO Manager
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: 'grey.400' }}>
        Manage SEO optimization, XML sitemaps, meta tags, and Schema.org structured data
      </Typography>

      <Grid container spacing={3}>
        {/* Sitemap Generation */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'grey.900', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Web sx={{ color: '#1DB954' }} />
                <Typography variant="h6" sx={{ color: 'white' }}>
                  XML Sitemap
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: 'grey.400', mb: 3 }}>
                Generate and update your XML sitemap for search engines
              </Typography>

              {sitemapStats && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Last generated: {sitemapStats.generatedAt.toLocaleString()}
                  <br />
                  Total URLs: {sitemapStats.urlCount}
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={generating ? <CircularProgress size={20} /> : <Refresh />}
                  onClick={handleGenerateSitemap}
                  disabled={generating}
                  sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
                >
                  {generating ? 'Generating...' : 'Generate Sitemap'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  disabled={!sitemapStats}
                  sx={{ borderColor: 'grey.600', color: 'white' }}
                >
                  Download
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* SEO Features Status */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'grey.900', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingUp sx={{ color: '#1DB954' }} />
                <Typography variant="h6" sx={{ color: 'white' }}>
                  SEO Features
                </Typography>
              </Box>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle sx={{ color: '#1DB954' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Open Graph Meta Tags"
                    secondary="Implemented on all pages"
                    secondaryTypographyProps={{ sx: { color: 'grey.500' } }}
                    sx={{ color: 'white' }}
                  />
                  <Chip label="Active" size="small" color="success" />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <CheckCircle sx={{ color: '#1DB954' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Twitter Cards"
                    secondary="Optimized for social sharing"
                    secondaryTypographyProps={{ sx: { color: 'grey.500' } }}
                    sx={{ color: 'white' }}
                  />
                  <Chip label="Active" size="small" color="success" />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <CheckCircle sx={{ color: '#1DB954' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Schema.org Markup"
                    secondary="Structured data for songs/artists/playlists"
                    secondaryTypographyProps={{ sx: { color: 'grey.500' } }}
                    sx={{ color: 'white' }}
                  />
                  <Chip label="Active" size="small" color="success" />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <CheckCircle sx={{ color: '#1DB954' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Dynamic Meta Tags"
                    secondary="React Helmet Async integration"
                    secondaryTypographyProps={{ sx: { color: 'grey.500' } }}
                    sx={{ color: 'white' }}
                  />
                  <Chip label="Active" size="small" color="success" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Implementation Guide */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: 'rgba(29, 185, 84, 0.1)', border: '1px solid rgba(29, 185, 84, 0.3)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Code sx={{ color: '#1DB954' }} />
                <Typography variant="h6" sx={{ color: '#1DB954' }}>
                  SEO Implementation Details
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: 'grey.300', mb: 2 }}>
                All pages include:
              </Typography>

              <List dense>
                <ListItem>
                  <ListItemText
                    primary="• Canonical URLs for avoiding duplicate content"
                    sx={{ color: 'grey.300' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="• Dynamic page titles optimized for search"
                    sx={{ color: 'grey.300' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="• Meta descriptions with song/artist/playlist details"
                    sx={{ color: 'grey.300' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="• JSON-LD structured data (MusicRecording, MusicGroup, MusicPlaylist)"
                    sx={{ color: 'grey.300' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="• Meta Pixel and TikTok Pixel for conversion tracking"
                    sx={{ color: 'grey.300' }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
