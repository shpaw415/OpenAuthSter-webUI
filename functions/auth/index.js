import {
  AuthManager
} from "../chunk-jek69e2s.js";
import {
  client,
  subject
} from "../chunk-ydj242yd.js";
import"../chunk-6b5ekjqc.js";
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
