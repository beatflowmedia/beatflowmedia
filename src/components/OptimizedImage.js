// src/components/OptimizedImage.js
//
// An image with a loading state and one fallback. The name is now accurate; it was
// not before.
//
// WHAT WAS REMOVED, AND WHY
// This component rewrote every src from .jpg/.jpeg/.png to .webp and offered the
// result inside a <picture><source>. Two things were wrong with that, and together
// they broke 785 storefront tiles.
//
//   1. A <source> that 404s does NOT fall back to the <img> beside it. That is the
//      whole gotcha of <picture>: a matching source wins, and if it fails the image
//      is simply broken. The effect above it probed the .webp and correctly settled
//      on the original when it did not exist -- and then the render emitted the
//      <source> anyway, discarding the answer it had just worked out.
//
//   2. It never helped anything. MEASURED, not assumed: 11 .webp files exist in
//      public/artistImages, all with raster twins, and ZERO records in the database
//      point into that folder -- the artists collection is empty. So the rewrite has
//      never once served a real image, while costing a failed request for every image
//      in the app. On a 500-tile storefront that is 500 wasted round trips to save
//      nothing.
//
// It stayed invisible because every image URL in the catalogue was a Firebase
// download link ending in "?alt=media&token=...". The regex was anchored to the end
// of the string, so it never matched and no <source> was ever emitted. The production
// library's covers are plain storage URLs ending in .jpeg, which matched every time.
// A rewrite that had never fired in the life of the codebase fired 785 times at once.
//
// A .webp URL still works perfectly: it is served as given. What is gone is GUESSING
// that a parallel file exists. The stored URL is the truth; a component should not
// invent a sibling for it.
import { useState, useEffect } from 'react';
import { Box, Skeleton } from '@mui/material';
import MusicNote from '@mui/icons-material/MusicNote';
import { getPlaceholderImage } from '../utils/placeholders';

export default function OptimizedImage({
  src,
  alt,
  width = '100%',
  height = 160,
  // Defaults to the SAME inline placeholder artwork.js hands out, rather than
  // /images/Logo.png. artwork.js says plainly that callers should not add their own
  // fallback because "that is how the precedences drifted apart in the first place",
  // and a second default here was exactly that drift: a track with no art showed the
  // company logo on one surface and a grey tile on another. A data URI also cannot
  // 404, so the fallback can never itself fail.
  fallback = getPlaceholderImage(300, 300, 'No Image'),
  borderRadius = 1,
  objectFit = 'cover',
  showPlaceholder = true,
  priority = false,
  sx = {}
}) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // Reset when the src changes, or a recycled tile keeps the previous image's
  // failure state and renders a placeholder over a perfectly good URL.
  useEffect(() => {
    setLoading(true);
    setFailed(false);
  }, [src]);

  const resolvedSrc = failed || !src ? fallback : src;

  return (
    <Box
      sx={{
        position: 'relative',
        width,
        height,
        borderRadius,
        overflow: 'hidden',
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
            bgcolor: 'grey.900',
            zIndex: 1
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
            bgcolor: 'grey.800',
            zIndex: 2
          }}
        />
      )}

      <img
        src={resolvedSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        width={typeof width === 'number' ? width : undefined}
        height={typeof height === 'number' ? height : undefined}
        onLoad={() => setLoading(false)}
        onError={() => {
          // One step only. Marking failed swaps to the data-URI placeholder, which
          // cannot itself fail, so there is no second error and no loop.
          setFailed(true);
          setLoading(false);
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit,
          display: 'block',
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.3s ease',
          position: 'relative',
          zIndex: 3
        }}
      />
    </Box>
  );
}
