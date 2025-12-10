import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Switch,
  FormControlLabel,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Checkbox,
  ListItemText
} from "@mui/material";
import { Add, Edit, Delete, Visibility, VisibilityOff } from "@mui/icons-material";
import { subscribeToAds, createAd, updateAd, deleteAd, toggleAdStatus } from "../utils/AdsHelper";
import { toast } from "react-toastify";

export default function Advertisements() {
  const [ads, setAds] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    ctaText: "Learn More",
    ctaLink: "",
    isActive: true,
    priority: 0,
    type: "promotional",
    displayLocations: ["mini_player"],
    frequency: 5,
    duration: 10
  });

  useEffect(() => {
    const unsubscribe = subscribeToAds((updatedAds) => {
      setAds(updatedAds);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenDialog = (ad = null) => {
    if (ad) {
      setEditingAd(ad);
      setFormData({
        title: ad.title,
        description: ad.description,
        imageUrl: ad.imageUrl || "",
        ctaText: ad.ctaText || "Learn More",
        ctaLink: ad.ctaLink || "",
        isActive: ad.isActive,
        priority: ad.priority || 0,
        type: ad.type || "promotional",
        displayLocations: ad.displayLocations || ["mini_player"],
        frequency: ad.frequency || 5,
        duration: ad.duration || 10
      });
    } else {
      setEditingAd(null);
      setFormData({
        title: "",
        description: "",
        imageUrl: "",
        ctaText: "Learn More",
        ctaLink: "",
        isActive: true,
        priority: 0,
        type: "promotional",
        displayLocations: ["mini_player"],
        frequency: 5,
        duration: 10
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAd(null);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.title.trim()) {
        toast.error("Title is required");
        return;
      }

      if (editingAd) {
        await updateAd(editingAd.id, formData);
        toast.success("Advertisement updated successfully");
      } else {
        await createAd(formData);
        toast.success("Advertisement created successfully");
      }
      handleCloseDialog();
    } catch (error) {
      toast.error("Failed to save advertisement");
      console.error(error);
    }
  };

  const handleDelete = async (adId) => {
    if (window.confirm("Are you sure you want to delete this advertisement?")) {
      try {
        await deleteAd(adId);
        toast.success("Advertisement deleted");
      } catch (error) {
        toast.error("Failed to delete advertisement");
      }
    }
  };

  const handleToggleStatus = async (ad) => {
    try {
      await toggleAdStatus(ad.id, ad.isActive);
      toast.success(`Advertisement ${ad.isActive ? 'deactivated' : 'activated'}`);
    } catch (error) {
      toast.error("Failed to update advertisement status");
    }
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#0a0e14', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Advertisements
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{
            bgcolor: '#1db954',
            '&:hover': { bgcolor: '#1ed760' }
          }}
        >
          Create Advertisement
        </Button>
      </Box>

      {/* Ads Grid */}
      <Grid container spacing={3}>
        {ads.map((ad) => (
          <Grid item xs={12} md={6} lg={4} key={ad.id}>
            <Card
              sx={{
                bgcolor: '#1a1a1a',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {ad.imageUrl && (
                <Box
                  sx={{
                    height: 200,
                    backgroundImage: `url(${ad.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
              )}
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', flex: 1 }}>
                    {ad.title}
                  </Typography>
                  <Chip
                    label={ad.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    sx={{
                      bgcolor: ad.isActive ? '#1db954' : '#666',
                      color: 'white'
                    }}
                  />
                </Box>

                <Typography variant="body2" sx={{ color: 'grey.400', mb: 2, flex: 1 }}>
                  {ad.description}
                </Typography>

                {ad.ctaText && (
                  <Typography variant="caption" sx={{ color: 'grey.500', mb: 1 }}>
                    CTA: {ad.ctaText} → {ad.ctaLink || 'No link'}
                  </Typography>
                )}

                <Typography variant="caption" sx={{ color: 'grey.600', mb: 2 }}>
                  Priority: {ad.priority}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleToggleStatus(ad)}
                    sx={{ color: 'grey.400' }}
                    title={ad.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {ad.isActive ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(ad)}
                    sx={{ color: '#4d75f0' }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(ad.id)}
                    sx={{ color: '#e22134' }}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {ads.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ color: 'grey.500', mb: 2 }}>
            No advertisements yet
          </Typography>
          <Typography variant="body2" sx={{ color: 'grey.600' }}>
            Create your first advertisement to display in the mini player
          </Typography>
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#1a1a1a', color: 'white' }
        }}
      >
        <DialogTitle>
          {editingAd ? 'Edit Advertisement' : 'Create Advertisement'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              fullWidth
              required
              sx={{
                '& .MuiInputBase-root': { color: 'white' },
                '& .MuiInputLabel-root': { color: 'grey.400' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.700' }
              }}
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              sx={{
                '& .MuiInputBase-root': { color: 'white' },
                '& .MuiInputLabel-root': { color: 'grey.400' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.700' }
              }}
            />
            <TextField
              label="Image URL"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              fullWidth
              sx={{
                '& .MuiInputBase-root': { color: 'white' },
                '& .MuiInputLabel-root': { color: 'grey.400' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.700' }
              }}
            />
            <TextField
              label="Call to Action Text"
              value={formData.ctaText}
              onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
              fullWidth
              sx={{
                '& .MuiInputBase-root': { color: 'white' },
                '& .MuiInputLabel-root': { color: 'grey.400' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.700' }
              }}
            />
            <TextField
              label="Call to Action Link"
              value={formData.ctaLink}
              onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
              fullWidth
              sx={{
                '& .MuiInputBase-root': { color: 'white' },
                '& .MuiInputLabel-root': { color: 'grey.400' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.700' }
              }}
            />
            <TextField
              label="Priority (higher = shown first)"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              fullWidth
              sx={{
                '& .MuiInputBase-root': { color: 'white' },
                '& .MuiInputLabel-root': { color: 'grey.400' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.700' }
              }}
            />

            <FormControl fullWidth>
              <InputLabel sx={{ color: 'grey.400' }}>Ad Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                label="Ad Type"
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.700' }
                }}
              >
                <MenuItem value="promotional">Promotional</MenuItem>
                <MenuItem value="commercial_break">Commercial Break</MenuItem>
                <MenuItem value="homepage_feature">Homepage Feature</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel sx={{ color: 'grey.400' }}>Display Locations</InputLabel>
              <Select
                multiple
                value={formData.displayLocations}
                onChange={(e) => setFormData({ ...formData, displayLocations: e.target.value })}
                renderValue={(selected) => selected.join(', ')}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.700' }
                }}
              >
                <MenuItem value="mini_player">
                  <Checkbox checked={formData.displayLocations.indexOf('mini_player') > -1} />
                  <ListItemText primary="Mini Player" />
                </MenuItem>
                <MenuItem value="homepage">
                  <Checkbox checked={formData.displayLocations.indexOf('homepage') > -1} />
                  <ListItemText primary="Homepage" />
                </MenuItem>
                <MenuItem value="commercial_break">
                  <Checkbox checked={formData.displayLocations.indexOf('commercial_break') > -1} />
                  <ListItemText primary="Commercial Break" />
                </MenuItem>
              </Select>
            </FormControl>

            {formData.displayLocations.includes('commercial_break') && (
              <>
                <TextField
                  label="Frequency (show after X songs)"
                  type="number"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: parseInt(e.target.value) || 5 })}
                  fullWidth
                  helperText="Show this ad after every X songs played"
                  sx={{
                    '& .MuiInputBase-root': { color: 'white' },
                    '& .MuiInputLabel-root': { color: 'grey.400' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.700' },
                    '& .MuiFormHelperText-root': { color: 'grey.500' }
                  }}
                />
                <TextField
                  label="Duration (seconds)"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 10 })}
                  fullWidth
                  helperText="How long the ad will display"
                  sx={{
                    '& .MuiInputBase-root': { color: 'white' },
                    '& .MuiInputLabel-root': { color: 'grey.400' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.700' },
                    '& .MuiFormHelperText-root': { color: 'grey.500' }
                  }}
                />
              </>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#1db954',
                      '& + .MuiSwitch-track': {
                        backgroundColor: '#1db954',
                      }
                    }
                  }}
                />
              }
              label="Active"
              sx={{ color: 'white' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={{ color: 'grey.400' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              bgcolor: '#1db954',
              '&:hover': { bgcolor: '#1ed760' }
            }}
          >
            {editingAd ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
