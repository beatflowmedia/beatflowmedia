// src/utils/schemaMarkup.js
// DRY utility for generating Schema.org structured data (JSON-LD)
// Helps Google display rich music results in search

/**
 * Schema.org Markup Helper
 *
 * Generates JSON-LD structured data for music content
 * Improves SEO and enables rich snippets in Google search results
 *
 * @example
 * import { generateSongSchema } from '../utils/schemaMarkup';
 * const schema = generateSongSchema(song);
 * <script type="application/ld+json">{JSON.stringify(schema)}</script>
 */

const SITE_NAME = 'BeatFlow Media';
const SITE_URL = process.env.REACT_APP_SITE_URL || 'https://beatflowmedia.com';
const LOGO_URL = `${SITE_URL}/logo192.png`;

/**
 * Generate Organization schema (for site-wide use)
 * @returns {object} Organization JSON-LD
 */
export const generateOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: LOGO_URL,
  sameAs: [
    'https://twitter.com/BeatFlowMedia', // TODO: Replace with actual social URLs
    'https://facebook.com/BeatFlowMedia',
    'https://instagram.com/BeatFlowMedia'
  ],
  description: 'Discover and stream music from independent artists on BeatFlow Media',
  foundingDate: '2024',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+1-XXX-XXX-XXXX', // TODO: Add actual phone
    contactType: 'Customer Service',
    email: 'support@beatflowmedia.com' // TODO: Add actual email
  }
});

/**
 * Generate WebSite schema with search action
 * @returns {object} WebSite JSON-LD
 */
