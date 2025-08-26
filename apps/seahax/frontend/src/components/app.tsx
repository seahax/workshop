import { Container, createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { type JSX, StrictMode } from 'react';

import AuthProvider from './auth-provider.tsx';
import MenuBar from './menu-bar.tsx';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export default function App(): JSX.Element {
  return (
    <StrictMode>
      <AuthProvider>
        <ThemeProvider theme={darkTheme}>
          <CssBaseline>
            <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
              <MenuBar />
              <Container maxWidth="md" sx={{ py: 3 }}>Hello, Seahax!</Container>
            </SnackbarProvider>
          </CssBaseline>
        </ThemeProvider>
      </AuthProvider>
    </StrictMode>
  );
}
