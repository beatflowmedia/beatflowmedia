// src/components/AlbumCard.js
// Reusable album card component following DRY principles
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardMedia, Typography, Box } from '@mui/material';
import { QueueMusic } from '@mui/icons-material';
import PurchaseButton from './PurchaseButton';

/**
 * AlbumCard - Reusable component for displaying album information with purchase option
 *
 * @param {Object} album - Album data object
 * @param {string} album.id - Album ID
 * @param {string} album.title - Album title
 * @param {string} album.coverUrl - Album cover image URL
 * @param {number} album.trackCount - Number of tracks in album
 * @param {number} album.price - Album price in cents
 * @param {Object} album.releaseDate - Release date (Firestore timestamp or Date)
 * @param {boolean} showPurchaseButton - Whether to show purchase button (default: true)
 */
export default function AlbumCard({ album, showPurchaseButton = true }) {
  const navigate = useNavigate();

  const handleNavigateToAlbum = () => {
    navigate(`/album/${album.id}`);
  };

  return (
    <Card
      sx={{
        bgcolor: '#181818',
        transition: 'all 0.3s',
        '&:hover': {
          bgcolor: '#282828',
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <CardMedia
        component="img"
        height="180"
        image={album.coverUrl || '/default-album.jpg'}
        alt={album.title}
        sx={{ objectFit: 'cover', cursor: 'pointer' }}
        onClick={handleNavigateToAlbum}
      />
      <CardContent>
        <Typography
          variant="subtitle1"
          onClick={handleNavigateToAlbum}
          sx={{
            color: 'white',
            fontWeight: 'bold',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            mb: 0.5,
            cursor: 'pointer'
          }}
        >
          {album.title}
        </Typography>
        <Typography variant="caption" sx={{ color: 'grey.400' }}>
          {album.releaseDate
            ? new Date(album.releaseDate.seconds * 1000 || album.releaseDate).getFullYear()
            : 'Album'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, mb: 1 }}>
          <QueueMusic sx={{ fontSize: 14, color: '#1DB954' }} />
          <Typography variant="caption" sx={{ color: 'grey.500' }}>
            {album.trackCount || 0} tracks
          </Typography>
        </Box>
        {showPurchaseButton && (
          <PurchaseButton
            itemId={album.id}
            itemType="album"
            price={album.price || 999}
            compact={false}
          />
        )}
      </CardContent>
    </Card>
  );
}
