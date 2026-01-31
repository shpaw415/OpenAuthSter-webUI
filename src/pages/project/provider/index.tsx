import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import type {
  ProviderConfig,
  OAuth2ProviderConfig,
  OIDCProviderConfig,
  GenericOAuthProviderConfig,
  KeycloakProviderConfig,
  CodeProviderConfig,
  PasswordProviderConfig,
  ProviderType,
  ProviderMeta,
  SlackProviderConfig,
  CognitoProviderConfig,
  MicrosoftProviderConfig,
} from "openauth-webui-shared-types";
import { getProviderMeta } from "openauth-webui-shared-types";
import { navigate } from "../../../utils";
import { useProject } from "@hooks/useProjects";
import { Snackbar } from "@material/react-snackbar";
import { Toggle, ToggleBase } from "@components/toggle";

// MDX documentation imports
const providerDocs: Record<string, () => Promise<{ default: ComponentType }>> =
  {
    google: () => import("@docs/providers/google.mdx"),
    github: () => import("@docs/providers/github.mdx"),
    discord: () => import("@docs/providers/discord.mdx"),
    microsoft: () => import("@docs/providers/microsoft.mdx"),
    keycloak: () => import("@docs/providers/keycloak.mdx"),
    oidc: () => import("@docs/providers/oidc.mdx"),
    oauth: () => import("@docs/providers/oauth.mdx"),
    code: () => import("@docs/providers/code.mdx"),
    password: () => import("@docs/providers/password.mdx"),
    slack: () => import("@docs/providers/slack.mdx"),
    cognito: () => import("@docs/providers/cognito.mdx"),
    apple: () => import("@docs/providers/apple.mdx"),
    facebook: () => import("@docs/providers/facebook.mdx"),
    spotify: () => import("@docs/providers/spotify.mdx"),
    twitch: () => import("@docs/providers/twitch.mdx"),
    x: () => import("@docs/providers/x.mdx"),
    yahoo: () => import("@docs/providers/yahoo.mdx"),
    jumpcloud: () => import("@docs/providers/jumpcloud.mdx"),
    default: () => import("@docs/providers/default.mdx"),
  };

type ProviderFormState<T extends ProviderConfig> = {
  clientID: string;
  provider_type: ProviderType;
  showSecret: boolean;
  setShowSecret: React.Dispatch<React.SetStateAction<boolean>>;
  meta: ProviderMeta | undefined;
  data: Partial<T["data"]> | null;
};

const providerFormStateContext = createContext<ProviderFormState<any> | null>(
  null,
);

function useProviderFormState<T extends ProviderConfig>() {
  return useContext(providerFormStateContext)! as ProviderFormState<T>;
}

