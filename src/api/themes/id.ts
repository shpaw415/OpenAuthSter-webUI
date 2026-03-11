import { getContext } from "frame-master-plugin-cloudflare-pages-functions-action/context";
import { uiStyleTable } from "openauth-webui-shared-types/database";
import { drizzle, eq } from "openauth-webui-shared-types/drizzle";
import type { Theme } from "@openauthjs/openauth/ui/theme";
import type { UITheme } from "./index";

// GET /api/themes/:id - Get a specific theme
export async function GET(params: { id: string }): Promise<{
  success: boolean;
  error?: string;
  data?: UITheme;
}> {
  const ctx = getContext<Env, any, any>(arguments);
  const { env } = ctx;

  const { id } = params;

  if (!id) {
    return {
      success: false,
      error: "Theme ID is required",
    };
  }

  const db = drizzle(env.PROJECT_DB);
  const themes = (
    await db.select().from(uiStyleTable).where(eq(uiStyleTable.id, id)).limit(1)
  ).at(0);
  if (!themes) {
    return {
      success: false,
      error: "Theme not found",
    };
  }

  return {
    success: true,
    data: {
      id: themes.id,
      themeData: themes.themeData as Theme,
    },
  };
}

export type UpdateThemeParams = {
  id: string;
  data: Partial<Theme>;
};

// PUT /api/themes/:id - Update a theme
export async function PUT(params: UpdateThemeParams): Promise<{
  success: boolean;
  error?: string;
  data?: UITheme;
}> {
  const ctx = getContext<Env, any, any>(arguments);
  const { env } = ctx;

  const { id, data } = params;

  if (!id) {
    return {
      success: false,
      error: "Theme ID is required",
    };
  }

  const db = drizzle(env.PROJECT_DB);

  // Get current theme
  const existing = await db
    .select()
    .from(uiStyleTable)
    .where(eq(uiStyleTable.id, id))
    .limit(1);

  if (existing.length === 0) {
    return {
      success: false,
      error: "Theme not found",
    };
  }

  const currentTheme =
    (existing.at(0)?.themeData as Theme | undefined) || ({} as Theme);
  const updatedTheme: Theme = {
    ...currentTheme,
    ...data,
  };

  await db
    .update(uiStyleTable)
    .set({
      themeData: updatedTheme as unknown as string,
    })
    .where(eq(uiStyleTable.id, id));

  return {
    success: true,
    data: {
      id,
      themeData: updatedTheme,
    },
  };
}

// DELETE /api/themes/:id - Delete a theme
export async function DELETE(params: { id: string }): Promise<{
  success: boolean;
  error?: string;
}> {
  const { env } = getContext<Env, any, any>(arguments);

  const { id } = params;

  if (!id) {
    return {
      success: false,
      error: "Theme ID is required",
    };
  }

  const db = drizzle(env.PROJECT_DB);

  // Check if theme exists
  const existing = await db
    .select()
    .from(uiStyleTable)
    .where(eq(uiStyleTable.id, id))
    .limit(1);

  if (existing.length === 0) {
    return {
      success: false,
      error: "Theme not found",
    };
  }

  await db.delete(uiStyleTable).where(eq(uiStyleTable.id, id));

  return {
    success: true,
  };
}
