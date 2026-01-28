"no action";

import { AuthManager } from "openauth-webui-shared-types/endpoints";
import { subject } from "../../open-auth";
import { createServerClient } from "openauth-webui-shared-types/client";

export const onRequest: PagesFunction<Env> = (ctx) => {
  return new AuthManager({
    issuer: ctx.env.PUBLIC_ISSUER,
    client_id: ctx.env.PUBLIC_CLIENT_ID,
    client: createServerClient({
      issuer: ctx.env.PUBLIC_ISSUER,
      clientID: ctx.env.PUBLIC_CLIENT_ID,
      request: ctx.request,
    }),
    redirectURI: ctx.env.PUBLIC_REDIRECT_URI,
    verify: {
      subjects: subject,
      onSuccess(subject) {
        return Response.json(subject.subject.properties);
      },
      onError(error) {
        return new Response(`Authentication failed: ${error.err.message}`, {
          status: 401,
        });
      },
    },
  }).run(ctx.request);
};
