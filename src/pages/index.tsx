"use client";

import { useState } from "react";
import { useProjects } from "../hooks/useProjects";

export default function AdminPanel() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClientID, setNewClientID] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const projectHook = useProjects();

  const handleCreate = async () => {
    if (!newClientID.trim()) {
      setCreateError("Client ID is required");
      return;
    }

    setIsCreating(true);
    setCreateError("");

    try {
      await projectHook.createProject(newClientID.trim());
      setShowCreateModal(false);
      setNewClientID("");
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create project",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (clientID: string) => {
    try {
      await projectHook.deleteProject(clientID);
      setDeleteConfirm(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete project");
    }
  };

  if (projectHook.isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Projects</h2>
          <p className="text-gray-400 mt-1">
            Manage authentication providers for your projects
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
        >
          <span>+</span>
          <span>New Project</span>
        </button>
      </div>

      {/* Project Grid */}
      {projectHook.projects.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-xl font-medium text-white mb-2">
            No projects yet
          </h3>
          <p className="text-gray-400 mb-6">
            Create your first project to start configuring authentication
            providers
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectHook.projects.map((project) => (
            <div
              key={project.clientID}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      project.active ? "bg-green-500" : "bg-gray-500"
                    }`}
                  />
                  <h3 className="text-lg font-semibold text-white truncate max-w-[180px]">
                    {project.clientID}
                  </h3>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    project.active
                      ? "bg-green-500/10 text-green-400"
                      : "bg-gray-500/10 text-gray-400"
                  }`}
                >
                  {project.active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="text-sm text-gray-400 mb-4">
                <div>
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </div>
                <div>
                  Providers:{" "}
                  {project.providers_data?.filter((p) => p.enabled).length || 0}{" "}
                  enabled
                </div>
              </div>

              <div className="flex space-x-2">
                <a
                  href={`/project?project_id=${encodeURIComponent(
                    project.clientID,
                  )}`}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Manage
                </a>
                <button
                  onClick={() => setDeleteConfirm(project.clientID)}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              Create New Project
            </h3>

            {createError && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4">
                {createError}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Client ID
              </label>
              <input
                type="text"
                value={newClientID}
                onChange={(e) => setNewClientID(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="my-app"
              />
              <p className="text-gray-500 text-sm mt-2">
                A unique identifier for your project (e.g., my-app, web-client)
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewClientID("");
                  setCreateError("");
                }}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition-colors"
              >
                {isCreating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              Delete Project
            </h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete{" "}
              <span className="text-white font-semibold">{deleteConfirm}</span>?
              This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
