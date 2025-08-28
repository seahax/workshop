import { useAuth0 } from '@auth0/auth0-react';
import { ListItem, ListItemIcon, MenuItem } from '@mui/material';
import { IconLogout } from '@tabler/icons-react';
import { type JSX, useCallback } from 'react';

export default function UserMenuContent(): JSX.Element {
  const { user, logout } = useAuth0();
  const logoutClick = useCallback(() => {
    void logout({ logoutParams: { returnTo: window.location.origin } });
  }, [logout]);

  return (
    <>
      {user?.name && (
        <>
          <ListItem
            // padding={(theme) => theme.spacing(0, 1.25, 0.75, 1.25)}
            // overflow="hidden"
            // whiteSpace="nowrap"
            sx={(theme) => ({
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              color: theme.palette.text.disabled,
              ...theme.typography.caption,
            })}
          >
            {user.name}
          </ListItem>
        </>
      )}
      <MenuItem onClick={logoutClick}>
        <ListItemIcon>
          <IconLogout size={20} />
        </ListItemIcon>
        Logout
      </MenuItem>
    </>
  );
}
