import { Box, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { type JSX, type PropsWithChildren } from 'react';
import { Outlet } from 'react-router';

import { AppFooter } from '../components/app-footer.tsx';
import AppHeader from '../components/app-header.tsx';
import AppMain from '../components/app-main.tsx';
import AppTheme from '../components/app-theme.tsx';
import AuthProvider from '../components/auth-provider.tsx';

// export default createRootRoute({ component: Root });

export default function Root({ children }: PropsWithChildren = {}): JSX.Element {
  return (
    <>
      <AuthProvider>
        <AppTheme>
          <CssBaseline>
            <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
              <Box minHeight="100vh" display="flex" flexDirection="column">
                <AppHeader />
                <AppMain>
                  <Outlet />
                  {children}
                </AppMain>
                <AppFooter />
              </Box>
            </SnackbarProvider>
          </CssBaseline>
        </AppTheme>
      </AuthProvider>
    </>
  );
}
