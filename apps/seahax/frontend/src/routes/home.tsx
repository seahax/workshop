import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Fade,
  Typography,
  useMediaQuery,
  useScrollTrigger,
} from '@mui/material';
import { createDefaultRenderer, createGlimmer } from '@seahax/glimmer';
import { IconHandStop } from '@tabler/icons-react';
import { type JSX, useEffect, useRef } from 'react';

import { AppPage } from '../components/app-page.tsx';
import { animation } from '../components/app-theme.tsx';
import Canvas from '../components/canvas.tsx';
import projects from '../data/projects.data.ts';
import useDelay from '../hooks/use-delay.ts';
import { useDocumentVisible } from '../hooks/use-document-visible.ts';
import HomeMdx from './home.mdx';
import defineRoute from './util/define-route.tsx';

export default defineRoute({
  Component: Home,
});

// TODO: Use the Substack RSS feed to list blog posts.
// TODO: Use the LinkedIn API to list work experience.

function Home(): JSX.Element {
  const glimmerCanvas = useRef<HTMLCanvasElement>(null);
  const glimmerDocumentVisible = useDocumentVisible();
  const glimmerMediaQuery = useMediaQuery((theme) => theme.breakpoints.up('sm'));
  const glimmerScrollTrigger = !useScrollTrigger({ disableHysteresis: true, threshold: 100 });
  const glimmerVisible = useDelay(glimmerScrollTrigger, glimmerScrollTrigger, (value) => value ? 0 : 1000);

  useEffect(() => {
    if (!glimmerCanvas.current || !glimmerDocumentVisible || !glimmerMediaQuery || !glimmerVisible) return;
    const context = glimmerCanvas.current.getContext('2d')!;
    const glimmer = createGlimmer(context, {
      count: 750,
      resizeCanvas: 'hidpi',
      renderer: createDefaultRenderer({
        saturation: 65,
        lightness: 55,
        linkWidth: 0.5,
      }),
    });
    return () => glimmer.stop();
  }, [glimmerDocumentVisible, glimmerMediaQuery, glimmerVisible]);

  return (
    <>
      {glimmerDocumentVisible && glimmerMediaQuery && (
        <Fade in={glimmerScrollTrigger} appear={false} timeout={1000}>
          <Canvas canvasRef={glimmerCanvas} position="absolute" top={0} width="100%" height="100%" maxHeight="100vh" />
        </Fade>
      )}
      <AppPage zIndex={1}>
        <Container
          sx={(theme) => ({
            pt: 4,
            pb: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: theme.spacing(4),
          })}
        >
          <Typography
            variant="h2"
            component="h1"
            marginBlockEnd={(theme) => theme.spacing(3)}
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
          <Box
            display={'contents'}
            sx={{
              '& p': {
                fontSize: '1.25rem',
                fontWeight: 300,
                margin: 0,
              },
            }}
          >
            <HomeMdx />
          </Box>
        </Container>
      </AppPage>
      <Container id="projects" sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Typography variant="h4" component="h2" color="secondary">
          My Projects
        </Typography>
        <Box
          display="grid"
          gridTemplateColumns={'repeat(auto-fit, minmax(350px, 1fr))'}
          gridAutoRows="1fr"
          gap={(theme) => theme.spacing(3)}
        >
          {projects.map((project, i) => {
            return (
              <Card key={i} variant="outlined" sx={{ boxShadow: (theme) => theme.shadows[4] }}>
                <CardActionArea href={project.homepage} target="_blank" sx={{ minHeight: '100%' }}>
                  <CardContent>
                    <Typography variant="h5" gutterBottom component="div">
                      {project.name.replace(/^.*\//u, '')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">{project.description}</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
      </Container>
    </>
  );
}
