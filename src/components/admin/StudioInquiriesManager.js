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
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Visibility,
  Email,
  CheckCircle
} from '@mui/icons-material';
import { db } from '../../firebaseConfig';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { updateInquiryStatus } from '../../services/studioInquiryService';
import { toast } from 'react-toastify';

export default function StudioInquiriesManager() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Load inquiries with real-time updates
  useEffect(() => {
    const inquiriesQuery = query(
      collection(db, 'studioInquiries'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(inquiriesQuery, (snapshot) => {
      const inquiriesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInquiries(inquiriesList);
      setLoading(false);

      // Update selected inquiry if it's currently being viewed
      if (selectedInquiry) {
        const updatedInquiry = inquiriesList.find(inq => inq.id === selectedInquiry.id);
        if (updatedInquiry) {
          setSelectedInquiry(updatedInquiry);
        }
      }
    }, (error) => {
      console.error('Error loading inquiries:', error);
      toast.error('Failed to load inquiries');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedInquiry]);

  const handleViewInquiry = (inquiry) => {
    setSelectedInquiry(inquiry);
    setNewStatus(inquiry.status || 'new');
    setAdminNotes(inquiry.adminNotes || '');
    setDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedInquiry) return;

    setProcessing(true);
    try {
      const result = await updateInquiryStatus(selectedInquiry.id, newStatus, adminNotes);

      if (result.success) {
        toast.success('Inquiry updated successfully');
        setDialogOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error updating inquiry:', error);
      toast.error('Failed to update inquiry');
    } finally {
      setProcessing(false);
    }
  };

  const handleReplyEmail = (inquiry) => {
    const subject = encodeURIComponent(`Re: BeatFlow Studio Inquiry - ${inquiry.serviceInterest}`);
    const body = encodeURIComponent(`Hi ${inquiry.name},\n\nThank you for your interest in BeatFlow Studio services.\n\n`);
    // Open Gmail compose window with beatflowmediagroup@gmail.com as the sender
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${inquiry.email}&su=${subject}&body=${body}`;
    window.open(gmailUrl, '_blank');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'error';
      case 'contacted': return 'warning';
      case 'quoted': return 'info';
      case 'closed': return 'success';
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

  // Filter inquiries
  const filteredInquiries = statusFilter === 'all'
    ? inquiries
    : inquiries.filter(inq => inq.status === statusFilter);

  // Count by status
  const newCount = inquiries.filter(i => i.status === 'new').length;
  const contactedCount = inquiries.filter(i => i.status === 'contacted').length;
  const quotedCount = inquiries.filter(i => i.status === 'quoted').length;
  const closedCount = inquiries.filter(i => i.status === 'closed').length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Studio Inquiries
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage consultation requests and client inquiries for BeatFlow Studio
        </Typography>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          {newCount > 0 && (
            <Alert severity="error" sx={{ flex: 1 }}>
              {newCount} new inquir{newCount !== 1 ? 'ies' : 'y'} awaiting response
            </Alert>
          )}
          {contactedCount > 0 && (
            <Alert severity="warning" sx={{ flex: 1 }}>
              {contactedCount} contacted
            </Alert>
          )}
          {quotedCount > 0 && (
            <Alert severity="info" sx={{ flex: 1 }}>
              {quotedCount} quoted
            </Alert>
          )}
          <Alert severity="success" sx={{ flex: 1 }}>
            {closedCount} closed deal{closedCount !== 1 ? 's' : ''}
          </Alert>
        </Box>
      </Box>

      {/* Filter Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={statusFilter} onChange={(e, newValue) => setStatusFilter(newValue)}>
          <Tab label={`All (${inquiries.length})`} value="all" />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                New
                {newCount > 0 && (
                  <Chip
                    label={newCount}
                    size="small"
                    color="error"
                    sx={{ height: 20, fontSize: '0.75rem' }}
                  />
                )}
              </Box>
            }
            value="new"
          />
          <Tab label={`Contacted (${contactedCount})`} value="contacted" />
          <Tab label={`Quoted (${quotedCount})`} value="quoted" />
          <Tab label={`Closed (${closedCount})`} value="closed" />
        </Tabs>
      </Box>

      {/* Inquiries Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Use Case</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Loading inquiries...
                </TableCell>
              </TableRow>
            ) : filteredInquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No inquiries found
                </TableCell>
              </TableRow>
            ) : (
              filteredInquiries.map((inquiry) => (
                <TableRow
                  key={inquiry.id}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    bgcolor: inquiry.status === 'new' ? 'error.light' : 'inherit',
                    opacity: inquiry.status === 'new' ? 0.95 : 1
                  }}
                  onClick={() => handleViewInquiry(inquiry)}
                >
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(inquiry.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {inquiry.name}
                    </Typography>
                    {inquiry.businessName && (
                      <Typography variant="caption" color="text.secondary">
                        {inquiry.businessName}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {inquiry.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={inquiry.serviceInterest}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {inquiry.useCase}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={inquiry.status || 'new'}
                      color={getStatusColor(inquiry.status || 'new')}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewInquiry(inquiry);
                          }}
                          color="primary"
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reply via Email">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReplyEmail(inquiry);
                          }}
                          color="success"
                        >
                          <Email />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Inquiry Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => !processing && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Inquiry Details
          {selectedInquiry?.status === 'new' && (
            <Chip
              label="NEW"
              color="error"
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {selectedInquiry && (
            <Box sx={{ pt: 2 }}>
              {/* Contact Information */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Contact Information
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Name:</strong> {selectedInquiry.name}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Email:</strong> {selectedInquiry.email}
                </Typography>
                {selectedInquiry.businessName && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Business:</strong> {selectedInquiry.businessName}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Submitted:</strong> {formatDate(selectedInquiry.createdAt)}
                </Typography>
              </Box>

              {/* Service Details */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Service Request
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Service Interest:</strong> {selectedInquiry.serviceInterest}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Use Case:</strong> {selectedInquiry.useCase}
                </Typography>
                {selectedInquiry.timeline && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Timeline:</strong> {selectedInquiry.timeline}
                  </Typography>
                )}
                {selectedInquiry.budget && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Budget:</strong> {selectedInquiry.budget}
                  </Typography>
                )}
              </Box>

              {/* Project Details */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Project Details
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedInquiry.projectDetails}
                </Typography>
              </Box>

              {/* Status Update */}
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="new">New</MenuItem>
                    <MenuItem value="contacted">Contacted</MenuItem>
                    <MenuItem value="quoted">Quoted</MenuItem>
                    <MenuItem value="closed">Closed</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Admin Notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this inquiry, follow-ups, quotes sent, etc..."
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => selectedInquiry && handleReplyEmail(selectedInquiry)}
            startIcon={<Email />}
            disabled={processing}
          >
            Reply via Email
          </Button>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={processing}
          >
            Close
          </Button>
          <Button
            onClick={handleUpdateStatus}
            disabled={processing}
            variant="contained"
            color="primary"
            startIcon={<CheckCircle />}
          >
            {processing ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
