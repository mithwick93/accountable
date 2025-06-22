import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import logoLight from '../../../assets/logo-light.svg';
import { AuthService } from '../../../services/AuthService';
import { PASSWORD_PATTERN } from '../../../utils/common';

const useQuery = () => new URLSearchParams(useLocation().search);

type FormErrors = {
  password?: string;
  confirm?: string;
};

const ResetPassword = () => {
  const query = useQuery();
  const token = query.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [globalError, setGlobalError] = useState('');
  const navigate = useNavigate();

  const validate = (): boolean => {
    const errors: FormErrors = {};
    if (!password) {
      errors.password = 'Password is required';
    } else if (!PASSWORD_PATTERN.test(password)) {
      errors.password =
        'Password must be at least 8 characters and include upper, lower, number, and special character.';
    }
    if (!confirm) {
      errors.confirm = 'Please confirm your password';
    } else if (password !== confirm) {
      errors.confirm = 'Passwords do not match';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    if (!validate()) {
      return;
    }
    try {
      await AuthService.resetPassword({ token, newPassword: password });
      toast.success('Password reset successful. Please log in.');
      navigate('/login', { replace: true });
    } catch {
      setGlobalError('Failed to reset password. Try again.');
    }
  };

  if (!token) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        px={3}
      >
        <img src={logoLight} className="App-logo" alt="logo" />
        <Alert severity="error" sx={{ mt: 4 }}>
          Invalid or missing token.
        </Alert>
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          onClick={() => navigate('/login', { replace: true })}
        >
          Back to Login
        </Button>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      px={3}
    >
      <img src={logoLight} className="App-logo" alt="logo" />
      <Typography variant="h4" gutterBottom>
        Reset Password
      </Typography>
      {globalError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {globalError}
        </Alert>
      )}
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 400 }}>
        <TextField
          label="New Password"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFormErrors({ ...formErrors, password: '' });
          }}
          error={!!formErrors.password}
          helperText={formErrors.password}
          required
        />
        <TextField
          label="Confirm Password"
          type="password"
          fullWidth
          margin="normal"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setFormErrors({ ...formErrors, confirm: '' });
          }}
          error={!!formErrors.confirm}
          helperText={formErrors.confirm}
          required
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
        >
          Reset Password
        </Button>
      </form>
    </Box>
  );
};

export default ResetPassword;
