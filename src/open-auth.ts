import { createOpenAuthsterClient } from "openauth-webui-shared-types/client/user";
import { defaultSubjectSchema } from "openauth-webui-shared-types/client/user";

export const subject = defaultSubjectSchema;

export const createClient = (token?: string) =>
  createOpenAuthsterClient({
    clientID: process.env.PUBLIC_CLIENT_ID!,
    issuerURI: process.env.PUBLIC_ISSUER!,
    redirectURI: process.env.PUBLIC_REDIRECT_URI!,
    copyID: null,
    subject,
    token,
  });
