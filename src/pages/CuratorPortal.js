import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Alert } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import PayoutDashboard from './PayoutDashboard';
import OnboardStripe from '../components/OnboardStripe';

const CuratorPortal = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
  const [curatorStatus, setCuratorStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Check for non-curators and show modal
  useEffect(() => {
    if (role && role !== 'curator') {
      setShowAccessDeniedModal(true);
    }
  }, [role]);

  // Check curator status
  useEffect(() => {
    const checkCuratorStatus = async () => {
      if (user && role === 'curator') {
        try {
          const curatorDoc = await getDoc(doc(db, 'curators', user.uid));
          if (curatorDoc.exists()) {
            const status = curatorDoc.data().status;
            setCuratorStatus(status);

            if (status === 'suspended') {
              setStatusMessage(curatorDoc.data().suspensionReason || 'Your account has been suspended.');
            } else if (status === 'revoked') {
              setStatusMessage(curatorDoc.data().revocationReason || 'Your curator access has been revoked.');
            }
          }
        } catch (error) {
          console.error('Error checking curator status:', error);
        }
      }
    };

    checkCuratorStatus();
  }, [user, role]);

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h2 className="text-2xl font-bold mb-4">Welcome to the Curator Portal</h2>
          <p className="text-gray-300 mb-6">
            Please sign in with your approved curator account to access your dashboard, manage submissions, and track your earnings.
          </p>
          <button
            onClick={() => navigate('/?signin=true')}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Access Denied Modal */}
      <Dialog
        open={showAccessDeniedModal}
        onClose={() => {}}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#1DB954', color: 'white' }}>
          Curator Account Required
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Typography variant="body1" gutterBottom>
            This page is only accessible to users with a curator account.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Curators manage playlists and help artists get discovered on BeatFlow.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setShowAccessDeniedModal(false);
              navigate('/');
            }}
            color="inherit"
          >
            Go to Home
          </Button>
          <Button
            onClick={() => {
              setShowAccessDeniedModal(false);
              navigate('/become-curator');
            }}
            variant="contained"
            sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
          >
            Learn More
          </Button>
        </DialogActions>
      </Dialog>

      <div className="min-h-screen bg-black text-white p-8">
        <h2 className="text-3xl font-bold mb-6">Curator Portal</h2>

        {/* Show status warning if suspended or revoked */}
        {curatorStatus === 'suspended' && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">Account Suspended</Typography>
            <Typography variant="body2">{statusMessage}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Your curator features are temporarily disabled. Please contact support at{' '}
              <a href="mailto:office.beatflowmediagroup@gmail.com" style={{ color: '#1DB954' }}>
                office.beatflowmediagroup@gmail.com
              </a>
            </Typography>
          </Alert>
        )}

        {curatorStatus === 'revoked' && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">Access Revoked</Typography>
            <Typography variant="body2">{statusMessage}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Your curator access has been permanently revoked. You may reapply for curator status in the future. For questions, contact{' '}
              <a href="mailto:office.beatflowmediagroup@gmail.com" style={{ color: '#1DB954' }}>
                office.beatflowmediagroup@gmail.com
              </a>
            </Typography>
          </Alert>
        )}

        {/* Only show dashboard if active */}
        {(!curatorStatus || curatorStatus === 'active') && (
          <>
            <PayoutDashboard userId={user.uid} stripeAccountId={user.stripeAccountId} />
            {/* Stripe onboarding for payouts */}
            <div className="mt-8">
              <OnboardStripe />
            </div>
            {/* Add curator analytics, playlist tools, etc. */}
          </>
        )}

        {/* Show contact info if suspended/revoked */}
        {(curatorStatus === 'suspended' || curatorStatus === 'revoked') && (
          <Box sx={{ mt: 4, p: 3, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Need Help?</Typography>
            <Typography variant="body2" color="text.secondary">
              If you believe this action was taken in error or would like to appeal, please reach out to our support team.
            </Typography>
            <Button
              variant="contained"
              href="mailto:office.beatflowmediagroup@gmail.com"
              sx={{ mt: 2, bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
            >
              Contact Support
            </Button>
          </Box>
        )}
      </div>
    </>
  );
};

export default CuratorPortal;
