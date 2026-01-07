// src/pages/artist/GenreManagement.js
// Genre and Category management for artists
import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
  IconButton,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { Add, Edit, Delete, Check, Close } from '@mui/icons-material';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useModal } from '../hooks/useModal';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} role="tabpanel">
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function GenreManagement() {
  const { user } = useAuth();
  const { showConfirm, showAlert } = useModal();
  const [activeTab, setActiveTab] = useState(0);

  // Genres state
  const [genres, setGenres] = useState([]);
  const [customGenres, setCustomGenres] = useState([]);

  // Categories state
  const [categories, setCategories] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);

  // Moods/Tags state
  const [moods, setMoods] = useState([]);
  const [customMoods, setCustomMoods] = useState([]);

  // Dialog states
  const [openGenreDialog, setOpenGenreDialog] = useState(false);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [openMoodDialog, setOpenMoodDialog] = useState(false);

  // Form states
  const [newGenreName, setNewGenreName] = useState('');
  const [newGenreDescription, setNewGenreDescription] = useState('');
  const [editingGenre, setEditingGenre] = useState(null);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);

  const [newMoodName, setNewMoodName] = useState('');
  const [newMoodDescription, setNewMoodDescription] = useState('');
  const [editingMood, setEditingMood] = useState(null);

  // Default/Platform genres
  const defaultGenres = [
    'Hip-Hop', 'Pop', 'Rock', 'Country', 'Latin', 'R&B',
    'Dance/Electronic', 'Jazz', 'Classical', 'Blues', 'Reggae',
    'K-pop', 'Indie', 'Alternative', 'Metal', 'Punk',
    'Soul', 'Funk', 'Gospel', 'Folk'
  ];

  // Default categories
  const defaultCategories = [
    'Music', 'Podcasts', 'Audiobooks', 'Live Events',
    'Workout', 'Chill', 'Party', 'Study', 'Sleep'
  ];

  // Default moods
  const defaultMoods = [
    'Happy', 'Sad', 'Energetic', 'Relaxed', 'Angry',
    'Romantic', 'Nostalgic', 'Inspirational', 'Dark', 'Uplifting'
  ];

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load custom genres
      const genresQuery = query(
        collection(db, 'customGenres'),
        where('createdBy', '==', user.uid)
      );
      const genresSnapshot = await getDocs(genresQuery);
      const genresData = genresSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCustomGenres(genresData);

      // Load custom categories
      const categoriesQuery = query(
        collection(db, 'customCategories'),
        where('createdBy', '==', user.uid)
      );
      const categoriesSnapshot = await getDocs(categoriesQuery);
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCustomCategories(categoriesData);

      // Load custom moods
      const moodsQuery = query(
        collection(db, 'customMoods'),
        where('createdBy', '==', user.uid)
      );
      const moodsSnapshot = await getDocs(moodsQuery);
      const moodsData = moodsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCustomMoods(moodsData);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    }
  };

  // Genre CRUD operations
  const handleSaveGenre = async () => {
    if (!newGenreName.trim()) {
      toast.error('Genre name is required');
      return;
    }

    try {
      if (editingGenre) {
        // Update existing
        await updateDoc(doc(db, 'customGenres', editingGenre.id), {
          name: newGenreName.trim(),
          description: newGenreDescription.trim(),
          updatedAt: serverTimestamp()
        });
        toast.success('Genre updated successfully');
      } else {
        // Create new
        await addDoc(collection(db, 'customGenres'), {
          name: newGenreName.trim(),
          description: newGenreDescription.trim(),
          createdBy: user.uid,
          createdByEmail: user.email,
          status: 'pending', // Requires admin approval
          createdAt: serverTimestamp()
        });
        toast.success('Genre submitted for approval');
      }

      setOpenGenreDialog(false);
      setNewGenreName('');
      setNewGenreDescription('');
      setEditingGenre(null);
      loadData();
    } catch (error) {
      console.error('Error saving genre:', error);
      toast.error('Failed to save genre');
    }
  };

  const handleDeleteGenre = async (genreId) => {
    const confirmed = await showConfirm('Delete Genre', 'Are you sure you want to delete this genre?', 'warning');
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'customGenres', genreId));
      toast.success('Genre deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting genre:', error);
      toast.error('Failed to delete genre');
    }
  };

  // Category CRUD operations
  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      if (editingCategory) {
        await updateDoc(doc(db, 'customCategories', editingCategory.id), {
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim(),
          updatedAt: serverTimestamp()
        });
        toast.success('Category updated successfully');
      } else {
        await addDoc(collection(db, 'customCategories'), {
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim(),
          createdBy: user.uid,
          createdByEmail: user.email,
          status: 'pending',
          createdAt: serverTimestamp()
        });
        toast.success('Category submitted for approval');
      }

      setOpenCategoryDialog(false);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setEditingCategory(null);
      loadData();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    const confirmed = await showConfirm('Delete Category', 'Are you sure you want to delete this category?', 'warning');
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'customCategories', categoryId));
      toast.success('Category deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  // Mood CRUD operations
  const handleSaveMood = async () => {
    if (!newMoodName.trim()) {
      toast.error('Mood name is required');
      return;
    }

    try {
      if (editingMood) {
        await updateDoc(doc(db, 'customMoods', editingMood.id), {
          name: newMoodName.trim(),
          description: newMoodDescription.trim(),
          updatedAt: serverTimestamp()
        });
        toast.success('Mood updated successfully');
      } else {
        await addDoc(collection(db, 'customMoods'), {
          name: newMoodName.trim(),
          description: newMoodDescription.trim(),
          createdBy: user.uid,
          createdByEmail: user.email,
          status: 'pending',
          createdAt: serverTimestamp()
        });
        toast.success('Mood submitted for approval');
      }

      setOpenMoodDialog(false);
      setNewMoodName('');
      setNewMoodDescription('');
      setEditingMood(null);
      loadData();
    } catch (error) {
      console.error('Error saving mood:', error);
      toast.error('Failed to save mood');
    }
  };

  const handleDeleteMood = async (moodId) => {
    const confirmed = await showConfirm('Delete Mood', 'Are you sure you want to delete this mood?', 'warning');
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'customMoods', moodId));
      toast.success('Mood deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting mood:', error);
      toast.error('Failed to delete mood');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 2 }}>
          Genre & Category Management
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
          Manage genres, categories, and moods for your music submissions
        </Typography>

        <Alert severity="info" sx={{ mb: 4 }}>
          Custom genres and categories require admin approval before they become available platform-wide.
        </Alert>

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
            <Tab label="Genres" />
            <Tab label="Categories" />
            <Tab label="Moods/Tags" />
          </Tabs>

          {/* Genres Tab */}
          <TabPanel value={activeTab} index={0}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ color: 'text.primary' }}>
                  Available Genres
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    setEditingGenre(null);
                    setNewGenreName('');
                    setNewGenreDescription('');
                    setOpenGenreDialog(true);
                  }}
                  sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
                >
                  Request New Genre
                </Button>
              </Box>

              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
                Platform Genres
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
                {defaultGenres.map(genre => (
                  <Chip
                    key={genre}
                    label={genre}
                    sx={{ bgcolor: 'grey.800', color: 'white' }}
                  />
                ))}
              </Box>

              {customGenres.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Your Custom Genres
                  </Typography>
                  <List>
                    {customGenres.map(genre => (
                      <ListItem
                        key={genre.id}
                        sx={{
                          bgcolor: 'grey.900',
                          mb: 1,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'grey.800'
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography sx={{ color: 'text.primary' }}>{genre.name}</Typography>
                              <Chip
                                label={genre.status}
                                size="small"
                                color={genre.status === 'approved' ? 'success' : 'warning'}
                              />
                            </Box>
                          }
                          secondary={genre.description}
                          secondaryTypographyProps={{ sx: { color: 'text.secondary' } }}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            onClick={() => {
                              setEditingGenre(genre);
                              setNewGenreName(genre.name);
                              setNewGenreDescription(genre.description || '');
                              setOpenGenreDialog(true);
                            }}
                            sx={{ color: 'primary.main' }}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteGenre(genre.id)}
                            sx={{ color: 'error.main' }}
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </CardContent>
          </TabPanel>

          {/* Categories Tab */}
          <TabPanel value={activeTab} index={1}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ color: 'text.primary' }}>
                  Available Categories
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    setEditingCategory(null);
                    setNewCategoryName('');
                    setNewCategoryDescription('');
                    setOpenCategoryDialog(true);
                  }}
                  sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
                >
                  Request New Category
                </Button>
              </Box>

              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
                Platform Categories
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
                {defaultCategories.map(category => (
                  <Chip
                    key={category}
                    label={category}
                    sx={{ bgcolor: 'grey.800', color: 'white' }}
                  />
                ))}
              </Box>

              {customCategories.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Your Custom Categories
                  </Typography>
                  <List>
                    {customCategories.map(category => (
                      <ListItem
                        key={category.id}
                        sx={{
                          bgcolor: 'grey.900',
                          mb: 1,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'grey.800'
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography sx={{ color: 'text.primary' }}>{category.name}</Typography>
                              <Chip
                                label={category.status}
                                size="small"
                                color={category.status === 'approved' ? 'success' : 'warning'}
                              />
                            </Box>
                          }
                          secondary={category.description}
                          secondaryTypographyProps={{ sx: { color: 'text.secondary' } }}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            onClick={() => {
                              setEditingCategory(category);
                              setNewCategoryName(category.name);
                              setNewCategoryDescription(category.description || '');
                              setOpenCategoryDialog(true);
                            }}
                            sx={{ color: 'primary.main' }}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteCategory(category.id)}
                            sx={{ color: 'error.main' }}
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </CardContent>
          </TabPanel>

          {/* Moods Tab */}
          <TabPanel value={activeTab} index={2}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ color: 'text.primary' }}>
                  Available Moods/Tags
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    setEditingMood(null);
                    setNewMoodName('');
                    setNewMoodDescription('');
                    setOpenMoodDialog(true);
                  }}
                  sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
                >
                  Request New Mood
                </Button>
              </Box>

              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
                Platform Moods
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
                {defaultMoods.map(mood => (
                  <Chip
                    key={mood}
                    label={mood}
                    sx={{ bgcolor: 'grey.800', color: 'white' }}
                  />
                ))}
              </Box>

              {customMoods.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Your Custom Moods
                  </Typography>
                  <List>
                    {customMoods.map(mood => (
                      <ListItem
                        key={mood.id}
                        sx={{
                          bgcolor: 'grey.900',
                          mb: 1,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'grey.800'
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography sx={{ color: 'text.primary' }}>{mood.name}</Typography>
                              <Chip
                                label={mood.status}
                                size="small"
                                color={mood.status === 'approved' ? 'success' : 'warning'}
                              />
                            </Box>
                          }
                          secondary={mood.description}
                          secondaryTypographyProps={{ sx: { color: 'text.secondary' } }}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            onClick={() => {
                              setEditingMood(mood);
                              setNewMoodName(mood.name);
                              setNewMoodDescription(mood.description || '');
                              setOpenMoodDialog(true);
                            }}
                            sx={{ color: 'primary.main' }}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteMood(mood.id)}
                            sx={{ color: 'error.main' }}
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </CardContent>
          </TabPanel>
        </Card>

        {/* Genre Dialog */}
        <Dialog open={openGenreDialog} onClose={() => setOpenGenreDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editingGenre ? 'Edit Genre' : 'Request New Genre'}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Genre Name"
              value={newGenreName}
              onChange={(e) => setNewGenreName(e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description (optional)"
              value={newGenreDescription}
              onChange={(e) => setNewGenreDescription(e.target.value)}
              multiline
              rows={3}
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenGenreDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveGenre} variant="contained" sx={{ bgcolor: '#1DB954' }}>
              {editingGenre ? 'Update' : 'Submit for Approval'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Category Dialog */}
        <Dialog open={openCategoryDialog} onClose={() => setOpenCategoryDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editingCategory ? 'Edit Category' : 'Request New Category'}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description (optional)"
              value={newCategoryDescription}
              onChange={(e) => setNewCategoryDescription(e.target.value)}
              multiline
              rows={3}
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCategoryDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveCategory} variant="contained" sx={{ bgcolor: '#1DB954' }}>
              {editingCategory ? 'Update' : 'Submit for Approval'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Mood Dialog */}
        <Dialog open={openMoodDialog} onClose={() => setOpenMoodDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editingMood ? 'Edit Mood' : 'Request New Mood'}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Mood Name"
              value={newMoodName}
              onChange={(e) => setNewMoodName(e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description (optional)"
              value={newMoodDescription}
              onChange={(e) => setNewMoodDescription(e.target.value)}
              multiline
              rows={3}
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenMoodDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveMood} variant="contained" sx={{ bgcolor: '#1DB954' }}>
              {editingMood ? 'Update' : 'Submit for Approval'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
