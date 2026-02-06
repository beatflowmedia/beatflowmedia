// src/pages/PurchaseSuccess.js
// Purchase success confirmation page
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert
} from '@mui/material';
import { CheckCircle, Download, Home } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function PurchaseSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [purchase, setPurchase] = useState(null);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const sessionId = searchParams.get('session_id');

  // Wait for auth to initialize
  useEffect(() => {
    // Give auth time to initialize
    const authTimer = setTimeout(() => {
      setAuthChecked(true);
      if (!user) {
        console.log('No user found after auth check, redirecting to home');
        navigate('/');
      }
    }, 1000);

    return () => clearTimeout(authTimer);
  }, [user, navigate]);

  useEffect(() => {
    if (!authChecked || !user) {
      return;
    }

    // Wait a moment for webhook to process
    const timer = setTimeout(() => {
      const loadData = async () => {
        await loadPurchaseDetails();
      };
      loadData();
    }, 2000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sessionId, navigate, authChecked]);


  const handleGoToDownloads = () => {
    navigate('/downloads');
  };

  const loadPurchaseDetails = async () => {
    try {
      setLoading(true);

      if (!sessionId) {
        setError('No session ID found');
        setLoading(false);
        return;
      }

      // Get purchase by session ID to ensure we show the correct purchase
      const { db } = await import('../firebaseConfig');
      const { collection, query, where, getDocs } = await import('firebase/firestore');

      const purchasesQuery = query(
        collection(db, 'purchases'),
        where('stripeSessionId', '==', sessionId),
        where('userId', '==', user.uid)
      );

      const snapshot = await getDocs(purchasesQuery);

      if (!snapshot.empty) {
        const purchaseDoc = snapshot.docs[0];
        const purchaseData = {
          id: purchaseDoc.id,
          ...purchaseDoc.data(),
          purchasedAt: purchaseDoc.data().purchasedAt?.toDate?.() || new Date()
        };

        setPurchase(purchaseData);

        // Dispatch event to notify other components about the completed purchase
        window.dispatchEvent(new CustomEvent('purchaseComplete', {
          detail: {
            itemId: purchaseData.itemId,
            itemType: purchaseData.itemType,
            purchaseId: purchaseData.id
          }
        }));
        console.log('✅ Dispatched purchaseComplete event:', purchaseData.itemId);
      } else {
        // Webhook still processing - check if this is an artist membership from URL metadata
        console.log('⏳ Webhook still processing, checking session metadata...');

        // Try to get session metadata from Stripe to determine type
        const response = await fetch(`/.netlify/functions/get-session?session_id=${sessionId}`);
        if (response.ok) {
          const sessionData = await response.json();
          const itemType = sessionData.metadata?.itemType || 'processing';

          setPurchase({
            itemName: itemType === 'artist_membership' ? 'BeatFlow Artist Membership' : 'Your Purchase',
            price: sessionData.amount_total ? sessionData.amount_total / 100 : 0,
            itemType: itemType
          });
        } else {
          // Fallback to generic
          setPurchase({
            itemName: 'Your Purchase',
            price: 0,
            itemType: 'processing'
          });
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading purchase:', err);
      setError('Failed to load purchase details');
    } finally {
      setLoading(false);
    }
  };

  // Download functionality - currently using Downloads page instead
  // Uncomment if direct download from success page is needed
  // const handleDownload = async () => {
  //   if (!purchase) return;
  //
  //   try {
  //     const downloadData = await stripeService.getDownloadLink(user.uid, purchase.itemId);
  //
  //     // Record the download
  //     await stripeService.recordDownload(user.uid, purchase.itemId);
  //
  //     // Trigger download
  //     const link = document.createElement('a');
  //     link.href = downloadData.url;
  //     link.download = downloadData.filename;
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //   } catch (error) {
  //     console.error('Download error:', error);
  //     alert(`Failed to download: ${error.message}`);
  //   }
  // };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: 8
      }}
    >
      <Container maxWidth="md">
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            {loading ? (
              <>
                <CircularProgress size={60} sx={{ mb: 3 }} />
                <Typography variant="h5" gutterBottom>
                  Processing your purchase...
                </Typography>
                <Typography color="text.secondary">
                  Please wait while we confirm your payment
                </Typography>
              </>
            ) : error ? (
              <>
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
                <Button
                  variant="contained"
                  startIcon={<Home />}
                  onClick={() => navigate('/')}
                >
                  Return Home
                </Button>
              </>
            ) : purchase ? (
              <>
                <CheckCircle
                  sx={{
                    fontSize: 80,
                    color: 'success.main',
                    mb: 3
                  }}
                />
                {purchase.itemType === 'artist_membership' ? (
                  <>
                    <Typography variant="h4" gutterBottom>
                      Welcome to BeatFlow Artists!
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                      Your artist membership is now active
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                      Start uploading your music now - unlimited uploads for one year
                    </Typography>
                  </>
                ) : purchase.itemType === 'premium_subscription' ? (
                  <>
                    <Typography variant="h4" gutterBottom>
                      Welcome to BeatFlow Premium!
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                      Your subscription is now active
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                      Enjoy ad-free music, high-quality audio, and unlimited downloads
                    </Typography>
                  </>
                ) : purchase.itemType === 'processing' ? (
                  <>
                    <Typography variant="h4" gutterBottom>
                      Payment Successful!
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                      Your payment is being processed
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                      You'll receive a confirmation email shortly
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="h4" gutterBottom>
                      Purchase Successful!
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                      Thank you for your purchase
                    </Typography>

                    <Card sx={{ bgcolor: 'rgba(0, 0, 0, 0.05)', mb: 4 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {purchase.itemName}
                        </Typography>
                        {purchase.artistName && (
                          <Typography variant="body2" color="text.secondary">
                            by {purchase.artistName}
                          </Typography>
                        )}
                        <Typography variant="h5" sx={{ mt: 2, fontWeight: 'bold' }}>
                          ${purchase.price.toFixed(2)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </>
                )}

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  {purchase.itemType === 'artist_membership' ? (
                    <Button
                      variant="contained"
                      color="success"
                      size="large"
                      startIcon={<Download />}
                      onClick={() => navigate('/for-artists?membership=active')}
                      sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
                    >
                      Start Uploading
                    </Button>
                  ) : purchase.itemType === 'premium_subscription' ? (
                    <Button
                      variant="contained"
                      color="success"
                      size="large"
                      startIcon={<Home />}
                      onClick={() => navigate('/')}
                      sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
                    >
                      Start Listening
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="success"
                      size="large"
                      startIcon={<Download />}
                      onClick={handleGoToDownloads}
                      sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
                    >
                      Go to Downloads
                    </Button>
                  )}
                  {purchase.itemType !== 'artist_membership' && (
                    <Button
                      variant="outlined"
                      size="large"
                      startIcon={<Home />}
                      onClick={() => navigate('/')}
                    >
                      Return Home
                    </Button>
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
                  A confirmation email has been sent to {user.email}
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h5" gutterBottom>
                  No purchase found
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  We couldn't find your purchase details
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Home />}
                  onClick={() => navigate('/')}
                >
                  Return Home
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
