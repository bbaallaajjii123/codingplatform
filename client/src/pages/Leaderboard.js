import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const Leaderboard = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Leaderboard
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          See how you rank among other students and track your progress.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Leaderboard; 