import { getContext } from "frame-master-plugin-cloudflare-pages-functions-action/context";
import { uiStyleTable } from "openauth-webui-shared-types/database";
import { and, drizzle, eq } from "openauth-webui-shared-types/drizzle";
import type { Theme } from "@openauthjs/openauth/ui/theme";
import type { RequestDataContext } from "@auth";

export type UITheme = {
	id: number;
	name: string;
	themeData: Theme;
};

// GET /api/themes - List all UI themes for current user
export async function GET(): Promise<{
	success: boolean;
	error?: string;
	data: UITheme[];
}> {
	const ctx = getContext<Env, any, any>(arguments);
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
	const themes = (await db
		.select({
			id: uiStyleTable.id,
			name: uiStyleTable.name,
			themeData: uiStyleTable.themeData,
		})
		.from(uiStyleTable)
		.where(eq(uiStyleTable.owner_id, currentUserId))) as UITheme[];

	return {
		success: true,
		data: themes,
	};
}

export type CreateThemeParams = {
	name: string;
	themeData: Theme;
};

// POST /api/themes - Create a new UI theme
export async function POST(params: CreateThemeParams): Promise<{
	success: boolean;
	error?: string;
	data?: UITheme;
}> {
	const ctx = getContext<Env, any, RequestDataContext>(arguments);
	const { env } = ctx;

	try {
		const { name, themeData } = params;

		if (!name || typeof name !== "string" || name.trim().length === 0) {
			return {
				success: false,
				error: "Invalid or missing theme name",
			};
		}

		if (!themeData || typeof themeData !== "object") {
			return {
				success: false,
				error: "Invalid or missing theme data",
			};
		}

		if (!themeData.primary) {
			return {
				success: false,
				error: "Primary color is required",
			};
		}

		const db = drizzle(env.PROJECT_DB);

		const userId = (await ctx.data.client.getMetaData()).id;

		if (!userId) {
			return {
				success: false,
				error: "Unauthorized",
			};
		}

		// Check if theme already exists
		const existing = await db
			.select()
			.from(uiStyleTable)
			.where(
				and(
					eq(uiStyleTable.name, name.trim()),
					eq(uiStyleTable.owner_id, userId),
				),
			)
			.limit(1);

		if (existing.length > 0) {
			return {
				success: false,
				error: "A theme with this name already exists",
			};
		}

		return {
			success: true,
			data: (
				await db
					.insert(uiStyleTable)
					.values({
						name: name.trim(),
						themeData: themeData,
						owner_id: userId,
					})
					.returning({
						id: uiStyleTable.id,
						name: uiStyleTable.name,
						themeData: uiStyleTable.themeData,
					})
			).at(0) as UITheme,
		};
	} catch (err) {
		console.error("Error creating theme:", err);
		return {
			success: false,
			error: err instanceof Error ? err.message : "Failed to create theme",
		};
	}
}
