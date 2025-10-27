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
      sx={{ display: { xs: 'none', sm: 'flex' } }}
    >
      <Box gap={(theme) => theme.spacing(1)} display="flex">
        <Button href="/#projects" onClick={() => void navigate('/#projects')}>Projects</Button>
        {/* TODO: Add the Musings button when the Obsidian proxy is ready. */}
        {/* <Button href="/musings">Musings</Button> */}
      </Box>
      <AppBarUser />
    </Box>
  );
}
