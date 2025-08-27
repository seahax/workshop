import { Box, Tooltip } from '@mui/material';
import type { JSX } from 'react';

interface Props {
  readonly text: string;
  readonly definition: string;
};

export function Defined({ text, definition }: Props): JSX.Element {
  return (
    <Tooltip title={definition}>
      <Box
        component="span"
        sx={(theme) => ({
          textDecoration: `underline 3px dotted ${theme.palette.primary.main}`,
        })}
      >
        {text}
      </Box>
    </Tooltip>
  );
}
