// src/services/contentIngestionService.js
// Frontend service for content ingestion workflow
import { storage } from "../firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// TUS client for resumable uploads
class TusUploadClient {
  constructor(file, metadata = {}) {
    this.file = file;
    this.metadata = metadata;
    this.uploadId = null;
    this.uploadUrl = null;
    this.uploadedBytes = 0;
    this.chunkSize = 1024 * 1024; // 1MB chunks
    this.onProgress = null;
    this.onSuccess = null;
    this.onError = null;
  }

  async start() {
    try {
      // Initialize upload session
      const initResponse = await this.initializeUpload();
      if (!initResponse.ok) {
        throw new Error("Failed to initialize upload");
      }

      const { uploadId, uploadUrl } = await initResponse.json();
      this.uploadId = uploadId;
      this.uploadUrl = uploadUrl;

      // Start chunked upload
      await this.uploadChunks();
    } catch (error) {
      this.onError?.(error);
    }
  }

  async initializeUpload() {
    const metadataHeader = this.encodeMetadata(this.metadata);

    return fetch("/.netlify/functions/content-ingestion/upload-init", {
      method: "POST",
      headers: {
        "Upload-Length": this.file.size.toString(),
        "Upload-Metadata": metadataHeader,
        "Tus-Resumable": "1.0.0",
        Authorization: `Bearer ${await this.getAuthToken()}`
      }
    });
  }

  async uploadChunks() {
    while (this.uploadedBytes < this.file.size) {
      const chunk = this.file.slice(
        this.uploadedBytes,
        Math.min(this.uploadedBytes + this.chunkSize, this.file.size),
      );

      const success = await this.uploadChunk(chunk);
      if (!success) {
        throw new Error("Chunk upload failed");
      }

      this.uploadedBytes += chunk.size;
      this.onProgress?.(this.uploadedBytes / this.file.size);
    }

    this.onSuccess?.(this.uploadId);
  }

  async uploadChunk(chunk) {
    try {
      const response = await fetch(this.uploadUrl, {
        method: "PATCH",
        headers: {
          "Upload-Offset": this.uploadedBytes.toString(),
          "Content-Type": "application/offset+octet-stream",
          "Tus-Resumable": "1.0.0"
        },
        body: chunk
      });

      return response.status === 204;
    } catch (error) {
      console.error("Chunk upload error:", error);
      return false;
    }
  }

  encodeMetadata(metadata) {
    return Object.entries(metadata)
      .map(([key, value]) => `${key} ${btoa(String(value))}`)
      .join(",");
  }

  async getAuthToken() {
    // Get Firebase auth token
    const user = auth.currentUser;
    return user ? await user.getIdToken() : null;
  }
}

// Content ingestion service class
export class ContentIngestionService {
  constructor() {
    this.apiBase = "/.netlify/functions/content-ingestion";
  }

  // Upload content with resumable upload
  async uploadContent(file, metadata = {}) {
    return new Promise((resolve, reject) => {
      const uploader = new TusUploadClient(file, {
        filename: file.name,
        filetype: file.type,
        ...metadata
      });

      uploader.onProgress = (progress) => {
        this.notifyProgress?.("upload", progress);
      };

      uploader.onSuccess = (uploadId) => {
        resolve({ uploadId, status: "uploaded" });
      };

      uploader.onError = (error) => {
        reject(error);
      };

      uploader.start();
    });
  }

  // Monitor content processing status
  async getProcessingStatus(contentId) {
    try {
      const response = await fetch(`${this.apiBase}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({ contentId })
      });

      if (!response.ok) {
        throw new Error("Failed to get processing status");
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting processing status:", error);
      throw error;
    }
  }

  // Get content details after processing
  async getContentDetails(contentId) {
    try {
      const response = await fetch(`${this.apiBase}/content-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({ contentId })
      });

      if (!response.ok) {
        throw new Error("Failed to get content details");
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting content details:", error);
      throw error;
    }
  }

  // Validate content before upload
  validateContent(file, metadata) {
    const errors = [];
    const warnings = [];

    // File size validation
    const maxSizes = {
      "audio/mpeg": 500 * 1024 * 1024, // 500MB
      "audio/wav": 1024 * 1024 * 1024, // 1GB
      "audio/flac": 1024 * 1024 * 1024, // 1GB
      "video/mp4": 5 * 1024 * 1024 * 1024, // 5GB
    };

    const maxSize = maxSizes[file.type];
    if (maxSize && file.size > maxSize) {
      errors.push(
        `File size exceeds maximum allowed (${this.formatFileSize(maxSize)})`,
      );
    }

    // File type validation
    const supportedTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/flac",
      "audio/aac",
      "audio/ogg",
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-matroska",
    ];

