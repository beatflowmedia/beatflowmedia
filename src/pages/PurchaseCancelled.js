// src/pages/PurchaseCancelled.js
// Purchase cancellation page
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper
} from '@mui/material';
import { CancelOutlined, ArrowBack, Refresh } from '@mui/icons-material';

export default function PurchaseCancelled() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#121212',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            bgcolor: '#1e1e1e',
            borderRadius: 2
          }}
        >
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              bgcolor: 'rgba(255, 152, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3
            }}
          >
            <CancelOutlined sx={{ fontSize: 50, color: '#ff9800' }} />
          </Box>

          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'white', mb: 2 }}>
            Payment Cancelled
          </Typography>

          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 4 }}>
            Your payment was cancelled and no charges were made to your account.
          </Typography>

          <Paper sx={{ p: 3, mb: 4, bgcolor: '#2a2a2a' }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              What happened?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You closed the payment window or clicked the back button during checkout.
              Don't worry - you haven't been charged anything.
            </Typography>
          </Paper>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Refresh />}
              onClick={() => navigate('/artist-pricing')}
              sx={{
                bgcolor: '#1DB954',
                color: 'white',
                px: 4,
                py: 1.5,
                fontWeight: 'bold',
                '&:hover': { bgcolor: '#1ed760' }
              }}
            >
              Try Again
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/')}
              sx={{
                borderColor: '#555',
                color: 'white',
                px: 4,
                py: 1.5,
                '&:hover': { borderColor: '#777', bgcolor: 'rgba(255,255,255,0.05)' }
              }}
            >
              Back to Home
            </Button>
          </Box>

          <Box sx={{ mt: 4, p: 2, bgcolor: 'rgba(29, 185, 84, 0.1)', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              💡 <strong>Need help?</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              If you experienced any issues during checkout or have questions about our pricing,
              please contact our support team.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
