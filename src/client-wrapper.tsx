// ClientWrapper is used client side only for state management
// you can create your own version of the routerHost

import { RouterHost } from "frame-master-plugin-apply-react/router";
import { StrictMode, type JSX } from "react";
import { AuthProvider } from "openauth-react/client";

export default function ClientWrapper({ children }: { children: JSX.Element }) {
  return (
    <StrictMode>
      <AuthProvider
        clientID={process.env.PUBLIC_CLIENT_ID!}
        issuer={process.env.PUBLIC_ISSUER!}
        callbackRedirectURI={process.env.PUBLIC_REDIRECT_URI!}
        userInfoEndpoint="/auth"
      >
        <RouterHost>{children}</RouterHost>
      </AuthProvider>
    </StrictMode>
  );
}
