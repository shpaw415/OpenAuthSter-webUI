import { useState, useEffect, useCallback } from "react";
import type { EmailTemplateProps } from "openauth-webui-shared-types";
import {
  GET as getTemplates,
  POST as createNewTemplate,
  type EmailTemplate,
  type CreateTemplateParams,
} from "@api/_templates";
import {
  GET as getTemplateByName,
  PUT as updateTemplateByName,
  DELETE as deleteTemplateByName,
  type UpdateTemplateParams,
} from "@api/_templates/id";

export type { EmailTemplate };

export function useEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getTemplates();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch templates");
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

  const createTemplate = useCallback(async (params: CreateTemplateParams) => {
    const res = await createNewTemplate(params);

    if (!res.success) {
      throw new Error(res.error || "Failed to create template");
    }
    setTemplates((prev) => [...prev, res.data!]);
    return res.data!;
  }, []);

  const deleteTemplate = useCallback(async (name: string) => {
    const res = await deleteTemplateByName({ name });

    if (!res.success) {
      throw new Error(res.error || "Failed to delete template");
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

export function useEmailTemplate(name: string = "") {
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
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
      const result = await getTemplateByName({ name });
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch template");
      } else if (!result.data) {
        throw new Error("Template data is undefined");
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
    updates: UpdateTemplateParams["data"],
  ): Promise<EmailTemplate> => {
    const { success, error, data } = await updateTemplateByName({
      name,
      data: updates,
    });

    if (!success) {
      throw new Error(error || "Failed to update template");
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
