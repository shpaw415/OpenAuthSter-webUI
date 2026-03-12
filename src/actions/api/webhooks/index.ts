import { getContext } from "frame-master-plugin-cloudflare-pages-functions-action/context";
import type {
  WebHookConfig,
  WebHookEvents,
  ExtendedWebHookConfig,
} from "openauth-webui-shared-types/webhook/types";
import { WebHook } from "openauth-webui-shared-types/webhook";
import type { ActionResponse } from "../../../api-helper";

export async function GET({
  clientID,
  filters,
}: {
  clientID: string;
  filters?: Partial<{
    event: WebHookEvents;
    id: string;
  }>;
}): Promise<ActionResponse<ExtendedWebHookConfig[]>> {
  const ctx = getContext<Env, any, any>(arguments);
  const wh = new WebHook({ db: ctx.env.PROJECT_DB });
  try {
    return {
      success: true,
      data: await wh.getWebHooks(clientID, filters),
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to fetch webhooks",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Create a new webhook for a specific client and event.
 * @param clientID - The ID of the client for which the webhook is being registered.
 * @param event - The event that will trigger the webhook (e.g., "login_success", "password_reset", "code_sent").
 * @param config - The configuration for the webhook, including the URL, HTTP method, and optional headers.
 */
export async function POST({
  clientID,
  event,
  config,
}: {
  clientID: string;
  event: WebHookEvents;
  config: WebHookConfig;
}): Promise<ActionResponse<ExtendedWebHookConfig>> {
  const ctx = getContext<Env, any, any>(arguments);
  try {
    return {
      success: true,
      data: await new WebHook({ db: ctx.env.PROJECT_DB }).register({
        clientID,
        event,
        config,
      }),
    };
  } catch (error) {
    return {
      error: "Failed to register webhook",
      details: error instanceof Error ? error.message : String(error),
      success: false,
    };
  }
}

export async function DELETE({
  webHookID,
  clientID,
}: {
  webHookID: string;
  clientID: string;
}): Promise<ActionResponse<null>> {
  const ctx = getContext<Env, any, any>(arguments);
  try {
    await new WebHook({ db: ctx.env.PROJECT_DB }).deleteWebHook(
      webHookID,
      clientID,
    );
    return {
      success: true,
      data: null,
    };
  } catch (error) {
    return {
      error: "Failed to delete webhook",
      details: error instanceof Error ? error.message : String(error),
      success: false,
    };
  }
}

export async function PUT({
  webHookID,
  config,
}: {
  webHookID: string;
  config: Partial<WebHookConfig>;
}): Promise<ActionResponse<WebHookConfig>> {
  const ctx = getContext<Env, any, any>(arguments);
  const wh = new WebHook({ db: ctx.env.PROJECT_DB });
  try {
    return {
      success: true,
      data: await wh.update({ webHookID, config }),
    };
  } catch (error) {
    return {
      error: "Failed to update webhook",
      details: error instanceof Error ? error.message : String(error),
      success: false,
    };
  }
}
