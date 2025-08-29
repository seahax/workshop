import { Box, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { type JSX, type PropsWithChildren } from 'react';
import { Outlet } from 'react-router';

import { AppFooter } from '../components/app-footer.tsx';
import AppHeader from '../components/app-header.tsx';
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
              <Box minHeight="100vh" display="flex" flexDirection="column" position="relative" zIndex={0}>
                <AppHeader />
                <AppMain>
                  <Outlet />
                  {children}
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
