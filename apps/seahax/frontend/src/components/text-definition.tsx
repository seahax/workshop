import { Box, Tooltip } from '@mui/material';
import { type JSX, type TouchEventHandler, useCallback } from 'react';

import useBoolean from '../hooks/use-boolean.ts';

interface Props {
  readonly term: string;
  readonly definition: string;
};

export default function TextDefinition({ term, definition }: Props): JSX.Element {
  const { value: isFocused, setTrue: focus, setFalse: blur } = useBoolean();
  const onTouchEnd = useCallback<TouchEventHandler<HTMLSpanElement>>((event) => {
    event.currentTarget.focus();
  }, []);

  return (
    <Tooltip title={definition} open={isFocused || undefined} disableHoverListener={isFocused} disableTouchListener>
      <Box
        component="span"
        tabIndex={0}
        borderBottom={(theme) => `3px dotted ${theme.palette.primary.main}`}
        marginBottom="-4px"
        onFocus={focus}
        onBlur={blur}
        onTouchEnd={onTouchEnd}
      >
        {term}
      </Box>
    </Tooltip>
  );
}
