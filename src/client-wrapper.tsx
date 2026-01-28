// ClientWrapper is used client side only for state management
// you can create your own version of the routerHost

import { RouterHost } from "frame-master-plugin-apply-react/router";
import { StrictMode, useMemo, type JSX } from "react";
import { AuthProvider } from "openauth-react/client";
import { createClient } from "openauth-webui-shared-types/client";

export default function ClientWrapper({ children }: { children: JSX.Element }) {
  const client = useMemo(
    () =>
      createClient({
        clientID: process.env.PUBLIC_CLIENT_ID!,
        issuer: process.env.PUBLIC_ISSUER!,
        copyID: null,
      }),
    [],
  );

  return (
    <StrictMode>
      <AuthProvider
        callbackRedirectURI={process.env.PUBLIC_REDIRECT_URI!}
        userInfoEndpoint="/auth"
        client={client}
      >
        <RouterHost>{children}</RouterHost>
      </AuthProvider>
    </StrictMode>
  );
}
