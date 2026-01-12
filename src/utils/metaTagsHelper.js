// src/utils/metaTagsHelper.js
// DRY utility for generating Open Graph and Twitter Card meta tags
// Use with React Helmet for SEO optimization

/**
 * Meta Tags Helper
 *
 * Generates Open Graph and Twitter Card meta tags for songs, artists, playlists
 * Improves social sharing preview and SEO discoverability
 *
 * @example
 * import { generateSongMetaTags } from '../utils/metaTagsHelper';
 * const metaTags = generateSongMetaTags(song);
 * <Helmet>{metaTags}</Helmet>
 */

const SITE_NAME = 'BeatFlow Media';
const SITE_URL = process.env.REACT_APP_SITE_URL || 'https://beatflowmedia.com';
const DEFAULT_IMAGE = `${SITE_URL}/images/default-og-image.jpg`;
const TWITTER_HANDLE = '@BeatFlowMedia'; // TODO: Replace with actual Twitter handle

/**
 * Base meta tags for all pages
 * @returns {object} Base meta tag configuration
 */
export const getBaseMetaTags = () => ({
  siteName: SITE_NAME,
  siteUrl: SITE_URL,
  twitterCard: 'summary_large_image',
  twitterSite: TWITTER_HANDLE
});

/**
 * Generate meta tags for a song page
 * @param {object} song - Song object with id, title, artist, genre, coverUrl, etc.
 * @returns {object} Meta tag configuration for React Helmet
 */
export const generateSongMetaTags = (song) => {
  if (!song || !song.id) return null;

  const title = `${song.title || 'Untitled'} - ${song.artistName || song.artist || 'Unknown Artist'}`;
  const description = song.description ||
    `Listen to "${song.title || 'Untitled'}" by ${song.artistName || song.artist || 'Unknown Artist'} on BeatFlow Media. ${song.genre ? `Genre: ${song.genre}.` : ''} Stream music from independent artists.`;
  const url = `${SITE_URL}/song/${song.id}`;
  const image = song.coverUrl || song.cover || DEFAULT_IMAGE;

  return {
    title,
    meta: [
      // General meta tags
      { name: 'description', content: description },
      { name: 'keywords', content: `${song.artist || 'music'}, ${song.genre || 'streaming'}, ${song.title || 'song'}, independent music, beatflow` },

      // Open Graph (Facebook, LinkedIn, etc.)
      { property: 'og:type', content: 'music.song' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { property: 'og:image', content: image },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'music:musician', content: song.artistName || song.artist || '' },
      { property: 'music:duration', content: song.duration ? String(song.duration) : '0' },

      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: TWITTER_HANDLE },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
      { name: 'twitter:player', content: `${SITE_URL}/embed/song/${song.id}` }, // For Twitter audio player card

      // Music specific
      { property: 'music:release_date', content: song.releaseDate || song.createdAt || '' }
    ],
    link: [
      { rel: 'canonical', href: url }
    ]
  };
};

/**
 * Generate meta tags for an artist page
 * @param {string} artistName - Artist name
 * @param {object} artistData - Optional artist data (bio, image, followers, etc.)
 * @returns {object} Meta tag configuration for React Helmet
 */
export const generateArtistMetaTags = (artistName, artistData = {}) => {
  if (!artistName) return null;

  const title = `${artistName} - Independent Artist on BeatFlow Media`;
  const description = artistData.bio ||
    `Discover music by ${artistName} on BeatFlow Media. Stream songs, albums, and playlists from this independent artist.${artistData.followers ? ` ${artistData.followers} followers.` : ''}`;
  const url = `${SITE_URL}/artist/${encodeURIComponent(artistName)}`;
  const image = artistData.image || artistData.profileImage || DEFAULT_IMAGE;

  return {
    title,
    meta: [
      // General meta tags
      { name: 'description', content: description },
      { name: 'keywords', content: `${artistName}, independent artist, music streaming, beatflow, albums, songs` },

      // Open Graph
      { property: 'og:type', content: 'profile' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { property: 'og:image', content: image },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'profile:username', content: artistName },

      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: TWITTER_HANDLE },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image }
    ],
    link: [
      { rel: 'canonical', href: url }
    ]
  };
};

/**
 * Generate meta tags for a playlist page
 * @param {object} playlist - Playlist object with id, name, description, coverUrl, etc.
 * @returns {object} Meta tag configuration for React Helmet
 */
