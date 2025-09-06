import { useAuth0 } from '@auth0/auth0-react';
import { Box, Divider, IconButton, ListItemIcon, Menu, MenuItem } from '@mui/material';
import { IconLogin, IconMenu2 } from '@tabler/icons-react';
import { type JSX, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';

import { useMenuState } from '../hooks/use-menu-state.ts';
import UserMenuContent from './user-menu-content.tsx';

export default function AppBarMenuCollapsed(): JSX.Element {
  const menuAnchor = useRef<HTMLButtonElement | null>(null);
  const menuState = useMenuState();
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const loginClick = useCallback(() => {
    void loginWithRedirect({ appState: { returnTo: `${window.location.pathname}${window.location.search}` } });
  }, [loginWithRedirect]);
  const navigate = useNavigate();

  return (
    <Box alignItems="center" height="100%" ref={menuAnchor} sx={{ display: { xs: 'flex', sm: 'none' } }}>
      <IconButton onClick={menuState.open}><IconMenu2 /></IconButton>
      <Menu
        open={menuState.isOpen}
        onClose={menuState.close}
        anchorEl={menuAnchor.current}
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
        <MenuItem
          href="/#projects"
          onClick={() => void navigate('/#projects')}
        >
          Projects
        </MenuItem>
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
