import { Container, Typography } from '@mui/material';
import type { JSX } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router';

import Root from './root.tsx';

export default function RouteError(): JSX.Element {
  const error = useRouteError();

  return isRouteErrorResponse(error)
    ? (
        <RouteErrorView
          heading={error.statusText}
          detail={error.data}
        />
      )
    : (
        <RouteErrorView
          heading="Something went wrong."
          detail={error instanceof Error ? error.message : 'Unknown Error'}
        />
      );
}

function RouteErrorView(props: { heading: string; detail: string }): JSX.Element {
  return (
    <Root>
      <Container sx={{ pt: 10, pb: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography variant="h1" color={'error'}>
          {props.heading}
        </Typography>
        <Typography variant="h5" component="p" color="error">
          {props.detail}
        </Typography>
      </Container>
    </Root>
  );
}
