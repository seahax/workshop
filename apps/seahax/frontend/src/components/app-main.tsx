import { Box } from '@mui/material';
import { type JSX, type PropsWithChildren } from 'react';

export default function AppMain({ children }: PropsWithChildren = {}): JSX.Element {
  return (
    <Box
      minHeight="100vh"
      flexGrow={1}
      display="flex"
      flexDirection="column"
      boxShadow={(theme) => theme.shadows[4]}
      sx={(theme) => ({
        background: `${theme.palette.background.default} radial-gradient(farthest-corner circle at 10% 0%, ${
          theme.lighten(theme.palette.background.paper, 0.075)
        }, ${
          theme.darken(theme.palette.background.default, 0.475)
        } 95%) fixed`,
      })}
    >
      {children}
    </Box>
  );
}
