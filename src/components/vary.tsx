import { POST as CreateInvite } from "@api/invites/project/manage";
import type { Project } from "openauth-webui-shared-types";
import { type SubmitEventHandler, useState } from "react";
import { Icon } from "./icon";
import { useAuth } from "@hooks/useAuth";

export function InviteCollaboratorSectionProject({
	project,
	setNotification,
}: {
	project: Project;
	setNotification: (notif: { message: string } | null) => void;
}) {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const auth = useAuth();

	const handleInvite: SubmitEventHandler<HTMLFormElement> = async (e) => {
		e.preventDefault();
		const userId = new FormData(e.currentTarget).get("userId")?.toString();
		if (!userId?.trim()) return;
		setIsLoading(true);
		setError(null);
		const session = await auth.getUserSession("public");
		if (session instanceof Error) {
			setError("Unauthorized");
			setIsLoading(false);
			return;
		}
		try {
			const res = await CreateInvite({
				user_id: userId.trim(),
				client_id: project.clientID,
				from_name:
					session.public?.name ??
					session.public?.email ??
					session.user_identifier,
			});
			if (!res.success) {
				setError(res.error ?? "Unknown error");
			} else {
				setNotification({ message: "Collaborator invite created!" });
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create invite");
		} finally {
			setIsLoading(false);
			e.currentTarget.reset();
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
					required
					name="userId"
					placeholder="User Id"
					disabled={isLoading}
					className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
				/>
				<button
					type="submit"
					disabled={isLoading}
					className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
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
		</div>
	);
}
