// src/components/admin/BlogManager.js
// Blog post manager - create, edit, publish SEO-optimized blog content
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Edit,
  Visibility,
  Delete,
  Publish,
  CheckCircle,
  PendingActions,
  Article,
  Schedule
} from '@mui/icons-material';
import { useModal } from '../../hooks/useModal';
import { BLOG_POSTS, categoriesOf, asDate } from '../../data/blogPosts';

export default function BlogManager() {
  const { showConfirm } = useModal();
  const [posts, setPosts] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [editedContent, setEditedContent] = useState({});

  // Derived, so the filter cannot offer a category with no posts behind it.
  const categories = ['All', ...categoriesOf()];

  // ONE SOURCE, shared with the public blog.
  //
  // This held its own `mockPosts` array -- a THIRD description of the blog, disagreeing
  // with both Blog.js and BlogPost.js. On 2026-10-21 it still listed a post retired that
  // morning, and another under the headline "How Independent Artists Are Earning $10K+
  // Monthly on BeatFlow", which had been removed hours earlier for inventing an artist
  // and her income. An admin screen describing articles that do not exist is worse than
  // no screen: it is the one a person would check before deciding the blog is fine.
  useEffect(() => {
    setPosts(BLOG_POSTS.map((post) => ({
      ...post,
      publishDate: asDate(post),
      // Everything here is published. The draft/published split this panel used to show
      // came from the fixture, and nothing in the data has ever carried a status.
      status: 'published'
    })));
  }, []);

  const handleEdit = (post) => {
    setSelectedPost(post);
    setEditedContent({
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      keywords: post.keywords.join(', '),
      readTime: post.readTime
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    // In production, update Firestore
    const updatedPosts = posts.map(p =>
      p.id === selectedPost.id
        ? {
            ...p,
            title: editedContent.title,
            excerpt: editedContent.excerpt,
            category: editedContent.category,
            keywords: editedContent.keywords.split(',').map(k => k.trim()),
            readTime: editedContent.readTime
          }
        : p
    );
    setPosts(updatedPosts);
    setEditDialogOpen(false);
  };

  const handlePublish = (postId) => {
    const updatedPosts = posts.map(p =>
      p.id === postId
        ? { ...p, status: 'published', publishDate: new Date() }
        : p
    );
    setPosts(updatedPosts);
  };

  const handleUnpublish = (postId) => {
    const updatedPosts = posts.map(p =>
      p.id === postId ? { ...p, status: 'draft', publishDate: null } : p
    );
    setPosts(updatedPosts);
  };

  const handleDelete = async (postId) => {
    const confirmed = await showConfirm('Delete Blog Post', 'Are you sure you want to delete this blog post?', 'warning');
    if (confirmed) {
      setPosts(posts.filter(p => p.id !== postId));
    }
  };

  const handlePreview = (post) => {
    window.open(`/blog/${post.slug}`, '_blank');
  };

  const publishedCount = posts.filter(p => p.status === 'published').length;
  const draftCount = posts.filter(p => p.status === 'draft').length;
  // TOTAL VIEWS AND SHARES ARE GONE. They summed p.views and p.shares, which were
  // literals in the fixture -- 2,847 and 1,523 views, 156 and 89 shares -- and rendered
  // as "4,370 Total Views" and "245 Social Shares" on a platform whose blog records no
  // analytics event of any kind. Percy, twice: "is this real data?" / "are these number
  // real?"
  //
  // Not replaced with 0: zero claims a measurement nobody took. See OPS-4SEC4.

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Blog Content Manager
        </Typography>
        <Chip
          label={`${publishedCount} Published / ${draftCount} Draft`}
          color={publishedCount >= 20 ? 'success' : 'default'}
        />
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(29, 185, 84, 0.1)', border: '1px solid rgba(29, 185, 84, 0.3)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Article sx={{ color: '#1DB954' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1DB954' }}>
                    {posts.length}/30
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Posts
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', border: '1px solid rgba(33, 150, 243, 0.3)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ color: '#2196f3' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                    {publishedCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Published
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* TWO CARDS REMOVED: "Total Views" and "Social Shares". Both summed literals
          * from the fixture this panel used to hold -- 2,847 and 1,523 views, 156 and
          * 89 shares -- rendering as "4,370 Total Views" and "245 Social Shares".
          * Nothing tracks a blog view or a share, so there is nothing to count, and a
          * dashboard number that cannot be traced to a stored fact is worse than no
          * number because it gets quoted. See OPS-4SEC4. */}
      </Grid>

      {/* Category Filter */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip label="All Posts" clickable />
        {categories.map(cat => (
          <Chip
            key={cat}
            label={cat}
            clickable
            variant="outlined"
          />
        ))}
      </Box>

      {/* Posts List */}
      <Card sx={{ bgcolor: 'background.default' }}>
        <CardContent>
          {posts.length === 0 ? (
            <Alert severity="info">
              <Typography variant="body2">
                No blog posts created yet. Use the Bulk Generator to create SEO-optimized blog content for all market segments.
              </Typography>
            </Alert>
          ) : (
            <List>
              {posts.map((post, index) => (
                <Box key={post.id}>
                  {index > 0 && <Divider sx={{ my: 1 }} />}
                  <ListItem
                    sx={{
                      bgcolor: post.status === 'published' ? 'rgba(29, 185, 84, 0.05)' : 'rgba(255, 152, 0, 0.05)',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: post.status === 'published' ? 'rgba(29, 185, 84, 0.3)' : 'rgba(255, 152, 0, 0.3)',
                      flexDirection: 'column',
                      alignItems: 'flex-start'
                    }}
                  >
                    <Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}>
                      <ListItemIcon>
                        {post.status === 'published' ? (
                          <CheckCircle sx={{ color: '#1DB954' }} />
                        ) : (
                          <PendingActions sx={{ color: '#ff9800' }} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {post.title}
                            </Typography>
                            <Chip
                              label={post.category}
                              size="small"
                              sx={{ bgcolor: '#1DB954', color: 'white' }}
                            />
                            <Chip
                              label={post.status.toUpperCase()}
                              size="small"
                              color={post.status === 'published' ? 'success' : 'warning'}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {post.excerpt}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                              <Typography variant="caption" color="text.secondary">
                                <Schedule fontSize="inherit" /> {post.readTime} read
                              </Typography>
                              {post.publishDate && (
                                <Typography variant="caption" color="text.secondary">
                                  Published: {post.publishDate.toLocaleDateString()}
                                </Typography>
                              )}
                              {/* Per-post Views and Shares removed with the totals above.
                                * They read post.views and post.shares, which were literals
                                * in the fixture and are not in the canonical list because
                                * nothing measures them. This line is what crashed the
                                * panel when the data went -- the consumer outlived the
                                * field, for the SECOND time in two days. See OPS-4SEC4. */}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                              {post.keywords.map((keyword, i) => (
                                <Chip
                                  key={i}
                                  label={keyword}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              ))}
                            </Box>
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                        <IconButton
                          size="small"
                          onClick={() => handlePreview(post)}
                          title="Preview"
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(post)}
                          title="Edit"
                        >
                          <Edit />
                        </IconButton>
                        {post.status === 'draft' ? (
                          <IconButton
                            size="small"
                            onClick={() => handlePublish(post.id)}
                            title="Publish"
                            sx={{ color: '#1DB954' }}
                          >
                            <Publish />
                          </IconButton>
                        ) : (
                          <IconButton
                            size="small"
                            onClick={() => handleUnpublish(post.id)}
                            title="Unpublish"
                            sx={{ color: '#ff9800' }}
                          >
                            <PendingActions />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(post.id)}
                          title="Delete"
                          sx={{ color: '#f44336' }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edit Blog Post
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={editedContent.title || ''}
              onChange={(e) => setEditedContent({ ...editedContent, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={editedContent.category || ''}
                label="Category"
                onChange={(e) => setEditedContent({ ...editedContent, category: e.target.value })}
              >
                {categories.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Excerpt"
              value={editedContent.excerpt || ''}
              onChange={(e) => setEditedContent({ ...editedContent, excerpt: e.target.value })}
              multiline
              rows={3}
              sx={{ mb: 2 }}
              helperText="Brief summary shown in blog listings and meta description"
            />
            <TextField
              fullWidth
              label="Keywords (comma-separated)"
              value={editedContent.keywords || ''}
              onChange={(e) => setEditedContent({ ...editedContent, keywords: e.target.value })}
              multiline
              rows={2}
              sx={{ mb: 2 }}
              helperText="SEO keywords for this blog post"
            />
            <TextField
              fullWidth
              label="Read Time"
              value={editedContent.readTime || ''}
              onChange={(e) => setEditedContent({ ...editedContent, readTime: e.target.value })}
              placeholder="e.g., 5 min"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Blog SEO Best Practices */}
      <Card sx={{ bgcolor: 'rgba(33, 150, 243, 0.05)', mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Blog SEO Best Practices
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Content Structure
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ✓ H1 title with primary keyword<br />
                ✓ H2/H3 subheadings every 300 words<br />
                ✓ Featured image with alt text<br />
                ✓ Internal links to landing pages<br />
                ✓ 1500-2500 word count minimum
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Engagement Elements
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ✓ Success stories & case studies<br />
                ✓ Data-driven insights & statistics<br />
                ✓ Actionable tips & how-tos<br />
                ✓ Embedded videos or audio players<br />
                ✓ Social sharing buttons
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                SEO Optimization
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ✓ Meta title 50-60 characters<br />
                ✓ Meta description 150-160 chars<br />
                ✓ Schema markup (Article type)<br />
                ✓ Open Graph tags for social<br />
                ✓ XML sitemap inclusion
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
