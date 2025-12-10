/**
 * AudioFileValidator - Validates audio/video files for content ingestion
 *
 * Validates:
 * - File format and MIME type
 * - File size limits
 * - Audio quality parameters
 * - Video quality parameters (for video files)
 *
 * Based on validation rules from netlify/functions/content-ingestion/validate-content.js
 */

const fs = require('fs').promises;
const path = require('path');

class AudioFileValidator {
  constructor(options = {}) {
    this.options = {
      strictMode: options.strictMode || false,
      requireMinBitrate: options.requireMinBitrate !== false,
      minAudioBitrate: options.minAudioBitrate || 128, // kbps
      minVideoBitrate: options.minVideoBitrate || 1000, // kbps
      ...options
    };

    // Supported formats with size limits (from validate-content.js)
    this.SUPPORTED_FORMATS = {
      audio: {
        'audio/mpeg': {
          extensions: ['.mp3'],
          maxSize: 500 * 1024 * 1024, // 500MB
          mimeTypes: ['audio/mpeg', 'audio/mp3']
        },
        'audio/wav': {
          extensions: ['.wav'],
          maxSize: 1024 * 1024 * 1024, // 1GB
          mimeTypes: ['audio/wav', 'audio/x-wav', 'audio/wave']
        },
        'audio/flac': {
          extensions: ['.flac'],
          maxSize: 1024 * 1024 * 1024, // 1GB
          mimeTypes: ['audio/flac', 'audio/x-flac']
        },
        'audio/aac': {
          extensions: ['.aac', '.m4a'],
          maxSize: 500 * 1024 * 1024, // 500MB
          mimeTypes: ['audio/aac', 'audio/aacp', 'audio/x-m4a', 'audio/mp4']
        },
        'audio/ogg': {
          extensions: ['.ogg'],
          maxSize: 500 * 1024 * 1024, // 500MB
          mimeTypes: ['audio/ogg', 'audio/vorbis', 'audio/opus']
        }
      },
      video: {
        'video/mp4': {
          extensions: ['.mp4'],
          maxSize: 5 * 1024 * 1024 * 1024, // 5GB
          mimeTypes: ['video/mp4', 'video/x-m4v']
        },
        'video/quicktime': {
          extensions: ['.mov'],
          maxSize: 5 * 1024 * 1024 * 1024,
          mimeTypes: ['video/quicktime', 'video/x-quicktime']
        },
        'video/x-msvideo': {
          extensions: ['.avi'],
          maxSize: 5 * 1024 * 1024 * 1024,
          mimeTypes: ['video/x-msvideo', 'video/avi', 'video/msvideo']
        },
        'video/x-matroska': {
          extensions: ['.mkv'],
          maxSize: 5 * 1024 * 1024 * 1024,
          mimeTypes: ['video/x-matroska', 'video/mkv']
        }
      }
    };
  }

