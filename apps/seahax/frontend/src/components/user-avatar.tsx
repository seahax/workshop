import { useAuth0 } from '@auth0/auth0-react';
import { Avatar } from '@mui/material';
import type { JSX } from 'react';

export default function UserAvatar(): JSX.Element {
  const { user } = useAuth0();

  return <Avatar src={user?.picture} sx={{ width: '2.125rem', height: '2.125rem' }} />;
}
