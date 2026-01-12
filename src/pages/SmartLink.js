// src/pages/SmartLink.js
// Smart Link redirect handler with conversion tracking
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { trackConversion } from '../services/conversionTracking';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function SmartLink() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    handleSmartLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleSmartLink = async () => {
    if (!slug) {
      setError('Invalid smart link');
      return;
    }

    try {
      // Find smart link by slug
      const smartLinksRef = await getDoc(doc(db, 'smartLinks', slug));

      let linkData = null;
      let linkId = null;

      if (smartLinksRef.exists()) {
        linkData = smartLinksRef.data();
        linkId = slug;
      } else {
        // Try querying by slug field (backwards compatibility)
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const q = query(collection(db, 'smartLinks'), where('slug', '==', slug));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          linkData = snapshot.docs[0].data();
          linkId = snapshot.docs[0].id;
        }
      }

      if (!linkData) {
        setError('Smart link not found');
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      // Track click (increment in Firestore - handles race conditions)
      if (linkId) {
        await updateDoc(doc(db, 'smartLinks', linkId), {
          clicks: increment(1),
          lastClickedAt: new Date()
        });
      }

      // Track click in Meta/TikTok pixels
      trackConversion('ViewContent', {
        content_type: linkData.type,
        content_ids: [linkData.targetId],
        content_name: linkData.targetName || 'Smart Link',
        source: 'smart_link'
      });

      // Redirect to target
      const { type, targetId } = linkData;
      let targetUrl = '/';

      if (type === 'song') {
        targetUrl = `/song/${targetId}`;
      } else if (type === 'artist') {
        targetUrl = `/artist/${encodeURIComponent(targetId)}`;
      } else if (type === 'playlist') {
        targetUrl = `/playlist/${targetId}`;
      }

      // Small delay to ensure tracking fires
      setTimeout(() => {
        navigate(targetUrl);
      }, 200);

    } catch (error) {
      console.error('Error handling smart link:', error);
      setError('Failed to process smart link');
      setTimeout(() => navigate('/'), 3000);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: '#0a0e14',
        color: '#f9fafb'
      }}
    >
      {error ? (
        <>
          <Typography variant="h5" sx={{ mb: 2, color: '#ef4444' }}>
            {error}
          </Typography>
          <Typography variant="body2" sx={{ color: '#9ca3af' }}>
            Redirecting to home page...
          </Typography>
        </>
      ) : (
        <>
          <CircularProgress sx={{ mb: 3, color: '#1db954' }} />
          <Typography variant="h6" sx={{ color: '#f9fafb' }}>
            Loading...
          </Typography>
          <Typography variant="body2" sx={{ color: '#9ca3af', mt: 1 }}>
            Taking you to your destination
          </Typography>
        </>
      )}
    </Box>
  );
}
