import { useState, useEffect } from 'react';
import { Vibrant } from 'node-vibrant/browser';

// Hook for managing image file, preview URL, and background gradient from Vibrant
export function useImagePreview(initialPreview = null) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(initialPreview);
  const [gradient, setGradient] = useState('linear-gradient(to right, #2d2d2d, #1a1a1a)');

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      Vibrant.from(url)
        .getPalette()
        .then((palette) => {
          const primary = palette.Vibrant.hex;
          const secondary = palette.DarkVibrant?.hex || primary;
          setGradient(`linear-gradient(to right, ${primary}, ${secondary})`);
        })
        .catch(() => {});
    }
  }, [file]);

  return { file, setFile, preview, gradient };
}
