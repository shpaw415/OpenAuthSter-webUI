import {
	DELETE as deleteProjectUser,
	GET as getProjectUsers,
	type ProjectUser,
} from "@api/users";
import { useCallback, useEffect, useState } from "react";

export type UseProjectUsersOptions = {
	pageSize?: number;
	initialSearch?: string;
};

export function useProjectUsers(
	clientID: string,
	options: UseProjectUsersOptions = {},
) {
	const [users, setUsers] = useState<ProjectUser[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState(options.initialSearch || "");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const pageSize = options.pageSize ?? 20;

	useEffect(() => {
		setPage(1);
		setSearch(options.initialSearch || "");
	}, [clientID, options.initialSearch]);

	const fetchUsers = useCallback(
		async (params?: { page?: number; search?: string }) => {
			if (!clientID) return;
			setIsLoading(true);
			setError(null);

			try {
				const response = await getProjectUsers({
					clientID,
					page: params?.page ?? page,
					pageSize,
					search: params?.search ?? search,
				});

				if (!response.success || !response.data) {
					throw new Error(response.error || "Failed to fetch users");
				}

				setUsers(response.data.users);
				setTotal(response.data.total);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
			} finally {
				setIsLoading(false);
			}
		},
		[clientID, page, pageSize, search],
	);

	useEffect(() => {
		if (!clientID) return;
		fetchUsers();
	}, [fetchUsers]);

	const updateSearch = (value: string) => {
		setPage(1);
		setSearch(value);
	};

	return {
		users,
		total,
		page,
		pageSize,
		search,
		isLoading,
		error,
		setPage,
		setSearch: updateSearch,
		refetch: () => fetchUsers({ page, search }),
		deleteUser: async (userID: string) => {
			if (!clientID) {
				throw new Error("Missing client ID");
			}

			setError(null);

			const res = await deleteProjectUser({ clientID, userID });

			if (!res.success) {
				throw new Error(res.error || "Failed to delete user");
			}

			await fetchUsers({ page, search });
		},
	};
}
