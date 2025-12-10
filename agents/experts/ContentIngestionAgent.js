/**
 * ContentIngestionAgent - Automates content ingestion and validation workflows
 *
 * Features:
 * - File validation (format, size, quality)
 * - Metadata extraction (technical, embedded, music analysis)
 * - Upload session management
 * - Processing pipeline orchestration
 * - Integration with Firestore schema
 *
 * Based on DATABASE_SCHEMA.md and existing content ingestion services
 */

const AgentBase = require('../core/AgentBase');
const AudioFileValidator = require('../core/AudioFileValidator');
const MetadataExtractor = require('../core/MetadataExtractor');
const path = require('path');
const fs = require('fs').promises;

class ContentIngestionAgent extends AgentBase {
  constructor(config = {}) {
    super('ContentIngestion', config);

    this.validator = new AudioFileValidator({
      strictMode: config.strictMode || false,
      requireMinBitrate: config.requireMinBitrate !== false,
      minAudioBitrate: config.minAudioBitrate || 128,
      minVideoBitrate: config.minVideoBitrate || 1000
    });

    this.metadataExtractor = new MetadataExtractor({
      extractTechnical: config.extractTechnical !== false,
      extractMusic: config.extractMusic !== false,
      extractEmbedded: config.extractEmbedded !== false,
      analyzeMood: config.analyzeMood || false
    });

    // Processing pipeline stages
    this.PIPELINE_STAGES = [
      'validation',
      'virusScan',
      'metadataExtraction',
      'transcoding',
      'packaging',
      'drm'
    ];

    // Session tracking
    this.sessions = new Map();
  }

  /**
   * Process a single file through the ingestion pipeline
   * @param {Object} fileInfo - File information
   * @param {string} fileInfo.filePath - Path to the file
   * @param {string} fileInfo.fileName - Name of the file
   * @param {number} fileInfo.fileSize - Size of the file
   * @param {string} fileInfo.mimeType - MIME type
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Processing results
   */
  async processFile(fileInfo, metadata = {}) {
    this.logger.info(`Processing file: ${fileInfo.fileName}`);

    const sessionId = this.generateSessionId();
    const session = this.initializeSession(sessionId, fileInfo, metadata);

    try {
      // Stage 1: Validation
      session.processingSteps.validation.status = 'in_progress';
      session.processingSteps.validation.startedAt = new Date().toISOString();

      const validationResult = await this.validator.validateFile(fileInfo);

      session.processingSteps.validation.data = validationResult;
      session.processingSteps.validation.completedAt = new Date().toISOString();

      if (!validationResult.passed) {
        session.processingSteps.validation.status = 'failed';
        session.status = 'failed';
        session.error = 'Validation failed';
        session.errors.push(...validationResult.errors);

        this.logger.error(`Validation failed for ${fileInfo.fileName}`, {
          errors: validationResult.errors
        });

        return session;
      }

      session.processingSteps.validation.status = 'completed';
      this.logger.success(`Validation passed for ${fileInfo.fileName}`);

      // Stage 2: Virus Scan (placeholder)
      session.processingSteps.virusScan.status = 'in_progress';
      session.processingSteps.virusScan.startedAt = new Date().toISOString();

      const virusScanResult = await this.performVirusScan(fileInfo);

      session.processingSteps.virusScan.data = virusScanResult;
      session.processingSteps.virusScan.completedAt = new Date().toISOString();
      session.processingSteps.virusScan.status = virusScanResult.clean ? 'completed' : 'failed';

      if (!virusScanResult.clean) {
        session.status = 'failed';
        session.error = 'Virus scan failed';
        this.logger.error(`Virus scan failed for ${fileInfo.fileName}`);
        return session;
      }

      this.logger.success(`Virus scan passed for ${fileInfo.fileName}`);

      // Stage 3: Metadata Extraction
      session.processingSteps.metadataExtraction.status = 'in_progress';
      session.processingSteps.metadataExtraction.startedAt = new Date().toISOString();

      const extractedMetadata = await this.metadataExtractor.extractMetadata({
        filePath: fileInfo.filePath,
        fileName: fileInfo.fileName,
        contentType: validationResult.details.contentType
      });

      session.processingSteps.metadataExtraction.data = extractedMetadata;
      session.processingSteps.metadataExtraction.completedAt = new Date().toISOString();
      session.processingSteps.metadataExtraction.status = extractedMetadata.extracted ? 'completed' : 'failed';

      // Normalize metadata to schema format
      session.metadata = this.metadataExtractor.normalizeToSchema(extractedMetadata);
      session.extractedMetadata = extractedMetadata;

      this.logger.success(`Metadata extraction completed for ${fileInfo.fileName}`);

      // Stage 4-6: Transcoding, Packaging, DRM (placeholders)
      // In production, these would be handled by serverless functions
      session.processingSteps.transcoding.status = 'pending';
      session.processingSteps.packaging.status = 'pending';
      session.processingSteps.drm.status = 'pending';

      // Mark session as ready for next stages
      session.status = 'validated';
      session.completedAt = new Date().toISOString();

      this.logger.success(`File processing completed: ${fileInfo.fileName}`);
      this.metrics.operations++;

      return session;

    } catch (error) {
      session.status = 'failed';
      session.error = error.message;
      session.errors.push({
        type: 'PROCESSING_ERROR',
        message: error.message,
        severity: 'CRITICAL',
        stack: error.stack
      });

      this.logger.error(`File processing failed for ${fileInfo.fileName}:`, error.message);
      this.metrics.errors++;

      return session;
    }
  }

