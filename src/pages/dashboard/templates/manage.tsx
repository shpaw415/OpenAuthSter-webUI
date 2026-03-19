import type { EmailTemplateProps } from "openauth-webui-shared-types";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Icon } from "@iconify/react";
import Editor from "@monaco-editor/react";
import {
  useEmailTemplate,
  useEmailTemplates,
} from "@hooks/useEmailTemplates";
import { useProject } from "@hooks/useProjects";
import Mustache from "mustache";
import { navigate } from "@utils";

const DEFAULT_MOCK_DATA = {
  code: "123456",
  email: "user@example.com",
  appName: "Your Company",
};

const DEFAULT_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0;">{{appName}}</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="margin-top: 0;">Hello!</h2>
    <p>Your verification code is:</p>
    <div style="background: #e5e7eb; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 6px; margin: 20px 0;">
      {{code}}
    </div>
    <p>If you didn't request this code, you can safely ignore this email.</p>
  </div>
  <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
    <p style="margin: 0;">&copy; 2026 {{appName}}. All rights reserved.</p>
  </div>
</body>
</html>`;

export default function EmailTemplatesManage() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [emailTemplateProps, setEmailTemplateProps] =
    useState<EmailTemplateProps>({
      subject: "",
      body: DEFAULT_HTML_TEMPLATE,
      name: "",
    });
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [mockData, setMockData] =
    useState<Record<string, string>>(DEFAULT_MOCK_DATA);
  const [mockDataError, setMockDataError] = useState<string | null>(null);
  const [mockDataInitialized, setMockDataInitialized] = useState(false);

  // Fetch project data if project_id is provided
  const { project: linkedProject } = useProject(projectId);

  // Parse template with mustache
  const parsedPreview = useMemo(() => {
    try {
      setMockDataError(null);
      return Mustache.render(emailTemplateProps.body, mockData);
    } catch (err) {
      setMockDataError(
        err instanceof Error ? err.message : "Failed to parse template",
      );
      return emailTemplateProps.body;
    }
  }, [emailTemplateProps.body, mockData]);

  // Extract mustache variables from template
  const templateVariables = useMemo(() => {
    const regex = /\{\{([^{}]+)\}\}/g;
    const matches = emailTemplateProps.body.matchAll(regex);
    const variables = new Set<string>();
    for (const match of matches) {
      const varName = match[1]?.trim();
      // Skip section tags like #, /, ^
      if (
        varName &&
        !varName.startsWith("#") &&
        !varName.startsWith("/") &&
        !varName.startsWith("^")
      ) {
        variables.add(varName);
      }
    }
    // Also include project data keys so users can see available variables
    if (linkedProject?.projectData) {
      Object.keys(linkedProject.projectData).forEach((key) => {
        if (linkedProject.projectData?.[key]) {
          variables.add(key);
        }
      });
    }
    return Array.from(variables);
  }, [emailTemplateProps.body, linkedProject?.projectData]);

  // Get template name and project_id from URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const editName = url.searchParams.get("edit");
    const projectIdParam = url.searchParams.get("project_id");
    if (editName) {
      setIsEditMode(true);
      setTemplateName(editName);
    }
    if (projectIdParam) {
      setProjectId(projectIdParam);
    }
  }, []);

  // Initialize and sync mock data with project data when available
  useEffect(() => {
    const projectData = linkedProject?.projectData;
    if (projectData) {
      setMockData((prevMockData) => {
        const newMockData: Record<string, string> = {
          ...DEFAULT_MOCK_DATA,
          ...prevMockData,
        };
        // Merge project data into mock data (project data takes precedence for unedited fields)
        Object.entries(projectData).forEach(([key, value]) => {
          if (value && !mockDataInitialized) {
            // Only override if not yet initialized (first load)
            newMockData[key] = value;
          } else if (value && !(key in prevMockData)) {
            // Add new project fields that don't exist yet
            newMockData[key] = value;
          }
        });
        return newMockData;
      });
      if (!mockDataInitialized) {
        setMockDataInitialized(true);
      }
    }
  }, [linkedProject?.projectData, mockDataInitialized]);

  // Hook for fetching existing template in edit mode
  const { template, isLoading, error } = useEmailTemplate(
    isEditMode ? templateName : "",
  );

  // Hook for creating new templates
  const { createTemplate } = useEmailTemplates();

  // Hook for updating templates
  const { updateTemplate } = useEmailTemplate(isEditMode ? templateName : "");

  // Load template data when editing
  useEffect(() => {
    if (template && isEditMode) {
      setEmailTemplateProps({
        name: template.name,
        subject: template.subject,
        body: template.body,
      });
    }
  }, [template, isEditMode]);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = async () => {
    // Validation
    if (!emailTemplateProps.name.trim()) {
      showNotification("error", "Template name is required");
      return;
    }
    if (!emailTemplateProps.subject.trim()) {
      showNotification("error", "Subject is required");
      return;
    }
    if (!emailTemplateProps.body.trim()) {
      showNotification("error", "Template body is required");
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode) {
        await updateTemplate({
          subject: emailTemplateProps.subject,
          body: emailTemplateProps.body,
        });
        showNotification("success", "Template updated successfully");
      } else {
        await createTemplate(emailTemplateProps);
        showNotification("success", "Template created successfully");
        // Redirect to list after creating
        setTimeout(() => {
          navigate("/templates");
        }, 1500);
      }
    } catch (err) {
      showNotification(
        "error",
        err instanceof Error ? err.message : "Failed to save template",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setEmailTemplateProps((prev) => ({ ...prev, body: value }));
    }
  }, []);

  if (isEditMode && isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (isEditMode && error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
          <p className="text-red-300">{error}</p>
          <a
            href="/dashboard/templates"
            className="inline-block mt-4 text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to Templates
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 h-full flex flex-col">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-lg ${
            notification.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <a
            href="/dashboard/templates"
            className="text-gray-300 hover:text-white flex items-center gap-2 transition-colors"
          >
            <span>←</span>
            Back
          </a>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {isEditMode ? "Edit Template" : "Create Template"}
            </h1>
            <p className="text-gray-400 text-sm sm:text-base mt-1">
              {isEditMode
                ? `Editing: ${templateName}`
                : "Create a new email template"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
          >
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                <span className="hidden sm:inline">Saving...</span>
              </>
            ) : (
              <>
                Save<span className="hidden sm:inline"> Template</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Template Name
          </label>
          <input
            type="text"
            value={emailTemplateProps.name}
            onChange={(e) =>
              setEmailTemplateProps((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
            disabled={isEditMode}
            placeholder="e.g., password-reset, welcome-email"
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Email Subject
          </label>
          <input
            type="text"
            value={emailTemplateProps.subject}
            onChange={(e) =>
              setEmailTemplateProps((prev) => ({
                ...prev,
                subject: e.target.value,
              }))
            }
            placeholder="e.g., Reset your password"
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Editor and Preview */}
      <div
        className={`flex-1 grid ${
          showPreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
        } gap-4 min-h-0`}
      >
        {/* Monaco Editor */}
        <div className="flex flex-col border border-gray-600 rounded-lg overflow-hidden min-h-75 sm:min-h-100">
          <div className="bg-gray-800 px-4 py-2 border-b border-gray-600 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-200">
              HTML Editor
            </span>
            <span className="text-xs text-gray-400">HTML</span>
          </div>
          <div className="flex-1 min-h-150">
            <Editor
              height="100%"
              defaultLanguage="html"
              value={emailTemplateProps.body}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
          </div>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="flex flex-col gap-4 min-h-75 sm:min-h-100">
            {/* Mock Data Editor */}
            <div className="border border-gray-600 rounded-lg overflow-hidden">
              <div className="bg-gray-800 px-4 py-2 border-b border-gray-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-200">
                    Mock Data (Mustache Variables)
                  </span>
                  {linkedProject && (
                    <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded">
                      Using data from: {linkedProject.clientID}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setMockData(DEFAULT_MOCK_DATA);
                    setMockDataInitialized(false);
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Reset to Default
                </button>
              </div>
              <div className="p-3 bg-gray-900 max-h-50 overflow-auto">
                {mockDataError && (
                  <div className="mb-2 p-2 bg-red-900/50 border border-red-700 rounded text-red-300 text-xs">
                    {mockDataError}
                  </div>
                )}
                {templateVariables.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No mustache variables detected. Use {"{{variableName}}"} in
                    your template.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {templateVariables.map((variable) => {
                      const isInTemplate = emailTemplateProps.body.includes(
                        `{{${variable}}}`,
                      );
                      const isFromProject =
                        linkedProject?.projectData?.[variable] !== undefined;
                      return (
                        <div key={variable} className="flex items-center gap-2">
                          <label className="text-gray-400 text-xs w-24 truncate shrink-0 flex items-center gap-1">
                            {`{{${variable}}}`}
                            {isFromProject && !isInTemplate && (
                              <span
                                className="text-yellow-400"
                                title="Available from project - not used in template yet"
                              >
                                <Icon
                                  icon="lucide:alert-triangle"
                                  className="w-3.5 h-3.5"
                                />
                              </span>
                            )}
                            {isFromProject && isInTemplate && (
                              <span
                                className="text-green-400"
                                title="From project data"
                              >
                                <Icon
                                  icon="lucide:check"
                                  className="w-3.5 h-3.5"
                                />
                              </span>
                            )}
                          </label>
                          <input
                            type="text"
                            value={mockData[variable] || ""}
                            onChange={(e) =>
                              setMockData((prev) => ({
                                ...prev,
                                [variable]: e.target.value,
                              }))
                            }
                            placeholder={`Value for ${variable}`}
                            className={`flex-1 px-2 py-1 bg-gray-800 border text-white placeholder-gray-500 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                              isFromProject
                                ? "border-green-600/50"
                                : "border-gray-600"
                            }`}
                          />
                          {!isInTemplate && (
                            <span className="text-xs text-yellow-400">
                              Not in template
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Parsed Preview */}
            <div className="flex-1 flex flex-col border border-gray-600 rounded-lg overflow-hidden min-h-50">
              <div className="bg-gray-800 px-4 py-2 border-b border-gray-600 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-200">
                  Preview (Parsed)
                </span>
                <span className="text-xs text-gray-400">
                  {templateVariables.length} variable
                  {templateVariables.length !== 1 ? "s" : ""} detected
                </span>
              </div>
              <div className="flex-1 bg-white overflow-auto">
                <iframe
                  srcDoc={parsedPreview}
                  title="Email Preview"
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
