import { Box, Container, Divider, IconButton, Tooltip, Typography } from '@mui/material';
import { IconBrandGithub, IconBrandLinkedin, IconMail } from '@tabler/icons-react';
import type { JSX } from 'react';

import AppFooterMdx from './app-footer.mdx';
import { LinkExternal } from './link-external.tsx';

export default function AppFooter(): JSX.Element {
  return (
    <Container
      maxWidth="md"
      sx={(theme) => ({
        paddingBlock: theme.spacing(8),
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-evenly',
        alignItems: 'center',
        gap: { xs: theme.spacing(3), sm: 0 },
      })}
    >
      <Box
        display={{ xs: 'flex', sm: 'contents' }}
        flexDirection={'row'}
        justifyContent={'space-evenly'}
        alignContent={'center'}
        width={{ xs: '70%', sm: undefined }}
      >
        <Tooltip title="Send Me An Email" placement="top">
          <IconButton component={LinkExternal} href="mailto:chris@seahax.com">
            <IconMail size={32} />
          </IconButton>
        </Tooltip>
        <Tooltip title="LinkedIn Profile" placement="top">
          <IconButton component={LinkExternal} href="https://www.linkedin.com/in/ackermanchris/">
            <IconBrandLinkedin size={32} />
          </IconButton>
        </Tooltip>
        <Tooltip title="GitHub Repository" placement="top">
          <IconButton component={LinkExternal} href="https://github.com/seahax/workshop">
            <IconBrandGithub size={32} />
          </IconButton>
        </Tooltip>
      </Box>
      <Divider
        orientation="vertical"
        flexItem
        sx={{
          display: { xs: 'none', sm: 'block' },
          marginInline: (theme) => theme.spacing(2),
        }}
      />
      <Divider
        orientation="horizontal"
        sx={{
          display: { xs: 'block', sm: 'none' },
          width: '70%',
        }}
      />
      <Typography
        component={'div'}
        variant="body2"
        flexShrink={1}
        width={{ xs: '70%', sm: '60%' }}
        paddingInline={(theme) => ({ xs: undefined, sm: theme.spacing(1) })}
        paddingBlock={(theme) => ({ xs: theme.spacing(1), sm: 0 })}
        color="textSecondary"
        sx={{
          '& p': { margin: 0 },
        }}
      >
        <AppFooterMdx />
      </Typography>
    </Container>
  );
}
