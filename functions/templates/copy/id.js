import {
  WebUiCopyTemplateTable,
  drizzle,
  eq,
  getContext,
  requireAuth
} from "../../chunk-1jym31gh.js";
import"../../chunk-4d009j3y.js";
import"../../chunk-c97z6qgd.js";
import"../../chunk-0t41ngqp.js";

// src/api/templates/copy/id.ts
async function GET(params) {
  const ctx = getContext(arguments);
  const { request, env } = ctx;
  const auth = await requireAuth(request);
  if (auth instanceof Response)
    return {
      success: false,
      error: "Unauthorized"
    };
  const db = drizzle(env.PROJECT_DB);
  const template = await db.select().from(WebUiCopyTemplateTable).where(eq(WebUiCopyTemplateTable.name, params.name)).limit(1).get();
  if (!template)
    return {
      success: false,
      error: "Copy template not found"
    };
  return {
    success: true,
    data: {
      ...template,
      providerType: template.providerType,
      copyData: template.copyData
    }
  };
}
async function PUT(params) {
  const ctx = getContext(arguments);
  const { request, env } = ctx;
  const auth = await requireAuth(request);
  if (auth instanceof Response)
    return {
      success: false,
      error: "Unauthorized"
    };
  try {
    const db = drizzle(env.PROJECT_DB);
    const existing = await db.select().from(WebUiCopyTemplateTable).where(eq(WebUiCopyTemplateTable.name, params.name)).limit(1).get();
    if (!existing) {
      return {
        success: false,
        error: "Copy template not found"
      };
    }
    const updateData = {
      updated_at: new Date().toISOString()
    };
    if (params.data.providerType) {
      if (!["code", "password"].includes(params.data.providerType)) {
        return {
          success: false,
          error: "Invalid provider type. Must be 'code' or 'password'"
        };
      }
      updateData.providerType = params.data.providerType;
    }
    if (params.data.copyData) {
      updateData.copyData = params.data.copyData;
    }
    await db.update(WebUiCopyTemplateTable).set(updateData).where(eq(WebUiCopyTemplateTable.name, params.name));
    const updated = await db.select().from(WebUiCopyTemplateTable).where(eq(WebUiCopyTemplateTable.name, params.name)).limit(1).get();
    return {
      success: true,
      data: updated ? {
        ...updated,
        providerType: updated.providerType,
        copyData: updated.copyData
      } : undefined
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update copy template"
    };
  }
}
async function DELETE(params) {
  const ctx = getContext(arguments);
  const { request, env } = ctx;
  const auth = await requireAuth(request);
  if (auth instanceof Response)
    return {
      success: false,
      error: "Unauthorized"
    };
  try {
    const db = drizzle(env.PROJECT_DB);
    const existing = await db.select().from(WebUiCopyTemplateTable).where(eq(WebUiCopyTemplateTable.name, params.name)).limit(1).get();
    if (!existing) {
      return {
        success: false,
        error: "Copy template not found"
      };
    }
    await db.delete(WebUiCopyTemplateTable).where(eq(WebUiCopyTemplateTable.name, params.name));
    return {
      success: true
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete copy template"
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
