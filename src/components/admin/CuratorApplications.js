// src/components/admin/CuratorApplications.js
// Admin component to review curator applications and manage curators
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
  Alert,
  Tabs,
  Tab,
  MenuItem,
  Menu,
  ListItemIcon,
  ListItemText,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  MoreVert,
  Block,
  PlayArrow,
  RemoveCircle
} from '@mui/icons-material';
import { db } from '../../firebaseConfig';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export default function CuratorApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [curators, setCurators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedCurator, setSelectedCurator] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [actionType, setActionType] = useState(''); // 'suspend', 'revoke', or 'reactivate'
  const [actionReason, setActionReason] = useState('');
  const [confirmAction, setConfirmAction] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

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

      // Update selectedApp if it's currently being viewed
      // This prevents stale state when another admin makes changes
      if (selectedApp) {
        const updatedApp = apps.find(app => app.id === selectedApp.id);
        if (updatedApp) {
          setSelectedApp(updatedApp);
        }
      }
    });

    return () => unsubscribe();
  }, [selectedApp]); // Add selectedApp as dependency

  // Load curators
  useEffect(() => {
    const curatorsQuery = query(
      collection(db, 'curators'),
      orderBy('approvedAt', 'desc')
    );

    const unsubscribe = onSnapshot(curatorsQuery, (snapshot) => {
      const curatorsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCurators(curatorsList);
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
      // Use transaction to ensure atomicity and prevent race conditions
      await runTransaction(db, async (transaction) => {
        const applicationRef = doc(db, 'curatorApplications', selectedApp.id);
        const userRef = doc(db, 'users', selectedApp.userId);
        const curatorRef = doc(db, 'curators', selectedApp.userId);

        // Read current application state
        const applicationDoc = await transaction.get(applicationRef);

        if (!applicationDoc.exists()) {
          throw new Error('Application not found');
        }

        const currentStatus = applicationDoc.data().status;

        // Prevent duplicate approval (optimistic locking)
        if (currentStatus !== 'pending') {
          throw new Error(`Application already ${currentStatus}`);
        }

        // Read user document
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error('User not found');
        }

        // Check if curator profile already exists
        const curatorDoc = await transaction.get(curatorRef);
        if (curatorDoc.exists()) {
          throw new Error('Curator profile already exists');
        }

        // All checks passed - perform atomic writes
        // 1. Update user role FIRST (before status change)
        transaction.update(userRef, {
          role: 'curator'
        });

        // 2. Create curator profile SECOND
        transaction.set(curatorRef, {
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

        // 3. Update application status LAST (triggers email)
        transaction.update(applicationRef, {
          status: 'approved',
          reviewedAt: serverTimestamp(),
          reviewedBy: user.uid,
          notes: reviewNotes
        });
      });

      toast.success('Curator application approved!');
      setDialogOpen(false);
      setSelectedApp(null);
    } catch (error) {
      console.error('Error approving application:', error);

      // User-friendly error messages
      if (error.message.includes('already approved')) {
        toast.error('This application has already been approved by another admin');
      } else if (error.message.includes('already rejected')) {
        toast.error('This application has already been rejected');
      } else if (error.message.includes('already exists')) {
        toast.error('This user is already a curator');
      } else {
        toast.error('Failed to approve application: ' + error.message);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;

    setProcessing(true);
    try {
      // Use transaction to prevent race conditions
      await runTransaction(db, async (transaction) => {
        const applicationRef = doc(db, 'curatorApplications', selectedApp.id);

        // Read current application state
        const applicationDoc = await transaction.get(applicationRef);

        if (!applicationDoc.exists()) {
          throw new Error('Application not found');
        }

        const currentStatus = applicationDoc.data().status;

        // Prevent duplicate rejection (optimistic locking)
        if (currentStatus !== 'pending') {
          throw new Error(`Application already ${currentStatus}`);
        }

        // Update application status (triggers rejection email)
        transaction.update(applicationRef, {
          status: 'rejected',
          reviewedAt: serverTimestamp(),
          reviewedBy: user.uid,
          notes: reviewNotes
        });
      });

      toast.success('Application rejected');
      setDialogOpen(false);
      setSelectedApp(null);
    } catch (error) {
      console.error('Error rejecting application:', error);

      // User-friendly error messages
      if (error.message.includes('already approved')) {
        toast.error('This application has already been approved by another admin');
      } else if (error.message.includes('already rejected')) {
        toast.error('This application has already been rejected');
      } else {
        toast.error('Failed to reject application: ' + error.message);
      }
    } finally {
      setProcessing(false);
    }
  };

  // Handle curator actions
  const handleCuratorAction = (curator, action) => {
    setSelectedCurator(curator);
    setActionType(action);
    setActionReason('');
    setConfirmAction(false);
    setActionDialogOpen(true);
    setAnchorEl(null);
  };

  const handleExecuteAction = async () => {
    if (!selectedCurator || !actionType || !actionReason.trim()) {
      toast.error('Please provide a reason for this action');
      return;
    }

    if (!confirmAction) {
      toast.error('Please confirm this action');
      return;
    }

    setProcessing(true);
    try {
      await runTransaction(db, async (transaction) => {
        const curatorRef = doc(db, 'curators', selectedCurator.id);
        const userRef = doc(db, 'users', selectedCurator.id);

        const curatorDoc = await transaction.get(curatorRef);
        if (!curatorDoc.exists) {
          throw new Error('Curator profile not found');
        }

        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw new Error('User not found');
        }

        if (actionType === 'revoke') {
          // Revoke: Remove curator role and mark as revoked
          transaction.update(userRef, {
            role: 'listener',
            previousRole: 'curator'
          });

          transaction.update(curatorRef, {
            status: 'revoked',
            revokedAt: serverTimestamp(),
            revokedBy: user.uid,
            revocationReason: actionReason
          });
        } else if (actionType === 'suspend') {
          // Suspend: Keep role but mark as suspended
          transaction.update(curatorRef, {
            status: 'suspended',
            suspendedAt: serverTimestamp(),
            suspendedBy: user.uid,
            suspensionReason: actionReason
          });
        } else if (actionType === 'reactivate') {
          // Reactivate: Restore to active status
          const previousRole = userDoc.data().previousRole;
          if (previousRole === 'curator') {
            transaction.update(userRef, {
              role: 'curator'
            });
          }

          transaction.update(curatorRef, {
            status: 'active',
            reactivatedAt: serverTimestamp(),
            reactivatedBy: user.uid,
            reactivationNotes: actionReason
          });
        }
      });

      const actionLabel = actionType === 'revoke' ? 'revoked' : actionType === 'suspend' ? 'suspended' : 'reactivated';
      toast.success(`Curator ${actionLabel} successfully`);
      setActionDialogOpen(false);
      setSelectedCurator(null);
    } catch (error) {
      console.error(`Error ${actionType}ing curator:`, error);
      toast.error(`Failed to ${actionType} curator: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const getCuratorStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'warning';
      case 'revoked': return 'error';
      default: return 'default';
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
  const activeCurators = curators.filter(c => c.status === 'active').length;
  const suspendedCurators = curators.filter(c => c.status === 'suspended').length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Curator Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review applications and manage active curators
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          {pendingCount > 0 && (
            <Alert severity="info" sx={{ flex: 1 }}>
              {pendingCount} pending application{pendingCount > 1 ? 's' : ''} awaiting review
            </Alert>
          )}
          <Alert severity="success" sx={{ flex: 1 }}>
            {activeCurators} active curator{activeCurators !== 1 ? 's' : ''}
          </Alert>
          {suspendedCurators > 0 && (
            <Alert severity="warning" sx={{ flex: 1 }}>
              {suspendedCurators} suspended curator{suspendedCurators !== 1 ? 's' : ''}
            </Alert>
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label={`Applications (${applications.length})`} />
          <Tab label={`Active Curators (${curators.length})`} />
        </Tabs>
      </Box>

      {/* Applications Table */}
      {currentTab === 0 && (
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
      )}

      {/* Curators Table */}
      {currentTab === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Curator Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Genres</TableCell>
                <TableCell>Total Earnings</TableCell>
                <TableCell>Approved Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : curators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No curators yet
                  </TableCell>
                </TableRow>
              ) : (
                curators.map((curator) => (
                  <TableRow key={curator.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {curator.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {curator.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {curator.genres?.slice(0, 2).map((genre, idx) => (
                          <Chip key={idx} label={genre} size="small" />
                        ))}
                        {curator.genres?.length > 2 && (
                          <Chip label={`+${curator.genres.length - 2}`} size="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        ${curator.totalEarnings?.toFixed(2) || '0.00'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(curator.approvedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={curator.status}
                        color={getCuratorStatusColor(curator.status)}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setSelectedCurator(curator);
                          setAnchorEl(e.currentTarget);
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Curator Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {selectedCurator?.status === 'active' && (
          <>
            <MenuItem onClick={() => handleCuratorAction(selectedCurator, 'suspend')}>
              <ListItemIcon>
                <Block color="warning" />
              </ListItemIcon>
              <ListItemText>Suspend Curator</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleCuratorAction(selectedCurator, 'revoke')}>
              <ListItemIcon>
                <RemoveCircle color="error" />
              </ListItemIcon>
              <ListItemText>Revoke Curator Access</ListItemText>
            </MenuItem>
          </>
        )}
        {(selectedCurator?.status === 'suspended' || selectedCurator?.status === 'revoked') && (
          <MenuItem onClick={() => handleCuratorAction(selectedCurator, 'reactivate')}>
            <ListItemIcon>
              <PlayArrow color="success" />
            </ListItemIcon>
            <ListItemText>Reactivate Curator</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Curator Action Dialog */}
      <Dialog
        open={actionDialogOpen}
        onClose={() => !processing && setActionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionType === 'suspend' && 'Suspend Curator'}
          {actionType === 'revoke' && 'Revoke Curator Access'}
          {actionType === 'reactivate' && 'Reactivate Curator'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity={actionType === 'revoke' ? 'error' : actionType === 'suspend' ? 'warning' : 'info'} sx={{ mb: 3 }}>
              {actionType === 'revoke' && (
                <>
                  <strong>Warning:</strong> Revoking curator access will immediately remove their curator role and prevent them from accessing the curator portal. This action can be reversed, but they will need to reapply.
                </>
              )}
              {actionType === 'suspend' && (
                <>
                  <strong>Temporary Action:</strong> Suspending will temporarily disable curator features while keeping their role intact. They can be reactivated later.
                </>
              )}
              {actionType === 'reactivate' && (
                <>
                  <strong>Restore Access:</strong> This will restore full curator access and privileges.
                </>
              )}
            </Alert>

            <Typography variant="subtitle2" gutterBottom>
              Curator: {selectedCurator?.name} ({selectedCurator?.email})
            </Typography>

            <TextField
              fullWidth
              required
              multiline
              rows={4}
              label={`Reason for ${actionType === 'revoke' ? 'Revocation' : actionType === 'suspend' ? 'Suspension' : 'Reactivation'}`}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Provide a detailed reason for this action..."
              sx={{ mt: 2, mb: 2 }}
              error={!actionReason.trim()}
              helperText={!actionReason.trim() ? 'Reason is required' : ''}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={confirmAction}
                  onChange={(e) => setConfirmAction(e.target.checked)}
                />
              }
              label={`I confirm that I want to ${actionType} this curator`}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setActionDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleExecuteAction}
            disabled={processing || !actionReason.trim() || !confirmAction}
            variant="contained"
            color={actionType === 'revoke' ? 'error' : actionType === 'suspend' ? 'warning' : 'success'}
          >
            {processing ? 'Processing...' : `Confirm ${actionType === 'revoke' ? 'Revocation' : actionType === 'suspend' ? 'Suspension' : 'Reactivation'}`}
          </Button>
        </DialogActions>
      </Dialog>

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
              {/* Show alert if status changed while viewing */}
              {selectedApp.status !== 'pending' && (
                <Alert
                  severity={selectedApp.status === 'approved' ? 'success' : 'error'}
                  sx={{ mb: 3 }}
                >
                  <strong>Status Changed:</strong> This application has been {selectedApp.status} by {selectedApp.reviewedBy ? 'another admin' : 'someone else'}.
                </Alert>
              )}
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
