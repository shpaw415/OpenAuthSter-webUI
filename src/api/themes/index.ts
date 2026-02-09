import { getContext } from "frame-master-plugin-cloudflare-pages-functions-action/context";
import { uiStyleTable } from "openauth-webui-shared-types/database";
import { drizzle, eq } from "openauth-webui-shared-types/drizzle";
import type { Theme } from "@openauthjs/openauth/ui/theme";
import { createClient } from "@auth";

export type UITheme = {
  id: string;
  themeData: Theme;
};

// GET /api/themes - List all UI themes
export async function GET(): Promise<{
  success: boolean;
  error?: string;
  data: UITheme[];
}> {
  const ctx = getContext<Env, any, any>(arguments);
  const { request, env } = ctx;
  const auth = await createClient().setTokenFromRequest(
    request as unknown as Request,
  );
  if (auth.isAuthenticated === false)
    return {
      success: false,
      error: "Unauthorized",
      data: [],
    };

  const db = drizzle(env.PROJECT_DB);
  const themes = await db.select().from(uiStyleTable);

  return {
    success: true,
    data: themes.map((t) => ({
      id: t.id,
      themeData: t.themeData as Theme,
    })),
  };
}

export type CreateThemeParams = {
  id: string;
  themeData: Theme;
};

// POST /api/themes - Create a new UI theme
export async function POST(params: CreateThemeParams): Promise<{
  success: boolean;
  error?: string;
  data?: UITheme;
}> {
  const ctx = getContext<Env, any, any>(arguments);
  const { request, env } = ctx;
  const auth = await createClient().setTokenFromRequest(
    request as unknown as Request,
  );
  if (auth.isAuthenticated === false)
    return {
      success: false,
      error: "Unauthorized",
    };

  try {
    const { id, themeData } = params;

    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return {
        success: false,
        error: "Invalid or missing theme ID",
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

    // Check if theme already exists
    const existing = await db
      .select()
      .from(uiStyleTable)
      .where(eq(uiStyleTable.id, id.trim()))
      .limit(1);

    if (existing.length > 0) {
      return {
        success: false,
        error: "A theme with this ID already exists",
      };
    }

    const newTheme = {
      id: id.trim(),
      themeData: themeData as unknown as string,
    };

    await db.insert(uiStyleTable).values(newTheme);

    return {
      success: true,
      data: {
        id: newTheme.id,
        themeData: themeData,
      },
    };
  } catch (err) {
    console.error("Error creating theme:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create theme",
    };
  }
}
