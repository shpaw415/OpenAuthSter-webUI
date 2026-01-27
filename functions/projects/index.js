import {
  drizzle,
  eq,
  getContext,
  projectTable,
  requireAuth
} from "../chunk-1jym31gh.js";
import"../chunk-4d009j3y.js";
import {
  parseDBProject
} from "../chunk-c97z6qgd.js";
import"../chunk-0t41ngqp.js";

// src/api/projects/index.ts
async function GET() {
  const ctx = getContext(arguments);
  const { request, env } = ctx;
  const auth = await requireAuth(request);
  if (auth instanceof Response)
    return {
      success: false,
      error: "Unauthorized",
      data: []
    };
  const db = drizzle(env.PROJECT_DB);
  const projects = await db.select().from(projectTable);
  return {
    success: true,
    data: projects.map(parseDBProject)
  };
}
function isClientIdValid(name) {
  const regex = /^[a-zA-Z_][a-zA-Z0-9_]{2,29}$/;
  return regex.test(name);
}
async function POST(params) {
  const ctx = getContext(arguments);
  const { request, env } = ctx;
  const auth = await requireAuth(request);
  if (auth instanceof Response)
    return {
      success: false,
      error: "Unauthorized"
    };
  try {
    const { clientID, providers_data = [] } = params;
    if (!isClientIdValid(clientID)) {
      return {
        success: false,
        error: "Invalid clientID format only alphanumeric and underscores, 3-30 characters, must start with a letter or underscore"
      };
    }
    if (!clientID || typeof clientID !== "string") {
      return {
        success: false,
        error: "Invalid or missing clientID"
      };
    }
    const db = drizzle(env.PROJECT_DB);
    const existing = await db.select().from(projectTable).where(eq(projectTable.clientID, clientID)).limit(1);
    if (existing.length > 0) {
      return {
        success: false,
        error: "Project with this clientID already exists"
      };
    }
    const newProject = {
      clientID,
      created_at: new Date().toISOString(),
      active: true,
      providers_data: JSON.stringify(providers_data),
      codeMode: "email"
    };
    const [insertedProject] = await db.insert(projectTable).values(newProject).returning();
    if (!insertedProject) {
      return {
        success: false,
        error: "Failed to create project"
      };
    }
    return {
      success: true,
      data: parseDBProject(insertedProject)
    };
  } catch (error) {
    return {
      success: false,
      error: "Invalid request body"
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
  isClientIdValid,
  POST,
  GET
};
