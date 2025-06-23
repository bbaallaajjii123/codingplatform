import React from 'react';
import { Box, Container, Typography, Link } from '@mui/material';
import { Code as CodeIcon } from '@mui/icons-material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <CodeIcon color="primary" />
          <Typography variant="body2" color="text.secondary" align="center">
            © 2024 Akshaya Coding Platform. Built with ❤️ for students.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 