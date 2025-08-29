import { Box, Tooltip } from '@mui/material';
import { type JSX } from 'react';

interface Props {
  readonly term: string;
  readonly definition: string;
};

export default function TextDefinition({ term, definition }: Props): JSX.Element {
  return (
    <Tooltip title={definition} enterTouchDelay={350} leaveTouchDelay={2000}>
      <Box
        component="span"
        tabIndex={0}
        borderBottom={(theme) => `3px dotted ${theme.palette.primary.main}`}
        marginBottom="-4px"
      >
        {term}
      </Box>
    </Tooltip>
  );
}
