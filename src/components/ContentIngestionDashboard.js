// src/components/ContentIngestionDashboard.js
// Admin dashboard for managing content ingestion workflow
import React, { useState, useEffect } from "react";
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
  Badge
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  PlayArrow as ProcessIcon,
  CheckCircle as CompleteIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon as DownloadIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Queue as QueueIcon
} from "@mui/icons-material";
import { contentIngestionService } from "../services/contentIngestionService";
import { CircularProgress } from '@mui/material/CircularProgress';
import { Tooltip } from '@mui/material/Tooltip';

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

  useEffect(() => {
    loadDashboardData();
    // Set up periodic refresh
    const interval = setInterval(loadDashboardData, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);

      // Load metrics, health, and content data
      const [metricsResponse, healthResponse, uploadsResponse, errorsResponse] =
        await Promise.all([
          fetch(
            "/.netlify/functions/content-ingestion/monitoring?action=metrics",
          ),
          fetch(
            "/.netlify/functions/content-ingestion/monitoring?action=health",
          ),
          fetchRecentUploads(),
          fetch(
            "/.netlify/functions/content-ingestion/monitoring?action=errors&limit=20",
          ),
        ]);

      const metrics = await metricsResponse.json();
      const health = await healthResponse.json();
      const uploads = uploadsResponse;
      const errors = await errorsResponse.json();

      setDashboardData({
        metrics: metrics.metrics || {},
        systemHealth: health,
        recentUploads: uploads,
        processingQueue: uploads.filter(
          (u) => u.status !== "completed" && u.status !== "failed",
        ),
        errorLogs: errors.errors || []
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRecentUploads = async () => {
    // This would integrate with your content management API
    // For now, return mock data structure
    return [
      {
        id: "content_001",
        filename: "song1.mp3",
        artist: "Artist Name",
        title: "Song Title",
        status: "completed",
        progress: 100,
        uploadedAt: new Date(),
        processingTime: 180
      },
      // Add more mock data as needed
    ];
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
      processing: "warning",
      failed: "error",
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
      pending: <QueueIcon />
    };
    return icons[status] || <QueueIcon />;
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
    </Box>
  );
};

// Recent Uploads Table Component
const RecentUploadsTable = ({
  uploads,
  onViewDetails,
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
              <Tooltip title="View Details">
                <IconButton
                  onClick={() => onViewDetails(upload.id)}
                  size="small"
                >
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
