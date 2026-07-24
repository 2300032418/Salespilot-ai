import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './Navbar';
import Sidebar, { DRAWER_WIDTH } from './Sidebar';

const ProtectedLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0b0f17' }}>
      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
      <Box
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Navbar handleDrawerToggle={handleDrawerToggle} />
        <Container
          maxWidth="xl"
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2.5, sm: 4 },
            animation: 'fadeIn 0.25s ease-out forwards',
          }}
        >
          <Outlet />
        </Container>
      </Box>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </Box>
  );
};

export default ProtectedLayout;
