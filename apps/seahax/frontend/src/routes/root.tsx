import { Box, CssBaseline, Fade, useScrollTrigger } from '@mui/material';
import { createGlimmer, type Glimmer } from '@seahax/glimmer';
import { SnackbarProvider } from 'notistack';
import { type JSX, type PropsWithChildren, useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router';

import AppBar from '../components/app-bar.tsx';
import { AppFooter } from '../components/app-footer.tsx';
import AppMain from '../components/app-main.tsx';
import AppTheme from '../components/app-theme.tsx';
import AuthProvider from '../components/auth-provider.tsx';
import { ScrollToTop } from '../components/scroll-to-top.tsx';
import useDelay from '../hooks/use-delay.ts';

export default function Root({ children }: PropsWithChildren = {}): JSX.Element {
  const canvas = useRef<HTMLCanvasElement>(null);
  const showGlimmer = !useScrollTrigger({ disableHysteresis: true, threshold: 100 });
  const start = useDelay(showGlimmer, showGlimmer, (value) => value ? 0 : 1000);
  const [glimmer, setGlimmer] = useState<Glimmer | undefined>();

  useEffect(() => {
    const context = canvas.current!.getContext('2d')!;
    const glimmer = createGlimmer(context, { resizeCanvas: 'hidpi' });
    setGlimmer(glimmer);
  }, []);

  useEffect(() => {
    console.log(glimmer, start);
    if (!glimmer || !start) return;
    glimmer.start();
    return () => glimmer.stop();
  }, [glimmer, start]);

  return (
    <>
      <AuthProvider>
        <AppTheme>
          <CssBaseline>
            <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
              <Box display="flex" flexDirection="column">
                <AppMain>
                  <Fade in={showGlimmer} appear={false} timeout={1000}>
                    <Box
                      ref={canvas}
                      component={'canvas'}
                      position="absolute"
                      width="100vw"
                      height="100vh"
                    />
                  </Fade>
                  <AppBar />
                  <Box zIndex={0}>
                    <Outlet />
                    {children}
                  </Box>
                </AppMain>
                <AppFooter />
              </Box>
              <ScrollToTop />
            </SnackbarProvider>
          </CssBaseline>
        </AppTheme>
      </AuthProvider>
    </>
  );
}
