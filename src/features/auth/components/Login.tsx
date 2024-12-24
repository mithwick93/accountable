import { Alert, Box, Button, Link, TextField, Typography } from '@mui/material';
import { jwtDecode } from 'jwt-decode';
import React, { useState } from 'react';
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

  const handleLogin = async () => {
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
    <>
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
        <Typography variant="body2" sx={{ mt: 2 }}>
          {`Don't have an account? `}
          <Link href="/register">Register</Link>
        </Typography>
      </Box>
    </>
  );
};

export default Login;
