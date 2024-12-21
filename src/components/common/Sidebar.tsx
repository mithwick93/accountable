import {
  Dashboard as DashboardIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import {
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 240;

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const [isPersistent, setPersistent] = useState(false);

  const handleNavigation = (path: string) => {
    navigate(path);
    if (!isPersistent) {
      toggleSidebar();
    }
  };

  const togglePersistent = () => {
    setPersistent(!isPersistent);
  };

  return (
    <Drawer
      variant={isPersistent ? 'permanent' : 'temporary'}
      open={isOpen}
      onClose={toggleSidebar}
      sx={{
        [`& .MuiDrawer-paper`]: {
          boxSizing: 'border-box',
          width: drawerWidth,
        },
        flexShrink: 0,
        width: drawerWidth,
      }}
    >
      <Toolbar>
        <IconButton onClick={togglePersistent}>
          <MenuIcon />
        </IconButton>
      </Toolbar>
      <List>
        <ListItem component="div" onClick={() => handleNavigation('/')}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;
