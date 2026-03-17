import { getContext } from "frame-master-plugin-cloudflare-pages-functions-action/context";
import {
  WebUiCopyTemplateTable,
  parseDBCopyTemplate,
} from "openauth-webui-shared-types/database";
import { and, drizzle, eq } from "openauth-webui-shared-types/drizzle";
import type { CopyDataSelection } from "openauth-webui-shared-types";
import type { CopyTemplate } from "./index";
import type { RequestDataContext } from "@auth";

// GET /api/copy/[name] - Get copy template by name
export async function GET(params: { name: string }): Promise<{
  success: boolean;
  error?: string;
  data?: CopyTemplate;
}> {
  const ctx = getContext<Env, any, RequestDataContext>(arguments);
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
  const ctx = getContext<Env, any, RequestDataContext>(arguments);
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

    const updateData: Record<string, any> = {
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
  const ctx = getContext<Env, any, RequestDataContext>(arguments);
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
