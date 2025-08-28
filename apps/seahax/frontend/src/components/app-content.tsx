import { Box, Container, Link, Typography } from '@mui/material';
import { IconHandStop } from '@tabler/icons-react';
import { type JSX } from 'react';

import content from './app-content.md?raw';
import { animation } from './app-theme.tsx';
import { Markdown } from './markdown.tsx';
import TextDefinition from './text-definition.tsx';

export default function AppContent(): JSX.Element {
  return (
    <Box
      flexGrow={1}
      boxShadow={(theme) => theme.shadows[4]}
      color={(theme) => theme.palette.text.primary}
      position="relative"
      zIndex={2}
      display="flex"
      sx={(theme) => ({
        minHeight: `calc(100vh - ${theme.spacing(8)})`,
        [theme.breakpoints.down('sm')]: {
          minHeight: `calc(100vh - ${theme.spacing(7)})`,
        },
        background: `radial-gradient(farthest-corner circle at 10% 0%, ${
          theme.lighten(theme.palette.background.paper, 0.075)
        }, ${
          theme.darken(theme.palette.background.default, 0.5)
        }) fixed`,
      })}
    >
      <Container
        maxWidth="md"
        sx={{
          pt: 10,
          pb: 16,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '3rem',
        }}
      >
        <Typography
          variant="h2"
          component="h1"
          marginBottom="1.5rem"
          sx={(theme) => ({ textAlign: 'center', color: theme.palette.secondary.main })}
        >
          {"Hello, I'm Chris. "}
          <Box component="span" sx={{ display: 'inline-block', transform: 'translate(0px, 0.5rem)' }}>
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                transform: 'rotate(20deg)',
                animation: `${animation.wave} 0.5s 6 alternate ease-in-out`,
              }}
            >
              <IconHandStop size="4rem" stroke="1px" />
            </Box>
          </Box>
        </Typography>
        <Markdown
          value={content}
          jsx={{ TextDefinition, Link }}
          display="flex"
          flexDirection="column"
          gap="3rem"
          sx={{
            '& p': {
              fontSize: '1.25rem',
              margin: 0,
            },
          }}
        />
      </Container>
    </Box>
  );
}
