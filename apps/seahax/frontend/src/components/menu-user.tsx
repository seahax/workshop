import { useAuth0 } from '@auth0/auth0-react';
import { Logout } from '@mui/icons-material';
import { Avatar, Button, CircularProgress, Fade, IconButton, ListItemIcon, Menu, MenuItem } from '@mui/material';
import { useSnackbar } from 'notistack';
import { type JSX, useCallback, useEffect, useRef } from 'react';

import { useBoolean } from '../hooks/use-boolean.ts';
import { useDelay } from '../hooks/use-delay.ts';

export default function MenuUser(): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();
  const accountButton = useRef<HTMLButtonElement | null>(null);
  const { value: isMenuOpen, setTrue: openMenu, setFalse: closeMenu } = useBoolean();
  const { isAuthenticated, isLoading, error, loginWithRedirect, logout, user } = useAuth0();
  const showLoading = useDelay(false, isLoading, (value) => value ? 1000 : 0);
  const loginClick = useCallback(() => {
    void loginWithRedirect({ appState: { returnTo: `${window.location.pathname}${window.location.search}` } });
  }, [loginWithRedirect]);
  const logoutClick = useCallback(() => {
    void logout({ logoutParams: { returnTo: window.location.origin } });
  }, [logout]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
    }
  }, [enqueueSnackbar, error]);

  return (
    <>
      {(isAuthenticated || showLoading) && (
        <IconButton
          size="large"
          aria-label="Current user avatar"
          aria-controls="account-menu"
          aria-haspopup="true"
          color="inherit"
          ref={accountButton}
          onClick={showLoading ? undefined : openMenu}
        >
          {!showLoading && isAuthenticated && (
            <Avatar
              alt={user?.name}
              src={user?.picture}
              sx={(theme) => ({
                width: '1.5rem',
                height: '1.5rem',
                color: theme.palette.background.paper,
                backgroundColor: theme.palette.text.primary,
              })}
            />
          )}
          {showLoading && <Fade in timeout={1000}><CircularProgress size="1.5rem" /></Fade>}
        </IconButton>
      )}
      {(!isAuthenticated && !isLoading) && (
        <Button color="inherit" onClick={loginClick}>Login</Button>
      )}
      <Menu
        id="account-menu"
        keepMounted
        anchorEl={accountButton.current}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={isMenuOpen}
        onClick={closeMenu}
        slotProps={{
          list: {
            dense: true,
          },
        }}
      >
        <MenuItem onClick={logoutClick}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}
