import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const Profile = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Manage your profile, view statistics, and update preferences.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Profile; 