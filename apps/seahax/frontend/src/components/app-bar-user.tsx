import { useAuth0 } from '@auth0/auth0-react';
import {
  Box,
  Button,
  CircularProgress,
  Fade,
  IconButton,
  ListItem,
  ListItemIcon,
  Menu,
  MenuItem,
  useEventCallback,
} from '@mui/material';
import { IconLogout } from '@tabler/icons-react';
import { useSnackbar } from 'notistack';
import { type JSX, useEffect, useState } from 'react';

import useDelay from '../hooks/use-delay.ts';
import { useMenuState } from '../hooks/use-menu-state.ts';
import UserAvatar from './user-avatar.tsx';

export default function AppBarUser(): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const menuState = useMenuState();
  const { user, isAuthenticated, isLoading, error, loginWithRedirect, logout } = useAuth0();
  const showLoading = useDelay(false, isLoading, (value) => value ? 1000 : 0);
  const loginClick = useEventCallback(() => {
    void loginWithRedirect({ appState: { returnTo: `${window.location.pathname}${window.location.search}` } });
  });
  const logoutClick = useEventCallback(() => {
    void logout({ logoutParams: { returnTo: window.location.origin } });
    menuState.close();
  });

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
    }
  }, [enqueueSnackbar, error]);

  return (
    <>
      {isAuthenticated && !showLoading && (
        <Box
          height="100%"
          display="flex"
          alignItems="center"
          ref={setMenuAnchor}
        >
          <IconButton
            size="small"
            aria-label="Current user avatar"
            aria-haspopup="true"
            color="primary"
            onClick={menuState.open}
          >
            <UserAvatar />
          </IconButton>
        </Box>
      )}
      {isAuthenticated && showLoading && (
        <Fade in timeout={1000}>
          <CircularProgress size="3rem" sx={{ p: '0.5rem' }} />
        </Fade>
      )}
      {(!isAuthenticated && !isLoading) && (
        <Button onClick={loginClick}>Login</Button>
      )}
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
        {user?.name && (
          <>
            <ListItem
              sx={(theme) => ({
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: theme.spacing(0.5),
                color: theme.palette.text.disabled,
                ...theme.typography.body2,
              })}
            >
              <Box>{user.name}</Box>
            </ListItem>
          </>
        )}
        <MenuItem onClick={logoutClick}>
          <ListItemIcon>
            <IconLogout size={20} />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}
