export async function createOTFTable(tableName: string, env: Env) {
  await env.PROJECT_DB.exec(
    `CREATE TABLE IF NOT EXISTS ${tableName}_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
  );
}
