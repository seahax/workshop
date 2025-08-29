import { Box, ClickAwayListener, Tooltip } from '@mui/material';
import { type JSX, type TouchEventHandler, useCallback } from 'react';

import useBoolean from '../hooks/use-boolean.ts';

interface Props {
  readonly term: string;
  readonly definition: string;
};

export default function TextDefinition({ term, definition }: Props): JSX.Element {
  const { value: isFocused, setTrue: focus, setFalse: blur } = useBoolean();
  const onTouchStart = useCallback<TouchEventHandler<HTMLSpanElement>>((event) => {
    event.currentTarget.focus();
  }, []);

  return (
    <ClickAwayListener onClickAway={blur}>
      <Tooltip
        title={definition}
        open={isFocused || undefined}
        disableTouchListener={true}
        disableHoverListener={isFocused}
        // disableFocusListener={isFocused}
      >
        <Box
          component="span"
          tabIndex={0}
          borderBottom={(theme) => `3px dotted ${theme.palette.primary.main}`}
          marginBottom="-4px"
          onTouchStart={onTouchStart}
          onFocus={focus}
          onBlur={blur}
        >
          {term}
        </Box>
      </Tooltip>
    </ClickAwayListener>
  );
}
