import { Box, Container, Typography } from '@mui/material';
import { IconHandStop } from '@tabler/icons-react';
import type { JSX } from 'react';

import { AppPage } from '../components/app-page.tsx';
import { animation } from '../components/app-theme.tsx';
import { LinkExternal } from '../components/link-external.tsx';
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
    <AppPage>
      <Container
        sx={(theme) => ({
          pt: 4,
          pb: 18,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: theme.spacing(4),
        })}
      >
        <Typography
          variant="h2"
          component="h1"
          marginBlock={(theme) => theme.spacing(3)}
          sx={(theme) => ({ textAlign: 'center', color: theme.palette.secondary.main })}
        >
          Hello, I&apos;m&nbsp;Chris.
          {' '}
          <Box
            component="span"
            sx={(theme) => ({ display: 'inline-block', transform: `translate(0px, ${theme.spacing(1)})` })}
          >
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
          jsx={{ d: TextDefinition, a: LinkExternal }}
          display="contents"
          flexDirection="column"
          sx={{
            '& p': {
              fontSize: '1.25rem',
              margin: 0,
            },
          }}
        />
      </Container>
    </AppPage>
  );
}
