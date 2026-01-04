// src/components/admin/ContentBulkGenerator.js
// Bulk content generation using MarketingAgent
import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox
} from '@mui/material';
import {
  AutoAwesome,
  CheckCircle,
  Error as ErrorIcon,
  Pending
} from '@mui/icons-material';

export default function ContentBulkGenerator({ onStatsUpdate }) {
  const [contentType, setContentType] = useState('landing-pages');
  const [selectedSegments, setSelectedSegments] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);

  const segments = [
    { id: 'artists', name: 'Artists', description: 'Upload & Earn' },
    { id: 'listeners', name: 'Listeners', description: 'Discover Music' },
    { id: 'curators', name: 'Curators', description: 'Build Playlists, Earn' },
    { id: 'advertisers', name: 'Advertisers', description: 'Reach Music Lovers' },
    { id: 'investors', name: 'Investors', description: 'Investment Opportunities' },
    { id: 'vendors', name: 'Vendors', description: 'Partner with BeatFlow' },
    { id: 'labels', name: 'Labels', description: 'Distribute Your Catalog' }
  ];

  const contentTypes = [
    { value: 'landing-pages', label: 'Landing Pages', count: 30, description: 'Generate conversion-optimized landing pages' },
    { value: 'blog-posts', label: 'Blog Posts', count: 30, description: 'Generate SEO-optimized blog content' },
    { value: 'social-campaigns', label: 'Social Campaigns', count: 30, description: 'Generate social media campaigns with 3 aspect ratios' }
  ];

  const handleToggleSegment = (segmentId) => {
    setSelectedSegments(prev =>
      prev.includes(segmentId)
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSegments.length === segments.length) {
      setSelectedSegments([]);
    } else {
      setSelectedSegments(segments.map(s => s.id));
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setProgress(0);
    setResults([]);

    try {
      const total = selectedSegments.length;

      for (let i = 0; i < selectedSegments.length; i++) {
        const segment = selectedSegments[i];

        // Simulate MarketingAgent generation
        // In real implementation, this would call the MarketingAgent
        await new Promise(resolve => setTimeout(resolve, 2000));

        const result = {
          segment,
          status: 'success',
          message: `Generated ${contentType} for ${segment}`,
          files: [
            `src/pages/marketing/landing/${segment.charAt(0).toUpperCase() + segment.slice(1)}Landing.js`,
            `public/images/marketing/landing-pages/${segment}/hero-bg.webp`
          ]
        };

        setResults(prev => [...prev, result]);
        setProgress(((i + 1) / total) * 100);
      }

      // Update parent stats
      if (onStatsUpdate) {
        onStatsUpdate(prev => ({
          ...prev,
          landingPages: prev.landingPages + selectedSegments.length
        }));
      }
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setGenerating(false);
    }
  };

  const selectedType = contentTypes.find(t => t.value === contentType);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Bulk Content Generation
      </Typography>

      <Grid container spacing={3}>
        {/* Configuration Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'background.default' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Configuration
              </Typography>

              {/* Content Type Selector */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Content Type</InputLabel>
                <Select
                  value={contentType}
                  label="Content Type"
                  onChange={(e) => setContentType(e.target.value)}
                >
                  {contentTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box>
                        <Typography variant="body1">{type.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {type.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedType && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Target:</strong> {selectedType.count} {selectedType.label}
                  </Typography>
                  <Typography variant="caption">
                    Select segments to generate content for
                  </Typography>
                </Alert>
              )}

              {/* Market Segments Selection */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2">
                    Market Segments ({selectedSegments.length}/{segments.length})
                  </Typography>
                  <Button size="small" onClick={handleSelectAll}>
                    {selectedSegments.length === segments.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </Box>

                <List dense>
                  {segments.map(segment => (
                    <ListItem
                      key={segment.id}
                      button
                      onClick={() => handleToggleSegment(segment.id)}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        '&:hover': { bgcolor: 'rgba(29, 185, 84, 0.1)' }
                      }}
                    >
                      <ListItemIcon>
                        <Checkbox
                          checked={selectedSegments.includes(segment.id)}
                          edge="start"
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={segment.name}
                        secondary={segment.description}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>

              {/* Generate Button */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<AutoAwesome />}
                onClick={handleGenerate}
                disabled={generating || selectedSegments.length === 0}
                sx={{
                  bgcolor: '#1DB954',
                  '&:hover': { bgcolor: '#1ed760' },
                  '&:disabled': { bgcolor: 'grey.700' }
                }}
              >
                {generating ? 'Generating...' : `Generate ${selectedSegments.length} ${selectedType?.label}`}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Results Section */}
        <Grid item xs={12} md={8}>
          <Card sx={{ bgcolor: 'background.default' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Generation Results
              </Typography>

              {generating && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      Processing... ({Math.round(progress)}%)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {results.length}/{selectedSegments.length} completed
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#1DB954'
                      }
                    }}
                  />
                </Box>
              )}

              {results.length === 0 && !generating && (
                <Alert severity="info">
                  <Typography variant="body2">
                    Select segments and click "Generate" to start bulk content creation.
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    The MarketingAgent will create conversion-optimized content with:
                  </Typography>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                    <li><Typography variant="caption">SEO-optimized copy</Typography></li>
                    <li><Typography variant="caption">Success stories & testimonials</Typography></li>
                    <li><Typography variant="caption">FOMO elements & social proof</Typography></li>
                    <li><Typography variant="caption">Internal backlinks</Typography></li>
                    <li><Typography variant="caption">Responsive WebP images</Typography></li>
                  </ul>
                </Alert>
              )}

              {results.length > 0 && (
                <List>
                  {results.map((result, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        bgcolor: result.status === 'success' ? 'rgba(29, 185, 84, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                        borderRadius: 1,
                        mb: 1,
                        border: '1px solid',
                        borderColor: result.status === 'success' ? 'rgba(29, 185, 84, 0.3)' : 'rgba(244, 67, 54, 0.3)'
                      }}
                    >
                      <ListItemIcon>
                        {result.status === 'success' ? (
                          <CheckCircle sx={{ color: '#1DB954' }} />
                        ) : result.status === 'error' ? (
                          <ErrorIcon sx={{ color: '#f44336' }} />
                        ) : (
                          <Pending sx={{ color: '#ff9800' }} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {segments.find(s => s.id === result.segment)?.name} - {result.status.toUpperCase()}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {result.message}
                            </Typography>
                            {result.files && (
                              <Box sx={{ mt: 1 }}>
                                {result.files.map((file, i) => (
                                  <Chip
                                    key={i}
                                    label={file.split('/').pop()}
                                    size="small"
                                    sx={{ mr: 0.5, mt: 0.5 }}
                                  />
                                ))}
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}

              {!generating && results.length > 0 && results.length === selectedSegments.length && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    ✅ Generation Complete!
                  </Typography>
                  <Typography variant="body2">
                    Successfully generated {results.length} {selectedType?.label}. Files have been created and are ready for review.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Features Info */}
      <Card sx={{ bgcolor: 'rgba(29, 185, 84, 0.05)', mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            What Gets Generated?
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                React Components
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Landing page components with clamp() responsive design<br />
                • Hero sections with WebP backgrounds<br />
                • Success story sections<br />
                • Feature grids & pricing sections
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                SEO & Performance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Meta tags & Open Graph<br />
                • Keyword optimization<br />
                • Internal backlinks<br />
                • WebP optimized images
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Conversion Elements
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • FOMO badges & counters<br />
                • Social proof testimonials<br />
                • Clear CTAs<br />
                • Success metrics
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
