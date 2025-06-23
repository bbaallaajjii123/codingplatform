import React from 'react';
import { Box, Typography, Paper, Alert, Collapse, IconButton } from '@mui/material';
import { ExpandMore, ExpandLess, Error, Warning, Info } from '@mui/icons-material';
import { useState } from 'react';

const ErrorDisplay = ({ error, type = 'error', title = 'Error', showTips = true }) => {
  const [expanded, setExpanded] = useState(true);

  if (!error) return null;

  const getErrorIcon = () => {
    switch (type) {
      case 'compilation':
        return <Error sx={{ color: '#ff6b6b' }} />;
      case 'runtime':
        return <Warning sx={{ color: '#ffa726' }} />;
      case 'system':
        return <Info sx={{ color: '#42a5f5' }} />;
      default:
        return <Error sx={{ color: '#ff6b6b' }} />;
    }
  };

  const getErrorColor = () => {
    switch (type) {
      case 'compilation':
        return '#ff6b6b';
      case 'runtime':
        return '#ffa726';
      case 'system':
        return '#42a5f5';
      default:
        return '#ff6b6b';
    }
  };

  const getErrorBackground = () => {
    switch (type) {
      case 'compilation':
        return '#2d1b1b';
      case 'runtime':
        return '#2d2b1b';
      case 'system':
        return '#1b2d2d';
      default:
        return '#2d1b1b';
    }
  };

  const getTips = () => {
    switch (type) {
      case 'compilation':
        return [
          'Check your syntax and spelling',
          'Make sure all brackets, parentheses, and braces are properly closed',
          'Verify that all variables are declared before use',
          'Check that all required imports are included',
          'Ensure function names match their declarations'
        ];
      case 'runtime':
        return [
          'Check for division by zero or null pointer access',
          'Verify array indices are within bounds',
          'Make sure all variables are initialized',
          'Check for infinite loops or recursion depth',
          'Verify input format matches expectations'
        ];
      case 'system':
        return [
          'Try refreshing the page',
          'Check your internet connection',
          'Wait a moment and try again',
          'Contact support if the problem persists'
        ];
      default:
        return [
          'Review your code carefully',
          'Check the error message for specific issues',
          'Test with simpler inputs first'
        ];
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Paper sx={{ 
        background: getErrorBackground(),
        color: getErrorColor(),
        p: 2,
        borderRadius: 2,
        border: `1px solid ${getErrorColor()}`,
        boxShadow: `0 4px 8px rgba(0,0,0,0.3)`
      }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            {getErrorIcon()}
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: getErrorColor() }}>
              🚨 {title}
            </Typography>
          </Box>
          <IconButton 
            size="small" 
            onClick={() => setExpanded(!expanded)}
            sx={{ color: getErrorColor() }}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
        
        <Collapse in={expanded}>
          <Paper sx={{ 
            background: '#1a1a1a', 
            color: getErrorColor(), 
            p: 1.5, 
            borderRadius: 1,
            border: `1px solid ${getErrorColor()}40`,
            mt: 1.5
          }}>
            <pre style={{ 
              margin: 0, 
              color: getErrorColor(),
              fontFamily: 'monospace',
              fontSize: '13px',
              lineHeight: '1.4',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowX: 'auto'
            }}>{error}</pre>
          </Paper>
          
          {showTips && (
            <Box mt={2}>
              <Typography variant="caption" sx={{ color: `${getErrorColor()}cc`, fontWeight: 'bold', display: 'block', mb: 1 }}>
                💡 Troubleshooting Tips:
              </Typography>
              <ul style={{ 
                margin: 0, 
                paddingLeft: 20, 
                color: `${getErrorColor()}cc`,
                fontSize: '12px',
                lineHeight: '1.4'
              }}>
                {getTips().map((tip, index) => (
                  <li key={index} style={{ marginBottom: '4px' }}>{tip}</li>
                ))}
              </ul>
            </Box>
          )}
        </Collapse>
      </Paper>
    </Box>
  );
};

export default ErrorDisplay; 