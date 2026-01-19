// useWebResearch Hook
// React hook for web content extraction
// Part of Rainy Cowork Phase 3

import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { WebContent, WebCacheStats } from '../types';

interface UseWebResearchReturn {
    /** Fetch content from a URL */
    fetchContent: (url: string) => Promise<WebContent>;
    /** Get cache statistics */
    getCacheStats: () => Promise<WebCacheStats>;
    /** Clear the cache */
    clearCache: () => Promise<void>;
    /** Loading state */
    isLoading: boolean;
    /** Error state */
    error: string | null;
    /** Last fetched content */
    content: WebContent | null;
}

/**
 * Hook for web content extraction
 * 
 * @example
 * ```tsx
 * const { fetchContent, isLoading, content, error } = useWebResearch();
 * 
 * const handleFetch = async () => {
 *   await fetchContent('https://example.com');
 * };
 * ```
 */
export function useWebResearch(): UseWebResearchReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [content, setContent] = useState<WebContent | null>(null);

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

    const getCacheStats = useCallback(async (): Promise<WebCacheStats> => {
        const [total, valid] = await invoke<[number, number]>('get_web_cache_stats');
        return { total, valid };
    }, []);

    const clearCache = useCallback(async (): Promise<void> => {
        await invoke('clear_web_cache');
    }, []);

    return {
        fetchContent,
        getCacheStats,
        clearCache,
        isLoading,
        error,
        content,
    };
}

export default useWebResearch;
