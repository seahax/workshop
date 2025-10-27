import { Box, type BoxProps, Typography, type TypographyProps } from '@mui/material';
import type { JSX } from 'react';

interface Props extends TypographyProps {
  readonly children: string;
  readonly slotProps?: {
    readonly shadow?: BoxProps;
    readonly gradient?: BoxProps;
  };
}

export default function TextGradient({ children, slotProps, ...props }: Props): JSX.Element {
  return (
    <Typography component="span" position="relative" {...props}>
      <Box
        component="span"
        display="block"
        paddingInline={'0.125em'}
        {...slotProps?.shadow}
        position="absolute"
        zIndex={0}
        sx={[
          {
            textShadow: `rgba(0, 0, 0, 0.4) 0 2px 4px`,
            color: 'transparent',
          },
          ...(Array.isArray(slotProps?.shadow?.sx) ? slotProps.shadow.sx : [slotProps?.shadow?.sx]),
        ]}
      >
        {children}
      </Box>
      <Box
        component="span"
        paddingInline={'0.125em'}
        {...slotProps?.gradient}
        display="inline-block"
        position="relative"
        zIndex={1}
        color="transparent"
        sx={[
          {
            background: `linear-gradient(darkblue -10%, skyblue 45%, gold 55%, orange 62%, coral 68%, salmon 74%) text`,
            backgroundClip: 'text',
          },
          ...(Array.isArray(slotProps?.gradient?.sx) ? slotProps.gradient.sx : [slotProps?.gradient?.sx]),
        ]}
      >
        {children}
      </Box>
    </Typography>
  );
}
