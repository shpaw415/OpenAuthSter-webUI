import {
  COOKIE_NAME
} from "./chunk-6b5ekjqc.js";

// ../openauth-webui-shared-types/endpoints/index.ts
class AuthManager {
  client;
  redirectURI;
  client_id;
  props;
  publicPath;
  issuer;
  constructor(props) {
    this.client = props.client;
    this.issuer = props.issuer;
    this.redirectURI = props.redirectURI;
    this.props = { callback: props.callback, verify: props.verify };
    this.publicPath = props.publicPath ?? "/auth";
    this.client_id = props.client_id;
  }
  run(request) {
    switch (new URL(request.url).pathname) {
      case `${this.publicPath}/callback`:
        return this.callback({ ...this.props.callback, request });
      case `${this.publicPath}/authorize`:
        return this.authorize();
      case `${this.publicPath}`:
        return this.verify(request);
      default:
        return new Response("Not Found", { status: 404 });
    }
  }
  async callback({
    onError,
    onSuccess,
    request,
    ...props
  }) {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    console.log("Received code:", code);
    try {
      if (!code)
        throw new Error("No code provided");
      const exchanged = await this.client.exchange(code, this.redirectURI);
      if (exchanged.err) {
        throw new Error("Code exchange failed", { cause: exchanged });
      }
      const response = new Response(props.response?.body ?? null, {
        status: 302,
        ...props.response?.init || {},
        headers: {
          ...props.response?.init?.headers || {}
        }
      });
      response.headers.set("Location", url.origin);
      setSession(response, exchanged.tokens.access, exchanged.tokens.refresh);
      await onSuccess?.(exchanged);
      return response;
    } catch (e) {
      await onError?.(e.cause);
      throw e;
    }
  }
  async authorize() {
    return Response.redirect(await this.client.authorize(this.redirectURI, "code").then((v) => v.url), 302);
  }
  async verify(request) {
    const cookies = new URLSearchParams(request.headers.get("cookie")?.replaceAll("; ", "&"));
    const verified = await this.client.verify(this.props.verify.subjects, cookies.get("access_token"), {
      refresh: cookies.get("refresh_token") || undefined,
      fetch: (body, init) => {
        const header = new Headers(init?.headers || {});
        header.append("Cookie", cookies.get(COOKIE_NAME) || "");
        init.headers = header;
        return fetch(body, init);
      }
    });
    if (verified.err) {
      const res = await this.props.verify.onError?.(verified);
      return res || Response.redirect(new URL(request.url).origin + "/authorize", 302);
    }
    const resp = await this.props.verify.onSuccess(verified);
    if (verified.tokens)
      setSession(resp, verified.tokens.access, verified.tokens.refresh);
    return resp;
  }
}
function setSession(response, access, refresh) {
  if (access) {
    response.headers.append("Set-Cookie", `access_token=${access}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2147483647`);
  }
  if (refresh) {
    response.headers.append("Set-Cookie", `refresh_token=${refresh}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2147483647`);
  }
}

export { AuthManager };
