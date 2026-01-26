import { eq, drizzle } from "openauth-webui-shared-types/drizzle";
import type {
  Project,
  ProviderConfig,
  ProjectData,
} from "openauth-webui-shared-types";
import { projectTable } from "openauth-webui-shared-types/database";

import { requireAuth } from "../../server-utils";
import { getContext } from "frame-master-plugin-cloudflare-pages-functions-action/context";

// GET /projects/manage - Get a single project
export async function GET(params: {
  clientID: string;
}): Promise<{ success: boolean; data?: Project; error?: string }> {
  const ctx = getContext<Env, any, any>(arguments);

  const auth = await requireAuth(ctx.request as unknown as Request);
  if (auth instanceof Response)
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
    data: {
      ...project,
      providers_data:
        typeof project.providers_data === "string"
          ? JSON.parse(project.providers_data)
          : project.providers_data,
      projectData:
        typeof project.projectData === "string"
          ? JSON.parse(project.projectData)
          : project.projectData || {},
    } as Project,
  };
}

type UpdateResponse = {
  success: boolean;
  error?: string;
  data?: Project;
};

export type updateProjectParams = {
  clientID: string;
  data: {
    active?: boolean;
    providers_data?: ProviderConfig[];
    themeId?: string | null;
    emailTemplateId?: string | null;
    projectData?: ProjectData;
  };
};

// PUT /projects/manage - Update a project
export async function PUT(
  params: updateProjectParams,
): Promise<UpdateResponse> {
  const ctx = getContext<Env, any, any>(arguments);
  const { request, env } = ctx;
  const auth = await requireAuth(request as unknown as Request);
  if (auth instanceof Response)
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
      data: {
        ...updated,
        providers_data:
          typeof updated.providers_data === "string"
            ? JSON.parse(updated.providers_data)
            : updated.providers_data,
        projectData:
          typeof updated.projectData === "string"
            ? JSON.parse(updated.projectData)
            : updated.projectData || {},
      } as Project,
    };
  } catch (error) {
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
  const auth = await requireAuth(request as unknown as Request);
  if (auth instanceof Response)
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
    .limit(1);

  if (existing.length === 0)
    return {
      success: false,
      error: "Project not found",
    };

  await db
    .delete(projectTable)
    .where(eq(projectTable.clientID, params.clientID));

  return { success: true };
}
