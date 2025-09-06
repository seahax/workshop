import { Container, Divider, Typography } from '@mui/material';
import type { JSX } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router';

import Root from './root.tsx';

export default function RouteError(): JSX.Element {
  const error = useRouteError();

  console.error(error);

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
      <Container sx={{
        pt: 4,
        pb: 18,
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
      >
        <Typography variant="h2" component="h1" color={'error'}>
          {props.heading}
        </Typography>
        <Divider
          sx={(theme) => ({
            borderColor: theme.palette.error.dark,
            borderImage: `linear-gradient(to right, ${
              theme.palette.error.main
            }, ${
              theme.alpha(theme.palette.error.dark, 0.05)
            }) 1`,
            marginBlock: theme.spacing(1),
          })}
        />
        <Typography variant="h5" component="p" color="error">
          {props.detail}
        </Typography>
      </Container>
    </Root>
  );
}
