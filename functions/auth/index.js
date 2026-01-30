import {
  AuthManager
} from "../chunk-6gsm4768.js";
import {
  createServerClient,
  subject
} from "../chunk-98635g97.js";
import"../chunk-aqd3ejpt.js";
import"../chunk-5yjnn0bn.js";

// src/api/auth/index.ts
"no action";
var onRequest = (ctx) => {
  return new AuthManager({
    issuer: ctx.env.PUBLIC_ISSUER,
    client_id: ctx.env.PUBLIC_CLIENT_ID,
    client: createServerClient({
      issuer: ctx.env.PUBLIC_ISSUER,
      clientID: ctx.env.PUBLIC_CLIENT_ID,
      request: ctx.request
    }),
    redirectURI: ctx.env.PUBLIC_REDIRECT_URI,
    verify: {
      subjects: subject,
      onSuccess(subject2) {
        return Response.json(subject2.subject.properties);
      },
      onError(error) {
        return new Response(`Authentication failed: ${error.err.message}`, {
          status: 401
        });
      }
    }
  }).run(ctx.request);
};
export {
  onRequest
};
