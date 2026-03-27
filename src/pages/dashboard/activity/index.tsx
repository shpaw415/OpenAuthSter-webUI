import { GET as getLogs } from "@api/logs";
import { useProjects } from "@hooks/useProjects";
import type { LogsTable } from "openauth-webui-shared-types/database";
import { useCallback, useEffect, useMemo, useState } from "react";

function ParseLogs(logs: Array<typeof LogsTable.$inferSelect>): LogRow[] {
	return logs.map(
		(log) =>
			({
				...log,
				context:
					typeof log.context === "string"
						? JSON.parse(log.context)
						: log.context,
			}) as LogRow,
	); // Assuming the API returns the correct types, we can directly cast it here.
}

type LogRow = typeof LogsTable.$inferSelect & {
	type: "info" | "warning" | "error";
	context?: Record<string, unknown>;
};

interface ContextModalState {
	isOpen: boolean;
	context?: Record<string, unknown>;
}

const typeTone: Record<LogRow["type"], string> = {
	info: "bg-blue-500/10 text-blue-200 border border-blue-500/30",
	warning: "bg-amber-500/10 text-amber-200 border border-amber-500/30",
	error: "bg-red-500/10 text-red-200 border border-red-500/30",
};

const typeLabel: Record<LogRow["type"], string> = {
	info: "Info",
	warning: "Warning",
	error: "Error",
};

const formatDate = (iso: string) => {
	try {
		return new Intl.DateTimeFormat(undefined, {
			dateStyle: "medium",
			timeStyle: "short",
		}).format(new Date(iso));
	} catch (_) {
		return iso;
	}
};

