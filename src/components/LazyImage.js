// src/components/LazyImage.js
// Lazy-loaded image component with loading state and error handling
import { useState } from 'react';
import { CardMedia, Skeleton } from '@mui/material';

export default function LazyImage({
  src,
  alt,
  height = 160,
  fallback = '/images/Logo.png',
  component = "img",
  sx = {},
  ...props
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const imageSrc = error ? fallback : (src || fallback);

  return (
    <>
      {loading && (
        <Skeleton
          variant="rectangular"
          height={height}
          sx={{ position: 'absolute', top: 0, left: 0, right: 0 }}
        />
      )}
      <CardMedia
        component={component}
        image={imageSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        sx={{
          height,
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
          ...sx
        }}
        {...props}
      />
    </>
  );
}