export const generatePlaylistMetaTags = (playlist) => {
  if (!playlist || !playlist.id) return null;

  const title = `${playlist.name || 'Untitled Playlist'} - BeatFlow Media Playlist`;
  const description = playlist.description ||
    `Listen to ${playlist.name || 'this playlist'} on BeatFlow Media.${playlist.songs?.length ? ` ${playlist.songs.length} songs.` : ''} Curated playlists from independent artists.`;
  const url = `${SITE_URL}/playlist/${playlist.id}`;
  const image = playlist.coverUrl || playlist.cover || DEFAULT_IMAGE;

  return {
    title,
    meta: [
      // General meta tags
      { name: 'description', content: description },
      { name: 'keywords', content: `playlist, ${playlist.name || 'music'}, streaming, beatflow, curated music` },

      // Open Graph
      { property: 'og:type', content: 'music.playlist' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { property: 'og:image', content: image },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'music:song_count', content: String(playlist.songs?.length || 0) },
      { property: 'music:creator', content: playlist.creatorName || playlist.owner || '' },

      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: TWITTER_HANDLE },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image }
    ],
    link: [
      { rel: 'canonical', href: url }
    ]
  };
};

/**
 * Generate meta tags for album page
 * @param {object} album - Album object with id, title, artist, coverUrl, etc.
 * @returns {object} Meta tag configuration for React Helmet
 */
export const generateAlbumMetaTags = (album) => {
  if (!album || !album.id) return null;

  const title = `${album.title || 'Untitled Album'} - ${album.artist || 'Unknown Artist'}`;
  const description = album.description ||
    `Listen to the album "${album.title || 'Untitled'}" by ${album.artist || 'Unknown Artist'} on BeatFlow Media.${album.trackCount ? ` ${album.trackCount} tracks.` : ''}`;
  const url = `${SITE_URL}/album/${album.id}`;
  const image = album.coverUrl || album.cover || DEFAULT_IMAGE;

  return {
    title,
    meta: [
      // General meta tags
      { name: 'description', content: description },
      { name: 'keywords', content: `${album.artist || 'album'}, ${album.title || 'music'}, album, streaming, beatflow` },

      // Open Graph
      { property: 'og:type', content: 'music.album' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { property: 'og:image', content: image },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'music:musician', content: album.artist || '' },
      { property: 'music:release_date', content: album.releaseDate || '' },
      { property: 'music:song_count', content: String(album.trackCount || 0) },

      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: TWITTER_HANDLE },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image }
    ],
    link: [
      { rel: 'canonical', href: url }
    ]
  };
};

/**
 * Generate meta tags for home page
 * @returns {object} Meta tag configuration for React Helmet
 */
export const generateHomeMetaTags = () => ({
  title: 'BeatFlow Media - Stream Music from Independent Artists',
  meta: [
    { name: 'description', content: 'Discover and stream music from independent artists on BeatFlow Media. Listen to curated playlists, explore new genres, and support emerging talent.' },
    { name: 'keywords', content: 'music streaming, independent artists, beatflow, playlists, discover music, emerging talent' },

    // Open Graph
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'BeatFlow Media - Stream Music from Independent Artists' },
    { property: 'og:description', content: 'Discover and stream music from independent artists. Listen to curated playlists and explore new genres.' },
    { property: 'og:url', content: SITE_URL },
    { property: 'og:image', content: DEFAULT_IMAGE },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:site_name', content: SITE_NAME },

    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: TWITTER_HANDLE },
    { name: 'twitter:title', content: 'BeatFlow Media - Stream Music from Independent Artists' },
    { name: 'twitter:description', content: 'Discover and stream music from independent artists. Listen to curated playlists and explore new genres.' },
    { name: 'twitter:image', content: DEFAULT_IMAGE }
  ],
  link: [
    { rel: 'canonical', href: SITE_URL }
  ]
});

/**
 * Generate meta tags for search page
 * @param {string} query - Search query
 * @returns {object} Meta tag configuration for React Helmet
 */
export const generateSearchMetaTags = (query) => ({
  title: `Search Results for "${query}" - BeatFlow Media`,
  meta: [
    { name: 'description', content: `Search results for "${query}" on BeatFlow Media. Find songs, artists, albums, and playlists.` },
    { name: 'robots', content: 'noindex, follow' } // Don't index search result pages
  ]
});

export default {
  getBaseMetaTags,
  generateSongMetaTags,
  generateArtistMetaTags,
  generatePlaylistMetaTags,
  generateAlbumMetaTags,
  generateHomeMetaTags,
  generateSearchMetaTags
};
