import {
  AppBar,
  Box,
  Button,
  Switch,
  Toolbar,
  Typography,
  IconButton,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { AuthService } from '../../services/AuthService';
import { Menu as MenuIcon } from '@mui/icons-material';

const clockUpdateInterval = 60000;
const zIndexOffset = 1;

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { loggedInUser } = useUser();
  const { isDarkMode, toggleTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleString([], {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleString([], {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      );
    }, clockUpdateInterval);

    return () => clearInterval(timer);
  }, []);

  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + zIndexOffset }}
    >
      <Toolbar sx={{ flexDirection: { xs: 'column', sm: 'row' } }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={toggleSidebar}
          // sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Welcome, {loggedInUser?.firstName} {loggedInUser?.lastName}!
        </Typography>
        <Typography variant="body1" sx={{ marginRight: 2 }}>
          Current time: {currentTime}
        </Typography>
        <Box display="flex" justifyContent="flex-end" alignItems="center" p={2}>
          <Typography>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</Typography>
          <Switch checked={isDarkMode} onChange={toggleTheme} />
        </Box>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => AuthService.logout()}
        >
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
