import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import App from './App';
import { lightTheme } from './theme/theme';

const ThemedApp = () => (
  <ThemeProvider theme={lightTheme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
);

export default ThemedApp;