  /**
   * Batch process multiple files
   * @param {Array<Object>} files - Array of file info objects
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Batch processing results
   */
  async processBatch(files, options = {}) {
    this.logger.info(`Starting batch processing for ${files.length} files`);

    const results = {
      totalFiles: files.length,
      successful: 0,
      failed: 0,
      validated: 0,
      sessions: [],
      startTime: new Date().toISOString(),
      endTime: null
    };

    for (const file of files) {
      const session = await this.processFile(file, options.metadata);

      results.sessions.push(session);

      if (session.status === 'validated') {
        results.successful++;
        results.validated++;
      } else if (session.status === 'failed') {
        results.failed++;
      }

      // Progress logging
      const progress = ((results.successful + results.failed) / files.length * 100).toFixed(1);
      this.logger.info(`Progress: ${progress}% (${results.successful + results.failed}/${files.length})`);
    }

    results.endTime = new Date().toISOString();

    this.logger.success(`Batch processing completed: ${results.successful} successful, ${results.failed} failed`);

    return results;
  }

  /**
   * Initialize a new upload session
   */
  initializeSession(sessionId, fileInfo, metadata) {
    const session = {
      id: sessionId,
      uploadId: this.generateUploadId(),
      filePath: fileInfo.filePath || null,
      fileName: fileInfo.fileName,
      fileSize: fileInfo.fileSize,
      contentType: this.getContentTypeFromMime(fileInfo.mimeType),
      status: 'pending', // pending, in_progress, validated, failed, completed
      processingSteps: this.initializeProcessingSteps(),
      metadata: {
        title: metadata.title || fileInfo.fileName.replace(/\.[^/.]+$/, ''),
        artist: metadata.artist || 'Unknown Artist',
        album: metadata.album || null,
        genre: metadata.genre || null,
        isrc: metadata.isrc || null,
        territorialRights: metadata.territorialRights || [],
        releaseDate: metadata.releaseDate || null,
        label: metadata.label || null,
        copyrightOwner: metadata.copyrightOwner || null
      },
      extractedMetadata: {},
      errors: [],
      warnings: [],
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    this.sessions.set(sessionId, session);

    return session;
  }

  /**
   * Initialize processing steps structure
   */
  initializeProcessingSteps() {
    const steps = {};

    for (const stage of this.PIPELINE_STAGES) {
      steps[stage] = {
        status: 'pending', // pending, in_progress, completed, failed
        startedAt: null,
        completedAt: null,
        data: null,
        error: null
      };
    }

    return steps;
  }

  /**
   * Perform virus scan (placeholder)
   * In production, this would integrate with ClamAV or similar
   */
  async performVirusScan(fileInfo) {
    this.logger.info('Performing virus scan...');

    // Placeholder implementation
    // In production: integrate with ClamAV, VirusTotal, or AWS S3 scanning
    const result = {
      clean: true,
      scanner: 'placeholder',
      timestamp: new Date().toISOString(),
      note: 'Virus scanning requires ClamAV or similar integration'
    };

    // Simulate scan delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return result;
  }

  /**
   * Validate upload session
   * @param {string} sessionId - Session ID
   * @returns {Object} Session validation results
   */
  async validateSession(sessionId) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return {
        valid: false,
        error: 'Session not found',
        sessionId
      };
    }

