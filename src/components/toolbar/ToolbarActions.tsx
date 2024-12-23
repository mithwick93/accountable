import { Avatar, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';
import { ThemeSwitcher } from '@toolpad/core/DashboardLayout';
import React, { useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { AuthService } from '../../services/AuthService';

const clockUpdateInterval = 60000;

const stringToColor = (string: string) => {
  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 3) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return color;
};

const stringAvatar = (name: string) => ({
  sx: {
    bgcolor: stringToColor(name),
  },
  children: `${name.split(' ')[0][0]}${name.split(' ')[1][0]}`,
});

const ToolbarActions = () => {
  const { loggedInUser } = useUser();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    AuthService.logout();
    handleMenuClose();
  };

  const userNames = `${loggedInUser?.firstName} ${loggedInUser?.lastName}`;

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography>{currentTime}</Typography>
      <ThemeSwitcher />
      <Tooltip title={userNames}>
        <Avatar
          {...stringAvatar(userNames)}
          onClick={handleMenuOpen}
          style={{ cursor: 'pointer' }}
        />
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>
    </Stack>
  );
};

export default ToolbarActions;
