/* eslint-disable @stylistic/jsx-curly-brace-presence */
import { Box, Container, createTheme, CssBaseline, keyframes, Link, ThemeProvider, Typography } from '@mui/material';
import { IconHandStop } from '@tabler/icons-react';
import { SnackbarProvider } from 'notistack';
import { type JSX, StrictMode } from 'react';

import AuthProvider from './auth-provider.tsx';
import { Defined } from './defined.tsx';
import MenuBar from './menu-bar.tsx';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
  components: {
    MuiTooltip: {
      styleOverrides: {
        arrow: ({ theme }) => ({ color: theme.palette.grey[800] }),
        tooltip: ({ theme }) => ({ backgroundColor: theme.palette.grey[800], maxWidth: '36ex' }),
      },
      defaultProps: {
        arrow: true,
        enterDelay: 750,
        disableInteractive: true,
      },
    },
  },
});

const wave = keyframes`
  0% {
    transform: rotate(20deg);
  }
  100% {
    transform: rotate(45deg);
  }
`;

export default function App(): JSX.Element {
  return (
    <StrictMode>
      <AuthProvider>
        <ThemeProvider theme={darkTheme}>
          <CssBaseline>
            <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
              <MenuBar />
              <Container maxWidth="md" sx={{ py: 10, display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                <Typography
                  variant="h2"
                  component="h1"
                  marginBottom="1.5rem"
                  color="lightcoral"
                  sx={{ textAlign: 'center' }}
                >
                  {"Hello, I'm Chris. "}
                  <Box component="span" sx={{ display: 'inline-block', transform: 'translate(0px, 0.5rem)' }}>
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-block',
                        transform: 'rotate(20deg)',
                        animation: `${wave} 0.5s 6 alternate ease-in-out`,
                      }}
                    >
                      <IconHandStop size="4rem" stroke="1px" />
                    </Box>
                  </Box>
                </Typography>
                <Typography component="p" sx={{ fontSize: '1.25em' }}>
                  {`I've been a software engineer for over 20 years. Mostly, I do web development. Some frontend, some
                  backend, some design, and a lot of architecture. I consider myself a code `}
                  <Defined
                    text="craftsman"
                    definition={`A person who practices in a trade or handicraft, focusing on skillful execution of a
                      technique in order to achieve high quality results.`}
                  />
                  {`. Slow and steady (and good design) wins the race!`}
                </Typography>
                <Typography component="p" sx={{ fontSize: '1.25em' }}>
                  {`Seahax is my little hack space. So named because I live in Seattle, love the sea, and this is not
                  work. Everything I make here is for fun, and a little bit for my mental health. If it's published,
                  then it's under the `}
                  <Link href="https://unlicense.org" target="_blank" rel="noopener noreferrer">
                    Unlicense
                  </Link>
                  {`. Anything else might make it work! Feel free to use it in anyway you want. Reach out if you have
                  questions or want to discuss something you see here or in the repo.`}
                </Typography>
              </Container>
            </SnackbarProvider>
          </CssBaseline>
        </ThemeProvider>
      </AuthProvider>
    </StrictMode>
  );
}
