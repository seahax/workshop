import './init/sentry.ts';

import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { type FC, StrictMode, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

const root = createRoot(document.querySelector('#app')!);

const Presence: FC = () => {
  const { isAuthenticated, isLoading, error } = useAuth0();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return <Logout />;
  }

  return (
    <div>
      {error && (
        <div>
          Authentication Error:
          {error.message}
        </div>
      )}
      <Login />
    </div>
  );
};

const Login: FC = () => {
  const { loginWithRedirect } = useAuth0();
  const handleLogin = useCallback(() => {
    void loginWithRedirect();
  }, [loginWithRedirect]);

  return (
    <button onClick={handleLogin}>Log in</button>
  );
};

const Logout: FC = () => {
  const { logout } = useAuth0();
  const handleLogout = useCallback(() => {
    void logout({ logoutParams: { returnTo: window.location.origin } });
  }, [logout]);

  return (
    <button onClick={handleLogout}>Log out</button>
  );
};

root.render(
  <StrictMode>
    <Auth0Provider
      domain="auth0.seahax.com"
      clientId="RGTGlouVBUsLhiPVPfKdCMXUZMd5yS3f"
      cacheLocation="localstorage"
      useRefreshTokens={true}
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
    >
      <div>Hello, Seahax!</div>
      <Presence />
    </Auth0Provider>
  </StrictMode>,
);
