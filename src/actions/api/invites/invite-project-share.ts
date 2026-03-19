"no action";

import type { createClient } from "@auth";
import { projectInviteTable, projectTable } from "openauth-webui-shared-types";
import { and, drizzle, eq } from "openauth-webui-shared-types/drizzle";

export const invites = (_db: D1Database) => {
	const db = drizzle(_db);

	return {
		create: async (client_id: string, user_id: string, env: Env) => {
			const id = crypto.randomUUID();
			const res = await db
				.insert(projectInviteTable)
				.values({
					clientID: client_id,
					user_id: user_id,
					code: id,
					expiresAt: new Date(
						Date.now() + 7 * 24 * 60 * 60 * 1000,
					).toISOString(), // Expires in 7 days
					created_at: new Date().toISOString(),
					id: id,
				})
				.returning()
				.get();

			return {
				url: `${new URL(env.PUBLIC_REDIRECT_URI).origin}/invite/projects/accept?client_id=${client_id}&code=${res.code}`,
				code: res.code,
			};
		},
		deleteByCode: (code: string) => {
			return db
				.delete(projectInviteTable)
				.where(eq(projectInviteTable.code, code))
				.run();
		},
		confirmInvite: async (
			code: string,
			client_id: string,
			authClient: ReturnType<typeof createClient>,
		) => {
			const res = await db
				.select()
				.from(projectInviteTable)
				.where(
					and(
						eq(projectInviteTable.code, code),
						eq(projectInviteTable.clientID, client_id),
					),
				)
				.get();
			if (!res) return { success: false, error: "Invite not found" };

			const owner_group_id = await db
				.select({ owner_group_id: projectTable.owner_group_id })
				.from(projectTable)
				.where(eq(projectTable.clientID, client_id))
				.get()
				.then((project) => project?.owner_group_id);

			if (!owner_group_id)
				return { success: false, error: "Owner group not found" };

            const currentUserSession = await authClient.getUserSession("private").then((session) => session instanceof Error ? null : session.private);

            if (currentUserSession === null) {
                return { success: false, error: "User session not found" };
            }

            await authClient.updateUserSession("private", {
                group_ids: [...(currentUserSession?.group_ids || []), owner_group_id],
            })

			await db
				.delete(projectInviteTable)
				.where(eq(projectInviteTable.code, code))
				.run();
			return { success: true };
		},
		exists: (client_id: string, user_id: string) => {
			return db
				.select()
				.from(projectInviteTable)
				.where(
					and(
						eq(projectInviteTable.clientID, client_id),
						eq(projectInviteTable.user_id, user_id),
					),
				)
				.get();
		},
	};
};
