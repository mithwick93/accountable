import { Alert, Box, Button, Link, TextField, Typography } from '@mui/material';
import { jwtDecode } from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import logoLight from '../../../assets/logo-light.svg';
import { AuthService } from '../../../services/AuthService';
import { LoggedInUser } from '../../../types/LoggedInUser';
import log from '../../../utils/logger';
import './Login.css';
import { TokenStorage } from '../../../utils/TokenStorage';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    const accessToken = TokenStorage.getAccessToken();
    if (accessToken) {
      navigate(from, { replace: true });
    }
  }, [navigate, from]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await AuthService.login(username, password);

      const accessToken = TokenStorage.getAccessToken();
      if (accessToken) {
        const decodedToken: LoggedInUser = jwtDecode(accessToken);
        toast.success(
          `Welcome, ${decodedToken.firstName} ${decodedToken.lastName}!`,
        );
      } else {
        toast.success(`Welcome, ${username}!`);
      }

      navigate(from, { replace: true });
    } catch (e) {
      setError('Invalid username or password');
      log.error('Login error: ' + e);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        bgcolor="background.default"
        px={2}
      >
        <Box
          width="100%"
          maxWidth={400}
          display="flex"
          flexDirection="column"
          alignItems="center"
        >
          <img src={logoLight} className="App-logo" alt="logo" />
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
            required
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />
          <Typography variant="body2" sx={{ mt: 1, width: '100%' }}>
            <Link
              component="button"
              variant="body2"
              onClick={(event) => {
                event.preventDefault();
                navigate('/forgot-password');
              }}
              underline="hover"
            >
              Forgot password?
            </Link>
          </Typography>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            fullWidth
          >
            Login
          </Button>
          <Box display="flex" alignItems="center" sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              New to Accountable?
            </Typography>
            <Link
              component="button"
              variant="body2"
              onClick={(event) => {
                event.preventDefault();
                navigate('/register');
              }}
              underline="hover"
            >
              Join Now
            </Link>
          </Box>
        </Box>
      </Box>
    </form>
  );
};

export default Login;
