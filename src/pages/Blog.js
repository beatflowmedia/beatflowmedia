// src/pages/Blog.js
// Blog index page listing all published blog posts
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Search,
  Schedule,
  TrendingUp
} from '@mui/icons-material';
import marketingService from '../services/marketingService';
import GoogleAdSense from '../components/GoogleAdSense';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    'All Posts',
    'Artist Tips',
    'Industry News',
    'Platform Updates',
    'Success Stories',
    'Music Marketing',
    'Distribution Guide',
    'Revenue Optimization'
  ];

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);

        // In production, fetch from Firestore
        // const publishedPosts = await marketingService.getBlogPosts({ status: 'published' });

        // Mock data for now
        const mockPosts = [
          {
            id: 'blog-001',
            title: 'How Independent Artists Are Earning $10K+ Monthly on BeatFlow',
            slug: 'independent-artists-earning-10k-monthly',
            category: 'Success Stories',
            publishDate: new Date('2026-01-01'),
            readTime: '5 min',
            excerpt: 'Discover how three independent artists turned their passion into a full-time income using BeatFlow\'s distribution and revenue tools.',
            views: 2847,
            shares: 156,
            image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=600&fit=crop'
          },
          {
            id: 'blog-002',
            title: '7 Ways Curators Can Maximize Playlist Revenue in 2026',
            slug: 'curators-maximize-playlist-revenue-2026',
            category: 'Revenue Optimization',
            publishDate: new Date('2025-12-28'),
            readTime: '6 min',
            excerpt: 'Learn proven strategies to grow your playlist following and increase earnings through strategic curation and engagement.',
            views: 1523,
            shares: 89,
            image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop'
          },
          {
            id: 'blog-003',
            title: 'The Ultimate Guide to Music Distribution in 2026',
            slug: 'music-distribution-guide-2026',
            category: 'Distribution Guide',
            publishDate: new Date('2025-12-20'),
            readTime: '8 min',
            excerpt: 'Everything you need to know about modern music distribution, from choosing platforms to maximizing revenue.',
            views: 3156,
            shares: 234,
            image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=600&fit=crop'
          },
          {
            id: 'blog-004',
            title: 'Platform Update: New Analytics Dashboard for Artists',
            slug: 'new-analytics-dashboard-artists',
            category: 'Platform Updates',
            publishDate: new Date('2025-12-15'),
            readTime: '4 min',
            excerpt: 'Introducing our completely redesigned analytics dashboard with real-time insights and revenue tracking.',
            views: 891,
            shares: 45,
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop'
          },
          {
            id: 'blog-005',
            title: '10 Social Media Marketing Tips for Musicians',
            slug: 'social-media-marketing-musicians',
            category: 'Music Marketing',
            publishDate: new Date('2025-12-10'),
            readTime: '7 min',
            excerpt: 'Master social media marketing with these proven strategies from successful BeatFlow artists.',
            views: 2034,
            shares: 178,
            image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=600&fit=crop'
          },
          {
            id: 'blog-006',
            title: 'Industry Trends: The Rise of Independent Music in 2026',
            slug: 'rise-of-independent-music-2026',
            category: 'Industry News',
            publishDate: new Date('2025-12-05'),
            readTime: '6 min',
            excerpt: 'How independent artists are reshaping the music industry and what it means for your career.',
            views: 4521,
            shares: 312,
            image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=600&fit=crop'
          }
        ];

        setPosts(mockPosts);
        setFilteredPosts(mockPosts);
      } catch (error) {
        console.error('Error loading blog posts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  useEffect(() => {
    let filtered = posts;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post =>
        post.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPosts(filtered);
  }, [searchQuery, selectedCategory, posts]);

  useEffect(() => {
    document.title = 'BeatFlow Blog - Music Industry Insights & Artist Tips';
  }, []);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category === 'All Posts' ? 'all' : category);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#0a0e14' }}>
        <CircularProgress sx={{ color: '#1DB954' }} />
      </Box>
    );
  }

  return (
    <>
      <GoogleAdSense />
      <Box sx={{ bgcolor: '#0a0e14', minHeight: '100vh', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          {/* Header */}
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
              BeatFlow Blog
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Music industry insights, artist tips, and platform updates
            </Typography>
          </Box>

          {/* Search Bar */}
          <Box sx={{ mb: 4 }}>
            <TextField
              fullWidth
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'rgba(255,255,255,0.5)' }} />
                  </InputAdornment>
                )
              }}
              sx={{
                bgcolor: 'rgba(255,255,255,0.05)',
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255,255,255,0.1)'
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(29, 185, 84, 0.5)'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1DB954'
                  }
                }
              }}
            />
          </Box>

          {/* Category Filters */}
          <Box sx={{ display: 'flex', gap: 1, mb: 4, flexWrap: 'wrap' }}>
            {categories.map(category => (
              <Chip
                key={category}
                label={category}
                onClick={() => handleCategoryClick(category)}
                clickable
                sx={{
                  bgcolor: (selectedCategory === 'all' && category === 'All Posts') ||
                           (selectedCategory.toLowerCase() === category.toLowerCase())
                    ? '#1DB954'
                    : 'rgba(255,255,255,0.05)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: (selectedCategory === 'all' && category === 'All Posts') ||
                             (selectedCategory.toLowerCase() === category.toLowerCase())
                      ? '#1ed760'
                      : 'rgba(29, 185, 84, 0.2)'
                  }
                }}
              />
            ))}
          </Box>

          {/* Results Count */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'} found
          </Typography>

          {/* Blog Posts Grid */}
          {filteredPosts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No articles found matching your search.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={4}>
              {filteredPosts.map(post => (
                <Grid item xs={12} md={6} lg={4} key={post.id}>
                  <Card
                    component={Link}
                    to={`/blog/${post.slug}`}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.05)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      textDecoration: 'none',
                      transition: 'all 0.3s',
                      '&:hover': {
                        bgcolor: 'rgba(29, 185, 84, 0.1)',
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 24px rgba(29, 185, 84, 0.2)'
                      }
                    }}
                  >
                    {/* Featured Image */}
                    <Box
                      sx={{
                        height: 200,
                        backgroundImage: `url(${post.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 100%)'
                        }
                      }}
                    />

                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Chip
                        label={post.category}
                        size="small"
                        sx={{ bgcolor: '#1DB954', color: 'white', mb: 2, alignSelf: 'flex-start' }}
                      />

                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white', mb: 1, flexGrow: 1 }}>
                        {post.title}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {post.excerpt}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Schedule fontSize="small" sx={{ color: 'rgba(255,255,255,0.5)' }} />
                          <Typography variant="caption" color="text.secondary">
                            {post.readTime}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TrendingUp fontSize="small" sx={{ color: 'rgba(255,255,255,0.5)' }} />
                          <Typography variant="caption" color="text.secondary">
                            {post.views.toLocaleString()} views
                          </Typography>
                        </Box>
                      </Box>

                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                        {post.publishDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* CTA Section */}
          <Box sx={{ mt: 8, p: 4, bgcolor: 'rgba(29, 185, 84, 0.1)', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
              Ready to Start Your Music Career?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Join thousands of independent artists earning sustainable income on BeatFlow
            </Typography>
            <Link to="/artist-pricing" style={{ textDecoration: 'none' }}>
              <Chip
                label="Get Started Today"
                clickable
                sx={{
                  bgcolor: '#1DB954',
                  color: 'white',
                  fontSize: '1rem',
                  py: 3,
                  px: 2,
                  '&:hover': { bgcolor: '#1ed760' }
                }}
              />
            </Link>
          </Box>
        </Container>
      </Box>
    </>
  );
}
