import { Box } from '@mui/material';
import { type JSX, type PropsWithChildren } from 'react';

export default function AppMain({ children }: PropsWithChildren = {}): JSX.Element {
  return (
    <Box
      position="relative"
      zIndex={0}
      minHeight="100lvh"
      paddingBlockEnd={{ xs: 12, sm: 16 }}
      flexGrow={1}
      display="flex"
      flexDirection="column"
      boxShadow={(theme) => theme.shadows[4]}
      sx={(theme) => {
        const { background } = theme.palette;
        const light = theme.lighten(background.paper, 0.075);
        const dark = theme.darken(background.default, 0.475);

        return ({
          backgroundColor: dark,
          backgroundImage: `
          linear-gradient(to bottom, transparent, 60%, ${dark}),
          radial-gradient(farthest-corner circle at 10% 0%, ${light}, ${dark} 95%)
          `,
          backgroundAttachment: 'fixed',
        });
      }}
    >
      {children}
    </Box>
  );
}
