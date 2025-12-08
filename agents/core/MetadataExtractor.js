/**
 * MetadataExtractor - Extracts metadata from audio/video files
 *
 * Extracts:
 * - Technical metadata (format, bitrate, sample rate, codec, duration)
 * - Music metadata (BPM, key, mood, energy, danceability)
 * - Embedded metadata (ID3 tags, artist, title, album, etc.)
 *
 * Based on schema from DATABASE_SCHEMA.md
 */

const fs = require('fs').promises;
const path = require('path');
const mm = require('music-metadata');
const ffmpeg = require('fluent-ffmpeg');
const { promisify } = require('util');

class MetadataExtractor {
  constructor(options = {}) {
    this.options = {
      extractTechnical: options.extractTechnical !== false,
      extractMusic: options.extractMusic !== false,
      extractEmbedded: options.extractEmbedded !== false,
      analyzeMood: options.analyzeMood || false,
      ...options
    };

    // Mood and energy descriptors
    this.MOOD_DESCRIPTORS = {
      happy: ['upbeat', 'cheerful', 'joyful', 'bright', 'optimistic'],
      sad: ['melancholic', 'somber', 'emotional', 'dark', 'moody'],
      energetic: ['driving', 'powerful', 'intense', 'aggressive', 'dynamic'],
      calm: ['peaceful', 'serene', 'ambient', 'relaxing', 'tranquil'],
      dramatic: ['epic', 'cinematic', 'tense', 'suspenseful', 'dramatic']
    };

    // Musical keys
    this.MUSICAL_KEYS = [
      'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'
    ];
  }

  /**
   * Extract all metadata from a file
   * @param {Object} fileInfo - File information
   * @param {string} fileInfo.filePath - Path to the file
   * @param {string} fileInfo.fileName - Name of the file
   * @param {string} fileInfo.contentType - Content type (audio/video)
   * @returns {Promise<Object>} Extracted metadata
   */
  async extractMetadata(fileInfo) {
    const metadata = {
      extracted: false,
      timestamp: new Date().toISOString(),
      source: fileInfo.filePath,
      technical: null,
      music: null,
      embedded: null,
      errors: [],
      warnings: []
    };

    try {
      // 1. Extract technical metadata
      if (this.options.extractTechnical) {
        metadata.technical = await this.extractTechnicalMetadata(
          fileInfo.filePath,
          fileInfo.contentType
        );
      }

      // 2. Extract embedded metadata (ID3, etc.)
      if (this.options.extractEmbedded) {
        metadata.embedded = await this.extractEmbeddedMetadata(
          fileInfo.filePath,
          fileInfo.contentType
        );
      }

      // 3. Extract music-specific metadata
      if (this.options.extractMusic && fileInfo.contentType === 'audio') {
        metadata.music = await this.extractMusicMetadata(
          fileInfo.filePath,
          metadata.technical
        );
      }

      metadata.extracted = true;

    } catch (error) {
      metadata.errors.push({
        type: 'EXTRACTION_ERROR',
        message: `Metadata extraction failed: ${error.message}`,
        severity: 'HIGH',
        details: error.stack
      });
    }

    return metadata;
  }

