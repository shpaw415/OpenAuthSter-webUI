import { drizzle, eq, desc } from "openauth-webui-shared-types/drizzle";
import { getContext } from "frame-master-plugin-cloudflare-pages-functions-action/context";
import { LogsTable } from "openauth-webui-shared-types/database";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

// GET /api/logs - Get paginated logs for a project
export async function GET(params: {
  clientID: string;
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  error?: string;
  data: Array<typeof LogsTable.$inferSelect>;
  pagination?: { page: number; limit: number };
}> {
  const ctx = getContext<Env, any, any>(arguments);
  const { env } = ctx;

  const { clientID } = params;

  if (!clientID || typeof clientID !== "string") {
    return {
      success: false,
      error: "Invalid or missing clientID",
      data: [],
    };
  }

  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(params.limit) || DEFAULT_LIMIT));
  const offset = (page - 1) * limit;

  const db = drizzle(env.PROJECT_DB);
  const logs = await db
    .select()
    .from(LogsTable)
    .where(eq(LogsTable.clientID, clientID))
    .orderBy(desc(LogsTable.timestamp))
    .limit(limit)
    .offset(offset);

  return {
    success: true,
    data: logs,
    pagination: { page, limit },
  };
}
