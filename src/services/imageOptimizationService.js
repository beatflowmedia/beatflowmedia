// src/services/imageOptimizationService.js
// Image optimization service for marketing content
// Handles aspect ratio cropping, WebP conversion, and responsive sizing

class ImageOptimizationService {
  constructor() {
    this.aspectRatios = {
      '9:16': { width: 1080, height: 1920, name: 'Stories/Reels' },
      '1:1': { width: 1080, height: 1080, name: 'Instagram Feed' },
      '3:2': { width: 1200, height: 800, name: 'Twitter/LinkedIn' }
    };

    this.quality = {
      high: 90,
      medium: 85,
      low: 75
    };
  }

  /**
   * Generate all 3 aspect ratio variants from source image
   * Returns array of WebP images ready for social media
   */
  async generateSocialImageVariants(sourceImage, campaignName) {
    const variants = [];

    for (const [ratio, dimensions] of Object.entries(this.aspectRatios)) {
      const croppedImage = await this.cropToAspectRatio(
        sourceImage,
        dimensions.width,
        dimensions.height
      );

      const webpImage = await this.convertToWebP(croppedImage, this.quality.medium);

      variants.push({
        ratio,
        dimensions,
        path: `/images/marketing/social/${campaignName}/${ratio.replace(':', 'x')}.webp`,
        file: webpImage,
        platform: dimensions.name
      });
    }

    return variants;
  }

