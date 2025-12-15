// src/pages/Settings.js
// User settings and preferences page
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  IconButton,
  Tab,
  Tabs,
  Alert
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Save,
  Cancel
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} role="tabpanel">
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  // Account settings
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  // Preferences
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    newReleases: true,
    recommendations: true,
    autoplay: true,
    crossfade: false,
    normalizeVolume: true,
    highQualityStreaming: false,
    downloadQuality: 'high'
  });

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const loadSettings = async () => {
      await loadUserSettings();
    };

    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const loadUserSettings = async () => {
    if (!user) return;

    try {
      setDisplayName(user.displayName || '');

      // Load preferences from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setBio(userData.bio || '');
        if (userData.preferences) {
          setPreferences({ ...preferences, ...userData.preferences });
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);

      await setDoc(
        doc(db, 'users', user.uid),
        {
          displayName,
          bio,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;

    try {
      setLoading(true);

      await setDoc(
        doc(db, 'users', user.uid),
        {
          preferences,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      toast.success('Preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key) => (event) => {
    setPreferences({
      ...preferences,
      [key]: event.target.checked
    });
  };

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={() => navigate('/profile')} sx={{ mr: 2, color: 'text.primary' }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
            Settings
          </Typography>
        </Box>

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
            <Tab label="Preferences" />
            <Tab label="Privacy" />
          </Tabs>

          {/* Profile Tab */}
          <TabPanel value={activeTab} index={0}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Avatar
                  src={user.photoURL}
                  alt={user.displayName}
                  sx={{ width: 80, height: 80, mr: 2 }}
                />
                <Box>
                  <Typography variant="h6" sx={{ color: 'text.primary' }}>
                    {user.displayName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {user.email}
                  </Typography>
                </Box>
                {!editing && (
                  <IconButton
                    onClick={() => setEditing(true)}
                    sx={{ ml: 'auto', color: 'primary.main' }}
                  >
                    <Edit />
                  </IconButton>
                )}
              </Box>

              {editing ? (
                <>
                  <TextField
                    fullWidth
                    label="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Bio"
                    multiline
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    sx={{ mb: 3 }}
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSaveProfile}
                      disabled={loading}
                      sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </Button>
                  </Box>
                </>
              ) : (
                <>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Display Name"
                        secondary={displayName || 'Not set'}
                        primaryTypographyProps={{ color: 'text.primary' }}
                        secondaryTypographyProps={{ color: 'text.secondary' }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Email"
                        secondary={user.email}
                        primaryTypographyProps={{ color: 'text.primary' }}
                        secondaryTypographyProps={{ color: 'text.secondary' }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Bio"
                        secondary={bio || 'No bio yet'}
                        primaryTypographyProps={{ color: 'text.primary' }}
                        secondaryTypographyProps={{ color: 'text.secondary' }}
                      />
                    </ListItem>
                  </List>
                </>
              )}
            </CardContent>
          </TabPanel>

          {/* Preferences Tab */}
          <TabPanel value={activeTab} index={1}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'text.primary', mb: 2, fontWeight: 'bold' }}>
                Notifications
              </Typography>
              <FormGroup sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.emailNotifications}
                      onChange={handlePreferenceChange('emailNotifications')}
                    />
                  }
                  label="Email Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.pushNotifications}
                      onChange={handlePreferenceChange('pushNotifications')}
                    />
                  }
                  label="Push Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.newReleases}
                      onChange={handlePreferenceChange('newReleases')}
                    />
                  }
                  label="New Release Alerts"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.recommendations}
                      onChange={handlePreferenceChange('recommendations')}
                    />
                  }
                  label="Personalized Recommendations"
                />
              </FormGroup>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ color: 'text.primary', mb: 2, fontWeight: 'bold' }}>
                Playback
              </Typography>
              <FormGroup sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.autoplay}
                      onChange={handlePreferenceChange('autoplay')}
                    />
                  }
                  label="Autoplay similar songs"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.crossfade}
                      onChange={handlePreferenceChange('crossfade')}
                    />
                  }
                  label="Crossfade songs"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.normalizeVolume}
                      onChange={handlePreferenceChange('normalizeVolume')}
                    />
                  }
                  label="Normalize volume"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.highQualityStreaming}
                      onChange={handlePreferenceChange('highQualityStreaming')}
                    />
                  }
                  label="High quality streaming"
                />
              </FormGroup>

              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSavePreferences}
                disabled={loading}
                sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
              >
                Save Preferences
              </Button>
            </CardContent>
          </TabPanel>

          {/* Privacy Tab */}
          <TabPanel value={activeTab} index={2}>
            <CardContent>
              <Alert severity="info" sx={{ mb: 3 }}>
                Your privacy is important to us. Review and manage your privacy settings below.
              </Alert>

              <Typography variant="h6" sx={{ color: 'text.primary', mb: 2, fontWeight: 'bold' }}>
                Privacy Settings
              </Typography>

              <List>
                <ListItem>
                  <ListItemText
                    primary="Profile Visibility"
                    secondary="Control who can see your profile and activity"
                    primaryTypographyProps={{ color: 'text.primary' }}
                    secondaryTypographyProps={{ color: 'text.secondary' }}
                  />
                  <Button variant="outlined" size="small">
                    Manage
                  </Button>
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Listening History"
                    secondary="Manage your listening history and data"
                    primaryTypographyProps={{ color: 'text.primary' }}
                    secondaryTypographyProps={{ color: 'text.secondary' }}
                  />
                  <Button variant="outlined" size="small">
                    Manage
                  </Button>
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Download Data"
                    secondary="Request a copy of your data"
                    primaryTypographyProps={{ color: 'text.primary' }}
                    secondaryTypographyProps={{ color: 'text.secondary' }}
                  />
                  <Button variant="outlined" size="small">
                    Request
                  </Button>
                </ListItem>
              </List>
            </CardContent>
          </TabPanel>
        </Card>
      </Container>
    </Box>
  );
}
