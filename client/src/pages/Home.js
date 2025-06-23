import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Paper,
  Chip,
  Stack
} from '@mui/material';
import {
  Code as CodeIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const features = [
    {
      icon: <CodeIcon sx={{ fontSize: 40 }} />,
      title: 'Practice Coding',
      description: 'Solve problems in multiple programming languages with our advanced code editor.',
      color: 'primary'
    },
    {
      icon: <SchoolIcon sx={{ fontSize: 40 }} />,
      title: 'Learn & Improve',
      description: 'Track your progress, learn from solutions, and improve your coding skills.',
      color: 'secondary'
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      title: 'Track Progress',
      description: 'Monitor your performance with detailed analytics and progress tracking.',
      color: 'success'
    },
    {
      icon: <TrophyIcon sx={{ fontSize: 40 }} />,
      title: 'Compete & Win',
      description: 'Compete with other students on leaderboards and earn achievements.',
      color: 'warning'
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
      title: 'Fast Execution',
      description: 'Get instant feedback with our high-performance code execution engine.',
      color: 'info'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: 'Safe Environment',
      description: 'Code in a secure, sandboxed environment with proper resource limits.',
      color: 'error'
    }
  ];

  const stats = [
    { label: 'Problems', value: '500+', icon: <AssignmentIcon /> },
    { label: 'Languages', value: '10+', icon: <CodeIcon /> },
    { label: 'Students', value: '10K+', icon: <GroupIcon /> },
    { label: 'Submissions', value: '100K+', icon: <TrendingUpIcon /> }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Paper
        sx={{
          position: 'relative',
          backgroundColor: 'grey.800',
          color: 'white',
          mb: 4,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80)',
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography
              component="h1"
              variant="h2"
              color="inherit"
              gutterBottom
              sx={{ fontWeight: 700, mb: 3 }}
            >
              Master Programming Skills
            </Typography>
            <Typography variant="h5" color="inherit" paragraph sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
              Practice coding problems, compete with peers, and track your progress on our comprehensive programming platform designed for students.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              {isAuthenticated ? (
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/problems')}
                  sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
                >
                  Start Practicing
                </Button>
              ) : (
                <>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/register')}
                    sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
                  >
                    Get Started
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/login')}
                    sx={{ px: 4, py: 1.5, fontSize: '1.1rem', color: 'white', borderColor: 'white' }}
                  >
                    Sign In
                  </Button>
                </>
              )}
            </Stack>
          </Box>
        </Container>
      </Paper>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Grid container spacing={4} justifyContent="center">
          {stats.map((stat, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <Card sx={{ textAlign: 'center', height: '100%' }}>
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 1 }}>
                    {stat.icon}
                  </Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom sx={{ mb: 6 }}>
          Why Choose Our Platform?
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box sx={{ color: `${feature.color}.main`, mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography gutterBottom variant="h5" component="h3" sx={{ fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Categories Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom sx={{ mb: 6 }}>
          Problem Categories
        </Typography>
        <Grid container spacing={2} justifyContent="center">
          {[
            'Algorithms', 'Data Structures', 'Dynamic Programming', 'Graph Theory',
            'String Manipulation', 'Mathematics', 'Sorting', 'Searching'
          ].map((category) => (
            <Grid item key={category}>
              <Chip
                label={category}
                variant="outlined"
                color="primary"
                sx={{ fontSize: '1rem', px: 2, py: 1 }}
              />
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Paper sx={{ bgcolor: 'primary.main', color: 'white', py: 8 }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
              Ready to Start Your Coding Journey?
            </Typography>
            <Typography variant="h6" paragraph sx={{ mb: 4, opacity: 0.9 }}>
              Join thousands of students who are already improving their programming skills on our platform.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate(isAuthenticated ? '/problems' : '/register')}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': {
                  bgcolor: 'grey.100'
                }
              }}
            >
              {isAuthenticated ? 'Start Practicing' : 'Join Now'}
            </Button>
          </Box>
        </Container>
      </Paper>
    </Box>
  );
};

export default Home; 