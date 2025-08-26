import { useAuth0 } from '@auth0/auth0-react';
import { Logout } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Fade,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { type JSX, useCallback, useEffect, useRef } from 'react';

import { useBoolean } from '../hooks/use-boolean.ts';
import { useDelay } from '../hooks/use-delay.ts';

export default function MenuUser(): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();
  const menuAnchor = useRef<HTMLElement | null>(null);
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
      {isAuthenticated && !showLoading && (
        <Box
          height="100%"
          display="flex"
          alignItems="center"
          ref={menuAnchor}
        >
          <IconButton
            size="medium"
            aria-label="Current user avatar"
            aria-controls="account-menu"
            aria-haspopup="true"
            onClick={showLoading ? undefined : openMenu}
          >
            <Avatar
              src={user?.picture}
              sx={(theme) => ({
                width: '2rem',
                height: '2rem',
                alignContent: 'stretch',
                color: theme.palette.background.default,
                backgroundColor: theme.palette.text.primary,
                cursor: 'pointer',
              })}
            />
          </IconButton>
        </Box>
      )}
      {isAuthenticated && showLoading && (
        <Fade in timeout={1000}>
          <CircularProgress
            size="3rem"
            sx={{
              p: '0.5rem',
            }}
          />
        </Fade>
      )}
      {(!isAuthenticated && !isLoading) && (
        <Button color="inherit" variant="outlined" onClick={loginClick}>Login</Button>
      )}
      <Menu
        id="account-menu"
        keepMounted
        anchorEl={menuAnchor.current}
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
        slots={{
          transition: Fade,
        }}
        slotProps={{
          list: {
            dense: true,
          },
          paper: {
            elevation: 3,
            sx: {
              borderStartStartRadius: 0,
              borderStartEndRadius: 0,
            },
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
