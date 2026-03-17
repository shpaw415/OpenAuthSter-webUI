import { createOpenAuthsterClient } from "openauth-webui-shared-types/client/user";
import { defaultSubjectSchema } from "openauth-webui-shared-types/client/user";

export const subject = defaultSubjectSchema;

export type RequestDataContext = {
  client: ReturnType<typeof createClient>;
};

export const createClient = ({
  token,
  clientID,
  issuerURI,
  redirectURI,
  copyID,
}: {
  token?: string;
  clientID?: string;
  issuerURI?: string;
  redirectURI?: string;
  copyID?: string;
} = {}) =>
  createOpenAuthsterClient({
    clientID: clientID ?? process.env.PUBLIC_CLIENT_ID!,
    issuerURI: issuerURI ?? process.env.PUBLIC_ISSUER!,
    redirectURI: redirectURI ?? process.env.PUBLIC_REDIRECT_URI!,
    copyID,
    subject,
    token,
  });
