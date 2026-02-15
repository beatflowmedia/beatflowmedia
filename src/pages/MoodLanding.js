// src/pages/MoodLanding.js
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
import { ShoppingCart, MusicNote } from '@mui/icons-material';
import { getMoodLibraryTracks } from '../services/studioSamplesService';
import SampleCard from '../components/studio/SampleCard';
import { schemaToScriptTag } from '../utils/schemaMarkup';

// Mood data from MoodSelector.js
const MOODS = {
  energetic: {
    emoji: '⚡',
    title: 'Energetic Music',
    description: 'High-energy, driving, powerful tracks that energize and motivate',
    keywords: 'energetic music, high-energy tracks, motivational music, powerful music'
  },
  calm: {
    emoji: '🌊',
    title: 'Calm Music',
    description: 'Peaceful, serene, tranquil tracks for relaxation and focus',
    keywords: 'calm music, peaceful tracks, serene music, tranquil background music'
  },
  happy: {
    emoji: '😊',
    title: 'Happy Music',
    description: 'Joyful, cheerful, positive tracks that spread good vibes',
    keywords: 'happy music, joyful tracks, cheerful music, positive background music'
  },
  melancholic: {
    emoji: '🌧️',
    title: 'Melancholic Music',
    description: 'Sad, reflective, somber tracks for emotional storytelling',
    keywords: 'melancholic music, sad music, reflective tracks, emotional music'
  },
  romantic: {
    emoji: '💕',
    title: 'Romantic Music',
    description: 'Loving, intimate, warm tracks perfect for romantic content',
    keywords: 'romantic music, love songs, intimate music, warm tracks'
  },
  mysterious: {
    emoji: '🌙',
    title: 'Mysterious Music',
    description: 'Enigmatic, dark, intriguing tracks for suspenseful content',
    keywords: 'mysterious music, enigmatic tracks, dark music, suspenseful music'
  },
  epic: {
    emoji: '🎭',
    title: 'Epic Music',
    description: 'Grand, heroic, sweeping orchestral tracks for cinematic moments',
    keywords: 'epic music, cinematic tracks, heroic music, grand orchestral music'
  },
  peaceful: {
    emoji: '🕊️',
    title: 'Peaceful Music',
    description: 'Calm, meditative, soothing tracks for wellness and relaxation',
    keywords: 'peaceful music, meditative tracks, soothing music, relaxation music'
  },
  intense: {
    emoji: '🔥',
    title: 'Intense Music',
    description: 'Powerful, dramatic, forceful tracks for high-impact content',
    keywords: 'intense music, powerful tracks, dramatic music, forceful music'
  },
  playful: {
    emoji: '🎪',
    title: 'Playful Music',
    description: 'Fun, lighthearted, bouncy tracks perfect for upbeat content',
    keywords: 'playful music, fun tracks, lighthearted music, bouncy music'
  },
  dreamy: {
    emoji: '✨',
    title: 'Dreamy Music',
    description: 'Ethereal, floating, magical tracks for creative projects',
    keywords: 'dreamy music, ethereal tracks, magical music, floating music'
  },
  dark: {
    emoji: '🌑',
    title: 'Dark Music',
    description: 'Ominous, moody, shadowy tracks for thriller and horror content',
    keywords: 'dark music, ominous tracks, moody music, horror background music'
  },
  uplifting: {
    emoji: '🌅',
    title: 'Uplifting Music',
    description: 'Inspiring, hopeful, rising tracks that elevate your message',
    keywords: 'uplifting music, inspiring tracks, hopeful music, motivational music'
  },
  groovy: {
    emoji: '🎵',
    title: 'Groovy Music',
    description: 'Funky, rhythmic, danceable tracks with infectious grooves',
    keywords: 'groovy music, funky tracks, rhythmic music, danceable music'
  },
  ambient: {
    emoji: '🌫️',
    title: 'Ambient Music',
    description: 'Atmospheric, spacious, textural tracks for immersive experiences',
    keywords: 'ambient music, atmospheric tracks, spacious music, background music'
  },
  cinematic: {
    emoji: '🎬',
    title: 'Cinematic Music',
    description: 'Filmic, orchestral, dramatic tracks for professional productions',
    keywords: 'cinematic music, film music, orchestral tracks, dramatic music'
  },
  bright: {
    emoji: '☀️',
    title: 'Bright Music',
    description: 'Shiny, radiant, optimistic tracks that bring positivity',
    keywords: 'bright music, radiant tracks, optimistic music, positive music'
  },
  warm: {
    emoji: '🧡',
    title: 'Warm Music',
    description: 'Comforting, cozy, inviting tracks that create connection',
    keywords: 'warm music, comforting tracks, cozy music, inviting music'
  },
  bold: {
    emoji: '💪',
    title: 'Bold Music',
    description: 'Confident, strong, assertive tracks for impactful content',
    keywords: 'bold music, confident tracks, strong music, assertive music'
  },
  modern: {
    emoji: '🎨',
    title: 'Modern Music',
    description: 'Contemporary, fresh, innovative tracks with cutting-edge sound',
    keywords: 'modern music, contemporary tracks, fresh music, innovative music'
  }
};

