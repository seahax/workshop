import { Box, Button } from '@mui/material';
import type { JSX } from 'react';
import { useNavigate } from 'react-router';

import AppBarUser from './app-bar-user.tsx';

export default function AppBarNav(): JSX.Element {
  const navigate = useNavigate();

  return (
    <Box
      gap={(theme) => theme.spacing(2)}
      alignItems="center"
      height="100%"
      display="flex"
    >
      <Box gap={(theme) => theme.spacing(1)} sx={{ display: { xs: 'none', sm: 'flex' } }}>
        <Button href="/#projects" onClick={() => void navigate('/#projects')}>Projects</Button>
        <Button href="https://musings.seahax.com/" target="_blank">Musings</Button>
      </Box>
      <AppBarUser />
    </Box>
  );
}
