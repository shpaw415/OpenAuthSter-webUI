import type { RequestDataContext } from "@auth";
import { getContext } from "frame-master-plugin-cloudflare-pages-functions-action/context";
import { inviteTable } from "openauth-webui-shared-types";
import { and, drizzle, eq, or } from "openauth-webui-shared-types/drizzle";
/**
 * GET /api/invites - Get all invites for the authenticated user
 * this endpoints retrive all invites for the authenticated user, both sent and received. It can be used to display a list of pending invites in the UI.
 */
export async function GET({ type }: { type: "received" | "sent" | "all" }) {
	const ctx = getContext<Env, never, RequestDataContext>(arguments);

	const db = drizzle(ctx.env.PROJECT_DB);
	const userInfo = await ctx.data.client.getMetaData();

	if (!userInfo.id) {
		return {
			success: false,
			error: "Unauthorized",
		};
	}
	if (type === "received") {
		const invites = await db
			.select()
			.from(inviteTable)
			.where(eq(inviteTable.user_id, userInfo.id))
			.all();

		return {
			success: true,
			data: invites,
		};
	} else if (type === "sent") {
		const invites = await db
			.select()
			.from(inviteTable)
			.where(eq(inviteTable.from_user_id, userInfo.id))
			.all();

		return {
			success: true,
			data: invites,
		};
	} else if (type === "all") {
		const invites = await db
			.select()
			.from(inviteTable)
			.where(
				or(
					eq(inviteTable.user_id, userInfo.id),
					eq(inviteTable.from_user_id, userInfo.id),
				),
			)
			.all();

		return {
			success: true,
			data: invites,
		};
	}
}

/**
 * DELETE /api/invites - Decline (dismiss) a received invite by its code
 */
export async function DELETE({ code }: { code: string }) {
	const ctx = getContext<Env, never, RequestDataContext>(arguments);

	const db = drizzle(ctx.env.PROJECT_DB);
	const userInfo = await ctx.data.client.getMetaData();

	if (!userInfo.id) {
		return { success: false, error: "Unauthorized" };
	}

	const invite = await db
		.select()
		.from(inviteTable)
		.where(
			and(eq(inviteTable.code, code), eq(inviteTable.user_id, userInfo.id)),
		)
		.get();

	if (!invite) {
		return { success: false, error: "Invite not found" };
	}

	await db.delete(inviteTable).where(eq(inviteTable.id, invite.id)).run();

	return { success: true };
}
