import {
  AuthManager
} from "../chunk-4wx0t7yp.js";
import {
  client,
  subject
} from "../chunk-4d009j3y.js";
import"../chunk-c97z6qgd.js";
import"../chunk-0t41ngqp.js";

// src/api/auth/index.ts
"no action";
var onRequest = (ctx) => {
  return new AuthManager({
    issuer: ctx.env.PUBLIC_ISSUER,
    client_id: ctx.env.PUBLIC_CLIENT_ID,
    client,
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
