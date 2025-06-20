import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logoLight from '../../../assets/logo-light.svg';
import { AuthService } from '../../../services/AuthService';

const VerifyEmail: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing token.');
      return;
    }

    setStatus('loading');
    AuthService.verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Email verified successfully! Redirecting to login...');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(
          err.response?.data?.detail || err.message || 'Verification failed.',
        );
      });
  }, [location.search, navigate]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="background.default"
      px={3}
    >
      <img src={logoLight} className="App-logo" alt="logo" />
      {status === 'loading' && (
        <>
          <CircularProgress sx={{ mt: 4 }} />
          <Typography sx={{ mt: 2 }}>Verifying your email...</Typography>
        </>
      )}
      {status === 'success' && (
        <Alert severity="success" sx={{ mt: 4 }}>
          {message}
        </Alert>
      )}
      {status === 'error' && (
        <>
          <Alert severity="error" sx={{ mt: 4 }}>
            {message}
          </Alert>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => navigate('/login', { replace: true })}
          >
            Back to Login
          </Button>
        </>
      )}
    </Box>
  );
};

export default VerifyEmail;
