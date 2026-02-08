// ClientWrapper is used client side only for state management
// you can create your own version of the routerHost

import { RouterHost } from "frame-master-plugin-apply-react/router";
import { StrictMode, useRef, type JSX } from "react";
import { AuthProvider } from "openauth-react/client";
import { createOpenAuthsterClient } from "openauth-webui-shared-types/client/user";

export default function ClientWrapper({ children }: { children: JSX.Element }) {
  const client = useRef(
    createOpenAuthsterClient<any, any>({
      clientID: process.env.PUBLIC_CLIENT_ID!,
      issuerURI: process.env.PUBLIC_ISSUER!,
      redirectURI: process.env.PUBLIC_REDIRECT_URI!,
    }),
  );

  return (
    <StrictMode>
      <AuthProvider
        callbackRedirectURI={process.env.PUBLIC_REDIRECT_URI!}
        userInfoEndpoint="/auth"
        isFrontendCallback
        client={client.current as any}
      >
        <RouterHost>{children}</RouterHost>
      </AuthProvider>
    </StrictMode>
  );
}
