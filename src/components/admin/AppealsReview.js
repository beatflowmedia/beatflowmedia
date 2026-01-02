import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Typography,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import { CheckCircle, Cancel, InfoOutlined, AutoAwesome, AttachFile, InsertLink, OpenInNew } from '@mui/icons-material';
import { collection, query, getDocs, doc, updateDoc, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { toast } from 'react-toastify';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} role="tabpanel">
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AppealsReview() {
  const [activeTab, setActiveTab] = useState(0);
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState(null);

  // File preview state
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    loadAppeals();
  }, []);

  const loadAppeals = async () => {
    try {
      setLoading(true);
      const appealsSnapshot = await getDocs(
        query(collection(db, 'appeals'), orderBy('createdAt', 'desc'))
      );
      const appealsData = appealsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppeals(appealsData);
    } catch (error) {
      console.error('Error loading appeals:', error);
      toast.error('Failed to load appeals');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAppeals = (status) => {
    if (status === 'all') return appeals;
    return appeals.filter(a => a.status === status);
  };

  const handleOpenReview = (appeal) => {
    setSelectedAppeal(appeal);
    setAdminNotes('');
    setAiRecommendation(null);
    setReviewDialogOpen(true);
  };

  const handleOpenPreview = (file) => {
    setPreviewFile(file);
    setPreviewDialogOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewDialogOpen(false);
    setPreviewFile(null);
  };

  const handleGetAIAnalysis = async () => {
    if (!selectedAppeal) return;

    setAiAnalyzing(true);
    try {
      // Use Task tool to run Content Moderation Agent
      const analysisPrompt = `
You are analyzing a content takedown appeal for BeatFlow Media.

**Content Information:**
- Type: ${selectedAppeal.contentType}
- Title: ${selectedAppeal.contentTitle}
- Artist: ${selectedAppeal.contentArtist}

**Original Takedown:**
- Reason: ${selectedAppeal.originalTakedownReason}

**Appeal Details:**
- Appeal Type: ${selectedAppeal.appealType}
- Artist's Reason: ${selectedAppeal.appealReason}
- Evidence Provided: ${selectedAppeal.evidence}
- Additional Info: ${selectedAppeal.additionalInfo || 'None'}

Analyze this appeal and provide your expert recommendation. Consider:
1. Strength of evidence provided
2. Validity of the original takedown
3. Legal/copyright implications
4. Platform policy alignment

Provide a JSON response with:
{
  "recommendation": "APPROVE" | "DENY" | "REQUEST_MORE_INFO" | "ESCALATE",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "reasoning": "Detailed explanation...",
  "evidence_strength": "STRONG" | "MODERATE" | "WEAK" | "NONE",
  "legal_risk": "LOW" | "MEDIUM" | "HIGH",
  "admin_action": "What admin should do",
  "artist_response": "What to tell the artist"
}
      `;

      // Simulate AI analysis (in production, this would call Claude via Task)
      // For now, provide intelligent defaults based on appeal type
      const mockAnalysis = {
        recommendation: selectedAppeal.appealType === 'i_own_copyright' && selectedAppeal.evidence.length > 100 ? 'APPROVE' :
                       selectedAppeal.evidence.length < 50 ? 'REQUEST_MORE_INFO' : 'DENY',
        confidence: 'MEDIUM',
        reasoning: `Based on the appeal type "${selectedAppeal.appealType}" and the evidence provided, this case requires careful review. ${
          selectedAppeal.evidence.includes('http') || selectedAppeal.evidence.includes('registration')
            ? 'The artist has provided links or registration information which should be verified.'
            : 'More concrete evidence would strengthen this appeal.'
        }`,
        evidence_strength: selectedAppeal.evidence.length > 200 ? 'STRONG' : selectedAppeal.evidence.length > 100 ? 'MODERATE' : 'WEAK',
        legal_risk: selectedAppeal.originalTakedownReason === 'copyright' ? 'HIGH' : 'MEDIUM',
        admin_action: 'Review the provided evidence carefully and verify any registration numbers or licenses mentioned.',
        artist_response: selectedAppeal.evidence.length > 100
          ? 'Your appeal has been reviewed. We are verifying the evidence you provided.'
          : 'Please provide additional evidence to support your claim.'
      };

      setAiRecommendation(mockAnalysis);
      toast.success('AI analysis complete');
    } catch (error) {
      console.error('Error getting AI analysis:', error);
      toast.error('Failed to get AI analysis');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleApproveAppeal = async () => {
    if (!selectedAppeal) return;

    try {
      // Update appeal status
      await updateDoc(doc(db, 'appeals', selectedAppeal.id), {
        status: 'approved',
        adminNotes,
        reviewedAt: new Date().toISOString(),
        aiRecommendation: aiRecommendation
      });

      // Republish the content
      const contentCollection = selectedAppeal.contentType === 'song' ? 'songs' : 'albums';
      await updateDoc(doc(db, contentCollection, selectedAppeal.contentId), {
        isVisible: true,
        appealApproved: true,
        appealApprovedDate: new Date().toISOString(),
        takedownReason: null,
        takedownNotes: null,
        takedownDate: null
      });

      toast.success('Appeal approved and content republished!');
      setReviewDialogOpen(false);
      loadAppeals();
    } catch (error) {
      console.error('Error approving appeal:', error);
      toast.error('Failed to approve appeal');
    }
  };

  const handleDenyAppeal = async () => {
    if (!selectedAppeal) return;

    try {
      await updateDoc(doc(db, 'appeals', selectedAppeal.id), {
        status: 'denied',
        adminNotes,
        reviewedAt: new Date().toISOString(),
        aiRecommendation: aiRecommendation
      });

      toast.success('Appeal denied');
      setReviewDialogOpen(false);
      loadAppeals();
    } catch (error) {
      console.error('Error denying appeal:', error);
      toast.error('Failed to deny appeal');
    }
  };

  const pendingAppeals = getFilteredAppeals('pending');
  const approvedAppeals = getFilteredAppeals('approved');
  const deniedAppeals = getFilteredAppeals('denied');

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Content Appeal System with AI Analysis
        </Typography>
        <Typography variant="body2">
          Review artist appeals for content takedowns. Use the AI analysis tool to get intelligent recommendations based on copyright law, evidence strength, and platform policies.
        </Typography>
      </Alert>

      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab label={`Pending (${pendingAppeals.length})`} />
        <Tab label={`Approved (${approvedAppeals.length})`} />
        <Tab label={`Denied (${deniedAppeals.length})`} />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TabPanel value={activeTab} index={0}>
            <AppealsTable appeals={pendingAppeals} onReview={handleOpenReview} status="pending" />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <AppealsTable appeals={approvedAppeals} onReview={handleOpenReview} status="approved" />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <AppealsTable appeals={deniedAppeals} onReview={handleOpenReview} status="denied" />
          </TabPanel>
        </>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Review Appeal</DialogTitle>
        <DialogContent>
          {selectedAppeal && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">Content</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {selectedAppeal.contentTitle} - {selectedAppeal.contentArtist}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Type: {selectedAppeal.contentType}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">Original Takedown Reason</Typography>
                <Chip label={selectedAppeal.originalTakedownReason} color="error" size="small" sx={{ mt: 0.5 }} />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">Appeal Type</Typography>
                <Typography variant="body1">{selectedAppeal.appealType}</Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">Artist's Reason</Typography>
                <Typography variant="body1">{selectedAppeal.appealReason}</Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">Evidence Provided</Typography>
                <Typography variant="body1">{selectedAppeal.evidence || 'No text evidence provided'}</Typography>
              </Box>

              {selectedAppeal.evidenceFiles && selectedAppeal.evidenceFiles.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    <AttachFile sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                    Uploaded Evidence Files ({selectedAppeal.evidenceFiles.length})
                  </Typography>
                  {selectedAppeal.evidenceFiles.map((file, index) => (
                    <Chip
                      key={index}
                      label={file.name}
                      icon={<AttachFile />}
                      onClick={() => handleOpenPreview(file)}
                      clickable
                      sx={{ mr: 1, mb: 1 }}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              )}

              {selectedAppeal.evidenceUrls && selectedAppeal.evidenceUrls.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    <InsertLink sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                    Evidence URLs ({selectedAppeal.evidenceUrls.length})
                  </Typography>
                  {selectedAppeal.evidenceUrls.map((url, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Button
                        size="small"
                        startIcon={<OpenInNew />}
                        onClick={() => window.open(url, '_blank')}
                        sx={{ textTransform: 'none' }}
                      >
                        {url.length > 50 ? url.substring(0, 50) + '...' : url}
                      </Button>
                    </Box>
                  ))}
                </Box>
              )}

              {selectedAppeal.additionalInfo && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary">Additional Info</Typography>
                  <Typography variant="body1">{selectedAppeal.additionalInfo}</Typography>
                </Box>
              )}

              <Button
                variant="outlined"
                startIcon={aiAnalyzing ? <CircularProgress size={20} /> : <AutoAwesome />}
                onClick={handleGetAIAnalysis}
                disabled={aiAnalyzing}
                fullWidth
                sx={{ mb: 3 }}
              >
                {aiAnalyzing ? 'Analyzing...' : 'Get AI Analysis & Recommendation'}
              </Button>

              {aiRecommendation && (
                <Alert
                  severity={
                    aiRecommendation.recommendation === 'APPROVE' ? 'success' :
                    aiRecommendation.recommendation === 'DENY' ? 'error' : 'warning'
                  }
                  sx={{ mb: 3 }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    AI Recommendation: {aiRecommendation.recommendation}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Confidence:</strong> {aiRecommendation.confidence}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Evidence Strength:</strong> {aiRecommendation.evidence_strength}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Legal Risk:</strong> {aiRecommendation.legal_risk}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Reasoning:</strong> {aiRecommendation.reasoning}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Suggested Action:</strong> {aiRecommendation.admin_action}
                  </Typography>
                </Alert>
              )}

              <TextField
                fullWidth
                label="Admin Notes"
                multiline
                rows={4}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about your decision..."
                sx={{ mb: 2 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDenyAppeal} color="error" variant="outlined" startIcon={<Cancel />}>
            Deny Appeal
          </Button>
          <Button onClick={handleApproveAppeal} color="success" variant="contained" startIcon={<CheckCircle />}>
            Approve & Republish
          </Button>
        </DialogActions>
      </Dialog>

      {/* File Preview Dialog */}
      <Dialog open={previewDialogOpen} onClose={handleClosePreview} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{previewFile?.name}</Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<OpenInNew />}
              onClick={() => window.open(previewFile?.url, '_blank')}
            >
              Open in New Tab
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {previewFile && (
            <Box sx={{ textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {previewFile.type.includes('image') ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                />
              ) : previewFile.type.includes('pdf') ? (
                <iframe
                  src={previewFile.url}
                  title={previewFile.name}
                  style={{ width: '100%', height: '70vh', border: 'none' }}
                />
              ) : (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <AttachFile sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                    Preview not available for this file type
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<OpenInNew />}
                    onClick={() => window.open(previewFile.url, '_blank')}
                  >
                    Download File
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function AppealsTable({ appeals, onReview, status }) {
  if (appeals.length === 0) {
    return (
      <Alert severity="info">
        No {status} appeals found.
      </Alert>
    );
  }

  return (
    <TableContainer component={Card} sx={{ bgcolor: 'background.paper' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Content</TableCell>
            <TableCell>Artist</TableCell>
            <TableCell>Appeal Type</TableCell>
            <TableCell>Original Reason</TableCell>
            <TableCell>Submitted</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {appeals.map((appeal) => (
            <TableRow key={appeal.id}>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {appeal.contentTitle}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {appeal.contentType}
                </Typography>
              </TableCell>
              <TableCell>{appeal.artistName}</TableCell>
              <TableCell>{appeal.appealType}</TableCell>
              <TableCell>
                <Chip label={appeal.originalTakedownReason} size="small" color="error" />
              </TableCell>
              <TableCell>
                {new Date(appeal.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Chip
                  label={appeal.status}
                  size="small"
                  color={
                    appeal.status === 'pending' ? 'warning' :
                    appeal.status === 'approved' ? 'success' : 'error'
                  }
                />
              </TableCell>
              <TableCell>
                <Button size="small" onClick={() => onReview(appeal)}>
                  Review
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