  /**
   * Crop image to specific aspect ratio (smart center crop)
   */
  async cropToAspectRatio(sourceImage, targetWidth, targetHeight) {
    // This would use canvas API in browser or sharp/jimp in Node.js
    // For now, returning placeholder implementation

    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && sourceImage instanceof File) {
        // Browser implementation
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            // Calculate crop dimensions (center crop)
            const sourceRatio = img.width / img.height;
            const targetRatio = targetWidth / targetHeight;

            let sx, sy, sWidth, sHeight;

            if (sourceRatio > targetRatio) {
              // Source is wider, crop sides
              sHeight = img.height;
              sWidth = img.height * targetRatio;
              sx = (img.width - sWidth) / 2;
              sy = 0;
            } else {
              // Source is taller, crop top/bottom
              sWidth = img.width;
              sHeight = img.width / targetRatio;
              sx = 0;
              sy = (img.height - sHeight) / 2;
            }

            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

            canvas.toBlob((blob) => {
              resolve(blob);
            }, 'image/png', 1.0);
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(sourceImage);
      } else {
        // Node.js implementation would use sharp
        resolve(sourceImage);
      }
    });
  }

  /**
   * Convert image to WebP format
   */
  async convertToWebP(imageBlob, quality = 85) {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined') {
        // Browser implementation
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/webp', quality / 100);
        };

        if (imageBlob instanceof Blob) {
          img.src = URL.createObjectURL(imageBlob);
        } else {
          img.src = imageBlob;
        }
      } else {
        // Node.js would use sharp
        resolve(imageBlob);
      }
    });
  }

  /**
   * Batch process multiple images for social campaign
   */
  async processSocialCampaign(sourceImages, campaignName) {
    const processedCampaigns = [];

    for (const [index, sourceImage] of sourceImages.entries()) {
      const variants = await this.generateSocialImageVariants(
        sourceImage,
        `${campaignName}-${index + 1}`
      );

      processedCampaigns.push({
        campaignName: `${campaignName}-${index + 1}`,
        variants
      });
    }

    return processedCampaigns;
  }

  /**
   * Generate responsive image srcset for landing pages
   */
  generateResponsiveSrcSet(imagePath, widths = [640, 768, 1024, 1280, 1920]) {
    const srcset = widths.map(width => {
      const responsivePath = imagePath.replace('.webp', `-${width}w.webp`);
      return `${responsivePath} ${width}w`;
    }).join(', ');

    return {
      srcset,
      sizes: '(max-width: 640px) 640px, (max-width: 768px) 768px, (max-width: 1024px) 1024px, (max-width: 1280px) 1280px, 1920px'
    };
  }

  /**
   * Optimize image for blog featured image
   */
  async optimizeBlogFeaturedImage(sourceImage, blogSlug) {
    const sizes = [
      { width: 1200, height: 630, suffix: 'og' }, // Open Graph
      { width: 800, height: 600, suffix: 'featured' }, // Featured
      { width: 400, height: 300, suffix: 'thumbnail' } // Thumbnail
    ];

    const optimizedImages = [];

    for (const size of sizes) {
      const croppedImage = await this.cropToAspectRatio(
        sourceImage,
        size.width,
        size.height
      );

      const webpImage = await this.convertToWebP(croppedImage, this.quality.high);

      optimizedImages.push({
        path: `/images/marketing/blog/${blogSlug}/${size.suffix}.webp`,
        file: webpImage,
        dimensions: { width: size.width, height: size.height }
      });
    }

    return optimizedImages;
  }

  /**
   * Calculate optimal clamp() values for responsive backgrounds
   */
  calculateClampValues(minSize, maxSize, viewportUnit = 'vw', baseSize = 0) {
    // clamp(min, preferred, max)
    const preferred = `calc(${viewportUnit} + ${baseSize}rem)`;
    return `clamp(${minSize}, ${preferred}, ${maxSize})`;
  }

  /**
   * Generate CSS for responsive background image
   */
  generateResponsiveBackgroundCSS(imagePath, options = {}) {
    const {
      minHeight = '500px',
      maxHeight = '900px',
      overlay = true,
      overlayGradient = 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7))'
    } = options;

    return {
      backgroundImage: overlay ? `${overlayGradient}, url(${imagePath})` : `url(${imagePath})`,
      backgroundSize: 'clamp(100%, calc(100% + 5vw), 110%)',
      backgroundPosition: 'center calc(50% - clamp(0px, 3vw, 40px))',
      minHeight: `clamp(${minHeight}, calc(100vh - 80px), ${maxHeight})`,
      backgroundRepeat: 'no-repeat'
    };
  }

  /**
   * Get recommended image dimensions for content type
   */
  getRecommendedDimensions(contentType) {
    const recommendations = {
      'landing-hero': { width: 1920, height: 1080, ratio: '16:9' },
      'landing-section': { width: 1200, height: 800, ratio: '3:2' },
      'blog-featured': { width: 800, height: 600, ratio: '4:3' },
      'blog-og': { width: 1200, height: 630, ratio: '1.91:1' },
      'social-story': { width: 1080, height: 1920, ratio: '9:16' },
      'social-feed': { width: 1080, height: 1080, ratio: '1:1' },
      'social-landscape': { width: 1200, height: 800, ratio: '3:2' }
    };

    return recommendations[contentType] || recommendations['landing-hero'];
  }

  /**
   * Validate image meets requirements
   */
  async validateImage(imageFile, requirements) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const validation = {
            valid: true,
            errors: []
          };

          // Check dimensions
          if (requirements.minWidth && img.width < requirements.minWidth) {
            validation.valid = false;
            validation.errors.push(`Width ${img.width}px is less than required ${requirements.minWidth}px`);
          }

          if (requirements.minHeight && img.height < requirements.minHeight) {
            validation.valid = false;
            validation.errors.push(`Height ${img.height}px is less than required ${requirements.minHeight}px`);
          }

          // Check aspect ratio
          if (requirements.aspectRatio) {
            const [w, h] = requirements.aspectRatio.split(':').map(Number);
            const expectedRatio = w / h;
            const actualRatio = img.width / img.height;

            if (Math.abs(expectedRatio - actualRatio) > 0.1) {
              validation.valid = false;
              validation.errors.push(`Aspect ratio ${actualRatio.toFixed(2)} doesn't match required ${requirements.aspectRatio}`);
            }
          }

          // Check file size
          if (requirements.maxFileSize && imageFile.size > requirements.maxFileSize) {
            validation.valid = false;
            validation.errors.push(`File size ${(imageFile.size / 1024 / 1024).toFixed(2)}MB exceeds ${(requirements.maxFileSize / 1024 / 1024).toFixed(2)}MB`);
          }

          resolve(validation);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(imageFile);
    });
  }
}

export default new ImageOptimizationService();
