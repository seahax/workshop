import { AppBar, Box, Button, Link, Toolbar } from '@mui/material';
import { type JSX } from 'react';

import AppHeaderUser from './app-header-user.tsx';
import TextGradient from './text-gradient.tsx';

export default function AppHeader(): JSX.Element {
  return (
    <AppBar position="relative" sx={{ zIndex: 3 }}>
      <Toolbar sx={{ alignItems: 'stretch' }}>
        <Box sx={{ flexGrow: 1, mx: 'auto', display: 'flex', alignItems: 'center', gap: 2.25 }}>
          <Link href="/" flexGrow={1}>
            <TextGradient fontSize={24} fontWeight={600} fontFamily="'Rock Salt'">Seahax</TextGradient>
          </Link>
          <Button href="https://github.com/seahax" target="_blank">Projects</Button>
          <Button href="https://seahax.substack.com/" target="_blank">Blog</Button>
          <Button href="https://linkedin.com/in/ackermanchris" target="_blank">Experience</Button>
          <AppHeaderUser />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
