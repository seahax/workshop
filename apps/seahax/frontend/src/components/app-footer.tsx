import { AppBar, Container, IconButton, Tooltip } from '@mui/material';
import { IconBrandGithub, IconBrandLinkedin, IconMail } from '@tabler/icons-react';
import type { JSX } from 'react';

export function AppFooter(): JSX.Element {
  return (
    <AppBar
      position="relative"
      sx={(theme) => ({
        zIndex: 1,
        backgroundColor: theme.darken(theme.palette.background.default, 0.4),
        paddingBlock: theme.spacing(8),
      })}
    >
      <Container
        maxWidth="md"
        sx={(theme) => ({
          display: 'flex',
          justifyContent: 'center',
          gap: theme.spacing(2),
        })}
      >
        <Tooltip title="Send Me An Email" placement="top">
          <IconButton href="mailto:chris@seahax.com" target="_blank">
            <IconMail size={32} />
          </IconButton>
        </Tooltip>
        <Tooltip title="LinkedIn Profile" placement="top">
          <IconButton href="https://www.linkedin.com/in/ackermanchris/" target="_blank">
            <IconBrandLinkedin size={32} />
          </IconButton>
        </Tooltip>
        <Tooltip title="GitHub Repository" placement="top">
          <IconButton href="https://github.com/seahax/workshop/tree/main/apps/seahax" target="_blank">
            <IconBrandGithub size={32} />
          </IconButton>
        </Tooltip>
      </Container>
    </AppBar>
  );
}