export default function ProviderForm() {
  const project_id = useMemo(
    () =>
      typeof window === "undefined"
        ? undefined
        : new URLSearchParams(window.location.search).get("project_id"),
    [typeof window !== "undefined" && window.location.href],
  );
  const provider_type = useMemo(
    () =>
      typeof window === "undefined"
        ? undefined
        : (new URLSearchParams(window.location.search).get(
            "provider_type",
          ) as ProviderType),
    [typeof window !== "undefined" && window.location.href],
  );
  const projectHook = useProject(
    typeof window === "undefined"
      ? undefined
      : new URLSearchParams(window.location.search).get("project_id") || "",
  );
  const meta = useMemo(
    () => provider_type && getProviderMeta(provider_type),
    [provider_type],
  );

  const [config, setConfig] = useState<
    ProviderConfig | Partial<ProviderConfig>
  >({});
  const [showSecret, setShowSecret] = useState(false);
  const [DocComponent, setDocComponent] = useState<ComponentType | null>(null);

  const formRef = useRef<HTMLFormElement | null>(null);
  const [snackData, setSnackData] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [isSaving, setIsSaving] = useState<boolean>(false);

  const onSave = (updatedConfig: ProviderConfig) => {
    setIsSaving(true);
    console.log("Saving provider config:", updatedConfig);
    projectHook
      .updateProvider(updatedConfig)
      .then(() =>
        setSnackData({
          message: "Provider saved successfully",
          type: "success",
        }),
      )
      .catch((err) =>
        setSnackData({
          message:
            "" +
            (err instanceof Error ? err.message : "Failed to save provider"),
          type: "error",
        }),
      )
      .finally(() => setIsSaving(false));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const res = parseFormToProviderConfig({
      formData: new FormData(formRef.current!),
      providerType: provider_type!,
      providerEnabled: config.enabled ?? false,
    });
    console.log(res);

    onSave(res);
  };

  useEffect(() => {
    if (!projectHook.project) return;

    const providerType = provider_type;

    let initialConfig: Partial<ProviderConfig> | null = {
      enabled: false,
      type: providerType!,
      data: {} as any,
    };

    if (providerType) {
      initialConfig = {
        type: providerType,
        enabled: true,
        data: projectHook.project.providers_data.find(
          (p) => p.type === providerType,
        )?.data as ProviderConfig["data"],
      } as ProviderConfig;
    }

    if (initialConfig) {
      setConfig(initialConfig);
    } else {
      // Invalid state, navigate back to providers list
      navigate(`/project?project_id=${projectHook.project?.clientID}`);
    }
  }, [projectHook.project]);

  // Load MDX documentation based on provider type
  useEffect(() => {
    const loadDocs = async () => {
      const providerType = config.type || "default";
      const loader = providerDocs[providerType] ?? providerDocs["default"];
      try {
        const module = await loader!();
        setDocComponent(() => module.default);
      } catch {
        const defaultModule = await providerDocs["default"]!();
        setDocComponent(() => defaultModule.default);
      }
    };
    loadDocs();
  }, [config?.type]);

  const formState: ProviderFormState<any> = {
    clientID: project_id!,
    provider_type: config?.type!,
    showSecret,
    setShowSecret,
    meta,
    data: config?.data || null,
  };

  if (!config?.type) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white">Loading project...</p>
      </div>
    );
  }

  return (
    <>
      <Snackbar
        message={snackData?.message || ""}
        open={!!snackData}
        timeoutMs={6000}
        onClose={() => setSnackData(null)}
      />
      <div className="min-h-screen bg-gray-900">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700">
          <div className="px-6 py-6">
            <div className="flex items-center space-x-4">
              <a
                href={"/project?project_id=" + projectHook.project?.clientID}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                ←
              </a>
              <span className="text-4xl">{meta?.icon}</span>
              <div>
                <h1 className="text-2xl font-bold text-white">{meta?.name}</h1>
                <p className="text-gray-400">{meta?.description}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-120px)]">
          {/* Configuration Panel */}
          <div className="lg:w-1/2 bg-gray-900 border-r border-gray-700">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Configuration
              </h2>

              <div className="space-y-5 mb-8">
                {/* Enable Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded-xl">
                  <div>
                    <span className="text-white font-medium block">
                      Enable this provider
                    </span>
                    <span className="text-gray-500 text-sm">
                      Allow users to authenticate with this provider
                    </span>
                  </div>
                  <Toggle
                    enabled={config?.enabled ?? false}
                    onChange={(enabled) =>
                      setConfig((prev) => ({
                        ...(prev || {}),
                        enabled,
                      }))
                    }
                  />
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-5">
                  <providerFormStateContext.Provider value={formState}>
                    <form ref={formRef} onSubmit={onSubmit}>
                      <FormFields type={config?.type} />
                    </form>
                  </providerFormStateContext.Provider>
                </div>
              </div>

              <div className="flex gap-3">
                <a
                  href={"/project?project_id=" + projectHook.project?.clientID}
                  className="flex-1 px-5 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-medium rounded-xl transition-colors text-center"
                >
                  Cancel
                </a>
                <button
                  onClick={() => formRef.current?.requestSubmit()}
                  disabled={isSaving}
                  className="flex-1 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Provider
                </button>
              </div>
            </div>
          </div>

          {/* Documentation Panel */}
          <div className="lg:w-1/2 bg-gray-850 bg-gray-800/50">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Documentation
              </h2>

              <DocComponentWrapper>
                {DocComponent ? (
                  <DocComponent />
                ) : (
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="animate-spin">⏳</span>
                    Loading documentation...
                  </div>
                )}
              </DocComponentWrapper>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function parseFormToProviderConfig({
  formData,
  providerType,
  providerEnabled,
}: {
  formData: FormData;
  providerType: ProviderConfig["type"];
  providerEnabled: boolean;
}): ProviderConfig {
  const entries = Array.from(formData.entries());
  const listedData = Array.from(entries).filter(([key]) =>
    key.startsWith("list::"),
  );
  const arrayData = Array.from(entries).filter(([key]) =>
    key.startsWith("array::"),
  );

  const booleanData = Array.from(entries).filter(([key]) =>
    key.startsWith("boolean::"),
  );
  const numberData = Array.from(entries).filter(([key]) =>
    key.startsWith("number::"),
  );

  const normalData = Array.from(entries).filter(([key]) => !key.includes("::"));

  const keys = listedData
    .filter(([key]) => key.includes("::key::"))
    .map(([key, value]) => {
      const parts = key.split("::") as ["list", "key", string, string];
      return {
        name: parts[2],
        index: parts[3],
        value: value.toString(),
      };
    });
  const values = listedData
    .filter(([key]) => key.includes("::value::"))
    .map(([key, value]) => {
      const parts = key.split("::") as ["list", "value", string, string];
      return {
        name: parts[2],
        index: parts[3],
        value: value.toString(),
      };
    });
  // init with normal data
  const result: Partial<ProviderConfig["data"]> = normalData.reduce(
    (acc, [key, value]) => {
      if (value === "") return acc;
      acc[key as keyof ProviderConfig["data"]] = value as never;
      return acc;
    },
    {} as Partial<ProviderConfig["data"]>,
  );
  // parse listed data
  for (const key of keys) {
    if (key.value.trim() === "") continue;
    if (!result[key.name as keyof ProviderConfig["data"]]) {
      //@ts-ignore
      result[key.name] = {} as any;
    }
    //@ts-ignore
    result[key.name]![key.value] =
      values.find((v) => v.name === key.name && v.index === key.index)?.value ||
      "";
  }
  // parse array data
  for (const [key, value] of arrayData) {
    if (value.trim() === "") continue;
    const parts = key.split("::") as ["array", string];
    const name = parts[1];
    result[name as keyof ProviderConfig["data"]] = value
      .split(",")
      .map((v) => v.trim()) as never;
  }
  // parse boolean data
  for (const [key, value] of booleanData) {
    const parts = key.split("::") as ["boolean", string];
    const name = parts[1];
    result[name as keyof ProviderConfig["data"]] = (value === "true") as never;
  }
  // parse number data
  for (const [key, value] of numberData) {
    const parts = key.split("::") as ["number", string];
    const name = parts[1];
    const parsedValue = Number(value);
    if (isNaN(parsedValue))
      throw new Error(`Invalid number value for field ${name}`);
    result[name as keyof ProviderConfig["data"]] = parsedValue as never;
  }

  return {
    data: result,
    type: providerType,
    enabled: providerEnabled,
  } as ProviderConfig;
}

function DocComponentWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="prose prose-invert prose-sm max-w-none 
              prose-headings:text-blue-400 prose-headings:font-semibold
              prose-h1:text-xl prose-h1:mb-4 prose-h1:mt-0
              prose-h2:text-lg prose-h2:mb-3 prose-h2:mt-6 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-700
              prose-h3:text-base prose-h3:mb-2 prose-h3:mt-4
              prose-p:text-gray-300 prose-p:leading-relaxed
              prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white prose-strong:font-semibold
              prose-code:text-emerald-400 prose-code:bg-gray-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700 prose-pre:rounded-xl
              prose-table:border-collapse prose-table:w-full
              prose-th:bg-gray-900 prose-th:text-gray-200 prose-th:font-medium prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:border prose-th:border-gray-700
              prose-td:text-gray-300 prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-gray-700
              prose-li:text-gray-300 prose-li:marker:text-gray-500
              prose-ul:my-2 prose-ol:my-2
              prose-hr:border-gray-700"
    >
      {children}
    </div>
  );
}

const RequiredContext = createContext<boolean>(false);

function InputField(
  props: React.InputHTMLAttributes<HTMLInputElement> & { name: string },
) {
  return (
    <input
      required={useContext(RequiredContext)}
      {...props}
      className={`w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        props.className || ""
      }`}
    />
  );
}

