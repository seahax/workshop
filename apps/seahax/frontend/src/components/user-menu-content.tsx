import { useAuth0 } from '@auth0/auth0-react';
import { Box, ListItem, ListItemIcon, MenuItem } from '@mui/material';
import { IconLogout } from '@tabler/icons-react';
import { type JSX, useCallback } from 'react';

import UserAvatar from './user-avatar.tsx';

interface Props {
  readonly showAvatar?: boolean;
}

export default function UserMenuContent({ showAvatar }: Props = {}): JSX.Element {
  const { user, logout } = useAuth0();
  const logoutClick = useCallback(() => {
    void logout({ logoutParams: { returnTo: window.location.origin } });
  }, [logout]);

  return (
    <>
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
            {showAvatar && <Box><UserAvatar /></Box>}
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
    </>
  );
}
