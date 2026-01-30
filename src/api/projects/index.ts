import {
  parseDBProject,
  type Project,
  type ProviderConfig,
} from "openauth-webui-shared-types";
import {
  createUserTable,
  projectTable,
} from "openauth-webui-shared-types/database";
import { drizzle, eq } from "openauth-webui-shared-types/drizzle";
import { requireAuth } from "../../server-utils";
import { getContext } from "frame-master-plugin-cloudflare-pages-functions-action/context";
import { createClient, createCustomDomainForProject } from "../../cloudflare";

// GET /api/projects - List all projects
export async function GET(): Promise<{
  success: boolean;
  error?: string;
  data: Project[];
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
  const projects = await db.select().from(projectTable);

  return {
    success: true,
    data: projects.map(parseDBProject),
  };
}

export type createProjectParams = {
  clientID: string;
  providers_data?: ProviderConfig[];
};

export function isClientIdValid(name: string) {
  // SQLite table name safe: must start with letter/underscore, only alphanumeric + underscore
  const regex = /^[a-zA-Z_][a-zA-Z0-9_]{2,29}$/;
  return regex.test(name);
}

// POST /api/projects - Create a new project
export async function POST(params: {
  clientID: string;
  providers_data?: ProviderConfig[];
}): Promise<{ success: boolean; error?: string; data?: Project }> {
  const ctx = getContext<Env, any, any>(arguments);
  const { request, env } = ctx;
  const auth = await requireAuth(request as unknown as Request);
  if (auth instanceof Response)
    return {
      success: false,
      error: "Unauthorized",
    };

  try {
    const { clientID, providers_data = [] } = params;

    if (!isClientIdValid(clientID)) {
      return {
        success: false,
        error:
          "Invalid clientID format only alphanumeric and underscores, 3-30 characters, must start with a letter or underscore",
      };
    }

    if (!clientID || typeof clientID !== "string") {
      return {
        success: false,
        error: "Invalid or missing clientID",
      };
    }

    // Check if project already exists
    const db = drizzle(env.PROJECT_DB);
    const existing = await db
      .select()
      .from(projectTable)
      .where(eq(projectTable.clientID, clientID))
      .limit(1);

    if (existing.length > 0) {
      return {
        success: false,
        error: "Project with this clientID already exists",
      };
    }

    const cfClient = createClient(env);
    const cfDomaineCreate = await createCustomDomainForProject(env, cfClient);

    if (!cfDomaineCreate || !cfDomaineCreate.id || !cfDomaineCreate.hostname) {
      return {
        success: false,
        error: `Failed to create Cloudflare custom domain for project. Cloudflare info: ${JSON.stringify(
          cfDomaineCreate,
        )}`,
      };
    }

    const newProject: Project = {
      clientID: clientID,
      created_at: new Date().toISOString(),
      active: true,
      providers_data: JSON.stringify(providers_data) as any,
      codeMode: "email",
      originURL: "",
      authEndpointURL: cfDomaineCreate.hostname,
      cloudflareDomaineID: cfDomaineCreate.id,
      secret: [
        crypto.randomUUID(),
        crypto.randomUUID(),
        crypto.randomUUID(),
      ].join("-"),
    };

    const [insertedProject] = await db
      .insert(projectTable)
      .values(newProject)
      .returning();

    if (!insertedProject) {
      return {
        success: false,
        error: "Failed to create project",
      };
    }

    return await createUserTable(clientID, env.PROJECT_DB)
      .then(() => ({ success: true, data: parseDBProject(insertedProject) }))
      .catch((err) => {
        console.error(
          `Failed to create user table for project ${clientID}: ${err}`,
        );
        return {
          success: false,
          error: "Failed to create user table for project",
        };
      });
  } catch (error) {
    return {
      success: false,
      error: "Invalid request body",
    };
  }
}
