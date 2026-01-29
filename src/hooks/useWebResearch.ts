// useWebResearch Hook
// React hook for web content extraction with AI research support
// Part of Rainy Cowork Phase 3

import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { WebContent, WebCacheStats } from '../types';
import type { AgentResult } from '../types/agent';

// API base URL
const API_BASE = 'https://rainy-api-v2-179843975974.us-west1.run.app/api/v1';

/**
 * Helper to get API key
 */
async function getApiKey(): Promise<string | null> {
    try {
        return await invoke<string | null>('get_api_key', { provider: 'rainy_api' });
    } catch {
        return null;
    }
}

interface UseWebResearchReturn {
    /** Fetch content from a URL (local) */
    fetchContent: (url: string) => Promise<WebContent>;
    /** Research a topic with AI (remote) */
    researchTopic: (topic: string, depth?: 'basic' | 'advanced', maxSources?: number) => Promise<AgentResult | null>;
    /** Get cache statistics */
    getCacheStats: () => Promise<WebCacheStats>;
    /** Clear the cache */
    clearCache: () => Promise<void>;
    /** Loading state */
    isLoading: boolean;
    /** AI research in progress */
    isResearching: boolean;
    /** Error state */
    error: string | null;
    /** Last fetched content */
    content: WebContent | null;
    /** Last research result */
    researchResult: AgentResult | null;
}

/**
 * Hook for web content extraction and AI research
 * 
 * @example
 * ```tsx
 * const { fetchContent, researchTopic, isLoading, content } = useWebResearch();
 * 
 * // Local extraction
 * await fetchContent('https://example.com');
 * 
 * // AI-powered research
 * const result = await researchTopic('Latest React 19 features', 'advanced');
 * ```
 */
export function useWebResearch(): UseWebResearchReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [isResearching, setIsResearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [content, setContent] = useState<WebContent | null>(null);
    const [researchResult, setResearchResult] = useState<AgentResult | null>(null);

    // Local content extraction (Rust backend)
    const fetchContent = useCallback(async (url: string): Promise<WebContent> => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await invoke<WebContent>('fetch_web_content', { url });
            setContent(result);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // AI-powered research (remote agent with Tavily)
    const researchTopic = useCallback(async (
        topic: string,
        depth: 'basic' | 'advanced' = 'basic',
        maxSources: number = 5
    ): Promise<AgentResult | null> => {
        setIsResearching(true);
        setError(null);

        try {
            const apiKey = await getApiKey();
            if (!apiKey) {
                throw new Error('No API key configured. Please add your Rainy API key in settings.');
            }

            const response = await fetch(`${API_BASE}/agents/research`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    topic,
                    depth,
                    maxSources,
                    async: false,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                if (response.status === 403 && errorData.upgrade_required) {
                    throw new Error(errorData.message || 'Upgrade to Cowork Plus for AI research');
                }

                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const data = await response.json();

            const result: AgentResult = {
                success: true,
                content: typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2),
                generatedAt: data.generatedAt,
            };

            setResearchResult(result);
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Research failed';
            setError(message);
            const failedResult: AgentResult = { success: false, error: message };
            setResearchResult(failedResult);
            return failedResult;
        } finally {
            setIsResearching(false);
        }
    }, []);

    const getCacheStats = useCallback(async (): Promise<WebCacheStats> => {
        const [total, valid] = await invoke<[number, number]>('get_web_cache_stats');
        return { total, valid };
    }, []);

    const clearCache = useCallback(async (): Promise<void> => {
        await invoke('clear_web_cache');
    }, []);

    return {
        fetchContent,
        researchTopic,
        getCacheStats,
        clearCache,
        isLoading,
        isResearching,
        error,
        content,
        researchResult,
    };
}

export default useWebResearch;
