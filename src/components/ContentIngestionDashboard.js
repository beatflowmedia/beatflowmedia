// src/components/ContentIngestionDashboard.js
// Admin dashboard for managing content ingestion workflow
import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
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
  IconButton,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Tooltip,
  TextField
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  PlayArrow as ProcessIcon,
  CheckCircle as CompleteIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Queue as QueueIcon
} from "@mui/icons-material";
import { contentIngestionService } from "../services/contentIngestionService";
import { adminAnalytics } from "../services/adminAnalytics";
import { db } from "../firebaseConfig";
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from "firebase/firestore";

const ContentIngestionDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    metrics: {},
    recentUploads: [],
    processingQueue: [],
    systemHealth: {},
    errorLogs: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedContent, setSelectedContent] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
  const [rejectionFeedback, setRejectionFeedback] = useState('');
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [resultMessage, setResultMessage] = useState({ type: '', message: '' });

  useEffect(() => {
    const loadData = async () => {
      await loadDashboardData();
    };

    loadData();
    // Set up periodic refresh
    const interval = setInterval(() => {
      loadData();
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);

      // Fetch data from Firestore instead of API endpoints
      const [contentStats, uploads, errors] = await Promise.all([
        adminAnalytics.getContentStats(),
        fetchRecentUploads(),
        fetchErrorLogs()
      ]);

      // Calculate metrics from real data
      const totalSubmissions = contentStats?.totalSubmissions || 0;
      const completedSubmissions = uploads.filter(u => u.status === 'completed').length;
      const processingSubmissions = uploads.filter(u => u.status === 'processing').length;
      const successRate = totalSubmissions > 0 ? (completedSubmissions / totalSubmissions) * 100 : 0;

      // Calculate average processing time
      const completedUploads = uploads.filter(u => u.status === 'completed' && u.processingTime);
      const avgProcessingTime = completedUploads.length > 0
        ? completedUploads.reduce((sum, u) => sum + u.processingTime, 0) / completedUploads.length
        : 0;

      setDashboardData({
        metrics: {
          upload_success_rate: { value: successRate },
          processing_time: { average: avgProcessingTime },
          queue_depth: {
            upload: uploads.filter(u => u.status === 'pending').length,
            processing: processingSubmissions
          },
          storage_usage: { percentage: 0 } // Not tracking this yet
        },
        systemHealth: {
          status: 'healthy',
          services: {
            upload_service: 'healthy',
            processing_service: 'healthy',
            database: 'healthy'
          },
          version: '1.0.0',
          timestamp: Date.now()
        },
        recentUploads: uploads,
        processingQueue: uploads.filter(
          (u) => u.status !== "completed" && u.status !== "failed",
        ),
        errorLogs: errors
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      // Set default values on error
      setDashboardData({
        metrics: {},
        systemHealth: { status: 'unknown', services: {}, timestamp: Date.now() },
        recentUploads: [],
        processingQueue: [],
        errorLogs: []
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRecentUploads = async () => {
    try {
      console.log('📥 Fetching artist submissions...');

      // Fetch recent artist submissions from Firestore
      // Try without orderBy first in case index doesn't exist
      let snapshot;
      try {
        const q = query(
          collection(db, 'artistSubmissions'),
          orderBy('submittedAt', 'desc'),
          limit(50)
        );
        snapshot = await getDocs(q);
      } catch (indexError) {
        console.warn('⚠️ Index may not exist, fetching without orderBy:', indexError);
        // Fallback: fetch without ordering
        const q = query(
          collection(db, 'artistSubmissions'),
          limit(50)
        );
        snapshot = await getDocs(q);
      }

      console.log(`✅ Found ${snapshot.docs.length} submissions`);

      const uploads = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📄 Submission:', doc.id, data);

        const trackCount = data.tracks?.length || 0;
        const albumTitle = data.albumTitle || (trackCount > 0 ? data.tracks[0].title : 'Untitled');

        return {
          id: doc.id,
          filename: `${data.releaseType === 'album' ? 'Album' : 'Single'}: ${albumTitle}`,
          artist: data.artist || 'Unknown Artist',
          title: albumTitle,
          releaseType: data.releaseType,
          trackCount,
          status: data.status || 'pending',
          progress: data.progress || (data.status === 'published' ? 100 : data.status === 'approved' ? 80 : data.status === 'under_review' ? 50 : 10),
          uploadedAt: data.submittedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date(),
          processingTime: data.processingTime || (data.completedAt && data.startedAt
            ? (data.completedAt.toDate() - data.startedAt.toDate()) / 1000
            : null),
          currentStep: data.currentStep || 'upload'
        };
      });

      // Sort by uploadedAt in JavaScript if we couldn't use Firestore orderBy
      uploads.sort((a, b) => b.uploadedAt - a.uploadedAt);

      return uploads;
    } catch (error) {
      console.error('❌ Error fetching uploads:', error);
      return [];
    }
  };

  const fetchErrorLogs = async () => {
    try {
      // Fetch recent error logs from Firestore
      const oneDayAgo = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // Last 7 days
      const q = query(
        collection(db, 'error_logs'),
        where('timestamp', '>=', oneDayAgo),
        orderBy('timestamp', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(q);
      const errors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date()
      }));

      return errors;
    } catch (error) {
      console.error('Error fetching error logs:', error);
      return [];
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleViewDetails = async (contentId) => {
    try {
      const details =
        await contentIngestionService.getProcessingStatus(contentId);
      setSelectedContent(details);
      setDetailsDialogOpen(true);
    } catch (error) {
      console.error("Error fetching content details:", error);
    }
  };

  const formatFileSize = (bytes) => {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: "success",
      published: "success",
      approved: "success",
      processing: "warning",
      under_review: "warning",
      failed: "error",
      rejected: "error",
      quarantined: "error",
      pending: "info"
    };
    return colors[status] || "default";
  };

  const getStatusIcon = (status) => {
    const icons = {
      completed: <CompleteIcon />,
      processing: <ProcessIcon />,
      failed: <ErrorIcon />,
      quarantined: <SecurityIcon />,
      pending: <QueueIcon />,
      approved: <CompleteIcon />,
      published: <CompleteIcon />,
      rejected: <ErrorIcon />,
      under_review: <ProcessIcon />
    };
    return icons[status] || <QueueIcon />;
  };

  const handleApproveClick = (submissionId) => {
    setSelectedSubmissionId(submissionId);
    setApproveDialogOpen(true);
  };

  const handleRejectClick = (submissionId) => {
    setSelectedSubmissionId(submissionId);
    setRejectDialogOpen(true);
  };

  const handleApproveConfirm = async () => {
    try {
      setRefreshing(true);
      setApproveDialogOpen(false);
      await contentIngestionService.approveSubmission(selectedSubmissionId);
      await loadDashboardData();
      setResultMessage({
        type: 'success',
        message: 'Submission approved and published successfully! The content is now live on the platform and will appear in New Releases.'
      });
      setResultDialogOpen(true);
    } catch (error) {
      console.error('Error approving submission:', error);
      setResultMessage({
        type: 'error',
        message: `Failed to approve submission: ${error.message}`
      });
      setResultDialogOpen(true);
    } finally {
      setRefreshing(false);
      setSelectedSubmissionId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectionFeedback.trim()) {
      setResultMessage({
        type: 'error',
        message: 'Please enter rejection feedback'
      });
      setResultDialogOpen(true);
      return;
    }

    try {
      setRefreshing(true);
      setRejectDialogOpen(false);
      await contentIngestionService.rejectSubmission(selectedSubmissionId, rejectionFeedback);
      await loadDashboardData();
      setResultMessage({
        type: 'success',
        message: 'Submission rejected. Artist will be notified with your feedback.'
      });
      setResultDialogOpen(true);
    } catch (error) {
      console.error('Error rejecting submission:', error);
      setResultMessage({
        type: 'error',
        message: `Failed to reject submission: ${error.message}`
      });
      setResultDialogOpen(true);
    } finally {
      setRefreshing(false);
      setSelectedSubmissionId(null);
      setRejectionFeedback('');
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          Content Ingestion Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </Box>

      {/* System Health Alert */}
      {dashboardData.systemHealth.status !== "healthy" && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          System Status: {dashboardData.systemHealth.status}. Some services may
          be experiencing issues.
        </Alert>
      )}

      {/* Metrics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <UploadIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Upload Success Rate
                  </Typography>
                  <Typography variant="h5">
                    {dashboardData.metrics.upload_success_rate?.value?.toFixed(
                      1,
                    ) || 0}
                    %
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <SpeedIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Avg Processing Time
                  </Typography>
                  <Typography variant="h5">
                    {formatDuration(
                      dashboardData.metrics.processing_time?.average || 0,
                    )}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <QueueIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Queue Depth
                  </Typography>
                  <Typography variant="h5">
                    {(dashboardData.metrics.queue_depth?.upload || 0) +
                      (dashboardData.metrics.queue_depth?.processing || 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <StorageIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Storage Used
                  </Typography>
                  <Typography variant="h5">
                    {dashboardData.metrics.storage_usage?.percentage?.toFixed(
                      1,
                    ) || 0}
                    %
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
        >
          <Tab label="Recent Uploads" />
          <Tab label="Processing Queue" />
          <Tab label="Error Logs" />
          <Tab label="System Health" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {selectedTab === 0 && (
        <RecentUploadsTable
          uploads={dashboardData.recentUploads}
          onViewDetails={handleViewDetails}
          onApprove={handleApproveClick}
          onReject={handleRejectClick}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          formatFileSize={formatFileSize}
          formatDuration={formatDuration}
        />
      )}

      {selectedTab === 1 && (
        <ProcessingQueueTable
          queue={dashboardData.processingQueue}
          onViewDetails={handleViewDetails}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
        />
      )}

      {selectedTab === 2 && <ErrorLogsTable errors={dashboardData.errorLogs} />}

      {selectedTab === 3 && (
        <SystemHealthPanel health={dashboardData.systemHealth} />
      )}

      {/* Content Details Dialog */}
      <ContentDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        content={selectedContent}
        formatDuration={formatDuration}
        getStatusColor={getStatusColor}
      />

      {/* Approve Confirmation Dialog */}
      <Dialog
        open={approveDialogOpen}
        onClose={() => setApproveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#1e1e1e', color: 'white' }}>
          Approve Submission
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1e1e1e', color: 'white', pt: 3 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            This will publish the submission to the platform and make it visible to all users.
          </Alert>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to approve this submission and publish it to the platform?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The following will be created:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 3 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              Songs will be added to the songs collection
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Albums will be created (if applicable)
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Content will be immediately visible on the platform
            </Typography>
          </Box>
        </DialogContent>
        <Box sx={{ p: 2, bgcolor: '#1e1e1e', display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            onClick={() => setApproveDialogOpen(false)}
            variant="outlined"
            sx={{ borderColor: '#555', color: 'white' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApproveConfirm}
            variant="contained"
            color="success"
            disabled={refreshing}
          >
            {refreshing ? 'Publishing...' : 'Approve & Publish'}
          </Button>
        </Box>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#1e1e1e', color: 'white' }}>
          Reject Submission
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1e1e1e', color: 'white', pt: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            The artist will be notified of this rejection with your feedback.
          </Alert>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Please provide detailed feedback to help the artist improve their submission:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Feedback"
            placeholder="e.g., Audio quality issues, metadata incomplete, copyright concerns, etc."
            value={rejectionFeedback}
            onChange={(e) => setRejectionFeedback(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: '#555' },
                '&:hover fieldset': { borderColor: '#777' },
              },
              '& .MuiInputLabel-root': { color: '#aaa' }
            }}
          />
        </DialogContent>
        <Box sx={{ p: 2, bgcolor: '#1e1e1e', display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            onClick={() => {
              setRejectDialogOpen(false);
              setRejectionFeedback('');
            }}
            variant="outlined"
            sx={{ borderColor: '#555', color: 'white' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRejectConfirm}
            variant="contained"
            color="error"
            disabled={refreshing || !rejectionFeedback.trim()}
          >
            {refreshing ? 'Rejecting...' : 'Reject Submission'}
          </Button>
        </Box>
      </Dialog>

      {/* Result Dialog (Success/Error) */}
      <Dialog
        open={resultDialogOpen}
        onClose={() => setResultDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#1e1e1e', color: 'white' }}>
          {resultMessage.type === 'success' ? '✅ Success' : '❌ Error'}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1e1e1e', color: 'white', pt: 3 }}>
          <Alert severity={resultMessage.type === 'success' ? 'success' : 'error'} sx={{ mb: 2 }}>
            {resultMessage.message}
          </Alert>
        </DialogContent>
        <Box sx={{ p: 2, bgcolor: '#1e1e1e', display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            onClick={() => setResultDialogOpen(false)}
            variant="contained"
            color={resultMessage.type === 'success' ? 'success' : 'error'}
          >
            OK
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

// Recent Uploads Table Component
const RecentUploadsTable = ({
  uploads,
  onViewDetails,
  onApprove,
  onReject,
  getStatusColor,
  getStatusIcon,
  formatFileSize,
  formatDuration
}) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>File</TableCell>
          <TableCell>Artist</TableCell>
          <TableCell>Title</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Progress</TableCell>
          <TableCell>Uploaded</TableCell>
          <TableCell>Processing Time</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {uploads.map((upload) => (
          <TableRow key={upload.id}>
            <TableCell>{upload.filename}</TableCell>
            <TableCell>{upload.artist}</TableCell>
            <TableCell>{upload.title}</TableCell>
            <TableCell>
              <Chip
                icon={getStatusIcon(upload.status)}
                label={upload.status}
                color={getStatusColor(upload.status)}
                size="small"
              />
            </TableCell>
            <TableCell>
              <Box display="flex" alignItems="center">
                <LinearProgress
                  variant="determinate"
                  value={upload.progress}
                  sx={{ width: 100, mr: 1 }}
                />
                <Typography variant="body2">{upload.progress}%</Typography>
              </Box>
            </TableCell>
            <TableCell>{upload.uploadedAt?.toLocaleDateString()}</TableCell>
            <TableCell>
              {upload.processingTime
                ? formatDuration(upload.processingTime)
                : "-"}
            </TableCell>
            <TableCell>
              <Box display="flex" gap={1}>
                <Tooltip title="View Details">
                  <IconButton
                    onClick={() => onViewDetails(upload.id)}
                    size="small"
                  >
                    <ViewIcon />
                  </IconButton>
                </Tooltip>
                {upload.status === 'pending' && (
                  <>
                    <Tooltip title="Approve & Publish">
                      <IconButton
                        onClick={() => onApprove(upload.id)}
                        size="small"
                        color="success"
                      >
                        <CompleteIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reject">
                      <IconButton
                        onClick={() => onReject(upload.id)}
                        size="small"
                        color="error"
                      >
                        <ErrorIcon />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

// Processing Queue Table Component
const ProcessingQueueTable = ({
  queue,
  onViewDetails,
  getStatusColor,
  getStatusIcon
}) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Content ID</TableCell>
          <TableCell>File</TableCell>
          <TableCell>Current Step</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Started</TableCell>
          <TableCell>Est. Remaining</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {queue.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <Typography variant="body2" fontFamily="monospace">
                {item.id.substring(0, 8)}...
              </Typography>
            </TableCell>
            <TableCell>{item.filename}</TableCell>
            <TableCell>{item.currentStep}</TableCell>
            <TableCell>
              <Chip
                icon={getStatusIcon(item.status)}
                label={item.status}
                color={getStatusColor(item.status)}
                size="small"
              />
            </TableCell>
            <TableCell>{item.startedAt?.toLocaleTimeString()}</TableCell>
            <TableCell>{item.estimatedTimeRemaining || "-"}</TableCell>
            <TableCell>
              <Tooltip title="View Details">
                <IconButton onClick={() => onViewDetails(item.id)} size="small">
                  <ViewIcon />
                </IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

// Error Logs Table Component
const ErrorLogsTable = ({ errors }) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Timestamp</TableCell>
          <TableCell>Type</TableCell>
          <TableCell>Severity</TableCell>
          <TableCell>Message</TableCell>
          <TableCell>Content ID</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {errors.map((error, index) => (
          <TableRow key={index}>
            <TableCell>{new Date(error.timestamp).toLocaleString()}</TableCell>
            <TableCell>
              <Chip label={error.type} size="small" />
            </TableCell>
            <TableCell>
              <Chip
                label={error.severity}
                color={
                  error.severity === "critical"
                    ? "error"
                    : error.severity === "high"
                      ? "warning"
                      : "default"
                }
                size="small"
              />
            </TableCell>
            <TableCell>{error.message}</TableCell>
            <TableCell>
              {error.contentId && (
                <Typography variant="body2" fontFamily="monospace">
                  {error.contentId.substring(0, 8)}...
                </Typography>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

// System Health Panel Component
const SystemHealthPanel = ({ health }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} md={6}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Service Status
          </Typography>
          {Object.entries(health.services || {}).map(([service, status]) => (
            <Box
              key={service}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography>{service.replace("_", " ").toUpperCase()}</Typography>
              <Chip
                label={typeof status === "string" ? status : status.status}
                color={
                  (typeof status === "string" ? status : status.status) ===
                  "healthy"
                    ? "success"
                    : "error"
                }
                size="small"
              />
            </Box>
          ))}
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12} md={6}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Information
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Version: {health.version}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Last Updated: {new Date(health.timestamp).toLocaleString()}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Overall Status:
            <Chip
              label={health.status}
              color={health.status === "healthy" ? "success" : "warning"}
              size="small"
              sx={{ ml: 1 }}
            />
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
);

// Content Details Dialog Component
const ContentDetailsDialog = ({
  open,
  onClose,
  content,
  formatDuration,
  getStatusColor
}) => {
  if (!content) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Content Details
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          ×
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Content ID
              </Typography>
              <Typography variant="body1" fontFamily="monospace">
                {content.contentId}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Status
              </Typography>
              <Chip
                label={content.status}
                color={getStatusColor(content.status)}
                size="small"
              />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Overall Progress
              </Typography>
              <LinearProgress
                variant="determinate"
                value={content.overallProgress * 100}
                sx={{ mt: 1 }}
              />
              <Typography variant="body2">
                {(content.overallProgress * 100).toFixed(1)}%
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Est. Time Remaining
              </Typography>
              <Typography variant="body1">
                {content.estimatedTimeRemaining
                  ? formatDuration(content.estimatedTimeRemaining)
                  : "N/A"}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Processing Steps
          </Typography>
          {Object.entries(content.processingSteps || {}).map(
            ([step, stepData]) => (
              <Box
                key={step}
                mb={2}
                p={2}
                border={1}
                borderColor="grey.300"
                borderRadius={1}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="subtitle1">
                    {step
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                  </Typography>
                  <Chip
                    label={stepData.status}
                    color={getStatusColor(stepData.status)}
                    size="small"
                  />
                </Box>
                {stepData.startedAt && (
                  <Typography variant="body2" color="textSecondary">
                    Started:{" "}
                    {new Date(stepData.startedAt.toDate()).toLocaleString()}
                  </Typography>
                )}
                {stepData.completedAt && (
                  <Typography variant="body2" color="textSecondary">
                    Completed:{" "}
                    {new Date(stepData.completedAt.toDate()).toLocaleString()}
                  </Typography>
                )}
              </Box>
            ),
          )}
        </Box>

        {content.metadata && (
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Metadata
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(content.metadata).map(([key, value]) => (
                <Grid item xs={6} key={key}>
                  <Typography variant="body2" color="textSecondary">
                    {key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                  </Typography>
                  <Typography variant="body1">{value || "N/A"}</Typography>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {content.errors && content.errors.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom color="error">
              Recent Errors
            </Typography>
            {content.errors.map((error, index) => (
              <Alert severity="error" key={index} sx={{ mb: 1 }}>
                {error.message} ({new Date(error.timestamp).toLocaleString()})
              </Alert>
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContentIngestionDashboard;
