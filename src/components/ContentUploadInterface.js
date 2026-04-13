// src/components/ContentUploadInterface.js
// Enhanced content upload interface with drag-and-drop, progress tracking, and metadata forms
import React, { useState, useRef , useCallback } from "react";
import { SONG_PRICE, calculateAlbumPrice } from "../utils/pricing";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Paper,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Tooltip,
  Checkbox
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon
} from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import { storage, db, auth } from "../firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import Tempo from 'music-tempo';

// Helper function to detect BPM from audio file
const detectBPM = async (audioFile) => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Get audio data from first channel
    const audioData = audioBuffer.getChannelData(0);

    // Use music-tempo library to detect BPM
    const tempo = new Tempo(audioData);
    const bpm = Math.round(tempo.tempo);

    audioContext.close();

    // Return BPM if it's within reasonable range (60-200)
    return (bpm >= 60 && bpm <= 200) ? bpm : null;
  } catch (error) {
    console.error('Error detecting BPM:', error);
    return null;
  }
};

// Genre categories (matching ForArtists.js structure)
const GENRE_CATEGORIES = {
  'Pop': { subgenres: ['Adult Contemporary', 'K-Pop', 'J-Pop', 'C-Pop', 'Synth-pop', 'Electropop', 'Hyperpop', 'Indie Pop', 'Pop Rock'] },
  'Hip-Hop': { subgenres: ['Trap', 'Drill', 'UK Drill', 'Brooklyn Drill', 'Lo-Fi Rap', 'Alternative Rap', 'Old School', 'Boom Bap', 'PluggnB', 'Cloud Rap'] },
  'Rock': { subgenres: ['Alternative', 'Indie Rock', 'Punk', 'Hard Rock', 'Heavy Metal', 'Post-Punk', 'Grunge', 'Shoegaze', 'Post-Rock'] },
  'R&B': { subgenres: ['Neo-Soul', 'Contemporary R&B', 'Funk', 'Disco', 'Motown', 'Quiet Storm', 'Alternative R&B'] },
  'Country': { subgenres: ['Americana', 'Bluegrass', 'Country Pop', 'Honky Tonk', 'Outlaw Country', 'Country Rock'] },
  'Electronic': { subgenres: ['House', 'Techno', 'Trance', 'Dubstep', 'Drum & Bass', 'EDM', 'Ambient', 'Downtempo', 'Lo-Fi Beats'] },
  'Latin': { subgenres: ['Reggaeton', 'Salsa', 'Bachata', 'Cumbia', 'Latin Trap', 'Banda', 'Merengue'] },
  'Afrobeats': { subgenres: ['Afro-fusion', 'Amapiano', 'Highlife', 'Kuduro', 'Afro-house'] },
  'Reggae': { subgenres: ['Dancehall', 'Dub', 'Ska', 'Rocksteady', 'Roots Reggae'] },
  'Jazz': { subgenres: ['Swing', 'Bebop', 'Jazz Fusion', 'Smooth Jazz', 'Bossa Nova', 'Nu Jazz'] },
  'Classical': { subgenres: ['Baroque', 'Romantic', 'Modern Classical', 'Orchestral', 'Chamber Music', 'Opera'] }
};

const MAIN_GENRES = Object.keys(GENRE_CATEGORIES).sort();
const getSubgenres = (mainGenre) => GENRE_CATEGORIES[mainGenre]?.subgenres || [];

// Mood options
const MOOD_OPTIONS = [
  'Uplifting', 'Chill', 'Energetic', 'Dramatic', 'Dark',
  'Happy', 'Sad', 'Motivational', 'Relaxing', 'Intense',
  'Romantic', 'Mysterious', 'Epic', 'Playful', 'Melancholic'
].sort();

