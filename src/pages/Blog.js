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
} from '@mui/icons-material';
import GoogleAdSense from '../components/GoogleAdSense';
import { BLOG_POSTS, categoriesOf, asDate } from '../data/blogPosts';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // DERIVED FROM THE POSTS, not listed. The hardcoded version offered Artist Tips,
  // Platform Updates, Success Stories, Music Marketing and Revenue Optimization --
  // five filters that returned nothing, because no post carries those categories any
  // more. A filter that always comes back empty teaches people the search is broken.
  const categories = ['All Posts', ...categoriesOf()];

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);

        // ONE SOURCE. This was a `mockPosts` array duplicating what BlogPost.js
        // already held and what BlogManager held a third, different version of -- none
        // of the three agreeing. Correcting one post's title meant three edits, and the
        // one missed here left an excerpt describing "three independent artists" who do
        // not exist, under a headline that no longer mentioned them.
        //
        // publishDate is an ISO string in the data module; the Date is built here
        // because a Date in a shared constant is a mutable object every consumer holds
        // a reference to.
        const published = BLOG_POSTS.map((post) => ({
          ...post,
          publishDate: asDate(post)
        }));

        setPosts(published);
        setFilteredPosts(published);
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
            {/* A PLACEHOLDER IS NOT A LABEL, which is what the pre-commit hook caught
              * here. It disappears the moment anyone types, so a person who looks away
              * mid-sentence loses the only clue what the field is for; screen readers
              * treat it inconsistently, and some skip it entirely. The search box on a
              * blog index is the one control on the page, so an unlabelled one is the
              * whole navigation gone for anyone not reading the screen.
              *
              * aria-label names it without adding visible chrome. The placeholder stays
              * as the hint it actually is. */}
            <TextField
              fullWidth
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              inputProps={{ 'aria-label': 'Search articles' }}
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

                        {/* Same fabricated counter as the article page, on every card.
                          * See the note in BlogPost.js and OPS-4SEC4. */}
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
            <Link to="/explore-premium" style={{ textDecoration: 'none' }}>
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
