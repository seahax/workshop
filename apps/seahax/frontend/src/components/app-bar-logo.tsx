import { Link } from '@mui/material';
import type { JSX } from 'react';
import { Link as RouterLink } from 'react-router';

import TextGradient from './text-gradient.tsx';

export default function AppBarLogo(): JSX.Element {
  return (
    <Link component={RouterLink} to="/" flexGrow={1}>
      <TextGradient fontSize={24} fontWeight={600} fontFamily="'Rock Salt'">Seahax</TextGradient>
    </Link>
  );
}
