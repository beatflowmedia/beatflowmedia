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
 * import { generateSongSchema, schemaScript } from '../utils/schemaMarkup';
 * const songSchema = generateSongSchema(song);
 * // OUTSIDE <Helmet> -- react-helmet-async drops script children. See schemaScript.
 * {schemaScript(songSchema)}
 */

const SITE_NAME = 'BeatFlow Media';
// Fallback is beatflowmediagroup.com, the domain BFMG actually owns.
const SITE_URL = process.env.REACT_APP_SITE_URL || 'https://beatflowmediagroup.com';
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
    email: 'support@beatflowmediagroup.com'
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
    image: song.coverUrl || song.cover || `${SITE_URL}/images/beatflow-share.png`,
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
    image: artistData.image || artistData.profileImage || `${SITE_URL}/images/beatflow-share.png`,
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
    image: album.coverUrl || album.cover || `${SITE_URL}/images/beatflow-share.png`,
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
 * MusicAlbum schema for a production-library COLLECTION.
 *
 * SEPARATE FROM generateAlbumSchema, and the reasons are structural rather than
 * stylistic. That function hardcodes `/album/<id>` URLs, hardcodes
 * `albumProductionType: StudioAlbum` under a comment admitting it should sometimes be
 * CompilationAlbum, and emits no `offers` at all. A collection lives at
 * `/collection/<slug>`, IS a compilation, and its whole reason to be indexed is that it
 * is for sale. Bending one function over both with flags would put a condition on every
 * line, and a condition got backwards here is a price or a URL stated wrongly to a
 * search engine.
 *
 * THE MARKUP DESCRIBES THE PAGE AS IT IS. CLAUDE.md's SEO section is explicit that
 * `aggregateRating` with no reviews is structured-data spam that risks a manual action
 * stripping rich results sitewide. There are no reviews, so there is no rating here, and
 * there is no FAQPage either because the page carries no FAQ. What IS emitted is what a
 * reader can see: the name, the cover, the track count and the price they would pay.
 *
 * @param {object} collection  the collections/ document, plus `slug`
 * @param {object} options
 * @param {number} options.priceCents  what checkout will actually charge
 * @param {number} options.trackCount  the DELIVERABLE count, not the stored one
 */
export const generateCollectionSchema = (collection, options = {}) => {
  if (!collection) return null;
  const slug = collection.slug || collection.id;
  if (!slug) return null;

  const url = `${SITE_URL}/collection/${slug}`;
  const { priceCents, trackCount } = options;

  // Only offered when the price is known. An `offers` block with a guessed number is
  // worse than none: it is the figure Google shows in a result, and a buyer who clicks
  // a wrong price arrives already misled.
  const offers = Number.isFinite(priceCents) && priceCents > 0
    ? {
      '@type': 'Offer',
      url,
      priceCurrency: 'USD',
      price: (priceCents / 100).toFixed(2),
      availability: 'https://schema.org/InStock',
      category: 'Commercial music licence',
      seller: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL }
    }
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    '@id': url,
    url,
    name: collection.title || slug,
    description: collection.description
      || `${trackCount || collection.trackCount || ''} production music tracks licensed for commercial use — video, podcasts, apps, games and client work.`.trim(),
    image: collection.coverUrl || `${SITE_URL}/images/beatflow-share.png`,
    numTracks: trackCount || collection.trackCount || undefined,
    // THE DISTINCTION THAT MAKES THIS HONEST: these are curated sets of library cues,
    // not an artist's studio record. Saying StudioAlbum would describe a release that
    // was never made.
    albumProductionType: 'https://schema.org/CompilationAlbum',
    albumReleaseType: 'https://schema.org/AlbumRelease',
    byArtist: {
      '@type': 'MusicGroup',
      name: SITE_NAME,
      url: SITE_URL
    },
    genre: collection.genre || undefined,
    offers
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
/**
 * The JSON-LD <script> for a schema object, or null when there is nothing to emit.
 *
 * *** CALL THIS OUTSIDE <Helmet>, NOT INSIDE IT. ***
 *
 * react-helmet-async 2.0.5 DROPS a <script> child. Its <meta> and <title> children come
 * through on the same render, which is what made this so hard to see: the head looked
 * managed and correct, and the structured data was simply absent. Measured on
 * 2026-10-23 -- identical markup, 0 tags inside Helmet, one 304-byte BreadcrumbList
 * immediately outside it.
 *
 * Rendering it in the body is not a workaround with a cost. Google's own structured
 * data documentation accepts JSON-LD anywhere in the document; <head> is a convention,
 * not a requirement. So the tag goes beside <Helmet> rather than in it, and every call
 * site carries a one-line note saying why, because "why is the schema not in the head
 * with the rest of the meta" is the obvious question and the obvious fix re-breaks it.
 *
 * WHY A FUNCTION RETURNING AN ELEMENT AND NOT A COMPONENT
 * Nothing to do with Helmet now -- it is so the null case lives in one place. A falsy
 * schema returns null, so no call site needs its own `schema && (...)` guard. Two of
 * them had one, and nesting it around this call is a parse error.
 *
 * WHAT THIS REPLACED, AND WHY IT MATTERED
 * The previous version returned PROPS to be spread onto a script tag:
 *
 *     return { type: 'application/ld+json', innerHTML: JSON.stringify(schema) };
 *     // call site:  <script {...schemaToScriptTag(schema)} />
 *
 * `innerHTML` is not a React DOM attribute -- React is explicit that setting HTML
 * content requires `dangerouslySetInnerHTML`, and it silently DROPS an unknown
 * lowercase-camelCase prop rather than erroring. So every call site rendered
 * `<script type="application/ld+json"></script>`: present, valid, and EMPTY.
 *
 * Five pages emitted it -- the collection pages, song pages, playlists, and this
 * pillar -- which is every page on the site carrying structured data. Measured on
 * 2026-10-23: the pillar's own <title> came through Helmet correctly on the same
 * render where its script tag arrived with zero bytes, which is what isolated it.
 *
 * It is a textbook silent failure. Nothing warns, the markup validates as an empty
 * script, Search Console reports no structured data -- which is indistinguishable from
 * a site that never added any -- and the only symptom is rich results that never appear.
 *
 * Content goes in as CHILDREN. A JSON-LD payload is text, not markup, so it needs no
 * dangerouslySetInnerHTML; React escapes it and the escaping is valid JSON.
 *
 * @param {object|null} schema
 * @returns {JSX.Element|null}
 */
export const schemaScript = (schema) => {
  if (!schema) return null;
  return (
    <script type="application/ld+json">
      {JSON.stringify(schema)}
    </script>
  );
};

const schemaMarkup = {
  generateCollectionSchema,
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateSongSchema,
  generateArtistSchema,
  generatePlaylistSchema,
  generateAlbumSchema,
  generateBreadcrumbSchema,
  generateItemListSchema,
  generateGraphSchema,
  schemaScript
};
export default schemaMarkup;;
