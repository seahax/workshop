import { Box, ClickAwayListener, Tooltip } from '@mui/material';
import { type JSX, useCallback } from 'react';

import useBoolean from '../hooks/use-boolean.ts';

interface Props {
  readonly term: string;
  readonly definition: string;
};

export default function TextDefinition({ term, definition }: Props): JSX.Element {
  const { value: isFocused, setTrue: focus, setFalse: blur } = useBoolean();
  const onTouchStart = useCallback(() => focus(), [focus]);

  return (
    <Tooltip
      title={definition}
      open={isFocused || undefined}
      disableHoverListener={isFocused}
      disableTouchListener={isFocused}
      disableFocusListener={isFocused}
    >
      <ClickAwayListener onClickAway={blur}>
        <Box
          component="span"
          tabIndex={0}
          borderBottom={(theme) => `3px dotted ${theme.palette.primary.main}`}
          marginBottom="-4px"
          onTouchStart={onTouchStart}
        >
          {term}
        </Box>
      </ClickAwayListener>
    </Tooltip>
  );
}
