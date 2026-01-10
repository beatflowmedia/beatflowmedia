// src/pages/Community.js
// Coming Soon page for BeatFlow Community
import React, { useState } from 'react';
import { Box, Container, Typography, TextField, Button, Grid, Card, CardContent } from '@mui/material';
import { MusicNote, People, Forum, School } from '@mui/icons-material';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useModal } from '../hooks/useModal';
import Footer from '../components/Footer';

const FEATURES = [
  {
    icon: <MusicNote sx={{ fontSize: 48, color: '#1DB954' }} />,
    title: 'Artist Hub',
    description: 'Connect with fellow artists, share tips, and collaborate on projects'
  },
  {
    icon: <People sx={{ fontSize: 48, color: '#1DB954' }} />,
    title: 'Curator Network',
    description: 'Build relationships with curators and grow your playlist presence'
  },
  {
    icon: <Forum sx={{ fontSize: 48, color: '#1DB954' }} />,
    title: 'Forums & Discussions',
    description: 'Join conversations about music, industry trends, and production'
  },
  {
    icon: <School sx={{ fontSize: 48, color: '#1DB954' }} />,
    title: 'Learning Resources',
    description: 'Access tutorials, workshops, and industry insights'
  }
];

export default function Community() {
  const { showAlert } = useModal();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, 'communityWaitlist'), {
        email,
        submittedAt: new Date(),
        status: 'pending'
      });

      await showAlert('Success', "Thanks! We'll notify you when the community launches.", 'success');
      setEmail('');
    } catch (error) {
      console.error('Error submitting email:', error);
      await showAlert('Error', 'There was an error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#121212', py: 8 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.2) 0%, rgba(30, 215, 96, 0.2) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              animation: 'fadeIn 1s ease-in'
            }}
          >
            <People sx={{ fontSize: 60, color: '#1DB954' }} />
          </Box>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              color: 'white',
              mb: 2,
              fontSize: { xs: '3rem', md: '4rem' }
            }}
          >
            Community Coming Soon
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: '#b3b3b3',
              mb: 4,
              lineHeight: 1.5,
              fontSize: { xs: '1.125rem', md: '1.5rem' }
            }}
          >
            A vibrant space where artists, curators, and music lovers connect, collaborate, and grow together.
          </Typography>
        </Box>

        {/* Features Grid */}
        <Grid container spacing={3} sx={{ mb: 8 }}>
          {FEATURES.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease',
                  height: '100%',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    borderColor: '#1DB954'
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" sx={{ color: '#1DB954', mb: 1, fontWeight: 'bold' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#b3b3b3', lineHeight: 1.5 }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Email Signup */}
        <Box
          sx={{
            maxWidth: 500,
            mx: 'auto',
            textAlign: 'center',
            mb: 6
          }}
        >
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '50px',
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderWidth: 2
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1DB954'
                    }
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#666',
                    opacity: 1
                  }
                }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  bgcolor: '#1DB954',
                  color: 'white',
                  borderRadius: '50px',
                  px: 5,
                  py: 2,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  minWidth: { xs: '100%', sm: 'auto' },
                  '&:hover': {
                    bgcolor: '#1ed760',
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? 'Submitting...' : 'Notify Me'}
              </Button>
            </Box>
          </form>
        </Box>

        {/* Social Links */}
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', mb: 4 }}>
            <a
              href="https://www.instagram.com/beatflowmediagroup/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#b3b3b3',
                textDecoration: 'none',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#1DB954'}
              onMouseLeave={(e) => e.target.style.color = '#b3b3b3'}
            >
              Instagram
            </a>
            <a
              href="https://twitter.com/beatflow"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#b3b3b3',
                textDecoration: 'none',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#1DB954'}
              onMouseLeave={(e) => e.target.style.color = '#b3b3b3'}
            >
              Twitter
            </a>
            <a
              href="https://facebook.com/beatflow"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#b3b3b3',
                textDecoration: 'none',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#1DB954'}
              onMouseLeave={(e) => e.target.style.color = '#b3b3b3'}
            >
              Facebook
            </a>
          </Box>
          <a
            href="/"
            style={{
              color: '#1DB954',
              textDecoration: 'none',
              fontSize: '1rem',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#1ed760';
              e.target.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#1DB954';
              e.target.style.textDecoration = 'none';
            }}
          >
            ← Back to BeatFlow Media
          </a>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
}
