"no action";

import { AuthManager } from "openauth-webui-shared-types/endpoints";
import { client, subject } from "../../open-auth";

export const onRequest: PagesFunction<Env> = (ctx) => {
  return new AuthManager({
    issuer: ctx.env.PUBLIC_ISSUER,
    client_id: ctx.env.PUBLIC_CLIENT_ID,
    client,
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
