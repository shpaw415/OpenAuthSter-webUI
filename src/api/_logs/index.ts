import { drizzle, eq, desc } from "openauth-webui-shared-types/drizzle";
import { getContext } from "frame-master-plugin-cloudflare-pages-functions-action/context";
import { LogsTable } from "openauth-webui-shared-types/database";

// src/api/_logs/index.ts GET /api/logs - Get logs for a project
export async function GET(params: { clientID: string }): Promise<{
  success: boolean;
  error?: string;
  data: Array<typeof LogsTable.$inferSelect>;
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

  const db = drizzle(env.PROJECT_DB);
  const logs = await db
    .select()
    .from(LogsTable)
    .where(eq(LogsTable.clientID, clientID))
    .orderBy(desc(LogsTable.timestamp));

  return {
    success: true,
    data: logs,
  };
}
