import {
	type CreateThemeParams,
	POST as createNewTheme,
	GET as getThemes,
	type UITheme,
} from "@api/themes";
import {
	DELETE as deleteThemeById,
	GET as getThemeById,
	type UpdateThemeParams,
	PUT as updateThemeById,
} from "@api/themes/id";
import { useCallback, useEffect, useState } from "react";

export type { UITheme };

export function useUIThemes() {
	const [themes, setThemes] = useState<UITheme[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchThemes = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const result = await getThemes();
			if (!result.success) {
				throw new Error(result.error || "Failed to fetch themes");
			}
			setThemes(result.data || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchThemes();
	}, [fetchThemes]);

	const createTheme = useCallback(async (params: CreateThemeParams) => {
		const res = await createNewTheme(params);

		if (!res.success) {
			throw new Error(res.error || "Failed to create theme");
		}
		setThemes((prev) => [...prev, res.data as UITheme]);
		return res.data as UITheme;
	}, []);

	const deleteTheme = useCallback(async (id: number) => {
		const res = await deleteThemeById({ id });

		if (!res.success) {
			throw new Error(res.error || "Failed to delete theme");
		}

		setThemes((prev) => prev.filter((t) => t.id !== id));
	}, []);

	return {
		themes,
		isLoading,
		error,
		fetchThemes,
		createTheme,
		deleteTheme,
	};
}

export function useUITheme(id: number | null) {
	const [theme, setTheme] = useState<UITheme | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchTheme = useCallback(async () => {
		if (!id) {
			setIsLoading(false);
			return;
		}
		setIsLoading(true);
		setError(null);
		try {
			const result = await getThemeById({ id });
			if (!result.success) {
				throw new Error(result.error || "Failed to fetch theme");
			} else if (!result.data) {
				throw new Error("Theme data is undefined");
			}
			setTheme(result.data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setIsLoading(false);
		}
	}, [id]);

	useEffect(() => {
		fetchTheme();
	}, [fetchTheme]);

	const updateTheme = async (
		updates: UpdateThemeParams["data"],
	): Promise<UITheme> => {
		if (!id) {
			throw new Error("Theme ID is required to update theme");
		}
		const { success, error, data } = await updateThemeById({
			id,
			data: updates,
		});

		if (!success) {
			throw new Error(error || "Failed to update theme");
		}

		setTheme(data as UITheme);
		return data as UITheme;
	};

	return {
		theme,
		isLoading,
		error,
		fetchTheme,
		updateTheme,
	};
}
