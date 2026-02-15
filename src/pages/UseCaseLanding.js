// src/pages/UseCaseLanding.js
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  Chip,
  Alert
} from '@mui/material';
import { ShoppingCart, Info } from '@mui/icons-material';
import { getMoodLibraryTracks } from '../services/studioSamplesService';
import SampleCard from '../components/studio/SampleCard';
import { schemaToScriptTag } from '../utils/schemaMarkup';

// Use case data from ContentTypeFields.js
const USE_CASES = {
  'film-tv-scoring': {
    title: 'Music for Film & TV Scoring',
    description: 'Cinematic, dramatic tracks perfect for filmmakers, TV producers, and documentary creators',
    keywords: 'film music licensing, tv scoring music, cinematic background music, documentary music',
    targetAudience: 'Filmmakers, TV Producers, Documentary Creators',
    benefits: [
      'High-quality cinematic compositions',
      'Cleared for film & TV use',
      'Multiple license options',
      'Instant download & use'
    ]
  },
  'commercial-background': {
    title: 'Music for Commercial & Advertising',
    description: 'Professional background music for ads, marketing videos, and brand content',
    keywords: 'commercial music licensing, advertising background music, marketing video music',
    targetAudience: 'Ad Agencies, Marketing Teams, Brand Managers',
    benefits: [
      'Attention-grabbing commercial tracks',
      'Commercial license included',
      'Perfect for video ads',
      'Boost your brand message'
    ]
  },
  'corporate-video': {
    title: 'Music for Corporate Videos',
    description: 'Clean, professional music for corporate communications and training videos',
    keywords: 'corporate video music, business presentation music, training video music',
    targetAudience: 'Corporate Communications, Training Video Creators',
    benefits: [
      'Professional, polished sound',
      'Non-distracting backgrounds',
      'Corporate-friendly licensing',
      'Enhance your message'
    ]
  },
  'podcast-intro': {
    title: 'Music for Podcast Intros & Outros',
    description: 'Memorable intro and outro music to build your podcast\'s sonic brand',
    keywords: 'podcast intro music, podcast theme song, podcast music licensing',
    targetAudience: 'Podcasters, Audio Content Creators',
    benefits: [
      'Build your sonic brand',
      'Professional podcast quality',
      'Royalty-free licensing',
      'Stand out from the crowd'
    ]
  },
  'video-game': {
    title: 'Music for Video Games',
    description: 'Dynamic game music for indie developers and mobile game studios',
    keywords: 'video game music licensing, game background music, indie game music',
    targetAudience: 'Indie Game Developers, Mobile Game Studios',
    benefits: [
      'Loopable game tracks',
      'Affordable indie pricing',
      'Multiple genres available',
      'Enhance player experience'
    ]
  },
  'meditation-wellness': {
    title: 'Music for Meditation & Wellness',
    description: 'Calming, ambient music for meditation apps, wellness coaches, and yoga studios',
    keywords: 'meditation music licensing, wellness app music, yoga studio music',
    targetAudience: 'Meditation App Developers, Wellness Coaches, Yoga Studios',
    benefits: [
      'Peaceful, calming atmospheres',
      'Perfect for meditation & yoga',
      'Extended ambient tracks',
      'Create healing experiences'
    ]
  },
  'workout-fitness': {
    title: 'Music for Workout & Fitness',
    description: 'High-energy music for fitness apps, gyms, and workout video creators',
    keywords: 'workout music, fitness class music, gym background music',
    targetAudience: 'Fitness Apps, Gyms, Workout Video Creators',
    benefits: [
      'High-energy motivational tracks',
      'Perfect tempo for workouts',
      'Drive motivation & performance',
      'Energize your classes'
    ]
  },
  'social-media': {
    title: 'Music for Social Media Content',
    description: 'Royalty-free music for Instagram, TikTok, and social media creators',
    keywords: 'royalty-free music for Instagram, TikTok background music, social media music',
    targetAudience: 'Instagram Creators, TikTok Creators, Social Media Managers',
    benefits: [
      'Avoid copyright strikes',
      'Trending, modern sounds',
      'Quick 15-60 second clips',
      'Grow your audience'
    ]
  },
  'presentation-slideshow': {
    title: 'Music for Presentations & Slideshows',
    description: 'Background music for business presentations and event slideshows',
    keywords: 'presentation background music, slideshow music, business presentation music',
    targetAudience: 'Business Presenters, Event Planners',
    benefits: [
      'Professional presentation quality',
      'Non-intrusive backgrounds',
      'Keep audience engaged',
      'Elevate your message'
    ]
  },
  'on-hold-music': {
    title: 'Music for On-Hold & Business Phone',
    description: 'Professional hold music for businesses and call centers',
    keywords: 'on-hold music licensing, business phone music, call center music',
    targetAudience: 'Businesses, Call Centers, Customer Service',
    benefits: [
      'Professional brand impression',
      'Reduce perceived wait time',
      'Commercial license included',
      'Easy implementation'
    ]
  }
};

