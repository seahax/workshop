import { createTheme, keyframes, ThemeProvider } from '@mui/material';
import type { JSX, PropsWithChildren } from 'react';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#83B3FB',
    },
    secondary: {
      main: '#FA8072',
    },
    background: {
      default: 'hsla(216, 40%, 13%, 1.00)',
      paper: 'hsla(216, 40%, 18%, 1.00)',
    },
  },
  typography: {
    fontFamily: '"Fredoka Variable", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        body: {
          backgroundColor: theme.darken(theme.palette.background.default, 0.45),
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
