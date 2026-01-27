// Rainy Cowork - useWorkspace Hook
// React hook for advanced workspace management

import { useCallback, useEffect, useState } from 'react';
import * as tauri from '../services/tauri';
import type { Workspace, WorkspaceTemplate, CreateWorkspaceOptions } from '../types';

interface UseWorkspaceResult {
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    isLoading: boolean;
    error: string | null;
    createWorkspace: (options: CreateWorkspaceOptions) => Promise<Workspace>;
    loadWorkspace: (id: string) => Promise<Workspace>;
    saveWorkspace: (workspace: Workspace) => Promise<void>;
    deleteWorkspace: (id: string) => Promise<void>;
    refreshWorkspaces: () => Promise<void>;
    selectWorkspace: (workspace: Workspace | null) => void;
}

export function useWorkspace(): UseWorkspaceResult {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshWorkspaces = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const workspaceIds = await tauri.listWorkspaces();
            const loadedWorkspaces: Workspace[] = [];

            for (const id of workspaceIds) {
                try {
                    const workspace = await tauri.loadWorkspace(id);
                    loadedWorkspaces.push(workspace);
                } catch (err) {
                    console.warn(`Failed to load workspace ${id}:`, err);
                }
            }

            setWorkspaces(loadedWorkspaces);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load workspaces');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createWorkspace = useCallback(async (options: CreateWorkspaceOptions): Promise<Workspace> => {
        setIsLoading(true);
        setError(null);
        try {
            let template: WorkspaceTemplate | undefined;

            if (options.templateId) {
                // Import templates dynamically to avoid circular dependency
                const { WORKSPACE_TEMPLATES } = await import('../types/workspace');
                template = WORKSPACE_TEMPLATES.find(t => t.id === options.templateId);
            }

            const permissions = options.customPermissions || template?.defaultPermissions || {
                canRead: true,
                canWrite: true,
                canExecute: false,
                canDelete: false,
                canCreateAgents: true,
            };

            const settings = options.customSettings || template?.defaultSettings || {
                theme: 'system',
                language: 'en',
                autoSave: true,
                notificationsEnabled: true,
            };

            const workspace = await tauri.createWorkspace(
                options.name,
                options.allowedPaths
            );

            // Apply template settings if available
            if (template) {
                workspace.permissions = { ...workspace.permissions, ...permissions };
                workspace.settings = { ...workspace.settings, ...settings };
                workspace.memory = { ...workspace.memory, ...template.defaultMemory };

                // Save the updated workspace
                await tauri.saveWorkspace(workspace);
            }

            await refreshWorkspaces();
            return workspace;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create workspace';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [refreshWorkspaces]);

    const loadWorkspace = useCallback(async (id: string): Promise<Workspace> => {
        setIsLoading(true);
        setError(null);
        try {
            const workspace = await tauri.loadWorkspace(id);
            setCurrentWorkspace(workspace);
            return workspace;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load workspace';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveWorkspace = useCallback(async (workspace: Workspace): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            await tauri.saveWorkspace(workspace);
            await refreshWorkspaces();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save workspace';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [refreshWorkspaces]);

    const deleteWorkspace = useCallback(async (id: string): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            await tauri.deleteWorkspace(id);

            // Remove from local state
            setWorkspaces(prev => prev.filter(w => w.id !== id));
            if (currentWorkspace?.id === id) {
                setCurrentWorkspace(null);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete workspace';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [currentWorkspace]);

    const selectWorkspace = useCallback((workspace: Workspace | null) => {
        setCurrentWorkspace(workspace);
    }, []);

    // Load workspaces on mount
    useEffect(() => {
        refreshWorkspaces();
    }, [refreshWorkspaces]);

    return {
        workspaces,
        currentWorkspace,
        isLoading,
        error,
        createWorkspace,
        loadWorkspace,
        saveWorkspace,
        deleteWorkspace,
        refreshWorkspaces,
        selectWorkspace,
    };
}