  /**
   * Validate a file for content ingestion
   * @param {Object} fileInfo - File information
   * @param {string} fileInfo.filePath - Path to the file
   * @param {string} fileInfo.fileName - Name of the file
   * @param {number} fileInfo.fileSize - Size of the file in bytes
   * @param {string} fileInfo.mimeType - MIME type of the file
   * @returns {Promise<Object>} Validation results
   */
  async validateFile(fileInfo) {
    const results = {
      passed: true,
      errors: [],
      warnings: [],
      details: {
        format: null,
        contentType: null,
        extension: null,
        sizeCheck: null,
        qualityCheck: null
      }
    };

    try {
      // 1. Basic file existence check
      if (fileInfo.filePath) {
        try {
          await fs.access(fileInfo.filePath);
        } catch (error) {
          results.passed = false;
          results.errors.push({
            type: 'FILE_NOT_FOUND',
            message: `File not found: ${fileInfo.filePath}`,
            severity: 'CRITICAL'
          });
          return results;
        }
      }

      // 2. Extract file extension
      const ext = path.extname(fileInfo.fileName).toLowerCase();
      results.details.extension = ext;

      // 3. Validate file format
      const formatValidation = this.validateFormat(ext, fileInfo.mimeType);
      if (!formatValidation.valid) {
        results.passed = false;
        results.errors.push(...formatValidation.errors);
      } else {
        results.details.format = formatValidation.format;
        results.details.contentType = formatValidation.contentType;
      }

      // 4. Validate file size
      const sizeValidation = this.validateFileSize(
        fileInfo.fileSize,
        formatValidation.format,
        formatValidation.contentType
      );
      if (!sizeValidation.valid) {
        results.passed = false;
        results.errors.push(...sizeValidation.errors);
      }
      results.details.sizeCheck = sizeValidation;
      results.warnings.push(...sizeValidation.warnings);

      // 5. Extract basic metadata (if file path provided)
      if (fileInfo.filePath && results.passed) {
        const metadata = await this.extractBasicMetadata(
          fileInfo.filePath,
          formatValidation.contentType
        );
        results.details.metadata = metadata;

        // 6. Quality validation
        if (this.options.requireMinBitrate) {
          const qualityValidation = this.validateQuality(
            metadata,
            formatValidation.contentType
          );
          results.details.qualityCheck = qualityValidation;
          results.warnings.push(...qualityValidation.warnings);
        }
      }

    } catch (error) {
      results.passed = false;
      results.errors.push({
        type: 'VALIDATION_ERROR',
        message: `Validation failed: ${error.message}`,
        severity: 'CRITICAL',
        details: error.stack
      });
    }

    return results;
  }

  /**
   * Validate file format and MIME type
   */
  validateFormat(extension, mimeType) {
    const result = {
      valid: false,
      format: null,
      contentType: null,
      errors: []
    };

    // Check all supported formats
    for (const [contentType, formats] of Object.entries({
      ...this.SUPPORTED_FORMATS.audio,
      ...this.SUPPORTED_FORMATS.video
    })) {
      if (formats.extensions.includes(extension)) {
        result.valid = true;
        result.format = formats;
        result.contentType = contentType.startsWith('audio/') ? 'audio' : 'video';

        // Verify MIME type matches
        if (mimeType && !formats.mimeTypes.includes(mimeType)) {
          result.errors.push({
            type: 'MIME_TYPE_MISMATCH',
            message: `MIME type '${mimeType}' doesn't match extension '${extension}'`,
            severity: this.options.strictMode ? 'CRITICAL' : 'HIGH',
            expectedMimeTypes: formats.mimeTypes
          });

          if (this.options.strictMode) {
            result.valid = false;
          }
        }

        return result;
      }
    }

    // Format not supported
    result.errors.push({
      type: 'UNSUPPORTED_FORMAT',
      message: `Unsupported file format: ${extension}`,
      severity: 'CRITICAL',
      supportedFormats: {
        audio: Object.values(this.SUPPORTED_FORMATS.audio)
          .flatMap(f => f.extensions),
        video: Object.values(this.SUPPORTED_FORMATS.video)
          .flatMap(f => f.extensions)
      }
    });

    return result;
  }