export default function MoodLanding() {
  const { mood } = useParams();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedUseCase, setSelectedUseCase] = useState('all');

  const moodData = MOODS[mood];

  // Load tracks filtered by mood
  useEffect(() => {
    if (!moodData) return;

    const loadTracks = async () => {
      setLoading(true);
      try {
        const allTracks = await getMoodLibraryTracks();

        // Filter by mood
        const filtered = allTracks.filter(track =>
          track.moods?.includes(mood)
        );

        setTracks(filtered);
      } catch (error) {
        console.error('Error loading tracks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTracks();
  }, [mood, moodData]);

  // Filter tracks by genre and use case
  const filteredTracks = useMemo(() => {
    return tracks.filter(track => {
      const matchesGenre = selectedGenre === 'all' || track.mainGenre === selectedGenre;
      const matchesUseCase = selectedUseCase === 'all' || track.useCases?.includes(selectedUseCase);
      return matchesGenre && matchesUseCase;
    });
  }, [tracks, selectedGenre, selectedUseCase]);

  // Extract unique genres and use cases from tracks
  const availableGenres = useMemo(() => {
    const genres = new Set();
    tracks.forEach(track => {
      if (track.mainGenre) genres.add(track.mainGenre);
    });
    return Array.from(genres).sort();
  }, [tracks]);

  const availableUseCases = useMemo(() => {
    const useCases = new Set();
    tracks.forEach(track => {
      track.useCases?.forEach(uc => useCases.add(uc));
    });
    return Array.from(useCases).sort();
  }, [tracks]);

  // If invalid mood, show 404
  if (!moodData) {
    return (
      <Container sx={{ py: 8 }}>
        <Alert severity="error">
          <Typography variant="h6">Mood Not Found</Typography>
          <Typography>The mood "{mood}" does not exist.</Typography>
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
    '@type': 'CollectionPage',
    name: moodData.title,
    description: moodData.description,
    url: `https://beatflowmediagroup.com/mood/${mood}`,
    keywords: moodData.keywords,
    inLanguage: 'en-US',
    isPartOf: {
      '@type': 'WebSite',
      name: 'BeatFlow Media',
      url: 'https://beatflowmediagroup.com'
    },
    about: {
      '@type': 'MusicComposition',
      genre: moodData.title
    }
  };

  return (
    <>
      <Helmet>
        <title>{moodData.title} | BeatFlow Media</title>
        <meta name="description" content={moodData.description} />
        <meta name="keywords" content={moodData.keywords} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={moodData.title} />
        <meta property="og:description" content={moodData.description} />
        <meta property="og:url" content={`https://beatflowmediagroup.com/mood/${mood}`} />
        <meta property="og:image" content="https://beatflowmediagroup.com/images/mood-og.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="BeatFlow Media" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@BeatFlowMedia" />
        <meta name="twitter:title" content={moodData.title} />
        <meta name="twitter:description" content={moodData.description} />
        <meta name="twitter:image" content="https://beatflowmediagroup.com/images/mood-og.jpg" />

        <link rel="canonical" href={`https://beatflowmediagroup.com/mood/${mood}`} />

        {/* Schema.org structured data */}
        <script {...schemaToScriptTag(pageSchema)} />
      </Helmet>

      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0e14', color: 'white', pt: 8, pb: 8 }}>
        <Container maxWidth="xl">
          {/* Hero Section */}
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
              {moodData.emoji}
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
              {moodData.title}
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ mb: 3, maxWidth: '800px', mx: 'auto' }}>
              {moodData.description}
            </Typography>
          </Box>

          {/* Filters */}
          <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="h6">Filter by:</Typography>

            {/* Genre Filter */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label="All Genres"
                onClick={() => setSelectedGenre('all')}
                color={selectedGenre === 'all' ? 'primary' : 'default'}
                variant={selectedGenre === 'all' ? 'filled' : 'outlined'}
              />
              {availableGenres.map(genre => (
                <Chip
                  key={genre}
                  label={genre}
                  onClick={() => setSelectedGenre(genre)}
                  color={selectedGenre === genre ? 'primary' : 'default'}
                  variant={selectedGenre === genre ? 'filled' : 'outlined'}
                />
              ))}
            </Box>

            {/* Use Case Filter */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label="All Use Cases"
                onClick={() => setSelectedUseCase('all')}
                color={selectedUseCase === 'all' ? 'secondary' : 'default'}
                variant={selectedUseCase === 'all' ? 'filled' : 'outlined'}
              />
              {availableUseCases.slice(0, 5).map(useCase => (
                <Chip
                  key={useCase}
                  label={useCase}
                  onClick={() => setSelectedUseCase(useCase)}
                  color={selectedUseCase === useCase ? 'secondary' : 'default'}
                  variant={selectedUseCase === useCase ? 'filled' : 'outlined'}
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

          {/* Related Moods */}
          <Box sx={{ mt: 8 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
              Explore Related Moods
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {Object.entries(MOODS)
                .filter(([key]) => key !== mood)
                .slice(0, 6)
                .map(([key, data]) => (
                  <Chip
                    key={key}
                    label={`${data.emoji} ${data.title.replace(' Music', '')}`}
                    onClick={() => navigate(`/mood/${key}`)}
                    sx={{ fontSize: '1.1rem', py: 3, px: 2 }}
                  />
                ))}
            </Box>
          </Box>

          {/* CTA Section */}
          <Box sx={{ mt: 8, textAlign: 'center', bgcolor: '#1a1f2e', p: 6, borderRadius: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
              Find the Perfect Mood
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Browse all 20 moods or explore our full production music catalog
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
                startIcon={<MusicNote />}
                onClick={() => navigate('/contact')}
              >
                Custom Music Request
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
}
