import { drizzle, eq, desc,and } from "openauth-webui-shared-types/drizzle";
import { getContext } from "frame-master-plugin-cloudflare-pages-functions-action/context";
import { LogsTable,projectTable } from "openauth-webui-shared-types/database";
import { ownerGroupConditions } from "@utils/server";
import type { RequestDataContext } from "@auth";

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
  const ctx = getContext<Env, any, RequestDataContext>(arguments);
  const { env } = ctx;

  const { clientID } = params;

  if (!clientID || typeof clientID !== "string") {
    return {
      success: false,
      error: "Invalid or missing clientID",
      data: [],
    };
  }

  const session = await ctx.data.client.getUserSession("private");
  if (session instanceof Error) {
    return { success: false, error: "Unauthorized", data: [] };
  }

  const projectIsOwnedByUser = env.SELF_HOSTED === "true" ? true : await drizzle(env.PROJECT_DB)
    .select({ id: projectTable.clientID })
    .from(projectTable)
    .where(
      and(
        eq(projectTable.clientID, clientID),
        ownerGroupConditions({
          user_group_ids: session?.private?.group_ids ?? [],
          ownerGroupIdColumn: projectTable.owner_group_id,
          otherEq: [eq(projectTable.owner_id, session.user_id)],
          self_host: env.SELF_HOSTED,
        }),
      ),
    )
    .get()
    .then((e) => Boolean(e));

  if (!projectIsOwnedByUser) {
    return { success: false, error: "Unauthorized", data: [] };
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
