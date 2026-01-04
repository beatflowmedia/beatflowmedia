// Placeholder image utilities
// Using data URIs to avoid external dependencies and CSP issues

export const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect width="300" height="300" fill="%23333"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%23888"%3ENo Image%3C/text%3E%3C/svg%3E';

export const getPlaceholderImage = (width = 300, height = 300, text = 'No Image') => {
  return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"%3E%3Crect width="${width}" height="${height}" fill="%23333"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%23888"%3E${encodeURIComponent(text)}%3C/text%3E%3C/svg%3E`;
};
