import React, { useState, useEffect } from "react";
import type {
  Project,
  ProjectData,
  ProviderConfig,
  ProviderType,
  ProviderCategory,
} from "openauth-webui-shared-types";
import {
  getProviderMeta,
  getProvidersByCategory,
} from "openauth-webui-shared-types";
import { useProject } from "../../hooks/useProjects";
import { useUIThemes } from "../../hooks/useUIThemes";
import { useEmailTemplates } from "../../hooks/useEmailTemplates";
import { Snackbar } from "@material/react-snackbar";


const CATEGORIES: { id: ProviderCategory; label: string; icon: string }[] = [
  { id: "social", label: "Social", icon: "👥" },
  { id: "enterprise", label: "Enterprise", icon: "🏢" },
  { id: "custom", label: "Custom", icon: "🔧" },
  { id: "form", label: "Form-based", icon: "📝" },
];

const STANDARD_PROJECT_DATA_FIELDS = [
  "appName",
  "companyName",
  "supportEmail",
  "websiteUrl",
  "logoUrl",
  "primaryColor",
  "emailFrom",
] as const;

export default function ProjectDetail() {
  const projectHook = useProject(
    typeof window === "undefined"
      ? undefined
      : new URLSearchParams(window.location.search).get("project_id") || "",
  );
  const { themes, isLoading: themesLoading } = useUIThemes();
  const { templates, isLoading: templatesLoading } = useEmailTemplates();
  const [activeCategory, setActiveCategory] =
    useState<ProviderCategory>("social");
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
  } | null>(null);
  const [isProjectDataExpanded, setIsProjectDataExpanded] = useState(false);
  const [projectData, setProjectData] = useState<ProjectData>({});
  const [customFieldKey, setCustomFieldKey] = useState("");

  // Sync projectData when project loads
  useEffect(() => {
    if (projectHook.project?.projectData) {
      setProjectData(projectHook.project.projectData);
    }
  }, [projectHook.project?.projectData]);

  const providers = projectHook.project?.providers_data || [];

  const getProviderConfig = (
    type: ProviderType,
  ): ProviderConfig | undefined => {
    return providers.find((p) => p.type === type);
  };

  const handleRemoveProvider = async (type: ProviderType) => {
    if (!confirm(`Remove ${getProviderMeta(type)?.name} provider?`)) return;

    setIsSaving(true);
    try {
      const newProviders = providers.filter((p) => p.type !== type);
      await projectHook.updateProviders(newProviders);
      setNotification({ message: "Provider removed" });
    } catch (err) {
      setNotification({
        message:
          err instanceof Error ? err.message : "Failed to remove provider",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleProvider = async (type: ProviderType) => {
    const existing = getProviderConfig(type);
    if (!existing) return;

    setIsSaving(true);
    try {
      const newProviders = providers.map((p) =>
        p.type === type ? { ...p, enabled: !p.enabled } : p,
      );
      await projectHook.updateProviders(newProviders);
    } catch (err) {
      setNotification({
        message:
          err instanceof Error ? err.message : "Failed to toggle provider",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const categoryProviders = getProvidersByCategory(activeCategory);
  const enabledCount = providers.filter((p) => p.enabled).length;

  if (projectHook.isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Notification */}
      {notification && (
        <Snackbar
          message={notification.message}
          actionText="OK"
          onClose={() => setNotification(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <a
            href="/"
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            ← Back
          </a>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-white">
                {projectHook.project?.clientID}
              </h2>
              <span
                className={`px-2 py-1 text-xs rounded ${
                  projectHook.project?.active
                    ? "bg-green-500/10 text-green-400"
                    : "bg-gray-500/10 text-gray-400"
                }`}
              >
                {projectHook.project?.active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-gray-400 mt-1">
              {enabledCount} provider{enabledCount !== 1 ? "s" : ""} enabled
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <span className="text-gray-300">Project Active</span>
            <button
              type="button"
              onClick={() =>
                projectHook.updateProject({
                  active: !projectHook.project?.active,
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                projectHook.project?.active ? "bg-green-600" : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  projectHook.project?.active
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Project Client Info */}
      <ProjectClientInfo
        project={projectHook.project!}
        setNotification={setNotification}
      />

      {/* Theme & Email Template Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Theme Selection */}
        <SelectWrapper
          icon="🎨"
          name="UI Theme"
          action={
            <a
              href="/theme"
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Manage Themes
            </a>
          }
        >
          <select
            value={projectHook.project?.themeId || ""}
            onChange={async (e) => {
              setIsSaving(true);
              try {
                await projectHook.updateProject({
                  themeId: e.target.value || null,
                });
                setNotification({ message: "Theme updated" });
              } catch (err) {
                setNotification({
                  message:
                    err instanceof Error
                      ? err.message
                      : "Failed to update theme",
                });
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={isSaving || themesLoading}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          >
            <option value="">No theme selected</option>
            {themes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.themeData.title || theme.id}
              </option>
            ))}
          </select>
          {projectHook.project?.themeId && (
            <p className="text-gray-500 text-xs mt-2">
              Using theme: {projectHook.project.themeId}
            </p>
          )}
        </SelectWrapper>
        {/* Email Template Selection */}
        <SelectWrapper
          name="Email/SMS Template"
          icon={"✉️"}
          action={
            <a
              href="/templates"
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Manage Templates
            </a>
          }
        >
          <select
            value={projectHook.project?.emailTemplateId || ""}
            onChange={async (e) => {
              setIsSaving(true);
              try {
                await projectHook.updateProject({
                  emailTemplateId: e.target.value || null,
                });
                setNotification({ message: "Email template updated" });
              } catch (err) {
                setNotification({
                  message:
                    err instanceof Error
                      ? err.message
                      : "Failed to update email template",
                });
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={isSaving || templatesLoading}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          >
            <option value="">No template selected</option>
            {templates.map((template) => (
              <option key={template.name} value={template.name}>
                {template.name} - {template.subject}
              </option>
            ))}
          </select>
          {projectHook.project?.emailTemplateId && (
            <div className="flex items-center justify-between mt-2">
              <p className="text-gray-500 text-xs">
                Using template: {projectHook.project.emailTemplateId}
              </p>
              <a
                href={`/templates/manage?edit=${encodeURIComponent(
                  projectHook.project.emailTemplateId,
                )}&project_id=${encodeURIComponent(
                  projectHook.project.clientID,
                )}`}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Edit Template
              </a>
            </div>
          )}
        </SelectWrapper>
        {/* codeMode Section */}
        <SelectWrapper
          name="Code Mode"
          icon={"💻"}
          helpText="Select the mode for registration code sending"
        >
          <select
            defaultValue={projectHook.project?.codeMode || "email"}
            disabled={isSaving}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            onChange={(e) => {
              const value = e.currentTarget.value as "email" | "phone";

              setIsSaving(true);
              projectHook
                .updateProject({
                  codeMode: value,
                })
                .then(() => {
                  setNotification({ message: "Code mode updated" });
                })
                .catch((err) => {
                  setNotification({
                    message:
                      err instanceof Error
                        ? err.message
                        : "Failed to update code mode",
                  });
                })
                .finally(() => {
                  setIsSaving(false);
                });
            }}
          >
            <option value="email">Email Code Mode</option>
            <option value="phone">Phone Code Mode</option>
          </select>
        </SelectWrapper>
        <AllowOriginForm
          isSaving={isSaving}
          setIsSaving={setIsSaving}
          updateProject={projectHook.updateProject}
          setNotification={setNotification}
          project={projectHook.project!}
        />
      </div>

      {/* Project Data Section */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
        <button
          onClick={() => setIsProjectDataExpanded(!isProjectDataExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              &#127760; Global variables
              <span className="text-xs font-normal text-gray-400">
                (Data available in email templates)
              </span>
            </h3>
            <p className="text-gray-400 text-sm">
              Configure variables like app name, company info, and custom fields
              for email templates
            </p>
          </div>
          <span
            className={`text-gray-400 transition-transform ${
              isProjectDataExpanded ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </button>

        {isProjectDataExpanded && (
          <div className="mt-4 space-y-4">
            {/* Standard Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-1">
                  App Name
                </label>
                <input
                  type="text"
                  value={projectData.appName || ""}
                  onChange={(e) =>
                    setProjectData({ ...projectData, appName: e.target.value })
                  }
                  placeholder="My Application"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Use in templates: {"{{appName}}"}
                </p>
              </div>

              {/* Email from setup */}
              <div>
                <label className="block text-gray-300 text-sm mb-1">
                  Email From
                </label>
                <input
                  type="text"
                  value={projectData.emailFrom || ""}
                  onChange={(e) =>
                    setProjectData({
                      ...projectData,
                      emailFrom: e.target.value,
                    })
                  }
                  placeholder="no-reply@example.com"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Not meant for templates - used as the sender email address
                </p>
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={projectData.companyName || ""}
                  onChange={(e) =>
                    setProjectData({
                      ...projectData,
                      companyName: e.target.value,
                    })
                  }
                  placeholder="Acme Inc."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Use in templates: {"{{companyName}}"}
                </p>
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  value={projectData.supportEmail || ""}
                  onChange={(e) =>
                    setProjectData({
                      ...projectData,
                      supportEmail: e.target.value,
                    })
                  }
                  placeholder="support@example.com"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Use in templates: {"{{supportEmail}}"}
                </p>
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={projectData.websiteUrl || ""}
                  onChange={(e) =>
                    setProjectData({
                      ...projectData,
                      websiteUrl: e.target.value,
                    })
                  }
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Use in templates: {"{{websiteUrl}}"}
                </p>
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={projectData.logoUrl || ""}
                  onChange={(e) =>
                    setProjectData({ ...projectData, logoUrl: e.target.value })
                  }
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Use in templates: {"{{logoUrl}}"}
                </p>
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">
                  Primary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={projectData.primaryColor || ""}
                    onChange={(e) =>
                      setProjectData({
                        ...projectData,
                        primaryColor: e.target.value,
                      })
                    }
                    placeholder="#3B82F6"
                    className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="color"
                    value={projectData.primaryColor || "#3B82F6"}
                    onChange={(e) =>
                      setProjectData({
                        ...projectData,
                        primaryColor: e.target.value,
                      })
                    }
                    className="w-10 h-10 rounded cursor-pointer border border-gray-600"
                  />
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  Use in templates: {"{{primaryColor}}"}
                </p>
              </div>
            </div>

            {/* Custom Fields */}
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-white font-medium mb-2">Custom Fields</h4>
              <div className="space-y-2">
                {Object.entries(projectData)
                  .filter(
                    ([key]) =>
                      !STANDARD_PROJECT_DATA_FIELDS.includes(
                        key as (typeof STANDARD_PROJECT_DATA_FIELDS)[number],
                      ),
                  )
                  .map(([key, value]) => (
                    <div key={key} className="flex gap-2 items-center">
                      <span className="text-gray-400 text-sm w-32 truncate">
                        {key}:
                      </span>
                      <input
                        type="text"
                        value={value || ""}
                        onChange={(e) =>
                          setProjectData({
                            ...projectData,
                            [key]: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-1.5 bg-gray-900 border border-gray-600 text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      <button
                        onClick={() => {
                          const newData = { ...projectData };
                          delete newData[key];
                          setProjectData(newData);
                        }}
                        className="px-2 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
                      >
                        ✕
                      </button>
                      <span className="text-gray-500 text-xs">
                        {`{{${key}}}`}
                      </span>
                    </div>
                  ))}

                {/* Add Custom Field */}
                <div className="flex gap-2 items-center mt-2">
                  <input
                    type="text"
                    value={customFieldKey}
                    onChange={(e) =>
                      setCustomFieldKey(
                        e.target.value.replace(/[^a-zA-Z0-9_]/g, ""),
                      )
                    }
                    placeholder="fieldName"
                    className="w-32 px-3 py-1.5 bg-gray-900 border border-gray-600 text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <button
                    onClick={() => {
                      if (customFieldKey && !projectData[customFieldKey]) {
                        setProjectData({
                          ...projectData,
                          [customFieldKey]: "",
                        });
                        setCustomFieldKey("");
                      }
                    }}
                    disabled={
                      !customFieldKey ||
                      !!projectData[customFieldKey] ||
                      STANDARD_PROJECT_DATA_FIELDS.includes(
                        customFieldKey as (typeof STANDARD_PROJECT_DATA_FIELDS)[number],
                      )
                    }
                    className="px-3 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    + Add Field
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    await projectHook.updateProject({ projectData });
                    setNotification({ message: "Project data saved" });
                  } catch (err) {
                    setNotification({
                      message:
                        err instanceof Error
                          ? err.message
                          : "Failed to save project data",
                    });
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  "Save Project Data"
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            <span className="mr-2">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Provider Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryProviders.map((meta) => {
          const config = getProviderConfig(meta.type);
          const isConfigured = !!config;
          const isEnabled = config?.enabled || false;

          return (
            <div
              key={meta.type}
              className={`bg-gray-800 rounded-lg p-5 border transition-colors ${
                isEnabled
                  ? "border-green-500/50"
                  : isConfigured
                  ? "border-yellow-500/30"
                  : "border-gray-700"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{meta.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {meta.name}
                    </h3>
                    <p className="text-gray-500 text-sm">{meta.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  {isConfigured ? (
                    <>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          isEnabled
                            ? "bg-green-500/10 text-green-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {isEnabled ? "Enabled" : "Configured"}
                      </span>
                      {isConfigured && (
                        <button
                          onClick={() => handleToggleProvider(meta.type)}
                          disabled={isSaving}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            isEnabled ? "bg-green-600" : "bg-gray-600"
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              isEnabled ? "translate-x-5" : "translate-x-1"
                            }`}
                          />
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-400">
                      Not configured
                    </span>
                  )}
                </div>

                <div className="flex space-x-2">
                  {isConfigured && (
                    <button
                      onClick={() => handleRemoveProvider(meta.type)}
                      disabled={isSaving}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Remove"
                    >
                      🗑️
                    </button>
                  )}
                  <a
                    href={`/project/provider?project_id=${projectHook.project?.clientID}&provider_type=${meta.type}`}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {isConfigured ? "Edit" : "Configure"}
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enabled Providers Summary */}
      {enabledCount > 0 && (
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            Enabled Providers
          </h3>
          <div className="flex flex-wrap gap-3">
            {providers
              .filter((p) => p.enabled)
              .map((p) => {
                const meta = getProviderMeta(p.type);
                return (
                  <div
                    key={p.type}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-700 rounded-lg"
                  >
                    <span>{meta?.icon}</span>
                    <span className="text-white">{meta?.name}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectClientInfo({
  project,
  setNotification,
}: {
  project: Project;
  setNotification: (notif: { message: string } | null) => void;
}) {
  const [showSecret, setShowSecret] = useState(false);

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-xl">🔑</span>
        <h3 className="text-lg font-semibold text-white">
          Project Client Info
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-gray-400 text-sm">Client-ID</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 text-white font-mono text-sm rounded-lg break-all">
              {project?.clientID}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(project?.clientID || "");
                setNotification({ message: "Client-ID copied!" });
              }}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Copy Client-ID"
            >
              📋
            </button>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-gray-400 text-sm">Issuer URL</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 text-white font-mono text-sm rounded-lg break-all">
              {project?.authEndpointURL}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(project?.authEndpointURL || "");
                setNotification({ message: "Auth Endpoint URL copied!" });
              }}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Copy Auth Endpoint URL"
            >
              📋
            </button>
          </div>
        </div>
        {/* Secret */}
        <div className="space-y-1 md:col-span-2">
          <div>
            <label className="text-gray-400 text-sm">Client Secret</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 text-white font-mono text-sm rounded-lg break-all">
                {showSecret
                  ? project?.secret
                  : "*".repeat(project.secret.length)}
              </code>
              <div className="flex flex-col">
                <button className="">
                  <span
                    onClick={() => setShowSecret(!showSecret)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    title={
                      showSecret ? "Hide Client Secret" : "Show Client Secret"
                    }
                  >
                    {showSecret ? "🙈" : "👁️"}
                  </span>
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(project?.secret || "");
                    setNotification({ message: "Client Secret copied!" });
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title="Copy Client Secret"
                >
                  📋
                </button>
              </div>
            </div>
            <p className="text-gray-500 text-xs mt-2">
              Do not share your Client Secret with anyone. it can modify any
              part of the user data. ONLY use it in secure server-side
              environments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AllowOriginForm({
  isSaving,
  setIsSaving,
  updateProject,
  setNotification,
  project,
}: {
  isSaving?: boolean;
  setIsSaving: (saving: boolean) => void;
  updateProject: (data: Partial<Project>) => Promise<void>;
  setNotification: (notif: { message: string } | null) => void;
  project: Project;
}) {
  const [value, setValue] = useState(project?.originURL || "");

  return (
    <SelectWrapper icon="🌐" name="Allow Origin URL">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setIsSaving(true);
          updateProject({
            originURL: value,
          })
            .then(() => {
              setNotification({ message: "Origin URL updated" });
            })
            .catch((err) => {
              setNotification({
                message:
                  err instanceof Error
                    ? err.message
                    : "Failed to update origin URL",
              });
            })
            .finally(() => {
              setIsSaving(false);
            });
        }}
      >
        <input
          name="origin"
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://example.com"
          className="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isSaving}
        />
        <button
          type="submit"
          disabled={isSaving}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Save
        </button>
      </form>
    </SelectWrapper>
  );
}

function SelectWrapper({
  children,
  name,
  icon,
  action,
  helpText,
}: {
  children: React.ReactNode;
  name: string;
  icon: string;
  action?: React.ReactNode;
  helpText?: string | React.ReactNode;
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-xl">{icon}</span>
          <h3 className="text-sm font-medium text-white">{name}</h3>
        </div>
        {action}
      </div>
      {children}
      {helpText && (
        <div className="flex items-center justify-between mt-2">
          <p className="text-gray-500 text-xs">{helpText}</p>
          <span></span>
        </div>
      )}
    </div>
  );
}
