import { Box, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { type JSX, type PropsWithChildren } from 'react';
import { Outlet } from 'react-router';

import AppBar from '../components/app-bar.tsx';
import AppFooter from '../components/app-footer.tsx';
import AppMain from '../components/app-main.tsx';
import AppTheme from '../components/app-theme.tsx';
import AuthProvider from '../components/auth-provider.tsx';
import { ScrollToTop } from '../components/scroll-to-top.tsx';

export default function Root({ children }: PropsWithChildren = {}): JSX.Element {
  return (
    <>
      <AuthProvider>
        <AppTheme>
          <CssBaseline>
            <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
              <Box display="flex" flexDirection="column">
                <AppMain>
                  <AppBar />
                  <Box
                    display="flex"
                    flexDirection="column"
                    gap={(theme) => ({ xs: theme.spacing(6), sm: theme.spacing(8) })}
                  >
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
