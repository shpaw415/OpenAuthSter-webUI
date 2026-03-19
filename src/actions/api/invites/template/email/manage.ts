import type { RequestDataContext } from "@auth";
import { getContext } from "frame-master-plugin-cloudflare-pages-functions-action/context";
import { projectTable } from "openauth-webui-shared-types";
import { and, drizzle, eq } from "openauth-webui-shared-types/drizzle";
import { invites } from "../../share";

/**
 * POST /api/projects/invite - Invite a user to a project
 */
export async function POST({
	user_id,
	client_id,
	from_name,
}: {
	user_id: string;
	client_id: string;
	from_name: string;
}) {
	const ctx = getContext<Env, any, RequestDataContext>(arguments);

	const current_user_id = (await ctx.data.client.getMetaData()).id;

	if (!current_user_id) {
		return {
			success: false,
			error: "Unauthorized",
		};
	}

	// Only project owner can invite users
	const db = drizzle(ctx.env.PROJECT_DB);

	const project = await db
		.select()
		.from(projectTable)
		.where(
			and(
				eq(projectTable.clientID, client_id),
				eq(projectTable.owner_id, current_user_id),
			),
		)
		.get();

	if (!project) {
		return {
			success: false,
			error: "Project not found or you don't have permission to invite users",
		};
	}

	const inviteManager = invites(ctx.env.PROJECT_DB);

	const existingInvite = await inviteManager.exists({
		type: "email_template",
		user_id,
		owner_group_id: project.owner_group_id,
		from_id: current_user_id,
	});

	const create = () => {
		return inviteManager.create({
			type: "email_template",
			owner_group_id: project.owner_group_id,
			label: `Invite to Project ${project.name}`,
			from: {
				id: current_user_id,
				name: from_name,
			},
			invite_user_id: user_id,
		});
	};

	if (existingInvite) {
		await inviteManager.deleteById(existingInvite.id);
		const newInvite = await create();

		return {
			success: newInvite.success,
			error: newInvite.error,
		};
	}

	const res = await create();

	return {
		success: res.success,
		error: res.error,
	};
}

/**
 * DELETE /api/projects/invite - Revoke an invite
 */
export async function DELETE({
	user_id,
	owner_group_id,
}: {
	user_id: string;
	owner_group_id: string;
}) {
	const ctx = getContext<Env, any, RequestDataContext>(arguments);

	const current_user_id = (await ctx.data.client.getMetaData()).id;

	if (!current_user_id) {
		return {
			success: false,
			error: "Unauthorized",
		};
	}

	const inviteManager = invites(ctx.env.PROJECT_DB);

	const existingInvite = await inviteManager.exists({
		type: "email_template",
		user_id,
		owner_group_id,
		from_id: current_user_id,
	});

	if (existingInvite) {
		await inviteManager.deleteById(existingInvite.id);
	} else {
		return {
			success: false,
			error: "Invite not found",
		};
	}

	return {
		success: true,
	};
}
