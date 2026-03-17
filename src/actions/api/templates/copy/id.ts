import type { RequestDataContext } from "@auth";
import { getContext } from "frame-master-plugin-cloudflare-pages-functions-action/context";
import type { CopyDataSelection } from "openauth-webui-shared-types";
import {
	parseDBCopyTemplate,
	WebUiCopyTemplateTable,
} from "openauth-webui-shared-types/database";
import { and, drizzle, eq } from "openauth-webui-shared-types/drizzle";

export type CopyTemplate = ReturnType<typeof parseDBCopyTemplate>;

// GET /api/copy/[name] - Get copy template by name
export async function GET(params: { name: string }): Promise<{
	success: boolean;
	error?: string;
	data?: CopyTemplate;
}> {
	const ctx = getContext<Env, string, RequestDataContext>(arguments);
	const { env } = ctx;

	const currentUserId = (await ctx.data.client.getMetaData()).id;

	if (!currentUserId) {
		return {
			success: false,
			error: "Unauthorized",
		};
	}

	const db = drizzle(env.PROJECT_DB);
	const template = await db
		.select()
		.from(WebUiCopyTemplateTable)
		.where(
			and(
				eq(WebUiCopyTemplateTable.name, params.name),
				eq(WebUiCopyTemplateTable.owner_id, currentUserId),
			),
		)
		.limit(1)
		.get();

	if (!template)
		return {
			success: false,
			error: "Copy template not found",
		};

	return {
		success: true,
		data: parseDBCopyTemplate(template),
	};
}

export type UpdateCopyTemplateParams = {
	name: string;
	data: {
		copyData?: Partial<CopyDataSelection>;
	};
};

// PUT /api/copy/[name] - Update copy template by name
export async function PUT(params: UpdateCopyTemplateParams): Promise<{
	success: boolean;
	error?: string;
	data?: CopyTemplate;
}> {
	const ctx = getContext<Env, string, RequestDataContext>(arguments);
	const { env } = ctx;

	try {
		const currentUserId = (await ctx.data.client.getMetaData()).id;

		if (!currentUserId) {
			return {
				success: false,
				error: "Unauthorized",
			};
		}

		const db = drizzle(env.PROJECT_DB);

		const existing = await db
			.select()
			.from(WebUiCopyTemplateTable)
			.where(
				and(
					eq(WebUiCopyTemplateTable.name, params.name),
					eq(WebUiCopyTemplateTable.owner_id, currentUserId),
				),
			)
			.limit(1)
			.get();

		if (!existing) {
			return {
				success: false,
				error: "Copy template not found",
			};
		}

		const updateData: {
			updated_at: string;
			copyData?: Partial<CopyDataSelection>;
		} = {
			updated_at: new Date().toISOString(),
		};

		if (params.data.copyData !== undefined) {
			updateData.copyData = params.data.copyData;
		}

		await db
			.update(WebUiCopyTemplateTable)
			.set(updateData)
			.where(
				and(
					eq(WebUiCopyTemplateTable.name, params.name),
					eq(WebUiCopyTemplateTable.owner_id, currentUserId),
				),
			);

		const updated = await db
			.select()
			.from(WebUiCopyTemplateTable)
			.where(
				and(
					eq(WebUiCopyTemplateTable.name, params.name),
					eq(WebUiCopyTemplateTable.owner_id, currentUserId),
				),
			)
			.limit(1)
			.get();

		return {
			success: true,
			data: updated ? parseDBCopyTemplate(updated) : undefined,
		};
	} catch (err) {
		return {
			success: false,
			error:
				err instanceof Error ? err.message : "Failed to update copy template",
		};
	}
}

// DELETE /api/copy/[name] - Delete copy template by name
export async function DELETE(params: { name: string }): Promise<{
	success: boolean;
	error?: string;
}> {
	const ctx = getContext<Env, string, RequestDataContext>(arguments);
	const { env } = ctx;

	try {
		const currentUserId = (await ctx.data.client.getMetaData()).id;

		if (!currentUserId) {
			return {
				success: false,
				error: "Unauthorized",
			};
		}

		const db = drizzle(env.PROJECT_DB);

		const existing = await db
			.select()
			.from(WebUiCopyTemplateTable)
			.where(
				and(
					eq(WebUiCopyTemplateTable.name, params.name),
					eq(WebUiCopyTemplateTable.owner_id, currentUserId),
				),
			)
			.limit(1)
			.get();

		if (!existing) {
			return {
				success: false,
				error: "Copy template not found",
			};
		}

		await db
			.delete(WebUiCopyTemplateTable)
			.where(
				and(
					eq(WebUiCopyTemplateTable.name, params.name),
					eq(WebUiCopyTemplateTable.owner_id, currentUserId),
				),
			);

		return { success: true };
	} catch (err) {
		return {
			success: false,
			error:
				err instanceof Error ? err.message : "Failed to delete copy template",
		};
	}
}
