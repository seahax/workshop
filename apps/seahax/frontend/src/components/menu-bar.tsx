import { AppBar, Box, ButtonGroup, Link, Toolbar, Typography } from '@mui/material';
import { IconBrandGithub, IconBrandLinkedin } from '@tabler/icons-react';
import { type JSX } from 'react';

import MenuBarIconLink from './menu-bar-icon-link.tsx';
import MenuBarUser from './menu-bar-user.tsx';

export default function MenuBar(): JSX.Element {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar sx={{ alignItems: 'stretch' }}>
          <Box sx={{ flexGrow: 1, mx: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              <Link href="/" color="textPrimary" underline="none">Seahax</Link>
            </Typography>
            <ButtonGroup>
              <MenuBarIconLink
                title="GitHub Repository"
                href="https://github.com/seahax/workshop/tree/main/apps/seahax"
              >
                <IconBrandGithub size={20} />
              </MenuBarIconLink>
              <MenuBarIconLink
                title="LinkedIn Profile"
                href="https://www.linkedin.com/in/ackermanchris/"
              >
                <IconBrandLinkedin size={20} />
              </MenuBarIconLink>
            </ButtonGroup>
            <MenuBarUser />
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
