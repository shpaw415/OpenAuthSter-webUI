import { issuer } from "@openauthjs/openauth";
import { CloudflareStorage } from "@openauthjs/openauth/storage/cloudflare";
import { PasswordProvider } from "@openauthjs/openauth/provider/password";
import { PasswordUI } from "@openauthjs/openauth/ui/password";
import { createSubjects } from "@openauthjs/openauth/subject";
import { object, string } from "valibot";
import { drizzle } from "drizzle-orm/d1";
import { usersTable } from "./db/schema";

// This value should be shared between the OpenAuth server Worker and other
// client Workers that you connect to it, so the types and schema validation are
// consistent.
const subjects = createSubjects({
  user: object({
    id: string(),
  }),
});

export interface Env {
  AUTH_STORAGE: KVNamespace;
  AUTH_DB: D1Database;
  PUBLIC_ISSUER: string;
  ADMIN_PANEL_ORIGIN: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return issuer({
      storage: CloudflareStorage({
        namespace: env.AUTH_STORAGE,
      }),
      subjects,
      providers: {
        password: PasswordProvider(
          PasswordUI({
            sendCode: async (email, code) => {
              console.log(`Sending code ${code} to ${email}`);
            },
            copy: {
              input_code: "Code (check Worker logs)",
            },
          }),
        ),
      },
      theme: {
        title: "myAuth",
        primary: "#0051c3",
        favicon: "https://workers.cloudflare.com//favicon.ico",
        logo: {
          dark: "https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/db1e5c92-d3a6-4ea9-3e72-155844211f00/public",
          light:
            "https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/fa5a3023-7da9-466b-98a7-4ce01ee6c700/public",
        },
      },
      success: async (ctx, value) => {
        return ctx.subject("user", {
          id: await getOrCreateUser(env, value.email),
        });
      },
      async error(error, req) {
        console.error(`Error during authentication for ${req.url}:`, error);
        console.log(req);
        return Response.json(
          { error: "Authentication error" },
          { status: 500 },
        );
      },
    }).fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;

async function getOrCreateUser(env: Env, email: string): Promise<string> {
  const result = (
    await drizzle(env.AUTH_DB)
      .insert(usersTable)
      .values({
        email,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        set: { email: email },
        target: usersTable.email,
      })
      .returning({ id: usersTable.id })
  ).at(0);

  if (!result) {
    throw new Error(`Unable to process user: ${email}`);
  }
  console.log(`Found or created user ${result.id} with email ${email}`);
  return result.id;
}
