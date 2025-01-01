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
import { toast } from 'react-toastify';
import { useSettings } from '../../context/SettingsContext';
import { useStaticData } from '../../context/StaticDataContext';
import { useUser } from '../../context/UserContext';
import { AuthService } from '../../services/AuthService';
import { generateAvatarProps } from '../../utils/common';

const clockUpdateInterval = 60000;

const formatDate = () =>
  new Date().toLocaleString([], {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
    toast.success('Logged out successfully');
  };
  const handleCurrencyChange = (event: SelectChangeEvent) =>
    update({ ...settings, currency: event.target.value });

  const userName =
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
      <Tooltip title={userName || 'User'}>
        <Avatar
          {...generateAvatarProps(
            userName || 'User',
            theme.palette.mode === 'dark',
          )}
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
