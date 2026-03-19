import { POST as CreateInvite } from "@api/invites/project/manage";
import type { Project } from "openauth-webui-shared-types";
import { type SubmitEventHandler, useState } from "react";
import { Icon } from "./icon";

export function InviteCollaboratorSectionProject({
	project,
	setNotification,
}: {
	project: Project;
	setNotification: (notif: { message: string } | null) => void;
}) {
	const [userId, setUserId] = useState("");
	const [inviteUrl, setInviteUrl] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleInvite: SubmitEventHandler<HTMLFormElement> = async (e) => {
		e.preventDefault();
		if (!userId.trim()) return;
		setIsLoading(true);
		setError(null);
		setInviteUrl(null);
		try {
			const res = await CreateInvite({
				user_id: userId.trim(),
				client_id: project.clientID,
			});
			if (!res.success) {
				setError(res.error ?? "Unknown error");
			} else {
				setInviteUrl(res.url ?? null);
				setNotification({ message: "Collaborator invite created!" });
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create invite");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
			<div className="mb-6">
				<h2 className="text-xl font-semibold text-white flex items-center gap-2">
					<Icon icon="lucide:users" className="w-5 h-5 text-blue-400" />
					Invite Collaborator
				</h2>
				<p className="text-gray-400 text-sm mt-1">
					Invite another user to co-manage this project by their user ID.
				</p>
			</div>
			<form onSubmit={handleInvite} className="flex gap-3">
				<input
					type="text"
					value={userId}
					onChange={(e) => setUserId(e.target.value)}
					placeholder="User Id"
					disabled={isLoading}
					className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
				/>
				<button
					type="submit"
					disabled={isLoading || !userId.trim()}
					className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isLoading ? (
						<>
							<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							Sending...
						</>
					) : (
						<>
							<Icon icon="lucide:user-plus" className="w-4 h-4" />
							Send Invite
						</>
					)}
				</button>
			</form>
			{error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
			{inviteUrl && (
				<div className="mt-4 p-4 bg-green-900/20 border border-green-600/30 rounded-lg">
					<p className="text-green-400 text-sm mb-2 font-medium">
						Invite link created — share it with the user:
					</p>
					<div className="flex items-center gap-2">
						<code className="flex-1 min-w-0 px-3 py-2 bg-gray-900 border border-gray-700 text-green-300 font-mono text-xs rounded break-all">
							{inviteUrl}
						</code>
						<button
							type="button"
							onClick={() => {
								navigator.clipboard.writeText(inviteUrl);
								setNotification({ message: "Invite link copied!" });
							}}
							className="p-2.5 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded-lg transition-colors border border-green-600/30 hover:border-green-500/50 shrink-0"
							title="Copy to clipboard"
						>
							<Icon icon="lucide:clipboard-copy" className="w-4 h-4" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
