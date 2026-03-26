import { FunctionEditorModal } from "@components/FunctionEditorModal";
import { useEmailTemplate, useEmailTemplates } from "@hooks/useEmailTemplates";
import { useProject } from "@hooks/useProjects";
import { Icon } from "@iconify/react";
import Editor from "@monaco-editor/react";
import { navigate } from "@utils";
import Mustache from "mustache";
import type { EmailTemplateProps } from "openauth-webui-shared-types";
import {
	type ComponentType,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";

const DEFAULT_MOCK_DATA = {
	code: "123456",
	email: "user@example.com",
	appName: "Your Company",
	function: "function::return 'Hello from a function!';",
};

const DEFAULT_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{appName}}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Brand -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:22px;font-weight:700;color:#4F46E5;letter-spacing:-0.5px;">{{appName}}</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.08);overflow:hidden;">

              <!-- Accent bar -->
              <div style="height:4px;background:linear-gradient(90deg,#4F46E5,#7C3AED);"></div>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 40px 32px;">
                    <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#4F46E5;text-transform:uppercase;letter-spacing:1px;">Verification Code</p>
                    <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#111827;line-height:1.3;">Confirm your identity</h1>
                    <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
                      Hi <strong style="color:#111827;">{{email}}</strong>, use the code below to complete your sign-in.
                      It expires in <strong style="color:#111827;">10 minutes</strong>.
                    </p>

                    <!-- Code box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td align="center" style="background:#f5f3ff;border:2px dashed #c4b5fd;border-radius:10px;padding:24px 16px;">
                          <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#4F46E5;font-variant-numeric:tabular-nums;">{{code}}</span>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
                      If you didn't request this, you can safely ignore this email. Someone may have entered your address by mistake.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <div style="height:1px;background:#f3f4f6;margin:0 40px;"></div>

              <!-- Security note -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:20px 40px;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                      🔒 <strong style="color:#6b7280;">Security tip:</strong> {{appName}} will never ask you to share this code with anyone.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">&copy; 2026 {{appName}} &middot; All rights reserved</p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">You received this because a sign-in was attempted with your account.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
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
	const [showPreview, setShowPreview] = useState(true);
	const [showVariables, setShowVariables] = useState(true);
	const [mockData, setMockData] =
		useState<Record<string, string>>(DEFAULT_MOCK_DATA);
	const [mockDataError, setMockDataError] = useState<string | null>(null);
	const [mockDataInitialized, setMockDataInitialized] = useState(false);
	const [showHelp, setShowHelp] = useState(false);
	const [HelpDoc, setHelpDoc] = useState<ComponentType | null>(null);
	const [createSandboxedFunction, setCreateSandboxedFunction] = useState<
		((fn: string) => (props: Record<string, unknown>) => unknown) | null
	>(null);
	const [fnEditorModal, setFnEditorModal] = useState<{
		key: string;
		draft: string;
	} | null>(null);

	useEffect(() => {
		import("../../../sandbox").then((mod) =>
			setCreateSandboxedFunction(() => mod.createSandboxedFunction),
		);
	}, []);

	// Fetch project data if project_id is provided
	const { project: linkedProject } = useProject(projectId);

	const parseEmailTemplateProps = useCallback(
		(props: Record<string, string>) => {
			return Object.fromEntries(
				Object.entries(props).map(([key, value]) => {
					if (value.startsWith("function::") && createSandboxedFunction) {
						return [
							key,
							createSandboxedFunction(value.replace("function::", "")).bind(
								null,
								props,
							),
						];
					}
					return [key, value];
				}),
			);
		},
		[createSandboxedFunction],
	);

	// Lazy-load help documentation when panel is first opened
	useEffect(() => {
		if (!showHelp || HelpDoc) return;
		import("@docs/templates/mustache-guide.mdx").then((mod) =>
			setHelpDoc(() => mod.default),
		);
	}, [showHelp, HelpDoc]);

	// Parse template with mustache
	const parsedPreview = useMemo(() => {
		try {
			setMockDataError(null);
			return Mustache.render(
				emailTemplateProps.body,
				parseEmailTemplateProps(mockData),
			);
		} catch (err) {
			setMockDataError(
				err instanceof Error ? err.message : "Failed to parse template",
			);
			return emailTemplateProps.body;
		}
	}, [emailTemplateProps.body, mockData, parseEmailTemplateProps]);

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
					navigate("/dashboard/templates");
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
			<div className="flex items-center justify-center h-48">
				<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
			</div>
		);
	}

	if (isEditMode && error) {
		return (
			<div className="p-6 max-w-lg mx-auto mt-8">
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
		<div className="h-[calc(100dvh-56px)] sm:h-[calc(100dvh-64px)] flex flex-col overflow-hidden">
			{/* Notification */}
			{notification && (
				<div
					className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm ${
						notification.type === "success"
							? "bg-green-600 text-white"
							: "bg-red-600 text-white"
					}`}
				>
					{notification.message}
				</div>
			)}

			{/* Header */}
			<header className="shrink-0 flex items-center justify-between px-4 h-12 border-b border-gray-700 bg-gray-900">
				<div className="flex items-center gap-2 min-w-0">
					<a
						href="/dashboard/templates"
						className="text-gray-400 hover:text-white transition-colors shrink-0"
						title="Back to Templates"
					>
						<Icon icon="lucide:arrow-left" className="w-4 h-4" />
					</a>
					<span className="text-gray-600 text-sm shrink-0 hidden sm:block">
						/
					</span>
					<span className="text-gray-400 text-sm hidden sm:block shrink-0">
						Templates
					</span>
					<span className="text-gray-600 text-sm hidden sm:block shrink-0">
						/
					</span>
					<span className="text-sm font-medium text-white truncate">
						{isEditMode ? templateName : "New Template"}
					</span>
				</div>
				<div className="flex items-center gap-1.5 shrink-0">
					<button
						type="button"
						onClick={() => setShowHelp(true)}
						className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
						title="Mustache template guide"
					>
						<Icon icon="lucide:book-open" className="w-4 h-4" />
					</button>
					<button
						type="button"
						onClick={handleSave}
						disabled={isSaving}
						className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
					>
						{isSaving ? (
							<>
								<div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-white" />
								Saving…
							</>
						) : (
							<>
								<Icon icon="lucide:save" className="w-3.5 h-3.5" />
								Save
							</>
						)}
					</button>
				</div>
			</header>

			{/* Form fields */}
			<div className="shrink-0 grid grid-cols-2 gap-3 px-4 py-2 border-b border-gray-700">
				<div>
					<label
						className="block text-xs font-medium text-gray-400 mb-1"
						htmlFor="templateName"
					>
						Template Name
					</label>
					<input
						type="text"
						id="templateName"
						value={emailTemplateProps.name}
						onChange={(e) =>
							setEmailTemplateProps((prev) => ({
								...prev,
								name: e.target.value,
							}))
						}
						disabled={isEditMode}
						placeholder="e.g., password-reset, welcome-email"
						className="w-full px-2.5 py-1.5 bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
					/>
				</div>
				<div>
					<label
						className="block text-xs font-medium text-gray-400 mb-1"
						htmlFor="emailSubject"
					>
						Email Subject
					</label>
					<input
						type="text"
						id="emailSubject"
						value={emailTemplateProps.subject}
						onChange={(e) =>
							setEmailTemplateProps((prev) => ({
								...prev,
								subject: e.target.value,
							}))
						}
						placeholder="e.g., Reset your password"
						className="w-full px-2.5 py-1.5 bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>
			</div>

			{/* Main panels */}
			<div className="flex-1 flex min-h-0">
				{/* Left: Monaco Editor */}
				<div className="flex flex-col flex-1 min-w-0 min-h-0">
					<div className="shrink-0 flex items-center px-3 py-1.5 bg-gray-800 border-b border-gray-700">
						<span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
							HTML
						</span>
					</div>
					<div className="flex-1 min-h-0">
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

				{/* Right: Preview panel */}
				{showPreview ? (
					<div className="flex flex-col w-[42%] shrink-0 min-h-0 border-l border-gray-700">
						{/* Preview header */}
						<div className="shrink-0 flex items-center justify-between px-3 py-1.5 bg-gray-800 border-b border-gray-700">
							<div className="flex items-center gap-2">
								<span className="text-sm font-medium text-gray-200">
									Preview
								</span>
								<span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded-full leading-none">
									{templateVariables.length} var
									{templateVariables.length !== 1 ? "s" : ""}
								</span>
							</div>
							<div className="flex items-center gap-0.5">
								<button
									type="button"
									onClick={() => setShowVariables((v) => !v)}
									className={`p-1.5 rounded transition-colors ${
										showVariables
											? "text-blue-400 bg-blue-900/30"
											: "text-gray-500 hover:text-gray-300 hover:bg-gray-700"
									}`}
									title={showVariables ? "Hide variables" : "Show variables"}
								>
									<Icon
										icon="lucide:sliders-horizontal"
										className="w-3.5 h-3.5"
									/>
								</button>
								<button
									type="button"
									onClick={() => setShowPreview(false)}
									className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded transition-colors"
									title="Close preview"
								>
									<Icon
										icon="lucide:panel-right-close"
										className="w-3.5 h-3.5"
									/>
								</button>
							</div>
						</div>

						{/* Variables section */}
						{showVariables && (
							<div className="shrink-0 border-b border-gray-700 max-h-56 overflow-y-auto">
								<div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800 bg-gray-800/60 sticky top-0">
									{linkedProject ? (
										<span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded">
											Using: {linkedProject.clientID}
										</span>
									) : (
										<span className="text-xs text-gray-500">Mock data</span>
									)}
									<button
										type="button"
										onClick={() => {
											setMockData(DEFAULT_MOCK_DATA);
											setMockDataInitialized(false);
										}}
										className="text-xs text-gray-500 hover:text-blue-400 transition-colors"
									>
										Reset
									</button>
								</div>
								<div className="p-3 bg-gray-900">
									{mockDataError && (
										<div className="mb-2 p-2 bg-red-900/50 border border-red-700 rounded text-red-300 text-xs">
											{mockDataError}
										</div>
									)}
									{templateVariables.length === 0 ? (
										<p className="text-gray-500 text-xs">
											No variables detected. Use {"{{variableName}}"} in your
											template.
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
													<div
														key={variable}
														className="flex items-center gap-2"
													>
														<label
															className="text-gray-400 text-xs w-24 truncate shrink-0 flex items-center gap-1"
															htmlFor={variable}
														>
															{`{{${variable}}}`}
															{isFromProject && !isInTemplate && (
																<span
																	className="text-yellow-400"
																	title="Available from project - not used in template yet"
																>
																	<Icon
																		icon="lucide:alert-triangle"
																		className="w-3 h-3"
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
																		className="w-3 h-3"
																	/>
																</span>
															)}
														</label>
														{mockData[variable]?.startsWith("function::") ? (
															<div className="flex-1 flex items-center gap-2 min-w-0">
																<code className="flex-1 px-2 py-1 bg-gray-800 border border-purple-600/50 text-purple-300 rounded text-xs font-mono truncate min-w-0">
																	{"fn(props) { "}
																	{mockData[variable]
																		.slice("function::".length)
																		.slice(0, 40) || "…"}
																	{" }"}
																</code>
																<button
																	type="button"
																	onClick={() =>
																		setFnEditorModal({
																			key: variable,
																			draft: (mockData[variable] ?? "").slice(
																				"function::".length,
																			),
																		})
																	}
																	className="shrink-0 p-1 text-purple-400 hover:text-white hover:bg-gray-700 rounded"
																	title="Edit function"
																>
																	<Icon
																		icon="lucide:code-2"
																		className="w-4 h-4"
																	/>
																</button>
															</div>
														) : (
															<input
																type="text"
																id={variable}
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
														)}
														{!isInTemplate && (
															<span className="text-xs text-yellow-500 shrink-0">
																unused
															</span>
														)}
													</div>
												);
											})}
										</div>
									)}
								</div>
							</div>
						)}

						{/* iframe */}
						<div className="flex-1 min-h-0 bg-white overflow-hidden">
							<iframe
								srcDoc={parsedPreview}
								title="Email Preview"
								className="w-full h-full border-0"
								sandbox="allow-same-origin"
							/>
						</div>
					</div>
				) : (
					<div className="shrink-0 w-9 border-l border-gray-700 flex flex-col items-center pt-2">
						<button
							type="button"
							onClick={() => setShowPreview(true)}
							className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded transition-colors"
							title="Open preview"
						>
							<Icon icon="lucide:panel-right-open" className="w-4 h-4" />
						</button>
					</div>
				)}
			</div>

			{/* Help Side Panel */}
			{showHelp && (
				<>
					{/* Backdrop */}
					<button
						type="button"
						aria-label="Close help panel"
						className="fixed inset-0 z-40 bg-black/50 cursor-default"
						onClick={() => setShowHelp(false)}
						onKeyDown={(e) => e.key === "Escape" && setShowHelp(false)}
					/>
					{/* Panel */}
					<div className="fixed inset-y-0 right-0 z-50 w-full sm:w-120 bg-gray-900 border-l border-gray-700 flex flex-col overflow-hidden">
						<div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 bg-gray-800 shrink-0">
							<div className="flex items-center gap-2">
								<Icon
									icon="lucide:book-open"
									className="w-5 h-5 text-green-400"
								/>
								<h2 className="text-white font-semibold text-base">
									Mustache Template Guide
								</h2>
							</div>
							<button
								type="button"
								onClick={() => setShowHelp(false)}
								className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors"
								aria-label="Close help"
							>
								<Icon icon="lucide:x" className="w-5 h-5" />
							</button>
						</div>
						<div className="flex-1 overflow-y-auto p-5">
							<div
								className="prose prose-invert prose-sm max-w-none
									prose-headings:text-blue-400 prose-headings:font-semibold
									prose-h1:text-xl prose-h1:mb-4 prose-h1:mt-0
									prose-h2:text-lg prose-h2:mb-3 prose-h2:mt-6 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-700
									prose-h3:text-base prose-h3:mb-2 prose-h3:mt-4
									prose-p:text-gray-300 prose-p:leading-relaxed
									prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-a:no-underline hover:prose-a:underline
									prose-strong:text-white prose-strong:font-semibold
									prose-code:text-emerald-400 prose-code:bg-gray-900/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
									prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700 prose-pre:rounded-xl
									prose-table:border-collapse prose-table:w-full
									prose-th:bg-gray-900 prose-th:text-gray-200 prose-th:font-medium prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:border prose-th:border-gray-700
									prose-td:text-gray-300 prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-gray-700
									prose-li:text-gray-300 prose-li:marker:text-gray-500
									prose-ul:my-2 prose-ol:my-2
									prose-hr:border-gray-700
									prose-blockquote:border-l-yellow-500 prose-blockquote:text-yellow-300/80"
							>
								{HelpDoc ? (
									<HelpDoc />
								) : (
									<div className="flex items-center gap-2 text-gray-400 py-8 justify-center">
										<div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500" />
										Loading guide...
									</div>
								)}
							</div>
						</div>
					</div>
				</>
			)}
			<FunctionEditorModal
				variableKey={fnEditorModal?.key ?? ""}
				value={fnEditorModal?.draft ?? null}
				props={mockData}
				onAccept={(body) => {
					if (fnEditorModal) {
						setMockData((prev) => ({
							...prev,
							[fnEditorModal.key]: `function::${body}`,
						}));
					}
					setFnEditorModal(null);
				}}
				onClose={() => setFnEditorModal(null)}
				onRemove={() => {
					if (fnEditorModal) {
						setMockData((prev) => ({ ...prev, [fnEditorModal.key]: "" }));
					}
					setFnEditorModal(null);
				}}
			/>
		</div>
	);
}
