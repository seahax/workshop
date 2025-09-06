import { Box, type BoxProps } from '@mui/material';
import { type JSX, type Ref } from 'react';

interface Props extends Omit<BoxProps, 'ref' | 'children' | 'component'> {
  readonly ref?: Ref<HTMLDivElement>;
  readonly canvasRef?: Ref<HTMLCanvasElement>;
}

export default function Canvas({ ref, canvasRef, ...props }: Props): JSX.Element {
  return (
    <Box
      ref={ref}
      position="relative"
      width="300px"
      height="200px"
      overflow="hidden"
      sx={[
        {
          '& > canvas': {
            display: 'block',
            position: 'absolute',
            height: '100%',
            width: '100%',
          },
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
      {...props}
    >
      <canvas width="300" height="200" ref={canvasRef}></canvas>
    </Box>
  );
}
