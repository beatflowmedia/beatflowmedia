// src/components/admin/MarketingDashboard.js
// Marketing content management dashboard for admin
import { useState, lazy, Suspense } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { Campaign, Article, Web, Image as ImageIcon, AutoAwesome, Link as LinkIcon, VideoLibrary, Email, Search } from '@mui/icons-material';

// Lazy load sub-components
const ContentBulkGenerator = lazy(() => import('./ContentBulkGenerator'));
const SocialMediaManager = lazy(() => import('./SocialMediaManager'));
const LandingPageManager = lazy(() => import('./LandingPageManager'));
const BlogManager = lazy(() => import('./BlogManager'));
const SmartLinkManager = lazy(() => import('./SmartLinkManager'));
const VideoToolsStudio = lazy(() => import('./VideoToolsStudio'));
const FanCaptureManager = lazy(() => import('./FanCaptureManager'));
const SEOManager = lazy(() => import('./SEOManager'));

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} role="tabpanel">
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function MarketingDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    landingPages: 0,
    blogPosts: 0,
    socialCampaigns: 0,
    totalImages: 0
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
            Marketing Content Engine
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Generate and manage landing pages, blogs, and social media content at scale
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'rgba(29, 185, 84, 0.1)', border: '1px solid rgba(29, 185, 84, 0.3)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Web sx={{ fontSize: 40, color: '#1DB954' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1DB954' }}>
                      {stats.landingPages}/30
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Landing Pages
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', border: '1px solid rgba(33, 150, 243, 0.3)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Article sx={{ fontSize: 40, color: '#2196f3' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                      {stats.blogPosts}/30
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Blog Posts
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'rgba(156, 39, 176, 0.1)', border: '1px solid rgba(156, 39, 176, 0.3)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Campaign sx={{ fontSize: 40, color: '#9c27b0' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                      {stats.socialCampaigns}/30
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Social Campaigns
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)', border: '1px solid rgba(255, 152, 0, 0.3)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ImageIcon sx={{ fontSize: 40, color: '#ff9800' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                      {stats.totalImages}/90
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Optimized Images
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                AI-Powered Content Generation Ready
              </Typography>
              <Typography variant="body2">
                MarketingAgent can generate all content with brand consistency, SEO optimization, and conversion focus
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AutoAwesome />}
              sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
              onClick={() => setActiveTab(0)}
            >
              Start Generating
            </Button>
          </Box>
        </Alert>

        {/* Tabs */}
        <Card sx={{ bgcolor: 'background.paper' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': { color: 'text.secondary' },
              '& .Mui-selected': { color: '#1DB954' }
            }}
          >
            <Tab icon={<AutoAwesome />} label="Bulk Generator" />
            <Tab icon={<Web />} label="Landing Pages" />
            <Tab icon={<Article />} label="Blog Posts" />
            <Tab icon={<Campaign />} label="Social Media" />
            <Tab icon={<LinkIcon />} label="Smart Links" />
            <Tab icon={<VideoLibrary />} label="Video Tools" />
            <Tab icon={<Email />} label="Fan Capture" />
            <Tab icon={<Search />} label="SEO" />
          </Tabs>

          <Suspense fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          }>
            <TabPanel value={activeTab} index={0}>
              <ContentBulkGenerator onStatsUpdate={setStats} />
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <LandingPageManager />
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <BlogManager />
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              <SocialMediaManager />
            </TabPanel>

            <TabPanel value={activeTab} index={4}>
              <SmartLinkManager />
            </TabPanel>

            <TabPanel value={activeTab} index={5}>
              <VideoToolsStudio />
            </TabPanel>

            <TabPanel value={activeTab} index={6}>
              <FanCaptureManager />
            </TabPanel>

            <TabPanel value={activeTab} index={7}>
              <SEOManager />
            </TabPanel>
          </Suspense>
        </Card>
      </Container>
    </Box>
  );
}
