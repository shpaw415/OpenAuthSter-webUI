import type { Theme } from "@openauthjs/openauth/ui/theme";

export type ProviderType =
  | "google"
  | "github"
  | "twitter"
  | "linkedin"
  | "code"
  | "oidc"
  | "oauth"
  | "apple"
  | "x"
  | "slack"
  | "yahoo"
  | "twitch"
  | "spotify"
  | "cognito"
  | "discord"
  | "facebook"
  | "keycloak"
  | "password"
  | "Microsoft"
  | "jumpcloud";

export type ProviderData<ProviderData = {}> = {
  type: ProviderType;
  data: ProviderData;
  enabled: boolean;
  ui_style: Theme | null;
};