    const validation = {
      valid: true,
      sessionId,
      status: session.status,
      errors: [],
      warnings: []
    };

    // Check if validation stage completed successfully
    if (session.processingSteps.validation.status !== 'completed') {
      validation.valid = false;
      validation.errors.push('Validation stage not completed');
    }

    // Check if virus scan completed successfully
    if (session.processingSteps.virusScan.status !== 'completed') {
      validation.valid = false;
      validation.errors.push('Virus scan not completed');
    }

    // Check metadata completeness
    if (session.processingSteps.metadataExtraction.status === 'completed') {
      const metadataValidation = this.metadataExtractor.validateMetadata(
        session.extractedMetadata,
        ['title', 'artist']
      );

      if (!metadataValidation.valid) {
        validation.warnings.push(...metadataValidation.errors);
      }
    }

    return validation;
  }

  /**
   * Get session status
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions
   */
  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique upload ID
   */
  generateUploadId() {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get content type from MIME type
   */
  getContentTypeFromMime(mimeType) {
    if (!mimeType) return 'unknown';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    return 'unknown';
  }

  /**
   * Generate ingestion report
   */
  async generateIngestionReport(sessions = null) {
    const sessionsToReport = sessions || this.getAllSessions();

    const report = {
      agent: this.agentName,
      timestamp: new Date().toISOString(),
      summary: {
        totalSessions: sessionsToReport.length,
        successful: sessionsToReport.filter(s => s.status === 'validated').length,
        failed: sessionsToReport.filter(s => s.status === 'failed').length,
        pending: sessionsToReport.filter(s => s.status === 'pending').length,
        inProgress: sessionsToReport.filter(s => s.status === 'in_progress').length
      },
      sessions: sessionsToReport,
      capabilities: {
        validator: this.validator.getSupportedFormats(),
        metadataExtractor: this.metadataExtractor.getCapabilities()
      },
      metrics: this.metrics
    };

    return report;
  }

  /**
   * Save ingestion report
   */
  async saveIngestionReport(sessions = null) {
    const report = await this.generateIngestionReport(sessions);
    const reportPath = path.join(
      this.config.projectRoot,
      'agents/reports',
      this.generateTimestampedName('content-ingestion-report', '.json')
    );

    try {
      await this.writeFile(reportPath, JSON.stringify(report, null, 2));
      this.logger.success(`Ingestion report saved: ${reportPath}`);
      return reportPath;
    } catch (error) {
      this.logger.error('Failed to save ingestion report:', error.message);
      throw error;
    }
  }

  /**
   * Cleanup and finalization
   */
  async cleanup() {
    this.logger.info('Finalizing content ingestion...');

    // Save final report
    await this.saveIngestionReport();

    // Call parent cleanup
    await super.cleanup();
  }
}

module.exports = ContentIngestionAgent;