export default function LogsPage() {
	const {
		projects,
		isLoading: projectsLoading,
		error: projectsError,
	} = useProjects();
	const [currentProject, setCurrentProject] = useState<string>("");
	const [logs, setLogs] = useState<LogRow[]>([]);
	const [logsError, setLogsError] = useState<string | null>(null);
	const [isFetchingLogs, setIsFetchingLogs] = useState(false);
	const [lastUpdated, setLastUpdated] = useState<string | null>(null);
	const [contextModal, setContextModal] = useState<ContextModalState>({
		isOpen: false,
	});

	const fetchLogs = useCallback(async (clientID: string) => {
		if (!clientID) return;

		setIsFetchingLogs(true);
		setLogsError(null);

		try {
			const response = await getLogs({ clientID });

			if (!response.success) {
				setLogs([]);
				setLogsError(response.error || "Failed to fetch logs");
				return;
			}

			setLogs(ParseLogs(response.data) || []);
			setLastUpdated(new Date().toISOString());
		} catch (err) {
			setLogsError(err instanceof Error ? err.message : String(err));
		} finally {
			setIsFetchingLogs(false);
		}
	}, []);

	useEffect(() => {
		if (!currentProject) return;
		fetchLogs(currentProject);
	}, [currentProject, fetchLogs]);

	const stats = useMemo(() => {
		const total = logs.length;
		const errors = logs.filter((log) => log.type === "error").length;
		const warnings = logs.filter((log) => log.type === "warning").length;
		const info = logs.filter((log) => log.type === "info").length;

		return {
			total,
			errors,
			warnings,
			info,
		};
	}, [logs]);

	const showEmptyLogs = !isFetchingLogs && !logsError && logs.length === 0;

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-xs uppercase tracking-[0.2em] text-blue-300/80 mb-1">
						Activity
					</p>
					<h1 className="text-2xl sm:text-3xl font-bold text-white">
						Audit logs
					</h1>
					<p className="text-gray-400 text-sm mt-1">
						Review authentication activity and errors for each project.
					</p>
				</div>

				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => currentProject && fetchLogs(currentProject)}
						disabled={!currentProject || isFetchingLogs}
						className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 hover:border-gray-600 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
					>
						{isFetchingLogs ? (
							<span className="h-4 w-4 border-2 border-blue-500/60 border-t-transparent rounded-full animate-spin" />
						) : (
							<span className="h-2 w-2 rounded-full bg-blue-400" />
						)}
						<span>Refresh</span>
					</button>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<StatCard label="Total entries" value={stats.total} tone="text-white" />
				<StatCard label="Info" value={stats.info} tone="text-blue-200" />
				<StatCard
					label="Warnings"
					value={stats.warnings}
					tone="text-amber-200"
				/>
				<StatCard label="Errors" value={stats.errors} tone="text-red-200" />
			</div>

			<div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5 shadow-lg shadow-black/20">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-3">
						<label className="text-sm text-gray-300" htmlFor="project-select">
							Project
						</label>
						<div className="relative">
							<select
								id="project-select"
								value={currentProject}
								onChange={(e) => setCurrentProject(e.target.value)}
								disabled={projectsLoading}
								className="appearance-none w-52 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg py-2 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
							>
								<option value="">Select a project</option>
								{projects.map(({ clientID, name }) => (
									<option key={clientID} value={clientID}>
										{name}
									</option>
								))}
							</select>
							<span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 text-xs">
								v
							</span>
						</div>
					</div>

					<div className="flex items-center gap-3 text-sm text-gray-400">
						{lastUpdated && <span>Updated {formatDate(lastUpdated)}</span>}
						<span className="hidden sm:inline-block h-1.5 w-1.5 rounded-full bg-gray-700" />
						<span>
							{isFetchingLogs
								? "Fetching logs..."
								: `${logs.length} entr${logs.length === 1 ? "y" : "ies"}`}
						</span>
					</div>
				</div>

				<div className="mt-4 overflow-hidden border border-gray-800 rounded-lg">
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-800">
							<thead className="bg-gray-800/60">
								<tr className="text-xs uppercase tracking-wide text-gray-400">
									<th className="px-4 py-3 text-left">Type</th>
									<th className="px-4 py-3 text-left">Message</th>
									<th className="px-4 py-3 text-left">Timestamp</th>
									<th className="px-4 py-3 text-left">Project</th>
									<th className="px-4 py-3 text-left">Context</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-800 bg-gray-900">
								{isFetchingLogs && <SkeletonRows />}

								{!isFetchingLogs && logsError && (
									<tr>
										<td colSpan={5} className="px-4 py-6">
											<div className="bg-red-900/30 border border-red-800 text-red-200 rounded-lg px-4 py-3">
												{logsError}
											</div>
										</td>
									</tr>
								)}

								{!isFetchingLogs && !logsError && showEmptyLogs && (
									<tr>
										<td
											colSpan={5}
											className="px-4 py-8 text-center text-gray-400"
										>
											No log entries for this project yet.
										</td>
									</tr>
								)}

								{!isFetchingLogs &&
									!logsError &&
									logs.map((log) => (
										<tr
											key={log.id}
											className="hover:bg-gray-800/40 transition-colors"
										>
											<td className="px-4 py-3 whitespace-nowrap">
												<span
													className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
														typeTone[log.type]
													}`}
												>
													<span className="h-2 w-2 rounded-full bg-current opacity-80" />
													{typeLabel[log.type]}
												</span>
											</td>
											<td className="px-4 py-3 text-sm text-gray-200 max-w-xl">
												<p className="line-clamp-2 leading-relaxed text-gray-200">
													{log.message}
												</p>
											</td>
											<td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
												{formatDate(log.timestamp)}
											</td>
											<td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
												{log.clientID}
											</td>
											<td className="px-4 py-3 text-sm whitespace-nowrap">
												{log.context ? (
													<button
														type="button"
														onClick={() =>
															setContextModal({
																isOpen: true,
																context: log.context,
															})
														}
														className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors text-xs font-medium border border-blue-500/40"
													>
														View Context
													</button>
												) : (
													<span className="text-gray-500">—</span>
												)}
											</td>
										</tr>
									))}
							</tbody>
						</table>
					</div>
				</div>

				{(projectsLoading || projectsError) && (
					<div className="mt-4 text-sm text-gray-400">
						{projectsLoading && "Loading projects..."}
						{projectsError && !projectsLoading && projectsError}
					</div>
				)}

				{!projectsLoading && !projectsError && (
					<div className="mt-4 text-sm text-gray-400">
						Create a project to start collecting logs.
					</div>
				)}
			</div>

			<ContextModal
				isOpen={contextModal.isOpen}
				context={contextModal.context}
				onClose={() => setContextModal({ isOpen: false })}
			/>
		</div>
	);
}

function StatCard({
	label,
	value,
	tone,
}: {
	label: string;
	value: number;
	tone: string;
}) {
	return (
		<div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
			<p className="text-sm text-gray-400 mb-1">{label}</p>
			<p className={`text-2xl font-semibold ${tone}`}>{value}</p>
		</div>
	);
}

function SkeletonRows() {
	const placeholders = Array.from({ length: 6 });

	return (
		<>
			{placeholders.map((_, idx) => (
				<tr key={idx} className="animate-pulse">
					<td className="px-4 py-3">
						<div className="h-6 w-24 rounded-full bg-gray-700/60" />
					</td>
					<td className="px-4 py-3">
						<div className="h-4 w-full max-w-lg rounded bg-gray-700/60" />
					</td>
					<td className="px-4 py-3">
						<div className="h-4 w-32 rounded bg-gray-700/60" />
					</td>
					<td className="px-4 py-3">
						<div className="h-4 w-28 rounded bg-gray-700/60" />
					</td>
					<td className="px-4 py-3">
						<div className="h-4 w-24 rounded bg-gray-700/60" />
					</td>
				</tr>
			))}
		</>
	);
}

interface ContextModalProps {
	isOpen: boolean;
	context?: Record<string, any>;
	onClose: () => void;
}

function ContextModal({ isOpen, context, onClose }: ContextModalProps) {
	if (!isOpen) return null;

	return (
		<button
			type="button"
			className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
			onMouseUp={onClose}
		>
			<button
				type="button"
				className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
					<h2 className="text-lg font-semibold text-white">Error Context</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-gray-400 hover:text-gray-200 transition-colors p-1"
						aria-label="Close modal"
					>
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<title>Close</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<div className="flex-1 overflow-auto p-6">
					<pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 text-sm text-gray-200 font-mono overflow-auto max-h-full">
						<code>{JSON.stringify(context, null, 2)}</code>
					</pre>
				</div>

				<div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 hover:border-gray-600 hover:text-white transition-colors"
					>
						Close
					</button>
					<button
						type="button"
						onClick={() => {
							navigator.clipboard.writeText(JSON.stringify(context, null, 2));
						}}
						className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
					>
						Copy JSON
					</button>
				</div>
			</button>
		</button>
	);
}
