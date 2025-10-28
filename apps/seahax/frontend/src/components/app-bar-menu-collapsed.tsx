import { useAuth0 } from '@auth0/auth0-react';
import { Box, Divider, IconButton, ListItemIcon, Menu, MenuItem, useEventCallback } from '@mui/material';
import { IconLogin, IconMenu2 } from '@tabler/icons-react';
import { type JSX, useCallback, useState } from 'react';
import { useNavigate } from 'react-router';

import { useMenuState } from '../hooks/use-menu-state.ts';
import UserMenuContent from './user-menu-content.tsx';

export default function AppBarMenuCollapsed(): JSX.Element {
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<HTMLButtonElement | null>(null);
  const menuState = useMenuState();
  const projectsClick = useEventCallback(() => {
    menuState.close();
    setTimeout(() => {
      void navigate('/#projects');
    });
  });
  const musingsClick = useEventCallback(() => {
    menuState.close();
    window.open('/musings', '_blank');
  });
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const loginClick = useCallback(() => {
    void loginWithRedirect({ appState: { returnTo: `${window.location.pathname}${window.location.search}` } });
  }, [loginWithRedirect]);

  return (
    <Box alignItems="center" height="100%" ref={setMenuAnchor} sx={{ display: { xs: 'flex', sm: 'none' } }}>
      <IconButton onClick={menuState.open}><IconMenu2 /></IconButton>
      <Menu
        open={menuState.isOpen}
        onClose={menuState.close}
        anchorEl={menuAnchor}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={(theme) => ({ transform: `translate(0, ${theme.spacing(0.75)})` })}
      >
        <MenuItem href="/#projects" onClick={projectsClick}>Projects</MenuItem>
        <MenuItem href="/musings" onClick={musingsClick}>Musings</MenuItem>
        <Divider />
        {isAuthenticated && <UserMenuContent showAvatar />}
        {!isAuthenticated && (
          <MenuItem onClick={loginClick}>
            <ListItemIcon><IconLogin size={20} /></ListItemIcon>
            Login
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
