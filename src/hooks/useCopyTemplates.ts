import {
	type CreateCopyTemplateParams,
	POST as createNewCopyTemplate,
	GET as getCopyTemplates,
} from "@api/templates/copy";
import {
	DELETE as deleteCopyTemplateByName,
	GET as getCopyTemplateByName,
	type UpdateCopyTemplateParams,
	PUT as updateCopyTemplateByName,
} from "@api/templates/copy/id";
import type { parseDBCopyTemplate } from "openauth-webui-shared-types";
import { useCallback, useEffect, useState } from "react";

type CopyTemplate = ReturnType<typeof parseDBCopyTemplate>;

export function useCopyTemplates() {
	const [templates, setTemplates] = useState<Array<CopyTemplate>>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchTemplates = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const result = await getCopyTemplates();
			if (!result.success) {
				throw new Error(result.error || "Failed to fetch copy templates");
			}
			setTemplates(result.data || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchTemplates();
	}, [fetchTemplates]);

	const createTemplate = useCallback(
		async (params: CreateCopyTemplateParams) => {
			const res = await createNewCopyTemplate(params);

			if (!res.success) {
				throw new Error(res.error || "Failed to create copy template");
			}

			setTemplates((prev) => [
				...prev,
				res.data as ReturnType<typeof parseDBCopyTemplate>,
			]);
			return res.data as ReturnType<typeof parseDBCopyTemplate>;
		},
		[],
	);

	const deleteTemplate = useCallback(async (name: string) => {
		const res = await deleteCopyTemplateByName({ name });

		if (!res.success) {
			throw new Error(res.error || "Failed to delete copy template");
		}

		setTemplates((prev) => prev.filter((t) => t.name !== name));
	}, []);

	return {
		templates,
		isLoading,
		error,
		fetchTemplates,
		createTemplate,
		deleteTemplate,
	};
}

export function useCopyTemplate(name: string = "") {
	const [template, setTemplate] = useState<ReturnType<
		typeof parseDBCopyTemplate
	> | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchTemplate = useCallback(async () => {
		if (!name) {
			setIsLoading(false);
			return;
		}
		setIsLoading(true);
		setError(null);
		try {
			const result = await getCopyTemplateByName({ name });
			if (!result.success) {
				throw new Error(result.error || "Failed to fetch copy template");
			} else if (!result.data) {
				throw new Error("Copy template data is undefined");
			}
			setTemplate(result.data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setIsLoading(false);
		}
	}, [name]);

	useEffect(() => {
		fetchTemplate();
	}, [fetchTemplate]);

	const updateTemplate = async (
		updates: UpdateCopyTemplateParams["data"],
	): Promise<CopyTemplate> => {
		const { success, error, data } = await updateCopyTemplateByName({
			name,
			data: updates,
		});

		if (!success) {
			throw new Error(error || "Failed to update copy template");
		}

		setTemplate(data as CopyTemplate);
		return data as CopyTemplate;
	};

	return {
		template,
		isLoading,
		error,
		fetchTemplate,
		updateTemplate,
	};
}
