import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../hooks/useModal';
import { curatorPaymentService } from '../services/curatorPaymentService';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { FaMusic, FaDollarSign, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export default function CuratorSubmissionInbox() {
  const { user } = useAuth();
  const { showAlert } = useModal();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending_review');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, [user, filterStatus]);

  const loadSubmissions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await curatorPaymentService.getCuratorSubmissions(
        user.uid,
        filterStatus === 'all' ? 'all' : filterStatus
      );
      setSubmissions(data);
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
    setLoading(false);
  };

  const handleAccept = async (submissionId) => {
    setActionLoading(true);
    try {
      await curatorPaymentService.acceptSubmission(user.uid, submissionId);
      await showAlert('Success', 'Submission accepted! Please add the track to your playlist within 7 days.', 'success');
      loadSubmissions();
    } catch (error) {
      console.error('Error accepting submission:', error);
      await showAlert('Error', error.message || 'Failed to accept submission', 'error');
    }
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!selectedSubmission || !rejectReason) {
      await showAlert('Info', 'Please provide a reason for rejection', 'info');
      return;
    }

    setActionLoading(true);
    try {
      await curatorPaymentService.rejectSubmission(user.uid, selectedSubmission.id, rejectReason);
      await showAlert('Success', 'Submission rejected. Artist will receive a full refund.', 'success');
      setRejectDialogOpen(false);
      setSelectedSubmission(null);
      setRejectReason('');
      loadSubmissions();
    } catch (error) {
      console.error('Error rejecting submission:', error);
      await showAlert('Error', error.message || 'Failed to reject submission', 'error');
    }
    setActionLoading(false);
  };

  const openRejectDialog = (submission) => {
    setSelectedSubmission(submission);
    setRejectDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_review':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'completed':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus) {
      case 'escrow_pending':
        return 'info';
      case 'escrow_accepted':
        return 'warning';
      case 'payment_complete':
        return 'success';
      case 'refunded':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>
          Submission Inbox
        </Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel sx={{ color: '#b3b3b3' }}>Filter by Status</InputLabel>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            sx={{
              color: '#fff',
              '.MuiOutlinedInput-notchedOutline': { borderColor: '#404040' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1db954' }
            }}
          >
            <MenuItem value="all">All Submissions</MenuItem>
            <MenuItem value="pending_review">Pending Review</MenuItem>
            <MenuItem value="accepted">Accepted</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {submissions.length === 0 ? (
        <Card sx={{ bgcolor: '#181818', textAlign: 'center', p: 4 }}>
          <Typography variant="h6" sx={{ color: '#b3b3b3' }}>
            No submissions found
          </Typography>
          <Typography variant="body2" sx={{ color: '#808080', mt: 1 }}>
            {filterStatus === 'pending_review'
              ? 'You have no pending submissions to review'
              : 'Try changing the filter'}
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {submissions.map((submission) => (
            <Grid item xs={12} key={submission.id}>
              <Card sx={{ bgcolor: '#181818', color: '#fff' }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    {/* Track Info */}
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FaMusic size={24} color="#1db954" />
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {submission.trackTitle}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                            {submission.trackArtist}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#808080' }}>
                            For: {submission.playlistName}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Budget & Status */}
                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <FaDollarSign color="#1db954" />
                        <Typography variant="h6" sx={{ color: '#1db954', fontWeight: 'bold' }}>
                          ${submission.submissionBudget}
                        </Typography>
                      </Box>
                      <Chip
                        label={submission.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(submission.status)}
                        size="small"
                        sx={{ mb: 0.5 }}
                      />
                      <br />
                      <Chip
                        label={submission.paymentStatus?.replace('_', ' ').toUpperCase() || 'PENDING'}
                        color={getPaymentStatusColor(submission.paymentStatus)}
                        size="small"
                        variant="outlined"
                      />
                    </Grid>

                    {/* Submission Date */}
                    <Grid item xs={12} md={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FaClock color="#b3b3b3" />
                        <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                          {submission.submittedAt
                            ? new Date(submission.submittedAt).toLocaleDateString()
                            : 'N/A'}
                        </Typography>
                      </Box>
                      {submission.metadata?.trackGenre && (
                        <Typography variant="caption" sx={{ color: '#808080', display: 'block', mt: 1 }}>
                          Genre: {submission.metadata.trackGenre}
                        </Typography>
                      )}
                    </Grid>

                    {/* Actions */}
                    <Grid item xs={12} md={3}>
                      {submission.status === 'pending_review' && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<FaCheckCircle />}
                            onClick={() => handleAccept(submission.id)}
                            disabled={actionLoading}
                            sx={{
                              bgcolor: '#1db954',
                              '&:hover': { bgcolor: '#1ed760' },
                              flex: 1
                            }}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<FaTimesCircle />}
                            onClick={() => openRejectDialog(submission)}
                            disabled={actionLoading}
                            sx={{
                              borderColor: '#f44336',
                              color: '#f44336',
                              '&:hover': { borderColor: '#d32f2f', bgcolor: 'rgba(244, 67, 54, 0.1)' },
                              flex: 1
                            }}
                          >
                            Reject
                          </Button>
                        </Box>
                      )}
                      {submission.status === 'accepted' && (
                        <Typography variant="body2" sx={{ color: '#1db954' }}>
                          ✓ Accepted - Add track to playlist
                        </Typography>
                      )}
                      {submission.status === 'rejected' && submission.rejectionReason && (
                        <Typography variant="caption" sx={{ color: '#808080' }}>
                          Reason: {submission.rejectionReason}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => !actionLoading && setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#181818', color: '#fff' }}>
          Reject Submission
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#181818', mt: 2 }}>
          <Typography variant="body2" sx={{ color: '#b3b3b3', mb: 2 }}>
            Please provide a reason for rejecting this submission. The artist will be refunded automatically.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{
              '& .MuiInputBase-root': { color: '#fff' },
              '& .MuiInputLabel-root': { color: '#b3b3b3' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#404040' }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#181818', p: 2 }}>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={actionLoading} sx={{ color: '#b3b3b3' }}>
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            disabled={actionLoading || !rejectReason}
            variant="contained"
            sx={{ bgcolor: '#f44336', '&:hover': { bgcolor: '#d32f2f' } }}
          >
            {actionLoading ? 'Processing...' : 'Reject & Refund'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
