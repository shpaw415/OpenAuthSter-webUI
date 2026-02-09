import { eq, drizzle } from "openauth-webui-shared-types/drizzle";
import { type Project, parseDBProject } from "openauth-webui-shared-types";
import {
  DeleteOTFusersTable,
  projectTable,
} from "openauth-webui-shared-types/database";

import { createClient as createOpenAuthsterClient } from "@auth";
import { getContext } from "frame-master-plugin-cloudflare-pages-functions-action/context";
import { createClient, deleteCustomDomainForProject } from "../../cloudflare";
import { insertLog } from "openauth-webui-shared-types/database";

// GET /projects/manage - Get a single project
export async function GET(params: {
  clientID: string;
}): Promise<{ success: boolean; data?: Project; error?: string }> {
  const ctx = getContext<Env, any, any>(arguments);

  const auth = await createOpenAuthsterClient().setTokenFromRequest(
    ctx.request as unknown as Request,
  );
  if (auth.isAuthenticated === false)
    return {
      success: false,
      error: "Unauthorized",
    };

  const db = drizzle(ctx.env.PROJECT_DB);
  const projects = await db
    .select()
    .from(projectTable)
    .where(eq(projectTable.clientID, params.clientID))
    .limit(1);

  const project = projects.at(0);

  if (!project) {
    return {
      success: false,
      error: "Project not found",
    };
  }

  return {
    success: true,
    data: parseDBProject(project),
  };
}

type UpdateResponse = {
  success: boolean;
  error?: string;
  data?: Project;
};

export type updateProjectParams = {
  clientID: string;
  data: Partial<Omit<Project, "clientID" | "created_at">>;
};

// PUT /projects/manage - Update a project
export async function PUT(
  params: updateProjectParams,
): Promise<UpdateResponse> {
  const ctx = getContext<Env, any, any>(arguments);
  const { request, env } = ctx;
  const auth = await createOpenAuthsterClient().setTokenFromRequest(
    request as unknown as Request,
  );
  if (auth.isAuthenticated === false)
    return {
      success: false,
      error: "Unauthorized",
    };

  try {
    const db = drizzle(env.PROJECT_DB);

    // Check if project exists
    const existing = (
      await db
        .select()
        .from(projectTable)
        .where(eq(projectTable.clientID, params.clientID))
        .limit(1)
    ).at(0);

    if (!existing) {
      return {
        success: false,
        error: "Project not found",
      };
    }

    const updates: Record<string, any> = {};
    if (typeof params.data.active === "boolean") {
      updates.active = params.data.active;
    }
    if (params.data.providers_data !== undefined) {
      updates.providers_data = JSON.stringify(params.data.providers_data);
    }
    if (params.data.themeId !== undefined) {
      updates.themeId = params.data.themeId;
    }
    if (params.data.emailTemplateId !== undefined) {
      updates.emailTemplateId = params.data.emailTemplateId;
    }
    if (params.data.projectData !== undefined) {
      updates.projectData = JSON.stringify(params.data.projectData);
    }
    if (params.data.codeMode !== undefined) {
      updates.codeMode = params.data.codeMode;
    }
    if (params.data.originURL !== undefined) {
      updates.originURL = params.data.originURL;
    }

    if (Object.keys(updates).length === 0)
      return {
        success: false,
        error: "No valid fields to update",
      };

    await db
      .update(projectTable)
      .set(updates)
      .where(eq(projectTable.clientID, params.clientID));

    // Fetch updated project
    const updatedProjects = await db
      .select()
      .from(projectTable)
      .where(eq(projectTable.clientID, params.clientID))
      .limit(1);

    const updated = updatedProjects.at(0);

    if (!updated)
      return {
        success: false,
        error: "Project not found after update",
      };

    return {
      success: true,
      data: parseDBProject(updated),
    };
  } catch (error) {
    insertLog({
      type: "error",
      clientID: env.PUBLIC_CLIENT_ID,
      message: error instanceof Error ? error.message : String(error),
      database: env.PROJECT_DB,
      endpoint: "/api/projects",
    });
    return {
      success: false,
      error: "Invalid request body",
    };
  }
}

// DELETE /projects/manage - Delete a project
export async function DELETE(params: {
  clientID: string;
}): Promise<{ success: boolean; error?: string }> {
  const ctx = getContext<Env, any, any>(arguments);
  const { request, env } = ctx;
  const auth = await createOpenAuthsterClient().setTokenFromRequest(
    request as unknown as Request,
  );
  if (auth.isAuthenticated === false)
    return {
      success: false,
      error: "Unauthorized",
    };

  const db = drizzle(env.PROJECT_DB);

  // Check if project exists
  const existing = await db
    .select()
    .from(projectTable)
    .where(eq(projectTable.clientID, params.clientID))
    .limit(1)
    .get();

  if (!existing)
    return {
      success: false,
      error: "Project not found",
    };

  await db
    .delete(projectTable)
    .where(eq(projectTable.clientID, params.clientID));

  const cfClient = createClient(env);
  await deleteCustomDomainForProject(
    env,
    cfClient,
    existing.cloudflareDomaineID,
  );

  try {
    await DeleteOTFusersTable(params.clientID, env.PROJECT_DB);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "Failed to delete associated user table",
    };
  }
}
