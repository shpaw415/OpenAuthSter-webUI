import {
  createClient as createClient2,
  deleteCustomDomainForProject
} from "../chunk-p0enet3n.js";
import {
  DeleteOTFusersTable,
  drizzle,
  eq,
  getContext,
  insertLog,
  projectTable
} from "../chunk-gdyr7gn8.js";
import {
  createClient
} from "../chunk-fesjpn93.js";
import {
  parseDBProject
} from "../chunk-02drm0pp.js";
import"../chunk-5yjnn0bn.js";

// src/api/projects/manage.ts
async function GET(params) {
  const ctx = getContext(arguments);
  const auth = await createClient().setTokenFromRequest(ctx.request);
  if (auth.isAuthenticated === false)
    return {
      success: false,
      error: "Unauthorized"
    };
  const db = drizzle(ctx.env.PROJECT_DB);
  const projects = await db.select().from(projectTable).where(eq(projectTable.clientID, params.clientID)).limit(1);
  const project = projects.at(0);
  if (!project) {
    return {
      success: false,
      error: "Project not found"
    };
  }
  return {
    success: true,
    data: parseDBProject(project)
  };
}
async function PUT(params) {
  const ctx = getContext(arguments);
  const { request, env } = ctx;
  const auth = await createClient().setTokenFromRequest(request);
  if (auth.isAuthenticated === false)
    return {
      success: false,
      error: "Unauthorized"
    };
  try {
    const db = drizzle(env.PROJECT_DB);
    const existing = (await db.select().from(projectTable).where(eq(projectTable.clientID, params.clientID)).limit(1)).at(0);
    if (!existing) {
      return {
        success: false,
        error: "Project not found"
      };
    }
    const updates = {};
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
    if (params.data.registerOnInvite !== undefined) {
      updates.registerOnInvite = params.data.registerOnInvite ? 1 : 0;
    }
    if (Object.keys(updates).length === 0)
      return {
        success: false,
        error: "No valid fields to update"
      };
    await db.update(projectTable).set(updates).where(eq(projectTable.clientID, params.clientID));
    const updatedProjects = await db.select().from(projectTable).where(eq(projectTable.clientID, params.clientID)).limit(1);
    const updated = updatedProjects.at(0);
    if (!updated)
      return {
        success: false,
        error: "Project not found after update"
      };
    return {
      success: true,
      data: parseDBProject(updated)
    };
  } catch (error) {
    insertLog({
      type: "error",
      clientID: env.PUBLIC_CLIENT_ID,
      message: error instanceof Error ? error.message : String(error),
      database: env.PROJECT_DB,
      endpoint: "/api/projects"
    });
    return {
      success: false,
      error: "Invalid request body"
    };
  }
}
async function DELETE(params) {
  const ctx = getContext(arguments);
  const { request, env } = ctx;
  const auth = await createClient().setTokenFromRequest(request);
  if (auth.isAuthenticated === false)
    return {
      success: false,
      error: "Unauthorized"
    };
  const db = drizzle(env.PROJECT_DB);
  const existing = await db.select().from(projectTable).where(eq(projectTable.clientID, params.clientID)).limit(1).get();
  if (!existing)
    return {
      success: false,
      error: "Project not found"
    };
  await db.delete(projectTable).where(eq(projectTable.clientID, params.clientID));
  const cfClient = createClient2(env);
  await deleteCustomDomainForProject(env, cfClient, existing.cloudflareDomaineID);
  try {
    await DeleteOTFusersTable(params.clientID, env.PROJECT_DB);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "Failed to delete associated user table"
    };
  }
}
function parseData(formData) {
  const propsArray = [];
  if (!formData)
    return propsArray;
  const batchsIDs = [];
  for (const [key, value] of Array.from(formData.entries())) {
    if (key.startsWith("FILE_"))
      propsArray.push(value);
    else if (key.startsWith("FILES_")) {
      if (batchsIDs.includes(key))
        continue;
      batchsIDs.push(key);
      propsArray.push(formData.getAll(key));
    } else {
      propsArray.push(JSON.parse(decodeURI(value)));
    }
  }
  return propsArray;
}
function paramsFromURL(url) {
  const params = url.searchParams.entries().toArray().map(([_, v]) => v);
  return params.map((param) => JSON.parse(decodeURIComponent(param)));
}
async function WrapRequestHandler(context, endpoint) {
  const isServerAction = context.request.headers.get("x-server-action") === "true";
  if (!isServerAction) {
    return new Response("Not Found", { status: 404 });
  }
  const parsedData = context.request.method === "GET" || context.request.method === "HEAD" ? paramsFromURL(new URL(context.request.url)) : parseData(context.request.headers.get("content-type") ? await context.request.formData() : undefined);
  const missingProps = endpoint.length - parsedData.length;
  for (let i = 0;i < missingProps; i++) {
    parsedData.push(undefined);
  }
  parsedData.push(context);
  const result = await endpoint(...parsedData);
  switch (typeof result) {
    case "string":
    case "number":
    case "boolean":
    case "bigint":
      const res = new Response(JSON.stringify(result));
      res.headers.set("Content-Type", "application/json");
      res.headers.set("dataType", "json");
      return res;
    case "undefined":
      return new Response(null, { status: 204 });
    case "object":
      if (result instanceof Response) {
        result.headers.set("dataType", "response");
        return result;
      } else if (result instanceof Blob) {
        const res2 = new Response(await result.arrayBuffer());
        res2.headers.set("dataType", "blob");
        res2.headers.set("Content-Type", result.type);
        return res2;
      } else if (result instanceof File) {
        const res2 = new Response(await result.arrayBuffer());
        res2.headers.set("dataType", "file");
        res2.headers.set("Content-Type", result.type);
        res2.headers.set("fileData", JSON.stringify({
          name: result.name,
          lastModified: result.lastModified
        }));
        return res2;
      } else {
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json", dataType: "json" }
        });
      }
    default:
      throw new Error(`Unsupported return type from action: ${typeof result}`);
  }
}
var onRequest = async (context) => {
  const method = context.request.method;
  const options = {
    GET: typeof GET === "function" ? GET : undefined,
    POST: typeof POST === "function" ? POST : undefined,
    PUT: typeof PUT === "function" ? PUT : undefined,
    DELETE: typeof DELETE === "function" ? DELETE : undefined,
    PATCH: typeof PATCH === "function" ? PATCH : undefined,
    HEAD: typeof HEAD === "function" ? HEAD : undefined,
    OPTIONS: typeof OPTIONS === "function" ? OPTIONS : undefined
  };
  if (!options[method]) {
    return new Response(`Method "${method}" Not Allowed`, {
      status: 405
    });
  }
  return await WrapRequestHandler(context, options[method]);
};
export {
  onRequest,
  PUT,
  GET,
  DELETE
};
