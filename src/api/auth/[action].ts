"no action";

import { AuthManager } from "openauth-webui-shared-types/endpoints";
import { subject } from "../../open-auth";
import { createServerClient } from "openauth-webui-shared-types/client";

export const onRequest: PagesFunction<Env> = (ctx) => {
  return new AuthManager({
    issuer: ctx.env.PUBLIC_ISSUER,
    client: createServerClient({
      issuer: ctx.env.PUBLIC_ISSUER,
      clientID: ctx.env.PUBLIC_CLIENT_ID,
      request: ctx.request,
    }),
    client_id: ctx.env.PUBLIC_CLIENT_ID,
    redirectURI: ctx.env.PUBLIC_REDIRECT_URI,
    callback: {
      onError(error) {
        console.error(error);
      },
      onSuccess(success) {
        console.log("Successful authentication:", success);
      },
    },
    verify: {
      subjects: subject,
      onSuccess(subject) {
        return new Response("Authentication successful", { status: 200 });
      },
      onError(error) {
        return new Response(`Authentication failed: ${error.err.message}`, {
          status: 401,
        });
      },
    },
  }).run(ctx.request);
};
