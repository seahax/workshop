import { IconButton, Tooltip } from '@mui/material';
import type { JSX, PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
  readonly title: string;
  readonly href: string;
}>;

export default function AppHeaderIconLink({ title, href, children }: Props): JSX.Element {
  return (
    <Tooltip title={title}>
      <IconButton size="large" href={href} target="_blank" color="primary">
        {children}
      </IconButton>
    </Tooltip>
  );
}
