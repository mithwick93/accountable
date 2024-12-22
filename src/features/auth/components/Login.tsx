import {
  Alert,
  Box,
  Button,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import logoDark from '../../../assets/logo-dark.svg';
import logoLight from '../../../assets/logo-light.svg';
import { useTheme } from '../../../context/ThemeContext';
import { AuthService } from '../../../services/AuthService';
import log from '../../../utils/logger';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLogin = async () => {
    try {
      await AuthService.login(username, password);
      window.location.href = '/';
    } catch (e) {
      setError('Invalid username or password');
      log.error('Login error: ' + e);
    }
  };

  return (
    <>
      <Box display="flex" justifyContent="flex-end" alignItems="center" p={2}>
        <Typography>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</Typography>
        <Switch checked={isDarkMode} onChange={toggleTheme} />
      </Box>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        bgcolor="background.default"
        px={3}
      >
        <img
          src={isDarkMode ? logoLight : logoDark}
          className="App-logo"
          alt="logo"
        />
        <Typography variant="h2" gutterBottom>
          AccountAble
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          label="Username"
          variant="outlined"
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          variant="outlined"
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          onClick={handleLogin}
        >
          Login
        </Button>
      </Box>
    </>
  );
};

export default Login;
