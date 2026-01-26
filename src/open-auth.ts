import { createSubjects } from "@openauthjs/openauth/subject";
import { createClient } from "openauth-webui-shared-types/client";
import { object, string } from "valibot";

export const client = createClient({
  clientID: process.env.PUBLIC_CLIENT_ID!,
  issuer: process.env.PUBLIC_ISSUER!,
});

export const subject = createSubjects({
  user: object({
    id: string(),
  }),
});
