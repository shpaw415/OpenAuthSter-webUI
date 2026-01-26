import { client, subject } from "./open-auth";

export async function requireAuth(request: Request): Promise<true | Response> {
  const cookies = requestToCookie(request);
  const authToken = cookies["access_token"];
  const refresh = cookies["refresh_token"];

  if (!authToken) {
    return new Response("Unauthorized", { status: 401 });
  }
  return client
    .verify(subject, authToken, { refresh })
    .then((res) => {
      return res.err ? new Response("Unauthorized", { status: 401 }) : true;
    })
    .catch(() => {
      return new Response("Unauthorized", { status: 401 });
    });
}

function requestToCookie(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get("Cookie");
  const cookies: Record<string, string> = {};
  if (cookieHeader) {
    const cookiePairs = cookieHeader.split(";");
    for (const pair of cookiePairs) {
      const [name, value] = pair.trim().split("=");
      cookies[name!] = decodeURIComponent(value!);
    }
  }
  return cookies;
}
