import { useAuth0 } from '@auth0/auth0-react';
import { Logout } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  ClickAwayListener,
  Divider,
  Fade,
  IconButton,
  ListItemIcon,
  MenuItem,
  MenuList,
  Tooltip,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { type JSX, useCallback, useEffect, useRef } from 'react';

import { useBoolean } from '../hooks/use-boolean.ts';
import { useDelay } from '../hooks/use-delay.ts';

export default function AppHeaderUser(): JSX.Element {
  const { enqueueSnackbar } = useSnackbar();
  const menuAnchor = useRef<HTMLElement | null>(null);
  const { value: isMenuOpen, setFalse: closeMenu, toggle: toggleMenu } = useBoolean();
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
          <ClickAwayListener onClickAway={closeMenu}>
            <Tooltip
              open={isMenuOpen}
              onClick={closeMenu}
              placement="bottom-end"
              slots={{ transition: Fade }}
              disableInteractive={false}
              slotProps={{
                tooltip: {
                  sx: { padding: 0, maxWidth: '50ex', textOverflow: 'ellipsis' },
                },
              }}
              title={(
                <MenuList>
                  {user?.name && (
                    <>
                      <Box
                        component="div"
                        padding={(theme) => theme.spacing(0, 1.25)}
                        overflow="hidden"
                        whiteSpace="nowrap"
                      >
                        {user.name}
                      </Box>
                      <Divider sx={{ my: 0.75 }} />
                    </>
                  )}
                  <MenuItem onClick={logoutClick}>
                    <ListItemIcon>
                      <Logout fontSize="small" />
                    </ListItemIcon>
                    Logout
                  </MenuItem>
                </MenuList>
              )}
            >
              <IconButton
                size="small"
                aria-label="Current user avatar"
                aria-haspopup="true"
                color="primary"
                onClick={toggleMenu}
              >
                <Avatar src={user?.picture} sx={{ width: '2.125rem', height: '2.125rem' }} />
              </IconButton>
            </Tooltip>
          </ClickAwayListener>
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
    </>
  );
}
