// src/components/admin/MarketingDashboard.js
//
// Marketing content management, for admin.
//
// WHAT WAS REMOVED ON 2026-10-20, AND WHY IT MATTERS MORE THAN WHAT REMAINS
//
// A "Bulk Generator" tab offered to produce 30 landing pages, 30 blog posts, 30 social
// campaigns and 90 images across seven market segments. It produced nothing. Its
// handler waited two seconds, reported `status: 'success'` for every row, and named the
// files it had created -- files that were never written, under directories
// (src/pages/marketing/, public/images/marketing/) that do not exist. The agent it
// claimed to call, agents/experts/MarketingAgent.js, contains zero writeFile calls.
//
// Four progress counters sat above it -- 0/30, 0/30, 0/30, 0/90 -- fed by a useState(0)
// with no source, moved only by that simulation, and reset on every reload. A dashboard
// number that cannot be traced to a stored fact is worse than no number, because it gets
// quoted. Both are gone. If counters return, they come from a query.
//
// FOUR OF THE SEVEN SEGMENTS HAD NO PRODUCT. Artists ("Upload & Earn") is deferred;
// Curators ("Build Playlists, Earn") were removed from the platform; Investors, Vendors
// and Labels have no surface at all. The DOSI Semantic Intent caveat is explicit that a
// name no longer matching the domain is a deletion candidate, not a rename candidate.
//
// AND THE VOLUME WAS THE REAL FAULT, which is the part worth carrying forward. Thirty
// near-identical segment pages are doorway pages. CLAUDE.md's SEO section asks for deep
// pillar pages, hubs that route to them, and spokes that link INTO their pillar with the
// pillar linking back OUT -- a silo. Content earns an index slot by being part of a
// structured cluster, not by existing in quantity. The remaining tabs are where pages
// get written one at a time, deliberately.
//
// MarketingAgent.js is KEPT. It is the only part of this feature with judgement in it:
// it refuses to invent testimonials, emitting `TODO: Replace with real artist
// testimonials from Firestore`, `REAL_STATS_NEEDED`, and a warning that public display
// needs consent. Filed as OPS-68Y77 that those guards are comments rather than code.

import { useState, lazy, Suspense } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CircularProgress
} from '@mui/material';
import { Campaign, Article, Web, VideoLibrary, Search } from '@mui/icons-material';

// Lazy load sub-components
const SocialMediaManager = lazy(() => import('./SocialMediaManager'));
const LandingPageManager = lazy(() => import('./LandingPageManager'));
const BlogManager = lazy(() => import('./BlogManager'));
const VideoToolsStudio = lazy(() => import('./VideoToolsStudio'));
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
            Marketing Content Engine
          </Typography>
          {/* "at scale" is gone from this line with the generator that promised it. A
              page earns indexing by belonging to a silo, not by arriving in bulk. */}
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Landing pages, blog posts and social campaigns, written one at a time and
            linked into their pillar. See the SEO section of CLAUDE.md for the silo map.
          </Typography>
        </Box>

        <Card sx={{ bgcolor: 'background.paper' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<Web />} label="Landing Pages" />
            <Tab icon={<Article />} label="Blog Posts" />
            <Tab icon={<Campaign />} label="Social Media" />
            <Tab icon={<VideoLibrary />} label="Video Tools" />
            <Tab icon={<Search />} label="SEO" />
          </Tabs>

          <Suspense fallback={<Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box>}>
            <TabPanel value={activeTab} index={0}>
              <LandingPageManager />
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <BlogManager />
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <SocialMediaManager />
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              <VideoToolsStudio />
            </TabPanel>

            <TabPanel value={activeTab} index={4}>
              <SEOManager />
            </TabPanel>
          </Suspense>
        </Card>
      </Container>
    </Box>
  );
}
