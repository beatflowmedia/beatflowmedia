// src/components/OptimizedImage.js
// Optimized image component with loading states and performance improvements
import { useState, useEffect } from 'react';
import { Box, Skeleton } from '@mui/material';
import MusicNote from '@mui/icons-material/MusicNote';

export default function OptimizedImage({
  src,
  alt,
  width = '100%',
  height = 160,
  fallback = '/images/Logo.png',
  borderRadius = 1,
  objectFit = 'cover',
  showPlaceholder = true,
  sx = {}
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    // Reset state when src changes
    setLoading(true);
    setError(false);

    if (!src) {
      setImageSrc(fallback);
      setLoading(false);
      return;
    }

    // Try WebP version first for better performance
    const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    const img = new Image();

    // Try WebP first
    img.src = webpSrc;

    img.onload = () => {
      setImageSrc(webpSrc);
      setLoading(false);
    };

    img.onerror = () => {
      // WebP failed, try original
      const fallbackImg = new Image();
      fallbackImg.src = src;

      fallbackImg.onload = () => {
        setImageSrc(src);
        setLoading(false);
      };

      fallbackImg.onerror = () => {
        setImageSrc(fallback);
        setError(true);
        setLoading(false);
      };
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, fallback]);

  return (
    <Box
      sx={{
        position: 'relative',
        width,
        height,
        borderRadius,
        overflow: 'hidden',
        bgcolor: 'grey.900',
        ...sx
      }}
    >
      {loading && showPlaceholder && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.900'
          }}
        >
          <MusicNote sx={{ fontSize: 48, color: 'grey.700' }} />
        </Box>
      )}

      {loading && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            bgcolor: 'grey.800'
          }}
        />
      )}

      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            opacity: loading ? 0 : 1,
            transition: 'opacity 0.3s ease-in-out',
            display: 'block'
          }}
        />
      )}
    </Box>
  );
}
