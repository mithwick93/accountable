import {
  Avatar,
  Menu,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Stack from '@mui/material/Stack';
import { ThemeSwitcher } from '@toolpad/core/DashboardLayout';
import React, { useEffect, useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useStaticData } from '../../context/StaticDataContext';
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
  const { currencies } = useStaticData();
  const { settings, update } = useSettings();
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

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

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

  const handleCurrencyChange = (event: SelectChangeEvent) => {
    update({ ...settings, currency: event.target.value });
  };

  const userNames = `${loggedInUser?.firstName} ${loggedInUser?.lastName}`;

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {!isSmallScreen && <Typography>{currentTime}</Typography>}
      <Select
        value={settings?.currency}
        onChange={handleCurrencyChange}
        displayEmpty
        inputProps={{ 'aria-label': 'Select currency' }}
        sx={{ m: 1, minWidth: 80 }}
      >
        {currencies?.map((currency) => (
          <MenuItem key={currency.code} value={currency.code}>
            {currency.code}
          </MenuItem>
        ))}
      </Select>
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
