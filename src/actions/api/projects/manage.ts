import type { RequestDataContext } from "@auth";
import { onSelfHosted, ownerGroupConditions } from "@utils/server";
import { getContext } from "frame-master-plugin-cloudflare-pages-functions-action/context";
import {
	PUBLIC_CLIENT_ID,
	type Project,
	createWebUiProject,
	parseDBProject,
} from "openauth-webui-shared-types";
import {
	DeleteOTFusersTable,
	insertLog,
	projectTable,
	totpTable,
	totpTokenTable,
	WebHookTable,
	WebUiInviteLinkTable,
	webAuthnTokenAccessTable,
	webauthnChallengesTable,
	uiStyleTable,
	webauthnCredentialsTable,
} from "openauth-webui-shared-types/database";
import { and, drizzle, eq, or } from "openauth-webui-shared-types/drizzle";
import {
	createClient,
	deleteCustomDomainForProject,
} from "../../../cloudflare";

// GET /projects/manage - Get a single project
export async function GET(params: {
	clientID: string;
}): Promise<{ success: boolean; data?: Project; error?: string }> {
	const ctx = getContext<Env, "", RequestDataContext>(arguments);

	const session = await ctx.data.client.getUserSession("private");

	if (session instanceof Error) {
		return {
			success: false,
			error: "Unauthorized",
		};
	}

	if (params.clientID === PUBLIC_CLIENT_ID) {
		return onSelfHosted<{
			success: boolean;
			data?: Project;
			error?: string;
		}>(
			ctx.env.SELF_HOSTED,
			() => ({
				success: true,
				data: createWebUiProject({
					secret: ctx.env.WEBUI_SECRET,
					originURL: ctx.env.PUBLIC_REDIRECT_URI,
				}),
			}),
			{
				success: false,
				error: "Project not found",
			},
		);
	}

	const db = drizzle(ctx.env.PROJECT_DB);
	const projects = await db
		.select()
		.from(projectTable)
		.where(
			and(
				eq(projectTable.clientID, params.clientID),
				ownerGroupConditions({
					user_group_ids: session?.private?.group_ids ?? [],
					ownerGroupIdColumn: projectTable.owner_group_id,
					otherEq: [eq(projectTable.owner_id, session.user_id)],
					self_host: ctx.env.SELF_HOSTED,
				}),
			),
		)
		.limit(1);

	const project = projects.at(0);

	if (!project) {
		return {
			success: false,
			error: "Project not found",
		};
	}

	return {
		success: true,
		data: parseDBProject(project),
	};
}

type UpdateResponse = {
	success: boolean;
	error?: string;
	data?: Project;
};

export type updateProjectParams = {
	clientID: string;
	data: Partial<Omit<Project, "clientID" | "created_at">>;
};

// PUT /projects/manage - Update a project
export async function PUT(
	params: updateProjectParams,
): Promise<UpdateResponse> {
	const ctx = getContext<Env, "", RequestDataContext>(arguments);
	const { env } = ctx;

	const session = await ctx.data.client.getUserSession("private");

	if (session instanceof Error) {
		return {
			success: false,
			error: "Unauthorized",
		};
	}
	const db = drizzle(env.PROJECT_DB);

	// Check if the theme_id can be used if present
	if (
		params.data.theme_id &&
		!(await db
			.select()
			.from(uiStyleTable)
			.where(
				and(
					eq(uiStyleTable.id, params.data.theme_id),
					ownerGroupConditions({
						user_group_ids: session?.private?.group_ids ?? [],
						ownerGroupIdColumn: uiStyleTable.owner_group_id,
						otherEq: [eq(uiStyleTable.owner_id, session.user_id)],
						self_host: env.SELF_HOSTED,
					}),
				),
			)
			.get()
			.then((e) => Boolean(e)))
	)
		return {
			success: false,
			error: "Invalid theme_id",
		};

	try {
		// Check if project exists
		const existing = (
			await db
				.select()
				.from(projectTable)
				.where(
					and(
						eq(projectTable.clientID, params.clientID),
						ownerGroupConditions({
							user_group_ids: session?.private?.group_ids ?? [],
							ownerGroupIdColumn: projectTable.owner_group_id,
							otherEq: [eq(projectTable.owner_id, session.user_id)],
							self_host: env.SELF_HOSTED,
						}),
					),
				)
				.limit(1)
		).at(0);

		if (!existing) {
			return {
				success: false,
				error: "Project not found",
			};
		}

		const updates: Record<string, unknown> = {};
		if (typeof params.data.active === "boolean") {
			updates.active = params.data.active;
		}
		if (params.data.providers_data !== undefined) {
			updates.providers_data = JSON.stringify(params.data.providers_data);
		}
		if (params.data.theme_id !== undefined) {
			updates.theme_id = params.data.theme_id;
		}
		if (params.data.projectData !== undefined) {
			updates.projectData = JSON.stringify(params.data.projectData);
		}
		if (params.data.originURL !== undefined) {
			updates.originURL = params.data.originURL;
		}
		if (params.data.registerOnInvite !== undefined) {
			updates.registerOnInvite = params.data.registerOnInvite ? 1 : 0;
		}

		if (Object.keys(updates).length === 0)
			return {
				success: false,
				error: "No valid fields to update",
			};

		const updatedProjects = (
			await db
				.update(projectTable)
				.set(updates)
				.where(
					and(
						eq(projectTable.clientID, params.clientID),
						ownerGroupConditions({
							user_group_ids: session?.private?.group_ids ?? [],
							ownerGroupIdColumn: projectTable.owner_group_id,
							otherEq: [eq(projectTable.owner_id, session.user_id)],
							self_host: env.SELF_HOSTED,
						}),
					),
				)
				.returning()
		).at(0);

		if (!updatedProjects)
			return {
				success: false,
				error: "Project not found after update",
			};

		return {
			success: true,
			data: parseDBProject(updatedProjects),
		};
	} catch (error) {
		await insertLog({
			type: "error",
			clientID: env.PUBLIC_CLIENT_ID,
			message: error instanceof Error ? error.message : String(error),
			database: env.PROJECT_DB,
			endpoint: "/api/projects/manage",
		});
		return {
			success: false,
			error: "Invalid request body",
		};
	}
}

