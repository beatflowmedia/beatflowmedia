import Schedule from '@mui/icons-material/Schedule';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Cancel from '@mui/icons-material/Cancel';
import Inbox from '@mui/icons-material/Inbox';
import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';
import Star from '@mui/icons-material/Star';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Search from '@mui/icons-material/Search';
import { getDocs } from 'firebase/firestore';
import { useState, useEffect, useCallback } from "react";
import RequestPayout from '../components/RequestPayout';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Rating from '@mui/material/Rating';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Badge from '@mui/material/Badge';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import Fade from '@mui/material/Fade';
import Slide from '@mui/material/Slide';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import MusicNote from '@mui/icons-material/MusicNote';
import Person from '@mui/icons-material/Person';
import CalendarToday from '@mui/icons-material/CalendarToday';
import AccessTime from '@mui/icons-material/AccessTime';
import ThumbUp from '@mui/icons-material/ThumbUp';
import ThumbDown from '@mui/icons-material/ThumbDown';
import Comment from '@mui/icons-material/Comment';
import Send from '@mui/icons-material/Send';
import AttachMoney from '@mui/icons-material/AttachMoney';
import Analytics from '@mui/icons-material/Analytics';
import Dashboard from '@mui/icons-material/Dashboard';
import Notifications from '@mui/icons-material/Notifications';
import TrendingUp from '@mui/icons-material/TrendingUp';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  addDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { toast } from 'react-toastify';

const SUBMISSION_STATUSES = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REQUIRES_CHANGES: 'requires_changes'
};

const FILTER_OPTIONS = {
  all: 'All Submissions',
  pending: 'Pending Review',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  requires_changes: 'Requires Changes'
};

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Priority', value: 'priority' },
  { label: 'Artist Name', value: 'artist' },
  { label: 'Track Title', value: 'title' }
];

