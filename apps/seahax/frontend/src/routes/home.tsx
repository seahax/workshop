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
import { IconBrandGolang, IconBrandNpm } from '@tabler/icons-react';
import { type JSX, useEffect, useRef } from 'react';

import { AppPage } from '../components/app-page.tsx';
import Canvas from '../components/canvas.tsx';
import ProjectBadge from '../components/project-badge.tsx';
import useDelay from '../hooks/use-delay.ts';
import { useDocumentVisible } from '../hooks/use-document-visible.ts';
import projects from '../services/projects.ts';
import HomeMdx from './home.mdx';
import defineRoute from './util/define-route.tsx';

export default defineRoute({
  Component: Home,
});

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
          <Canvas canvasRef={glimmerCanvas} position="absolute" top={0} width="100%" height="100%" maxHeight="100lvh" />
        </Fade>
      )}
      <AppPage zIndex={1}>
        <Container
          sx={(theme) => ({
            paddingBlock: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: theme.spacing(4),
          })}
        >
          <Typography variant="h1" marginBlockEnd={(theme) => theme.spacing(3)} sx={{ textAlign: 'center' }}>
            Hello, I&apos;m&nbsp;Chris.
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
        <Typography variant="h2">
          My Projects
        </Typography>
        <Box
          display="grid"
          gridTemplateColumns={'repeat(auto-fit, minmax(350px, 1fr))'}
          gridAutoRows="1fr"
          gap={(theme) => theme.spacing(4)}
        >
          {projects.map((project, i) => {
            return (
              <Card
                key={i}
                variant="outlined"
                sx={{
                  boxShadow: (theme) => theme.shadows[4],
                  transition: 'scale 0.25s, box-shadow 0.25s',
                  '&:hover': {
                    scale: 1.03,
                    boxShadow: (theme) => theme.shadows[8],
                  },
                }}
              >
                <CardActionArea
                  href={project.homepage}
                  target="_blank"
                  sx={{
                    minHeight: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                  }}
                >
                  <CardContent sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    flexGrow: 1,
                  }}
                  >
                    <Typography variant="h3" marginBlockEnd={1} display="flex" gap={1.5} alignItems="center">
                      <Box
                        component={project.type === 'go' ? IconBrandGolang : IconBrandNpm}
                        size="3rem"
                        strokeWidth={1.25}
                        aria-label={project.type === 'go' ? 'Go' : 'TypeScript/NPM'}
                      />
                      <Box component="span" marginBlockEnd={0.875}>{project.shortName}</Box>
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paddingInline={0.75}>
                      {project.description}
                    </Typography>
                    <Box
                      display="flex"
                      justifyContent="flex-end"
                      marginBlockStart={3}
                    >
                      <ProjectBadge projectName={project.name} type={project.type} />
                    </Box>
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