// DELETE /projects/manage - Delete a project
export async function DELETE(params: {
	clientID: string;
}): Promise<{ success: boolean; error?: string }> {
	const ctx = getContext<Env, "", RequestDataContext>(arguments);
	const { env } = ctx;

	const session = await ctx.data.client.getUserSession("private");

	if (session instanceof Error) {
		return {
			success: false,
			error: "Unauthorized",
		};
	}

	const db = drizzle(env.PROJECT_DB);

	// Check if project exists
	const existing = await db
		.select()
		.from(projectTable)
		.where(
			or(
				and(
					eq(projectTable.clientID, params.clientID),
					ownerGroupConditions({
						user_group_ids: session?.private?.group_ids ?? [],
						ownerGroupIdColumn: projectTable.owner_group_id,
						otherEq: [eq(projectTable.owner_id, session.user_id)],
						self_host: env.SELF_HOSTED,
					}),
				),
				and(
					eq(projectTable.clientID, params.clientID),
					or(
						...(session.private?.group_ids?.map((id) =>
							eq(projectTable.owner_group_id, id),
						) || []),
					),
				),
			),
		)
		.limit(1)
		.get();

	if (!existing)
		return {
			success: false,
			error: "Project not found",
		};

	// Clean up all orphan records associated with this project
	await Promise.allSettled([
		db.delete(WebHookTable).where(eq(WebHookTable.clientID, params.clientID)),
		db.delete(totpTable).where(eq(totpTable.clientID, params.clientID)),
		db
			.delete(totpTokenTable)
			.where(eq(totpTokenTable.clientID, params.clientID)),
		db
			.delete(webauthnCredentialsTable)
			.where(eq(webauthnCredentialsTable.clientID, params.clientID)),
		db
			.delete(webauthnChallengesTable)
			.where(eq(webauthnChallengesTable.clientID, params.clientID)),
		db
			.delete(webAuthnTokenAccessTable)
			.where(eq(webAuthnTokenAccessTable.clientID, params.clientID)),
		db
			.delete(WebUiInviteLinkTable)
			.where(eq(WebUiInviteLinkTable.clientID, params.clientID)),
	]);

	await db
		.delete(projectTable)
		.where(eq(projectTable.clientID, params.clientID));

	const cfClient = createClient(env);
	try {
		await deleteCustomDomainForProject(
			env,
			cfClient,
			existing.cloudflareDomaineID,
		);
	} catch (error) {
		console.error(
			`Failed to delete CF domain ${existing.cloudflareDomaineID}:`,
			error,
		);
	}

	try {
		await DeleteOTFusersTable(params.clientID, env.PROJECT_DB);
		return { success: true };
	} catch (_error) {
		return {
			success: false,
			error: "Failed to delete associated user table",
		};
	}
}
