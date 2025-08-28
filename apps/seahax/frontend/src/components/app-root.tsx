import { Box, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { type JSX, StrictMode } from 'react';

import AppContent from './app-content.tsx';
import { AppFooter } from './app-footer.tsx';
import AppHeader from './app-header.tsx';
import AppTheme from './app-theme.tsx';
import AuthProvider from './auth-provider.tsx';

export default function AppRoot(): JSX.Element {
  return (
    <StrictMode>
      <AuthProvider>
        <AppTheme>
          <CssBaseline>
            <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
              <Box minHeight="100vh" display="flex" flexDirection="column">
                <AppHeader />
                <AppContent />
                <AppFooter />
              </Box>
            </SnackbarProvider>
          </CssBaseline>
        </AppTheme>
      </AuthProvider>
    </StrictMode>
  );
}
