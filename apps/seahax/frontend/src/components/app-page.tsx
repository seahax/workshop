import { Box, type BoxProps } from '@mui/material';
import type { JSX } from 'react';

export function AppPage(props: BoxProps): JSX.Element {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      minHeight={(theme) => ({
        xs: `calc(100lvh - ${theme.spacing(6)})`,
        sm: `calc(100lvh - ${theme.spacing(8)})`,
      })}
      paddingBlockEnd={(theme) => ({
        xs: theme.spacing(6),
        sm: theme.spacing(8),
      })}
      {...props}
    />
  );
}
