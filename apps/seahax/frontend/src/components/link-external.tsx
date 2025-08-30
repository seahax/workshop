import { Link, type LinkProps } from '@mui/material';
import type { JSX } from 'react';

interface Props extends Omit<LinkProps, 'target' | 'rel'> {
  readonly href: string;
  readonly text?: string;
}

export function LinkExternal({ href, text, children, ...props }: Props): JSX.Element {
  return (
    <Link href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {text}
      {children}
    </Link>
  );
}
