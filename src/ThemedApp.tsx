import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import App from './App';
import { ThemeContextProvider, useTheme } from './context/ThemeContext';
import { darkTheme, lightTheme } from './theme/theme';

const ThemedApp = () => {
  const { isDarkMode } = useTheme();

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
};

const AppWrapper = () => (
  <ThemeContextProvider>
    <ThemedApp />
  </ThemeContextProvider>
);

export default AppWrapper;
