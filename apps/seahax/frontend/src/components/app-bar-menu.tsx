import { Box, Button } from '@mui/material';
import type { JSX } from 'react';

import AppBarUser from './app-bar-user.tsx';

export default function AppBarNav(): JSX.Element {
  return (
    <Box
      gap={(theme) => theme.spacing(2)}
      alignItems="center"
      height="100%"
      sx={{ display: { xs: 'none', sm: 'flex' } }}
    >
      <Box gap={(theme) => theme.spacing(1)} display="flex">
        <Button href="https://github.com/seahax" target="_blank">Projects</Button>
        <Button href="https://seahax.substack.com/" target="_blank">Blog</Button>
        <Button href="https://linkedin.com/in/ackermanchris" target="_blank">Experience</Button>
      </Box>
      <AppBarUser />
    </Box>
  );
}
