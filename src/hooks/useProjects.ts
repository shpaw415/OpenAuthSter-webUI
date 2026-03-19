import { useState, useEffect, useCallback } from "react";
import type { Project, ProviderConfig } from "openauth-webui-shared-types";
import {
	GET as getProjectById,
	PUT as updateProjectById,
	DELETE as deleteProjectById,
	type updateProjectParams,
} from "@api/projects/manage";

import { GET as getProjects, POST as createNewProject } from "@api/projects";
import { useAuth } from "./useAuth";

export function useProjects() {
	const [projects, setProjects] = useState<Project[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const auth = useAuth();

	const fetchProjects = useCallback(async () => {
		if (!auth.isAuthenticated && process.env.NODE_ENV !== "development") return;
		setIsLoading(true);
		setError(null);
		try {
			const projects = await getProjects();
			if (!projects.success) {
				throw new Error("Failed to fetch projects");
			}
			setProjects(projects.data || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setIsLoading(false);
		}
	}, [auth.isAuthenticated]);

	useEffect(() => {
		if (!auth.isLoaded) return;
		fetchProjects();
	}, [fetchProjects, auth.isLoaded]);

	const createProject = useCallback(async (name: string) => {
		const res = await createNewProject({ name });

		if (!res.success) {
			throw new Error(res.error || "Failed to create project");
		}
		setProjects((prev) => [...prev, res.data!]);
	}, []);

	const deleteProject = useCallback(async (clientID: string) => {
		const res = await deleteProjectById({ clientID });

		if (!res.success) {
			throw new Error(res.error || "Failed to delete project");
		}

		setProjects((prev) => prev.filter((p) => p.clientID !== clientID));
	}, []);

	return {
		projects,
		isLoading,
		error,
		fetchProjects,
		createProject,
		deleteProject,
	};
}

export function useProject(clientID: string = "") {
	const [project, setProject] = useState<Project | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchProject = useCallback(async () => {
		if (!clientID) return;
		setIsLoading(true);
		setError(null);
		try {
			const project = await getProjectById({ clientID });
			if (!project.success) {
				throw new Error(project.error || "Failed to fetch project");
			} else if (!project.data) {
				throw new Error("Project data is undefined");
			}
			setProject(project.data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setIsLoading(false);
		}
	}, [clientID]);

	useEffect(() => {
		fetchProject();
	}, [fetchProject]);

	const updateProject = async (updates: updateProjectParams["data"]) => {
		const { success, error, data } = await updateProjectById({
			clientID,
			data: updates,
		});

		if (!success) {
			throw new Error(error || "Failed to update project");
		}

		setProject(data || null);
	};

	const updateProviders = async (providers: ProviderConfig[]) => {
		await updateProject({ providers_data: providers });
	};

	const updateProvider = async (updatedProvider: ProviderConfig) => {
		if (!project) {
			throw new Error("Project not loaded");
		}
		if (!project.providers_data.find((p) => p.type === updatedProvider.type)) {
			await updateProject({
				providers_data: [...project.providers_data, updatedProvider],
			});
		} else {
			const updatedProviders = project.providers_data.map((provider) =>
				provider.type === updatedProvider.type ? updatedProvider : provider,
			);
			await updateProject({ providers_data: updatedProviders });
		}
	};

	return {
		project,
		isLoading,
		error,
		fetchProject,
		updateProject,
		updateProviders,
		updateProvider,
	};
}
