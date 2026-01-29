import { afterAll, beforeAll, expect, test } from "bun:test";
import type Cloudflare from "cloudflare";
import { createClient, createCustomDomainForProject } from "../src/cloudflare";

const env: Env = {
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID!,
  CLOUDFLARE_AUTH_DOMAIN_ZONE_ID: process.env.CLOUDFLARE_AUTH_DOMAIN_ZONE_ID!,
  CLOUDFLARE_WORKER_SERVICE_NAME: process.env.CLOUDFLARE_WORKER_SERVICE_NAME!,
  PUBLIC_ISSUER: process.env.PUBLIC_ISSUER!,
} as Env;

if (
  !env.CLOUDFLARE_ACCOUNT_ID ||
  !env.CLOUDFLARE_AUTH_DOMAIN_ZONE_ID ||
  !env.CLOUDFLARE_WORKER_SERVICE_NAME ||
  !env.PUBLIC_ISSUER
) {
  throw new Error("Missing Cloudflare environment variables for testing");
}

let client: Cloudflare;
let newCreatedDomaineID: string | undefined;

beforeAll(async () => {
  client = createClient(env);
  expect(client).toBeDefined();
});

afterAll(async () => {
  if (newCreatedDomaineID) {
    // Clean up the created custom domain
    await client.workers.domains.delete(newCreatedDomaineID, {
      account_id: env.CLOUDFLARE_ACCOUNT_ID,
    });
    console.log("Deleted custom domain:", newCreatedDomaineID);
  }
});

test("Create custom domain for project", async () => {
  const res = await createCustomDomainForProject(env, client);
  expect(res.id).toBeDefined();
  console.log("Created custom domain:", res);
  newCreatedDomaineID = res.id;
});
