// src/pages/MarketingLanding.js
// Dynamic landing page resolver for marketing-generated pages
import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Box, Container, Typography, CircularProgress } from '@mui/material';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default function MarketingLanding() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [landingPage, setLandingPage] = useState(null);
  const [redirect, setRedirect] = useState(null);

  useEffect(() => {
    const fetchLandingPage = async () => {
      try {
        setLoading(true);

        // Check for slug-based redirects first
        const redirectMap = {
          'for-curators': '/become-curator',
          'for-artists': '/for-artists',
          'for-listeners': '/individual',
          'for-advertisers': '/advertising',
          'for-investors': '/investors',
          'for-vendors': '/vendors'
        };

        if (redirectMap[slug]) {
          setRedirect(redirectMap[slug]);
          setLoading(false);
          return;
        }

        // Try to fetch from Firestore if no redirect match
        const docRef = doc(db, 'landingPages', slug);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setLandingPage(data);

          // If page has a redirect, use it
          if (data.redirect) {
            setRedirect(data.redirect);
          }
        } else {
          // Page not found
          setLandingPage(null);
        }
      } catch (error) {
        console.error('Error fetching landing page:', error);
        setLandingPage(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLandingPage();
  }, [slug]);

  // Show loading state
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#0a0e14'
        }}
      >
        <CircularProgress sx={{ color: '#1DB954' }} />
      </Box>
    );
  }

  // Redirect if specified
  if (redirect) {
    return <Navigate to={redirect} replace />;
  }

  // Page not found
  if (!landingPage) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#0a0e14'
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h1" sx={{ color: 'white', fontSize: '120px', fontWeight: 'bold' }}>
            404
          </Typography>
          <Typography variant="h4" sx={{ color: 'grey.400', mb: 3 }}>
            Landing Page Not Found
          </Typography>
          <Typography variant="body1" sx={{ color: 'grey.500' }}>
            The marketing landing page "{slug}" does not exist.
          </Typography>
        </Container>
      </Box>
    );
  }

  // Render dynamic landing page
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0e14' }}>
      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Hero Section */}
        {landingPage.hero && (
          <Box sx={{ mb: 8, textAlign: 'center' }}>
            <Typography
              variant="h2"
              sx={{
                color: 'white',
                fontWeight: 'bold',
                mb: 2
              }}
            >
              {landingPage.hero.title}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: 'grey.400',
                mb: 4
              }}
            >
              {landingPage.hero.subtitle}
            </Typography>
            {landingPage.hero.image && (
              <Box
                component="img"
                src={landingPage.hero.image}
                alt={landingPage.hero.title}
                sx={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: 4,
                  boxShadow: 4
                }}
              />
            )}
          </Box>
        )}

        {/* Content Sections */}
        {landingPage.sections && landingPage.sections.map((section, index) => (
          <Box key={index} sx={{ mb: 6 }}>
            <Typography
              variant="h4"
              sx={{
                color: 'white',
                fontWeight: 'bold',
                mb: 2
              }}
            >
              {section.title}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'grey.300',
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap'
              }}
            >
              {section.content}
            </Typography>
          </Box>
        ))}

        {/* CTA Section */}
        {landingPage.cta && (
          <Box
            sx={{
              mt: 8,
              p: 4,
              bgcolor: '#1DB954',
              borderRadius: 4,
              textAlign: 'center'
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: 'white',
                fontWeight: 'bold',
                mb: 2
              }}
            >
              {landingPage.cta.title}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'white',
                mb: 3
              }}
            >
              {landingPage.cta.description}
            </Typography>
            {landingPage.cta.buttonUrl && (
              <Box
                component="a"
                href={landingPage.cta.buttonUrl}
                sx={{
                  display: 'inline-block',
                  px: 4,
                  py: 1.5,
                  bgcolor: 'white',
                  color: '#1DB954',
                  fontWeight: 'bold',
                  borderRadius: 50,
                  textDecoration: 'none',
                  '&:hover': {
                    bgcolor: 'grey.100'
                  }
                }}
              >
                {landingPage.cta.buttonText || 'Get Started'}
              </Box>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
}
