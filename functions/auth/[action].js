import {
  AuthManager
} from "../chunk-jek69e2s.js";
import {
  client,
  subject
} from "../chunk-ydj242yd.js";
import"../chunk-6b5ekjqc.js";
import"../chunk-0t41ngqp.js";

// src/api/auth/[action].ts
"no action";
var onRequest = (ctx) => {
  return new AuthManager({
    issuer: ctx.env.PUBLIC_ISSUER,
    client,
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