  /**
   * Extract technical metadata (format, bitrate, duration, codec)
   * Uses fluent-ffmpeg and ffprobe for actual extraction
   */
  async extractTechnicalMetadata(filePath, contentType) {
    const technical = {
      format: null,
      duration: null,
      bitrate: null,
      sampleRate: null,
      channels: null,
      codec: null,
      fileSize: null
    };

    try {
      // Get file stats
      const stats = await fs.stat(filePath);
      technical.fileSize = stats.size;
      technical.fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      // Get file extension as basic format indicator
      const ext = path.extname(filePath).toLowerCase();
      technical.format = ext.replace('.', '').toUpperCase();

      // Use ffprobe to extract technical metadata
      const ffprobeData = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
          if (err) {
            reject(err);
          } else {
            resolve(metadata);
          }
        });
      });

      // Extract format information
      if (ffprobeData.format) {
        technical.duration = ffprobeData.format.duration ? parseFloat(ffprobeData.format.duration) : null;
        technical.bitrate = ffprobeData.format.bit_rate ? parseInt(ffprobeData.format.bit_rate) / 1000 : null; // Convert to kbps
        technical.format = ffprobeData.format.format_name || technical.format;
      }

      // Extract stream information
      if (ffprobeData.streams && ffprobeData.streams.length > 0) {
        // Find audio stream
        const audioStream = ffprobeData.streams.find(s => s.codec_type === 'audio');
        if (audioStream) {
          technical.codec = audioStream.codec_name;
          technical.sampleRate = audioStream.sample_rate ? parseInt(audioStream.sample_rate) : null;
          technical.channels = audioStream.channels;
          technical.bitrate = technical.bitrate || (audioStream.bit_rate ? parseInt(audioStream.bit_rate) / 1000 : null);
        }

        // Add video-specific fields if video
        if (contentType === 'video') {
          const videoStream = ffprobeData.streams.find(s => s.codec_type === 'video');
          if (videoStream) {
            technical.resolution = videoStream.width && videoStream.height
              ? `${videoStream.width}x${videoStream.height}`
              : null;
            technical.frameRate = videoStream.r_frame_rate || null;
            technical.aspectRatio = videoStream.display_aspect_ratio || null;
            technical.colorSpace = videoStream.pix_fmt || null;
            technical.videoCodec = videoStream.codec_name;
          }
        }
      }

    } catch (error) {
      technical._error = error.message;
      technical._note = 'ffprobe extraction failed - ensure ffmpeg is installed on system';
    }

    return technical;
  }

  /**
   * Extract embedded metadata (ID3 tags, etc.)
   * Uses music-metadata library for comprehensive tag extraction
   */
  async extractEmbeddedMetadata(filePath, contentType) {
    const embedded = {
      title: null,
      artist: null,
      album: null,
      albumArtist: null,
      genre: null,
      year: null,
      trackNumber: null,
      discNumber: null,
      comment: null,
      composer: null,
      publisher: null,
      copyright: null,
      isrc: null,
      lyrics: null,
      coverArt: null
    };

    try {
      // Use music-metadata to parse file
      const metadata = await mm.parseFile(filePath);

      if (metadata.common) {
        embedded.title = metadata.common.title || null;
        embedded.artist = metadata.common.artist || null;
        embedded.album = metadata.common.album || null;
        embedded.albumArtist = metadata.common.albumartist || null;
        embedded.genre = metadata.common.genre ? metadata.common.genre.join(', ') : null;
        embedded.year = metadata.common.year || null;
        embedded.trackNumber = metadata.common.track?.no || null;
        embedded.discNumber = metadata.common.disk?.no || null;
        embedded.comment = metadata.common.comment ? metadata.common.comment.join(', ') : null;
        embedded.composer = metadata.common.composer ? metadata.common.composer.join(', ') : null;
        embedded.publisher = metadata.common.label || null;
        embedded.copyright = metadata.common.copyright || null;
        embedded.isrc = metadata.common.isrc ? metadata.common.isrc.join(', ') : null;
        embedded.lyrics = metadata.common.lyrics ? metadata.common.lyrics.join('\n') : null;

        // Extract cover art if available
        if (metadata.common.picture && metadata.common.picture.length > 0) {
          const picture = metadata.common.picture[0];
          embedded.coverArt = {
            format: picture.format,
            description: picture.description || null,
            size: picture.data.length,
            hasImage: true
          };
        }
      }

    } catch (error) {
      embedded._error = error.message;
      embedded._note = 'music-metadata extraction failed';
    }

    return embedded;
  }

  /**
   * Extract music-specific metadata (BPM, key, mood, energy)
   * Note: In production, this would use music analysis libraries
   */
  async extractMusicMetadata(filePath, technicalMetadata) {
    const music = {
      bpm: null,
      key: null,
      mode: null, // major/minor
      timeSignature: null,
      mood: [],
      energy: null, // 0-100
      danceability: null, // 0-100
      valence: null, // 0-100 (positivity)
      acousticness: null, // 0-100
      instrumentalness: null, // 0-100
      liveness: null, // 0-100
      speechiness: null // 0-100
    };

    try {
      // TODO: Integrate with music analysis libraries
      // Options:
      // 1. essentia.js - Web Audio API-based music analysis
      // 2. meyda - Audio feature extraction
      // 3. External API - The Echo Nest API, Spotify API, AcousticBrainz
      //
      // Example with essentia.js:
      // - BPM detection: RhythmExtractor2013
      // - Key detection: KeyExtractor
      // - Mood/energy: Low-level features + ML model

      music._placeholder = true;
      music._note = 'Music metadata extraction requires audio analysis library or API';
      music._options = [
        'essentia.js (recommended for BPM, key detection)',
        'meyda (audio feature extraction)',
        'External API (Spotify Web API, AcousticBrainz)'
      ];

      // Placeholder analysis based on filename/genre if available
      if (this.options.analyzeMood) {
        music.mood = this.inferMoodFromFilename(filePath);
      }

    } catch (error) {
      music._error = error.message;
    }

    return music;
  }

  /**
   * Infer basic mood from filename (placeholder logic)
   */
  inferMoodFromFilename(filePath) {
    const fileName = path.basename(filePath).toLowerCase();
    const moods = [];

    for (const [mood, keywords] of Object.entries(this.MOOD_DESCRIPTORS)) {
      for (const keyword of keywords) {
        if (fileName.includes(keyword)) {
          moods.push(mood);
          break;
        }
      }
    }

    return moods.length > 0 ? moods : ['unknown'];
  }

  /**
   * Batch extract metadata from multiple files
   */
  async extractBatch(files) {
    const results = {
      totalFiles: files.length,
      extracted: 0,
      failed: 0,
      files: []
    };

    for (const file of files) {
      const metadata = await this.extractMetadata(file);

      results.files.push({
        fileName: file.fileName,
        metadata
      });

      if (metadata.extracted) {
        results.extracted++;
      } else {
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Validate extracted metadata against schema requirements
   * Based on DATABASE_SCHEMA.md contentProcessing.metadata
   */
  validateMetadata(metadata, requiredFields = []) {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      missingFields: [],
      completeness: 0
    };

    // Default required fields from DATABASE_SCHEMA.md
    const defaultRequired = ['title', 'artist', 'duration', 'format'];
    const required = requiredFields.length > 0 ? requiredFields : defaultRequired;

    // Check required fields
    for (const field of required) {
      let value = null;

      // Check in different metadata sections
      if (metadata.embedded && metadata.embedded[field]) {
        value = metadata.embedded[field];
      } else if (metadata.technical && metadata.technical[field]) {
        value = metadata.technical[field];
      } else if (metadata.music && metadata.music[field]) {
        value = metadata.music[field];
      }

      if (!value) {
        validation.valid = false;
        validation.missingFields.push(field);
        validation.errors.push({
          type: 'MISSING_REQUIRED_FIELD',
          message: `Required field '${field}' is missing`,
          severity: 'HIGH',
          field
        });
      }
    }

    // Calculate completeness
    const allFields = [
      ...Object.keys(metadata.technical || {}),
      ...Object.keys(metadata.embedded || {}),
      ...Object.keys(metadata.music || {})
    ].filter(key => !key.startsWith('_')); // Exclude internal fields

    const filledFields = allFields.filter(key => {
      const value = metadata.technical?.[key] || metadata.embedded?.[key] || metadata.music?.[key];
      return value !== null && value !== undefined && value !== '';
    });

    validation.completeness = Math.round((filledFields.length / allFields.length) * 100);

    // Warnings for low completeness
    if (validation.completeness < 50) {
      validation.warnings.push({
        type: 'LOW_METADATA_COMPLETENESS',
        message: `Metadata completeness is low (${validation.completeness}%)`,
        severity: 'MEDIUM',
        completeness: validation.completeness
      });
    }

    return validation;
  }

  /**
   * Normalize metadata to standard schema (DATABASE_SCHEMA.md format)
   */
  normalizeToSchema(metadata) {
    const normalized = {
      // Content metadata (from embedded tags)
      title: metadata.embedded?.title || 'Untitled',
      artist: metadata.embedded?.artist || 'Unknown Artist',
      album: metadata.embedded?.album || null,
      genre: metadata.embedded?.genre || null,
      isrc: metadata.embedded?.isrc || null,

      // Rights and release
      territorialRights: [],
      releaseDate: metadata.embedded?.year ? `${metadata.embedded.year}-01-01` : null,
      label: metadata.embedded?.publisher || null,
      copyrightOwner: metadata.embedded?.copyright || null,

      // Technical metadata
      duration: metadata.technical?.duration || null,
      format: metadata.technical?.format || null,
      bitrate: metadata.technical?.bitrate || null,
      sampleRate: metadata.technical?.sampleRate || null,
      channels: metadata.technical?.channels || null,
      codec: metadata.technical?.codec || null,
      fileSize: metadata.technical?.fileSize || null,

      // Music analysis
      bpm: metadata.music?.bpm || null,
      key: metadata.music?.key || null,
      mood: metadata.music?.mood || [],
      energy: metadata.music?.energy || null,
      danceability: metadata.music?.danceability || null,

      // Extraction metadata
      extractedAt: metadata.timestamp,
      extractionSource: metadata.source
    };

    return normalized;
  }

  /**
   * Get metadata extraction capabilities
   */
  getCapabilities() {
    return {
      technical: {
        supported: this.options.extractTechnical,
        fields: ['format', 'duration', 'bitrate', 'sampleRate', 'channels', 'codec', 'fileSize'],
        requiresLibrary: 'ffprobe',
        status: 'placeholder'
      },
      embedded: {
        supported: this.options.extractEmbedded,
        fields: ['title', 'artist', 'album', 'genre', 'year', 'isrc', 'copyright'],
        requiresLibrary: 'music-metadata',
        status: 'placeholder'
      },
      music: {
        supported: this.options.extractMusic,
        fields: ['bpm', 'key', 'mood', 'energy', 'danceability'],
        requiresLibrary: 'essentia.js or external API',
        status: 'placeholder'
      }
    };
  }
}

module.exports = MetadataExtractor;