function KeyValueEditor({
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
  value,
  name,
}: {
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  name: string;
  value?: Record<string, string>;
}) {
  const [new_value, setNewValue] = useState<
    Array<{ key: string; val: string; hash: string }>
  >(
    Object.entries(value || {}).map(([key, val]) => ({
      key,
      val,
      hash: crypto.randomUUID(),
    })),
  );
  const keyList = useMemo(() => new_value.map((item) => item.key), [new_value]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkedKeys: string[] = [];
    keyList.forEach((k, i) => {
      if (k !== "") {
        checkedKeys.push(k);
      }
    });
    const hasDuplicates = checkedKeys.some(
      (k, i) => checkedKeys.indexOf(k) !== i && k !== "",
    );
    if (hasDuplicates) {
      setError("Duplicate keys are not allowed");
    } else setError(null);
  }, [keyList, new_value]);

  const handleChange = useCallback(
    (type: "key" | "value", index: number) => {
      return (e: React.ChangeEvent<HTMLInputElement>) => {
        const content = e.target.value || "";
        if (type === "key") {
          setNewValue((current) =>
            current.map((item, i) =>
              i === index ? { ...item, key: content } : item,
            ),
          );
        } else if (type === "value") {
          setNewValue((current) =>
            current.map((item, i) =>
              i === index ? { ...item, val: content } : item,
            ),
          );
        }
      };
    },
    [new_value],
  );

  const handleAdd = useCallback(() => {
    setNewValue((current) => [
      ...current,
      { key: "", val: "", hash: crypto.randomUUID() },
    ]);
  }, [setNewValue]);

  const handleRemove = useCallback((index: number) => {
    setNewValue((current) => current.filter((_, i) => i !== index));
  }, []);

  return (
    <div className="space-y-2">
      {new_value.map(({ key, val, hash }, index) => (
        <div key={hash} className="flex items-center gap-2">
          <input
            name={`list::key::${name}::${index}`}
            type="text"
            defaultValue={key}
            placeholder={keyPlaceholder}
            onChange={handleChange("key", index)}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <span className="text-gray-500">=</span>
          <input
            type="text"
            name={`list::value::${name}::${index}`}
            defaultValue={val}
            placeholder={valuePlaceholder}
            onChange={handleChange("value", index)}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            type="button"
            onClick={() => handleRemove(index)}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-lg transition-colors"
            title="Remove parameter"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        className="flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded-lg transition-colors"
      >
        <span>+</span> Add parameter
      </button>
      {new_value.length === 0 && (
        <p className="text-gray-500 text-sm">
          No additional query parameters configured
        </p>
      )}
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  );
}

function InputFieldForm({
  required,
  label,
  children,
}: {
  children: React.ReactNode;
  required?: boolean;
  label: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <RequiredContext.Provider value={Boolean(required)}>
        {children}
      </RequiredContext.Provider>
    </div>
  );
}

function FormFields({ type }: { type: ProviderType }) {
  switch (type) {
    case "code":
      return <CodeFields />;
    case "password":
      return <PasswordFields />;
    case "oidc":
      return <OIDCFields />;
    case "oauth":
      return <GenericOAuthFields />;
    case "keycloak":
      return <KeycloakFields />;
    case "slack":
      return <SlackFields />;
    case "cognito":
      return <CognitoFields />;
    case "microsoft":
      return <MicrosoftFields />;
    default:
      return <OAuth2Fields query pkce scopes />;
  }
}

function OAuth2DefaultFields({
  clientId,
  clientSecret,
}: {
  clientId?: string;
  clientSecret?: string;
}) {
  const [showSecret, setShowSecret] = useState(false);

  return (
    <>
      <InputFieldForm label="Client ID" required>
        <InputField
          type="text"
          name="clientID"
          defaultValue={clientId || ""}
          placeholder="Your OAuth client ID"
        />
      </InputFieldForm>
      <InputFieldForm label="Client Secret" required>
        <div className="relative">
          <InputField
            type={showSecret ? "text" : "password"}
            name="clientSecret"
            defaultValue={clientSecret || ""}
            placeholder="Your OAuth client secret"
          />
          <button
            type="button"
            onClick={() => setShowSecret((c) => !c)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            {showSecret ? "🙈" : "👁️"}
          </button>
        </div>
      </InputFieldForm>
    </>
  );
}
function PkceField({ enabled }: { enabled?: boolean }) {
  return (
    <InputFieldForm label="Enable PKCE">
      <ToggleBase defaultChecked={enabled || false} name="boolean::pkce" />
    </InputFieldForm>
  );
}

function QueryParametersField({ value }: { value?: Record<string, string> }) {
  return (
    <InputFieldForm label="Additional Query Parameters">
      <KeyValueEditor
        name="query"
        keyPlaceholder="Parameter name"
        valuePlaceholder="Parameter value"
        value={value}
      />
    </InputFieldForm>
  );
}

function ScopesField({
  value,
  placeholder,
}: {
  value?: string[];
  placeholder: string;
}) {
  return (
    <InputFieldForm label="Scopes">
      <InputField
        type="text"
        name="array::scopes"
        defaultValue={value?.join(", ") || ""}
        placeholder={placeholder}
      />
      <p className="text-gray-500 text-sm mt-1">
        Comma-separated list of OAuth scopes
      </p>
    </InputFieldForm>
  );
}

// Provider setups /////////////////////////////////////////

function OAuth2Fields({
  query,
  pkce,
  scopes,
}: {
  query?: boolean;
  pkce?: boolean;
  scopes?: boolean;
}) {
  const data = useProviderFormState<OAuth2ProviderConfig>();
  return (
    <>
      <OAuth2DefaultFields
        clientId={data.data?.clientID}
        clientSecret={data.data?.clientSecret}
      />
      {scopes && (
        <ScopesField value={data.data?.scopes} placeholder="email, profile" />
      )}
      {pkce && <PkceField enabled={data.data?.pkce} />}
      {query && <QueryParametersField value={data.data?.query} />}
    </>
  );
}

function OIDCFields() {
  const data = useProviderFormState<OIDCProviderConfig>();
  return (
    <>
      <InputFieldForm label="Client ID" required>
        <InputField
          type="text"
          name="clientID"
          defaultValue={data.data?.clientID || ""}
          placeholder="Your OIDC client ID"
        />
      </InputFieldForm>
      <InputFieldForm label="Issuer URL" required>
        <InputField
          type="url"
          name="issuer"
          defaultValue={data.data?.issuer || ""}
          placeholder="https://auth.example.com"
        />
      </InputFieldForm>
      <ScopesField value={data.data?.scopes} placeholder="openid, email" />
      <QueryParametersField value={data.data?.query} />
    </>
  );
}

function GenericOAuthFields() {
  const data = useProviderFormState<GenericOAuthProviderConfig>();
  return (
    <>
      <OAuth2DefaultFields
        clientId={data.data?.clientID}
        clientSecret={data.data?.clientSecret}
      />
      <InputFieldForm label="Authorization Endpoint" required>
        <InputField
          type="url"
          name="authorizationEndpoint"
          defaultValue={data.data?.authorizationEndpoint || ""}
          placeholder="https://auth.example.com/authorize"
        />
      </InputFieldForm>
      <InputFieldForm label="Token Endpoint" required>
        <InputField
          type="url"
          name="tokenEndpoint"
          defaultValue={data.data?.tokenEndpoint || ""}
          placeholder="https://auth.example.com/token"
        />
      </InputFieldForm>
      <InputFieldForm label="JWKS Endpoint" required>
        <InputField
          type="url"
          defaultValue={data.data?.jwksEndpoint || ""}
          name="jwksEndpoint"
          placeholder="https://auth.example.com/.well-known/jwks.json"
        />
      </InputFieldForm>
      <ScopesField value={data.data?.scopes} placeholder="email, profile" />
      <QueryParametersField value={data.data?.query} />
    </>
  );
}

function KeycloakFields() {
  const data = useProviderFormState<KeycloakProviderConfig>();
  return (
    <>
      <OAuth2DefaultFields
        clientId={data.data?.clientID}
        clientSecret={data.data?.clientSecret}
      />

      <InputFieldForm label="Realm" required>
        <InputField
          type="text"
          name="realm"
          defaultValue={data.data?.realm || ""}
          placeholder="master"
        />
      </InputFieldForm>

      <InputFieldForm label="Base URL" required>
        <InputField
          type="url"
          defaultValue={data.data?.baseUrl || ""}
          name="baseUrl"
          placeholder="https://keycloak.example.com"
        />
      </InputFieldForm>

      <ScopesField value={data.data?.scopes} placeholder="openid, email" />
    </>
  );
}

function CodeFields() {
  const data = useProviderFormState<CodeProviderConfig>();

  return (
    <>
      <InputFieldForm label="Code Length">
        <InputField
          type="number"
          name="number::length"
          min="4"
          max="8"
          defaultValue={data.data?.length || 4}
        />
        <p className="text-gray-500 text-sm mt-1">
          Number of digits in the verification code (4-8)
        </p>
      </InputFieldForm>
    </>
  );
}

function PasswordFields() {
  const data = useProviderFormState<PasswordProviderConfig>();
  return (
    <>
      <InputFieldForm label="Password Policy: Minimum Length" required>
        <InputField
          type="number"
          min="6"
          max="32"
          name="number::minLength"
          defaultValue={data.data?.minLength || 8}
          placeholder="Minimum password length"
        />
      </InputFieldForm>
      <InputFieldForm label="On password to short message">
        <InputField
          type="text"
          name="shortPasswordMsg"
          defaultValue={data.data?.shortPasswordMsg || ""}
          placeholder="Your custom message for short passwords"
        />
      </InputFieldForm>
      <InputFieldForm
        label="Password Policy: Require Uppercase Letter"
        required
      >
        <ToggleBase
          name="boolean::requireUppercase"
          defaultChecked={data.data?.requireUppercase}
        />
      </InputFieldForm>
      <InputFieldForm label="On missing uppercase message">
        <InputField
          type="text"
          name="requireUppercaseMsg"
          defaultValue={data.data?.requireUppercaseMsg || ""}
          placeholder="Your custom message for missing uppercase letters"
        />
      </InputFieldForm>
      <InputFieldForm label="Password Policy: Require Number" required>
        <ToggleBase
          name="boolean::requireNumber"
          defaultChecked={data.data?.requireNumber}
        />
      </InputFieldForm>
      <InputFieldForm label="On missing number message">
        <InputField
          type="text"
          name="requireNumberMsg"
          defaultValue={data.data?.requireNumberMsg || ""}
          placeholder="Your custom message for missing numbers"
        />
      </InputFieldForm>
      <InputFieldForm
        label="Password Policy: Require Special Character"
        required
      >
        <ToggleBase
          name="boolean::requireSpecialChar"
          defaultChecked={data.data?.requireSpecialChar}
        />
      </InputFieldForm>
      <InputFieldForm label="On missing special character message">
        <InputField
          type="text"
          name="requireSpecialCharMsg"
          defaultValue={data.data?.requireSpecialCharMsg || ""}
          placeholder="Your custom message for missing special characters"
        />
      </InputFieldForm>
    </>
  );
}

function SlackFields() {
  const data = useProviderFormState<SlackProviderConfig>();

  return (
    <>
      <InputFieldForm label="Client ID" required>
        <InputField
          type="text"
          name="clientID"
          defaultValue={data.data?.clientID || ""}
          placeholder="Your Slack client ID"
        />
      </InputFieldForm>
      <InputFieldForm label="Client Secret" required>
        <div className="relative">
          <InputField
            type={data.showSecret ? "text" : "password"}
            name="clientSecret"
            defaultValue={data.data?.clientSecret || ""}
            placeholder="Your Slack client secret"
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => data.setShowSecret((c) => !c)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            {data.showSecret ? "🙈" : "👁️"}
          </button>
        </div>
      </InputFieldForm>
      <InputFieldForm label="team" required>
        <InputField
          type="text"
          name="team"
          defaultValue={data.data?.team || ""}
          placeholder="Your Slack workspace team ID"
        />
      </InputFieldForm>
      <InputFieldForm label="Scopes">
        <InputField
          type="text"
          name="array::scopes"
          defaultValue={data.data?.scopes?.join(", ") || ""}
          placeholder="email, openid, profile"
        />
      </InputFieldForm>
      <InputFieldForm label="PKCE">
        <ToggleBase name="boolean::pkce" defaultChecked={data.data?.pkce} />
      </InputFieldForm>
    </>
  );
}

function CognitoFields() {
  const data = useProviderFormState<CognitoProviderConfig>();

  return (
    <>
      <OAuth2DefaultFields
        clientId={data.data?.clientID}
        clientSecret={data.data?.clientSecret}
      />
      <InputFieldForm label="Region" required>
        <InputField
          type="text"
          name="region"
          defaultValue={data.data?.region || ""}
          placeholder="Your AWS region"
        />
      </InputFieldForm>
      <InputFieldForm label="Domain" required>
        <InputField
          type="text"
          name="domain"
          defaultValue={data.data?.domain || ""}
          placeholder="Your AWS Cognito domain"
        />
      </InputFieldForm>
      <ScopesField value={data.data?.scopes} placeholder="email, openid" />
      <PkceField enabled={data.data?.pkce} />
      <QueryParametersField value={data.data?.query} />
    </>
  );
}

function MicrosoftFields() {
  const data = useProviderFormState<MicrosoftProviderConfig>();

  return (
    <>
      <OAuth2DefaultFields
        clientId={data.data?.clientID}
        clientSecret={data.data?.clientSecret}
      />
      <ScopesField
        value={data.data?.scopes}
        placeholder="User.Read, email, profile"
      />
      <InputFieldForm label="Tenant ID" required>
        <InputField
          type="text"
          name="tenant"
          defaultValue={data.data?.tenant || ""}
          placeholder="Your Microsoft Tenant ID"
        />
      </InputFieldForm>
      <PkceField enabled={data.data?.pkce} />
      <QueryParametersField value={data.data?.query} />
    </>
  );
}
