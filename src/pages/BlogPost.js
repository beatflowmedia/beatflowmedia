// src/pages/BlogPost.js
// Individual blog post page with SEO optimization
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Avatar
} from '@mui/material';
import {
  Schedule,
  Share,
  ArrowBack,
  TrendingUp
} from '@mui/icons-material';
import marketingService from '../services/marketingService';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);

        // In production, fetch from Firestore by slug
        // For now, using mock data
        const mockPost = {
          id: 'blog-001',
          title: 'How Independent Artists Are Earning $10K+ Monthly on BeatFlow',
          slug: 'independent-artists-earning-10k-monthly',
          category: 'Success Stories',
          publishDate: new Date('2026-01-01'),
          readTime: '5 min',
          excerpt: 'Discover how three independent artists turned their passion into a full-time income using BeatFlow\'s distribution and revenue tools.',
          keywords: ['independent artist income', 'music revenue', 'artist success stories'],
          author: 'BeatFlow Team',
          authorImage: '/images/beatflow-logo.png',
          featuredImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&h=600&fit=crop',
          content: `
            <p>In the evolving music industry landscape, independent artists are finding unprecedented success on platforms that prioritize fair compensation and direct fan relationships. <a href="/for-artists">BeatFlow</a> has emerged as a game-changer for artists seeking to monetize their craft without sacrificing creative control.</p>

            <h2>Meet Three Artists Who've Cracked the Code</h2>

            <h3>Sarah Chen - Electronic Producer</h3>
            <p>Sarah started uploading her ambient electronic tracks to BeatFlow in March 2025. Within 8 months, she was earning $12,500 per month through a combination of streaming revenue, <a href="/blog/curators-maximize-playlist-revenue-2026">playlist placements</a>, and direct fan support.</p>

            <p><strong>Her Strategy:</strong></p>
            <ul>
              <li>Consistent weekly releases to maintain algorithmic momentum</li>
              <li>Engagement with <a href="/become-curator">curator community</a> for playlist placements</li>
              <li><a href="/artist-pricing">Premium-tier subscription</a> for enhanced analytics and promotion tools</li>
              <li>Direct fan communication through BeatFlow's artist profile features</li>
            </ul>

            <blockquote>
              "BeatFlow's transparent revenue model and curator network changed everything for me. I can see exactly where my money comes from and plan my releases strategically." - Sarah Chen
            </blockquote>

            <h3>Marcus Rodriguez - Hip-Hop Artist</h3>
            <p>Marcus leveraged <a href="/blog/music-distribution-guide-2026">BeatFlow's distribution tools</a> to build a sustainable music career, earning $15,200 monthly by Q4 2025. His success came from understanding the platform's unique features.</p>

            <p><strong>Key Tactics:</strong></p>
            <ul>
              <li>Cross-promotion with other BeatFlow artists</li>
              <li>Regular engagement with <a href="/blog/social-media-marketing-musicians">BeatFlow's social media integration</a></li>
              <li>Strategic use of genre tags and metadata for discoverability</li>
              <li>Behind-the-scenes content that increased follower engagement by 340%</li>
            </ul>

            <h3>Luna Park - Indie Folk Singer</h3>
            <p>Luna's organic growth story demonstrates how BeatFlow's algorithm rewards authentic artistry. Her monthly earnings reached $10,800 within 6 months of joining.</p>

            <p><strong>Success Factors:</strong></p>
            <ul>
              <li>High-quality production values</li>
              <li>Consistent release schedule (one single every 3 weeks)</li>
              <li>Active participation in <a href="/become-curator">BeatFlow's curator recommendation program</a></li>
              <li>Fan playlist creation encouraging listener curation</li>
            </ul>

            <h2>The BeatFlow Advantage: Why Artists Are Earning More</h2>

            <h3>1. Transparent Revenue Sharing</h3>
            <p>Unlike traditional platforms that pay fractions of a cent per stream, BeatFlow's model ensures artists receive 70% of streaming revenue—industry-leading rates that make sustainable careers possible.</p>

            <h3>2. Curator Economy Integration</h3>
            <p>BeatFlow's unique curator marketplace means your music gets human-curated placements, not just algorithmic recommendations. This leads to engaged listeners who actually care about your music.</p>

            <h3>3. Direct Fan Relationships</h3>
            <p>The platform's artist profile features allow you to build genuine connections with fans, turning casual listeners into loyal supporters who follow your entire catalog.</p>

            <h3>4. Data-Driven Insights</h3>
            <p>Premium artist tools provide detailed analytics showing:</p>
            <ul>
              <li>Geographic listener distribution</li>
              <li>Peak streaming times</li>
              <li>Playlist performance metrics</li>
              <li>Revenue breakdowns by song and source</li>
            </ul>

            <h2>Getting Started: Your Path to $10K/Month</h2>

            <h3>Month 1-2: Foundation Building</h3>
            <ul>
              <li>Upload your best 5-10 tracks with professional metadata</li>
              <li>Optimize your <a href="/artist-profile">artist profile</a> with bio, images, and social links</li>
              <li>Research successful artists in your genre on the platform</li>
              <li>Engage with <a href="/curator-inbox">curator community</a> through thoughtful submissions</li>
            </ul>

            <h3>Month 3-4: Growth Acceleration</h3>
            <ul>
              <li>Establish consistent release schedule (weekly or bi-weekly)</li>
              <li>Analyze your analytics to identify top-performing tracks</li>
              <li>Collaborate with other BeatFlow artists for cross-promotion</li>
              <li>Invest in <a href="/artist-pricing">premium tier</a> for advanced promotion tools</li>
            </ul>

            <h3>Month 5-6: Revenue Optimization</h3>
            <ul>
              <li>Double down on what's working based on data insights</li>
              <li>Create strategic playlists featuring your tracks alongside similar artists</li>
              <li>Engage with your growing fanbase through regular updates</li>
              <li>Explore additional revenue streams like <a href="/sync-licensing">sync licensing</a></li>
            </ul>

            <h2>The Numbers Don't Lie</h2>
            <p>BeatFlow artists who follow best practices see average monthly earnings of:</p>
            <ul>
              <li><strong>$2,500-$5,000</strong> after 3 months (consistent uploaders)</li>
              <li><strong>$5,000-$10,000</strong> after 6 months (active engagement)</li>
              <li><strong>$10,000+</strong> after 9-12 months (strategic optimization)</li>
            </ul>

            <h2>Ready to Start Your Journey?</h2>
            <p>The independent artist revolution is here, and <a href="/for-artists">BeatFlow is leading the charge</a>. Whether you're just starting or looking to take your existing career to the next level, the platform offers tools and community support to help you succeed.</p>

            <p><strong>Next Steps:</strong></p>
            <ol>
              <li><a href="/artist-pricing">Sign up for BeatFlow Artist Account</a></li>
              <li>Review <a href="/artist-pricing">pricing tiers</a> and select the plan that fits your goals</li>
              <li>Upload your first tracks with optimized metadata</li>
              <li>Connect with the <a href="/become-curator">curator community</a></li>
              <li>Track your progress and adjust your strategy</li>
            </ol>

            <p>Join Sarah, Marcus, Luna, and thousands of other independent artists building sustainable music careers on <a href="/">BeatFlow</a>.</p>

            <hr style="margin: 2rem 0; border: none; border-top: 1px solid rgba(255,255,255,0.1);" />

            <p><em>Related articles:</em></p>
            <ul>
              <li><a href="/blog/curators-maximize-playlist-revenue-2026">7 Ways Curators Can Maximize Playlist Revenue</a></li>
              <li><a href="/blog/music-distribution-guide-2026">The Complete Guide to Music Distribution</a></li>
              <li><a href="/blog/social-media-marketing-musicians">10 Social Media Marketing Tips for Musicians</a></li>
            </ul>
          `,
          views: 2847,
          shares: 156
        };

        setPost(mockPost);

        // Track view
        // await marketingService.trackBlogPostView(postId);

        // Load related posts
        setRelatedPosts([
          {
            id: 'blog-002',
            title: '7 Ways Curators Can Maximize Playlist Revenue in 2026',
            slug: 'curators-maximize-playlist-revenue-2026',
            category: 'Revenue Optimization',
            readTime: '6 min',
            excerpt: 'Learn proven strategies to grow your playlist following and increase earnings.',
            image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop'
          },
          {
            id: 'blog-003',
            title: 'The Complete Guide to Music Distribution for Labels',
            slug: 'music-distribution-guide-labels-2026',
            category: 'Distribution Guide',
            readTime: '8 min',
            excerpt: 'Everything record labels need to know about modern music distribution.',
            image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=600&fit=crop'
          }
        ]);
      } catch (err) {
        console.error('Error loading blog post:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [slug]);

  useEffect(() => {
    if (post) {
      document.title = `${post.title} | BeatFlow Blog`;
    }
  }, [post]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href
        });
        // Track share
        // await marketingService.trackBlogPostShare(post.id);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#0a0e14' }}>
        <CircularProgress sx={{ color: '#1DB954' }} />
      </Box>
    );
  }

  if (error || !post) {
    return (
      <Container maxWidth="md" sx={{ py: 8, bgcolor: '#0a0e14', minHeight: '100vh' }}>
        <Alert severity="error">
          Blog post not found or failed to load.
        </Alert>
        <Link to="/blog" style={{ color: '#1DB954', marginTop: '16px', display: 'inline-block' }}>
          ← Back to Blog
        </Link>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: '#0a0e14', minHeight: '100vh', color: 'white', py: 4 }}>
        <Container maxWidth="md">
          {/* Back Button */}
          <Link to="/blog" style={{ color: '#1DB954', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <ArrowBack fontSize="small" />
            Back to Blog
          </Link>

          {/* Featured Image */}
          {post.featuredImage && (
            <Box
              sx={{
                width: '100%',
                height: 400,
                backgroundImage: `url(${post.featuredImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: 2,
                mb: 4,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 100%)',
                  borderRadius: 2
                }
              }}
            />
          )}

          {/* Article Header */}
          <Box sx={{ mb: 4 }}>
            <Chip
              label={post.category}
              sx={{ bgcolor: '#1DB954', color: 'white', mb: 2 }}
            />
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
              {post.title}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              {post.excerpt}
            </Typography>

            {/* Meta Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#1DB954' }}>
                  BF
                </Avatar>
                <Typography variant="body2">{post.author}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Schedule fontSize="small" color="disabled" />
                <Typography variant="body2" color="text.secondary">
                  {post.readTime} read
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {post.publishDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUp fontSize="small" color="disabled" />
                <Typography variant="body2" color="text.secondary">
                  {post.views.toLocaleString()} views
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
          </Box>

          {/* Article Content */}
          <Box
            sx={{
              '& h2': {
                fontSize: '2rem',
                fontWeight: 'bold',
                mt: 4,
                mb: 2,
                color: '#1DB954'
              },
              '& h3': {
                fontSize: '1.5rem',
                fontWeight: 'bold',
                mt: 3,
                mb: 1.5
              },
              '& p': {
                fontSize: '1.125rem',
                lineHeight: 1.8,
                mb: 2,
                color: 'rgba(255,255,255,0.9)'
              },
              '& ul, & ol': {
                fontSize: '1.125rem',
                lineHeight: 1.8,
                mb: 2,
                pl: 3
              },
              '& li': {
                mb: 1
              },
              '& strong': {
                color: '#1DB954',
                fontWeight: 'bold'
              },
              '& blockquote': {
                borderLeft: '4px solid #1DB954',
                pl: 3,
                py: 2,
                my: 3,
                fontStyle: 'italic',
                bgcolor: 'rgba(29, 185, 84, 0.1)',
                borderRadius: 1
              },
              '& a': {
                color: '#1DB954',
                textDecoration: 'underline',
                fontWeight: 500,
                transition: 'color 0.2s',
                '&:hover': {
                  color: '#1ed760'
                }
              },
              '& hr': {
                margin: '2rem 0',
                border: 'none',
                borderTop: '1px solid rgba(255,255,255,0.1)'
              },
              '& em': {
                color: 'rgba(255,255,255,0.7)',
                fontStyle: 'italic'
              }
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Share Button */}
          <Box sx={{ display: 'flex', gap: 2, my: 4 }}>
            <Chip
              icon={<Share />}
              label="Share Article"
              onClick={handleShare}
              clickable
              sx={{ bgcolor: 'rgba(29, 185, 84, 0.1)', '&:hover': { bgcolor: 'rgba(29, 185, 84, 0.2)' } }}
            />
          </Box>

          <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }} />

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <Box sx={{ mt: 6 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                Related Articles
              </Typography>
              <Box sx={{ display: 'grid', gap: 3 }}>
                {relatedPosts.map(related => (
                  <Card
                    key={related.id}
                    component={Link}
                    to={`/blog/${related.slug}`}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.05)',
                      textDecoration: 'none',
                      transition: 'all 0.3s',
                      display: 'flex',
                      flexDirection: 'row',
                      overflow: 'hidden',
                      '&:hover': {
                        bgcolor: 'rgba(29, 185, 84, 0.1)',
                        transform: 'translateY(-4px)'
                      }
                    }}
                  >
                    {/* Related Post Image */}
                    <Box
                      sx={{
                        width: 200,
                        minWidth: 200,
                        backgroundImage: `url(${related.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />

                    <CardContent sx={{ flexGrow: 1 }}>
                      <Chip
                        label={related.category}
                        size="small"
                        sx={{ bgcolor: '#1DB954', color: 'white', mb: 1 }}
                      />
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
                        {related.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {related.excerpt}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {related.readTime} read
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          )}
        </Container>
      </Box>
  );
}
