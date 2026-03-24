import { GET as getInvites } from "@api/invites";
import { DELETE as cancelInvite } from "@api/invites/project/manage";
import { DELETE as revokeCollaborator } from "@api/invites/revoke";
import { GET as getUserInfo } from "@api/users/info";
import { InviteCollaboratorSectionProject } from "@components/vary";
import { useProject } from "@hooks/useProjects";
import { Icon } from "@iconify/react";
import { Snackbar } from "@material/react-snackbar";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";

type InviteStatus = "pending" | "accepted" | "declined";

type Invite = {
	id: number;
	label: string;
	from_user_id: string;
	from_user_name: string;
	user_id: string;
	code: string;
	type: string;
	owner_group_id: string;
	expires_at: string;
	created_at: string;
	status: InviteStatus;
};

export default function ProjectCollaborators() {
	const clientID = useMemo(
		() =>
			typeof window === "undefined"
				? ""
				: new URLSearchParams(window.location.search).get("project_id") || "",
		[],
	);

	const projectHook = useProject(clientID);
	const [invites, setInvites] = useState<Invite[]>([]);
	const [isLoadingInvites, setIsLoadingInvites] = useState(false);
	const [notification, setNotification] = useState<{
		message: string;
	} | null>(null);
	const [revoking, setRevoking] = useState<string | null>(null);
	const [ownerInfo, setOwnerInfo] = useState<
		| Exclude<
				Awaited<ReturnType<typeof getUserInfo>>["data"],
				undefined
		  >[number]
		| null
	>(null);
	const [usersList, setUsersList] = useState<
		Exclude<Awaited<ReturnType<typeof getUserInfo>>["data"], undefined>
	>([]);

	const fetchInvites = useCallback(async () => {
		if (!projectHook.project?.owner_group_id) return;
		setIsLoadingInvites(true);
		try {
			const res = await getInvites({
				type: "all",
				owner_group_id: projectHook.project.owner_group_id,
			});
			if (res?.success) {
				const projectInvites = (res.data as Invite[]).filter(
					(inv) => inv.type === "project",
				);
				await getUserInfo({
					user_ids: projectInvites.map((inv) => inv.user_id),
				})
					.then((userRes) => {
						if (userRes?.success && userRes.data) {
							setUsersList(userRes.data);
						}
					})
					.finally(() => {
						setInvites(projectInvites);
					});
			}
		} finally {
			setIsLoadingInvites(false);
		}
	}, [projectHook.project?.owner_group_id]);

	useEffect(() => {
		fetchInvites();
	}, [fetchInvites]);

	useEffect(() => {
		if (!projectHook.project?.owner_id) return;
		getUserInfo({ user_ids: [projectHook.project.owner_id] }).then((res) => {
			if (res?.success && res.data?.[0]) setOwnerInfo(res.data[0]);
		});
	}, [projectHook.project?.owner_id]);

	const handleRemove = async (invite: Invite) => {
		const userInfo = usersList.find((u) => u.id === invite.user_id);

		const label =
			invite.status === "accepted" ? "revoke access for" : "cancel invite for";
		if (
			!confirm(
				`Are you sure you want to ${label} user ${userInfo?.session_public?.name ?? userInfo?.session_public?.email ?? userInfo?.identifier}?`,
			)
		)
			return;

		setRevoking(invite.user_id);
		try {
			const res =
				invite.status === "accepted"
					? await revokeCollaborator({
							owner_group_id: invite.owner_group_id,
							user_id: invite.user_id,
						})
					: await cancelInvite({
							user_id: invite.user_id,
							owner_group_id: invite.owner_group_id,
						});

			if (res?.success) {
				setNotification({
					message:
						invite.status === "accepted"
							? "Access revoked successfully"
							: "Invite cancelled",
				});
				setInvites((prev) => prev.filter((inv) => inv.id !== invite.id));
			} else {
				setNotification({ message: res?.error ?? "Operation failed" });
			}
		} catch (err) {
			setNotification({
				message: err instanceof Error ? err.message : "Operation failed",
			});
		} finally {
			setRevoking(null);
		}
	};

	if (projectHook.isLoading) {
		return (
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
				<div className="flex items-center justify-center py-20">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4" />
						<p className="text-gray-400">Loading...</p>
					</div>
				</div>
			</div>
		);
	}

	if (projectHook.error) {
		return (
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
				<div className="flex flex-col items-center justify-center py-20">
					<div className="relative mb-6">
						<div className="absolute inset-0 rounded-full bg-red-500/20 blur-xl scale-150" />
						<div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-red-900/40 border border-red-700/50">
							<Icon
								icon="lucide:alert-circle"
								className="w-10 h-10 text-red-400"
							/>
						</div>
					</div>
					<h2 className="text-xl font-semibold text-white mb-2">
						Something went wrong
					</h2>
					<p className="text-red-300 text-sm text-center max-w-md mb-8">
						{projectHook.error}
					</p>
					<a
						href={`/dashboard/project?project_id=${clientID}`}
						className="inline-flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors"
					>
						<Icon icon="lucide:arrow-left" className="w-4 h-4" />
						<span>Back to Project</span>
					</a>
				</div>
			</div>
		);
	}

	const acceptedInvites = invites.filter((inv) => inv.status === "accepted");
	const pendingInvites = invites.filter((inv) => inv.status === "pending");

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 space-y-8">
			{notification && (
				<Snackbar
					message={notification.message}
					actionText="OK"
					onClose={() => setNotification(null)}
				/>
			)}

			{/* Header */}
			<div className="flex items-center space-x-4">
				<a
					href={`/dashboard/project?project_id=${clientID}`}
					className="inline-flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors"
				>
					<Icon icon="lucide:arrow-left" className="w-5 h-5" />
					<span>Back</span>
				</a>
				<div>
					<h2 className="text-2xl font-bold text-white">Collaborators</h2>
					<p className="text-gray-400 mt-1">{projectHook.project?.name}</p>
				</div>
			</div>

			{/* Invite Form */}
			{projectHook.project && projectHook.isProjectOwner && (
				<InviteCollaboratorSectionProject
					project={projectHook.project}
					setNotification={(n) => {
						setNotification(n);
						if (n) fetchInvites();
					}}
				/>
			)}

			{/* Owner */}
			<div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
				<h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
					<Icon icon="lucide:crown" className="w-5 h-5 text-yellow-400" />
					Owner
				</h3>
				<div className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-900 border border-gray-700">
					<div className="flex items-center gap-3">
						<div className="flex items-center justify-center w-9 h-9 rounded-full border bg-yellow-900/40 border-yellow-700/50">
							<Icon icon="lucide:crown" className="w-4 h-4 text-yellow-400" />
						</div>
						<div>
							<p className="text-white text-sm font-medium">
								{ownerInfo?.session_public?.name ??
									ownerInfo?.session_public?.email ??
									ownerInfo?.identifier ??
									projectHook.project?.owner_id}
							</p>
							<p className="text-gray-500 text-xs">Project owner</p>
						</div>
					</div>
					{projectHook.isProjectOwner && (
						<span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/10 text-yellow-400">
							You
						</span>
					)}
				</div>
			</div>

			{/* Active Collaborators */}
			<div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
				<h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
					<Icon icon="lucide:users" className="w-5 h-5 text-blue-400" />
					Active Collaborators
					{acceptedInvites.length > 0 && (
						<span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-400">
							{acceptedInvites.length}
						</span>
					)}
				</h3>

				{isLoadingInvites ? (
					<div className="flex items-center justify-center py-8">
						<div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500" />
					</div>
				) : acceptedInvites.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-10 text-center">
						<Icon
							icon="lucide:users"
							className="w-10 h-10 text-gray-600 mb-3"
						/>
						<p className="text-gray-400">No active collaborators yet.</p>
						<p className="text-gray-500 text-sm mt-1">
							Invite someone above to get started.
						</p>
					</div>
				) : (
					<div className="space-y-3">
						{acceptedInvites.map((inv) => (
							<CollaboratorRow
								key={inv.id}
								usersList={usersList}
								isProjectOwner={projectHook.isProjectOwner}
								invite={inv}
								isRevoking={revoking === inv.user_id}
								onRemove={handleRemove}
								actionLabel="Revoke"
								actionIcon="lucide:user-x"
							/>
						))}
					</div>
				)}
			</div>

			{/* Pending Invites */}
			{(isLoadingInvites || pendingInvites.length > 0) && (
				<div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
					<h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
						<Icon icon="lucide:clock" className="w-5 h-5 text-amber-400" />
						Pending Invites
						{pendingInvites.length > 0 && (
							<span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-400">
								{pendingInvites.length}
							</span>
						)}
					</h3>

					{isLoadingInvites ? (
						<div className="flex items-center justify-center py-8">
							<div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500" />
						</div>
					) : (
						<div className="space-y-3">
							{pendingInvites.map((inv) => (
								<CollaboratorRow
									key={inv.id}
									invite={inv}
									usersList={usersList}
									isProjectOwner={projectHook.isProjectOwner}
									isRevoking={revoking === inv.user_id}
									onRemove={handleRemove}
									actionLabel="Cancel"
									actionIcon="lucide:x"
									statusBadge={
										<span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-400">
											Pending
										</span>
									}
									avatarClass="bg-amber-900/40 border-amber-700/50"
									avatarIconClass="text-amber-400"
									avatarIcon="lucide:user-plus"
									subtext={`Expires ${new Date(inv.expires_at).toLocaleDateString()}`}
								/>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

function CollaboratorRow({
	invite,
	isRevoking,
	usersList,
	onRemove,
	actionLabel,
	actionIcon,
	statusBadge,
	avatarClass = "bg-blue-900/40 border-blue-700/50",
	avatarIconClass = "text-blue-400",
	avatarIcon = "lucide:user",
	subtext,
	isProjectOwner,
}: {
	invite: Invite;
	usersList: Exclude<
		Awaited<ReturnType<typeof getUserInfo>>["data"],
		undefined
	>;
	isRevoking: boolean;
	isProjectOwner: boolean;
	onRemove: (invite: Invite) => void;
	actionLabel: string;
	actionIcon: string;
	statusBadge?: ReactNode;
	avatarClass?: string;
	avatarIconClass?: string;
	avatarIcon?: string;
	subtext?: string;
}) {
	const userInfo = useMemo(
		() => usersList.find((user) => user.id === invite.user_id),
		[usersList, invite.user_id],
	);

	return (
		<div className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-900 border border-gray-700">
			<div className="flex items-center gap-3">
				<div
					className={`flex items-center justify-center w-9 h-9 rounded-full border ${avatarClass}`}
				>
					<Icon icon={avatarIcon} className={`w-4 h-4 ${avatarIconClass}`} />
				</div>
				<div>
					<p className="text-white text-sm font-medium">
						{userInfo?.session_public?.name ??
							userInfo?.session_public?.email ??
							userInfo?.identifier}
					</p>
					<p className="text-gray-500 text-xs">
						{subtext ??
							`Joined ${new Date(invite.created_at).toLocaleDateString()}`}
					</p>
				</div>
			</div>
			<div className="flex items-center gap-2">
				{statusBadge}
				{isProjectOwner && (
					<button
						type="button"
						disabled={isRevoking}
						onClick={() => onRemove(invite)}
						className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/40 border border-red-700/50 rounded-lg transition-colors disabled:opacity-50"
					>
						{isRevoking ? (
							<div className="w-3 h-3 border border-red-400/50 border-t-red-400 rounded-full animate-spin" />
						) : (
							<Icon icon={actionIcon} className="w-3.5 h-3.5" />
						)}
						{actionLabel}
					</button>
				)}
			</div>
		</div>
	);
}
