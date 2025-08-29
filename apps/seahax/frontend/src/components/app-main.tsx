import { Box } from '@mui/material';
import { type JSX, type PropsWithChildren } from 'react';

export default function AppMain({ children }: PropsWithChildren = {}): JSX.Element {
  return (
    <Box
      flexGrow={1}
      boxShadow={(theme) => theme.shadows[4]}
      color={(theme) => theme.palette.text.primary}
      position="relative"
      zIndex={2}
      display="flex"
      sx={(theme) => ({
        minHeight: `calc(100vh - ${theme.spacing(8)})`,
        [theme.breakpoints.down('sm')]: {
          minHeight: `calc(100vh - ${theme.spacing(7)})`,
        },
        background: `radial-gradient(farthest-corner circle at 10% 0%, ${
          theme.lighten(theme.palette.background.paper, 0.075)
        }, ${
          theme.darken(theme.palette.background.default, 0.5)
        }) fixed`,
      })}
    >
      {children}
    </Box>
  );
}
