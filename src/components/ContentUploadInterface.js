// src/components/ContentUploadInterface.js
// Enhanced content upload interface with drag-and-drop, progress tracking, and metadata forms
import React, { useState, useRef , useCallback } from "react";
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
  FormControlLabel
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon as PauseIcon
} from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import { contentIngestionService } from "../services/contentIngestionService";
import { Tooltip } from '@mui/material/Tooltip';

const ContentUploadInterface = ({ onUploadComplete, onUploadError }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [processingStatus, setProcessingStatus] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState(null);
  const [batchMetadata, setBatchMetadata] = useState({});
  const [enableBatchProcessing, setEnableBatchProcessing] = useState(false);

  const fileInputRef = useRef(null);
  const supportedTypes = contentIngestionService.getSupportedFileTypes();
  const territorialOptions =
    contentIngestionService.getTerritorialRightsOptions();
  const genreOptions = contentIngestionService.getGenreOptions();

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
    genre: "",
    releaseDate: "",
    isrc: "",
    territorialRights: "worldwide",
    label: "",
    copyrightOwner: "",
    description: "",
    tags: [],
    explicitContent: false
  };

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
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

    // Add accepted files
    const newFiles = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      metadata: { ...defaultMetadata },
      validated: false,
      uploadId: null,
      status: "pending"
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Auto-advance to metadata step if files are added
    if (newFiles.length > 0 && currentStep === 0) {
      setCurrentStep(1);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".flac", ".aac", ".ogg"],
      "video/*": [".mp4", ".mov", ".avi", ".mkv"]
    },
    maxSize: 5 * 1024 * 1024 * 1024, // 5GB
    multiple: true
  });

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    onDrop(selectedFiles, []);
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
      const validation = contentIngestionService.validateContent(
        fileData.file,
        fileData.metadata,
      );
      if (!validation.valid) {
        errors[fileData.id] = validation.errors;
        allValid = false;
      }

      // Update file validation status
      fileData.validated = validation.valid;
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
      for (const fileData of files) {
        await uploadSingleFile(fileData);
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

  const uploadSingleFile = async (fileData) => {
    try {
      // Set up progress tracking
      setUploadProgress((prev) => ({ ...prev, [fileData.id]: 0 }));
      setProcessingStatus((prev) => ({ ...prev, [fileData.id]: "uploading" }));

      // Start upload
      const result = await contentIngestionService.uploadContent(
        fileData.file,
        fileData.metadata,
      );

      // Update upload complete
      setUploadProgress((prev) => ({ ...prev, [fileData.id]: 100 }));
      setProcessingStatus((prev) => ({ ...prev, [fileData.id]: "processing" }));

      // Monitor processing
      await contentIngestionService.waitForProcessing(
        result.uploadId,
        (status) => {
          setProcessingStatus((prev) => ({
            ...prev,
            [fileData.id]: status.status
          }));
        },
      );

      // Update file with result
      fileData.uploadId = result.uploadId;
      fileData.status = "completed";
    } catch (error) {
      setProcessingStatus((prev) => ({ ...prev, [fileData.id]: "failed" }));
      fileData.status = "failed";
      throw error;
    }
  };

  const handleMetadataDialog = (fileIndex) => {
    setSelectedFileIndex(fileIndex);
    setMetadataDialogOpen(true);
  };

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
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="audio/*,video/*"
                style={{ display: "none" }}
                onChange={handleFileInputChange}
              />
            </Paper>

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

            {/* Selected Files */}
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
                          onClick={() => handleMetadataDialog(index)}
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
                  genreOptions={genreOptions}
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
      <MetadataDialog
        open={metadataDialogOpen}
        onClose={() => setMetadataDialogOpen(false)}
        file={selectedFileIndex !== null ? files[selectedFileIndex] : null}
        onSave={(metadata) => {
          if (selectedFileIndex !== null) {
            updateFileMetadata(files[selectedFileIndex].id, metadata);
          }
          setMetadataDialogOpen(false);
        }}
        territorialOptions={territorialOptions}
        genreOptions={genreOptions}
      />
    </Box>
  );
};

// Batch Metadata Form Component
const BatchMetadataForm = ({
  metadata,
  onChange,
  territorialOptions,
  genreOptions
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
        <InputLabel>Genre</InputLabel>
        <Select
          value={metadata.genre || ""}
          onChange={(e) => onChange({ ...metadata, genre: e.target.value })}
          label="Genre"
        >
          {genreOptions.map((genre) => (
            <MenuItem key={genre} value={genre}>
              {genre}
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
  territorialOptions,
  genreOptions
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
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Title *"
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
              label="Album"
              value={metadata.album || ""}
              onChange={(e) =>
                setMetadata({ ...metadata, album: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Genre</InputLabel>
              <Select
                value={metadata.genre || ""}
                onChange={(e) =>
                  setMetadata({ ...metadata, genre: e.target.value })
                }
                label="Genre"
              >
                {genreOptions.map((genre) => (
                  <MenuItem key={genre} value={genre}>
                    {genre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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

export default ContentUploadInterface;
