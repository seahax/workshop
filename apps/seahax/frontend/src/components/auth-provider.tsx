import { Auth0Provider } from '@auth0/auth0-react';
import type { JSX, PropsWithChildren } from 'react';

export default function AuthProvider({ children }: PropsWithChildren): JSX.Element {
  return (
    <Auth0Provider
      domain="auth0.seahax.com"
      clientId="RGTGlouVBUsLhiPVPfKdCMXUZMd5yS3f"
      cacheLocation="localstorage"
      useRefreshTokens={true}
      authorizationParams={{ redirect_uri: window.location.origin }}
    >
      {children}
    </Auth0Provider>
  );
}
