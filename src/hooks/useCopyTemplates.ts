import { useState, useEffect, useCallback } from "react";
import {
  GET as getCopyTemplates,
  POST as createNewCopyTemplate,
  type CopyTemplate,
  type CreateCopyTemplateParams,
} from "@api/templates/copy";
import {
  GET as getCopyTemplateByName,
  PUT as updateCopyTemplateByName,
  DELETE as deleteCopyTemplateByName,
  type UpdateCopyTemplateParams,
} from "@api/templates/copy/id";

export type { CopyTemplate };

export function useCopyTemplates() {
  const [templates, setTemplates] = useState<CopyTemplate[]>([]);
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
      setTemplates((prev) => [...prev, res.data!]);
      return res.data!;
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
  const [template, setTemplate] = useState<CopyTemplate | null>(null);
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

    setTemplate(data!);
    return data!;
  };

  return {
    template,
    isLoading,
    error,
    fetchTemplate,
    updateTemplate,
  };
}
