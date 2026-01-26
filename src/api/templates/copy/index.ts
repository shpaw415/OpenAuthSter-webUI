import { getContext } from "frame-master-plugin-cloudflare-pages-functions-action/context";
import { WebUiCopyTemplateTable } from "openauth-webui-shared-types/database";
import { drizzle } from "openauth-webui-shared-types/drizzle";
import { requireAuth } from "../../../server-utils";

export type CopyTemplate = {
  name: string;
  providerType: "code" | "password";
  copyData: Record<string, string>;
  created_at: string;
  updated_at: string;
};

// GET /api/copy - List all copy templates
export async function GET(): Promise<{
  success: boolean;
  error?: string;
  data: CopyTemplate[];
}> {
  const ctx = getContext<Env, any, any>(arguments);
  const { request, env } = ctx;
  const auth = await requireAuth(request as unknown as Request);
  if (auth instanceof Response)
    return {
      success: false,
      error: "Unauthorized",
      data: [],
    };

  const db = drizzle(env.PROJECT_DB);
  const templates = await db.select().from(WebUiCopyTemplateTable);

  return {
    success: true,
    data: templates.map((t) => ({
      ...t,
      providerType: t.providerType as "code" | "password",
      copyData: t.copyData as Record<string, string>,
    })),
  };
}

export type CreateCopyTemplateParams = {
  name: string;
  providerType: "code" | "password";
  copyData: Record<string, string>;
};

// POST /api/copy - Create a new copy template
export async function POST(params: CreateCopyTemplateParams): Promise<{
  success: boolean;
  error?: string;
  data?: CopyTemplate;
}> {
  const ctx = getContext<Env, any, any>(arguments);
  const { request, env } = ctx;
  const auth = await requireAuth(request as unknown as Request);
  if (auth instanceof Response)
    return {
      success: false,
      error: "Unauthorized",
    };

  try {
    const { name, providerType, copyData } = params;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return {
        success: false,
        error: "Invalid or missing template name",
      };
    }

    if (!providerType || !["code", "password"].includes(providerType)) {
      return {
        success: false,
        error: "Invalid provider type. Must be 'code' or 'password'",
      };
    }

    if (!copyData || typeof copyData !== "object") {
      return {
        success: false,
        error: "Invalid or missing copy data",
      };
    }

    const db = drizzle(env.PROJECT_DB);
    const now = new Date().toISOString();

    const newTemplate = {
      name: name.trim(),
      providerType,
      copyData: copyData as any,
      created_at: now,
      updated_at: now,
    };

    await db.insert(WebUiCopyTemplateTable).values(newTemplate);

    return {
      success: true,
      data: {
        ...newTemplate,
        copyData,
      },
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to create copy template",
    };
  }
}