export default function UseCaseLanding() {
  const { useCase } = useParams();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState('all');

  const useCaseData = USE_CASES[useCase];

  // Load tracks filtered by use case
  useEffect(() => {
    if (!useCaseData) return;

    const loadTracks = async () => {
      setLoading(true);
      try {
        const allTracks = await getMoodLibraryTracks();

        // Filter by use case (convert slug back to display format)
        const useCaseFilter = useCase
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
          .replace(' And ', ' & ')
          .replace('Tv', 'TV');

        const filtered = allTracks.filter(track =>
          track.useCases?.some(uc =>
            uc.toLowerCase().replace(/\s+/g, '-').replace('&', 'and') === useCase
          )
        );

        setTracks(filtered);
      } catch (error) {
        console.error('Error loading tracks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTracks();
  }, [useCase, useCaseData]);

  // Filter tracks by mood and genre
  const filteredTracks = useMemo(() => {
    return tracks.filter(track => {
      const matchesMood = selectedMood === 'all' || track.moods?.includes(selectedMood);
      const matchesGenre = selectedGenre === 'all' || track.mainGenre === selectedGenre;
      return matchesMood && matchesGenre;
    });
  }, [tracks, selectedMood, selectedGenre]);

  // Extract unique moods and genres from tracks
  const availableMoods = useMemo(() => {
    const moods = new Set();
    tracks.forEach(track => {
      track.moods?.forEach(mood => moods.add(mood));
    });
    return Array.from(moods).sort();
  }, [tracks]);

  const availableGenres = useMemo(() => {
    const genres = new Set();
    tracks.forEach(track => {
      if (track.mainGenre) genres.add(track.mainGenre);
    });
    return Array.from(genres).sort();
  }, [tracks]);

  // If invalid use case, show 404
  if (!useCaseData) {
    return (
      <Container sx={{ py: 8 }}>
        <Alert severity="error">
          <Typography variant="h6">Use Case Not Found</Typography>
          <Typography>The use case "{useCase}" does not exist.</Typography>
          <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>
            Return to Home
          </Button>
        </Alert>
      </Container>
    );
  }

  // Generate Schema.org WebPage structured data
  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: useCaseData.title,
    description: useCaseData.description,
    url: `https://beatflowmediagroup.com/music-for/${useCase}`,
    keywords: useCaseData.keywords,
    inLanguage: 'en-US',
    isPartOf: {
      '@type': 'WebSite',
      name: 'BeatFlow Media',
      url: 'https://beatflowmediagroup.com'
    },
    about: {
      '@type': 'Thing',
      name: useCaseData.targetAudience
    }
  };

  return (
    <>
      <Helmet>
        <title>{useCaseData.title} | BeatFlow Media</title>
        <meta name="description" content={useCaseData.description} />
        <meta name="keywords" content={useCaseData.keywords} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={useCaseData.title} />
        <meta property="og:description" content={useCaseData.description} />
        <meta property="og:url" content={`https://beatflowmediagroup.com/music-for/${useCase}`} />
        <meta property="og:image" content="https://beatflowmediagroup.com/images/use-case-og.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="BeatFlow Media" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@BeatFlowMedia" />
        <meta name="twitter:title" content={useCaseData.title} />
        <meta name="twitter:description" content={useCaseData.description} />
        <meta name="twitter:image" content="https://beatflowmediagroup.com/images/use-case-og.jpg" />

        <link rel="canonical" href={`https://beatflowmediagroup.com/music-for/${useCase}`} />

        {/* Schema.org structured data */}
        <script {...schemaToScriptTag(pageSchema)} />
      </Helmet>

      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0e14', color: 'white', pt: 8, pb: 8 }}>
        <Container maxWidth="xl">
          {/* Hero Section */}
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
              {useCaseData.title}
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ mb: 3, maxWidth: '800px', mx: 'auto' }}>
              {useCaseData.description}
            </Typography>
            <Chip
              label={`For: ${useCaseData.targetAudience}`}
              color="primary"
              icon={<Info />}
              sx={{ fontSize: '1rem', py: 2.5, px: 1 }}
            />
          </Box>

          {/* Benefits */}
          <Grid container spacing={3} sx={{ mb: 6 }}>
            {useCaseData.benefits.map((benefit, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box
                  sx={{
                    bgcolor: '#1a1f2e',
                    p: 3,
                    borderRadius: 2,
                    textAlign: 'center',
                    height: '100%'
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {benefit}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Filters */}
          <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="h6">Filter by:</Typography>

            {/* Mood Filter */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label="All Moods"
                onClick={() => setSelectedMood('all')}
                color={selectedMood === 'all' ? 'primary' : 'default'}
                variant={selectedMood === 'all' ? 'filled' : 'outlined'}
              />
              {availableMoods.map(mood => (
                <Chip
                  key={mood}
                  label={mood.charAt(0).toUpperCase() + mood.slice(1)}
                  onClick={() => setSelectedMood(mood)}
                  color={selectedMood === mood ? 'primary' : 'default'}
                  variant={selectedMood === mood ? 'filled' : 'outlined'}
                />
              ))}
            </Box>

            {/* Genre Filter */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label="All Genres"
                onClick={() => setSelectedGenre('all')}
                color={selectedGenre === 'all' ? 'secondary' : 'default'}
                variant={selectedGenre === 'all' ? 'filled' : 'outlined'}
              />
              {availableGenres.map(genre => (
                <Chip
                  key={genre}
                  label={genre}
                  onClick={() => setSelectedGenre(genre)}
                  color={selectedGenre === genre ? 'secondary' : 'default'}
                  variant={selectedGenre === genre ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>

          {/* Track Count */}
          <Typography variant="h6" sx={{ mb: 3 }}>
            {filteredTracks.length} track{filteredTracks.length !== 1 ? 's' : ''} available
          </Typography>

          {/* Loading State */}
          {loading && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6">Loading tracks...</Typography>
            </Box>
          )}

          {/* Tracks Grid */}
          {!loading && filteredTracks.length > 0 && (
            <Grid container spacing={3}>
              {filteredTracks.map((track) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={track.id}>
                  <SampleCard sample={track} />
                </Grid>
              ))}
            </Grid>
          )}

          {/* No Results */}
          {!loading && filteredTracks.length === 0 && (
            <Alert severity="info" sx={{ mt: 4 }}>
              <Typography variant="h6">No tracks found</Typography>
              <Typography>
                Try adjusting your filters or check back later for new tracks.
              </Typography>
            </Alert>
          )}

          {/* CTA Section */}
          <Box sx={{ mt: 8, textAlign: 'center', bgcolor: '#1a1f2e', p: 6, borderRadius: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
              Ready to License Music?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Browse our full catalog or contact us for custom music solutions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<ShoppingCart />}
                onClick={() => navigate('/')}
              >
                Browse Full Catalog
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                onClick={() => navigate('/contact')}
              >
                Contact Us
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
}
