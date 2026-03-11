import React, { useState, useEffect, useCallback } from "react";
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
import { Icon } from "@iconify/react";
import { ProviderIcon } from "@components/provider-icons";
import { useProject } from "../../hooks/useProjects";
import { useUIThemes } from "../../hooks/useUIThemes";
import { useEmailTemplates } from "../../hooks/useEmailTemplates";
import { Snackbar } from "@material/react-snackbar";
import { POST as createInviteLink } from "@api/invitelink";
import { useCopyTemplates } from "@hooks/useCopyTemplates";
import { useWebHook } from "@hooks/useWebHook";
import { WebHookEventsDetails } from "openauth-webui-shared-types/webhook/types";
import type {
  WebHookConfig,
  WebHookEvents,
  ExtendedWebHookConfig,
} from "openauth-webui-shared-types/webhook/types";

const CATEGORIES: { id: ProviderCategory; label: string; icon: string }[] = [
  { id: "social", label: "Social", icon: "lucide:users" },
  { id: "enterprise", label: "Enterprise", icon: "lucide:building-2" },
  { id: "custom", label: "Custom", icon: "lucide:wrench" },
  { id: "form", label: "Form-based", icon: "lucide:file-text" },
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

const WEBHOOK_EVENT_OPTIONS = WebHookEventsDetails;

const getWebHookEventLabel = (event: WebHookEvents) => {
  return (
    WEBHOOK_EVENT_OPTIONS.find((option) => option.event === event)?.label ||
    event
  );
};

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

  const {
    webhooks,
    registerWebHook,
    getWebHooks,
    deleteWebHook,
    updateWebHook,
  } = useWebHook(projectHook.project?.clientID || "");
  const [isWebHookModalOpen, setIsWebHookModalOpen] = useState(false);
  const [activeWebHook, setActiveWebHook] =
    useState<ExtendedWebHookConfig | null>(null);
  const [isWebHookSaving, setIsWebHookSaving] = useState(false);

  const categoryProviders = getProvidersByCategory(activeCategory);
  const enabledCount = providers.filter((p) => p.enabled).length;

  useEffect(() => {
    if (!projectHook.project?.clientID) return;
    getWebHooks().catch((err) => {
      setNotification({
        message: err instanceof Error ? err.message : "Failed to load webhooks",
      });
    });
  }, [getWebHooks, projectHook.project?.clientID]);

  const handleOpenCreateWebhook = () => {
    setActiveWebHook(null);
    setIsWebHookModalOpen(true);
  };

  const handleOpenEditWebhook = (webhook: ExtendedWebHookConfig) => {
    setActiveWebHook(webhook);
    setIsWebHookModalOpen(true);
  };

  const handleCloseWebhookModal = () => {
    setIsWebHookModalOpen(false);
    setActiveWebHook(null);
  };

  const handleSaveWebhook = async (config: WebHookConfig) => {
    setIsWebHookSaving(true);
    try {
      const res = activeWebHook
        ? await updateWebHook(activeWebHook.id, config)
        : await registerWebHook(config.event, config);
      if (!res?.success) {
        throw new Error(res?.error || "Failed to save webhook");
      }
      setNotification({
        message: activeWebHook ? "Webhook updated" : "Webhook created",
      });
      handleCloseWebhookModal();
    } catch (err) {
      setNotification({
        message: err instanceof Error ? err.message : "Failed to save webhook",
      });
    } finally {
      setIsWebHookSaving(false);
    }
  };

  const handleDeleteWebhook = async (webhook: ExtendedWebHookConfig) => {
    if (!confirm("Delete this webhook?")) return;
    setIsWebHookSaving(true);
    try {
      const res = await deleteWebHook(webhook.id);
      if (!res?.success) {
        throw new Error(res?.error || "Failed to delete webhook");
      }
      setNotification({ message: "Webhook deleted" });
    } catch (err) {
      setNotification({
        message:
          err instanceof Error ? err.message : "Failed to delete webhook",
      });
    } finally {
      setIsWebHookSaving(false);
    }
  };

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
          icon={<Icon icon="lucide:palette" className="w-5 h-5 text-gray-300" />}
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
          icon={<Icon icon="lucide:mail" className="w-5 h-5 text-gray-300" />}
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
          icon={<Icon icon="lucide:monitor" className="w-5 h-5 text-gray-300" />}
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
        <RegisterOnInviteForm
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
                        <Icon icon="lucide:x" className="w-4 h-4" />
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

      {/* Webhooks */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Icon icon="lucide:bell" className="w-5 h-5" />
              Webhooks
            </h3>
            <p className="text-gray-400 text-sm">
              Send event payloads to your endpoints in real time.
            </p>
          </div>
          <button
            onClick={handleOpenCreateWebhook}
            disabled={isWebHookSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            + Create Webhook
          </button>
        </div>

        {webhooks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-700 p-6 text-center">
            <p className="text-gray-400 text-sm">No webhooks configured yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="bg-gray-900/60 border border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-1 text-xs rounded bg-blue-500/10 text-blue-400">
                        {getWebHookEventLabel(webhook.event)}
                      </span>
                      <span className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                        {webhook.method}
                      </span>
                    </div>
                    <p className="text-gray-200 break-all mt-2">
                      {webhook.url}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {webhook.headers
                        ? `${Object.keys(webhook.headers).length} headers`
                        : "No headers"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditWebhook(webhook)}
                      disabled={isWebHookSaving}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteWebhook(webhook)}
                      disabled={isWebHookSaving}
                      className="px-3 py-1.5 text-red-300 hover:text-red-200 hover:bg-red-500/10 rounded-lg disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
            <Icon icon={cat.icon} className="w-4 h-4 mr-2 inline" />
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
                  <ProviderIcon type={meta.type} className="w-8 h-8 text-gray-300" />
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
                      <Icon icon="lucide:trash-2" className="w-4 h-4" />
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
                    <ProviderIcon type={p.type} className="w-4 h-4 text-gray-300" />
                    <span className="text-white">{meta?.name}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {isWebHookModalOpen && (
        <WebHookModal
          data={activeWebHook || undefined}
          isSaving={isWebHookSaving}
          onClose={handleCloseWebhookModal}
          onSave={handleSaveWebhook}
        />
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
        <Icon icon="lucide:key" className="w-5 h-5 text-gray-300" />
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
              <Icon icon="lucide:clipboard-copy" className="w-4 h-4" />
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
              <Icon icon="lucide:clipboard-copy" className="w-4 h-4" />
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
                    {showSecret ? <Icon icon="lucide:eye-off" className="w-4 h-4" /> : <Icon icon="lucide:eye" className="w-4 h-4" />}
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
                  <Icon icon="lucide:clipboard-copy" className="w-4 h-4" />
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

function RegisterOnInviteForm({
  project,
  setNotification,
  updateProject,
  isSaving,
  setIsSaving,
}: {
  project: Project;
  setNotification: (notif: { message: string } | null) => void;
  updateProject: (data: Partial<Project>) => Promise<void>;
  isSaving?: boolean;
  setIsSaving: (saving: boolean) => void;
}) {
  const [value, setValue] = useState(Boolean(project?.registerOnInvite));
  const [modaleOpen, setModalOpen] = useState(false);

  const handleChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    async (e) => {
      const checked = e.target.checked;
      setIsSaving(true);
      try {
        await updateProject({ registerOnInvite: checked });
        setValue(checked);
        setNotification({
          message: `Register on Invite Only ${
            checked ? "enabled" : "disabled"
          }`,
        });
      } catch (err) {
        setNotification({
          message:
            err instanceof Error
              ? err.message
              : "Failed to update Register on Invite Only setting",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [setIsSaving, setNotification, updateProject],
  );

  return (
    <SelectWrapper icon={<Icon icon="lucide:mail" className="w-5 h-5 text-gray-300" />} name="Register on Invite Only">
      <div className="mt-4">
        <label className="inline-flex items-center cursor-pointer group/checkbox">
          <div className="relative">
            <input
              type="checkbox"
              checked={value}
              disabled={isSaving}
              onChange={handleChange}
              className="appearance-none w-5 h-5 rounded border-2 border-gray-400 checked:border-blue-500 checked:bg-blue-500 cursor-pointer transition-all duration-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-600"
            />
            <svg
              className="absolute inset-0 w-4 h-4 text-white pointer-events-none m-auto opacity-0 group-checked/checkbox:opacity-100 transition-opacity duration-150"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <span className="ml-3 text-gray-300 group-hover/checkbox:text-gray-100 transition-colors duration-150 select-none font-medium">
            Register on Invite Only
          </span>
        </label>
        {value && (
          <div className="mt-2 flex items-center justify-between">
            <span
              onClick={() => setModalOpen(true)}
              className="text-gray-500 text-xs hover:text-blue-400 transition-colors cursor-pointer"
            >
              create invite link
            </span>
          </div>
        )}
        {modaleOpen && (
          <InviteLinkModal
            project={project}
            onClose={() => setModalOpen(false)}
            setNotification={setNotification}
          />
        )}
      </div>
    </SelectWrapper>
  );
}

function InviteLinkModal({
  project,
  onClose,
  setNotification,
}: {
  project: Project;
  onClose: () => void;
  setNotification: (notif: { message: string } | null) => void;
}) {
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copyID, setCopyID] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number>(60);
  const [isLoading, setIsLoading] = useState(false);
  const { templates, isLoading: isTemplatesLoading } = useCopyTemplates();

  const onCreate = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await createInviteLink({
        clientID: project.clientID,
        copyID: copyID || undefined,
        expireInMin: expiresIn,
      });
      if (res.error) {
        throw new Error(res.error);
      }
      setInviteLink(res.data?.link!);
      setNotification({ message: "Invite link created successfully!" });
    } catch (err) {
      setNotification({
        message:
          err instanceof Error ? err.message : "Failed to create invite link",
      });
    } finally {
      setIsLoading(false);
    }
  }, [copyID, expiresIn, project.clientID, onClose, setNotification]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Icon icon="lucide:link" className="w-6 h-6 text-gray-300" />
            <h2 className="text-xl font-semibold text-white">
              Create Invite Link
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Close"
          >
            <Icon icon="lucide:x" className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Copy Template Select */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Copy Template
            </label>
            {isTemplatesLoading ? (
              <div className="h-10 bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <select
                value={copyID || ""}
                onChange={(e) => setCopyID(e.target.value || null)}
                disabled={isLoading}
                className="w-full px-3 py-2.5 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select a template (optional)</option>
                {templates.map((template) => (
                  <option key={template.name} value={template.name}>
                    {template.name}
                  </option>
                ))}
              </select>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Choose a copy/template to associate with this invite link
            </p>
          </div>

          {/* Expires In Input */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Expires In (minutes)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={expiresIn}
                onChange={(e) =>
                  setExpiresIn(Math.max(1, parseInt(e.target.value) || 60))
                }
                disabled={isLoading}
                min="1"
                max="10080"
                className="flex-1 px-3 py-2.5 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-gray-400 text-sm whitespace-nowrap">
                {Math.floor(expiresIn / 60) > 0
                  ? `${Math.floor(expiresIn / 60)}h ${expiresIn % 60}m`
                  : `${expiresIn}m`}
              </span>
            </div>
            <p className="text-gray-500 text-xs mt-1">
              Link will expire after the specified duration
            </p>
          </div>
        </div>

        {inviteLink && (
          <div className="mt-6 p-4 bg-linear-to-br from-green-900/20 to-green-800/10 rounded-lg border border-green-600/30 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-green-400 text-sm font-semibold flex items-center gap-1.5">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Invite Link Created
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2.5 bg-gray-900 border border-gray-600 text-green-400 font-mono text-xs rounded-lg break-all select-all max-h-24 overflow-y-auto">
                  {inviteLink}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink);
                    setNotification({
                      message: "Invite link copied to clipboard!",
                    });
                  }}
                  className="p-2.5 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded-lg transition-all duration-200 border border-green-600/30 hover:border-green-500/50"
                  title="Copy to clipboard"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-green-400/70 text-xs">
                Share this link with users to allow them to register via invite
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onCreate}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              <>
                <Icon icon="lucide:check" className="w-4 h-4" />
                Create Link
              </>
            )}
          </button>
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
    <SelectWrapper icon={<Icon icon="lucide:globe" className="w-5 h-5 text-gray-300" />} name="Allow Origin URL">
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
  icon: React.ReactNode;
  action?: React.ReactNode;
  helpText?: string | React.ReactNode;
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {icon}
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

function WebHookModal({
  data,
  onClose,
  onSave,
  isSaving,
}: {
  data?: ExtendedWebHookConfig;
  onClose: () => void;
  onSave: (config: WebHookConfig) => void | Promise<void>;
  isSaving?: boolean;
}) {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState<WebHookConfig["method"]>("POST");
  const [event, setEvent] = useState<WebHookEvents>("registration_success");
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>(
    [],
  );

  useEffect(() => {
    if (data) {
      setUrl(data.url || "");
      setMethod(data.method || "POST");
      setEvent(data.event || "registration_success");
      setHeaders(
        data.headers
          ? Object.entries(data.headers).map(([key, value]) => ({
              key,
              value,
            }))
          : [],
      );
    } else {
      setUrl("");
      setMethod("POST");
      setEvent("registration_success");
      setHeaders([]);
    }
  }, [data]);

  const selectedEvent = WEBHOOK_EVENT_OPTIONS.find(
    (option) => option.event === event,
  );

  const handleHeaderChange = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    setHeaders((prev) =>
      prev.map((header, idx) =>
        idx === index ? { ...header, [field]: value } : header,
      ),
    );
  };

  const handleHeaderAdd = () => {
    setHeaders((prev) => [...prev, { key: "", value: "" }]);
  };

  const handleHeaderRemove = (index: number) => {
    setHeaders((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (eventAction: React.FormEvent) => {
    eventAction.preventDefault();
    const normalizedHeaders = headers
      .map((header) => ({
        key: header.key.trim(),
        value: header.value.trim(),
      }))
      .filter((header) => header.key && header.value);
    const headersRecord = normalizedHeaders.length
      ? Object.fromEntries(
          normalizedHeaders.map((header) => [header.key, header.value]),
        )
      : undefined;

    onSave({
      url: url.trim(),
      method,
      event,
      headers: headersRecord,
    });
  };

  const isValid = Boolean(url.trim());

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            {data ? "Edit Webhook" : "Create Webhook"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Close"
          >
            <Icon icon="lucide:x" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Event
            </label>
            <select
              value={event}
              onChange={(eventChange) =>
                setEvent(eventChange.target.value as WebHookEvents)
              }
              disabled={isSaving}
              className="w-full px-3 py-2.5 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {WEBHOOK_EVENT_OPTIONS.map((option) => (
                <option key={option.event} value={option.event}>
                  {option.label}
                </option>
              ))}
            </select>
            {selectedEvent && (
              <p className="text-gray-500 text-xs mt-1">
                {selectedEvent.description}
              </p>
            )}
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Endpoint URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/webhooks"
              disabled={isSaving}
              className="w-full px-3 py-2.5 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              HTTP Method
            </label>
            <div className="flex gap-2">
              {(["POST", "GET"] as Array<WebHookConfig["method"]>).map(
                (methodOption) => (
                  <button
                    type="button"
                    key={methodOption}
                    onClick={() => setMethod(methodOption)}
                    disabled={isSaving}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      method === methodOption
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500"
                    }`}
                  >
                    {methodOption}
                  </button>
                ),
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-gray-300 text-sm font-medium">
                Headers (optional)
              </label>
              <button
                type="button"
                onClick={handleHeaderAdd}
                disabled={isSaving}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                + Add Header
              </button>
            </div>
            {headers.length === 0 ? (
              <p className="text-gray-500 text-xs">No headers added yet.</p>
            ) : (
              <div className="space-y-2">
                {headers.map((header, index) => (
                  <div key={`${header.key}-${index}`} className="flex gap-2">
                    <input
                      type="text"
                      value={header.key}
                      onChange={(e) =>
                        handleHeaderChange(index, "key", e.target.value)
                      }
                      placeholder="Header"
                      disabled={isSaving}
                      className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) =>
                        handleHeaderChange(index, "value", e.target.value)
                      }
                      placeholder="Value"
                      disabled={isSaving}
                      className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleHeaderRemove(index)}
                      disabled={isSaving}
                      className="px-2 text-red-300 hover:text-red-200 hover:bg-red-500/10 rounded-lg"
                      title="Remove header"
                    >
                      <Icon icon="lucide:x" className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !isValid}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                "Save Webhook"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
