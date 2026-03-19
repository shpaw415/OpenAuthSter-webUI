import { invites } from "../invite-project-share";
import type { RequestDataContext } from "@auth";
import { getContext } from "frame-master-plugin-cloudflare-pages-functions-action/context";


/**
 * Accept a project invite using the invite code.
 * This endpoint is called when a user clicks on an invite link.
 * It verifies the invite code, adds the user to the project, and then deletes the invite.
 */
export async function POST({ code, client_id }: { code: string, client_id: string }) {
    const ctx = getContext<Env, any, RequestDataContext>(arguments);
    return await invites(ctx.env.PROJECT_DB).confirmInvite(code, client_id, ctx.data.client);
}