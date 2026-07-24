import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  Divider,
} from '@mui/material';
import {
  LayoutDashboard,
  Megaphone,
  Target,
  Users,
  Mail,
  BarChart3,
  Sparkles,
} from 'lucide-react';

const DRAWER_WIDTH = 260;

const menuItems = [
  { text: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { text: 'Campaigns', icon: Megaphone, path: '/campaigns' },
  { text: 'ICP Generator', icon: Target, path: '/icp' },
  { text: 'Lead Discovery', icon: Users, path: '/leads' },
  { text: 'Email Drafts', icon: Mail, path: '/email-drafts' },
  { text: 'Analytics', icon: BarChart3, path: '/analytics' },
];

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const location = useLocation();

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#0f172a',
        color: '#f8fafc',
        borderRight: '1px solid #1e293b',
      }}
    >
      {/* Brand Header */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2.5,
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
          }}
        >
          <Sparkles size={22} color="#ffffff" />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.15rem', color: '#ffffff', leading: 1 }}>
            SalesPilot <span style={{ color: '#818cf8' }}>AI</span>
          </Typography>
          <Chip
            label="Pro Enterprise"
            size="small"
            sx={{
              height: 18,
              fontSize: '0.65rem',
              fontWeight: 700,
              bgcolor: 'rgba(99, 102, 241, 0.2)',
              color: '#a5b4fc',
              mt: 0.2,
            }}
          />
        </Box>
      </Box>

      <Divider sx={{ borderColor: '#1e293b', mx: 2 }} />

      {/* Navigation Links */}
      <List sx={{ px: 2, py: 2, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.8 }}>
              <ListItemButton
                component={NavLink}
                to={item.path}
                sx={{
                  borderRadius: 3,
                  py: 1.2,
                  px: 2,
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(109, 93, 246, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%)'
                    : 'transparent',
                  color: isActive ? '#A5B4FC' : '#94A3B8',
                  border: isActive ? '1px solid rgba(109, 93, 246, 0.4)' : '1px solid transparent',
                  boxShadow: isActive ? '0 4px 14px rgba(109, 93, 246, 0.2)' : 'none',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(109, 93, 246, 0.35) 0%, rgba(168, 85, 247, 0.25) 100%)'
                      : 'rgba(255, 255, 255, 0.04)',
                    color: isActive ? '#FFFFFF' : '#F1F5F9',
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: isActive ? '#818CF8' : '#64748B',
                    transition: 'color 0.2s ease',
                  }}
                >
                  <Icon size={20} />
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: isActive ? '0.2px' : 'normal',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer Info */}
      <Box sx={{ p: 2, m: 2, borderRadius: 3, bgcolor: '#1e293b', border: '1px solid #334155' }}>
        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>
          AI Autonomous Agent
        </Typography>
        <Typography variant="body2" sx={{ color: '#cbd5e1', fontWeight: 700, mt: 0.3 }}>
          Engine Status: Active
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, border: 'none' },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Permanent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, border: 'none' },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export { DRAWER_WIDTH };
export default Sidebar;