    if (!supportedTypes.includes(file.type)) {
      errors.push(`Unsupported file type: ${file.type}`);
    }

    // Metadata validation
    if (!metadata.title || metadata.title.trim().length === 0) {
      errors.push("Title is required");
    }

    if (!metadata.artist || metadata.artist.trim().length === 0) {
      errors.push("Artist is required");
    }

    if (metadata.title && metadata.title.length > 200) {
      errors.push("Title must be 200 characters or less");
    }

    if (metadata.artist && metadata.artist.length > 200) {
      errors.push("Artist name must be 200 characters or less");
    }

    // ISRC validation
    if (metadata.isrc) {
      const isrcRegex = /^[A-Z]{2}[A-Z0-9]{3}[0-9]{2}[0-9]{5}$/;
      if (!isrcRegex.test(metadata.isrc)) {
        warnings.push(
          "ISRC format may be invalid. Expected format: CC-XXX-YY-NNNNN",
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Poll processing status until completion
  async waitForProcessing(contentId, onStatusUpdate = null) {
    const maxWaitTime = 30 * 60 * 1000; // 30 minutes
    const pollInterval = 5000; // 5 seconds
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          if (Date.now() - startTime > maxWaitTime) {
            reject(new Error("Processing timeout"));
            return;
          }

          const status = await this.getProcessingStatus(contentId);
          onStatusUpdate?.(status);

          if (status.status === "completed") {
            resolve(status);
          } else if (
            status.status === "failed" ||
            status.status === "quarantined"
          ) {
            reject(
              new Error(
                `Processing failed: ${status.error || "Unknown error"}`,
              ),
            );
          } else {
            setTimeout(poll, pollInterval);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  // Cancel processing
  async cancelProcessing(contentId) {
    try {
      const response = await fetch(`${this.apiBase}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({ contentId })
      });

      if (!response.ok) {
        throw new Error("Failed to cancel processing");
      }

      return await response.json();
    } catch (error) {
      console.error("Error canceling processing:", error);
      throw error;
    }
  }

  // Get upload progress for UI
  getUploadProgress(file, metadata, onProgress, onComplete, onError) {
    const uploader = new TusUploadClient(file, metadata);

    uploader.onProgress = onProgress;
    uploader.onSuccess = onComplete;
    uploader.onError = onError;

    return uploader;
  }

  // Utility functions
  formatFileSize(bytes) {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  async getAuthToken() {
    // Implementation depends on your auth system
    const user = window.firebase?.auth?.currentUser;
    return user ? await user.getIdToken() : null;
  }

  // Set progress callback
  setProgressCallback(callback) {
    this.notifyProgress = callback;
  }

  // Get supported file types
  getSupportedFileTypes() {
    return {
      audio: [
        { type: "audio/mpeg", extension: ".mp3", description: "MP3 Audio" },
        { type: "audio/wav", extension: ".wav", description: "WAV Audio" },
        { type: "audio/flac", extension: ".flac", description: "FLAC Audio" },
        { type: "audio/aac", extension: ".aac", description: "AAC Audio" },
        { type: "audio/ogg", extension: ".ogg", description: "OGG Audio" },
      ],
      video: [
        { type: "video/mp4", extension: ".mp4", description: "MP4 Video" },
        {
          type: "video/quicktime",
          extension: ".mov",
          description: "QuickTime Video"
        },
        {
          type: "video/x-msvideo",
          extension: ".avi",
          description: "AVI Video"
        },
        {
          type: "video/x-matroska",
          extension: ".mkv",
          description: "Matroska Video"
        },
      ]
    };
  }

  // Get territorial rights options
  getTerritorialRightsOptions() {
    return [
      { value: "worldwide", label: "Worldwide" },
      { value: "us", label: "United States" },
      { value: "eu", label: "European Union" },
      { value: "uk", label: "United Kingdom" },
      { value: "ca", label: "Canada" },
      { value: "au", label: "Australia" },
      { value: "jp", label: "Japan" },
      { value: "kr", label: "South Korea" },
      { value: "custom", label: "Custom Territory" },
    ];
  }

  // Get genre options
  getGenreOptions() {
    return [
      "Pop",
      "Rock",
      "Hip Hop",
      "R&B",
      "Country",
      "Electronic",
      "Jazz",
      "Classical",
      "Folk",
      "Blues",
      "Reggae",
      "Punk",
      "Metal",
      "Alternative",
      "Indie",
      "World",
      "Soundtrack",
      "Ambient",
      "Experimental",
      "Other",
    ];
  }
}

// Export singleton instance
export const contentIngestionService = new ContentIngestionService();
