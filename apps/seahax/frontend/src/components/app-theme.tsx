import { createTheme, keyframes, ThemeProvider } from '@mui/material';
import type { JSX, PropsWithChildren } from 'react';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: 'hsla(216, 94%, 75%, 1.00)',
    },
    secondary: {
      main: 'hsla(6, 93%, 71%, 1.00)',
    },
    background: {
      default: 'hsla(216, 40%, 13%, 1.00)',
      paper: 'hsla(216, 40%, 18%, 1.00)',
    },
  },
  typography: (color) => ({
    fontFamily: '"Fredoka Variable", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Walter Turncoat", "Helvetica", "Arial", sans-serif',
      fontSize: '3.25rem',
      color: color.secondary.main,
    },
    h2: {
      fontFamily: '"Walter Turncoat", "Helvetica", "Arial", sans-serif',
      fontSize: '2.125rem',
      color: color.secondary.main,
    },
    h3: {
      fontSize: '1.75rem',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.0rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 600,
    },
  }),
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        html: {
          scrollBehavior: 'smooth',
        },
        body: {
          backgroundColor: theme.darken(theme.palette.background.default, 0.45),
        },
        ':target': {
          scrollMarginTop: '5rem',
        },
      }),
    },
    MuiContainer: {
      styleOverrides: {
        root: ({ theme }) => ({
          // paddingInline: `${theme.spacing(5)} !important`,
          [theme.breakpoints.down('lg')]: {
            paddingInline: theme.spacing(5),
          },
        }),
      },
      defaultProps: {
        maxWidth: 'md',
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderWidth: '2px',
          minWidth: theme.spacing(6),
        }),
      },
    },
    MuiIconButton: {
      defaultProps: {
        color: 'primary',
      },
    },
    MuiTooltip: {
      styleOverrides: {
        arrow: ({ theme }) => ({
          color: theme.lighten(theme.palette.background.paper, 0.15),
        }),
        tooltip: ({ theme }) => ({
          maxWidth: '36ex',
          backgroundColor: theme.lighten(theme.palette.background.paper, 0.15),
          boxShadow: theme.shadows[8],
          padding: theme.spacing(0.75, 1.25),
          ...theme.typography.body2,
        }),
      },
      defaultProps: {
        arrow: true,
        enterDelay: 750,
        disableInteractive: true,
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.primary.main,
        }),
      },
    },
    MuiList: {
      styleOverrides: {
        root: ({ dense, ownerState }) => ({
          paddingBlock: '6px',
          minWidth: dense ?? ownerState.dense ? '125px' : '150px',
        }),
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: ({ theme, dense, ownerState }) => ({
          paddingInline: theme.spacing(dense ?? ownerState.dense ? 2.5 : 3),
          paddingBlock: theme.spacing(0.75),
          minHeight: theme.spacing(dense ?? ownerState.dense ? '32px' : '44px'),
          ...theme.typography.body1,
        }),
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: theme.lighten(theme.palette.background.paper, 0.05),
        }),
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: ({ theme, dense, ownerState }) => ({
          paddingInline: theme.spacing(dense ?? ownerState.dense ? 2.5 : 3),
          paddingBlock: theme.spacing(0.75),
          minHeight: theme.spacing(dense ?? ownerState.dense ? '32px' : '44px'),
          ...theme.typography.body1,
        }),
      },
    },
  },
});

export default function AppTheme({ children }: PropsWithChildren): JSX.Element {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

export const animation = {
  wave: keyframes`
    0% {
      transform: rotate(20deg);
    }
    100% {
      transform: rotate(45deg);
    }
  `,
} as const;
