import { useState, useEffect, useMemo } from "react";
import {
  useCopyTemplate,
  useCopyTemplates,
} from "../../hooks/useCopyTemplates";

// Default copy fields based on OpenAuth source
const CODE_COPY_FIELDS: Record<string, string> = {
  email_placeholder: "email@example.com",
  email_invalid: "Invalid email address",
  button_continue: "Continue",
  code_info: "We'll send a pin code to your email",
  code_placeholder: "Code",
  code_invalid: "Invalid code",
  code_sent: "Code sent to ",
  code_resent: "Code resent to ",
  code_didnt_get: "Didn't get code?",
  code_resend: "Resend",
};

const PASSWORD_COPY_FIELDS: Record<string, string> = {
  error_email_taken: "Email is already registered",
  error_invalid_code: "Invalid code",
  error_invalid_email: "Invalid email address",
  error_invalid_password: "Invalid password",
  error_password_mismatch: "Passwords do not match",
  error_validation_error: "Validation error",
  register_title: "Register",
  register_description: "Create your account",
  login_title: "Login",
  login_description: "Welcome back",
  register: "Register",
  register_prompt: "Don't have an account?",
  login_prompt: "Already have an account?",
  login: "Login",
  change_prompt: "Change password?",
  code_resend: "Resend",
  code_return: "Return to login",
  input_email: "Email",
  input_password: "Password",
  input_code: "Code",
  input_repeat: "Repeat Password",
  button_continue: "Continue",
};

type ProviderType = "code" | "password";

export default function CopyManagePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const editName = urlParams.get("edit");
  const isEditing = !!editName;

  const {
    template,
    isLoading: isLoadingTemplate,
    updateTemplate,
  } = useCopyTemplate(editName || "");
  const { createTemplate } = useCopyTemplates();

  const [name, setName] = useState("");
  const [providerType, setProviderType] = useState<ProviderType>("code");
  const [copyData, setCopyData] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const defaultFields = useMemo(
    () => (providerType === "code" ? CODE_COPY_FIELDS : PASSWORD_COPY_FIELDS),
    [providerType],
  );

  // Load existing template data
  useEffect(() => {
    if (template) {
      setName(template.name);
      setProviderType(template.providerType);
      setCopyData(template.copyData);
    }
  }, [template]);

  // Reset copy data when provider type changes (only for new templates)
  useEffect(() => {
    if (!isEditing) {
      setCopyData({});
    }
  }, [providerType, isEditing]);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFieldChange = (key: string, value: string) => {
    setCopyData((prev) => {
      if (value === "" || value === defaultFields[key]) {
        // Remove field if empty or matches default
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showNotification("error", "Template name is required");
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        await updateTemplate({ copyData });
        showNotification("success", "Copy template updated successfully");
      } else {
        await createTemplate({
          name: name.trim(),
          providerType,
          copyData,
        });
        showNotification("success", "Copy template created successfully");
        // Redirect to list after short delay
        setTimeout(() => {
          window.location.href = "/copy";
        }, 1000);
      }
    } catch (err) {
      showNotification(
        "error",
        err instanceof Error ? err.message : "Failed to save copy template",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const customizedCount = Object.keys(copyData).filter(
    (key) => copyData[key] && copyData[key] !== defaultFields[key],
  ).length;

  if (isEditing && isLoadingTemplate) {
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
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${
            notification.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <a
          href="/copy"
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </a>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {isEditing ? `Edit Copy Template` : "Create Copy Template"}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Customize UI text for authentication flows
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Template Settings
              </h2>

              {/* Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isEditing}
                  placeholder="e.g., custom-login-text"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Provider Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Provider Type
                </label>
                <select
                  value={providerType}
                  onChange={(e) =>
                    setProviderType(e.target.value as ProviderType)
                  }
                  disabled={isEditing}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="code">Pin Code (Email)</option>
                  <option value="password">Password</option>
                </select>
                <p className="text-gray-500 text-xs mt-1">
                  {providerType === "code"
                    ? "Customize text for email-based code authentication"
                    : "Customize text for username/password authentication"}
                </p>
              </div>

              {/* Stats */}
              <div className="pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Total fields</span>
                  <span className="text-white">
                    {Object.keys(defaultFields).length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-400">Customized</span>
                  <span className="text-blue-400">{customizedCount}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : isEditing ? (
                  "Update Template"
                ) : (
                  "Create Template"
                )}
              </button>
              <a
                href="/copy"
                className="block w-full mt-3 px-4 py-2 text-center bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </a>
            </div>
          </div>

          {/* Copy Fields */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Copy Fields
                </h2>
                <span className="text-gray-400 text-sm">
                  Leave blank to use default value
                </span>
              </div>

              <div className="space-y-4">
                {Object.entries(defaultFields).map(([key, defaultValue]) => (
                  <CopyFieldInput
                    key={key}
                    fieldKey={key}
                    defaultValue={defaultValue}
                    value={copyData[key] || ""}
                    onChange={(value) => handleFieldChange(key, value)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function CopyFieldInput({
  fieldKey,
  defaultValue,
  value,
  onChange,
}: {
  fieldKey: string;
  defaultValue: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const isCustomized = value && value !== defaultValue;

  // Format key for display
  const displayKey = fieldKey
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-300">
          {displayKey}
        </label>
        {isCustomized && (
          <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
            Customized
          </span>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={defaultValue}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
      />
      <p className="text-gray-500 text-xs mt-1">
        Default: <span className="text-gray-400">{defaultValue}</span>
      </p>
    </div>
  );
}
