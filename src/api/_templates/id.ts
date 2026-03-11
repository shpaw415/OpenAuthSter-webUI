import { getContext } from "frame-master-plugin-cloudflare-pages-functions-action/context";
import { emailTemplatesTable } from "openauth-webui-shared-types/database";
import { drizzle, eq } from "openauth-webui-shared-types/drizzle";
import { createClient } from "@auth";
import type { EmailTemplate } from "./index";
import type { EmailTemplateProps } from "openauth-webui-shared-types";

// GET /api/templates/[name] - Get template by name
export async function GET(params: { name: string }): Promise<{
  success: boolean;
  error?: string;
  data?: EmailTemplate;
}> {
  const ctx = getContext<Env, any, any>(arguments);
  const { env } = ctx;

  const db = drizzle(env.PROJECT_DB);
  const template = await db
    .select()
    .from(emailTemplatesTable)
    .where(eq(emailTemplatesTable.name, params.name))
    .limit(1)
    .get();

  if (!template)
    return {
      success: false,
      error: "Template not found",
    };

  return {
    success: true,
    data: template,
  };
}

export type UpdateTemplateParams = {
  name: string;
  data: Partial<Omit<EmailTemplateProps, "name">>;
};

// PUT /api/templates/[name] - Update template by name
export async function PUT(params: UpdateTemplateParams): Promise<{
  success: boolean;
  error?: string;
  data?: EmailTemplate;
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
      .from(emailTemplatesTable)
      .where(eq(emailTemplatesTable.name, params.name))
      .limit(1)
      .get();

    if (!existing) {
      return {
        success: false,
        error: "Template not found",
      };
    }

    const now = new Date().toISOString();
    const updateData = {
      ...params.data,
      updated_at: now,
    };

    await db
      .update(emailTemplatesTable)
      .set(updateData)
      .where(eq(emailTemplatesTable.name, params.name));

    const updated = await db
      .select()
      .from(emailTemplatesTable)
      .where(eq(emailTemplatesTable.name, params.name))
      .limit(1)
      .get();

    return {
      success: true,
      data: updated,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update template",
    };
  }
}

// DELETE /api/templates/[name] - Delete template by name
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
      .from(emailTemplatesTable)
      .where(eq(emailTemplatesTable.name, params.name))
      .limit(1)
      .get();

    if (!existing) {
      return {
        success: false,
        error: "Template not found",
      };
    }

    await db
      .delete(emailTemplatesTable)
      .where(eq(emailTemplatesTable.name, params.name));

    return {
      success: true,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete template",
    };
  }
}
