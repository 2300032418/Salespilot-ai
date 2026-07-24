import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  KeyRound,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { DRAWER_WIDTH } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Navbar = ({ handleDrawerToggle }) => {
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth?.user;
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleActionToast = (message) => {
    handleMenuClose();
    toast.info(message);
  };

  const handleLogout = () => {
    handleMenuClose();
    localStorage.removeItem('salespilot_token');
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  const userName = user?.name || 'Lalith Pavan';
  const userRole = user?.role || 'Founder & Full Stack Developer';
  const userInitials = user?.avatar || 'LP';

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { sm: `${DRAWER_WIDTH}px` },
        bgcolor: 'rgba(11, 16, 32, 0.8)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#F8FAFC',
        zIndex: 1100,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3.5 }, py: 0.5 }}>
        {/* Left Side: Mobile Menu + Search Bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ display: { sm: 'none' }, color: '#9CA3AF' }}
          >
            <MenuIcon size={22} />
          </IconButton>

          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              bgcolor: 'rgba(17, 24, 39, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              px: 2,
              py: 0.9,
              gap: 1.5,
              width: 310,
              transition: 'all 0.2s ease',
              '&:focus-within': {
                borderColor: '#6D5DF6',
                boxShadow: '0 0 0 3px rgba(109, 93, 246, 0.2)',
              },
            }}
          >
            <Search size={17} color="#6B7280" />
            <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.85rem' }}>
              Search campaigns, leads, ICPs...
            </Typography>
          </Box>
        </Box>

        {/* Right Side: Notifications + User Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Notifications">
            <IconButton
              sx={{
                color: '#9CA3AF',
                bgcolor: 'rgba(17, 24, 39, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                p: 1.1,
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF' },
              }}
            >
              <Badge
                badgeContent={3}
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    bgcolor: '#6D5DF6',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.65rem',
                  },
                }}
              >
                <Bell size={18} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Profile Pill Trigger */}
          <Box
            onClick={handleMenuOpen}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              py: 0.6,
              px: 1.2,
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              bgcolor: 'rgba(17, 24, 39, 0.75)',
              backdropFilter: 'blur(12px)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                borderColor: 'rgba(109, 93, 246, 0.4)',
                boxShadow: '0 4px 20px rgba(109, 93, 246, 0.25)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            {/* Avatar with Animated Online Status Indicator */}
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: '#22C55E',
                  color: '#22C55E',
                  boxShadow: '0 0 0 2px #0B1020',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  '&::after': {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    animation: 'ripple 1.6s infinite ease-in-out',
                    border: '1px solid #22C55E',
                    content: '""',
                  },
                },
                '@keyframes ripple': {
                  '0%': { transform: 'scale(.8)', opacity: 1 },
                  '100%': { transform: 'scale(2.4)', opacity: 0 },
                },
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  background: 'linear-gradient(135deg, #6D5DF6 0%, #a855f7 100%)',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 14px rgba(109, 93, 246, 0.4)',
                }}
              >
                {userInitials}
              </Avatar>
            </Badge>

            {/* Name and Role */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, fontSize: '0.86rem' }}>
                {userName}
              </Typography>
              <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.72rem', display: 'block' }}>
                {userRole}
              </Typography>
            </Box>

            <ChevronDown
              size={15}
              color="#9CA3AF"
              style={{
                transition: 'transform 0.25s ease',
                transform: Boolean(anchorEl) ? 'rotate(180deg)' : 'none',
              }}
            />
          </Box>

          {/* Profile Menu Dropdown */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              elevation: 0,
              sx: {
                bgcolor: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(16px)',
                color: '#F8FAFC',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                mt: 1.5,
                minWidth: 230,
                p: 1,
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                '& .MuiMenuItem-root': {
                  borderRadius: '12px',
                  py: 1.2,
                  px: 2,
                  my: 0.3,
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(109, 93, 246, 0.15)',
                    color: '#A5B4FC',
                  },
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {/* Header snippet inside dropdown */}
            <Box sx={{ px: 2, py: 1.5, mb: 1, borderRadius: '14px', bgcolor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
                {userName}
              </Typography>
              <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.72rem', display: 'block' }}>
                lalith.pavan@salespilot.ai
              </Typography>
            </Box>

            <MenuItem onClick={() => handleActionToast('Opening Profile…')} sx={{ gap: 1.8 }}>
              <User size={17} color="#6D5DF6" /> My Profile
            </MenuItem>
            <MenuItem onClick={() => handleActionToast('Opening Settings…')} sx={{ gap: 1.8 }}>
              <Settings size={17} color="#00F2FE" /> Settings
            </MenuItem>
            <MenuItem onClick={() => handleActionToast('Opening Change Password dialog…')} sx={{ gap: 1.8 }}>
              <KeyRound size={17} color="#F59E0B" /> Change Password
            </MenuItem>

            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', my: 1 }} />

            <MenuItem
              onClick={handleLogout}
              sx={{
                gap: 1.8,
                color: '#EF4444 !important',
                '&:hover': {
                  bgcolor: 'rgba(239, 68, 68, 0.15) !important',
                },
              }}
            >
              <LogOut size={17} color="#EF4444" /> Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