const ContentUploadInterface = ({ onUploadComplete, onUploadError }) => {

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [processingStatus, setProcessingStatus] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState(null);
  const [batchMetadata, setBatchMetadata] = useState({});
  const [enableBatchProcessing, setEnableBatchProcessing] = useState(false);
  const [collectionCoverFile, setCollectionCoverFile] = useState(null); // Single cover for all tracks
  const [coverPreview, setCoverPreview] = useState(null);

  const fileInputRef = useRef(null);

  // Supported file types
  const supportedTypes = {
    audio: [".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a"],
    video: [".mp4", ".mov", ".avi", ".mkv", ".webm"]
  };

  // Territorial rights options
  const territorialOptions = [
    { value: "worldwide", label: "Worldwide" },
    { value: "north_america", label: "North America" },
    { value: "europe", label: "Europe" },
    { value: "asia", label: "Asia" },
    { value: "south_america", label: "South America" },
    { value: "africa", label: "Africa" },
    { value: "oceania", label: "Oceania" },
    { value: "custom", label: "Custom" }
  ];

  const steps = [
    "Select Files",
    "Add Metadata",
    "Upload & Process",
    "Complete",
  ];

  // Default metadata template
  const defaultMetadata = {
    title: "",
    artist: "",
    album: "",
    albumId: null,
    mainGenre: "",
    subGenre: "",
    additionalSubGenres: [],
    bpm: "",
    mood: [],
    loopable: false,
    releaseDate: "",
    isrc: "",
    territorialRights: "worldwide",
    label: "BeatFlow Media Group",
    copyrightOwner: "",
    description: "",
    tags: [],
    explicitContent: false,
    isAlbum: false // Track if this is an album upload
  };

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = {};
      rejectedFiles.forEach((rejection) => {
        errors[rejection.file.name] = rejection.errors.map(
          (error) => error.message,
        );
      });
      setValidationErrors(errors);
    }

    // Add accepted files with BPM detection
    const newFiles = await Promise.all(acceptedFiles.map(async (file) => {
      // Extract title from filename (remove extension)
      const titleFromFilename = file.name.replace(/\.[^/.]+$/, "");

      // Auto-detect BPM for audio files
      let detectedBPM = null;
      if (file.type.startsWith('audio/')) {
        detectedBPM = await detectBPM(file);
      }

      return {
        file,
        id: Math.random().toString(36).substr(2, 9),
        metadata: {
          ...defaultMetadata,
          title: titleFromFilename,  // Auto-populate from filename
          bpm: detectedBPM || ""     // Auto-populate BPM if detected
        },
        validated: false,
        uploadId: null,
        status: "pending"
      };
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Auto-advance to metadata step if files are added
    if (newFiles.length > 0 && currentStep === 0) {
      setCurrentStep(1);
    }
  }, [currentStep, defaultMetadata]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".flac", ".aac", ".ogg"],
      "video/*": [".mp4", ".mov", ".avi", ".mkv"]
    },
    maxSize: 5 * 1024 * 1024 * 1024, // 5GB
    multiple: true
  });

  const handleFileSelect = (event) => {
    event.stopPropagation(); // Prevent dropzone from also handling this click
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    onDrop(selectedFiles, []);
    // Clear the input value to allow selecting the same files again and prevent duplicate triggers
    event.target.value = '';
  };

  const removeFile = (fileId) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };

  const updateFileMetadata = (fileId, metadata) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? { ...f, metadata: { ...f.metadata, ...metadata } }
          : f,
      ),
    );
  };

  const validateAllFiles = () => {
    const errors = {};
    let allValid = true;

    files.forEach((fileData) => {
      const fileErrors = [];

      // Validate required metadata
      if (!fileData.metadata.title || !fileData.metadata.title.trim()) {
        fileErrors.push("Title is required");
      }
      if (!fileData.metadata.artist || !fileData.metadata.artist.trim()) {
        fileErrors.push("Artist is required");
      }
      if (!fileData.metadata.mainGenre) {
        fileErrors.push("Main Genre is required");
      }
      if (!fileData.metadata.subGenre) {
        fileErrors.push("Sub-Genre is required");
      }

      // Validate file size (5GB max)
      const maxSize = 5 * 1024 * 1024 * 1024;
      if (fileData.file.size > maxSize) {
        fileErrors.push("File size exceeds 5GB limit");
      }

      if (fileErrors.length > 0) {
        errors[fileData.id] = fileErrors;
        allValid = false;
        fileData.validated = false;
      } else {
        fileData.validated = true;
      }
    });

    setValidationErrors(errors);
    return allValid;
  };

  const handleStartUpload = async () => {
    if (!validateAllFiles()) {
      return;
    }

    setUploading(true);
    setCurrentStep(2);

    try {
      const user = auth.currentUser;
      let sharedCoverURL = null;
      let sharedAlbumId = null;

      // Upload collection cover art first (once for all tracks)
      if (collectionCoverFile) {
        setProcessingStatus((prev) => ({ ...prev, 'cover': 'uploading' }));
        const timestamp = Date.now();
        const coverFileName = `${timestamp}_collection_cover_${collectionCoverFile.name}`;
        const coverStorageRef = ref(storage, `admin-uploads/${user.uid}/covers/${coverFileName}`);
        const coverUploadTask = uploadBytesResumable(coverStorageRef, collectionCoverFile);

        await new Promise((resolve, reject) => {
          coverUploadTask.on(
            'state_changed',
            (snapshot) => {
              // Progress shown separately for cover
            },
            (error) => reject(error),
            () => resolve()
          );
        });

        sharedCoverURL = await getDownloadURL(coverUploadTask.snapshot.ref);
        setProcessingStatus((prev) => ({ ...prev, 'cover': 'completed' }));
      }

      // If this is an album upload (batch mode + isAlbum), create ONE album document BEFORE uploading tracks
      const firstFile = files[0];
      if (enableBatchProcessing && firstFile?.metadata?.isAlbum && files.length > 0) {
        const coverURL = sharedCoverURL || '/images/Logo.png';

        const albumData = {
          title: firstFile.metadata.album || firstFile.metadata.title || 'Untitled Album',
          artist: firstFile.metadata.artist,
          cover: coverURL,
          coverUrl: coverURL,
          releaseDate: firstFile.metadata.releaseDate || null,
          mainGenre: firstFile.metadata.mainGenre,
          subGenre: firstFile.metadata.subGenre,
          additionalSubGenres: firstFile.metadata.additionalSubGenres || [],
          bpm: firstFile.metadata.bpm || null,
          mood: firstFile.metadata.mood || [],
          loopable: firstFile.metadata.loopable || false,
          label: firstFile.metadata.label || 'BeatFlow Media Group',
          copyrightOwner: firstFile.metadata.copyrightOwner || null,
          description: firstFile.metadata.description || null,
          uploadedBy: user.uid,
          uploadedByEmail: user.email,
          approved: true,
          isAlbum: true,
          isVisible: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          trackCount: files.length,
          totalDuration: 0,
          price: calculateAlbumPrice(files.length) // Calculate based on track count
        };

        const albumRef = await addDoc(collection(db, "albums"), albumData);
        sharedAlbumId = albumRef.id;
        console.log(`Created album project: ${albumData.title} (ID: ${sharedAlbumId})`);
      }

      // Upload all audio files with the shared cover URL and album ID
      for (const fileData of files) {
        await uploadSingleFile(fileData, sharedCoverURL, sharedAlbumId);
      }

      setCurrentStep(3);
      onUploadComplete?.(files);
    } catch (error) {
      console.error("Upload error:", error);
      onUploadError?.(error);
    } finally {
      setUploading(false);
    }
  };

  const uploadSingleFile = async (fileData, sharedCoverURL, sharedAlbumId = null) => {
    try {
      // Set up progress tracking
      setUploadProgress((prev) => ({ ...prev, [fileData.id]: 0 }));
      setProcessingStatus((prev) => ({ ...prev, [fileData.id]: "uploading" }));

      const user = auth.currentUser;
      if (!user) {
        throw new Error("User must be authenticated to upload");
      }

      // Step 1: Create Firestore document first to get song ID
      const tempSongData = {
        ...fileData.metadata,
        fileName: fileData.file.name,
        fileSize: fileData.file.size,
        fileType: fileData.file.type,
        uploadedBy: user.uid,
        uploadedByEmail: user.email,
        approved: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        price: SONG_PRICE, // $29.00 in cents (2900)
        plays: 0,
        likes: 0,
        downloads: 0,
        _uploadStatus: 'pending' // Temporary field during upload
      };

      // Add album reference if needed
      if (sharedAlbumId) {
        tempSongData.albumId = sharedAlbumId;
        tempSongData.album = fileData.metadata.album || fileData.metadata.title;
      }

      const docRef = await addDoc(collection(db, "songs"), tempSongData);
      const songId = docRef.id;

      // Step 2: Upload audio file to standardized location using song ID
      const fileExtension = fileData.file.name.split('.').pop();
      const standardPath = `songs/audio/${songId}.${fileExtension}`;
      const storageRef = ref(storage, standardPath);
      const uploadTask = uploadBytesResumable(storageRef, fileData.file);

      // Track upload progress
      await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress((prev) => ({ ...prev, [fileData.id]: progress }));
          },
          (error) => reject(error),
          () => resolve()
        );
      });

      const audioURL = await getDownloadURL(uploadTask.snapshot.ref);

      // Step 3: Update document with audio URL and cover
      const coverURL = sharedCoverURL || audioURL;

      const updateData = {
        audioUrl: audioURL, // Standardized field name
        audioPath: standardPath, // Track storage path
        coverUrl: coverURL,
        storagePath: uploadTask.snapshot.ref.fullPath,
        _uploadStatus: 'completed', // Mark upload complete
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData);

      // Update status
      setUploadProgress((prev) => ({ ...prev, [fileData.id]: 100 }));
      setProcessingStatus((prev) => ({ ...prev, [fileData.id]: "completed" }));

      fileData.uploadId = songId;
      fileData.status = "completed";
    } catch (error) {
      console.error("Upload failed:", error);
      setProcessingStatus((prev) => ({ ...prev, [fileData.id]: "failed" }));
      fileData.status = "failed";
      throw error;
    }
  };

  const handleMetadataDialog = useCallback((fileIndex, event) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    // Prevent opening if already open
    if (metadataDialogOpen) {
      return;
    }

    setSelectedFileIndex(fileIndex);
    setMetadataDialogOpen(true);
  }, [metadataDialogOpen]);

  const applyBatchMetadata = () => {
    files.forEach((fileData) => {
      updateFileMetadata(fileData.id, batchMetadata);
    });
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith("audio/")) {
      return "🎵";
    } else if (file.type.startsWith("video/")) {
      return "🎬";
    }
    return "📄";
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "default",
      uploading: "primary",
      processing: "warning",
      completed: "success",
      failed: "error"
    };
    return colors[status] || "default";
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

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Content Upload
      </Typography>

      {/* Progress Stepper */}
      <Box mb={4}>
        <Stepper activeStep={currentStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Step 1: File Selection */}
      {currentStep >= 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Select Files to Upload
            </Typography>

            {/* Drop Zone */}
            <Paper
              {...getRootProps()}
              sx={{
                p: 3,
                border: "2px dashed",
                borderColor: isDragActive ? "primary.main" : "grey.300",
                backgroundColor: isDragActive ? "action.hover" : "transparent",
                cursor: "pointer",
                textAlign: "center",
                mb: 2
              }}
            >
              <input {...getInputProps()} />
              <UploadIcon
                sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                {isDragActive ? "Drop files here" : "Drag and drop files here"}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                or
              </Typography>
              <Button variant="outlined" onClick={handleFileSelect}>
                Browse Files
              </Button>
            </Paper>

            {/* Hidden file input for Browse button - OUTSIDE dropzone to prevent conflicts */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*,video/*"
              style={{ display: "none" }}
              onChange={handleFileInputChange}
            />

            {/* Supported Formats Info */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">
                  Supported File Formats
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Audio
                    </Typography>
                    {supportedTypes.audio.map((type) => (
                      <Chip
                        key={type.type}
                        label={type.description}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Video
                    </Typography>
                    {supportedTypes.video.map((type) => (
                      <Chip
                        key={type.type}
                        label={type.description}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Collection Cover Art - Single cover for all tracks */}
            {files.length > 0 && (
              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  Collection Cover Art
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  This cover will be used for all {files.length} track{files.length > 1 ? 's' : ''} in this upload
                </Typography>
                <CollectionCoverUploader
                  coverFile={collectionCoverFile}
                  onCoverChange={(file) => {
                    setCollectionCoverFile(file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setCoverPreview(reader.result);
                      reader.readAsDataURL(file);
                    } else {
                      setCoverPreview(null);
                    }
                  }}
                  preview={coverPreview}
                  disabled={uploading}
                />
              </Box>
            )}

            {/* Selected Files List */}
            {files.length > 0 && (
              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  Selected Files ({files.length})
                </Typography>
                <List>
                  {files.map((fileData, index) => (
                    <ListItem key={fileData.id} divider>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center">
                            <span style={{ marginRight: 8 }}>
                              {getFileIcon(fileData.file)}
                            </span>
                            {fileData.file.name}
                            {validationErrors[fileData.id] && (
                              <Tooltip
                                title={validationErrors[fileData.id].join(", ")}
                              >
                                <ErrorIcon color="error" sx={{ ml: 1 }} />
                              </Tooltip>
                            )}
                          </Box>
                        }
                        secondary={`${formatFileSize(fileData.file.size)} • ${fileData.file.type}`}
                      />
                      <ListItemSecondaryAction>
                        <Button
                          size="small"
                          onClick={(e) => handleMetadataDialog(index, e)}
                          disabled={uploading}
                        >
                          Edit Metadata
                        </Button>
                        <IconButton
                          edge="end"
                          onClick={() => removeFile(fileData.id)}
                          disabled={uploading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Validation Errors */}
            {Object.keys(validationErrors).length > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Validation Errors:
                </Typography>
                {Object.entries(validationErrors).map(([fileId, errors]) => {
                  const fileName =
                    files.find((f) => f.id === fileId)?.file.name ||
                    "Unknown file";
                  return (
                    <Typography key={fileId} variant="body2">
                      {fileName}: {errors.join(", ")}
                    </Typography>
                  );
                })}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Metadata */}
      {currentStep >= 1 && files.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Metadata Configuration
            </Typography>

            {/* Batch Metadata Option */}
            <FormControlLabel
              control={
                <Switch
                  checked={enableBatchProcessing}
                  onChange={(e) => setEnableBatchProcessing(e.target.checked)}
                />
              }
              label="Apply same metadata to all files"
              sx={{ mb: 2 }}
            />

            {enableBatchProcessing && (
              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom>
                  Batch Metadata
                </Typography>
                <BatchMetadataForm
                  metadata={batchMetadata}
                  onChange={setBatchMetadata}
                  territorialOptions={territorialOptions}
                />
                <Button
                  variant="outlined"
                  onClick={applyBatchMetadata}
                  sx={{ mt: 2 }}
                >
                  Apply to All Files
                </Button>
              </Box>
            )}

            {/* Individual File Metadata */}
            {!enableBatchProcessing && (
              <Typography variant="body2" color="text.secondary">
                Click "Edit Metadata" on each file to configure individual
                metadata settings.
              </Typography>
            )}

            {/* Action Buttons */}
            <Box display="flex" justifyContent="space-between" mt={3}>
              <Button onClick={() => setCurrentStep(0)} disabled={uploading}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={() => setCurrentStep(2)}
                disabled={files.length === 0 || uploading}
              >
                Next: Upload
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Upload Progress */}
      {currentStep >= 2 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Upload Progress
            </Typography>

            {files.map((fileData) => (
              <Box key={fileData.id} mb={2}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="body2">{fileData.file.name}</Typography>
                  <Chip
                    label={processingStatus[fileData.id] || "pending"}
                    color={getStatusColor(processingStatus[fileData.id])}
                    size="small"
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress[fileData.id] || 0}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {Math.round(uploadProgress[fileData.id] || 0)}%
                </Typography>
              </Box>
            ))}

            <Box display="flex" justifyContent="space-between" mt={3}>
              <Button onClick={() => setCurrentStep(1)} disabled={uploading}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleStartUpload}
                disabled={uploading || files.length === 0}
                startIcon={uploading ? <RefreshIcon /> : <UploadIcon />}
              >
                {uploading ? "Uploading..." : "Start Upload"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete */}
      {currentStep >= 3 && (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <CheckIcon sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Upload Complete!
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Your files have been uploaded and are being processed.
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  setCurrentStep(0);
                  setFiles([]);
                  setUploadProgress({});
                  setProcessingStatus({});
                }}
                sx={{ mt: 2 }}
              >
                Upload More Files
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Metadata Dialog */}
      {metadataDialogOpen && selectedFileIndex !== null && (
        <MetadataDialog
          open={metadataDialogOpen}
          onClose={() => setMetadataDialogOpen(false)}
          file={files[selectedFileIndex]}
          onSave={(metadata) => {
            updateFileMetadata(files[selectedFileIndex].id, metadata);
            setMetadataDialogOpen(false);
          }}
          territorialOptions={territorialOptions}
        />
      )}
    </Box>
  );
};

// Batch Metadata Form Component
const BatchMetadataForm = ({
  metadata,
  onChange,
  territorialOptions
}) => (
  <Grid container spacing={2}>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        label="Artist"
        value={metadata.artist || ""}
        onChange={(e) => onChange({ ...metadata, artist: e.target.value })}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        label="Album"
        value={metadata.album || ""}
        onChange={(e) => onChange({ ...metadata, album: e.target.value })}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <FormControl fullWidth>
        <InputLabel>Main Genre</InputLabel>
        <Select
          value={metadata.mainGenre || ""}
          onChange={(e) => onChange({
            ...metadata,
            mainGenre: e.target.value,
            subGenre: '',
            additionalSubGenres: []
          })}
          label="Main Genre"
        >
          {MAIN_GENRES.map((genre) => (
            <MenuItem key={genre} value={genre}>
              {genre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>
    <Grid item xs={12} md={6}>
      <FormControl fullWidth disabled={!metadata.mainGenre}>
        <InputLabel>Primary Sub-Genre</InputLabel>
        <Select
          value={metadata.subGenre || ""}
          onChange={(e) => onChange({ ...metadata, subGenre: e.target.value })}
          label="Primary Sub-Genre"
        >
          {metadata.mainGenre && getSubgenres(metadata.mainGenre).map((subgenre) => (
            <MenuItem key={subgenre} value={subgenre}>
              {subgenre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>
    <Grid item xs={12} md={6}>
      <FormControl fullWidth>
        <InputLabel>Territorial Rights</InputLabel>
        <Select
          value={metadata.territorialRights || "worldwide"}
          onChange={(e) =>
            onChange({ ...metadata, territorialRights: e.target.value })
          }
          label="Territorial Rights"
        >
          {territorialOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        label="Label"
        value={metadata.label || ""}
        onChange={(e) => onChange({ ...metadata, label: e.target.value })}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        label="Copyright Owner"
        value={metadata.copyrightOwner || ""}
        onChange={(e) =>
          onChange({ ...metadata, copyrightOwner: e.target.value })
        }
      />
    </Grid>
  </Grid>
);

// Metadata Dialog Component
const MetadataDialog = ({
  open,
  onClose,
  file,
  onSave,
  territorialOptions
}) => {
  const [metadata, setMetadata] = useState({});

  React.useEffect(() => {
    if (file) {
      setMetadata(file.metadata);
    }
  }, [file]);

  const handleSave = () => {
    onSave(metadata);
  };

  if (!file) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Metadata: {file.file.name}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Is Album Toggle */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={metadata.isAlbum || false}
                  onChange={(e) =>
                    setMetadata({ ...metadata, isAlbum: e.target.checked })
                  }
                />
              }
              label="This is an Album"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={metadata.isAlbum ? "Album Title *" : "Track Title *"}
              value={metadata.title || ""}
              onChange={(e) =>
                setMetadata({ ...metadata, title: e.target.value })
              }
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Artist *"
              value={metadata.artist || ""}
              onChange={(e) =>
                setMetadata({ ...metadata, artist: e.target.value })
              }
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={metadata.isAlbum ? "Album Sub-title" : "Album Name"}
              value={metadata.album || ""}
              onChange={(e) =>
                setMetadata({ ...metadata, album: e.target.value })
              }
              helperText={metadata.isAlbum ? "Optional subtitle" : "Leave empty if single"}
            />
          </Grid>
          {/* Main Genre */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Main Genre *</InputLabel>
              <Select
                value={metadata.mainGenre || ""}
                onChange={(e) => {
                  setMetadata({
                    ...metadata,
                    mainGenre: e.target.value,
                    subGenre: '', // Reset sub-genre when main changes
                    additionalSubGenres: []
                  });
                }}
                label="Main Genre *"
              >
                {MAIN_GENRES.map((genre) => (
                  <MenuItem key={genre} value={genre}>
                    {genre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Sub-Genre */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={!metadata.mainGenre}>
              <InputLabel>Primary Sub-Genre *</InputLabel>
              <Select
                value={metadata.subGenre || ""}
                onChange={(e) =>
                  setMetadata({ ...metadata, subGenre: e.target.value })
                }
                label="Primary Sub-Genre *"
              >
                {metadata.mainGenre && getSubgenres(metadata.mainGenre).map((subgenre) => (
                  <MenuItem key={subgenre} value={subgenre}>
                    {subgenre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Additional Sub-Genres */}
          <Grid item xs={12}>
            <FormControl fullWidth disabled={!metadata.mainGenre || !metadata.subGenre}>
              <InputLabel>Additional Sub-Genres (max 3)</InputLabel>
              <Select
                multiple
                value={metadata.additionalSubGenres || []}
                label="Additional Sub-Genres (max 3)"
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 3) {
                    setMetadata({ ...metadata, additionalSubGenres: value });
                  }
                }}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {metadata.mainGenre && getSubgenres(metadata.mainGenre)
                  .filter(subgenre => subgenre !== metadata.subGenre)
                  .map(subgenre => (
                    <MenuItem
                      key={subgenre}
                      value={subgenre}
                      disabled={(metadata.additionalSubGenres || []).length >= 3 && !(metadata.additionalSubGenres || []).includes(subgenre)}
                    >
                      <Checkbox checked={(metadata.additionalSubGenres || []).indexOf(subgenre) > -1} />
                      {subgenre}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {(metadata.additionalSubGenres || []).length}/3 additional sub-genres selected
            </Typography>
          </Grid>

          {/* BPM */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="BPM (Beats Per Minute)"
              value={metadata.bpm || ""}
              onChange={(e) =>
                setMetadata({ ...metadata, bpm: e.target.value })
              }
              inputProps={{ min: 60, max: 200 }}
              helperText="Tempo of the track (60-200 BPM)"
            />
          </Grid>

          {/* Loopable */}
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={metadata.loopable || false}
                  onChange={(e) =>
                    setMetadata({ ...metadata, loopable: e.target.checked })
                  }
                />
              }
              label="Loopable (suitable for background music)"
              sx={{ mt: 2 }}
            />
          </Grid>

          {/* Mood Tags */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Mood Tags (select up to 3)</InputLabel>
              <Select
                multiple
                value={metadata.mood || []}
                label="Mood Tags (select up to 3)"
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 3) {
                    setMetadata({ ...metadata, mood: value });
                  }
                }}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" color="primary" />
                    ))}
                  </Box>
                )}
              >
                {MOOD_OPTIONS.map((mood) => (
                  <MenuItem
                    key={mood}
                    value={mood}
                    disabled={(metadata.mood || []).length >= 3 && !(metadata.mood || []).includes(mood)}
                  >
                    <Checkbox checked={(metadata.mood || []).indexOf(mood) > -1} />
                    {mood}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {(metadata.mood || []).length}/3 mood tags selected
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Release Date"
              type="date"
              value={metadata.releaseDate || ""}
              onChange={(e) =>
                setMetadata({ ...metadata, releaseDate: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="ISRC"
              value={metadata.isrc || ""}
              onChange={(e) =>
                setMetadata({ ...metadata, isrc: e.target.value })
              }
              helperText="International Standard Recording Code"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Territorial Rights</InputLabel>
              <Select
                value={metadata.territorialRights || "worldwide"}
                onChange={(e) =>
                  setMetadata({
                    ...metadata,
                    territorialRights: e.target.value
                  })
                }
                label="Territorial Rights"
              >
                {territorialOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Label"
              value={metadata.label || ""}
              onChange={(e) =>
                setMetadata({ ...metadata, label: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Copyright Owner"
              value={metadata.copyrightOwner || ""}
              onChange={(e) =>
                setMetadata({ ...metadata, copyrightOwner: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={metadata.description || ""}
              onChange={(e) =>
                setMetadata({ ...metadata, description: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={metadata.explicitContent || false}
                  onChange={(e) =>
                    setMetadata({
                      ...metadata,
                      explicitContent: e.target.checked
                    })
                  }
                />
              }
              label="Explicit Content"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Metadata
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Collection Cover Art Uploader - Single cover for all tracks
const CollectionCoverUploader = ({ coverFile, onCoverChange, preview, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (file) => {
    if (file && file.type.startsWith('image/')) {
      onCoverChange(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled) {
      const file = e.dataTransfer.files[0];
      handleFileChange(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onCoverChange(null);
  };

  return (
    <Box
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && document.getElementById('collection-cover-input').click()}
      sx={{
        border: "3px dashed",
        borderColor: isDragging ? "primary.main" : "grey.400",
        borderRadius: 2,
        p: 4,
        textAlign: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        backgroundColor: isDragging ? "action.hover" : "transparent",
        transition: "all 0.2s",
        minHeight: '250px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
        '&:hover': !disabled && {
          borderColor: "primary.main",
          backgroundColor: "action.hover"
        }
      }}
    >
      {preview ? (
        <Box sx={{ position: 'relative', maxWidth: '300px' }}>
          <img
            src={preview}
            alt="Collection Cover"
            style={{
              width: '100%',
              maxHeight: '250px',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />
          <IconButton
            size="medium"
            onClick={handleRemove}
            sx={{
              position: 'absolute',
              top: -16,
              right: -16,
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': { bgcolor: 'error.main', color: 'white' }
            }}
          >
            <DeleteIcon />
          </IconButton>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {coverFile?.name} ({(coverFile?.size / 1024).toFixed(2)} KB)
          </Typography>
        </Box>
      ) : (
        <Box>
          <UploadIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragging ? "Drop cover art here" : "Drag & drop cover art"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            or click to browse (JPG, PNG, 1000x1000 recommended)
          </Typography>
        </Box>
      )}
      <input
        id="collection-cover-input"
        type="file"
        hidden
        accept="image/*"
        onChange={(e) => handleFileChange(e.target.files[0])}
        disabled={disabled}
      />
    </Box>
  );
};

export default ContentUploadInterface;
