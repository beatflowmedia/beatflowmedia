// src/components/ContentUpload.js
// Advanced content upload component with progress tracking and validation
import React, { useState, useRef , useCallback } from "react";
import { contentIngestionService } from "../services/contentIngestionService";
import "./ContentUpload.css";

const ContentUpload = ({ onUploadComplete, onUploadError }) => {
  const [uploadState, setUploadState] = useState({
    file: null,
    metadata: {
      title: "",
      artist: "",
      album: "",
      genre: "",
      isrc: "",
      territorialRights: "worldwide",
      releaseDate: "",
      label: "",
      copyrightOwner: ""
    },
    validation: { valid: true, errors: [], warnings: [] },
    uploading: false,
    processing: false,
    progress: 0,
    currentStep: "upload", // upload, validation, transcoding, packaging, drm, complete
    error: null,
    contentId: null
  });

  const fileInputRef = useRef(null);
  const uploaderRef = useRef(null);

  // Handle file selection
  const handleFileSelect = useCallback(
    (event) => {
      const file = event.target.files[0];
      if (!file) return;

      // Validate file immediately
      const validation = contentIngestionService.validateContent(
        file,
        uploadState.metadata,
      );

      setUploadState((prev) => ({
        ...prev,
        file,
        validation,
        error: null
      }));
    },
    [uploadState.metadata],
  );

  // Handle metadata changes
  const handleMetadataChange = useCallback(
    (field, value) => {
      const newMetadata = { ...uploadState.metadata, [field]: value };

      // Re-validate with new metadata
      const validation = uploadState.file
        ? contentIngestionService.validateContent(uploadState.file, newMetadata)
        : { valid: true, errors: [], warnings: [] };

      setUploadState((prev) => ({
        ...prev,
        metadata: newMetadata,
        validation
      }));
    },
    [uploadState.file, uploadState.metadata],
  );

  // Start upload process
  const handleStartUpload = useCallback(async () => {
    if (!uploadState.file || !uploadState.validation.valid) return;

    setUploadState((prev) => ({ ...prev, uploading: true, error: null }));

    try {
      // Create uploader instance
      const uploader = contentIngestionService.getUploadProgress(
        uploadState.file,
        uploadState.metadata,
        // onProgress
        (progress) => {
          setUploadState((prev) => ({ ...prev, progress }));
        },
        // onComplete
        async (uploadId) => {
          setUploadState((prev) => ({
            ...prev,
            uploading: false,
            processing: true,
            contentId: uploadId,
            currentStep: "validation"
          }));

          // Start monitoring processing
          await monitorProcessing(uploadId);
        },
        // onError
        (error) => {
          setUploadState((prev) => ({
            ...prev,
            uploading: false,
            error: error.message
          }));
          onUploadError?.(error);
        },
      );

      uploaderRef.current = uploader;
      await uploader.start();
    } catch (error) {
      setUploadState((prev) => ({
        ...prev,
        uploading: false,
        error: error.message
      }));
      onUploadError?.(error);
    }
  }, [
    uploadState.file,
    uploadState.metadata,
    uploadState.validation.valid,
    onUploadError,
  ]);

  // Monitor processing status
  const monitorProcessing = useCallback(
    async (contentId) => {
      try {
        await contentIngestionService.waitForProcessing(contentId, (status) => {
          // Update current step based on processing status
          const stepMap = {
            pending_validation: "validation",
            validating: "validation",
            pending_virus_scan: "validation",
            virus_scanning: "validation",
            pending_metadata_extraction: "validation",
            extracting_metadata: "validation",
            pending_transcoding: "transcoding",
            transcoding: "transcoding",
            pending_packaging: "packaging",
            packaging: "packaging",
            pending_drm: "drm",
            setting_up_drm: "drm",
            completed: "complete",
            failed: "error",
            quarantined: "error"
          };

          const currentStep = stepMap[status.status] || uploadState.currentStep;

          setUploadState((prev) => ({
            ...prev,
            currentStep,
            progress: status.overallProgress || 0
          }));
        });

        // Processing completed successfully
        setUploadState((prev) => ({
          ...prev,
          processing: false,
          currentStep: "complete"
        }));

        onUploadComplete?.(contentId);
      } catch (error) {
        setUploadState((prev) => ({
          ...prev,
          processing: false,
          error: error.message,
          currentStep: "error"
        }));
        onUploadError?.(error);
      }
    },
    [uploadState.currentStep, onUploadComplete, onUploadError],
  );

  // Cancel upload
  const handleCancel = useCallback(async () => {
    if (uploaderRef.current) {
      uploaderRef.current.abort?.();
    }

    if (uploadState.contentId && uploadState.processing) {
      try {
        await contentIngestionService.cancelProcessing(uploadState.contentId);
      } catch (error) {
        console.error("Error canceling processing:", error);
      }
    }

    setUploadState({
      file: null,
      metadata: {
        title: "",
        artist: "",
        album: "",
        genre: "",
        isrc: "",
        territorialRights: "worldwide",
        releaseDate: "",
        label: "",
        copyrightOwner: ""
      },
      validation: { valid: true, errors: [], warnings: [] },
      uploading: false,
      processing: false,
      progress: 0,
      currentStep: "upload",
      error: null,
      contentId: null
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [uploadState.contentId, uploadState.processing]);

  // Drag and drop handlers
  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      const files = event.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        const validation = contentIngestionService.validateContent(
          file,
          uploadState.metadata,
        );

        setUploadState((prev) => ({
          ...prev,
          file,
          validation,
          error: null
        }));
      }
    },
    [uploadState.metadata],
  );

  const renderUploadArea = () => (
    <div
      className="upload-area"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,video/*"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      {uploadState.file ? (
        <div className="file-selected">
          <div className="file-icon">📁</div>
          <div className="file-info">
            <div className="file-name">{uploadState.file.name}</div>
            <div className="file-size">
              {contentIngestionService.formatFileSize(uploadState.file.size)}
            </div>
            <div className="file-type">{uploadState.file.type}</div>
          </div>
          <button
            className="remove-file"
            onClick={(e) => {
              e.stopPropagation();
              setUploadState((prev) => ({ ...prev, file: null }));
              fileInputRef.current.value = "";
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="upload-prompt">
          <div className="upload-icon">⬆️</div>
          <div className="upload-text">
            <div>Drag and drop your file here</div>
            <div>or click to browse</div>
          </div>
          <div className="supported-formats">
            Supported: MP3, WAV, FLAC, AAC, MP4, MOV, AVI, MKV
          </div>
        </div>
      )}
    </div>
  );

  const renderMetadataForm = () => (
    <div className="metadata-form">
      <h3>Content Information</h3>

      <div className="form-row">
        <div className="form-group">
          <label>Title *</label>
          <input
            type="text"
            value={uploadState.metadata.title}
            onChange={(e) => handleMetadataChange("title", e.target.value)}
            placeholder="Song/Video title"
            maxLength={200}
          />
        </div>

        <div className="form-group">
          <label>Artist *</label>
          <input
            type="text"
            value={uploadState.metadata.artist}
            onChange={(e) => handleMetadataChange("artist", e.target.value)}
            placeholder="Artist name"
            maxLength={200}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Album</label>
          <input
            type="text"
            value={uploadState.metadata.album}
            onChange={(e) => handleMetadataChange("album", e.target.value)}
            placeholder="Album name"
          />
        </div>

        <div className="form-group">
          <label>Genre</label>
          <select
            value={uploadState.metadata.genre}
            onChange={(e) => handleMetadataChange("genre", e.target.value)}
          >
            <option value="">Select genre</option>
            {contentIngestionService.getGenreOptions().map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>ISRC Code</label>
          <input
            type="text"
            value={uploadState.metadata.isrc}
            onChange={(e) =>
              handleMetadataChange("isrc", e.target.value.toUpperCase())
            }
            placeholder="USRC17607839"
            maxLength={12}
          />
          <small>International Standard Recording Code (optional)</small>
        </div>

        <div className="form-group">
          <label>Territorial Rights</label>
          <select
            value={uploadState.metadata.territorialRights}
            onChange={(e) =>
              handleMetadataChange("territorialRights", e.target.value)
            }
          >
            {contentIngestionService
              .getTerritorialRightsOptions()
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Release Date</label>
          <input
            type="date"
            value={uploadState.metadata.releaseDate}
            onChange={(e) =>
              handleMetadataChange("releaseDate", e.target.value)
            }
          />
        </div>

        <div className="form-group">
          <label>Label</label>
          <input
            type="text"
            value={uploadState.metadata.label}
            onChange={(e) => handleMetadataChange("label", e.target.value)}
            placeholder="Record label"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Copyright Owner</label>
        <input
          type="text"
          value={uploadState.metadata.copyrightOwner}
          onChange={(e) =>
            handleMetadataChange("copyrightOwner", e.target.value)
          }
          placeholder="Copyright holder"
        />
      </div>
    </div>
  );

  const renderValidation = () => (
    <div className="validation-section">
      {uploadState.validation.errors.length > 0 && (
        <div className="validation-errors">
          <h4>❌ Errors</h4>
          <ul>
            {uploadState.validation.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {uploadState.validation.warnings.length > 0 && (
        <div className="validation-warnings">
          <h4>⚠️ Warnings</h4>
          <ul>
            {uploadState.validation.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {uploadState.validation.valid && uploadState.file && (
        <div className="validation-success">✅ Content is ready for upload</div>
      )}
    </div>
  );

  const renderProgressSteps = () => {
    const steps = [
      { key: "upload", label: "Upload", icon: "⬆️" },
      { key: "validation", label: "Validation", icon: "🔍" },
      { key: "transcoding", label: "Transcoding", icon: "⚙️" },
      { key: "packaging", label: "Packaging", icon: "📦" },
      { key: "drm", label: "DRM Setup", icon: "🔒" },
      { key: "complete", label: "Complete", icon: "✅" },
    ];

    const currentIndex = steps.findIndex(
      (step) => step.key === uploadState.currentStep,
    );

    return (
      <div className="progress-steps">
        {steps.map((step, index) => (
          <div
            key={step.key}
            className={`step ${index <= currentIndex ? "completed" : ""} ${index === currentIndex ? "active" : ""}`}
          >
            <div className="step-icon">{step.icon}</div>
            <div className="step-label">{step.label}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderProgress = () => (
    <div className="upload-progress">
      <div className="progress-header">
        <div className="progress-title">
          {uploadState.uploading ? "Uploading..." : "Processing..."}
        </div>
        <div className="progress-percentage">
          {Math.round(uploadState.progress * 100)}%
        </div>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${uploadState.progress * 100}%` }}
        />
      </div>

      {(uploadState.processing || uploadState.uploading) &&
        renderProgressSteps()}
    </div>
  );

  return (
    <div className="content-upload">
      <h2>Upload Content</h2>

      {uploadState.error && (
        <div className="error-message">❌ {uploadState.error}</div>
      )}

      {!uploadState.uploading && !uploadState.processing && (
        <>
          {renderUploadArea()}
          {uploadState.file && renderMetadataForm()}
          {uploadState.file && renderValidation()}

          <div className="upload-actions">
            <button
              className="upload-button"
              onClick={handleStartUpload}
              disabled={!uploadState.file || !uploadState.validation.valid}
            >
              Start Upload
            </button>

            {uploadState.file && (
              <button className="cancel-button" onClick={handleCancel}>
                Clear
              </button>
            )}
          </div>
        </>
      )}

      {(uploadState.uploading || uploadState.processing) && (
        <>
          {renderProgress()}

          <div className="upload-actions">
            <button className="cancel-button" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </>
      )}

      {uploadState.currentStep === "complete" && (
        <div className="upload-complete">
          <div className="success-icon">🎉</div>
          <div className="success-message">
            Content uploaded and processed successfully!
          </div>
          <div className="content-id">Content ID: {uploadState.contentId}</div>

          <button className="upload-another-button" onClick={handleCancel}>
            Upload Another File
          </button>
        </div>
      )}
    </div>
  );
};

export default ContentUpload;
