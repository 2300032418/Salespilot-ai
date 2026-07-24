import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingSpinner = ({ message = 'Loading...', minHeight = '300px' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight,
        width: '100%',
        gap: 2,
      }}
    >
      <CircularProgress size={40} thickness={4} sx={{ color: '#6366f1' }} />
      {message && (
        <Typography variant="body2" sx={{ color: '#9ca3af', fontWeight: 500 }}>
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;
