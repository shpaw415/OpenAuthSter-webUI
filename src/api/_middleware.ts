"no action";
import type { EventContext } from "@cloudflare/workers-types";
import { type RequestDataContext, createClient } from "@auth";

export async function onRequest(
  context: EventContext<Env, any, RequestDataContext>,
) {
  //@ts-ignore
  if (context.env.NODE_ENV === "development") {
    return await context.next();
  }

  const auth = await createClient().setTokenFromRequest(
    context.request as unknown as Request,
  );

  if (!auth.isAuthenticated) {
    return new Response("Unauthorized", { status: 401 });
  }

  context.data.client = auth;

  try {
    return await context.next();
  } catch (err) {
    if (err instanceof Error) {
      console.error("Error in API middleware:", err);
      return new Response(`${err.message}\n${err.stack}`, { status: 500 });
    }
    return new Response("Unknown error", { status: 500 });
  }
}
