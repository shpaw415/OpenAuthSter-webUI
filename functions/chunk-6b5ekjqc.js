// ../openauth-webui-shared-types/index.ts
var PROVIDER_REGISTRY = [
  {
    type: "google",
    name: "Google",
    category: "social",
    icon: "\uD83D\uDD35",
    description: "Sign in with Google OAuth2",
    requiredFields: ["clientID", "clientSecret"],
    optionalFields: ["scopes"]
  },
  {
    type: "github",
    name: "GitHub",
    category: "social",
    icon: "⚫",
    description: "Sign in with GitHub OAuth2",
    requiredFields: ["clientID", "clientSecret"],
    optionalFields: ["scopes"]
  },
  {
    type: "discord",
    name: "Discord",
    category: "social",
    icon: "\uD83D\uDC9C",
    description: "Sign in with Discord OAuth2",
    requiredFields: ["clientID", "clientSecret"],
    optionalFields: ["scopes"]
  },
  {
    type: "x",
    name: "X (Twitter)",
    category: "social",
    icon: "✖️",
    description: "Sign in with X OAuth2",
    requiredFields: ["clientID", "clientSecret"],
    optionalFields: ["scopes"]
  },
  {
    type: "facebook",
    name: "Facebook",
    category: "social",
    icon: "\uD83D\uDCD8",
    description: "Sign in with Facebook OAuth2",
    requiredFields: ["clientID", "clientSecret"],
    optionalFields: ["scopes"]
  },
  {
    type: "apple",
    name: "Apple",
    category: "social",
    icon: "\uD83C\uDF4E",
    description: "Sign in with Apple",
    requiredFields: ["clientID", "clientSecret"],
    optionalFields: ["scopes"]
  },
  {
    type: "slack",
    name: "Slack",
    category: "social",
    icon: "\uD83D\uDCAC",
    description: "Sign in with Slack OAuth2",
    requiredFields: ["clientID", "clientSecret"],
    optionalFields: ["scopes"]
  },
  {
    type: "spotify",
    name: "Spotify",
    category: "social",
    icon: "\uD83C\uDFB5",
    description: "Sign in with Spotify OAuth2",
    requiredFields: ["clientID", "clientSecret"],
    optionalFields: ["scopes"]
  },
  {
    type: "twitch",
    name: "Twitch",
    category: "social",
    icon: "\uD83C\uDFAE",
    description: "Sign in with Twitch OAuth2",
    requiredFields: ["clientID", "clientSecret"],
    optionalFields: ["scopes"]
  },
  {
    type: "yahoo",
    name: "Yahoo",
    category: "social",
    icon: "\uD83D\uDFE3",
    description: "Sign in with Yahoo OAuth2",
    requiredFields: ["clientID", "clientSecret"],
    optionalFields: ["scopes"]
  },
  {
    type: "microsoft",
    name: "Microsoft",
    category: "enterprise",
    icon: "\uD83E\uDE9F",
    description: "Sign in with Microsoft Azure AD",
    requiredFields: ["clientID", "clientSecret"],
    optionalFields: ["scopes"]
  },
  {
    type: "cognito",
    name: "AWS Cognito",
    category: "enterprise",
    icon: "☁️",
    description: "Sign in with AWS Cognito",
    requiredFields: ["clientID", "clientSecret"],
    optionalFields: ["scopes"]
  },
  {
    type: "keycloak",
    name: "Keycloak",
    category: "enterprise",
    icon: "\uD83D\uDD10",
    description: "Sign in with Keycloak",
    requiredFields: ["clientID", "clientSecret", "realm", "baseUrl"],
    optionalFields: ["scopes"]
  },
  {
    type: "jumpcloud",
    name: "JumpCloud",
    category: "enterprise",
    icon: "☁️",
    description: "Sign in with JumpCloud",
    requiredFields: ["clientID", "clientSecret"],
    optionalFields: ["scopes"]
  },
  {
    type: "oidc",
    name: "Custom OIDC",
    category: "custom",
    icon: "\uD83D\uDD17",
    description: "Connect to any OIDC provider",
    requiredFields: ["clientID", "issuer"],
    optionalFields: ["scopes", "query"]
  },
  {
    type: "oauth",
    name: "Custom OAuth2",
    category: "custom",
    icon: "\uD83D\uDD11",
    description: "Connect to any OAuth2 provider",
    requiredFields: [
      "clientID",
      "clientSecret",
      "authorizationEndpoint",
      "tokenEndpoint"
    ],
    optionalFields: ["jwksEndpoint", "scopes", "query"]
  },
  {
    type: "code",
    name: "Pin Code",
    category: "form",
    icon: "\uD83D\uDCE7",
    description: "Email or SMS verification code",
    requiredFields: ["mode"],
    optionalFields: ["length"]
  },
  {
    type: "password",
    name: "Password",
    category: "form",
    icon: "\uD83D\uDD12",
    description: "Traditional email and password",
    requiredFields: [],
    optionalFields: [
      "minLength",
      "requireUppercase",
      "requireNumber",
      "requireSpecialChar"
    ]
  }
];
var COOKIE_NAME = "oauth_client_id";

export { PROVIDER_REGISTRY, COOKIE_NAME };
