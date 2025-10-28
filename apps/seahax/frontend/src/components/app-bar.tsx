import { AppBar as MuiAppBar, Box, Toolbar, useScrollTrigger } from '@mui/material';
import { type JSX } from 'react';

import AppBarLogo from './app-bar-logo.tsx';
import AppHeaderMenu from './app-bar-menu.tsx';

export default function AppBar(): JSX.Element {
  const elevate = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  });

  return (
    <>
      <MuiAppBar
        position="sticky"
        elevation={elevate ? 4 : 0}
        sx={{ backgroundColor: elevate ? undefined : 'transparent' }}
      >
        <Toolbar sx={{ alignItems: 'stretch' }}>
          <Box sx={(
            theme,
          ) => ({ flexGrow: 1, mx: 'auto', display: 'flex', alignItems: 'center', gap: theme.spacing(1) })}
          >
            <AppBarLogo />
            <Box flexGrow={1} />
            <AppHeaderMenu />
          </Box>
        </Toolbar>
      </MuiAppBar>
    </>
  );
}
