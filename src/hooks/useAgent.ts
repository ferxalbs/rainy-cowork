// src/hooks/useAgent.ts
// React Hook for AI Agent Operations
// Part of Phase 3 - Rainy Cowork

import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type {
    AgentTask,
    AgentResult,
    DocumentGenerateRequest,
    ResearchRequest,
    AgentStatus,
    DocumentTemplate,
} from '../types/agent';

// API base URL for agent endpoints
const API_BASE = 'https://rainy-api-v2-179843975974.us-west1.run.app/api/v1';

/**
 * Hook for AI agent operations
 * Provides methods for document generation and research
 */
export function useAgent() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentTask, setCurrentTask] = useState<AgentTask | null>(null);
    const [status, setAgentStatus] = useState<AgentStatus | null>(null);

    /**
     * Get API key from Tauri keychain
     */
    const getApiKey = useCallback(async (): Promise<string | null> => {
        try {
            const key = await invoke<string | null>('get_api_key', { provider: 'rainy' });
            return key;
        } catch {
            return null;
        }
    }, []);

    /**
     * Generic fetch with API key
     */
    const fetchWithAuth = useCallback(async (endpoint: string, options: RequestInit = {}) => {
        const apiKey = await getApiKey();
        if (!apiKey) {
            throw new Error('No API key configured. Please add your Rainy API key in settings.');
        }

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        return response.json();
    }, [getApiKey]);

    /**
     * Fetch agent feature status
     */
    const fetchAgentStatus = useCallback(async () => {
        try {
            const data = await fetchWithAuth('/agents/status');
            setAgentStatus(data);
            return data as AgentStatus;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch agent status';
            setError(message);
            return null;
        }
    }, [fetchWithAuth]);

    /**
     * Fetch available document templates
     */
    const fetchTemplates = useCallback(async (): Promise<DocumentTemplate[]> => {
        try {
            const data = await fetchWithAuth('/agents/templates');
            return data.templates || [];
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch templates';
            setError(message);
            return [];
        }
    }, [fetchWithAuth]);

    /**
     * Generate a document using AI
     */
    const generateDocument = useCallback(async (request: DocumentGenerateRequest): Promise<AgentResult | null> => {
        setIsLoading(true);
        setError(null);

        const task: AgentTask = {
            id: crypto.randomUUID(),
            type: 'document',
            status: 'running',
            prompt: request.prompt,
            templateId: request.templateId,
            progress: 0,
            createdAt: new Date().toISOString(),
        };
        setCurrentTask(task);

        try {
            const data = await fetchWithAuth('/agents/document', {
                method: 'POST',
                body: JSON.stringify(request),
            });

            const result: AgentResult = {
                success: true,
                content: typeof data.result === 'string' ? data.result : JSON.stringify(data.result),
                network: data.network,
                generatedAt: data.generatedAt,
            };

            setCurrentTask({
                ...task,
                status: 'completed',
                progress: 100,
                result,
                completedAt: new Date().toISOString(),
            });

            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Document generation failed';
            setError(message);

            const failedResult: AgentResult = {
                success: false,
                error: message,
            };

            setCurrentTask({
                ...task,
                status: 'failed',
                result: failedResult,
                completedAt: new Date().toISOString(),
            });

            return failedResult;
        } finally {
            setIsLoading(false);
        }
    }, [fetchWithAuth]);

    /**
     * Start a research task
     */
    const startResearch = useCallback(async (request: ResearchRequest): Promise<AgentResult | null> => {
        setIsLoading(true);
        setError(null);

        const task: AgentTask = {
            id: crypto.randomUUID(),
            type: 'research',
            status: 'running',
            prompt: request.topic,
            progress: 0,
            createdAt: new Date().toISOString(),
        };
        setCurrentTask(task);

        try {
            const data = await fetchWithAuth('/agents/research', {
                method: 'POST',
                body: JSON.stringify(request),
            });

            const result: AgentResult = {
                success: true,
                content: typeof data.result === 'string' ? data.result : JSON.stringify(data.result),
                generatedAt: data.generatedAt,
            };

            setCurrentTask({
                ...task,
                status: 'completed',
                progress: 100,
                result,
                completedAt: new Date().toISOString(),
            });

            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Research failed';
            setError(message);

            const failedResult: AgentResult = {
                success: false,
                error: message,
            };

            setCurrentTask({
                ...task,
                status: 'failed',
                result: failedResult,
                completedAt: new Date().toISOString(),
            });

            return failedResult;
        } finally {
            setIsLoading(false);
        }
    }, [fetchWithAuth]);

    /**
     * Clear current task and error state
     */
    const clearTask = useCallback(() => {
        setCurrentTask(null);
        setError(null);
    }, []);

    /**
     * Check if a feature is available
     */
    const canUseFeature = useCallback((feature: 'document' | 'research'): boolean => {
        if (!status) return false;
        return feature === 'document'
            ? status.features.document_generation.available
            : status.features.web_research.available;
    }, [status]);

    return {
        // State
        isLoading,
        error,
        currentTask,
        status,

        // Actions
        generateDocument,
        startResearch,
        fetchAgentStatus,
        fetchTemplates,
        clearTask,

        // Helpers
        canUseFeature,
    };
}