  /**
   * Validate file size against format limits
   */
  validateFileSize(fileSize, format, contentType) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      sizeInBytes: fileSize,
      sizeInMB: (fileSize / (1024 * 1024)).toFixed(2),
      maxSizeInMB: format ? (format.maxSize / (1024 * 1024)).toFixed(2) : 'N/A'
    };

    if (!fileSize || fileSize <= 0) {
      result.valid = false;
      result.errors.push({
        type: 'INVALID_FILE_SIZE',
        message: 'File size is invalid or zero',
        severity: 'CRITICAL'
      });
      return result;
    }

    if (!format) {
      return result;
    }

    // Check against max size
    if (fileSize > format.maxSize) {
      result.valid = false;
      result.errors.push({
        type: 'FILE_TOO_LARGE',
        message: `File size (${result.sizeInMB}MB) exceeds maximum allowed size (${result.maxSizeInMB}MB)`,
        severity: 'CRITICAL',
        fileSize: fileSize,
        maxSize: format.maxSize
      });
    }

    // Warning for very small files
    const minReasonableSize = contentType === 'audio' ? 1024 * 100 : 1024 * 500; // 100KB audio, 500KB video
    if (fileSize < minReasonableSize) {
      result.warnings.push({
        type: 'FILE_VERY_SMALL',
        message: `File size (${result.sizeInMB}MB) is unusually small for ${contentType} content`,
        severity: 'LOW'
      });
    }

    return result;
  }

  /**
   * Extract basic metadata from file
   * Note: In production, this would use libraries like ffprobe/mediainfo
   * For now, returns placeholder structure
   */
  async extractBasicMetadata(filePath, contentType) {
    const metadata = {
      format: null,
      duration: null,
      bitrate: null,
      sampleRate: null,
      channels: null,
      codec: null
    };

    // TODO: Integrate with ffprobe or mediainfo
    // For now, return placeholder indicating metadata extraction needed
    metadata._placeholder = true;
    metadata._note = 'Full metadata extraction requires ffprobe integration';

    return metadata;
  }

  /**
   * Validate audio/video quality parameters
   */
  validateQuality(metadata, contentType) {
    const result = {
      valid: true,
      warnings: []
    };

    if (metadata._placeholder) {
      result.warnings.push({
        type: 'METADATA_NOT_EXTRACTED',
        message: 'Quality validation skipped - metadata extraction not implemented',
        severity: 'LOW'
      });
      return result;
    }

    // Audio quality checks
    if (contentType === 'audio') {
      if (metadata.bitrate && metadata.bitrate < this.options.minAudioBitrate) {
        result.warnings.push({
          type: 'LOW_AUDIO_BITRATE',
          message: `Audio bitrate (${metadata.bitrate}kbps) is below recommended minimum (${this.options.minAudioBitrate}kbps)`,
          severity: 'MEDIUM',
          actualBitrate: metadata.bitrate,
          recommendedBitrate: this.options.minAudioBitrate
        });
      }

      if (metadata.sampleRate && metadata.sampleRate < 44100) {
        result.warnings.push({
          type: 'LOW_SAMPLE_RATE',
          message: `Sample rate (${metadata.sampleRate}Hz) is below CD quality (44100Hz)`,
          severity: 'LOW',
          actualSampleRate: metadata.sampleRate,
          recommendedSampleRate: 44100
        });
      }
    }

    // Video quality checks
    if (contentType === 'video') {
      if (metadata.bitrate && metadata.bitrate < this.options.minVideoBitrate) {
        result.warnings.push({
          type: 'LOW_VIDEO_BITRATE',
          message: `Video bitrate (${metadata.bitrate}kbps) is below recommended minimum (${this.options.minVideoBitrate}kbps)`,
          severity: 'MEDIUM',
          actualBitrate: metadata.bitrate,
          recommendedBitrate: this.options.minVideoBitrate
        });
      }
    }

    return result;
  }

  /**
   * Batch validate multiple files
   */
  async validateBatch(files) {
    const results = {
      totalFiles: files.length,
      passed: 0,
      failed: 0,
      warnings: 0,
      files: []
    };

    for (const file of files) {
      const validation = await this.validateFile(file);

      results.files.push({
        fileName: file.fileName,
        validation
      });

      if (validation.passed) {
        results.passed++;
      } else {
        results.failed++;
      }

      if (validation.warnings.length > 0) {
        results.warnings += validation.warnings.length;
      }
    }

    return results;
  }

  /**
   * Get supported formats summary
   */
  getSupportedFormats() {
    return {
      audio: Object.entries(this.SUPPORTED_FORMATS.audio).map(([mimeType, config]) => ({
        mimeType,
        extensions: config.extensions,
        maxSizeMB: (config.maxSize / (1024 * 1024)).toFixed(0)
      })),
      video: Object.entries(this.SUPPORTED_FORMATS.video).map(([mimeType, config]) => ({
        mimeType,
        extensions: config.extensions,
        maxSizeMB: (config.maxSize / (1024 * 1024)).toFixed(0)
      }))
    };
  }
}

module.exports = AudioFileValidator;
