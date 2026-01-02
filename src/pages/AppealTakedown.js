import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Paper,
  IconButton,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CheckCircle,
  InfoOutlined,
  ExpandMore,
  ExpandLess,
  CloudUpload,
  Delete,
  InsertLink,
  AttachFile,
  PictureAsPdf,
  Image as ImageIcon
} from '@mui/icons-material';
import { collection, addDoc, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import { toast } from 'react-toastify';
import { getAppealGuidance } from '../agents/ContentModerationAgent';

export default function AppealTakedown() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();

  const [authChecking, setAuthChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [song, setSong] = useState(null);
  const [album, setAlbum] = useState(null);
  const [appealType, setAppealType] = useState('');
  const [appealReason, setAppealReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [showGuidance, setShowGuidance] = useState(true);
  const [guidance, setGuidance] = useState(null);
  const [existingAppeal, setExistingAppeal] = useState(null);

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  // URL links state
  const [evidenceUrls, setEvidenceUrls] = useState(['']);

  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const songId = searchParams.get('songId');
  const albumId = searchParams.get('albumId');
  const takedownReason = searchParams.get('reason');

  // Wait for auth to initialize
  useEffect(() => {
    // Give auth context time to initialize
    const timer = setTimeout(() => {
      setAuthChecking(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (authChecking) return; // Don't check until auth has initialized

    if (!user) {
      // User is not logged in - stay on page but show login prompt
      setLoading(false);
      return;
    }

    loadContent();
  }, [user, authChecking, songId, albumId]);

  const loadContent = async () => {
    try {
      if (songId) {
        const songDoc = await getDoc(doc(db, 'songs', songId));
        if (songDoc.exists()) {
          setSong({ id: songDoc.id, ...songDoc.data() });
        }
      } else if (albumId) {
        const albumDoc = await getDoc(doc(db, 'albums', albumId));
        if (albumDoc.exists()) {
          setAlbum({ id: albumDoc.id, ...albumDoc.data() });
        }
      }

      // Check for existing appeals for this content
      const contentId = songId || albumId;
      const appealsQuery = query(
        collection(db, 'appeals'),
        where('contentId', '==', contentId),
        where('artistId', '==', user.uid)
      );
      const appealsSnapshot = await getDocs(appealsQuery);

      if (!appealsSnapshot.empty) {
        // Get the most recent appeal
        const appeals = appealsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const latestAppeal = appeals.sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        )[0];

        // Only block if appeal is pending
        if (latestAppeal.status === 'pending') {
          setExistingAppeal(latestAppeal);
        }
      }
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Failed to load content details');
    } finally {
      setLoading(false);
    }
  };

  // File upload handlers
  const handleFileSelect = async (files) => {
    const fileArray = Array.from(files);
    console.log('Files selected:', fileArray.map(f => ({ name: f.name, size: f.size, type: f.type })));

    // Validate files
    for (const file of fileArray) {
      if (file.size > MAX_FILE_SIZE) {
        console.error('File too large:', file.name, file.size);
        toast.error(`File ${file.name} is too large. Max size is 10MB.`);
        return;
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        console.error('File type not allowed:', file.name, file.type);
        toast.error(`File ${file.name} is not an allowed type. Please upload PDF, JPG, PNG, or Word documents.`);
        return;
      }
    }

    console.log('Starting upload for', fileArray.length, 'file(s)');
    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = fileArray.map(async (file, index) => {
        const storagePath = `appeal-evidence/${user.uid}/${Date.now()}-${file.name}`;
        console.log('Uploading to:', storagePath);
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        console.log('File uploaded successfully:', file.name, 'URL:', url);

        setUploadProgress(((index + 1) / fileArray.length) * 100);

        return {
          name: file.name,
          url: url,
          type: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString()
        };
      });

      const uploadedFileData = await Promise.all(uploadPromises);
      console.log('All files uploaded:', uploadedFileData);
      setUploadedFiles([...uploadedFiles, ...uploadedFileData]);
      console.log('Updated uploadedFiles state:', [...uploadedFiles, ...uploadedFileData]);
      toast.success(`${fileArray.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading files:', error);
      console.error('Error details:', error.message, error.code);
      toast.error(`Failed to upload files: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  // URL handlers
  const handleAddUrl = () => {
    setEvidenceUrls([...evidenceUrls, '']);
  };

  const handleRemoveUrl = (index) => {
    setEvidenceUrls(evidenceUrls.filter((_, i) => i !== index));
  };

  const handleUrlChange = (index, value) => {
    const newUrls = [...evidenceUrls];
    newUrls[index] = value;
    setEvidenceUrls(newUrls);
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return <PictureAsPdf />;
    if (fileType.includes('image')) return <ImageIcon />;
    return <AttachFile />;
  };

  const handleSubmitAppeal = async (e) => {
    e.preventDefault();
    console.log('Submit appeal triggered');
    console.log('Form state:', {
      appealType,
      appealReason,
      evidence,
      uploadedFiles,
      evidenceUrls
    });

    if (!appealType || !appealReason) {
      console.log('Validation failed: missing appealType or appealReason');
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if evidence is provided (optional but recommended)
    const textEvidence = (evidence || '').trim();
    const hasFiles = uploadedFiles.length > 0;
    const hasUrls = evidenceUrls.some(url => (url || '').trim());
    const hasEvidence = textEvidence || hasFiles || hasUrls;

    console.log('Evidence check:', {
      textEvidence,
      filesCount: uploadedFiles.length,
      urlsProvided: evidenceUrls.filter(url => (url || '').trim()),
      hasEvidence
    });

    if (!hasEvidence) {
      console.log('Warning: no evidence provided');
      toast.warning('Note: Your appeal may take longer to process without supporting evidence. We recommend providing documentation, files, or links to support your claim.');
    }

    setSubmitting(true);

    try {
      // Filter out empty URLs
      const validUrls = evidenceUrls.filter(url => url.trim());

      const appealData = {
        artistId: user.uid,
        artistEmail: user.email,
        artistName: user.displayName || user.email,
        contentType: songId ? 'song' : 'album',
        contentId: songId || albumId,
        contentTitle: song?.title || album?.title,
        contentArtist: song?.artist || album?.artist,
        originalTakedownReason: takedownReason || 'Unknown',
        appealType,
        appealReason,
        evidence,
        evidenceFiles: uploadedFiles,
        evidenceUrls: validUrls,
        additionalInfo,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Submitting appeal data:', appealData);
      const docRef = await addDoc(collection(db, 'appeals'), appealData);
      console.log('Appeal submitted with ID:', docRef.id);

      toast.success('Appeal submitted successfully! We will review your appeal and respond within 3-5 business days.');

      // Redirect to artist profile after 2 seconds
      setTimeout(() => {
        navigate('/artist-profile');
      }, 2000);

    } catch (error) {
      console.error('Error submitting appeal:', error);
      console.error('Error details:', error.message, error.code);
      toast.error(`Failed to submit appeal: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (authChecking || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ p: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center', mt: 8 }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
            Sign In Required
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            You need to be signed in to submit an appeal for your content takedown.
          </Alert>
          <Button
            variant="contained"
            size="large"
            onClick={signInWithGoogle}
            sx={{ mb: 2 }}
          >
            Sign In with Google
          </Button>
          <Typography variant="body2" color="text.secondary">
            After signing in, you'll be able to appeal the takedown decision.
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!song && !album) {
    return (
      <Box sx={{ p: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Alert severity="error">Content not found or you don't have permission to appeal this takedown.</Alert>
      </Box>
    );
  }

  // If there's already a pending appeal, show status instead of form
  if (existingAppeal) {
    return (
      <Box sx={{ p: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
            Appeal Already Submitted
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            You have already submitted an appeal for this content. You cannot submit duplicate appeals while your current appeal is under review.
          </Alert>

          <Card sx={{ p: 4, bgcolor: 'background.paper' }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Your Appeal Status
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Content</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {existingAppeal.contentTitle} - {existingAppeal.contentArtist}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Takedown Reason</Typography>
              <Chip label={existingAppeal.originalTakedownReason} color="error" size="small" />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Appeal Type</Typography>
              <Typography variant="body1">{existingAppeal.appealType}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Status</Typography>
              <Chip label="Pending Review" color="warning" />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Submitted</Typography>
              <Typography variant="body1">
                {new Date(existingAppeal.createdAt).toLocaleString()}
              </Typography>
            </Box>

            <Alert severity="warning" sx={{ mt: 3 }}>
              <Typography variant="body2">
                We are reviewing your appeal and will respond within 3-5 business days via email.
                If your appeal is approved, your content will be automatically republished.
              </Typography>
            </Alert>

            <Button
              variant="outlined"
              onClick={() => navigate('/artist-profile')}
              sx={{ mt: 3 }}
              fullWidth
            >
              Return to Artist Profile
            </Button>
          </Card>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
          Appeal Content Takedown
        </Typography>

        <Card sx={{ p: 3, bgcolor: 'background.paper', mb: 3, borderLeft: '4px solid #f44336' }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'error.main' }}>
            Takedown Reason
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
            {takedownReason}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            If you believe this takedown was made in error, please use this form to submit an appeal with supporting evidence.
          </Typography>
        </Card>

        <Card sx={{ p: 4, bgcolor: 'background.paper' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Content Details
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>Type:</strong> {songId ? 'Song' : 'Album'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>Title:</strong> {song?.title || album?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            <strong>Artist:</strong> {song?.artist || album?.artist}
          </Typography>

          <form onSubmit={handleSubmitAppeal}>
            <FormControl fullWidth sx={{ mb: 3 }} required>
              <InputLabel>Appeal Type</InputLabel>
              <Select
                value={appealType}
                onChange={(e) => setAppealType(e.target.value)}
                label="Appeal Type"
              >
                <MenuItem value="mistaken_identity">Mistaken Identity - This is not the copyrighted work</MenuItem>
                <MenuItem value="i_own_copyright">I Own the Copyright</MenuItem>
                <MenuItem value="licensed">I Have a Valid License</MenuItem>
                <MenuItem value="fair_use">Fair Use / Public Domain</MenuItem>
                <MenuItem value="false_claim">False Copyright Claim</MenuItem>
                <MenuItem value="other">Other Reason</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Reason for Appeal *"
              multiline
              rows={4}
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              placeholder="Explain why this content should be republished..."
              sx={{ mb: 3 }}
              required
            />

            <TextField
              fullWidth
              label="Evidence / Supporting Documentation (Recommended)"
              multiline
              rows={4}
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Describe your evidence and supporting documentation..."
              helperText="Providing evidence (text, file upload, or URL link) will help us process your appeal faster"
              sx={{ mb: 3 }}
            />

            {/* File Upload Section */}
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              Upload Evidence Files (Optional)
            </Typography>
            <Paper
              sx={{
                p: 3,
                mb: 3,
                border: dragActive ? '2px dashed #1976d2' : '2px dashed #ccc',
                bgcolor: dragActive ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload-input').click()}
            >
              <input
                id="file-upload-input"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => handleFileSelect(e.target.files)}
                style={{ display: 'none' }}
              />
              <Box sx={{ textAlign: 'center' }}>
                <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Drag and drop files here, or click to browse
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Accepted: PDF, JPG, PNG, Word documents
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Maximum file size: 10MB per file
                </Typography>
              </Box>
            </Paper>

            {uploading && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>Uploading files...</Typography>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}

            {uploadedFiles.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Uploaded Files:</Typography>
                {uploadedFiles.map((file, index) => (
                  <Chip
                    key={index}
                    icon={getFileIcon(file.type)}
                    label={file.name}
                    onDelete={() => handleRemoveFile(index)}
                    deleteIcon={<Delete />}
                    sx={{ mr: 1, mb: 1 }}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            )}

            {/* URL Links Section */}
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              Evidence Links (Optional)
            </Typography>
            {evidenceUrls.map((url, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label={`Evidence URL ${index + 1}`}
                  value={url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  placeholder="https://copyright.gov/registration/... or license agreement link"
                  InputProps={{
                    startAdornment: <InsertLink sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
                {evidenceUrls.length > 1 && (
                  <IconButton onClick={() => handleRemoveUrl(index)} color="error">
                    <Delete />
                  </IconButton>
                )}
              </Box>
            ))}
            <Button
              variant="outlined"
              startIcon={<InsertLink />}
              onClick={handleAddUrl}
              sx={{ mb: 3 }}
              size="small"
            >
              Add Another URL
            </Button>

            <TextField
              fullWidth
              label="Additional Information"
              multiline
              rows={3}
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Any other relevant information..."
              sx={{ mb: 3 }}
            />

            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Important:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Appeals are reviewed by our moderation team and AI system</li>
                <li>You will receive a response within 3-5 business days</li>
                <li>False or fraudulent appeals may result in account suspension</li>
                <li>If your appeal is denied, you may contact support for further review</li>
              </ul>
            </Alert>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={submitting}
                sx={{ flex: 1 }}
              >
                {submitting ? 'Submitting...' : 'Submit Appeal'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/artist-profile')}
                disabled={submitting}
                sx={{ flex: 1 }}
              >
                Cancel
              </Button>
            </Box>
          </form>
        </Card>
      </Box>
    </Box>
  );
}
