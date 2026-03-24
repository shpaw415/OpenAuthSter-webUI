import { DELETE as declineInvite, GET as getInvites } from "@api/invites";
import { POST as acceptProjectInvite } from "@api/invites/project/accept";
import { POST as acceptCopyTemplateInvite } from "@api/invites/template/copy/accept";
import { POST as acceptEmailTemplateInvite } from "@api/invites/template/email/accept";
import { POST as acceptUITemplateInvite } from "@api/invites/template/ui/accept";
import type { inviteTable } from "openauth-webui-shared-types/database";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";

export type InviteRow = typeof inviteTable.$inferSelect;

// ─── Module-level shared cache ────────────────────────────────────────────────

const CACHE_TTL = 60_000; // 60 s

let cacheData: InviteRow[] | null = null;
let cacheTime = 0;
let inflightPromise: Promise<InviteRow[]> | null = null;
const subscribers = new Set<(data: InviteRow[]) => void>();

async function loadInvites(force = false): Promise<InviteRow[]> {
	if (!force && cacheData !== null && Date.now() - cacheTime < CACHE_TTL) {
		return cacheData;
	}
	if (inflightPromise) return inflightPromise;

	inflightPromise = (async () => {
		const res = await getInvites({ type: "received", status: "pending" });
		if (!res?.success)
			throw new Error(res?.error ?? "Failed to load notifications");
		const data = (res.data ?? []) as InviteRow[];
		cacheData = data;
		cacheTime = Date.now();
		subscribers.forEach((fn) => {
			fn(data);
		});
		return data;
	})().finally(() => {
		inflightPromise = null;
	});

	return inflightPromise;
}

function clearCache() {
	cacheData = null;
	cacheTime = 0;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications() {
	const auth = useAuth();
	const [invites, setInvites] = useState<InviteRow[]>(cacheData ?? []);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		subscribers.add(setInvites);
		return () => {
			subscribers.delete(setInvites);
		};
	}, []);

	const refetch = useCallback(async (force = false) => {
		setIsLoading(true);
		setError(null);
		try {
			const data = await loadInvites(force);
			setInvites(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setIsLoading(false);
		}
	}, []);

	const invalidate = useCallback(async () => {
		clearCache();
		await refetch(true);
	}, [refetch]);

	useEffect(() => {
		if (!auth?.isAuthenticated) return;
		refetch();
	}, [auth?.isAuthenticated, refetch]);

	const pendingCount = invites.filter(
		(i) => new Date(i.expires_at) > new Date(),
	).length;

	// ─── Actions ───────────────────────────────────────────────────────────────

	const accept = useCallback(
		async (
			invite: InviteRow,
		): Promise<{ success: boolean; error?: string }> => {
			let res: { success: boolean; error?: string } | undefined;

			if (invite.type === "project") {
				res = await acceptProjectInvite({ code: invite.code });
			} else if (invite.type === "email_template") {
				res = await acceptEmailTemplateInvite({ code: invite.code });
			} else if (invite.type === "ui_template") {
				res = await acceptUITemplateInvite({ code: invite.code });
			} else if (invite.type === "copy_template") {
				res = await acceptCopyTemplateInvite({ code: invite.code });
			}

			if (res?.success) await invalidate();
			return res ?? { success: false, error: "Unknown invite type" };
		},
		[invalidate],
	);

	const decline = useCallback(
		async (
			invite: InviteRow,
		): Promise<{ success: boolean; error?: string }> => {
			const res = await declineInvite({ code: invite.code });
			if (res?.success) await invalidate();
			return res ?? { success: false, error: "Unknown invite type" };
		},
		[invalidate],
	);

	return {
		invites,
		pendingCount,
		isLoading,
		error,
		refetch,
		invalidate,
		accept,
		decline,
	};
}
