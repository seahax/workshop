import { Box } from '@mui/material';
import { type JSX, type PropsWithChildren } from 'react';

export default function AppMain({ children }: PropsWithChildren = {}): JSX.Element {
  return (
    <Box
      zIndex={0}
      minHeight="100vh"
      flexGrow={1}
      display="flex"
      flexDirection="column"
      boxShadow={(theme) => theme.shadows[4]}
      sx={(theme) => ({
        backgroundColor: theme.palette.background.default,
        backgroundImage: `linear-gradient(to bottom, transparent 20%, ${
          theme.alpha(theme.darken(theme.palette.background.default, 0.475), 0.8)
        }),radial-gradient(farthest-corner circle at 10% 0%, ${
          theme.lighten(theme.palette.background.paper, 0.075)
        }, ${
          theme.darken(theme.palette.background.default, 0.475)
        } 95%)`,
        backgroundAttachment: 'fixed',
      })}
    >
      {children}
    </Box>
  );
}
