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

const formatDate = () =>
  new Date().toLocaleString([], {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const stringToColor = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 3) - hash);
  }
  return `#${[0, 1, 2]
    .map((i) => `00${((hash >> (i * 8)) & 0xff).toString(16)}`.slice(-2))
    .join('')}`;
};

const generateAvatarProps = (name: string) => ({
  sx: { bgcolor: stringToColor(name) },
  children: name
    .split(' ')
    .map((part) => part[0])
    .join(''),
});

const ToolbarActions = () => {
  const { loggedInUser } = useUser();
  const { currencies } = useStaticData();
  const { settings, update } = useSettings();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentTime, setCurrentTime] = useState<string>(formatDate());

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const timer = setInterval(
      () => setCurrentTime(formatDate()),
      clockUpdateInterval,
    );
    return () => clearInterval(timer);
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = async () => {
    await AuthService.logout();
    handleMenuClose();
  };
  const handleCurrencyChange = (event: SelectChangeEvent) =>
    update({ ...settings, currency: event.target.value });

  const userNames =
    `${loggedInUser?.firstName || ''} ${loggedInUser?.lastName || ''}`.trim();

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {!isSmallScreen && <Typography>{currentTime}</Typography>}
      <Select
        value={settings?.currency || ''}
        onChange={handleCurrencyChange}
        displayEmpty
        inputProps={{ 'aria-label': 'Select currency' }}
        sx={{ m: 1, minWidth: 80 }}
        size="small"
      >
        {currencies?.map(({ code }) => (
          <MenuItem key={code} value={code}>
            {code}
          </MenuItem>
        ))}
      </Select>
      <ThemeSwitcher />
      <Tooltip title={userNames || 'User'}>
        <Avatar
          {...generateAvatarProps(userNames || 'User')}
          onClick={handleMenuOpen}
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
