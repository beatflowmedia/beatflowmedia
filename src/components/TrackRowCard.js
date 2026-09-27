import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Box
} from '@mui/material';
import {
  PlayArrow,
  MusicNote,
  Favorite,
  FavoriteBorder,
  ThumbUp,
  ThumbUpOffAlt,
  MoreVert
} from '@mui/icons-material';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import PurchaseButton from './PurchaseButton';
import { useSongPlays } from '../hooks/useSongPlays';
import { SONG_PRICE } from '../utils/pricing';
import { parseFeaturedArtists, featuredArtistSlug } from '../utils/featuredArtists';

/**
 * Reusable track row component for displaying songs in album and artist pages
 */
export default function TrackRowCard({
  track,
  index,
  isCurrentTrack,
  isPlaying,
  isLiked,
  isFavorited,
  onPlay,
  onToggleLike,
  onToggleFavorite,
  onMoreOptions,
  showArtist = false,
  artistName,
  showPurchase = true,
  likeCount = 0,
  showMetrics = true
}) {
  // Get real-time play count from songMetrics collection
  const playCount = useSongPlays(track?.id);

  return (
    <Card
      sx={{
        bgcolor: isCurrentTrack ? '#2a2a2a' : '#1a1a1a',
        '&:hover': { bgcolor: '#2a2a2a' },
        transition: 'background-color 0.2s',
        overflow: 'visible'
      }}
    >
      <CardContent sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 1.5,
        overflow: 'visible',
        '&:last-child': { pb: 1.5 }
      }}>
        {/* Play Button */}
        <IconButton
          size="small"
          onClick={() => onPlay(track, index)}
          sx={{
            width: 40,
            height: 40,
            color: isCurrentTrack ? '#1DB954' : 'grey.400',
            bgcolor: isCurrentTrack ? 'rgba(29, 185, 84, 0.1)' : 'transparent',
            '&:hover': { color: '#1DB954', bgcolor: 'rgba(29, 185, 84, 0.2)' }
          }}
        >
          {isPlaying ? <MusicNote /> : <PlayArrow />}
        </IconButton>

        {/* Track Info */}
        <Box sx={{ flex: 1, cursor: 'pointer' }} onClick={() => onPlay(track, index)}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              sx={{
                color: isCurrentTrack ? '#1DB954' : 'white',
                fontWeight: 500,
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {track.title}
            </Typography>
            {track.explicit && (
              <Chip
                label="E"
                size="small"
                sx={{
                  bgcolor: 'grey.600',
                  color: 'white',
                  fontSize: '0.6rem',
                  height: 16,
                  minWidth: 16
                }}
              />
            )}
          </Box>
          {/* Featured credits, made clickable.
            *
            * The personas -- Lyle Carpenter, SYNNE, Adam Cetera, Dawn Calvin -- live
            * inside the track title, which is where the distributor registered them.
            * They are a real public identity: a buyer meets one on the radio or a DSP,
            * arrives here, and until now had a name with nothing to do. Search found
            * them because search matches on title, but there was nothing to click.
            *
            * Rendered from the title rather than a stored field so the credit cannot
            * drift from the name that was actually registered. The title itself is
            * left intact above: it is what the buyer is licensing, and quietly
            * rewriting it in the one place they are deciding to buy would be wrong. */}
          <Typography variant="body2" sx={{ color: 'grey.400' }}>
            {showArtist && artistName ? `${artistName} • ` : ''}
            {parseFeaturedArtists(track.title).map((name, index) => (
              <React.Fragment key={name}>
                {index > 0 && ', '}
                <Box
                  component={RouterLink}
                  to={`/featuring/${featuredArtistSlug(name)}`}
                  onClick={(event) => event.stopPropagation()}
                  sx={{
                    color: 'grey.300',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline', color: 'white' }
                  }}
                >
                  {name}
                </Box>
                {' • '}
              </React.Fragment>
            ))}
            {playCount.toLocaleString()} plays
          </Typography>
        </Box>

        {/* Duration */}
        <Typography variant="body2" sx={{ color: 'grey.400', minWidth: 50, textAlign: 'center' }}>
          {formatDuration(track.duration || 0)}
        </Typography>

        {/* Purchase Button (optional) */}
        {showPurchase && (
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', zIndex: 10 }}>
            <PurchaseButton
              itemId={track.id}
              itemType="song"
              price={track.price || SONG_PRICE}
              track={track}
              compact={true}
              artistId={track.artistId}
              uploadedBy={track.uploadedBy}
            />
          </div>
        )}

        {/* Like Button (Thumbs Up) */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, position: 'relative', zIndex: 10 }}
          onClickCapture={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseDownCapture={(e) => e.stopPropagation()}
        >
          <IconButton
            size="small"
            onClickCapture={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleLike(track);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDownCapture={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            sx={{
              color: isLiked ? '#1DB954' : 'grey.400',
              '&:hover': { color: isLiked ? '#1ed760' : '#1DB954' }
            }}
            title={isLiked ? 'Unlike' : 'Like'}
          >
            {isLiked ? <ThumbUp fontSize="small" /> : <ThumbUpOffAlt fontSize="small" />}
          </IconButton>
          {showMetrics && likeCount > 0 && (
            <Typography variant="caption" sx={{ color: 'grey.400', minWidth: 20 }}>
              {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount}
            </Typography>
          )}
        </Box>

        {/* Favorite Button (Heart) */}
        {onToggleFavorite && (
          <Box
            sx={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 10 }}
            onClickCapture={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseDownCapture={(e) => e.stopPropagation()}
          >
            <IconButton
              size="small"
              onClickCapture={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(track);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseDownCapture={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              sx={{
                color: isFavorited ? '#e91e63' : 'grey.400',
                '&:hover': { color: isFavorited ? '#f06292' : '#e91e63' }
              }}
              title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorited ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
            </IconButton>
          </Box>
        )}

        {/* More Options */}
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onMoreOptions(e, track);
          }}
          sx={{
            color: 'grey.400',
            '&:hover': { color: 'white' }
          }}
        >
          <MoreVert />
        </IconButton>
      </CardContent>
    </Card>
  );
}

// Helper function
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
