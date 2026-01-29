// src/pages/ForArtists.js
// Professional music upload interface inspired by DistroKid
import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  LinearProgress,
  IconButton,
  Paper,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Divider,
  Dialog,
  DialogContent
} from '@mui/material';
import { CloudUpload, MusicNote, Image as ImageIcon, CheckCircle, ArrowBack, ArrowForward, Add } from '@mui/icons-material';
import {
  db,
  storage,
  auth,
  signInWithPopup,
  provider
} from "../firebaseConfig";
import { collection, Timestamp, addDoc, getDocs, query, where, doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { parseBlob } from 'music-metadata-browser';
import { checkMembershipStatus } from '../services/membershipService';
import { useModal } from '../hooks/useModal';
import { compressImage } from '../utils/imageOptimizer';
import Footer from '../components/Footer';

const steps = ['Release Type', 'Upload Files', 'Track Details', 'Review'];

// Comprehensive genre list based on industry standards
const PLATFORM_GENRES = [
  'Afrobeat',
  'Alternative',
  'Ambient',
  'Bluegrass',
  'Blues',
  'Boom Bap',
  'Breakbeat',
  'Children\'s Music',
  'Classical',
  'Comedy',
  'Country',
  'Dance',
  'Dancehall',
  'Deep House',
  'Disco',
  'Downtempo',
  'Drum & Bass',
  'Dub',
  'Dubstep',
  'EDM',
  'Electro',
  'Electronic',
  'Emo',
  'Experimental',
  'Folk',
  'Funk',
  'Garage',
  'Gospel',
  'Grime',
  'Grunge',
  'Hardcore',
  'Hip-Hop',
  'House',
  'Indie',
  'Industrial',
  'Instrumental',
  'Jazz',
  'Jungle',
  'K-Pop',
  'Latin',
  'Lo-Fi',
  'Metal',
  'Minimal',
  'New Age',
  'Nu Jazz',
  'Phonk',
  'Pop',
  'Post-Rock',
  'Progressive',
  'Psychedelic',
  'Punk',
  'R&B',
  'Rap',
  'Reggae',
  'Reggaeton',
  'Rock',
  'Shoegaze',
  'Singer-Songwriter',
  'Ska',
  'Soul',
  'Soundtrack',
  'Spoken Word',
  'Synthpop',
  'Synthwave',
  'Techno',
  'Trance',
  'Trap',
  'Trip-Hop',
  'UK Garage',
  'Vaporwave',
  'World'
].sort();


const initialForm = {
  releaseType: 'single', // single, album, ep
  albumTitle: '',
  artist: '',

  // Album-level information
  previouslyReleased: false,
  originalReleaseDate: '',
  upc: '',
  recordLabel: '',
  copyrightYear: new Date().getFullYear(),
  copyrightHolder: '',
  language: 'English',
  albumPrice: 'auto',
  preorder: false,
  preorderDate: '',
  releaseDate: new Date().toISOString().split('T')[0],

  // Track information
  tracks: [{
    title: '',
    primaryGenre: '',
    additionalGenres: [],
    explicit: false,
    isInstrumental: false,
    isRadioEdit: false,
    isCoverSong: false,
    isAIGenerated: false,
    aiGenerationDetails: '',
    originalArtist: '',
    language: 'English',
    writers: [''], // Array of writer names, starts with one empty field
    writerRoles: ['both'], // 'music', 'lyrics', or 'both' for each writer
    composers: '',
    publishers: '',
    featuredArtists: '',
    remixer: '',
    isrc: '',
    lyrics: '',
    audioFile: null,
    duration: 0
  }],
  coverArt: null,
  description: ''
};

export default function ForArtists() {
  const { user: authUser } = useAuth();
  const { showAlert } = useModal();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [coverPreview, setCoverPreview] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState(''); // What's currently being uploaded
  const [uploadComplete, setUploadComplete] = useState(false);
  const [customGenres, setCustomGenres] = useState([]);
  const [membershipStatus, setMembershipStatus] = useState({ active: false, expiresAt: null, daysRemaining: null });
  const [loadingMembership, setLoadingMembership] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCustomGenres();
    if (authUser) {
      loadMembershipStatus();
    }
  }, [authUser]);

  // Check for successful membership purchase
  useEffect(() => {
    const membershipParam = searchParams.get('membership');
    if (membershipParam === 'active' && authUser) {
      // Show success message
      setStatus({
        type: 'success',
        message: '🎉 Welcome to BeatFlow! Your artist membership is now active. You can now upload unlimited tracks!'
      });

      // Reload membership status to reflect the new membership
      loadMembershipStatus();

      // Remove the query parameter from URL after showing message
      setTimeout(() => {
        setSearchParams({});
      }, 100);

      // Scroll to top to show the success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [searchParams, authUser]);

  // Redirect to pricing page if no active membership (but not if coming from successful payment)
  useEffect(() => {
    const membershipParam = searchParams.get('membership');
    const isReturningFromPayment = membershipParam === 'active';

    if (!loadingMembership && !membershipStatus.active && !isReturningFromPayment) {
      navigate('/artist-pricing');
    }
  }, [loadingMembership, membershipStatus.active, navigate, searchParams]);

  const loadMembershipStatus = async () => {
    try {
      setLoadingMembership(true);
      const status = await checkMembershipStatus(authUser.uid);
      setMembershipStatus(status);
    } catch (error) {
      console.error('Error loading membership:', error);
    } finally {
      setLoadingMembership(false);
    }
  };

  const loadCustomGenres = async () => {
    try {
      const q = query(
        collection(db, 'customGenres'),
        where('status', '==', 'approved')
      );
      const snapshot = await getDocs(q);
      const genres = snapshot.docs.map(doc => doc.data().name);
      setCustomGenres(genres);
    } catch (error) {
      console.error('Error loading custom genres:', error);
    }
  };

  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Set user role to "artist" when signing up through ForArtists page
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { role: "artist" }, { merge: true });

    } catch (err) {
      setStatus({ type: 'error', message: 'Sign-in failed.' });
      console.error("SIGN IN ERROR:", err);
    }
  };

  const handleNext = () => {
    // Clear any previous status messages
    setStatus({ type: '', message: '' });

    // Validation for each step
    if (activeStep === 0 && !form.releaseType) {
      setStatus({ type: 'error', message: 'Please select a release type' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (activeStep === 1) {
      if (!form.coverArt) {
        setStatus({ type: 'error', message: 'Please upload cover art' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (form.tracks.some(t => !t.audioFile)) {
        const firstMissingIndex = form.tracks.findIndex(t => !t.audioFile);
        setStatus({ type: 'error', message: `Please upload audio file for Track ${firstMissingIndex + 1}` });
        // Scroll to the first missing audio file
        setTimeout(() => {
          const element = document.getElementById(`audio-upload-${firstMissingIndex}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        return;
      }
    }
    if (activeStep === 2) {
      if (!form.artist) {
        setStatus({ type: 'error', message: 'Please enter artist name' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          const element = document.getElementById('artist-name-field');
          if (element) {
            element.focus();
          }
        }, 100);
        return;
      }

      // Check for missing track titles
      const missingTitleIndex = form.tracks.findIndex(t => !t.title);
      if (missingTitleIndex !== -1) {
        setStatus({ type: 'error', message: `Please enter title for Track ${missingTitleIndex + 1}` });
        setTimeout(() => {
          const element = document.getElementById(`track-title-${missingTitleIndex}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.focus();
          }
        }, 100);
        return;
      }

      // Check for missing primary genre
      const missingGenreIndex = form.tracks.findIndex(t => !t.primaryGenre);
      if (missingGenreIndex !== -1) {
        setStatus({ type: 'error', message: `Please select primary genre for Track ${missingGenreIndex + 1}` });
        setTimeout(() => {
          const element = document.getElementById(`track-primary-genre-${missingGenreIndex}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        return;
      }
    }
    setStatus({ type: '', message: '' });
    setActiveStep((prevStep) => prevStep + 1);

    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);

    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleTrackChange = (index, field, value) => {
    const newTracks = [...form.tracks];
    newTracks[index][field] = value;
    setForm(prev => ({ ...prev, tracks: newTracks }));
  };

  const handleCoverArtUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Compress image before storing
        const compressedFile = await compressImage(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.85
        });
        setForm(prev => ({ ...prev, coverArt: compressedFile }));
        setCoverPreview(URL.createObjectURL(compressedFile));
      } catch (error) {
        console.error('Error compressing cover art:', error);
        // Fallback to original file if compression fails
        setForm(prev => ({ ...prev, coverArt: file }));
        setCoverPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleCoverArtDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        // Compress image before storing
        const compressedFile = await compressImage(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.85
        });
        setForm(prev => ({ ...prev, coverArt: compressedFile }));
        setCoverPreview(URL.createObjectURL(compressedFile));
      } catch (error) {
        console.error('Error compressing cover art:', error);
        // Fallback to original file if compression fails
        setForm(prev => ({ ...prev, coverArt: file }));
        setCoverPreview(URL.createObjectURL(file));
      }
    }
  };

  const extractMetadata = async (file, index) => {
    try {
      // Parse audio file metadata using music-metadata-browser
      const metadata = await parseBlob(file);

      const audio = new Audio();
      const url = URL.createObjectURL(file);
      audio.src = url;

      audio.onloadedmetadata = () => {
        handleTrackChange(index, 'audioFile', file);
        handleTrackChange(index, 'duration', Math.floor(audio.duration));

        // Extract title from ID3 tags or fallback to filename
        let trackTitle = metadata.common.title || file.name.replace(/\.[^/.]+$/, '');

        // Auto-populate track title from metadata if empty
        if (!form.tracks[index].title && trackTitle) {
          handleTrackChange(index, 'title', trackTitle);
        }

        // Also extract genres if available and field is empty
        if (!form.tracks[index].primaryGenre && metadata.common.genre && metadata.common.genre.length > 0) {
          const matchedGenres = metadata.common.genre
            .map(metaGenre => PLATFORM_GENRES.find(g => g.toLowerCase() === metaGenre.toLowerCase()))
            .filter(Boolean);
          if (matchedGenres.length > 0) {
            handleTrackChange(index, 'primaryGenre', matchedGenres[0]);
            if (matchedGenres.length > 1) {
              handleTrackChange(index, 'additionalGenres', matchedGenres.slice(1, 5));
            }
          }
        }

        URL.revokeObjectURL(url);
      };
    } catch (error) {
      console.error('Error reading metadata:', error);
      // Fallback to basic file handling if metadata parsing fails
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      audio.src = url;

      audio.onloadedmetadata = () => {
        handleTrackChange(index, 'audioFile', file);
        handleTrackChange(index, 'duration', Math.floor(audio.duration));

        // Use filename as fallback
        const trackTitle = file.name.replace(/\.[^/.]+$/, '');
        if (!form.tracks[index].title && trackTitle) {
          handleTrackChange(index, 'title', trackTitle);
        }

        URL.revokeObjectURL(url);
      };
    }
  };

  const handleAudioUpload = (index, e) => {
    const file = e.target.files?.[0];
    if (file) {
      extractMetadata(file, index);
    }
  };

  const handleAudioDrop = (index, e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      extractMetadata(file, index);
    }
  };

  // Handle dropping multiple audio files at once
  const handleBulkAudioDrop = async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('audio/'));

    if (files.length === 0) {
      setStatus({ type: 'warning', message: 'Please drop audio files only' });
      return;
    }

    await processBulkAudioFiles(files);
  };

  // Handle selecting multiple audio files via file input
  const handleBulkAudioSelect = async (e) => {
    const files = Array.from(e.target.files).filter(file => file.type.startsWith('audio/'));

    if (files.length === 0) {
      setStatus({ type: 'warning', message: 'Please select audio files only' });
      return;
    }

    await processBulkAudioFiles(files);
  };

  // Process multiple audio files
  const processBulkAudioFiles = async (files) => {
    setStatus({ type: 'info', message: `Processing ${files.length} audio file(s)...` });

    // Process each file and extract metadata synchronously
    const processedTracks = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const trackData = {
        title: file.name.replace(/\.[^/.]+$/, ''), // Default to filename
        primaryGenre: '',
        additionalGenres: [],
        explicit: false,
        isInstrumental: false,
        isRadioEdit: false,
        isCoverSong: false,
        isAIGenerated: false,
        aiGenerationDetails: '',
        originalArtist: '',
        language: 'English',
        writers: [''],
        writerRoles: ['both'],
        composers: '',
        publishers: '',
        featuredArtists: '',
        remixer: '',
        isrc: '',
        lyrics: '',
        audioFile: file,
        duration: 0
      };

      // Get duration using Audio element (metadata parsing has issues with Buffer in browser)
      try {
        const audio = new Audio();
        const url = URL.createObjectURL(file);
        audio.src = url;

        await new Promise((resolve) => {
          audio.onloadedmetadata = () => {
            trackData.duration = Math.floor(audio.duration);
            URL.revokeObjectURL(url);
            resolve();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
        });
      } catch (audioError) {
        console.error('Error getting audio duration:', audioError);
      }

      processedTracks.push(trackData);
    }

    // Update form with all processed tracks at once
    setForm(prev => ({ ...prev, tracks: processedTracks }));
    setStatus({ type: 'success', message: `✅ ${files.length} audio file(s) loaded successfully!` });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const addTrack = () => {
    setForm(prev => ({
      ...prev,
      tracks: [...prev.tracks, {
        title: '',
        primaryGenre: '',
        additionalGenres: [],
        explicit: false,
        isInstrumental: false,
        isRadioEdit: false,
        isCoverSong: false,
        isAIGenerated: false,
        aiGenerationDetails: '',
        originalArtist: '',
        language: 'English',
        writers: [''],
        writerRoles: ['both'],
        composers: '',
        publishers: '',
        featuredArtists: '',
        remixer: '',
        isrc: '',
        lyrics: '',
        audioFile: null,
        duration: 0
      }]
    }));
  };

  const removeTrack = (index) => {
    if (form.tracks.length > 1) {
      const newTracks = form.tracks.filter((_, i) => i !== index);
      setForm(prev => ({ ...prev, tracks: newTracks }));
    }
  };

  const copyGenresToAllTracks = (sourceIndex) => {
    const sourcePrimary = form.tracks[sourceIndex].primaryGenre;
    const sourceAdditional = form.tracks[sourceIndex].additionalGenres;

    if (!sourcePrimary) {
      setStatus({ type: 'warning', message: 'No primary genre to copy' });
      return;
    }

    const newTracks = form.tracks.map((track, index) => {
      if (index === sourceIndex) return track;
      return {
        ...track,
        primaryGenre: sourcePrimary,
        additionalGenres: [...sourceAdditional]
      };
    });
    setForm(prev => ({ ...prev, tracks: newTracks }));
    setStatus({ type: 'success', message: `Copied genres to ${form.tracks.length - 1} track(s)` });
    setTimeout(() => setStatus({ type: '', message: '' }), 2000);
  };

  const copyTrackInfoToAll = (sourceIndex, field) => {
    const sourceValue = form.tracks[sourceIndex][field];

    if (!sourceValue && field !== 'explicit' && field !== 'isInstrumental') {
      setStatus({ type: 'warning', message: `No ${field} to copy` });
      return;
    }

    // Special handling for writers array
    if (field === 'writers' && Array.isArray(sourceValue) && sourceValue.length === 0) {
      setStatus({ type: 'warning', message: 'No writers to copy' });
      return;
    }

    const newTracks = form.tracks.map((track, index) => {
      if (index === sourceIndex) return track;
      return {
        ...track,
        [field]: Array.isArray(sourceValue) ? [...sourceValue] : sourceValue
      };
    });

    setForm(prev => ({ ...prev, tracks: newTracks }));
    setStatus({ type: 'success', message: `Applied ${field} to all tracks` });
    setTimeout(() => setStatus({ type: '', message: '' }), 2000);
  };

  const copyFeaturedArtistToAllTracks = (sourceIndex) => {
    const sourceFeaturedArtist = form.tracks[sourceIndex].featuredArtists;

    if (!sourceFeaturedArtist) {
      setStatus({ type: 'warning', message: 'No featured artist to copy' });
      return;
    }

    const newTracks = form.tracks.map((track, index) => {
      if (index === sourceIndex) return track;
      return {
        ...track,
        featuredArtists: sourceFeaturedArtist
      };
    });

    setForm(prev => ({ ...prev, tracks: newTracks }));
    setStatus({ type: 'success', message: `Applied featured artist to ${form.tracks.length - 1} track(s)` });
    setTimeout(() => setStatus({ type: '', message: '' }), 2000);
  };

  const addWriter = (trackIndex) => {
    const newTracks = [...form.tracks];
    if (!Array.isArray(newTracks[trackIndex].writers)) {
      newTracks[trackIndex].writers = [];
    }
    if (!Array.isArray(newTracks[trackIndex].writerRoles)) {
      newTracks[trackIndex].writerRoles = [];
    }
    newTracks[trackIndex].writers.push('');
    newTracks[trackIndex].writerRoles.push('both');
    setForm(prev => ({ ...prev, tracks: newTracks }));
  };

  const removeWriter = (trackIndex, writerIndex) => {
    const newTracks = [...form.tracks];
    if (Array.isArray(newTracks[trackIndex].writers)) {
      newTracks[trackIndex].writers.splice(writerIndex, 1);
      if (Array.isArray(newTracks[trackIndex].writerRoles)) {
        newTracks[trackIndex].writerRoles.splice(writerIndex, 1);
      }
      setForm(prev => ({ ...prev, tracks: newTracks }));
    }
  };

  const updateWriter = (trackIndex, writerIndex, value) => {
    const newTracks = [...form.tracks];
    if (!Array.isArray(newTracks[trackIndex].writers)) {
      newTracks[trackIndex].writers = [];
    }
    newTracks[trackIndex].writers[writerIndex] = value;
    setForm(prev => ({ ...prev, tracks: newTracks }));
  };

  const updateWriterRole = (trackIndex, writerIndex, role) => {
    const newTracks = [...form.tracks];
    if (!Array.isArray(newTracks[trackIndex].writerRoles)) {
      newTracks[trackIndex].writerRoles = [];
    }
    newTracks[trackIndex].writerRoles[writerIndex] = role;
    setForm(prev => ({ ...prev, tracks: newTracks }));
  };

  const copyArtistToAllTracks = () => {
    if (!form.artist) {
      setStatus({ type: 'warning', message: 'Please enter artist name first' });
      return;
    }
    // Artist name is already global, but we can show confirmation
    setStatus({ type: 'success', message: 'Artist name applies to all tracks' });
    setTimeout(() => setStatus({ type: '', message: '' }), 2000);
  };

  const handleSubmit = async () => {
    setStatus({ type: '', message: '' });
    setLoading(true);
    setUploadProgress(0);
    setUploadComplete(false);

    try {
      if (!authUser) throw new Error("You must be signed in.");

      // Check if user has active membership
      if (!membershipStatus.active) {
        setStatus({
          type: 'error',
          message: 'You need an active membership to upload music. Redirecting to pricing...'
        });
        setLoading(false);
        setTimeout(() => navigate('/artist-pricing'), 2000);
        return;
      }

      // Upload cover art
      setUploadStage('Uploading cover art...');
      setUploadProgress(5);
      const coverRef = ref(
        storage,
        `artist-uploads/covers/${Date.now()}_${form.coverArt.name}`
      );
      await uploadBytes(coverRef, form.coverArt);
      const coverUrl = await getDownloadURL(coverRef);
      setUploadProgress(20);

      // Upload audio files
      const trackData = [];
      for (let index = 0; index < form.tracks.length; index++) {
        const track = form.tracks[index];
        setUploadStage(`Uploading track ${index + 1} of ${form.tracks.length}: "${track.title}"...`);

        // Update progress as we start each track
        const baseProgress = 20 + (index / form.tracks.length) * 60;
        setUploadProgress(Math.round(baseProgress));

        const audioRef = ref(
          storage,
          `artist-uploads/audio/${Date.now()}_${track.audioFile.name}`
        );
        await uploadBytes(audioRef, track.audioFile);
        const audioUrl = await getDownloadURL(audioRef);

        // Update progress when track completes
        setUploadProgress(Math.round(20 + ((index + 1) / form.tracks.length) * 60));

        trackData.push({
          title: track.title,
          primaryGenre: track.primaryGenre,
          additionalGenres: track.additionalGenres,
          explicit: track.explicit,
          isInstrumental: track.isInstrumental,
          isRadioEdit: track.isRadioEdit,
          isCoverSong: track.isCoverSong,
          isAIGenerated: track.isAIGenerated,
          aiGenerationDetails: track.aiGenerationDetails,
          originalArtist: track.originalArtist,
          language: track.language,
          writers: track.writers,
          writerRoles: track.writerRoles,
          composers: track.composers,
          publishers: track.publishers,
          featuredArtists: track.featuredArtists,
          remixer: track.remixer,
          isrc: track.isrc,
          duration: track.duration,
          audioUrl
        });
      }

      // Save to Firestore
      setUploadStage('Saving release details...');
      setUploadProgress(85);
      const submissionRef = await addDoc(collection(db, "artistSubmissions"), {
        releaseType: form.releaseType,
        albumTitle: form.albumTitle || form.tracks[0].title,
        artist: form.artist,
        tracks: trackData,
        coverUrl,
        releaseDate: form.releaseDate,
        recordLabel: 'BeatFlow Media Group', // Default label for all releases
        copyrightYear: form.copyrightYear,
        copyrightHolder: form.copyrightHolder,
        description: form.description,
        uploadedBy: authUser.uid,
        submittedAt: Timestamp.now(),
        status: "pending",
        membershipType: membershipStatus.active ? 'annual' : null,
        membershipExpiresAt: membershipStatus.expiresAt
      });

      setUploadStage('Upload complete!');
      setUploadProgress(100);
      setUploadComplete(true);
      setStatus({ type: 'success', message: '✅ Release submitted successfully!' });

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setStatus({ type: 'error', message: '❌ Upload failed. ' + (err?.message || '') });
      setUploadStage('');
      console.error("UPLOAD ERROR:", err);
    }

    setLoading(false);
  };

  // Step 1: Release Type
  const renderReleaseType = () => (
    <Box sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        What are you releasing?
      </Typography>
      <Grid container spacing={3}>
        {[
          { value: 'single', label: 'Single', desc: '1-3 tracks' },
          { value: 'ep', label: 'EP', desc: '4-6 tracks' },
          { value: 'album', label: 'Album', desc: '7+ tracks' }
        ].map((type) => (
          <Grid item xs={12} md={4} key={type.value}>
            <Card
              sx={{
                cursor: 'pointer',
                border: form.releaseType === type.value ? '3px solid #1DB954' : '1px solid #333',
                bgcolor: form.releaseType === type.value ? 'rgba(29, 185, 84, 0.1)' : 'background.paper',
                '&:hover': { borderColor: '#1DB954' }
              }}
              onClick={() => handleFormChange('releaseType', type.value)}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <MusicNote sx={{ fontSize: 60, color: '#1DB954', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {type.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {type.desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {form.releaseType && (form.releaseType === 'album' || form.releaseType === 'ep') && (
        <Box sx={{ mt: 4 }}>
          <TextField
            fullWidth
            label={`${form.releaseType.toUpperCase()} Title`}
            value={form.albumTitle}
            onChange={(e) => handleFormChange('albumTitle', e.target.value)}
            required
            sx={{ mb: 2 }}
          />
        </Box>
      )}
    </Box>
  );

  // Step 2: Upload Files
  const renderUploadFiles = () => (
    <Box sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Upload Your Files
      </Typography>

      {/* Cover Art */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          border: '2px dashed #333',
          bgcolor: 'rgba(29, 185, 84, 0.05)',
          transition: 'all 0.3s',
          '&:hover': { borderColor: '#1DB954', bgcolor: 'rgba(29, 185, 84, 0.1)' }
        }}
        onDrop={handleCoverArtDrop}
        onDragOver={handleDragOver}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>Cover Art *</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Minimum 3000x3000px, JPG or PNG • Drag and drop or click to upload
        </Typography>
        <Button
          variant="contained"
          component="label"
          startIcon={<ImageIcon />}
          sx={{ mb: 2 }}
        >
          Choose Cover Art
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleCoverArtUpload}
          />
        </Button>
        {coverPreview && (
          <Box sx={{ mt: 2 }}>
            <img src={coverPreview} alt="Cover Preview" style={{ width: 200, height: 200, objectFit: 'cover', borderRadius: 8 }} />
          </Box>
        )}
      </Paper>

      {/* Bulk Audio Upload Drop Zone */}
      <Paper
        sx={{
          p: 4,
          mb: 3,
          border: '3px dashed #1DB954',
          bgcolor: 'rgba(29, 185, 84, 0.05)',
          textAlign: 'center',
          transition: 'all 0.3s',
          cursor: 'pointer',
          '&:hover': {
            borderColor: '#1ed760',
            bgcolor: 'rgba(29, 185, 84, 0.1)',
            transform: 'scale(1.01)'
          }
        }}
        onDrop={handleBulkAudioDrop}
        onDragOver={handleDragOver}
      >
        <CloudUpload sx={{ fontSize: 60, color: '#1DB954', mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1DB954', mb: 1 }}>
          Drop Multiple Audio Files Here
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Perfect for albums & EPs • Drag and drop all your tracks at once
        </Typography>
        <Button
          variant="contained"
          component="label"
          startIcon={<CloudUpload />}
          sx={{
            bgcolor: '#1DB954',
            color: 'white',
            mb: 2,
            px: 4,
            py: 1.5,
            fontWeight: 'bold',
            '&:hover': { bgcolor: '#1ed760' }
          }}
        >
          Or Choose Files
          <input
            type="file"
            hidden
            multiple
            accept="audio/*"
            onChange={handleBulkAudioSelect}
          />
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          Supported formats: MP3, WAV, FLAC, M4A, OGG
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#1DB954' }}>
          ✨ Track titles and genres will be auto-extracted from file metadata
        </Typography>
      </Paper>

      {/* Audio Files */}
      <Typography variant="h6" sx={{ mb: 2 }}>Audio Files *</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Or upload tracks individually:
      </Typography>
      {form.tracks.map((track, index) => (
        <Paper
          id={`audio-upload-${index}`}
          key={index}
          sx={{
            p: 3,
            mb: 2,
            border: '2px dashed #333',
            bgcolor: track.audioFile ? 'rgba(29, 185, 84, 0.05)' : 'transparent',
            transition: 'all 0.3s',
            '&:hover': { borderColor: '#1DB954', bgcolor: 'rgba(29, 185, 84, 0.05)' }
          }}
          onDrop={(e) => handleAudioDrop(index, e)}
          onDragOver={handleDragOver}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={1}>
              <Typography variant="h6" color="text.secondary">
                {index + 1}
              </Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                fullWidth
                sx={{
                  borderColor: track.audioFile ? '#1DB954' : undefined,
                  color: track.audioFile ? '#1DB954' : undefined
                }}
              >
                {track.audioFile ? track.audioFile.name : 'Drag & drop or choose audio file'}
                <input
                  type="file"
                  hidden
                  accept="audio/*"
                  onChange={(e) => handleAudioUpload(index, e)}
                />
              </Button>
              {track.duration > 0 && (
                <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#1DB954' }}>
                  ✓ Duration: {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={3}>
              {form.tracks.length > 1 && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => removeTrack(index)}
                  fullWidth
                >
                  Remove
                </Button>
              )}
            </Grid>
          </Grid>
        </Paper>
      ))}
      <Button
        variant="text"
        onClick={addTrack}
        sx={{ mt: 2 }}
      >
        + Add Another Track
      </Button>
    </Box>
  );

  // Step 3: Track Details
  const renderTrackDetails = () => (
    <Box sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Track Information
      </Typography>

      {/* Artist Name */}
      <Box sx={{ mb: 3 }}>
        <TextField
          id="artist-name-field"
          fullWidth
          label="Artist / Band Name"
          value={form.artist}
          onChange={(e) => handleFormChange('artist', e.target.value)}
          required
          error={!form.artist && status.type === 'error'}
          placeholder="e.g., Percy Rice, The Awesome Band"
          helperText="Your stage name or band name - this will be displayed prominently"
        />
        <Paper sx={{ p: 2, mt: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', border: '1px solid rgba(33, 150, 243, 0.3)' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            ℹ️ <strong>Artist Name vs. Songwriter Name</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            • <strong>Artist Name</strong> (this field): Your stage/band name, displayed prominently everywhere
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            • <strong>Songwriter Name</strong> (below): Real/legal names, shown only in credits/lyrics
          </Typography>
        </Paper>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Individual Track Details */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Set genre and details for each track below. You can copy genres across all tracks using the button.
      </Typography>
      {form.tracks.map((track, index) => (
        <Paper key={index} sx={{ p: 3, mb: 3, border: '1px solid #333' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Track {index + 1}
            </Typography>
            {form.tracks.length > 1 && track.primaryGenre && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => copyGenresToAllTracks(index)}
                sx={{ fontSize: '0.75rem' }}
              >
                Copy Genres to All Tracks
              </Button>
            )}
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                id={`track-title-${index}`}
                fullWidth
                label="Track Title"
                value={track.title}
                onChange={(e) => handleTrackChange(index, 'title', e.target.value)}
                required
                placeholder="Enter track title"
                error={!track.title && status.type === 'error'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!track.primaryGenre && status.type === 'error'}>
                <InputLabel>Primary Genre *</InputLabel>
                <Select
                  id={`track-primary-genre-${index}`}
                  value={track.primaryGenre}
                  label="Primary Genre *"
                  onChange={(e) => handleTrackChange(index, 'primaryGenre', e.target.value)}
                >
                  {[...PLATFORM_GENRES, ...customGenres].map(genre => (
                    <MenuItem key={genre} value={genre}>{genre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Additional Genres (max 4)</InputLabel>
                <Select
                  multiple
                  value={track.additionalGenres}
                  label="Additional Genres (max 4)"
                  onChange={(e) => {
                    const value = e.target.value;
                    // Limit to 4 additional genres
                    if (value.length <= 4) {
                      handleTrackChange(index, 'additionalGenres', value);
                    }
                  }}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {[...PLATFORM_GENRES, ...customGenres]
                    .filter(genre => genre !== track.primaryGenre)
                    .map(genre => (
                      <MenuItem
                        key={genre}
                        value={genre}
                        disabled={track.additionalGenres.length >= 4 && !track.additionalGenres.includes(genre)}
                      >
                        <Checkbox checked={track.additionalGenres.indexOf(genre) > -1} />
                        {genre}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {track.additionalGenres.length}/4 additional genres selected
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={track.language}
                  label="Language"
                  onChange={(e) => handleTrackChange(index, 'language', e.target.value)}
                >
                  <MenuItem value="English">English</MenuItem>
                  <MenuItem value="Spanish">Spanish</MenuItem>
                  <MenuItem value="French">French</MenuItem>
                  <MenuItem value="German">German</MenuItem>
                  <MenuItem value="Japanese">Japanese</MenuItem>
                  <MenuItem value="Korean">Korean</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={track.explicit}
                    onChange={(e) => handleTrackChange(index, 'explicit', e.target.checked)}
                  />
                }
                label="Explicit Content"
              />
            </Grid>

            {/* Song Information */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                Song Information
              </Typography>
            </Grid>

            {/* Instrumental Toggle */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, border: '1px solid #333' }}>
                <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 'bold' }}>
                  Song Type
                </Typography>
                <RadioGroup
                  value={track.isInstrumental ? 'instrumental' : 'lyrics'}
                  onChange={(e) => handleTrackChange(index, 'isInstrumental', e.target.value === 'instrumental')}
                >
                  <FormControlLabel
                    value="lyrics"
                    control={<Radio />}
                    label="This song contains lyrics"
                  />
                  <FormControlLabel
                    value="instrumental"
                    control={<Radio />}
                    label="This song is instrumental and contains no lyrics"
                  />
                </RadioGroup>
              </Paper>
            </Grid>

            {/* Radio Edit */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, border: '1px solid #333' }}>
                <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 'bold' }}>
                  Is this a "Radio Edit"?
                </Typography>
                <RadioGroup
                  value={track.isRadioEdit ? 'yes' : 'no'}
                  onChange={(e) => handleTrackChange(index, 'isRadioEdit', e.target.value === 'yes')}
                >
                  <FormControlLabel
                    value="no"
                    control={<Radio />}
                    label="No - This song is clean, and always has been"
                  />
                  <FormControlLabel
                    value="yes"
                    control={<Radio />}
                    label="Yes - There is an explicit version, but this is the clean/censored version"
                  />
                </RadioGroup>
              </Paper>
            </Grid>

            {/* Cover Song */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, border: '1px solid #333' }}>
                <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 'bold' }}>
                  Is this a Cover Song?
                </Typography>
                <RadioGroup
                  value={track.isCoverSong ? 'yes' : 'no'}
                  onChange={(e) => handleTrackChange(index, 'isCoverSong', e.target.value === 'yes')}
                  row
                >
                  <FormControlLabel
                    value="no"
                    control={<Radio />}
                    label="No - Original song"
                  />
                  <FormControlLabel
                    value="yes"
                    control={<Radio />}
                    label="Yes - This is a cover"
                  />
                </RadioGroup>
                {track.isCoverSong && (
                  <TextField
                    fullWidth
                    label="Original Artist Name"
                    value={track.originalArtist || ''}
                    onChange={(e) => handleTrackChange(index, 'originalArtist', e.target.value)}
                    placeholder="e.g., The Beatles"
                    helperText="Who originally performed this song?"
                    sx={{ mt: 2 }}
                  />
                )}
              </Paper>
            </Grid>

            {/* AI-Generated Content */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, border: '1px solid #333' }}>
                <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 'bold' }}>
                  AI-Generated Content
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  Transparency about AI usage helps listeners and ensures compliance with platform policies
                </Typography>
                <RadioGroup
                  value={track.isAIGenerated ? 'yes' : 'no'}
                  onChange={(e) => handleTrackChange(index, 'isAIGenerated', e.target.value === 'yes')}
                  row
                >
                  <FormControlLabel
                    value="no"
                    control={<Radio />}
                    label="No - Created entirely by humans"
                  />
                  <FormControlLabel
                    value="yes"
                    control={<Radio />}
                    label="Yes - AI-generated or AI-assisted"
                  />
                </RadioGroup>
                {track.isAIGenerated && (
                  <TextField
                    fullWidth
                    label="AI Generation Details (Optional)"
                    value={track.aiGenerationDetails || ''}
                    onChange={(e) => handleTrackChange(index, 'aiGenerationDetails', e.target.value)}
                    placeholder="e.g., Generated with Suno AI, AI-assisted mixing with iZotope, vocals generated with Synthesizer V, etc."
                    helperText="Describe how AI was used in creating this track (generation, mixing, mastering, vocals, instruments, etc.)"
                    sx={{ mt: 2 }}
                    multiline
                    rows={2}
                  />
                )}
              </Paper>
            </Grid>

            {/* Writers & Contributors */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Songwriter(s) - Real Names
                </Typography>
                {form.tracks.length > 1 && (track.writers || []).length > 0 && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => copyTrackInfoToAll(index, 'writers')}
                    sx={{ fontSize: '0.7rem' }}
                  >
                    Copy Songwriters to All Tracks
                  </Button>
                )}
              </Box>
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(29, 185, 84, 0.1)', border: '1px solid rgba(29, 185, 84, 0.3)' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  💡 <strong>Use Real Names, Not Stage Names</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  • Songwriters are credited by their <strong>real names</strong>, not stage or band names
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  • Real names will be displayed in song credits/lyrics, not prominently as artist names
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  • Example: Use "John Smith" instead of "DJ Awesome"
                </Typography>
              </Paper>
            </Grid>

            {/* Multiple Songwriters */}
            {(track.writers || ['']).map((writer, writerIndex) => (
              <React.Fragment key={`writer-${writerIndex}`}>
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    label={`Songwriter ${writerIndex + 1} - Real Name`}
                    value={writer}
                    onChange={(e) => updateWriter(index, writerIndex, e.target.value)}
                    placeholder="e.g., John Smith"
                    helperText="Enter legal/real name, not stage name"
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <FormControl fullWidth>
                    <InputLabel>Contribution</InputLabel>
                    <Select
                      value={(track.writerRoles || [])[writerIndex] || 'both'}
                      label="Contribution"
                      onChange={(e) => updateWriterRole(index, writerIndex, e.target.value)}
                    >
                      <MenuItem value="both">Music & Lyrics</MenuItem>
                      <MenuItem value="music">Music Only</MenuItem>
                      <MenuItem value="lyrics">Lyrics Only</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  {(track.writers || []).length > 1 && (
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={() => removeWriter(index, writerIndex)}
                      sx={{ height: 56 }}
                    >
                      Remove
                    </Button>
                  )}
                </Grid>
              </React.Fragment>
            ))}

            <Grid item xs={12}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => addWriter(index)}
                startIcon={<Add />}
                sx={{ mb: 2 }}
              >
                Add Another Songwriter
              </Button>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  label="Publishers"
                  value={track.publishers}
                  onChange={(e) => handleTrackChange(index, 'publishers', e.target.value)}
                  placeholder="e.g., Your Publishing Company"
                  helperText="Publishing company (if any)"
                />
                {form.tracks.length > 1 && track.publishers && (
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => copyTrackInfoToAll(index, 'publishers')}
                    sx={{ mt: 1, minWidth: 80, fontSize: '0.7rem' }}
                  >
                    Apply to All
                  </Button>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  label="Featured Artists"
                  value={track.featuredArtists}
                  onChange={(e) => handleTrackChange(index, 'featuredArtists', e.target.value)}
                  placeholder="e.g., ft. Artist Name"
                  helperText="Leave blank if none"
                />
                {form.tracks.length > 1 && track.featuredArtists && (
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => copyFeaturedArtistToAllTracks(index)}
                    sx={{ mt: 1, minWidth: 80, fontSize: '0.7rem' }}
                  >
                    Apply to All
                  </Button>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Remixer"
                value={track.remixer}
                onChange={(e) => handleTrackChange(index, 'remixer', e.target.value)}
                placeholder="e.g., DJ Remix"
                helperText="If this is a remix"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ISRC Code (Optional)"
                value={track.isrc}
                onChange={(e) => handleTrackChange(index, 'isrc', e.target.value)}
                placeholder="e.g., USXX12345678"
                helperText="International Standard Recording Code"
              />
            </Grid>
          </Grid>
        </Paper>
      ))}

      <Divider sx={{ my: 4 }} />

      {/* Release Information */}
      <Typography variant="h6" sx={{ mb: 2 }}>Release Information</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Checkbox
                checked={form.previouslyReleased}
                onChange={(e) => handleFormChange('previouslyReleased', e.target.checked)}
              />
            }
            label="Has this release been previously released?"
          />
          {form.previouslyReleased && (
            <TextField
              fullWidth
              type="date"
              label="Original Release Date"
              value={form.originalReleaseDate}
              onChange={(e) => handleFormChange('originalReleaseDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mt: 2 }}
            />
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Language</InputLabel>
            <Select
              value={form.language}
              label="Language"
              onChange={(e) => handleFormChange('language', e.target.value)}
            >
              <MenuItem value="English">English</MenuItem>
              <MenuItem value="Spanish">Spanish</MenuItem>
              <MenuItem value="French">French</MenuItem>
              <MenuItem value="German">German</MenuItem>
              <MenuItem value="Italian">Italian</MenuItem>
              <MenuItem value="Portuguese">Portuguese</MenuItem>
              <MenuItem value="Japanese">Japanese</MenuItem>
              <MenuItem value="Korean">Korean</MenuItem>
              <MenuItem value="Mandarin">Mandarin</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="Release Date"
            value={form.releaseDate}
            onChange={(e) => handleFormChange('releaseDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
            helperText="When should this be available to listeners?"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Checkbox
                checked={form.preorder}
                onChange={(e) => handleFormChange('preorder', e.target.checked)}
              />
            }
            label="Make available for pre-order"
          />
          {form.preorder && (
            <TextField
              fullWidth
              type="date"
              label="Pre-order Start Date"
              value={form.preorderDate}
              onChange={(e) => handleFormChange('preorderDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mt: 2 }}
            />
          )}
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Copyright & Label Info */}
      <Typography variant="h6" sx={{ mb: 2 }}>Copyright & Label Information</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Record Label & Distribution"
            value="BeatFlow Media Group"
            disabled
            helperText="Default label for all releases"
          />
          <Paper sx={{
            p: 2,
            mt: 2,
            bgcolor: 'rgba(29, 185, 84, 0.05)',
            border: '1px solid rgba(29, 185, 84, 0.3)',
            borderRadius: 2
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#1DB954' }}>
              ⚡ Upgrade to Premium
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Get access to premium features:
            </Typography>
            <Box sx={{ pl: 2, mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                ✓ Custom release date & record label
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                ✓ Advanced analytics & stats
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                ✓ Priority review & support
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                ✓ Featured artist opportunities
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button
                variant="contained"
                size="small"
                sx={{
                  bgcolor: '#1DB954',
                  color: 'black',
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: '#1ed760' }
                }}
                onClick={async () => {
                  // TODO: Add upgrade modal/page
                  await showAlert('Info', 'Premium upgrade coming soon! Contact support@beatflow.com for early access.', 'info');
                }}
              >
                Upgrade for $9.99/month
              </Button>
              <Button
                variant="text"
                size="small"
                sx={{ color: 'text.secondary' }}
              >
                No thanks
              </Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Copyright Holder"
            value={form.copyrightHolder}
            onChange={(e) => handleFormChange('copyrightHolder', e.target.value)}
            placeholder={form.artist || "Your Name"}
            helperText="Who owns the copyright?"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Copyright Year"
            value={form.copyrightYear}
            onChange={(e) => handleFormChange('copyrightYear', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="UPC/EAN Code (Optional)"
            value={form.upc}
            onChange={(e) => handleFormChange('upc', e.target.value)}
            placeholder="e.g., 123456789012"
            helperText="Universal Product Code for your release"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description (optional)"
            value={form.description}
            onChange={(e) => handleFormChange('description', e.target.value)}
            placeholder="Tell listeners about this release..."
          />
        </Grid>
      </Grid>
    </Box>
  );

  // Step 4: Review & Submit
  const renderReview = () => (
    <Box sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Review Your Submission
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Please review all details before submitting your release to BeatFlow
      </Typography>

      {/* Release Summary */}
      <Paper sx={{ p: 4, mb: 3, bgcolor: 'rgba(29, 185, 84, 0.05)' }}>
        <Grid container spacing={3}>
          {/* Cover Art Preview */}
          <Grid item xs={12} md={4}>
            {coverPreview && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Cover Art
                </Typography>
                <img
                  src={coverPreview}
                  alt="Cover Preview"
                  style={{
                    width: '100%',
                    aspectRatio: '1/1',
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '1px solid #333'
                  }}
                />
              </Box>
            )}
          </Grid>

          {/* Release Details */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Release Type</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                  {form.releaseType}
                </Typography>
              </Grid>

              {form.albumTitle && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {form.releaseType === 'album' ? 'Album' : 'EP'} Title
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {form.albumTitle}
                  </Typography>
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Artist</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {form.artist}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Release Date</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {new Date(form.releaseDate).toLocaleDateString()}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Copyright</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  © {form.copyrightYear} {form.copyrightHolder || form.artist}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Record Label & Distribution</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  BeatFlow Media Group
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Tracks Summary */}
      <Paper sx={{ p: 4, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
          Tracks ({form.tracks.length})
        </Typography>
        {form.tracks.map((track, index) => (
          <Box key={index} sx={{ mb: 3, pb: 3, borderBottom: index < form.tracks.length - 1 ? '1px solid #333' : 'none' }}>
            <Grid container spacing={2}>
              <Grid item xs={1}>
                <Typography variant="h6" color="text.secondary">
                  {index + 1}
                </Typography>
              </Grid>
              <Grid item xs={11}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {track.title}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Primary Genre</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip label={track.primaryGenre} size="small" color="primary" />
                    </Box>
                  </Grid>
                  {track.additionalGenres.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Additional Genres</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {track.additionalGenres.map((genre) => (
                          <Chip key={genre} label={genre} size="small" />
                        ))}
                      </Box>
                    </Grid>
                  )}
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary">Language</Typography>
                    <Typography variant="body2">{track.language}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary">Duration</Typography>
                    <Typography variant="body2">
                      {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                    </Typography>
                  </Grid>
                  {track.explicit && (
                    <Grid item xs={12}>
                      <Chip label="Explicit Content" size="small" color="warning" />
                    </Grid>
                  )}
                </Grid>
              </Grid>
            </Grid>
          </Box>
        ))}
      </Paper>

      {form.description && (
        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Description
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {form.description}
          </Typography>
        </Paper>
      )}


      <Alert severity="info" sx={{ mt: 3 }}>
        Your release will be reviewed by our team within 3-5 business days. You'll receive an email notification once your music is live on BeatFlow.
      </Alert>
    </Box>
  );

  const getStepContent = (step) => {
    switch (step) {
      case 0: return renderReleaseType();
      case 1: return renderUploadFiles();
      case 2: return renderTrackDetails();
      case 3: return renderReview();
      default: return 'Unknown step';
    }
  };

  // Sign-in screen
  if (!authUser) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#121212', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 6, textAlign: 'center', bgcolor: '#1e1e1e' }}>
            <MusicNote sx={{ fontSize: 80, color: '#1DB954', mb: 3 }} />
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', color: 'white' }}>
              Upload Your Music
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
              Share your music with the BeatFlow community
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleSignIn}
              sx={{
                bgcolor: '#1DB954',
                color: 'white',
                py: 2,
                px: 6,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                '&:hover': { bgcolor: '#1ed760' }
              }}
            >
              Sign in with Google
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Show nothing while redirecting to pricing (unless returning from successful payment)
  const membershipParam = searchParams.get('membership');
  const isReturningFromPayment = membershipParam === 'active';

  if (!loadingMembership && !membershipStatus.active && !isReturningFromPayment) {
    return null;
  }

  // Main upload form
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#121212', py: 4 }}>
      <Container maxWidth="lg">
        <Paper sx={{ p: 4, bgcolor: '#1e1e1e' }}>
          {/* Artist Profile Banner */}
          <Alert
            severity="info"
            sx={{
              mb: 3,
              bgcolor: 'rgba(29, 185, 84, 0.1)',
              border: '1px solid #1DB954',
              '& .MuiAlert-message': { width: '100%' }
            }}
            action={
              <Button
                size="small"
                variant="contained"
                onClick={() => window.location.href = '/artist-pricing'}
                sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
              >
                View Pricing
              </Button>
            }
          >
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              Need to upgrade your artist membership?
            </Typography>
            <Typography variant="caption">
              Check out our artist pricing plans to continue uploading music
            </Typography>
          </Alert>

          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'white' }}>
                Upload Your Release
              </Typography>
              <Paper sx={{ px: 3, py: 1.5, bgcolor: '#2a2a2a', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ color: '#1DB954' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Membership Status
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1DB954' }}>
                    {membershipStatus.active ? 'Active' : 'Inactive'}
                  </Typography>
                </Box>
                {membershipStatus.active && membershipStatus.daysRemaining !== null && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                    {membershipStatus.daysRemaining > 0
                      ? `${membershipStatus.daysRemaining} days left`
                      : 'Expires today'}
                  </Typography>
                )}
              </Paper>
            </Box>
            <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              Signed in as {authUser.email}
            </Typography>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Status Messages */}
          {status.message && (
            <Alert severity={status.type} sx={{ mb: 3 }}>
              {status.message}
            </Alert>
          )}

          {/* Upload Progress */}
          {loading && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: 'rgba(29, 185, 84, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#1DB954',
                    borderRadius: 5
                  }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {uploadStage}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1DB954' }}>
                  {uploadProgress}%
                </Typography>
              </Box>
            </Box>
          )}

          {/* Upload Complete Modal */}
          <Dialog
            open={uploadComplete}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                bgcolor: '#1e1e1e',
                backgroundImage: 'none'
              }
            }}
          >
            <DialogContent sx={{ p: 5, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 100, color: '#1DB954', mb: 3 }} />
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1DB954', mb: 2 }}>
                Upload Successful!
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                Your release has been submitted and is now being reviewed by our team.
              </Typography>

              <Paper sx={{ p: 4, mb: 4, bgcolor: '#2a2a2a', textAlign: 'left' }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
                  What happens next?
                </Typography>
                <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'rgba(29, 185, 84, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Typography sx={{ color: '#1DB954', fontWeight: 'bold', fontSize: '1.2rem' }}>1</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Quality Check (24-48 hours)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Our team reviews audio quality, metadata, and artwork to ensure everything meets BeatFlow standards
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'rgba(29, 185, 84, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Typography sx={{ color: '#1DB954', fontWeight: 'bold', fontSize: '1.2rem' }}>2</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Processing & Encoding
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Your tracks are optimized for streaming across all devices and platforms
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'rgba(29, 185, 84, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Typography sx={{ color: '#1DB954', fontWeight: 'bold', fontSize: '1.2rem' }}>3</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Live on BeatFlow! 🎉
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      You'll receive an email notification when your release goes live and is available to fans worldwide
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => window.location.href = '/'}
                  sx={{
                    bgcolor: '#1DB954',
                    color: 'white',
                    px: 5,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    '&:hover': { bgcolor: '#1ed760' }
                  }}
                >
                  Return Home
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => window.location.reload()}
                  sx={{
                    borderColor: '#1DB954',
                    color: '#1DB954',
                    px: 5,
                    py: 1.5,
                    fontSize: '1rem',
                    '&:hover': { borderColor: '#1ed760', bgcolor: 'rgba(29, 185, 84, 0.1)' }
                  }}
                >
                  Upload Another Release
                </Button>
              </Box>
            </DialogContent>
          </Dialog>

          {/* Step Content */}
          <Box sx={{ minHeight: 400 }}>
            {getStepContent(activeStep)}
          </Box>

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0 || loading}
              onClick={handleBack}
              startIcon={<ArrowBack />}
              sx={{ visibility: activeStep === 0 ? 'hidden' : 'visible' }}
            >
              Back
            </Button>
            <Box sx={{ flex: 1 }} />
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                endIcon={<CheckCircle />}
                sx={{
                  bgcolor: '#1DB954',
                  color: 'white',
                  py: 1.5,
                  px: 4,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: '#1ed760' }
                }}
              >
                {loading ? 'Uploading...' : 'Submit Release'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
                sx={{
                  bgcolor: '#1DB954',
                  color: 'white',
                  '&:hover': { bgcolor: '#1ed760' }
                }}
              >
                Next
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
      <Footer />
    </Box>
  );
}
