// src/pages/ProjectRegistration.js
// Project registration dashboard for locking in licenses
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  registerPublishedProject,
  getUserPublishedProjects,
  getUserLicenses
} from '../services/licenseService';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add,
  CheckCircle,
  YouTube,
  MusicNote,
  Delete,
  Info
} from '@mui/icons-material';

export default function ProjectRegistration() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  // New project form
  const [projectUrl, setProjectUrl] = useState('');
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [userProjects, userLicenses] = await Promise.all([
        getUserPublishedProjects(user.uid),
        getUserLicenses(user.uid)
      ]);

      setProjects(userProjects);
      setLicenses(userLicenses);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load your projects and licenses');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterProject = async () => {
    if (!projectUrl.trim()) {
      setError('Please enter a project URL');
      return;
    }

    if (selectedTracks.length === 0) {
      setError('Please select at least one track used in this project');
      return;
    }

    try {
      setRegistering(true);
      setError('');

      const subscriptionId = user.subscription?.id || 'unknown';

      await registerPublishedProject(
        user.uid,
        projectUrl,
        selectedTracks,
        subscriptionId
      );

      setSuccess('Project registered! This content is now licensed forever.');
      setProjectUrl('');
      setSelectedTracks([]);
      setShowAddDialog(false);

      // Reload projects
      await loadUserData();
    } catch (err) {
      console.error('Error registering project:', err);
      setError('Failed to register project. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'youtube':
        return <YouTube />;
      default:
        return <MusicNote />;
    }
  };

  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'youtube':
        return '#FF0000';
      case 'tiktok':
        return '#000000';
      case 'instagram':
        return '#E1306C';
      case 'spotify':
        return '#1DB954';
      default:
        return '#999';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#121212' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#121212', py: 8 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2, color: 'white' }}>
            My Published Projects
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Register your published content to lock in your music licenses forever.
            These projects stay licensed even after your subscription ends.
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>How it works:</strong> When you publish a video, podcast, or other content using BeatFlow music,
            register it here. This locks in your license for that specific project forever — even if you cancel your subscription later.
            You just can't use the same music in NEW projects after cancellation.
          </Alert>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowAddDialog(true)}
            sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
          >
            Register New Project
          </Button>
        </Box>

        {/* Success/Error Messages */}
        {success && (
          <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Projects List */}
        {projects.length === 0 ? (
          <Card sx={{ bgcolor: '#1e1e1e', p: 6, textAlign: 'center' }}>
            <Info sx={{ fontSize: 60, color: '#555', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No projects registered yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Register your published content to protect your licenses forever
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setShowAddDialog(true)}
              sx={{ borderColor: '#1DB954', color: '#1DB954' }}
            >
              Register Your First Project
            </Button>
          </Card>
        ) : (
          <Box sx={{ display: 'grid', gap: 3 }}>
            {projects.map((project) => (
              <Card key={project.id} sx={{ bgcolor: '#1e1e1e' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          borderRadius: 1,
                          bgcolor: getPlatformColor(project.platform),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}
                      >
                        {getPlatformIcon(project.platform)}
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ color: 'white', mb: 0.5 }}>
                          {project.platform.charAt(0).toUpperCase() + project.platform.slice(1)} Project
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Registered {project.registeredAt?.toDate().toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      icon={<CheckCircle />}
                      label="Licensed Forever"
                      sx={{ bgcolor: '#1DB954', color: 'white' }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Project URL:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#1DB954',
                        wordBreak: 'break-all',
                        fontFamily: 'monospace',
                        bgcolor: '#0a0a0a',
                        p: 1,
                        borderRadius: 1
                      }}
                    >
                      {project.projectUrl}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      Tracks used: {project.trackIds?.length || 0}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {project.trackIds?.slice(0, 5).map((trackId, idx) => (
                        <Chip
                          key={idx}
                          label={`Track ${trackId.slice(0, 8)}`}
                          size="small"
                          sx={{ bgcolor: '#2a2a2a' }}
                        />
                      ))}
                      {project.trackIds?.length > 5 && (
                        <Chip
                          label={`+${project.trackIds.length - 5} more`}
                          size="small"
                          sx={{ bgcolor: '#2a2a2a' }}
                        />
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* Add Project Dialog */}
        <Dialog
          open={showAddDialog}
          onClose={() => !registering && setShowAddDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ bgcolor: '#1e1e1e', color: 'white' }}>
            Register Published Project
          </DialogTitle>
          <DialogContent sx={{ bgcolor: '#1e1e1e', pt: 3 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Register content you've already published (YouTube video, podcast episode, etc.) to lock in your license forever.
            </Alert>

            <TextField
              fullWidth
              label="Project URL"
              placeholder="https://youtube.com/watch?v=..."
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              sx={{ mb: 3 }}
              helperText="Enter the URL where your content is published"
            />

            <Typography variant="subtitle2" sx={{ mb: 2, color: 'white' }}>
              Select tracks used in this project:
            </Typography>

            <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
              {licenses.length === 0 ? (
                <Alert severity="warning">
                  No tracks downloaded yet. Download tracks from the music library first.
                </Alert>
              ) : (
                licenses.map((license) => (
                  <Card
                    key={license.id}
                    sx={{
                      mb: 1,
                      bgcolor: selectedTracks.includes(license.trackId) ? '#1DB954' : '#2a2a2a',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => {
                      if (selectedTracks.includes(license.trackId)) {
                        setSelectedTracks(selectedTracks.filter(id => id !== license.trackId));
                      } else {
                        setSelectedTracks([...selectedTracks, license.trackId]);
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <MusicNote />
                        <Box>
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            Track ID: {license.trackId}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Downloaded: {license.downloadedAt?.toDate().toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>

            {selectedTracks.length > 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {selectedTracks.length} track{selectedTracks.length > 1 ? 's' : ''} selected
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ bgcolor: '#1e1e1e', p: 2 }}>
            <Button onClick={() => setShowAddDialog(false)} disabled={registering}>
              Cancel
            </Button>
            <Button
              onClick={handleRegisterProject}
              variant="contained"
              disabled={registering || !projectUrl || selectedTracks.length === 0}
              sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
            >
              {registering ? <CircularProgress size={24} /> : 'Register Project'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
