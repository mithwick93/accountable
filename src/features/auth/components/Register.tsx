import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import logoLight from '../../../assets/logo-light.svg';
import { AuthService } from '../../../services/AuthService';
import { PASSWORD_PATTERN } from '../../../utils/common';
import log from '../../../utils/logger';
import './Register.css';

type RegisterFormData = {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

type FormErrors = {
  username?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
};

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [globalError, setGlobalError] = useState<string>('');
  const navigate = useNavigate();

  const validate = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.username) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 4 || formData.username.length > 20) {
      errors.username = 'Username must be between 4 and 20 characters';
    }

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      errors.email = 'Invalid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!PASSWORD_PATTERN.test(formData.password)) {
      errors.password =
        'Password must be at least 8 characters and include upper, lower, number, and special character.';
    }

    if (!formData.firstName) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.length > 50) {
      errors.firstName = 'First name must not exceed 50 characters';
    }

    if (!formData.lastName) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.length > 50) {
      errors.lastName = 'Last name must not exceed 50 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange =
    (field: keyof RegisterFormData) =>
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setFormData({
        ...formData,
        [field]: event.target.value,
      });
      setFormErrors({ ...formErrors, [field]: '' });
    };

  const handleRegister = async (): Promise<void> => {
    setGlobalError('');
    if (!validate()) {
      return;
    }

    try {
      await AuthService.register(formData);
      toast.success(
        'Registration initiated. Please check your email to verify your account.',
      );
      navigate('/login', { replace: true });
    } catch (e) {
      setGlobalError('Registration failed');
      log.error('Registration error: ' + e);
    }
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
      <Typography variant="h2" gutterBottom>
        Register
      </Typography>
      {globalError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {globalError}
        </Alert>
      )}
      <TextField
        label="Username"
        variant="outlined"
        margin="normal"
        value={formData.username}
        onChange={handleChange('username')}
        error={!!formErrors.username}
        helperText={formErrors.username}
      />
      <TextField
        label="Email"
        variant="outlined"
        margin="normal"
        value={formData.email}
        onChange={handleChange('email')}
        error={!!formErrors.email}
        helperText={formErrors.email}
      />
      <TextField
        label="Password"
        type="password"
        variant="outlined"
        margin="normal"
        value={formData.password}
        onChange={handleChange('password')}
        error={!!formErrors.password}
        helperText={formErrors.password}
      />
      <TextField
        label="First Name"
        variant="outlined"
        margin="normal"
        value={formData.firstName}
        onChange={handleChange('firstName')}
        error={!!formErrors.firstName}
        helperText={formErrors.firstName}
      />
      <TextField
        label="Last Name"
        variant="outlined"
        margin="normal"
        value={formData.lastName}
        onChange={handleChange('lastName')}
        error={!!formErrors.lastName}
        helperText={formErrors.lastName}
      />
      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 2 }}
        onClick={handleRegister}
      >
        Register
      </Button>
    </Box>
  );
};

export default Register;
