// src/pages/ArtistProfileManager.js
// Artist profile management portal - manage bio, images, tour dates, social links
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  Menu,
  MenuItem,
  Tooltip,
  Paper
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Add,
  MusicNote,
  Image as ImageIcon,
  CalendarToday,
  Link as LinkIcon,
  Save,
  ArrowBack,
  MoreVert,
  Visibility,
  VisibilityOff,
  Edit,
  Album as AlbumIcon,
  InfoOutlined
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../hooks/useModal';
import { db, storage } from '../firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, deleteDoc, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';
import StripeConnectOnboarding from '../components/StripeConnectOnboarding';
import { checkMembershipStatus } from '../services/membershipService';
import ArtistCampaignManager from '../components/ArtistCampaignManager';
import { useSongPlays } from '../hooks/useSongPlays';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} role="tabpanel">
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Helper component to display real-time play count
const SongPlayChip = ({ songId }) => {
  const playCount = useSongPlays(songId);
  if (playCount === 0) return null;
  return <Chip label={`${playCount.toLocaleString()} plays`} size="small" sx={{ mt: 0.5 }} />;
};

const SongPlayText = ({ songId }) => {
  const playCount = useSongPlays(songId);
  return <>{playCount.toLocaleString()} plays</>;
};

export default function ArtistProfileManager() {
  const { user } = useAuth();
  const { showConfirm } = useModal();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile state
  const [artistName, setArtistName] = useState('');
  const [bio, setBio] = useState('');
  const [genre, setGenre] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [uploading, setUploading] = useState(false);

  // Social links
  const [socialLinks, setSocialLinks] = useState({
    website: '',
    spotify: '',
    instagram: '',
    facebook: '',
    twitter: '',
    youtube: '',
    soundcloud: '',
    tiktok: ''
  });

  // Tour dates
  const [tourDates, setTourDates] = useState([]);
  const [tourDialogOpen, setTourDialogOpen] = useState(false);
  const [newTourDate, setNewTourDate] = useState({
    date: '',
    venue: '',
    city: '',
    country: '',
    ticketLink: ''
  });

  // Music management
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [albumMenuAnchor, setAlbumMenuAnchor] = useState(null);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [songMenuAnchor, setSongMenuAnchor] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    genre: '',
    lyrics: '',
    explicit: false,
    coverUrl: '',
    isVisible: true
  });
  const [newCoverFile, setNewCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  // Submission editing
  const [editSubmissionDialogOpen, setEditSubmissionDialogOpen] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [submissionEditForm, setSubmissionEditForm] = useState({
    albumTitle: '',
    artistName: '',
    genre: '',
    releaseDate: '',
    recordLabel: ''
  });
  const [newSubmissionCoverFile, setNewSubmissionCoverFile] = useState(null);
  const [submissionCoverPreview, setSubmissionCoverPreview] = useState(null);

  // Membership status
  const [membershipStatus, setMembershipStatus] = useState({ active: false, expiresAt: null, daysRemaining: null });
  const [loadingMembership, setLoadingMembership] = useState(true);

  // Check membership status on mount
  useEffect(() => {
    const checkMembership = async () => {
      if (!user) {
        setLoadingMembership(false);
        return;
      }

      try {
        setLoadingMembership(true);
        const status = await checkMembershipStatus(user.uid);
        setMembershipStatus(status);
      } catch (error) {
        console.error('Error checking membership:', error);
      } finally {
        setLoadingMembership(false);
      }
    };

    checkMembership();
  }, [user]);

  // Redirect to pricing if no active membership
  useEffect(() => {
    if (!loadingMembership && !membershipStatus.active) {
      navigate('/artist-pricing');
    }
  }, [loadingMembership, membershipStatus.active, navigate]);

  useEffect(() => {
    // Wait a moment for auth to initialize before redirecting
    const timer = setTimeout(() => {
      if (!user) {
        navigate('/');
      }
    }, 1000);

    if (user) {
      clearTimeout(timer);
    }

    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [user, navigate]);

  // Load profile data only after membership is verified
  useEffect(() => {
    if (!user || loadingMembership) return;
    if (!membershipStatus.active) return; // Don't load data if no membership

    loadArtistProfile();
    // eslint-disable-next-line
  }, [user, loadingMembership, membershipStatus.active]);

  // Real-time listener for albums - only after membership verified
  useEffect(() => {
    if (!user || loadingMembership) return;
    if (!membershipStatus.active) return; // Don't load data if no membership

    const albumsQuery = query(
      collection(db, 'albums'),
      where('uploadedBy', '==', user.uid)
    );

    const unsubscribe = onSnapshot(albumsQuery, (snapshot) => {
      const albumsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlbums(albumsData);
      console.log('Real-time albums update:', albumsData.length, albumsData);
    }, (error) => {
      console.error('Error loading albums:', error);
    });

    return () => unsubscribe();
  }, [user, loadingMembership, membershipStatus.active]);

  // Real-time listener for songs - only after membership verified
  useEffect(() => {
    if (!user || loadingMembership) return;
    if (!membershipStatus.active) return; // Don't load data if no membership

    const songsQuery = query(
      collection(db, 'songs'),
      where('uploadedBy', '==', user.uid)
    );

    const unsubscribe = onSnapshot(songsQuery, (snapshot) => {
      const songsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSongs(songsData);
      console.log('Real-time songs update:', songsData.length);
    }, (error) => {
      console.error('Error loading songs:', error);
    });

    return () => unsubscribe();
  }, [user, loadingMembership, membershipStatus.active]);

  // Real-time listener for submissions - only after membership verified
  useEffect(() => {
    if (!user || loadingMembership) return;
    if (!membershipStatus.active) return; // Don't load data if no membership

    const submissionsQuery = query(
      collection(db, 'artistSubmissions'),
      where('uploadedBy', '==', user.uid)
    );

    const unsubscribe = onSnapshot(submissionsQuery, (snapshot) => {
      const submissionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(submissionsData);
      console.log('Real-time submissions update:', submissionsData.length);
    }, (error) => {
      console.error('Error loading submissions:', error);
    });

    return () => unsubscribe();
  }, [user, loadingMembership, membershipStatus.active]);

  const loadArtistProfile = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading profile for user:', user.uid, user.email);

      // Load artist profile
      const artistDoc = await getDoc(doc(db, 'artists', user.uid));
      if (artistDoc.exists()) {
        const data = artistDoc.data();
        setArtistName(data.name || '');
        setBio(data.bio || '');
        setGenre(data.genre || '');
        setProfileImage(data.profileImage || '');
        setBannerImage(data.bannerImage || '');
        setSocialLinks(data.socialLinks || {});
      }

      // Load tour dates
      const toursQuery = query(
        collection(db, 'tours'),
        where('artistId', '==', user.uid)
      );
      const toursSnapshot = await getDocs(toursQuery);
      const tours = toursSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTourDates(tours.sort((a, b) => new Date(a.date) - new Date(b.date)));

      // Songs, Albums, and Submissions are now loaded via real-time listeners (see useEffect above)

      // Load purchases/revenue for this artist - optimized single query
      // NOTE: This requires a composite index on (artistId, status)
      const purchasesQuery = query(
        collection(db, 'purchases'),
        where('artistId', '==', user.uid),
        where('status', '==', 'completed')
      );
      const purchasesSnapshot = await getDocs(purchasesQuery);
      const purchasesData = purchasesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Loaded purchases:', purchasesData.length);

      setPurchases(purchasesData);

      // Calculate total artist payout (70% of sales after platform fee)
      // Use artistPayout if available (new purchases), otherwise calculate from price (old purchases)
      const revenue = purchasesData.reduce((sum, purchase) => {
        if (purchase.artistPayout !== undefined) {
          return sum + purchase.artistPayout;
        }
        // Fallback for old purchases without artistPayout field - calculate 70%
        return sum + (purchase.price || 0) * 0.70;
      }, 0);
      setTotalRevenue(revenue);
      console.log('Total artist payout calculated:', revenue, 'from', purchasesData.length, 'purchases');
    } catch (error) {
      console.error('Error loading artist profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file, type) => {
    if (!file) return;

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Image is too large! Maximum size is 5MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    try {
      setUploading(true);

      // Optimize image before upload
      const optimizedFile = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDimension = type === 'profile' ? 800 : 1920; // Profile: 800px, Banner: 1920px

          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              const webpFile = new File([blob], file.name.replace(/\.(jpg|jpeg|png)$/i, '.webp'), {
                type: 'image/webp'
              });
              console.log(`${type} image optimized:`, (file.size / 1024).toFixed(2), 'KB →', (webpFile.size / 1024).toFixed(2), 'KB');
              resolve(webpFile);
            },
            'image/webp',
            0.85
          );
        };
        img.src = URL.createObjectURL(file);
      });

      const timestamp = Date.now();
      const storageRef = ref(storage, `artists/${user.uid}/${type}_${timestamp}.webp`);

      await uploadBytes(storageRef, optimizedFile);
      const url = await getDownloadURL(storageRef);

      if (type === 'profile') {
        setProfileImage(url);
      } else {
        setBannerImage(url);
      }

      toast.success(`${type === 'profile' ? 'Profile' : 'Banner'} image uploaded!`);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      console.log('Saving profile for user:', user.uid);

      const profileData = {
        name: artistName,
        bio,
        genre,
        profileImage,
        bannerImage,
        socialLinks,
        userId: user.uid,
        updatedAt: new Date().toISOString()
      };

      console.log('Profile data:', profileData);

      await setDoc(doc(db, 'artists', user.uid), profileData, { merge: true });

      console.log('Profile saved successfully!');
      toast.success('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTourDate = async () => {
    if (!newTourDate.date || !newTourDate.venue || !newTourDate.city) {
      toast.error('Please fill in date, venue, and city');
      return;
    }

    try {
      const tourDoc = await addDoc(collection(db, 'tours'), {
        ...newTourDate,
        artistId: user.uid,
        artistName,
        createdAt: new Date().toISOString()
      });

      setTourDates([...tourDates, { id: tourDoc.id, ...newTourDate }].sort((a, b) => new Date(a.date) - new Date(b.date)));
      setTourDialogOpen(false);
      setNewTourDate({ date: '', venue: '', city: '', country: '', ticketLink: '' });
      toast.success('Tour date added!');
    } catch (error) {
      console.error('Error adding tour date:', error);
      toast.error('Failed to add tour date');
    }
  };

  const handleDeleteTourDate = async (tourId) => {
    try {
      await deleteDoc(doc(db, 'tours', tourId));
      setTourDates(tourDates.filter(t => t.id !== tourId));
      toast.success('Tour date deleted');
    } catch (error) {
      console.error('Error deleting tour date:', error);
      toast.error('Failed to delete tour date');
    }
  };

  const handleOpenEditSong = (song) => {
    setEditingSong(song);
    setEditForm({
      title: song.title || '',
      genre: song.genre || '',
      lyrics: song.lyrics || '',
      explicit: song.explicit || false,
      coverUrl: song.coverUrl || song.cover || '',
      isVisible: song.isVisible !== undefined ? song.isVisible : true
    });
    setNewCoverFile(null);
    setCoverPreview(null);
    setEditDialogOpen(true);
    setSongMenuAnchor(null);
  };

  const handleCoverChange = async (file) => {
    if (!file) return;

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image is too large! Maximum size is 5MB. Please compress or resize the image.');
      return;
    }

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, WebP, etc.)');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Convert to WebP for optimization
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDimension = 1000; // Max 1000x1000px

      let width = img.width;
      let height = img.height;

      // Resize if needed
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to WebP with quality 0.85
      canvas.toBlob(
        (blob) => {
          const webpFile = new File([blob], file.name.replace(/\.(jpg|jpeg|png)$/i, '.webp'), {
            type: 'image/webp'
          });
          setNewCoverFile(webpFile);
          console.log('Original size:', (file.size / 1024).toFixed(2), 'KB');
          console.log('Optimized size:', (webpFile.size / 1024).toFixed(2), 'KB');
          console.log('Compression:', ((1 - webpFile.size / file.size) * 100).toFixed(1), '% smaller');
        },
        'image/webp',
        0.85
      );
    };

    img.src = URL.createObjectURL(file);
  };

  // Generic toggle visibility function (DRY)
  const handleToggleItemVisibility = async (item, itemType) => {
    try {
      const currentVisibility = item.isVisible !== undefined ? item.isVisible : true;
      const newVisibility = !currentVisibility;

      console.log(`Toggling ${itemType} visibility:`, item.id, 'from', currentVisibility, 'to', newVisibility);

      // Update Firestore
      const collectionName = itemType === 'song' ? 'songs' : 'albums';
      await setDoc(doc(db, collectionName, item.id), {
        isVisible: newVisibility,
        updatedAt: new Date()
      }, { merge: true });

      // If hiding an album, also hide all its tracks
      if (itemType === 'album') {
        console.log(`🔍 Looking for songs with albumId: "${item.id}" for album: "${item.title}"`);

        // Query for songs by albumId
        const albumSongsQuery = query(
          collection(db, 'songs'),
          where('albumId', '==', item.id)
        );
        const albumSongsSnapshot = await getDocs(albumSongsQuery);

        console.log(`✅ Found ${albumSongsSnapshot.size} songs in album "${item.title}":`,
          albumSongsSnapshot.docs.map(d => d.data().title));

        if (albumSongsSnapshot.size > 0) {
          console.log(`📝 Updating visibility to ${newVisibility} for ${albumSongsSnapshot.size} songs...`);

          // Update visibility for all songs in the album
          const updatePromises = albumSongsSnapshot.docs.map(songDoc =>
            setDoc(doc(db, 'songs', songDoc.id), {
              isVisible: newVisibility,
              updatedAt: new Date()
            }, { merge: true })
          );

          await Promise.all(updatePromises);
          console.log(`✅ Successfully updated all songs!`);

          // No need to update local state - real-time listener will handle it automatically

          toast.success(`Album and ${albumSongsSnapshot.size} song(s) ${newVisibility ? 'shown' : 'hidden'} on platform`);
        } else {
          console.warn(`⚠️ No songs found for album "${item.title}" (ID: ${item.id})`);
          toast.success(`Album ${newVisibility ? 'shown' : 'hidden'} on platform (no tracks found)`);
        }
      } else {
        toast.success(`Song ${newVisibility ? 'shown' : 'hidden'} on platform`);
      }

      // No need to update local state - real-time listener will handle it automatically
      // Close menus
      if (itemType === 'song') {
        setSongMenuAnchor(null);
      } else {
        setAlbumMenuAnchor(null);
      }
    } catch (error) {
      console.error(`Error toggling ${itemType} visibility:`, error);
      toast.error(`Failed to update ${itemType} visibility: ` + error.message);
    }
  };

  // Wrapper functions for backwards compatibility
  const handleToggleVisibility = (song) => handleToggleItemVisibility(song, 'song');
  const handleToggleAlbumVisibility = (album) => handleToggleItemVisibility(album, 'album');

  const handleSaveSongEdit = async () => {
    if (!editingSong) return;

    try {
      setSaving(true);
      console.log('Saving song edit:', editingSong.id);
      let coverUrl = editForm.coverUrl;

      // Upload new cover art if one was selected
      if (newCoverFile) {
        console.log('Uploading new cover art...');
        const coverRef = ref(
          storage,
          `artist-uploads/covers/${editingSong.id}_${Date.now()}_${newCoverFile.name}`
        );
        await uploadBytes(coverRef, newCoverFile);
        coverUrl = await getDownloadURL(coverRef);
        console.log('New cover URL:', coverUrl);
      }

      const updateData = {
        ...editingSong,
        title: editForm.title,
        genre: editForm.genre,
        lyrics: editForm.lyrics,
        explicit: editForm.explicit,
        isVisible: editForm.isVisible,
        coverUrl: coverUrl,
        cover: coverUrl, // Update both fields for compatibility
        updatedAt: new Date()
      };

      console.log('Updating song with data:', updateData);

      await setDoc(doc(db, 'songs', editingSong.id), updateData, { merge: true });

      // No need to update local state - real-time listener will handle it automatically

      console.log('Song updated successfully!');
      toast.success('Song updated successfully!');
      setEditDialogOpen(false);
      setNewCoverFile(null);
      setCoverPreview(null);
    } catch (error) {
      console.error('Error updating song:', error);
      toast.error('Failed to update song: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Submission editing handlers
  const handleEditSubmission = (submission) => {
    setEditingSubmission(submission);
    setSubmissionEditForm({
      albumTitle: submission.albumTitle || '',
      artistName: submission.artistName || '',
      genre: submission.genre || '',
      releaseDate: submission.releaseDate || '',
      recordLabel: submission.recordLabel || ''
    });
    if (submission.coverUrl) {
      setSubmissionCoverPreview(submission.coverUrl);
    }
    setNewSubmissionCoverFile(null);
    setEditSubmissionDialogOpen(true);
  };

  const handleSaveSubmissionEdit = async () => {
    if (!editingSubmission) return;

    try {
      setSaving(true);
      let coverUrl = editingSubmission.coverUrl;

      // Upload new cover art if one was selected
      if (newSubmissionCoverFile) {
        console.log('Uploading new submission cover art...');
        const coverRef = ref(
          storage,
          `artist-uploads/covers/${editingSubmission.id}_${Date.now()}_${newSubmissionCoverFile.name}`
        );
        await uploadBytes(coverRef, newSubmissionCoverFile);
        coverUrl = await getDownloadURL(coverRef);
        console.log('New submission cover URL:', coverUrl);
      }

      console.log('About to update submission in Firestore');

      await updateDoc(doc(db, 'artistSubmissions', editingSubmission.id), {
        albumTitle: submissionEditForm.albumTitle,
        artistName: submissionEditForm.artistName,
        genre: submissionEditForm.genre,
        releaseDate: submissionEditForm.releaseDate,
        recordLabel: submissionEditForm.recordLabel,
        coverUrl: coverUrl,
        updatedAt: new Date().toISOString()
      });

      console.log('Submission updated in Firestore');

      // Sync cover to published album and songs (client-side for instant updates)
      // onSnapshot listeners will detect these changes and update UI immediately
      console.log('Checking if submission is published:', {
        status: editingSubmission.status,
        publishedAlbumId: editingSubmission.publishedAlbumId,
        publishedSongIds: editingSubmission.publishedSongIds
      });

      if (editingSubmission.status === 'published') {
        const updates = [];

        // Update artist profile image
        console.log('Syncing cover to artist profile:', user.uid);
        updates.push(
          updateDoc(doc(db, 'artists', user.uid), {
            profileImage: coverUrl,
            updatedAt: new Date()
          })
        );
        setProfileImage(coverUrl); // Update local state immediately

        if (editingSubmission.publishedAlbumId) {
          console.log('Syncing cover to album:', editingSubmission.publishedAlbumId);
          updates.push(
            updateDoc(doc(db, 'albums', editingSubmission.publishedAlbumId), {
              coverUrl: coverUrl,
              updatedAt: new Date()
            })
          );
        }

        if (editingSubmission.publishedSongIds && editingSubmission.publishedSongIds.length > 0) {
          console.log('Syncing cover to', editingSubmission.publishedSongIds.length, 'songs');
          editingSubmission.publishedSongIds.forEach(songId => {
            updates.push(
              updateDoc(doc(db, 'songs', songId), {
                coverUrl: coverUrl,
                cover: coverUrl,
                artistImage: coverUrl, // Add artist image for sidebar
                updatedAt: new Date()
              })
            );
          });
        }

        if (updates.length > 0) {
          await Promise.all(updates);
          console.log('✅ Cover synced to artist profile, album and songs');
        }
      } else {
        console.log('⚠️ Submission is not published, skipping album/song sync');
      }

      toast.success('Submission updated successfully!');
      setEditSubmissionDialogOpen(false);
      setEditingSubmission(null);
      setNewSubmissionCoverFile(null);
      setSubmissionCoverPreview(null);
    } catch (error) {
      console.error('❌ Error updating submission:', error);
      console.error('Error details:', error.message, error.stack);
      toast.error('Failed to update submission: ' + error.message);
    } finally {
      setSaving(false);
    }
  };


  if (loading || loadingMembership) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => navigate('/for-artists')} sx={{ mr: 2, color: 'text.primary' }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
              Artist Profile
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<MusicNote />}
            onClick={() => {
              console.log('Upload Music clicked!', { artistName, bio });
              navigate('/for-artists');
            }}
            sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
          >
            Upload Music
          </Button>
        </Box>

        {/* Banner Image */}
        {bannerImage && (
          <Box
            sx={{
              width: '100%',
              height: 200,
              backgroundImage: `url(${bannerImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: 2,
              mb: 3
            }}
          />
        )}

        <Card sx={{ bgcolor: 'background.paper' }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              px: 2,
              '& .MuiTab-root': { color: 'text.secondary' },
              '& .Mui-selected': { color: 'primary.main' }
            }}
          >
            <Tab label="Profile" />
            <Tab label="Music" />
            <Tab label="Social Links" />
            <Tab label="Tour Dates" />
            <Tab label="Campaigns" />
            <Tab label="Statistics" />
            <Tab label="Payouts" />
          </Tabs>

          {/* Profile Tab */}
          <TabPanel value={activeTab} index={0}>
            <CardContent>
              <Grid container spacing={3}>
                {/* Profile Image */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Avatar
                      src={profileImage}
                      alt={artistName}
                      sx={{ width: 200, height: 200, mx: 'auto', mb: 2 }}
                    >
                      <ImageIcon sx={{ fontSize: 80 }} />
                    </Avatar>
                    <Button
                      variant="outlined"
                      component="label"
                      disabled={uploading}
                      startIcon={<CloudUpload />}
                    >
                      Upload Profile Image
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e.target.files[0], 'profile')}
                      />
                    </Button>
                    <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                      Recommended: 800x800px
                    </Typography>
                  </Box>
                </Grid>

                {/* Profile Details */}
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    label="Artist/Band Name"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Genre"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    sx={{ mb: 2 }}
                    helperText="Primary music genre"
                  />
                  <TextField
                    fullWidth
                    label="Bio"
                    multiline
                    rows={6}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    helperText="Tell fans about your music, story, and journey"
                  />
                </Grid>

                {/* Banner Image */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Banner Image
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    disabled={uploading}
                    startIcon={<CloudUpload />}
                  >
                    Upload Banner Image
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], 'banner')}
                    />
                  </Button>
                  <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                    Recommended: 1920x400px - Displays at the top of your artist page
                  </Typography>
                </Grid>

                {/* Save Button */}
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Save />}
                    onClick={handleSaveProfile}
                    disabled={saving}
                    sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
                  >
                    {saving ? 'Saving...' : 'Save Profile'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </TabPanel>

          {/* Music Tab */}
          <TabPanel value={activeTab} index={1}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>Your Music</Typography>

              {/* Pending Submissions */}
              {submissions.length > 0 && (
                <>
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Pending Submissions ({submissions.length})
                    </Typography>
                    <Typography variant="body2">
                      You have {submissions.length} submission(s) awaiting admin approval. Once approved, they will appear in your published songs below.
                    </Typography>
                  </Alert>
                  <List sx={{ mb: 3, bgcolor: 'rgba(255, 152, 0, 0.05)', borderRadius: 1, p: 1 }}>
                    {submissions.map((submission) => (
                      <ListItem
                        key={submission.id}
                        sx={{ border: '1px solid rgba(255, 152, 0, 0.3)', borderRadius: 1, mb: 1 }}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            aria-label="edit"
                            onClick={() => handleEditSubmission(submission)}
                            size="small"
                          >
                            <Edit />
                          </IconButton>
                        }
                      >
                        <Avatar src={submission.coverUrl} variant="rounded" sx={{ mr: 2, width: 56, height: 56 }}>
                          <MusicNote />
                        </Avatar>
                        <ListItemText
                          primary={submission.albumTitle || submission.tracks?.[0]?.title || 'Untitled'}
                          secondary={
                            <>
                              <Chip label={submission.status} size="small" color="warning" sx={{ mr: 1 }} />
                              <Chip label={`${submission.tracks?.length || 0} track(s)`} size="small" />
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {/* Songs */}
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                Published Singles & Tracks ({songs.length})
              </Typography>
              {songs.length === 0 && submissions.length === 0 ? (
                <Alert severity="info" sx={{ mb: 3 }}>
                  No songs uploaded yet. Click "Upload New Release" to get started!
                </Alert>
              ) : songs.length === 0 ? (
                <Alert severity="info" sx={{ mb: 3 }}>
                  No published songs yet. Your submissions are awaiting approval.
                </Alert>
              ) : (
                <List sx={{ mb: 4 }}>
                  {songs.map((song) => (
                    <ListItem
                      key={song.id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      <Avatar
                        src={song.coverUrl || song.albumArt}
                        variant="rounded"
                        sx={{ mr: 2, width: 56, height: 56 }}
                      >
                        <MusicNote />
                      </Avatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {song.title}
                            {song.isVisible === false && (
                              <Chip
                                label="Hidden"
                                size="small"
                                color="warning"
                                sx={{ fontSize: '0.7rem', height: '20px' }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.secondary">
                              {song.artist} • {song.genre}
                            </Typography>
                            <br />
                            <Chip
                              label={`$${song.price ? (song.price / 100).toFixed(2) : '0.99'}`}
                              size="small"
                              sx={{ mt: 0.5, mr: 1 }}
                            />
                            <SongPlayChip songId={song.id} />
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            setSelectedSong(song);
                            setSongMenuAnchor(e.currentTarget);
                          }}
                        >
                          <MoreVert />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}

              {/* Albums */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                Albums ({albums.length})
              </Typography>
              {albums.length === 0 ? (
                <Alert severity="info">
                  No albums uploaded yet.
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {albums.map((album) => (
                    <Grid item xs={12} sm={6} md={4} key={album.id}>
                      <Card sx={{ bgcolor: 'background.default' }}>
                        <Avatar
                          src={album.coverUrl}
                          variant="rounded"
                          sx={{ width: '100%', height: 160 }}
                        >
                          <AlbumIcon sx={{ fontSize: 60 }} />
                        </Avatar>
                        <CardContent sx={{ position: 'relative' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {album.title}
                            </Typography>
                            {album.isVisible === false && (
                              <Chip
                                label="Hidden"
                                size="small"
                                color="warning"
                                sx={{ height: 20 }}
                              />
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              {album.trackCount || 0} tracks
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                console.log('Album menu clicked:', album.id, album.title);
                                setSelectedAlbum(album);
                                setAlbumMenuAnchor(e.currentTarget);
                              }}
                            >
                              <MoreVert />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}

              {/* Song Menu */}
              <Menu
                anchorEl={songMenuAnchor}
                open={Boolean(songMenuAnchor)}
                onClose={() => setSongMenuAnchor(null)}
              >
                <MenuItem onClick={() => {
                  navigate(`/song/${selectedSong?.id}`);
                  setSongMenuAnchor(null);
                }}>
                  <Visibility sx={{ mr: 1 }} /> View Details
                </MenuItem>
                <MenuItem onClick={() => handleOpenEditSong(selectedSong)}>
                  <Edit sx={{ mr: 1 }} /> Edit
                </MenuItem>
                <MenuItem onClick={() => handleToggleVisibility(selectedSong)}>
                  {selectedSong?.isVisible === false ? (
                    <>
                      <Visibility sx={{ mr: 1 }} /> Show on Platform
                    </>
                  ) : (
                    <>
                      <VisibilityOff sx={{ mr: 1 }} /> Hide from Platform
                    </>
                  )}
                </MenuItem>
                <MenuItem onClick={async () => {
                  const confirmed = await showConfirm('Delete song', 'Are you sure you want to delete this song?', 'warning');
                  if (confirmed) {
                    deleteDoc(doc(db, 'songs', selectedSong.id))
                      .then(() => {
                        // No need to update local state - real-time listener will handle it automatically
                        toast.success('Song deleted');
                      })
                      .catch((error) => {
                        console.error('Error deleting song:', error);
                        toast.error('Failed to delete song');
                      });
                  }
                  setSongMenuAnchor(null);
                }} sx={{ color: 'error.main' }}>
                  <Delete sx={{ mr: 1 }} /> Delete
                </MenuItem>
              </Menu>

              {/* Album Menu */}
              <Menu
                anchorEl={albumMenuAnchor}
                open={Boolean(albumMenuAnchor)}
                onClose={() => {
                  console.log('Album menu closed');
                  setAlbumMenuAnchor(null);
                }}
              >
                <MenuItem onClick={() => {
                  console.log('View album:', selectedAlbum);
                  navigate(`/album/${selectedAlbum?.id}`);
                  setAlbumMenuAnchor(null);
                }}>
                  <Visibility sx={{ mr: 1 }} /> View Album
                </MenuItem>
                <MenuItem onClick={() => {
                  console.log('Toggle visibility for album:', selectedAlbum);
                  handleToggleAlbumVisibility(selectedAlbum);
                }}>
                  {selectedAlbum?.isVisible === false ? (
                    <>
                      <Visibility sx={{ mr: 1 }} /> Show on Platform
                    </>
                  ) : (
                    <>
                      <VisibilityOff sx={{ mr: 1 }} /> Hide from Platform
                    </>
                  )}
                </MenuItem>
                <MenuItem onClick={async () => {
                  const confirmed = await showConfirm('Delete album', 'Are you sure you want to delete this album?', 'warning');
                  if (confirmed) {
                    console.log('Deleting album:', selectedAlbum);
                    deleteDoc(doc(db, 'albums', selectedAlbum.id))
                      .then(() => {
                        // No need to update local state - real-time listener will handle it automatically
                        toast.success('Album deleted');
                      })
                      .catch((error) => {
                        console.error('Error deleting album:', error);
                        toast.error('Failed to delete album');
                      });
                  }
                  setAlbumMenuAnchor(null);
                }} sx={{ color: 'error.main' }}>
                  <Delete sx={{ mr: 1 }} /> Delete
                </MenuItem>
              </Menu>
            </CardContent>
          </TabPanel>

          {/* Social Links Tab */}
          <TabPanel value={activeTab} index={2}>
            <CardContent>
              <Alert severity="info" sx={{ mb: 3 }}>
                Add your social media links to connect with fans across platforms
              </Alert>
              <Grid container spacing={2}>
                {Object.entries({
                  website: 'Website',
                  spotify: 'Spotify',
                  instagram: 'Instagram',
                  facebook: 'Facebook',
                  twitter: 'Twitter/X',
                  youtube: 'YouTube',
                  soundcloud: 'SoundCloud',
                  tiktok: 'TikTok'
                }).map(([key, label]) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <TextField
                      fullWidth
                      label={label}
                      value={socialLinks[key] || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, [key]: e.target.value })}
                      placeholder={`https://${key}.com/yourprofile`}
                      InputProps={{
                        startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Save />}
                    onClick={handleSaveProfile}
                    disabled={saving}
                    sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
                  >
                    {saving ? 'Saving...' : 'Save Social Links'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </TabPanel>

          {/* Tour Dates Tab */}
          <TabPanel value={activeTab} index={3}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Upcoming Shows</Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setTourDialogOpen(true)}
                  sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
                >
                  Add Tour Date
                </Button>
              </Box>

              {tourDates.length === 0 ? (
                <Alert severity="info">
                  No tour dates scheduled. Add your upcoming shows to let fans know where to see you live!
                </Alert>
              ) : (
                <List>
                  {tourDates.map((tour) => (
                    <ListItem
                      key={tour.id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      <CalendarToday sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText
                        primary={`${tour.venue} - ${tour.city}, ${tour.country}`}
                        secondary={new Date(tour.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      />
                      {tour.ticketLink && (
                        <Chip
                          label="Tickets"
                          component="a"
                          href={tour.ticketLink}
                          target="_blank"
                          clickable
                          sx={{ mr: 1 }}
                        />
                      )}
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteTourDate(tour.id)}
                          sx={{ color: 'error.main' }}
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </TabPanel>

          {/* Campaigns Tab */}
          <TabPanel value={activeTab} index={4}>
            <ArtistCampaignManager />
          </TabPanel>

          {/* Statistics Tab */}
          <TabPanel value={activeTab} index={5}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>Your Statistics</Typography>

              {/* Overview Stats */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{
                    bgcolor: 'background.default',
                    p: 2,
                    aspectRatio: '1 / 1',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Total Songs
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {songs.filter(s => s.isVisible !== false).length}
                    </Typography>
                    {songs.filter(s => s.isVisible === false).length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        ({songs.filter(s => s.isVisible === false).length} hidden)
                      </Typography>
                    )}
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{
                    bgcolor: 'background.default',
                    p: 2,
                    aspectRatio: '1 / 1',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Total Albums
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {albums.filter(a => a.isVisible !== false).length}
                    </Typography>
                    {albums.filter(a => a.isVisible === false).length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        ({albums.filter(a => a.isVisible === false).length} hidden)
                      </Typography>
                    )}
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{
                    bgcolor: 'background.default',
                    p: 2,
                    aspectRatio: '1 / 1',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Total Plays
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {songs.reduce((sum, song) => sum + (song.playCount || 0), 0).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      All time
                    </Typography>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{
                    bgcolor: 'background.default',
                    p: 2,
                    aspectRatio: '1 / 1',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Total Likes
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {songs.reduce((sum, song) => sum + (song.likeCount || 0), 0).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Across all songs
                    </Typography>
                  </Card>
                </Grid>
              </Grid>

              {/* Revenue Overview */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                Revenue Overview
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* Sales Revenue - Active */}
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ bgcolor: 'background.default', p: { xs: 2, sm: 3 }, height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Sales Revenue
                      </Typography>
                      <Tooltip
                        title="Your earnings from song/album sales. After Stripe processing fees (~2.9% + $0.30), you receive 70% of the net amount and the platform receives 30% for hosting, bandwidth, and support. Payouts processed via Stripe Connect."
                        arrow
                        placement="top"
                      >
                        <IconButton size="small" sx={{ color: 'primary.main' }}>
                          <InfoOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, fontSize: { xs: '2rem', sm: '3rem' }, color: totalRevenue > 0 ? 'success.main' : 'text.primary' }}>
                      ${totalRevenue.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      From {purchases.length} {purchases.length === 1 ? 'purchase' : 'purchases'}
                    </Typography>
                  </Card>
                </Grid>

                {/* Sync Licensing - Coming Soon */}
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ bgcolor: 'background.default', p: { xs: 2, sm: 3 }, height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Sync Licensing
                      </Typography>
                      <Tooltip
                        title="License your music for use in videos, films, commercials, TV shows, and other media. This feature is coming soon and will allow creators to license your music for their projects."
                        arrow
                        placement="top"
                      >
                        <IconButton size="small" sx={{ color: 'primary.main' }}>
                          <InfoOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                      Coming Soon
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      License for videos/films
                    </Typography>
                  </Card>
                </Grid>

                {/* Streaming - Coming Soon */}
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ bgcolor: 'background.default', p: { xs: 2, sm: 3 }, height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Streaming Revenue
                      </Typography>
                      <Tooltip
                        title="Earn revenue from listeners streaming your music. Payment structure and per-stream rates to be determined. Currently, plays are tracked for engagement metrics only."
                        arrow
                        placement="top"
                      >
                        <IconButton size="small" sx={{ color: 'primary.main' }}>
                          <InfoOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                      Coming Soon
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Per-stream payouts
                    </Typography>
                  </Card>
                </Grid>
              </Grid>

              {/* Purchase Breakdown */}
              {purchases.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Sales Breakdown
                  </Typography>
                  <Card sx={{ bgcolor: 'background.default', mb: 3 }}>
                    <List>
                      {(() => {
                        // Group purchases by item
                        const purchasesByItem = purchases.reduce((acc, purchase) => {
                          const key = `${purchase.itemId}_${purchase.itemType}`;
                          if (!acc[key]) {
                            acc[key] = {
                              itemName: purchase.itemName,
                              itemType: purchase.itemType,
                              count: 0,
                              totalRevenue: 0,
                              artistPayout: 0
                            };
                          }
                          acc[key].count++;
                          acc[key].totalRevenue += purchase.price || 0;
                          acc[key].artistPayout += purchase.artistPayout || (purchase.price || 0) * 0.70;
                          return acc;
                        }, {});

                        // Convert to array and sort by count
                        return Object.values(purchasesByItem)
                          .sort((a, b) => b.count - a.count)
                          .map((item, index) => (
                            <ListItem key={index} sx={{ borderBottom: index < Object.values(purchasesByItem).length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                      {item.itemName}
                                    </Typography>
                                    <Chip
                                      label={item.itemType}
                                      size="small"
                                      sx={{ height: 20 }}
                                    />
                                  </Box>
                                }
                                secondary={
                                  <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      {item.count} {item.count === 1 ? 'sale' : 'sales'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Total: ${item.totalRevenue.toFixed(2)}
                                    </Typography>
                                    <Typography variant="caption" color="success.main" sx={{ fontWeight: 'bold' }}>
                                      Your cut: ${item.artistPayout.toFixed(2)}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                          ));
                      })()}
                    </List>
                  </Card>
                </>
              )}

              {/* Top Performing & Most Favorited Songs */}
              <Grid container spacing={3}>
                {/* Top Performing Songs - only show if there are actual plays */}
                {songs.some(s => (s.playCount || 0) > 0) && (
                  <Grid item xs={12} lg={6}>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Top Performing Songs
                    </Typography>
                    <List>
                      {[...songs]
                        .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
                        .slice(0, 10)
                        .map((song, index) => (
                          <ListItem key={song.id} sx={{ bgcolor: 'background.default', mb: 1, borderRadius: 1 }}>
                            <Avatar
                              src={song.coverUrl || song.cover}
                              variant="rounded"
                              sx={{ mr: 2, width: 48, height: 48 }}
                            >
                              <MusicNote />
                            </Avatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                    #{index + 1} {song.title}
                                  </Typography>
                                  {song.isVisible === false && (
                                    <Chip
                                      label="Hidden"
                                      size="small"
                                      color="warning"
                                      sx={{ height: 20 }}
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    <SongPlayText songId={song.id} />
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {(song.likeCount || 0).toLocaleString()} likes
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                    </List>
                  </Grid>
                )}

                {/* Most Favorited Songs - only show if there are actual likes */}
                {songs.some(s => (s.likeCount || 0) > 0) && (
                  <Grid item xs={12} lg={6}>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Most Favorited Songs
                    </Typography>
                    <List>
                      {[...songs]
                        .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
                        .slice(0, 10)
                        .map((song, index) => (
                          <ListItem key={song.id} sx={{ bgcolor: 'background.default', mb: 1, borderRadius: 1 }}>
                            <Avatar
                              src={song.coverUrl || song.cover}
                              variant="rounded"
                              sx={{ mr: 2, width: 48, height: 48 }}
                            >
                              <MusicNote />
                            </Avatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                    #{index + 1} {song.title}
                                  </Typography>
                                  {song.isVisible === false && (
                                    <Chip
                                      label="Hidden"
                                      size="small"
                                      color="warning"
                                      sx={{ height: 20 }}
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {(song.likeCount || 0).toLocaleString()} likes
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    <SongPlayText songId={song.id} />
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                    </List>
                  </Grid>
                )}
              </Grid>

              {/* Show message when no play data yet */}
              {songs.length > 0 && songs.every(s => (s.playCount || 0) === 0) && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Alert severity="info">
                    No play data yet. Your top performing songs will appear here once they start getting played!
                  </Alert>
                </>
              )}
            </CardContent>
          </TabPanel>

          {/* Payouts Tab */}
          <TabPanel value={activeTab} index={6}>
            <StripeConnectOnboarding totalRevenue={totalRevenue} purchases={purchases} />
          </TabPanel>
        </Card>

        {/* Add Tour Date Dialog */}
        <Dialog
          open={tourDialogOpen}
          onClose={() => setTourDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add Tour Date</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={newTourDate.date}
                onChange={(e) => setNewTourDate({ ...newTourDate, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Venue Name"
                value={newTourDate.venue}
                onChange={(e) => setNewTourDate({ ...newTourDate, venue: e.target.value })}
                sx={{ mb: 2 }}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={newTourDate.city}
                    onChange={(e) => setNewTourDate({ ...newTourDate, city: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={newTourDate.country}
                    onChange={(e) => setNewTourDate({ ...newTourDate, country: e.target.value })}
                  />
                </Grid>
              </Grid>
              <TextField
                fullWidth
                label="Ticket Link (optional)"
                value={newTourDate.ticketLink}
                onChange={(e) => setNewTourDate({ ...newTourDate, ticketLink: e.target.value })}
                placeholder="https://tickets.com/your-show"
                sx={{ mt: 2 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTourDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleAddTourDate}
              sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
            >
              Add Date
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Song Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Edit Song</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {/* Cover Art Upload */}
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Avatar
                  src={coverPreview || editForm.coverUrl}
                  variant="rounded"
                  sx={{ width: 200, height: 200, mx: 'auto', mb: 2 }}
                >
                  <MusicNote sx={{ fontSize: 80 }} />
                </Avatar>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                >
                  {newCoverFile ? 'Change Cover Art' : 'Upload New Cover Art'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => handleCoverChange(e.target.files[0])}
                  />
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                  Recommended: 1000x1000px
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="Song Title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                fullWidth
                label="Genre"
                value={editForm.genre}
                onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Lyrics"
                multiline
                rows={12}
                value={editForm.lyrics}
                onChange={(e) => setEditForm({ ...editForm, lyrics: e.target.value })}
                placeholder="Enter song lyrics here..."
                helperText="Add lyrics to help fans connect with your music"
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    id="explicit-checkbox"
                    checked={editForm.explicit}
                    onChange={(e) => setEditForm({ ...editForm, explicit: e.target.checked })}
                    style={{ marginRight: '8px' }}
                  />
                  <label htmlFor="explicit-checkbox">Explicit Content</label>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    id="visible-checkbox"
                    checked={editForm.isVisible}
                    onChange={(e) => setEditForm({ ...editForm, isVisible: e.target.checked })}
                    style={{ marginRight: '8px' }}
                  />
                  <label htmlFor="visible-checkbox">
                    Show on platform (uncheck to hide from public)
                  </label>
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSaveSongEdit}
              disabled={saving || !editForm.title}
              sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Submission Dialog */}
        <Dialog
          open={editSubmissionDialogOpen}
          onClose={() => setEditSubmissionDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Edit Submission</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {/* Cover Art Upload */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Cover Art
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    mb: 2,
                    border: '2px dashed #333',
                    bgcolor: 'rgba(29, 185, 84, 0.05)',
                    transition: 'all 0.3s',
                    '&:hover': { borderColor: '#1DB954', bgcolor: 'rgba(29, 185, 84, 0.1)' },
                    textAlign: 'center'
                  }}
                >
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                  >
                    Upload New Cover Art
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewSubmissionCoverFile(file);
                          setSubmissionCoverPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </Button>
                </Paper>
                {submissionCoverPreview && (
                  <Box sx={{ mb: 2 }}>
                    <img src={submissionCoverPreview} alt="Cover Preview" style={{ width: 150, height: 150, objectFit: 'cover', borderRadius: 8 }} />
                  </Box>
                )}
              </Box>

              <TextField
                fullWidth
                label="Album Title"
                value={submissionEditForm.albumTitle}
                onChange={(e) => setSubmissionEditForm({ ...submissionEditForm, albumTitle: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Artist Name"
                value={submissionEditForm.artistName}
                onChange={(e) => setSubmissionEditForm({ ...submissionEditForm, artistName: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Genre"
                value={submissionEditForm.genre}
                onChange={(e) => setSubmissionEditForm({ ...submissionEditForm, genre: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Release Date"
                type="date"
                value={submissionEditForm.releaseDate}
                onChange={(e) => setSubmissionEditForm({ ...submissionEditForm, releaseDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Record Label"
                value={submissionEditForm.recordLabel}
                onChange={(e) => setSubmissionEditForm({ ...submissionEditForm, recordLabel: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditSubmissionDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSaveSubmissionEdit}
              disabled={saving || !submissionEditForm.albumTitle}
              sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
