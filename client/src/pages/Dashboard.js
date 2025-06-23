import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const Dashboard = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Welcome to your dashboard! This page will show your progress, recent submissions, and recommended problems.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Dashboard; 