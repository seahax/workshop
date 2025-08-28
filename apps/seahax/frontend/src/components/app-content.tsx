import { Box, Container, Link, Typography } from '@mui/material';
import { IconHandStop } from '@tabler/icons-react';
import type { JSX } from 'react';

import { animation } from './app-theme.tsx';
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
        <Typography component="p" sx={{ fontSize: '1.25em' }}>
          {`I've been a software engineer for over 20 years. Mostly, I do web development. Some frontend, some backend,
          some design, and a lot of architecture. I consider myself a code `}
          <TextDefinition
            text="craftsman"
            definition={`A person who practices a trade or handicraft, focusing on skillful execution of a technique in
              order to achieve high quality results.`}
          />
          . Slow and steady (and good design) wins the race!
        </Typography>
        <Typography component="p" sx={{ fontSize: '1.25em' }}>
          {`Seahax is my little hack space. So named because I live in Seattle, love the sea, and this is not work.
          Everything I make here is for fun, and a little bit for my mental health. If it's published, then it's under
          the `}
          <Link href="https://unlicense.org" target="_blank">Unlicense</Link>
          {`. Anything else might make it work! Feel free to use it in anyway you want. Reach out if you have questions
          or want to discuss something you see here or in the repo.`}
        </Typography>
      </Container>
    </Box>
  );
}
