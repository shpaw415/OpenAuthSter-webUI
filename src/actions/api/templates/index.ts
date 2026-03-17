import type { RequestDataContext } from "@auth";
import { getContext } from "frame-master-plugin-cloudflare-pages-functions-action/context";
import type { EmailTemplateProps } from "openauth-webui-shared-types";
import { emailTemplatesTable } from "openauth-webui-shared-types/database";
import { drizzle, eq } from "openauth-webui-shared-types/drizzle";

export type EmailTemplate = EmailTemplateProps & {
	owner_id: string;
	created_at: string;
	updated_at: string;
};

// GET /api/templates - List all email templates
export async function GET(): Promise<{
	success: boolean;
	error?: string;
	data: EmailTemplate[];
}> {
	const ctx = getContext<Env, string, RequestDataContext>(arguments);
	const { env } = ctx;

	const currentUserId = (await ctx.data.client.getMetaData()).id;

	if (!currentUserId) {
		return {
			success: false,
			error: "Unauthorized",
			data: [],
		};
	}

	const db = drizzle(env.PROJECT_DB);
	const templates = await db
		.select()
		.from(emailTemplatesTable)
		.where(eq(emailTemplatesTable.owner_id, currentUserId));

	return {
		success: true,
		data: templates,
	};
}

export type CreateTemplateParams = EmailTemplateProps;

// POST /api/templates - Create a new email template
export async function POST(params: CreateTemplateParams): Promise<{
	success: boolean;
	error?: string;
	data?: EmailTemplate;
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

		const { name, body, subject } = params;

		if (!name || typeof name !== "string" || name.trim().length === 0) {
			return {
				success: false,
				error: "Invalid or missing template name",
			};
		}

		if (!subject || typeof subject !== "string") {
			return {
				success: false,
				error: "Invalid or missing subject",
			};
		}

		if (!body || typeof body !== "string") {
			return {
				success: false,
				error: "Invalid or missing body",
			};
		}

		const db = drizzle(env.PROJECT_DB);
		const now = new Date().toISOString();

		const newTemplate: typeof emailTemplatesTable.$inferInsert = {
			name: name.trim(),
			body,
			subject,
			owner_id: currentUserId,
			owner_group_id: crypto.randomUUID(),
			created_at: now,
			updated_at: now,
		};

		await db.insert(emailTemplatesTable).values(newTemplate);

		return {
			success: true,
			data: newTemplate,
		};
	} catch (err) {
		return {
			success: false,
			error: err instanceof Error ? err.message : "Failed to create template",
		};
	}
}
