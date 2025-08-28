import { AppBar, Box, Toolbar } from '@mui/material';
import { type JSX } from 'react';

import AppHeaderLogo from './app-header-logo.tsx';
import AppHeaderMenu from './app-header-menu.tsx';
import AppHeaderMenuCollapsed from './app-header-menu-collapsed.tsx';

export default function AppHeader(): JSX.Element {
  return (
    <AppBar position="relative" sx={{ zIndex: 3 }}>
      <Toolbar sx={{ alignItems: 'stretch' }}>
        <Box sx={(
          theme,
        ) => ({ flexGrow: 1, mx: 'auto', display: 'flex', alignItems: 'center', gap: theme.spacing(1) })}
        >
          <AppHeaderLogo />
          <Box flexGrow={1} />
          <AppHeaderMenu />
          <AppHeaderMenuCollapsed />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
