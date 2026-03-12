import { getContext } from "frame-master-plugin-cloudflare-pages-functions-action/context";
import {
  OTFusersTable,
  parseDBUser,
  type OTFUsersParsedType,
  totpTable,
  webauthnCredentialsTable,
} from "openauth-webui-shared-types/database";
import {
  drizzle,
  like,
  sql,
  desc,
  eq,
  and,
} from "openauth-webui-shared-types/drizzle";
import { isClientIdValid } from "openauth-webui-shared-types/database";

export type ProjectUser = {
  id: string;
  identifier: string;
  data: Record<string, unknown> | null;
  session_public: Record<string, unknown> | null;
  created_at: string;
};

export type ListUsersParams = {
  clientID: string;
  page?: number;
  pageSize?: number;
  search?: string;
};

export type ListUsersResponse = {
  success: boolean;
  error?: string;
  data?: {
    users: OTFUsersParsedType[];
    total: number;
    page: number;
    pageSize: number;
  };
};

export type DeleteUserParams = {
  clientID: string;
  userID: string;
};

export type DeleteUserResponse = {
  success: boolean;
  error?: string;
};

export async function GET(params: ListUsersParams): Promise<ListUsersResponse> {
  const ctx = getContext<Env, any, any>(arguments);
  const { env } = ctx;

  const clientID = params.clientID?.trim();
  if (!clientID || !isClientIdValid(clientID)) {
    return { success: false, error: "Invalid or missing clientID" };
  }

  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20));
  const search = params.search?.trim() || "";

  try {
    const db = drizzle(env.PROJECT_DB);
    const usersTable = OTFusersTable(clientID);

    const filters = search
      ? like(usersTable.identifier, `%${search}%`)
      : undefined;

    const countQuery = filters
      ? db
          .select({ count: sql<number>`count(*)` })
          .from(usersTable)
          .where(filters)
      : db.select({ count: sql<number>`count(*)` }).from(usersTable);

    const totalRow = await countQuery.get();
    const total = totalRow?.count ?? 0;

    let dataQuery = db
      .select({
        id: usersTable.id,
        identifier: usersTable.identifier,
        data: usersTable.data,
        session_public: usersTable.session_public,
        created_at: usersTable.created_at,
      })
      .from(usersTable);

    if (filters) {
      //@ts-ignore
      dataQuery = dataQuery.where(filters);
    }

    const rows = await dataQuery
      .orderBy(desc(usersTable.created_at))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const users = rows.map(parseDBUser) as OTFUsersParsedType[];

    return {
      success: true,
      data: {
        users,
        total,
        page,
        pageSize,
      },
    };
  } catch (error) {
    console.error("Failed to load users:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load users",
    };
  }
}

export async function DELETE(
  params: DeleteUserParams,
): Promise<DeleteUserResponse> {
  const ctx = getContext<Env, any, any>(arguments);
  const { env } = ctx;

  const clientID = params.clientID?.trim();
  const userID = params.userID?.trim();

  if (!clientID || !isClientIdValid(clientID)) {
    return { success: false, error: "Invalid or missing clientID" };
  }

  if (!userID) {
    return { success: false, error: "Invalid or missing userID" };
  }

  try {
    const db = drizzle(env.PROJECT_DB);
    const usersTable = OTFusersTable(clientID);

    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, userID))
      .limit(1)
      .get();

    if (!existing) {
      return { success: false, error: "User not found" };
    }

    await db.delete(usersTable).where(eq(usersTable.id, userID));

    // Clean up orphan MFA records for this user
    await Promise.allSettled([
      db.delete(totpTable).where(and(eq(totpTable.user_id, userID), eq(totpTable.clientID, clientID))),
      db.delete(webauthnCredentialsTable).where(and(eq(webauthnCredentialsTable.user_id, userID), eq(webauthnCredentialsTable.clientID, clientID))),
    ]);

    return { success: true };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete user",
    };
  }
}
