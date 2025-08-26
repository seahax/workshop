import { IconButton, Tooltip } from '@mui/material';
import type { JSX, PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
  readonly title: string;
  readonly href: string;
}>;

export default function MenuBarIconButton({ title, href, children }: Props): JSX.Element {
  return (
    <Tooltip
      arrow
      title={title}
      disableInteractive
      slotProps={{
        arrow: { sx: (theme) => ({ color: theme.palette.grey[800] }) },
        tooltip: { sx: (theme) => ({ backgroundColor: theme.palette.grey[800] }) },
      }}
    >
      <IconButton
        size="large"
        href={href}
        target="_blank"
        sx={(theme) => ({
          color: theme.palette.grey[400],
        })}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
}
