import { Box, Button, TextField, Typography } from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import logoLight from '../../../assets/logo-light.svg';
import { AuthService } from '../../../services/AuthService';
import { isValidEmail } from '../../../utils/common';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !isValidEmail(email)) {
      setError('Enter a valid email address');
      return;
    }

    try {
      await AuthService.forgotPassword(email);
    } catch {
      // Intentionally ignore errors for security
    }

    toast.info(
      'If registered, you will receive an email with reset instructions.',
    );
    navigate('/login', { replace: true });
  };

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
      <Typography variant="h4" gutterBottom>
        Forgot Password
      </Typography>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 400 }}>
        <TextField
          label="Registered Email"
          type="email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={!!error}
          helperText={error}
          required
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          We’ll send a verification code to this email if it matches an existing
          account.
        </Typography>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
        >
          Send Reset Link
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          fullWidth
          sx={{ mt: 1 }}
          onClick={() => navigate('/login')}
        >
          Back
        </Button>
      </form>
    </Box>
  );
};

export default ForgotPassword;
