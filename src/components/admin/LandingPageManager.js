// src/components/admin/LandingPageManager.js
// Landing page content manager - view, edit, and publish generated pages
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
  Divider
} from '@mui/material';
import {
  Edit,
  Visibility,
  Delete,
  Publish,
  CheckCircle,
  PendingActions,
  Web,
  TrendingUp,
  People
} from '@mui/icons-material';
import { useModal } from '../../hooks/useModal';

export default function LandingPageManager() {
  const { showConfirm, showAlert } = useModal();
  const [pages, setPages] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [editedContent, setEditedContent] = useState({});

  // Load landing pages (in production, fetch from Firestore)
  useEffect(() => {
    // Simulated data - in production, fetch from Firestore marketing_content collection
    const mockPages = [
      {
        id: 'artists-landing',
        segment: 'Artists',
        title: 'Turn Your Music Into Income',
        slug: 'for-artists',
        status: 'draft',
        views: 0,
        conversions: 0,
        createdAt: new Date(),
        meta: {
          description: 'Upload your tracks, reach real listeners, and earn revenue from every stream.',
          keywords: ['music distribution', 'artist earnings', 'independent music']
        }
      },
      {
        id: 'listeners-landing',
        segment: 'Listeners',
        title: 'Discover Music That Moves You',
        slug: 'for-listeners',
        status: 'published',
        views: 1247,
        conversions: 89,
        createdAt: new Date(),
        meta: {
          description: 'Stream unlimited music, discover new artists, and support independent creators.',
          keywords: ['music streaming', 'discover music', 'new artists']
        }
      },
      {
        id: 'curators-landing',
        segment: 'Curators',
        title: 'Build Playlists, Earn Revenue',
        slug: 'for-curators',
        status: 'draft',
        views: 0,
        conversions: 0,
        createdAt: new Date(),
        meta: {
          description: 'Create curated playlists and earn money when listeners engage with your selections.',
          keywords: ['playlist curator', 'earn from playlists', 'music curation']
        }
      }
    ];
    setPages(mockPages);
  }, []);

  const handleEdit = (page) => {
    setSelectedPage(page);
    setEditedContent({
      title: page.title,
      description: page.meta.description,
      keywords: page.meta.keywords.join(', ')
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    // In production, update Firestore
    const updatedPages = pages.map(p =>
      p.id === selectedPage.id
        ? {
            ...p,
            title: editedContent.title,
            meta: {
              description: editedContent.description,
              keywords: editedContent.keywords.split(',').map(k => k.trim())
            }
          }
        : p
    );
    setPages(updatedPages);
    setEditDialogOpen(false);
  };

  const handlePublish = (pageId) => {
    const updatedPages = pages.map(p =>
      p.id === pageId ? { ...p, status: 'published' } : p
    );
    setPages(updatedPages);
  };

  const handleUnpublish = (pageId) => {
    const updatedPages = pages.map(p =>
      p.id === pageId ? { ...p, status: 'draft' } : p
    );
    setPages(updatedPages);
  };

  const handleDelete = async (pageId) => {
    const confirmed = await showConfirm('Confirm Delete', 'Are you sure you want to delete this landing page?', 'warning');
    if (confirmed) {
      setPages(pages.filter(p => p.id !== pageId));
    }
  };

  const handlePreview = (page) => {
    window.open(`/marketing/landing/${page.slug}`, '_blank');
  };

  const publishedCount = pages.filter(p => p.status === 'published').length;
  const draftCount = pages.filter(p => p.status === 'draft').length;
  const totalViews = pages.reduce((sum, p) => sum + p.views, 0);
  const totalConversions = pages.reduce((sum, p) => sum + p.conversions, 0);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Landing Page Manager
        </Typography>
        <Chip
          label={`${publishedCount} Published / ${draftCount} Draft`}
          color={publishedCount >= 30 ? 'success' : 'default'}
        />
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(29, 185, 84, 0.1)', border: '1px solid rgba(29, 185, 84, 0.3)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Web sx={{ color: '#1DB954' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1DB954' }}>
                    {pages.length}/30
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Pages
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

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)', border: '1px solid rgba(255, 152, 0, 0.3)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp sx={{ color: '#ff9800' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                    {totalViews.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Views
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(156, 39, 176, 0.1)', border: '1px solid rgba(156, 39, 176, 0.3)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <People sx={{ color: '#9c27b0' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                    {totalConversions}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Conversions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pages List */}
      <Card sx={{ bgcolor: 'background.default' }}>
        <CardContent>
          {pages.length === 0 ? (
            <Alert severity="info">
              <Typography variant="body2">
                No landing pages created yet. Use the Bulk Generator to create landing pages for all market segments.
              </Typography>
            </Alert>
          ) : (
            <List>
              {pages.map((page, index) => (
                <Box key={page.id}>
                  {index > 0 && <Divider sx={{ my: 1 }} />}
                  <ListItem
                    sx={{
                      bgcolor: page.status === 'published' ? 'rgba(29, 185, 84, 0.05)' : 'rgba(255, 152, 0, 0.05)',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: page.status === 'published' ? 'rgba(29, 185, 84, 0.3)' : 'rgba(255, 152, 0, 0.3)'
                    }}
                  >
                    <ListItemIcon>
                      {page.status === 'published' ? (
                        <CheckCircle sx={{ color: '#1DB954' }} />
                      ) : (
                        <PendingActions sx={{ color: '#ff9800' }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {page.title}
                          </Typography>
                          <Chip
                            label={page.segment}
                            size="small"
                            sx={{ bgcolor: '#1DB954', color: 'white' }}
                          />
                          <Chip
                            label={page.status.toUpperCase()}
                            size="small"
                            color={page.status === 'published' ? 'success' : 'warning'}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {page.meta.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Slug: /{page.slug}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Views: {page.views.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Conversions: {page.conversions}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handlePreview(page)}
                        title="Preview"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(page)}
                        title="Edit"
                      >
                        <Edit />
                      </IconButton>
                      {page.status === 'draft' ? (
                        <IconButton
                          size="small"
                          onClick={() => handlePublish(page.id)}
                          title="Publish"
                          sx={{ color: '#1DB954' }}
                        >
                          <Publish />
                        </IconButton>
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() => handleUnpublish(page.id)}
                          title="Unpublish"
                          sx={{ color: '#ff9800' }}
                        >
                          <PendingActions />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(page.id)}
                        title="Delete"
                        sx={{ color: '#f44336' }}
                      >
                        <Delete />
                      </IconButton>
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
          Edit Landing Page: {selectedPage?.segment}
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
            <TextField
              fullWidth
              label="Meta Description"
              value={editedContent.description || ''}
              onChange={(e) => setEditedContent({ ...editedContent, description: e.target.value })}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Keywords (comma-separated)"
              value={editedContent.keywords || ''}
              onChange={(e) => setEditedContent({ ...editedContent, keywords: e.target.value })}
              multiline
              rows={2}
              helperText="SEO keywords for this landing page"
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

      {/* SEO Best Practices Info */}
      <Card sx={{ bgcolor: 'rgba(33, 150, 243, 0.05)', mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Landing Page SEO Checklist
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                On-Page SEO
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ✓ Unique H1 title per page<br />
                ✓ Meta description 150-160 chars<br />
                ✓ Alt text for all images<br />
                ✓ Internal backlinks to other pages<br />
                ✓ Mobile-responsive design
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Content Strategy
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ✓ Success stories & testimonials<br />
                ✓ FOMO elements (urgency, scarcity)<br />
                ✓ Social proof (user counts, stats)<br />
                ✓ Clear CTAs above the fold<br />
                ✓ Value proposition in hero section
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Performance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ✓ WebP images for fast loading<br />
                ✓ Lazy loading below the fold<br />
                ✓ Critical CSS inlined<br />
                ✓ clamp() for responsive sizing<br />
                ✓ Lighthouse score 90+
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
