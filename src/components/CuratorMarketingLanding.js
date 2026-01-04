import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Container, Typography, Button, Grid, Card, CardContent } from '@mui/material';
import { FaMusic, FaChartLine, FaDollarSign, FaUsers, FaCheckCircle, FaStar } from 'react-icons/fa';

export default function CuratorMarketingLanding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (!user) {
      navigate('/?signin=true');
      return;
    }
    navigate('/curator-application');
  };

  const benefits = [
    {
      icon: <FaDollarSign size={40} className="text-bf-accent" />,
      title: 'Earn Revenue',
      description: 'Get paid $50-$500 per placement when artists choose your playlists. You set your rates.'
    },
    {
      icon: <FaMusic size={40} className="text-bf-accent" />,
      title: 'Discover Great Music',
      description: 'Review track submissions from emerging artists and build playlists that resonate.'
    },
    {
      icon: <FaChartLine size={40} className="text-bf-accent" />,
      title: 'Performance Analytics',
      description: 'Track playlist growth, placement revenue, and artist success metrics in real-time.'
    },
    {
      icon: <FaUsers size={40} className="text-bf-accent" />,
      title: 'Build Your Brand',
      description: 'Grow your reputation as a tastemaker and connect with thousands of artists.'
    },
    {
      icon: <FaCheckCircle size={40} className="text-bf-accent" />,
      title: 'Quality Tools',
      description: 'Professional dashboard for managing submissions, playlists, and earnings.'
    },
    {
      icon: <FaStar size={40} className="text-bf-accent" />,
      title: 'Featured Opportunities',
      description: 'Top curators get featured placement and priority access to premium artists.'
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Apply for Free',
      description: 'Sign up and connect your playlists. No subscription or membership fees.'
    },
    {
      step: 2,
      title: 'Set Your Rates',
      description: 'Choose pricing based on your playlist reach and engagement (we provide guidance).'
    },
    {
      step: 3,
      title: 'Review Submissions',
      description: 'Artists submit tracks with budgets. Accept placements that fit your playlists.'
    },
    {
      step: 4,
      title: 'Get Paid',
      description: 'Add tracks to your playlists and receive payment via secure escrow system.'
    }
  ];

  const successStories = [
    {
      name: 'Sarah Chen',
      genre: 'Indie Pop',
      earnings: '$12,450',
      playlists: '8 playlists',
      followers: '47K total followers',
      quote: 'I turned my passion for discovering music into a side income. BeatFlow makes it seamless.'
    },
    {
      name: 'Marcus Rivera',
      genre: 'Hip-Hop',
      earnings: '$8,230',
      playlists: '5 playlists',
      followers: '28K total followers',
      quote: 'Artists love my playlists and I love getting paid to curate. Win-win.'
    },
    {
      name: 'Emily Taylor',
      genre: 'Electronic',
      earnings: '$15,890',
      playlists: '12 playlists',
      followers: '63K total followers',
      quote: 'BeatFlow helped me monetize my playlists while supporting emerging artists.'
    }
  ];

  return (
    <Box sx={{ bgcolor: '#000', color: '#fff', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1600&h=800&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          py: 12,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8))',
            zIndex: 1
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2, fontSize: { xs: '2rem', md: '3.5rem' } }}>
            Get Paid to Discover Great Music
          </Typography>
          <Typography variant="h5" sx={{ color: '#b3b3b3', mb: 4, fontSize: { xs: '1rem', md: '1.5rem' } }}>
            Build playlists, curate tracks, earn revenue. 100% free to join.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleGetStarted}
            sx={{
              bgcolor: '#1db954',
              color: '#fff',
              px: 6,
              py: 2,
              fontSize: '1.2rem',
              fontWeight: 'bold',
              '&:hover': { bgcolor: '#1ed760' }
            }}
          >
            Start Curating Free
          </Button>
          <Typography variant="body2" sx={{ color: '#b3b3b3', mt: 2 }}>
            Join 2,500+ curators earning on BeatFlow
          </Typography>
        </Container>
      </Box>

      {/* How It Works Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 6 }}>
          How It Works
        </Typography>
        <Grid container spacing={4}>
          {howItWorks.map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item.step}>
              <Card sx={{ bgcolor: '#181818', color: '#fff', height: '100%', textAlign: 'center', p: 3 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: '#1db954',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}
                >
                  {item.step}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                  {item.description}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Benefits Section */}
      <Box sx={{ bgcolor: '#0a0a0a', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 6 }}>
            Why Curators Love BeatFlow
          </Typography>
          <Grid container spacing={4}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ bgcolor: '#181818', color: '#fff', height: '100%', p: 3 }}>
                  <Box sx={{ mb: 2 }}>{benefit.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {benefit.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#b3b3b3' }}>
                    {benefit.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Success Stories Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 6 }}>
          Curator Success Stories
        </Typography>
        <Grid container spacing={4}>
          {successStories.map((story, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ bgcolor: '#181818', color: '#fff', height: '100%' }}>
                <Box
                  sx={{
                    height: 200,
                    backgroundImage: `url(https://images.unsplash.com/photo-${
                      index === 0 ? '1493225457124-a3fdf45e6da8' :
                      index === 1 ? '1511379938547-c1f69419868d' :
                      '1487180144351-b8472da7d491'
                    }?w=400&h=200&fit=crop)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {story.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#1db954', mb: 1 }}>
                    {story.genre} • {story.playlists}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1db954', mb: 1 }}>
                    {story.earnings} earned
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#b3b3b3', mb: 1 }}>
                    {story.followers}
                  </Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#e0e0e0' }}>
                    "{story.quote}"
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Final CTA Section */}
      <Box sx={{ bgcolor: '#1db954', py: 8, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2, color: '#000' }}>
            Ready to Start Earning?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, color: '#000' }}>
            Join thousands of curators building playlists and earning revenue on BeatFlow.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleGetStarted}
            sx={{
              bgcolor: '#000',
              color: '#fff',
              px: 6,
              py: 2,
              fontSize: '1.2rem',
              fontWeight: 'bold',
              '&:hover': { bgcolor: '#181818' }
            }}
          >
            Apply Now - It's Free
          </Button>
        </Container>
      </Box>
    </Box>
  );
}
