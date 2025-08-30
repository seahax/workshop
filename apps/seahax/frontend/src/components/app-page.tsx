import { Box, type BoxProps } from '@mui/material';
import type { JSX } from 'react';

export function AppPage(props: BoxProps): JSX.Element {
  return (
    <Box
      height={(theme) => ({ xs: `calc(100vh - ${theme.spacing(6)})`, sm: `calc(100vh - ${theme.spacing(8)})` })}
      {...props}
    />
  );
}
