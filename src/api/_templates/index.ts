import { getContext } from "frame-master-plugin-cloudflare-pages-functions-action/context";
import { emailTemplatesTable } from "openauth-webui-shared-types/database";
import { drizzle } from "openauth-webui-shared-types/drizzle";
import { createClient } from "@auth";
import type { EmailTemplateProps } from "openauth-webui-shared-types";

export type EmailTemplate = EmailTemplateProps & {
  created_at: string;
  updated_at: string;
};

// GET /api/templates - List all email templates
export async function GET(): Promise<{
  success: boolean;
  error?: string;
  data: EmailTemplate[];
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
  const templates = await db.select().from(emailTemplatesTable);

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

    const newTemplate: EmailTemplate = {
      name: name.trim(),
      body,
      subject,
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