export default function CuratorInbox() {
  const { user, role } = useAuth();
  const { state, dispatch, actions } = usePlayer();
  const navigate = useNavigate();

  // State management
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [curatorStats, setCuratorStats] = useState({
    totalSubmissions: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    walletBalance: 0,
    thisWeekEarnings: 0
  });
  const [loading, setLoading] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Modal states
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Form states
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    feedback: '',
    tags: [],
    marketingNotes: ''
  });
  const [isPlaying, setIsPlaying] = useState(false);

  // Check role and redirect if not curator
  useEffect(() => {
    if (role && role !== 'curator') {
      navigate('/become-curator');
    }
  }, [role, navigate]);

  // Load submissions and curator data
  useEffect(() => {
    if (!user) return;
    if (role && role !== 'curator') return; // Don't load data for non-curators

    setLoading(true);

    // Load submissions assigned to this curator
    const submissionsQuery = query(
      collection(db, 'curatorSubmissions'),
      where('assignedCurator', '==', user.uid),
      orderBy('submittedAt', 'desc')
    );

    const unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
      const submissionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubmissions(submissionsData);
      calculateStats(submissionsData);
      setLoading(false);
    });

    // Load curator profile and earnings
    const curatorRef = doc(db, 'curators', user.uid);
    const unsubscribeCurator = onSnapshot(curatorRef, (doc) => {
      if (doc.exists()) {
        const curatorData = doc.data();
        setCuratorStats(prev => ({
          ...prev,
          walletBalance: curatorData.walletBalance || 0,
          thisWeekEarnings: curatorData.thisWeekEarnings || 0
        }));
      }
    });

    return () => {
      unsubscribeSubmissions();
      unsubscribeCurator();
    };
  }, [user]);

  // Calculate submission statistics
  const calculateStats = useCallback((submissionsData) => {
    const stats = {
      totalSubmissions: submissionsData.length,
      pendingCount: submissionsData.filter(s => s.status === SUBMISSION_STATUSES.PENDING).length,
      approvedCount: submissionsData.filter(s => s.status === SUBMISSION_STATUSES.APPROVED).length,
      rejectedCount: submissionsData.filter(s => s.status === SUBMISSION_STATUSES.REJECTED).length
    };
    setCuratorStats(prev => ({ ...prev, ...stats }));
  }, []);

  // Filter and sort submissions
  useEffect(() => {
    let filtered = submissions;

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => s.status === filterStatus);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.trackTitle?.toLowerCase().includes(query) ||
        s.artistName?.toLowerCase().includes(query) ||
        s.genre?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);
        case 'oldest':
          return new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0);
        case 'priority':
          return (b.priority || 0) - (a.priority || 0);
        case 'artist':
          return (a.artistName || '').localeCompare(b.artistName || '');
        case 'title':
          return (a.trackTitle || '').localeCompare(b.trackTitle || '');
        default:
          return 0;
      }
    });

    setFilteredSubmissions(filtered);
  }, [submissions, filterStatus, searchQuery, sortBy]);

  // Enhanced submission handling
  const handleSubmissionAction = useCallback(async (submissionId, action, data = {}) => {
    if (!user) return;

    try {
      const submissionRef = doc(db, 'curatorSubmissions', submissionId);
      const submission = submissions.find(s => s.id === submissionId);

      if (!submission) return;

      let updateData = {
        status: action,
        reviewedAt: serverTimestamp(),
        reviewedBy: user.uid,
        curatorFeedback: data.feedback || '',
        curatorRating: data.rating || null
      };

      switch (action) {
        case SUBMISSION_STATUSES.APPROVED:
          updateData = {
            ...updateData,
            approvedAt: serverTimestamp(),
            playlistQueue: data.playlistQueue || 'main'
          };

          // Add to approved tracks collection
          await setDoc(doc(db, 'approvedTracks', submissionId), {
            submissionId,
            trackId: submission.trackId,
            trackTitle: submission.trackTitle,
            artistName: submission.artistName,
            artistId: submission.artistId,
            curatorId: user.uid,
            genre: submission.genre,
            approvedAt: serverTimestamp(),
            playlistQueue: data.playlistQueue || 'main'
          });

          // Award curator earnings
          await awardCuratorEarnings(submissionId, submission, 'approval');
          break;

        case SUBMISSION_STATUSES.REJECTED:
          updateData.rejectionReason = data.rejectionReason || '';
          break;

        case SUBMISSION_STATUSES.REQUIRES_CHANGES:
          updateData.requiredChanges = data.requiredChanges || '';
          break;
      }

      await updateDoc(submissionRef, updateData);

      // Send notification to artist
      await sendNotificationToArtist(submission.artistId, {
        type: 'submission_update',
        submissionId,
        status: action,
        curatorName: user.displayName,
        trackTitle: submission.trackTitle
      });

      toast.success(`Submission ${action.replace('_', ' ')}`);
      setReviewDialogOpen(false);
      setSelectedSubmission(null);

    } catch (error) {
      console.error('Error handling submission:', error);
      toast.error('Failed to process submission');
    }
  }, [user, submissions]);

  const awardCuratorEarnings = async (submissionId, submission, type) => {
    try {
      const earningAmount = type === 'approval' ? 5 : 0; // $5 per approval

      // Update curator balance
      const curatorRef = doc(db, 'curators', user.uid);
      await updateDoc(curatorRef, {
        walletBalance: increment(earningAmount),
        thisWeekEarnings: increment(earningAmount),
        totalEarnings: increment(earningAmount)
      });

      // Create earnings ledger entry
      await addDoc(collection(db, 'curatorEarnings'), {
        curatorId: user.uid,
        submissionId,
        trackId: submission.trackId,
        trackTitle: submission.trackTitle,
        artistName: submission.artistName,
        amount: earningAmount,
        type,
        earnedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error awarding earnings:', error);
    }
  };

  const sendNotificationToArtist = async (artistId, notificationData) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: artistId,
        ...notificationData,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const handlePreviewTrack = useCallback((submission) => {
    setSelectedSubmission(submission);
    setPreviewDialogOpen(true);
  }, []);

  const handleStartReview = useCallback((submission) => {
    setSelectedSubmission(submission);
    setReviewForm({
      rating: 0,
      feedback: '',
      tags: [],
      marketingNotes: ''
    });
    setReviewDialogOpen(true);
  }, []);

  const handleQuickAction = useCallback(async (submissionId, action) => {
    await handleSubmissionAction(submissionId, action);
  }, [handleSubmissionAction]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case SUBMISSION_STATUSES.PENDING: return 'warning';
      case SUBMISSION_STATUSES.UNDER_REVIEW: return 'info';
      case SUBMISSION_STATUSES.APPROVED: return 'success';
      case SUBMISSION_STATUSES.REJECTED: return 'error';
      case SUBMISSION_STATUSES.REQUIRES_CHANGES: return 'secondary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case SUBMISSION_STATUSES.PENDING: return <Schedule />;
      case SUBMISSION_STATUSES.UNDER_REVIEW: return <Analytics />;
      case SUBMISSION_STATUSES.APPROVED: return <CheckCircle />;
      case SUBMISSION_STATUSES.REJECTED: return <Cancel />;
      case SUBMISSION_STATUSES.REQUIRES_CHANGES: return <Comment />;
      default: return <Inbox />;
    }
  };

  // Show loading for non-curators while redirecting
  if (role && role !== 'curator') {
    return null;
  }

  if (!user) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.900', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h5" color="white">Please sign in to access the Curator Inbox</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>Curator Dashboard</Typography>
        <Grid container spacing={3}>
          {[...Array(4)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
        </Grid>
        <Box sx={{ mt: 4 }}>
          {[...Array(6)].map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={80} sx={{ mb: 2 }} />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.900', color: 'white', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 'bold',
            mb: 1,
            background: 'linear-gradient(45deg, #1DB954, #1ed760)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Curator Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: 'grey.400' }}>
          Review and manage artist submissions
        </Typography>
      </Box>

      {/* Payout Request UI */}
      <Box sx={{ mb: 4 }}>
        {/* Import RequestPayout at the top of the file if not already */}
        {/* Show payout request UI above stats cards for visibility */}
        <RequestPayout walletBalance={curatorStats.walletBalance} />
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'grey.800', border: '1px solid', borderColor: 'grey.700' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ color: '#1DB954', fontWeight: 'bold' }}>
                    {formatCurrency(curatorStats.walletBalance)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.400' }}>
                    Wallet Balance
                  </Typography>
                </Box>
                <AttachMoney sx={{ color: '#1DB954', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'grey.800', border: '1px solid', borderColor: 'grey.700' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {curatorStats.pendingCount}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.400' }}>
                    Pending Review
                  </Typography>
                </Box>
                <Schedule sx={{ color: 'orange', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'grey.800', border: '1px solid', borderColor: 'grey.700' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {curatorStats.approvedCount}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.400' }}>
                    Approved This Week
                  </Typography>
                </Box>
                <CheckCircle sx={{ color: '#4caf50', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'grey.800', border: '1px solid', borderColor: 'grey.700' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ color: '#1DB954', fontWeight: 'bold' }}>
                    {formatCurrency(curatorStats.thisWeekEarnings)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.400' }}>
                    This Week's Earnings
                  </Typography>
                </Box>
                <TrendingUp sx={{ color: '#1DB954', fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search submissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{
              minWidth: 250,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'grey.600' },
                '&:hover fieldset': { borderColor: 'grey.500' },
                '&.Mui-focused fieldset': { borderColor: '#1DB954' }
              }
            }}
            InputProps={{
              startAdornment: <Search sx={{ color: 'grey.400', mr: 1 }} />
            }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: 'grey.400' }}>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
              sx={{
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.600' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.500' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1DB954' }
              }}
            >
              {Object.entries(FILTER_OPTIONS).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: 'grey.400' }}>Sort by</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Sort by"
              sx={{
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.600' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.500' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1DB954' }
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Submissions Table */}
      {filteredSubmissions.length > 0 ? (
        <TableContainer component={Paper} sx={{ bgcolor: 'grey.800' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { color: 'grey.400', borderColor: 'grey.700' } }}>
                <TableCell>Track</TableCell>
                <TableCell>Artist</TableCell>
                <TableCell>Genre</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow
                  key={submission.id}
                  sx={{
                    '&:hover': { bgcolor: 'grey.700' },
                    '& td': { borderColor: 'grey.700', color: 'white' }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        component="img"
                        src={submission.coverUrl || '/default-song-cover.jpg'}
                        alt={submission.trackTitle}
                        sx={{ width: 40, height: 40, borderRadius: 1 }}
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white' }}>
                          {submission.trackTitle}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'grey.400' }}>
                          {submission.duration ? `${Math.floor(submission.duration / 60)}:${(submission.duration % 60).toString().padStart(2, '0')}` : ''}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {submission.artistName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'grey.400' }}>
                      {submission.artistEmail}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={submission.genre}
                      size="small"
                      sx={{ bgcolor: 'grey.700', color: 'white' }}
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(submission.submittedAt)}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      icon={getStatusIcon(submission.status)}
                      label={submission.status?.replace('_', ' ') || 'pending'}
                      color={getStatusColor(submission.status)}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          sx={{
                            fontSize: 16,
                            color: i < (submission.priority || 1) ? '#ffd700' : 'grey.600'
                          }}
                        />
                      ))}
                    </Box>
                  </TableCell>

                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Preview Track">
                        <IconButton
                          size="small"
                          onClick={() => handlePreviewTrack(submission)}
                          sx={{ color: 'grey.400', '&:hover': { color: '#1DB954' } }}
                        >
                          <PlayArrow />
                        </IconButton>
                      </Tooltip>

                      {submission.status === SUBMISSION_STATUSES.PENDING && (
                        <>
                          <Tooltip title="Quick Approve">
                            <IconButton
                              size="small"
                              onClick={() => handleQuickAction(submission.id, SUBMISSION_STATUSES.APPROVED)}
                              sx={{ color: 'grey.400', '&:hover': { color: '#4caf50' } }}
                            >
                              <Check />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Quick Reject">
                            <IconButton
                              size="small"
                              onClick={() => handleQuickAction(submission.id, SUBMISSION_STATUSES.REJECTED)}
                              sx={{ color: 'grey.400', '&:hover': { color: '#f44336' } }}
                            >
                              <Close />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}

                      <Tooltip title="Detailed Review">
                        <IconButton
                          size="small"
                          onClick={() => handleStartReview(submission)}
                          sx={{ color: 'grey.400', '&:hover': { color: 'white' } }}
                        >
                          <Comment />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Inbox sx={{ fontSize: 64, color: 'grey.600', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'grey.400', mb: 1 }}>
            {searchQuery || filterStatus !== 'all'
              ? 'No submissions match your criteria'
              : 'No submissions to review'
            }
          </Typography>
          <Typography variant="body2" sx={{ color: 'grey.500' }}>
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your filters or search terms'
              : 'New submissions will appear here for review'
            }
          </Typography>
        </Box>
      )}

      {/* Review Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'grey.800', color: 'white' }
        }}
      >
        <DialogTitle>
          Detailed Review: {selectedSubmission?.trackTitle}
        </DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box
                    component="img"
                    src={selectedSubmission.coverUrl || '/default-song-cover.jpg'}
                    alt={selectedSubmission.trackTitle}
                    sx={{ width: '100%', borderRadius: 2, mb: 2 }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {selectedSubmission.trackTitle}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.400', mb: 2 }}>
                    by {selectedSubmission.artistName}
                  </Typography>

                  {/* Audio Player */}
                  {selectedSubmission.audioUrl && (
                    <Box sx={{ mt: 2 }}>
                      <audio
                        controls
                        style={{ width: '100%' }}
                        src={selectedSubmission.audioUrl}
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12} md={8}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Rate this submission
                    </Typography>
                    <Rating
                      value={reviewForm.rating}
                      onChange={(event, newValue) => {
                        setReviewForm(prev => ({ ...prev, rating: newValue }));
                      }}
                      size="large"
                      sx={{
                        '& .MuiRating-iconFilled': { color: '#1DB954' },
                        '& .MuiRating-iconEmpty': { color: 'grey.600' }
                      }}
                    />
                  </Box>

                  <TextField
                    fullWidth
                    label="Feedback for Artist"
                    value={reviewForm.feedback}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, feedback: e.target.value }))}
                    multiline
                    rows={4}
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: 'grey.600' },
                        '&:hover fieldset': { borderColor: 'grey.500' },
                        '&.Mui-focused fieldset': { borderColor: '#1DB954' }
                      },
                      '& .MuiInputLabel-root': { color: 'grey.400' }
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Marketing Notes (Internal)"
                    value={reviewForm.marketingNotes}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, marketingNotes: e.target.value }))}
                    multiline
                    rows={3}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: 'grey.600' },
                        '&:hover fieldset': { borderColor: 'grey.500' },
                        '&.Mui-focused fieldset': { borderColor: '#1DB954' }
                      },
                      '& .MuiInputLabel-root': { color: 'grey.400' }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)} sx={{ color: 'grey.400' }}>
            Cancel
          </Button>
          <Button
            onClick={() => handleSubmissionAction(selectedSubmission?.id, SUBMISSION_STATUSES.REJECTED, {
              feedback: reviewForm.feedback,
              rating: reviewForm.rating,
              rejectionReason: reviewForm.feedback
            })}
            variant="outlined"
            color="error"
            startIcon={<ThumbDown />}
          >
            Reject
          </Button>
          <Button
            onClick={() => handleSubmissionAction(selectedSubmission?.id, SUBMISSION_STATUSES.REQUIRES_CHANGES, {
              feedback: reviewForm.feedback,
              rating: reviewForm.rating,
              requiredChanges: reviewForm.feedback
            })}
            variant="outlined"
            sx={{ color: 'orange', borderColor: 'orange' }}
            startIcon={<Comment />}
          >
            Request Changes
          </Button>
          <Button
            onClick={() => handleSubmissionAction(selectedSubmission?.id, SUBMISSION_STATUSES.APPROVED, {
              feedback: reviewForm.feedback,
              rating: reviewForm.rating,
              marketingNotes: reviewForm.marketingNotes
            })}
            variant="contained"
            sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
            startIcon={<ThumbUp />}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}