import { Box, Button } from '@mui/material';
import type { JSX } from 'react';

import AppHeaderUser from './app-header-user.tsx';

export default function AppHeaderNav(): JSX.Element {
  return (
    <Box
      gap={(theme) => theme.spacing(1)}
      flexShrink={0}
      alignItems="center"
      height="100%"
      sx={{ display: { xs: 'none', sm: 'flex' } }}
    >
      <Button href="https://github.com/seahax" target="_blank">Projects</Button>
      <Button href="https://seahax.substack.com/" target="_blank">Blog</Button>
      <Button href="https://linkedin.com/in/ackermanchris" target="_blank">Experience</Button>
      <AppHeaderUser />
    </Box>
  );
}
