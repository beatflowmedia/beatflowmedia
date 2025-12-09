// frontend/lib/manifestFetcher.js
// Fetches manifest with playback token

export async function fetchManifest(manifestUrl, playbackToken) {
  const res = await fetch(manifestUrl, {
    headers: {
      Authorization: `Bearer ${playbackToken}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch manifest');
  return await res.text();
}
