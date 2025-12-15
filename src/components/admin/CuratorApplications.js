// src/components/admin/CuratorApplications.js
// Admin component to review curator applications
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility
} from '@mui/icons-material';
import { db } from '../../firebaseConfig';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export default function CuratorApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Load applications
  useEffect(() => {
    const applicationsQuery = query(
      collection(db, 'curatorApplications'),
      orderBy('submittedAt', 'desc')
    );

    const unsubscribe = onSnapshot(applicationsQuery, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setApplications(apps);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleViewApplication = (app) => {
    setSelectedApp(app);
    setReviewNotes(app.notes || '');
    setDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedApp) return;

    setProcessing(true);
    try {
      // Update application status
      await updateDoc(doc(db, 'curatorApplications', selectedApp.id), {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewedBy: user.uid,
        notes: reviewNotes
      });

      // Update user role to curator
      await updateDoc(doc(db, 'users', selectedApp.userId), {
        role: 'curator'
      });

      // Create curator profile
      await setDoc(doc(db, 'curators', selectedApp.userId), {
        userId: selectedApp.userId,
        name: selectedApp.name,
        email: selectedApp.email,
        genres: selectedApp.genres,
        approvedAt: serverTimestamp(),
        walletBalance: 0,
        thisWeekEarnings: 0,
        totalEarnings: 0,
        status: 'active'
      });

      toast.success('Curator application approved!');
      setDialogOpen(false);
      setSelectedApp(null);
    } catch (error) {
      console.error('Error approving application:', error);
      toast.error('Failed to approve application');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;

    setProcessing(true);
    try {
      await updateDoc(doc(db, 'curatorApplications', selectedApp.id), {
        status: 'rejected',
        reviewedAt: serverTimestamp(),
        reviewedBy: user.uid,
        notes: reviewNotes
      });

      toast.success('Application rejected');
      setDialogOpen(false);
      setSelectedApp(null);
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error('Failed to reject application');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingCount = applications.filter(a => a.status === 'pending').length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Curator Applications
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review and approve curator applications
        </Typography>
        {pendingCount > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {pendingCount} pending application{pendingCount > 1 ? 's' : ''} awaiting review
          </Alert>
        )}
      </Box>

      {/* Applications Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Applicant</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Followers</TableCell>
              <TableCell>Experience</TableCell>
              <TableCell>Genres</TableCell>
              <TableCell>Submitted</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No applications yet
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {app.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {app.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {app.followerCount?.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {app.experienceLevel}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {app.genres?.slice(0, 2).map((genre, idx) => (
                        <Chip key={idx} label={genre} size="small" />
                      ))}
                      {app.genres?.length > 2 && (
                        <Chip label={`+${app.genres.length - 2}`} size="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(app.submittedAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={app.status}
                      color={getStatusColor(app.status)}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Review Application">
                      <IconButton
                        size="small"
                        onClick={() => handleViewApplication(app)}
                        color="primary"
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Review Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => !processing && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Review Curator Application
        </DialogTitle>
        <DialogContent>
          {selectedApp && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                {/* Left Column - Applicant Info */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Applicant Information
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Name:</strong> {selectedApp.name}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Email:</strong> {selectedApp.email}
                  </Typography>
                  {selectedApp.phone && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Phone:</strong> {selectedApp.phone}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Experience:</strong> {selectedApp.experienceLevel}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Followers:</strong> {selectedApp.followerCount?.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Availability:</strong> {selectedApp.availability || 'Not specified'}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                    Genres
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                    {selectedApp.genres?.map((genre, idx) => (
                      <Chip key={idx} label={genre} size="small" color="primary" />
                    ))}
                  </Box>

                  {selectedApp.proofScreenshotUrl && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Proof Screenshot
                      </Typography>
                      <Box
                        component="img"
                        src={selectedApp.proofScreenshotUrl}
                        alt="Follower proof"
                        sx={{
                          width: '100%',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(selectedApp.proofScreenshotUrl, '_blank')}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        Click to view full size
                      </Typography>
                    </Box>
                  )}
                </Grid>

                {/* Right Column - Details */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Playlist & Social Links
                    </Typography>

                    {selectedApp.playlistLink && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Main Playlist:
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          href={selectedApp.playlistLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ mb: 1 }}
                        >
                          Open Playlist →
                        </Button>
                      </Box>
                    )}

                    {selectedApp.spotifyProfileLink && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Spotify Profile:
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          href={selectedApp.spotifyProfileLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ mb: 1 }}
                        >
                          View Spotify →
                        </Button>
                      </Box>
                    )}

                    {selectedApp.instagramLink && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Instagram:
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          href={selectedApp.instagramLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ mb: 1 }}
                        >
                          View Instagram →
                        </Button>
                      </Box>
                    )}

                    {selectedApp.tiktokLink && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          TikTok:
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          href={selectedApp.tiktokLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ mb: 1 }}
                        >
                          View TikTok →
                        </Button>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Curator Experience
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedApp.curatorExperience}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Why BeatFlow Curator?
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedApp.whyCurator}
                    </Typography>
                  </Box>
                </Grid>

                {/* Review Notes */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Review Notes (optional)"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add any notes about this application..."
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={processing}
          >
            Close
          </Button>
          {selectedApp?.status === 'pending' && (
            <>
              <Button
                onClick={handleReject}
                disabled={processing}
                variant="outlined"
                color="error"
                startIcon={<Cancel />}
              >
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                disabled={processing}
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
              >
                {processing ? 'Processing...' : 'Approve & Set as Curator'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
