import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const Submissions = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Submissions
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          View your code submission history and results.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Submissions; 