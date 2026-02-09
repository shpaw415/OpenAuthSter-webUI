import { getContext } from "frame-master-plugin-cloudflare-pages-functions-action/context";
import { WebUiCopyTemplateTable } from "openauth-webui-shared-types/database";
import { drizzle, eq } from "openauth-webui-shared-types/drizzle";
import { createClient } from "@auth";
import type { CopyTemplate } from "./index";

// GET /api/copy/[name] - Get copy template by name
export async function GET(params: { name: string }): Promise<{
  success: boolean;
  error?: string;
  data?: CopyTemplate;
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

  const db = drizzle(env.PROJECT_DB);
  const template = await db
    .select()
    .from(WebUiCopyTemplateTable)
    .where(eq(WebUiCopyTemplateTable.name, params.name))
    .limit(1)
    .get();

  if (!template)
    return {
      success: false,
      error: "Copy template not found",
    };

  return {
    success: true,
    data: {
      ...template,
      providerType: template.providerType as "code" | "password",
      copyData: template.copyData as Record<string, string>,
    },
  };
}

export type UpdateCopyTemplateParams = {
  name: string;
  data: {
    providerType?: "code" | "password";
    copyData?: Record<string, string>;
  };
};

// PUT /api/copy/[name] - Update copy template by name
export async function PUT(params: UpdateCopyTemplateParams): Promise<{
  success: boolean;
  error?: string;
  data?: CopyTemplate;
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
    const db = drizzle(env.PROJECT_DB);

    // Check if template exists
    const existing = await db
      .select()
      .from(WebUiCopyTemplateTable)
      .where(eq(WebUiCopyTemplateTable.name, params.name))
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

    if (params.data.providerType) {
      if (!["code", "password"].includes(params.data.providerType)) {
        return {
          success: false,
          error: "Invalid provider type. Must be 'code' or 'password'",
        };
      }
      updateData.providerType = params.data.providerType;
    }

    if (params.data.copyData) {
      updateData.copyData = params.data.copyData;
    }

    await db
      .update(WebUiCopyTemplateTable)
      .set(updateData)
      .where(eq(WebUiCopyTemplateTable.name, params.name));

    // Fetch updated template
    const updated = await db
      .select()
      .from(WebUiCopyTemplateTable)
      .where(eq(WebUiCopyTemplateTable.name, params.name))
      .limit(1)
      .get();

    return {
      success: true,
      data: updated
        ? {
            ...updated,
            providerType: updated.providerType as "code" | "password",
            copyData: updated.copyData as Record<string, string>,
          }
        : undefined,
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
    const db = drizzle(env.PROJECT_DB);

    // Check if template exists
    const existing = await db
      .select()
      .from(WebUiCopyTemplateTable)
      .where(eq(WebUiCopyTemplateTable.name, params.name))
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
      .where(eq(WebUiCopyTemplateTable.name, params.name));

    return {
      success: true,
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to delete copy template",
    };
  }
}
