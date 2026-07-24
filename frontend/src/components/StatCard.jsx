import React from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection = 'up',
  color = '#6366f1',
}) => {
  const isPositive = trendDirection === 'up';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        bgcolor: '#111827',
        border: '1px solid #1f2937',
        transition: 'all 0.2s ease-in-out',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          borderColor: color,
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 24px ${color}20`,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="body2" sx={{ color: '#9ca3af', fontWeight: 600, fontSize: '0.85rem' }}>
          {title}
        </Typography>
        {Icon && (
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: `${color}15`,
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={20} />
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', letterSpacing: '-0.5px' }}>
          {value}
        </Typography>
        {trend && (
          <Chip
            size="small"
            label={trend}
            sx={{
              bgcolor: isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: isPositive ? '#10b981' : '#ef4444',
              fontWeight: 700,
              fontSize: '0.75rem',
              height: 22,
            }}
          />
        )}
      </Box>

      {subtitle && (
        <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
};

export default StatCard;
