import { Box, type BoxProps } from '@mui/material';
import type { JSX } from 'react';

interface Props extends Omit<BoxProps, 'ref' | 'children' | 'component' | 'alt' | 'src'> {
  readonly projectName: string;
  readonly type: 'go' | 'npm';
}

export default function ProjectBadge({ type, projectName, ...Props }: Props): JSX.Element {
  return (
    <Box
      component="img"
      alt={type === 'go' ? 'Go tag' : 'NPM version'}
      src={
        type === 'go'
          ? `https://img.shields.io/github/v/tag/seahax/workshop?sort=semver&filter=${projectName}/v*&style=for-the-badge&labelColor=gray`
          : `https://img.shields.io/npm/v/${projectName}?style=for-the-badge&label=version&labelColor=gray&color=%23bc3433`
      }
      borderRadius={(theme) => theme.spacing(0.5)}
      {...Props}
    />
  );
}
