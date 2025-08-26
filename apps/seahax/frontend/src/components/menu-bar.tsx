import { AppBar, Box, Link, Toolbar, Typography } from '@mui/material';
import { type JSX } from 'react';

import MenuUser from './menu-user.tsx';

export default function MenuBar(): JSX.Element {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Link href="/" color="textPrimary" underline="none">Seahax</Link>
          </Typography>
          <MenuUser />
        </Toolbar>
      </AppBar>
    </Box>
  );
}
