// Rainy Cowork - useAIProvider Hook
// React hook for AI provider management with Keychain integration

import { useCallback, useEffect, useState, useRef } from 'react';
import * as tauri from '../services/tauri';
import type { AIProviderConfig } from '../services/tauri';

interface UseAIProviderResult {
    providers: AIProviderConfig[];
    isLoading: boolean;
    error: string | null;
    hasApiKey: (provider: string) => boolean;
    validateApiKey: (provider: string, apiKey: string) => Promise<boolean>;
    storeApiKey: (provider: string, apiKey: string) => Promise<void>;
    getApiKey: (provider: string) => Promise<string | null>;
    deleteApiKey: (provider: string) => Promise<void>;
    getModels: (provider: string) => Promise<string[]>;
    refreshProviders: () => Promise<void>;
}

export function useAIProvider(): UseAIProviderResult {
    const [providers, setProviders] = useState<AIProviderConfig[]>([]);
    const [storedKeys, setStoredKeys] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Debounce refresh calls to prevent excessive API calls
    const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastRefreshTime = useRef<number>(0);

    const refreshProviders = useCallback(async (force = false) => {
        // Debounce rapid calls (unless forced)
        const now = Date.now();
        if (!force && now - lastRefreshTime.current < 1000) {
            return;
        }
        lastRefreshTime.current = now;

        // Clear any pending timeout
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
        }

        setIsLoading(true);
        setError(null);
        try {
            const providerList = await tauri.listProviders();
            setProviders(providerList);

            // Batch key checks for better performance with error handling
            const keyChecks = await Promise.allSettled(
                providerList.map(async (p) => {
                    let providerId = 'gemini';
                    // Backend returns lowercase provider strings
                    if (p.provider === 'rainyApi' || (p.provider as unknown as string) === 'rainyapi') {
                        providerId = 'rainy_api';
                    } else if (p.provider === 'coworkApi' || (p.provider as unknown as string) === 'coworkapi') {
                        providerId = 'cowork_api';
                    }
                    
                    const key = await tauri.getApiKey(providerId);
                    return { provider: providerId, hasKey: key !== null };
                })
            );

            const successfulChecks = keyChecks
                .filter((result): result is PromiseFulfilledResult<{ provider: string; hasKey: boolean }> => 
                    result.status === 'fulfilled')
                .map(result => result.value);

            setStoredKeys(new Set(successfulChecks.filter(k => k.hasKey).map(k => k.provider)));
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshProviders();
    }, [refreshProviders]);

    const hasApiKey = useCallback((provider: string): boolean => {
        return storedKeys.has(provider);
    }, [storedKeys]);

    const validateApiKey = useCallback(async (
        provider: string,
        apiKey: string
    ): Promise<boolean> => {
        setError(null);
        try {
            return await tauri.validateApiKey(provider, apiKey);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw new Error(message);
        }
    }, []);

    const storeApiKey = useCallback(async (provider: string, apiKey: string) => {
        setError(null);
        try {
            await tauri.storeApiKey(provider, apiKey);
            setStoredKeys(prev => new Set([...prev, provider]));
            // Force refresh after key change with debouncing
            refreshTimeoutRef.current = setTimeout(() => {
                refreshProviders(true);
            }, 500);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            throw err;
        }
    }, [refreshProviders]);

    const deleteApiKey = useCallback(async (provider: string) => {
        setError(null);
        try {
            await tauri.deleteApiKey(provider);
            setStoredKeys(prev => {
                const newSet = new Set(prev);
                newSet.delete(provider);
                return newSet;
            });
            // Force refresh after key deletion with debouncing
            refreshTimeoutRef.current = setTimeout(() => {
                refreshProviders(true);
            }, 500);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            throw err;
        }
    }, [refreshProviders]);

    const getModels = useCallback(async (provider: string): Promise<string[]> => {
        try {
            return await tauri.getProviderModels(provider);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            return [];
        }
    }, []);

    const getApiKey = useCallback(async (provider: string): Promise<string | null> => {
        try {
            return await tauri.getApiKey(provider);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            return null;
        }
    }, []);

    return {
        providers,
        isLoading,
        error,
        hasApiKey,
        validateApiKey,
        storeApiKey,
        getApiKey, // Exposed
        deleteApiKey,
        getModels,
        refreshProviders,
    };
}
