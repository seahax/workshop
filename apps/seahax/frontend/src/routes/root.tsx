import { Box, CssBaseline, Fade, useScrollTrigger } from '@mui/material';
import { createGlimmer } from '@seahax/glimmer';
import { SnackbarProvider } from 'notistack';
import { type JSX, type PropsWithChildren, useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!canvas.current || !start) return;
    const context = canvas.current.getContext('2d')!;
    const glimmer = createGlimmer(context, { resizeCanvas: 'hidpi' });
    return () => glimmer.stop();
  }, [start]);

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
