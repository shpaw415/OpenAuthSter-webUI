import {
  AuthManager
} from "../chunk-511y6qmp.js";
import {
  createServerClient,
  subject
} from "../chunk-qvp0byx4.js";
import"../chunk-02drm0pp.js";
import"../chunk-5yjnn0bn.js";

// src/api/auth/[action].ts
"no action";
var onRequest = (ctx) => {
  return new AuthManager({
    issuer: ctx.env.PUBLIC_ISSUER,
    client: createServerClient({
      issuer: ctx.env.PUBLIC_ISSUER,
      clientID: ctx.env.PUBLIC_CLIENT_ID,
      request: ctx.request
    }),
    client_id: ctx.env.PUBLIC_CLIENT_ID,
    redirectURI: ctx.env.PUBLIC_REDIRECT_URI,
    callback: {
      onError(error) {
        console.error(error);
      },
      onSuccess(success) {
        console.log("Successful authentication:", success);
      }
    },
    verify: {
      subjects: subject,
      onSuccess(subject2) {
        return new Response("Authentication successful", { status: 200 });
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
