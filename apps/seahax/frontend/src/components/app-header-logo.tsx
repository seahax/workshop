import { Link } from '@mui/material';
import type { JSX } from 'react';

import TextGradient from './text-gradient.tsx';

export default function AppHeaderLogo(): JSX.Element {
  return (
    <Link href="/" flexGrow={1}>
      <TextGradient fontSize={24} fontWeight={600} fontFamily="'Rock Salt'">Seahax</TextGradient>
    </Link>
  );
}
