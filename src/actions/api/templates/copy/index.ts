import { getContext } from "frame-master-plugin-cloudflare-pages-functions-action/context";
import {
  WebUiCopyTemplateTable,
  parseDBCopyTemplate,
} from "openauth-webui-shared-types/database";
import { drizzle } from "openauth-webui-shared-types/drizzle";
import {
  insertLog,
  PUBLIC_CLIENT_ID,
  type CopyDataSelection,
} from "openauth-webui-shared-types";
import type { RequestDataContext } from "@auth";

export type CopyTemplate = {
  name: string;
  copyData: Partial<CopyDataSelection>;
  owner: string;
  created_at: string;
  updated_at: string;
};

// GET /api/copy - List all copy templates
export async function GET(): Promise<{
  success: boolean;
  error?: string;
  data?: ReturnType<typeof parseDBCopyTemplate>[];
}> {
  const ctx = getContext<Env, any, any>(arguments);
  const { env } = ctx;

  const db = drizzle(env.PROJECT_DB);
  const templates = await db.select().from(WebUiCopyTemplateTable);

  return {
    success: true,
    data: templates.map((t) => parseDBCopyTemplate(t)),
  };
}

export type CreateCopyTemplateParams = {
  name: string;
  copyData: Partial<CopyDataSelection>;
};

// POST /api/copy - Create a new copy template
export async function POST(params: CreateCopyTemplateParams): Promise<{
  success: boolean;
  error?: string;
  data?: CopyTemplate;
}> {
  const ctx = getContext<Env, any, RequestDataContext>(arguments);
  const { env } = ctx;

  try {
    const { name, copyData } = params;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return {
        success: false,
        error: "Invalid or missing template name",
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

    const userData = await ctx.data.client.getMetaData();

    if (!userData || !userData.id) {
      insertLog({
        type: "error",
        message: "Unauthorized attempt to create copy template",
        database: env.PROJECT_DB,
        clientID: PUBLIC_CLIENT_ID,
        context: {
          action: "create_copy_template",
          userData,
        },
      });

      return {
        success: false,
        error: "Unauthorized",
      };
    }

    await db.insert(WebUiCopyTemplateTable).values({
      name: name.trim(),
      owner: userData.id!,
      copyData: copyData,
      created_at: now,
      updated_at: now,
    });

    return {
      success: true,
      data: {
        name: name.trim(),
        copyData,
        created_at: now,
        updated_at: now,
        owner: userData.id!,
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
