import { Box, Fab, Fade, useScrollTrigger } from '@mui/material';
import { IconArrowUp } from '@tabler/icons-react';
import { type JSX, useCallback } from 'react';
import { useNavigate } from 'react-router';

interface Props {
  readonly target?: Node | Window;
}

export function ScrollToTop({ target }: Props = {}): JSX.Element {
  const trigger = useScrollTrigger({ target, disableHysteresis: true });
  const navigate = useNavigate();
  const onClick = useCallback(() => {
    if (window.location.hash) {
      void navigate(window.location.pathname);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navigate]);

  return (
    <>
      <Fade in={trigger}>
        <Box position="fixed" bottom={16} right={16} role="presentation" onClick={onClick}>
          <Fab
            color="primary"
            aria-label="Scroll to top"
            size="small"
            sx={(theme) => ({ opacity: 0.75, boxShadow: theme.shadows[8] })}
          >
            <IconArrowUp />
          </Fab>
        </Box>
      </Fade>
    </>
  );
}
