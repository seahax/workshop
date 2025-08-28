import { useAuth0 } from '@auth0/auth0-react';
import { Box, Button, CircularProgress, Fade, IconButton, Menu } from '@mui/material';
import { useSnackbar } from 'notistack';
import { type JSX, useCallback, useEffect, useRef } from 'react';

import useDelay from '../hooks/use-delay.ts';
import { useMenuState } from '../hooks/use-menu-state.ts';
import UserAvatar from './user-avatar.tsx';
import UserMenuContent from './user-menu-content.tsx';

export default function AppHeaderUser(): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();
  const menuAnchor = useRef<HTMLElement | null>(null);
  const menuState = useMenuState();
  const { isAuthenticated, isLoading, error, loginWithRedirect } = useAuth0();
  const showLoading = useDelay(false, isLoading, (value) => value ? 1000 : 0);
  const loginClick = useCallback(() => {
    void loginWithRedirect({ appState: { returnTo: `${window.location.pathname}${window.location.search}` } });
  }, [loginWithRedirect]);

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
          ref={menuAnchor}
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
        anchorEl={menuAnchor.current}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={(theme) => ({ transform: `translate(0, ${theme.spacing(1)})` })}
      >
        <UserMenuContent />
      </Menu>
    </>
  );
}
