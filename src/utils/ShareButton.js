import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import {
  Share,
  Twitter,
  Facebook,
  LinkedIn,
  Reddit,
  Email,
  ContentCopy,
  OpenInBrowser
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import {
  getSongUrl,
  getPlaylistUrl,
  getShareText,
  getPlaylistShareText,
  shareOnTwitter,
  shareOnFacebook,
  shareOnLinkedIn,
  shareOnReddit,
  shareViaEmail,
  copyToClipboard
} from './shareHelper';

/**
 * DRY Share Button Component
 * Handles sharing songs or playlists via social media, email, or clipboard
 */
export default function ShareButton({
  song,
  playlist,
  size = 'small',
  iconSize = 'default',
  iconColor = 'grey.400',
  hoverColor = '#1DB954'
}) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Safety check - don't render if both song and playlist are invalid
  if ((!song || !song.id) && (!playlist || !playlist.id)) {
    return null;
  }

  const isPlaylist = !!playlist;
  const item = isPlaylist ? playlist : song;
  const itemType = isPlaylist ? 'playlist' : 'song';

  const handleClick = (e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = (e) => {
    if (e) e.stopPropagation();
    setAnchorEl(null);
  };

  const handleShareOption = async (e, shareFunction) => {
    e.stopPropagation();
    handleClose();

    const itemUrl = isPlaylist ? getPlaylistUrl(item.id) : getSongUrl(item.id);
    const shareText = isPlaylist
      ? getPlaylistShareText(item.name, item.id)
      : getShareText(item.title, item.id);
    const itemName = isPlaylist ? item.name : item.title;

    try {
      if (shareFunction === 'open') {
        // Navigate to item page within the app (same window)
        navigate(`/${itemType}/${item.id}`);
      } else if (shareFunction === 'copy') {
        await copyToClipboard(itemUrl);
        toast.success('Link copied to clipboard!');
      } else if (shareFunction === 'twitter') {
        shareOnTwitter(shareText);
      } else if (shareFunction === 'facebook') {
        shareOnFacebook(itemUrl);
      } else if (shareFunction === 'linkedin') {
        shareOnLinkedIn(itemUrl);
      } else if (shareFunction === 'reddit') {
        shareOnReddit(itemUrl);
      } else if (shareFunction === 'email') {
        shareViaEmail(
          `Check out "${itemName}" on BeatFlow Media`,
          shareText
        );
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share');
    }
  };

  return (
    <>
      <IconButton
        size={size}
        onClick={handleClick}
        sx={{
          color: iconColor,
          '&:hover': { color: hoverColor }
        }}
      >
        <Share fontSize={iconSize} />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          sx: {
            bgcolor: '#1a1a1a',
            color: 'white',
            minWidth: 200
          }
        }}
      >
        <MenuItem onClick={(e) => handleShareOption(e, 'open')}>
          <ListItemIcon>
            <OpenInBrowser sx={{ color: '#1DB954' }} fontSize="small" />
          </ListItemIcon>
          <ListItemText>Open {isPlaylist ? 'Playlist' : 'Song'}</ListItemText>
        </MenuItem>

        <MenuItem onClick={(e) => handleShareOption(e, 'copy')}>
          <ListItemIcon>
            <ContentCopy sx={{ color: 'grey.400' }} fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy Link</ListItemText>
        </MenuItem>

        <Divider sx={{ bgcolor: 'grey.700' }} />

        <MenuItem onClick={(e) => handleShareOption(e, 'twitter')}>
          <ListItemIcon>
            <Twitter sx={{ color: '#1DA1F2' }} fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share on Twitter</ListItemText>
        </MenuItem>

        <MenuItem onClick={(e) => handleShareOption(e, 'facebook')}>
          <ListItemIcon>
            <Facebook sx={{ color: '#1877F2' }} fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share on Facebook</ListItemText>
        </MenuItem>

        <MenuItem onClick={(e) => handleShareOption(e, 'linkedin')}>
          <ListItemIcon>
            <LinkedIn sx={{ color: '#0A66C2' }} fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share on LinkedIn</ListItemText>
        </MenuItem>

        <MenuItem onClick={(e) => handleShareOption(e, 'reddit')}>
          <ListItemIcon>
            <Reddit sx={{ color: '#FF4500' }} fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share on Reddit</ListItemText>
        </MenuItem>

        <Divider sx={{ bgcolor: 'grey.700' }} />

        <MenuItem onClick={(e) => handleShareOption(e, 'email')}>
          <ListItemIcon>
            <Email sx={{ color: 'grey.400' }} fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share via Email</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
