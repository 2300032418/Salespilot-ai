import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const PageHeader = ({ title, subtitle, actionLabel, onActionClick, actionIcon: ActionIcon, children }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        mb: 4,
        gap: 2,
      }}
    >
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ color: '#9ca3af', mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {children}
        {actionLabel && (
          <Button
            variant="contained"
            onClick={onActionClick}
            startIcon={ActionIcon ? <ActionIcon size={18} /> : null}
            sx={{
              bgcolor: '#6366f1',
              color: '#ffffff',
              fontWeight: 600,
              px: 2.5,
              py: 1,
              borderRadius: 2.5,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
              '&:hover': {
                bgcolor: '#4f46e5',
              },
            }}
          >
            {actionLabel}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default PageHeader;
