// src/components/admin/ContentHub.js
// Unified content view - upload, metrics, and catalog management in one place
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent,
  Collapse, Snackbar, Alert
} from '@mui/material';
import {
  CloudUpload, ExpandLess, CheckCircle, Storage as StorageIcon
} from '@mui/icons-material';
import { db, storage } from '../../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ref, listAll, getMetadata } from 'firebase/storage';
import ContentUploadInterface from '../ContentUploadInterface';
import ContentManagement from './ContentManagement';

const formatFileSize = (bytes) => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export default function ContentHub() {
  const [showUpload, setShowUpload] = useState(false);
  const [totalPublished, setTotalPublished] = useState(0);
  const [storageUsage, setStorageUsage] = useState({ percentage: 0, usedReadable: '0 B', limitReadable: '5 GB' });
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, type: 'success', message: '' });

  const loadMetrics = useCallback(async () => {
    try {
      setMetricsLoading(true);

      const [publishedSnap, storageData] = await Promise.all([
        getDocs(query(collection(db, 'songs'), where('approved', '==', true))),
        calculateStorageUsage()
      ]);

      setTotalPublished(publishedSnap.size);
      setStorageUsage(storageData);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const calculateStorageUsage = async () => {
    try {
      const storageRef = ref(storage);
      const listResult = await listAll(storageRef);
      const metadataPromises = listResult.items.map(item => getMetadata(item));
      const metadataList = await Promise.all(metadataPromises);
      const totalSize = metadataList.reduce((sum, metadata) => sum + (metadata.size || 0), 0);
      const storageLimit = 5 * 1024 * 1024 * 1024;
      return {
        percentage: (totalSize / storageLimit) * 100,
        usedReadable: formatFileSize(totalSize),
        limitReadable: '5 GB'
      };
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      return { percentage: 0, usedReadable: '0 B', limitReadable: '5 GB' };
    }
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
    loadMetrics();
    setSnackbar({ open: true, type: 'success', message: 'Content uploaded and published successfully.' });
  };

  const handleUploadError = (error) => {
    setSnackbar({ open: true, type: 'error', message: `Upload failed: ${error.message}` });
  };

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 1 }}>
        Content
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
        Upload and manage your catalog
      </Typography>

      {/* Upload Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={showUpload ? <ExpandLess /> : <CloudUpload />}
          onClick={() => setShowUpload(!showUpload)}
          sx={{
            bgcolor: '#1DB954',
            '&:hover': { bgcolor: '#1ed760' },
            fontWeight: 'bold',
            textTransform: 'none',
            px: 3, py: 1.2
          }}
        >
          {showUpload ? 'Close Upload' : 'Upload Content'}
        </Button>
      </Box>

      {/* Collapsible Upload Interface */}
      <Collapse in={showUpload} timeout="auto" unmountOnExit>
        <Box sx={{ mb: 3 }}>
          <ContentUploadInterface
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          />
        </Box>
      </Collapse>

      {/* Metrics Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Published
                  </Typography>
                  <Typography variant="h5">
                    {metricsLoading ? '...' : totalPublished}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <StorageIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Storage Used
                  </Typography>
                  <Typography variant="h5">
                    {metricsLoading ? '...' : `${storageUsage.percentage.toFixed(1)}%`}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {storageUsage.usedReadable} / {storageUsage.limitReadable}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Full Catalog */}
      <ContentManagement />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.type}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
