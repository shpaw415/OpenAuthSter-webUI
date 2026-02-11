import { createClient } from "@auth";
import { getContext } from "frame-master-plugin-cloudflare-pages-functions-action/context";
import { parseDBProject, type Project } from "openauth-webui-shared-types";
import {
  WebUiInviteLinkTable,
  projectTable,
} from "openauth-webui-shared-types/database";
import { drizzle, eq } from "openauth-webui-shared-types/drizzle";

export async function POST(params: {
  clientID: string;
  copyID?: string;
  expireInMin: number;
}): Promise<{
  success: boolean;
  data?: { link: string };
  error?: string;
}> {
  const ctx = getContext<Env, any, any>(arguments);
  const auth = await createClient().setTokenFromRequest(
    ctx.request as unknown as Request,
  );
  if (auth.isAuthenticated === false)
    return {
      success: false,
      error: "Unauthorized",
    };

  const project = await drizzle(ctx.env.PROJECT_DB)
    .select({
      originURL: projectTable.originURL,
    })
    .from(projectTable)
    .where(eq(projectTable.clientID, params.clientID))
    .get();

  if (!project)
    return {
      success: false,
      error: "Project not found",
    };

  const id = crypto.randomUUID();

  const newLink = await drizzle(ctx.env.PROJECT_DB)
    .insert(WebUiInviteLinkTable)
    .values({
      id,
      clientID: params.clientID,
      link: `${project.originURL}?invite_id=${id}&client_id=${params.clientID}${
        params.copyID ? `::${params.copyID}` : ""
      }`,
      expiresAt: new Date(
        Date.now() + params.expireInMin * 60 * 1000,
      ).toISOString(), // Expires in specified minutes
      created_at: new Date().toISOString(),
    })
    .returning({ link: WebUiInviteLinkTable.link })
    .get();

  if (!newLink) {
    return {
      success: false,
      error: "Failed to create invite link",
    };
  }

  return {
    success: true,
    data: { link: newLink.link },
  };
}
