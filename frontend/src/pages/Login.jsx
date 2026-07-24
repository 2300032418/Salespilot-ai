import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Sparkles, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: 'admin@salespilot.ai',
      password: 'password123',
    },
  });

  const onSubmit = (data) => {
    // Basic placeholder login authentication
    localStorage.setItem('salespilot_token', 'mock_jwt_token_salespilot');
    toast.success('Successfully logged in!');
    navigate('/');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0b0f17',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 440,
          p: 4,
          borderRadius: 4,
          bgcolor: '#111827',
          border: '1px solid #1f2937',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Header Logo */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4, textAlign: 'center' }}>
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)',
              mb: 2,
            }}
          >
            <Sparkles size={28} color="#ffffff" />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>
            Welcome to SalesPilot <span style={{ color: '#818cf8' }}>AI</span>
          </Typography>
          <Typography variant="body2" sx={{ color: '#9ca3af', mt: 0.5 }}>
            Sign in to access your autonomous outreach portal
          </Typography>
        </Box>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="body2" sx={{ color: '#d1d5db', fontWeight: 600, mb: 0.8 }}>
                Email Address
              </Typography>
              <TextField
                fullWidth
                placeholder="name@company.com"
                {...register('email', { required: 'Email is required' })}
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail size={18} color="#6b7280" />
                    </InputAdornment>
                  ),
                  style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px' },
                }}
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ color: '#d1d5db', fontWeight: 600, mb: 0.8 }}>
                Password
              </Typography>
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password', { required: 'Password is required' })}
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock size={18} color="#6b7280" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#6b7280' }}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px' },
                }}
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                py: 1.5,
                mt: 1,
                bgcolor: '#6366f1',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.95rem',
                borderRadius: 2.5,
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                '&:hover': {
                  bgcolor: '#4f46e5',
                },
              }}
            >
              Sign In to Platform
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;
