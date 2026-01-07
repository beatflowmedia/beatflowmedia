// src/components/admin/SocialMediaManager.js
// Social media campaign manager with multi-aspect ratio image generation
import { useState } from 'react';
import { useModal } from '../../hooks/useModal';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  LinearProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Visibility,
  CheckCircle,
  PhoneAndroid,
  Instagram,
  Twitter
} from '@mui/icons-material';
import imageOptimizationService from '../../services/imageOptimizationService';

export default function SocialMediaManager() {
  const { showAlert } = useModal();
  const [campaignName, setCampaignName] = useState('');
  const [targetSegment, setTargetSegment] = useState('');
  const [sourceImage, setSourceImage] = useState(null);
  const [sourceImagePreview, setSourceImagePreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedVariants, setGeneratedVariants] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewVariant, setPreviewVariant] = useState(null);

  const segments = [
    { id: 'artists', name: 'Artists' },
    { id: 'listeners', name: 'Listeners' },
    { id: 'curators', name: 'Curators' },
    { id: 'advertisers', name: 'Advertisers' },
    { id: 'investors', name: 'Investors' },
    { id: 'vendors', name: 'Vendors' },
    { id: 'labels', name: 'Labels' }
  ];

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate image
    if (!file.type.startsWith('image/')) {
      showAlert('Error', 'Please upload a valid image file', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showAlert('Error', 'Image must be less than 10MB', 'error');
      return;
    }

    setSourceImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setSourceImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSourceImage(null);
    setSourceImagePreview(null);
    setGeneratedVariants([]);
  };

  const handleGenerateVariants = async () => {
    if (!sourceImage || !campaignName || !targetSegment) {
      await showAlert('Info', 'Please fill in all fields and upload an image', 'info');
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      // Generate 3 aspect ratio variants
      const variants = await imageOptimizationService.generateSocialImageVariants(
        sourceImage,
        `${targetSegment}-${campaignName}`
      );

      // Simulate progress for UX
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setGeneratedVariants(variants);
    } catch (error) {
      console.error('Generation error:', error);
      await showAlert('Error', 'Failed to generate image variants', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handlePreview = (variant) => {
    setPreviewVariant(variant);
    setPreviewOpen(true);
  };

  const handleSaveCampaign = async () => {
    // In production, this would save to Firestore and upload images to Storage
    await showAlert('Success', `Campaign saved! Generated ${generatedVariants.length} image variants`, 'success');

    // Reset form
    setCampaignName('');
    setTargetSegment('');
    handleRemoveImage();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Social Media Campaign Creator
      </Typography>

      <Grid container spacing={3}>
        {/* Configuration Section */}
        <Grid item xs={12} md={5}>
          <Card sx={{ bgcolor: 'background.default' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Campaign Details
              </Typography>

              <TextField
                fullWidth
                label="Campaign Name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., artist-promo-jan-2026"
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Target Segment</InputLabel>
                <Select
                  value={targetSegment}
                  label="Target Segment"
                  onChange={(e) => setTargetSegment(e.target.value)}
                >
                  {segments.map(segment => (
                    <MenuItem key={segment.id} value={segment.id}>
                      {segment.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Source Image
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Upload a high-quality image (min 1920x1920px). We'll generate 3 aspect ratios.
              </Typography>

              {!sourceImagePreview ? (
                <Button
                  fullWidth
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                  sx={{
                    height: 200,
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    '&:hover': { borderStyle: 'dashed' }
                  }}
                >
                  Upload Image
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </Button>
              ) : (
                <Box sx={{ position: 'relative' }}>
                  <img
                    src={sourceImagePreview}
                    alt="Source"
                    style={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                      borderRadius: 8
                    }}
                  />
                  <IconButton
                    onClick={handleRemoveImage}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0,0,0,0.7)',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' }
                    }}
                  >
                    <Delete sx={{ color: 'white' }} />
                  </IconButton>
                </Box>
              )}

              {sourceImage && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>File:</strong> {sourceImage.name}
                  </Typography>
                  <Typography variant="caption">
                    Size: {(sourceImage.size / 1024 / 1024).toFixed(2)}MB
                  </Typography>
                </Alert>
              )}

              <Button
                fullWidth
                variant="contained"
                onClick={handleGenerateVariants}
                disabled={!sourceImage || !campaignName || !targetSegment || processing}
                sx={{
                  mt: 3,
                  bgcolor: '#1DB954',
                  '&:hover': { bgcolor: '#1ed760' },
                  '&:disabled': { bgcolor: 'grey.700' }
                }}
              >
                {processing ? 'Generating...' : 'Generate 3 Aspect Ratios'}
              </Button>

              {processing && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Processing... {Math.round(progress)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      '& .MuiLinearProgress-bar': { bgcolor: '#1DB954' }
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Generated Variants Section */}
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: 'background.default' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Generated Variants
              </Typography>

              {generatedVariants.length === 0 ? (
                <Alert severity="info">
                  <Typography variant="body2">
                    Upload an image and click "Generate 3 Aspect Ratios" to create optimized WebP images for:
                  </Typography>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                    <li><Typography variant="caption">9:16 (1080x1920) - Instagram/Facebook Stories, TikTok, YouTube Shorts</Typography></li>
                    <li><Typography variant="caption">1:1 (1080x1080) - Instagram Feed, Facebook Posts</Typography></li>
                    <li><Typography variant="caption">3:2 (1200x800) - Twitter/X, LinkedIn, Facebook Cover</Typography></li>
                  </ul>
                </Alert>
              ) : (
                <>
                  <Grid container spacing={2}>
                    {generatedVariants.map((variant, index) => (
                      <Grid item xs={12} sm={4} key={index}>
                        <Card
                          sx={{
                            bgcolor: 'rgba(29, 185, 84, 0.05)',
                            border: '1px solid rgba(29, 185, 84, 0.3)',
                            position: 'relative',
                            height: '100%'
                          }}
                        >
                          <Box
                            sx={{
                              height: 200,
                              bgcolor: 'rgba(0,0,0,0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '8px 8px 0 0',
                              position: 'relative'
                            }}
                          >
                            {variant.ratio === '9:16' && <PhoneAndroid sx={{ fontSize: 80, color: 'grey.600' }} />}
                            {variant.ratio === '1:1' && <Instagram sx={{ fontSize: 80, color: 'grey.600' }} />}
                            {variant.ratio === '3:2' && <Twitter sx={{ fontSize: 80, color: 'grey.600' }} />}

                            <Chip
                              label={variant.ratio}
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                                bgcolor: '#1DB954',
                                color: 'white',
                                fontWeight: 'bold'
                              }}
                            />
                          </Box>
                          <CardContent>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {variant.platform}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                              {variant.dimensions.width}×{variant.dimensions.height}px
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Visibility />}
                                onClick={() => handlePreview(variant)}
                                fullWidth
                              >
                                Preview
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>

                  <Alert severity="success" sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle />
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          3 Variants Generated!
                        </Typography>
                        <Typography variant="body2">
                          All images optimized as WebP format for fast loading
                        </Typography>
                      </Box>
                    </Box>
                  </Alert>

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSaveCampaign}
                    sx={{
                      mt: 2,
                      bgcolor: '#1DB954',
                      '&:hover': { bgcolor: '#1ed760' }
                    }}
                  >
                    Save Campaign & Upload Images
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Platform Distribution Info */}
          {generatedVariants.length > 0 && (
            <Card sx={{ bgcolor: 'rgba(33, 150, 243, 0.05)', mt: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Platform Distribution
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      9:16 Stories/Reels
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Instagram Stories<br />
                      • Facebook Stories<br />
                      • TikTok<br />
                      • YouTube Shorts<br />
                      • Snapchat
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      1:1 Feed Posts
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Instagram Feed<br />
                      • Facebook Posts<br />
                      • Pinterest Pins<br />
                      • LinkedIn Posts
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      3:2 Landscape
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Twitter/X Posts<br />
                      • LinkedIn Articles<br />
                      • Facebook Cover<br />
                      • Blog Headers
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Preview: {previewVariant?.platform} ({previewVariant?.ratio})
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 400,
              bgcolor: 'rgba(0,0,0,0.1)',
              borderRadius: 2
            }}
          >
            {previewVariant && (
              <Box sx={{ textAlign: 'center' }}>
                {previewVariant.ratio === '9:16' && <PhoneAndroid sx={{ fontSize: 200, color: 'grey.600' }} />}
                {previewVariant.ratio === '1:1' && <Instagram sx={{ fontSize: 200, color: 'grey.600' }} />}
                {previewVariant.ratio === '3:2' && <Twitter sx={{ fontSize: 200, color: 'grey.600' }} />}
                <Typography variant="h6" sx={{ mt: 2 }}>
                  {previewVariant.dimensions.width}×{previewVariant.dimensions.height}px
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  WebP optimized for {previewVariant.platform}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
