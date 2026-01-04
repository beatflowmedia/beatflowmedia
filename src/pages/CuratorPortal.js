import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import PayoutDashboard from './PayoutDashboard';
import OnboardStripe from '../components/OnboardStripe';

const CuratorPortal = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);

  // Check for non-curators and show modal
  useEffect(() => {
    if (role && role !== 'curator') {
      setShowAccessDeniedModal(true);
    }
  }, [role]);

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
        <PayoutDashboard userId={user.uid} stripeAccountId={user.stripeAccountId} />
        {/* Stripe onboarding for payouts */}
        <div className="mt-8">
          <OnboardStripe />
        </div>
        {/* Add curator analytics, playlist tools, etc. */}
      </div>
    </>
  );
};

export default CuratorPortal;
