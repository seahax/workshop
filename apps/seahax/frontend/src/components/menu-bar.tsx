import { AppBar, Box, ButtonGroup, Link, Toolbar, Typography } from '@mui/material';
import { IconBrandGithub, IconBrandLinkedin, IconMail } from '@tabler/icons-react';
import { type JSX } from 'react';

import MenuBarIconLink from './menu-bar-icon-link.tsx';
import MenuBarUser from './menu-bar-user.tsx';

export default function MenuBar(): JSX.Element {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar sx={{ alignItems: 'stretch' }}>
          <Box sx={{ flexGrow: 1, mx: 'auto', display: 'flex', alignItems: 'center', gap: 2.25 }}>
            <Box
              position="relative"
              sx={{
                flexGrow: 1,
              }}
            >
              <Typography
                variant="h5"
                component="div"
                position="absolute"
                zIndex={0}
                top={0}
                left={0}
                fontFamily="Rock Salt"
                paddingInline={1}
                fontWeight={700}
                sx={(theme) => ({
                  textShadow: `0 2px 4px ${theme.palette.background.default}`,
                  color: theme.palette.background.default,
                })}
              >
                Seahax
              </Typography>
              <Link
                variant="h5"
                underline="none"
                href="/"
                position="relative"
                zIndex={1}
                fontFamily="Rock Salt"
                paddingInline={1}
                color="transparent"
                fontWeight={700}
                sx={{
                  background: `linear-gradient(darkblue -10%, skyblue 45%, gold 60%, orange 63%, coral 67%, salmon 70%) text`,
                  backgroundClip: 'text',
                }}
              >
                Seahax
              </Link>
            </Box>
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
              <MenuBarIconLink
                title="Send Me A Message"
                href="mailto:chris@seahax.com"
              >
                <IconMail size={20} />
              </MenuBarIconLink>
            </ButtonGroup>
            <MenuBarUser />
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
