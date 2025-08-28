import { Box, Tooltip } from '@mui/material';
import type { JSX } from 'react';

interface Props {
  readonly term: string;
  readonly definition: string;
};

export default function TextDefinition({ term, definition }: Props): JSX.Element {
  return (
    <Tooltip title={definition}>
      <Box
        component="span"
        tabIndex={0}
        sx={(theme) => ({ textDecoration: `underline 3px dotted ${theme.palette.primary.main}` })}
      >
        {term}
      </Box>
    </Tooltip>
  );
}
