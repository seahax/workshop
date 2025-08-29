import { Box, Container, Link, Typography } from '@mui/material';
import { IconHandStop } from '@tabler/icons-react';
import type { JSX } from 'react';

import { animation } from '../components/app-theme.tsx';
import Markdown from '../components/markdown.tsx';
import TextDefinition from '../components/text-definition.tsx';
import content from './index.md?raw';
import defineRoute from './util/define-route.tsx';

export default defineRoute({
  Component: Index,
});

// TODO: Generate a list of packages in this repo for the Projects section.
// TODO: Use the Substack RSS feed to list blog posts.
// TODO: Use the LinkedIn API to list work experience.

function Index(): JSX.Element {
  return (
    <Container sx={{ pt: 10, pb: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '3rem' }}>
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
  );
}
