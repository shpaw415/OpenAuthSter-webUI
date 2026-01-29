import Cloudflare from "cloudflare";

/**
 * @returns the custom domain created for the project
 */
export async function createCustomDomainForProject(
  env: Env,
  client: Cloudflare,
): Promise<Cloudflare.Workers.Domains.Domain> {
  const cf = client;
  const issuer_url = new URL(
    env.CLOUDFLARE_AUTH_ENDPOINT_DOMAIN ?? env.PUBLIC_ISSUER,
  );
  const newDomaineName = `${crypto.randomUUID().replaceAll("-", "")}-${
    issuer_url.hostname
  }`;
  const domaine = await cf.workers.domains.update({
    account_id: env.CLOUDFLARE_ACCOUNT_ID,
    zone_id: env.CLOUDFLARE_AUTH_DOMAIN_ZONE_ID,
    hostname: newDomaineName,
    service: env.CLOUDFLARE_WORKER_SERVICE_NAME,
    environment: "production",
  });

  return domaine;
}

export async function deleteCustomDomainForProject(
  env: Env,
  client: Cloudflare,
  domaineID: string,
): Promise<void> {
  return client.workers.domains.delete(domaineID, {
    account_id: env.CLOUDFLARE_ACCOUNT_ID,
  });
}

export function createClient(env: Env): Cloudflare {
  return new Cloudflare({
    apiToken: env.CLOUDFLARE_API_TOKEN,
  });
}