export const generateWebSiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`
    },
    'query-input': 'required name=search_term_string'
  }
});

/**
 * Generate MusicRecording schema for a song
 * @param {object} song - Song object with id, title, artist, duration, etc.
 * @returns {object} MusicRecording JSON-LD
 */
export const generateSongSchema = (song) => {
  if (!song || !song.id) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    '@id': `${SITE_URL}/song/${song.id}`,
    name: song.title || 'Untitled',
    url: `${SITE_URL}/song/${song.id}`,
    description: song.description || `Listen to "${song.title || 'Untitled'}" by ${song.artistName || song.artist || 'Unknown Artist'}`,
    duration: song.duration ? `PT${Math.floor(song.duration / 60)}M${song.duration % 60}S` : undefined, // ISO 8601 duration
    byArtist: {
      '@type': 'MusicGroup',
      name: song.artistName || song.artist || 'Unknown Artist',
      url: song.artist ? `${SITE_URL}/artist/${encodeURIComponent(song.artist)}` : undefined
    },
    inAlbum: song.album ? {
      '@type': 'MusicAlbum',
      name: song.album,
      url: song.albumId ? `${SITE_URL}/album/${song.albumId}` : undefined
    } : undefined,
    genre: song.genre || undefined,
    datePublished: song.releaseDate || song.createdAt || undefined,
    image: song.coverUrl || song.cover || `${SITE_URL}/images/default-cover.jpg`,
    audio: song.url ? {
      '@type': 'AudioObject',
      contentUrl: song.url,
      encodingFormat: 'audio/mpeg'
    } : undefined,
    isrcCode: song.isrc || undefined,
    recordingOf: {
      '@type': 'MusicComposition',
      name: song.title || 'Untitled',
      composer: song.composer || song.artistName || song.artist || undefined,
      lyricist: song.lyricist || undefined
    },
    producer: {
      '@type': 'Organization',
      name: SITE_NAME
    }
  };
};

/**
 * Generate MusicGroup schema for an artist
 * @param {string} artistName - Artist name
 * @param {object} artistData - Optional artist data (bio, image, etc.)
 * @returns {object} MusicGroup JSON-LD
 */
export const generateArtistSchema = (artistName, artistData = {}) => {
  if (!artistName) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    '@id': `${SITE_URL}/artist/${encodeURIComponent(artistName)}`,
    name: artistName,
    url: `${SITE_URL}/artist/${encodeURIComponent(artistName)}`,
    description: artistData.bio || `Discover music by ${artistName} on BeatFlow Media`,
    image: artistData.image || artistData.profileImage || `${SITE_URL}/images/default-artist.jpg`,
    genre: artistData.genres?.join(', ') || artistData.genre || undefined,
    foundingDate: artistData.foundingDate || undefined,
    sameAs: artistData.socialLinks || undefined, // Array of social media URLs
    aggregateRating: artistData.followers ? {
      '@type': 'AggregateRating',
      ratingValue: '5',
      reviewCount: artistData.followers
    } : undefined
  };
};

/**
 * Generate MusicPlaylist schema
 * @param {object} playlist - Playlist object with id, name, songs, etc.
 * @returns {object} MusicPlaylist JSON-LD
 */
export const generatePlaylistSchema = (playlist) => {
  if (!playlist || !playlist.id) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'MusicPlaylist',
    '@id': `${SITE_URL}/playlist/${playlist.id}`,
    name: playlist.name || 'Untitled Playlist',
    url: `${SITE_URL}/playlist/${playlist.id}`,
    description: playlist.description || `Listen to ${playlist.name || 'this playlist'} on BeatFlow Media`,
    image: playlist.coverUrl || playlist.cover || `${SITE_URL}/images/default-playlist.jpg`,
    numTracks: playlist.songs?.length || 0,
    creator: playlist.creatorName || playlist.owner ? {
      '@type': 'Person',
      name: playlist.creatorName || playlist.owner
    } : undefined,
    datePublished: playlist.createdAt || undefined,
    dateModified: playlist.updatedAt || undefined,
    track: playlist.songs?.slice(0, 10).map((song, index) => ({ // List first 10 tracks
      '@type': 'MusicRecording',
      '@id': `${SITE_URL}/song/${song.songId || song.id}`,
      name: song.title || 'Untitled',
      position: index + 1
    })) || []
  };
};

/**
 * Generate MusicAlbum schema
 * @param {object} album - Album object with id, title, artist, tracks, etc.
 * @returns {object} MusicAlbum JSON-LD
 */
export const generateAlbumSchema = (album) => {
  if (!album || !album.id) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    '@id': `${SITE_URL}/album/${album.id}`,
    name: album.title || 'Untitled Album',
    url: `${SITE_URL}/album/${album.id}`,
    description: album.description || `Listen to the album "${album.title || 'Untitled'}" by ${album.artist || 'Unknown Artist'}`,
    image: album.coverUrl || album.cover || `${SITE_URL}/images/default-album.jpg`,
    byArtist: {
      '@type': 'MusicGroup',
      name: album.artist || 'Unknown Artist',
      url: album.artist ? `${SITE_URL}/artist/${encodeURIComponent(album.artist)}` : undefined
    },
    datePublished: album.releaseDate || album.createdAt || undefined,
    genre: album.genre || undefined,
    numTracks: album.trackCount || album.tracks?.length || 0,
    track: album.tracks?.map((track, index) => ({
      '@type': 'MusicRecording',
      '@id': `${SITE_URL}/song/${track.id}`,
      name: track.title || 'Untitled',
      position: index + 1,
      duration: track.duration ? `PT${Math.floor(track.duration / 60)}M${track.duration % 60}S` : undefined
    })) || [],
    albumProductionType: 'http://schema.org/StudioAlbum', // or CompilationAlbum, LiveAlbum
    albumReleaseType: 'http://schema.org/AlbumRelease'
  };
};

/**
 * Generate BreadcrumbList schema for navigation
 * @param {array} breadcrumbs - Array of breadcrumb items [{name, url}, ...]
 * @returns {object} BreadcrumbList JSON-LD
 */
export const generateBreadcrumbSchema = (breadcrumbs) => {
  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url ? `${SITE_URL}${crumb.url}` : undefined
    }))
  };
};

/**
 * Generate ItemList schema for collections (e.g., "Top 10 Songs")
 * @param {string} name - List name
 * @param {array} items - Array of items (songs, artists, playlists)
 * @param {string} itemType - Type of items ('song', 'artist', 'playlist')
 * @returns {object} ItemList JSON-LD
 */
export const generateItemListSchema = (name, items, itemType = 'song') => {
  if (!items || items.length === 0) return null;

  const typeMap = {
    song: 'MusicRecording',
    artist: 'MusicGroup',
    playlist: 'MusicPlaylist',
    album: 'MusicAlbum'
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': typeMap[itemType] || 'Thing',
        name: item.title || item.name || 'Untitled',
        url: `${SITE_URL}/${itemType}/${item.id}`
      }
    }))
  };
};

/**
 * Generate multiple schemas (useful for pages with multiple content types)
 * @param {array} schemas - Array of schema objects
 * @returns {object} Graph JSON-LD
 */
export const generateGraphSchema = (schemas) => {
  if (!schemas || schemas.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@graph': schemas.filter(Boolean) // Remove null schemas
  };
};

/**
 * Helper: Convert schema object to JSON-LD script tag (for use in Helmet)
 * @param {object} schema - Schema object
 * @returns {object} Script tag props for React Helmet
 */
export const schemaToScriptTag = (schema) => {
  if (!schema) return null;

  return {
    type: 'application/ld+json',
    innerHTML: JSON.stringify(schema, null, 0) // Minified JSON
  };
};

const schemaMarkup = {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateSongSchema,
  generateArtistSchema,
  generatePlaylistSchema,
  generateAlbumSchema,
  generateBreadcrumbSchema,
  generateItemListSchema,
  generateGraphSchema,
  schemaToScriptTag
};
export default schemaMarkup;;
