// Rainy Cowork - useAIProvider Hook
// React hook for AI provider management with Keychain integration

import { useCallback, useEffect, useState } from 'react';
import * as tauri from '../services/tauri';
import type { AIProviderConfig } from '../services/tauri';

interface UseAIProviderResult {
    providers: AIProviderConfig[];
    isLoading: boolean;
    error: string | null;
    hasApiKey: (provider: string) => boolean;
    validateApiKey: (provider: string, apiKey: string) => Promise<boolean>;
    storeApiKey: (provider: string, apiKey: string) => Promise<void>;
    deleteApiKey: (provider: string) => Promise<void>;
    getModels: (provider: string) => Promise<string[]>;
    refreshProviders: () => Promise<void>;
}

export function useAIProvider(): UseAIProviderResult {
    const [providers, setProviders] = useState<AIProviderConfig[]>([]);
    const [storedKeys, setStoredKeys] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshProviders = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const providerList = await tauri.listProviders();
            setProviders(providerList);

            // Check which providers have stored keys
            const keyChecks = await Promise.all(
                providerList.map(async (p) => {
                    const providerId = p.provider === 'rainyApi' ? 'rainy_api' : 'gemini';
                    const key = await tauri.getApiKey(providerId);
                    return { provider: providerId, hasKey: key !== null };
                })
            );

            setStoredKeys(new Set(keyChecks.filter(k => k.hasKey).map(k => k.provider)));
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
            setError(err instanceof Error ? err.message : String(err));
            return false;
        }
    }, []);

    const storeApiKey = useCallback(async (provider: string, apiKey: string) => {
        setError(null);
        try {
            await tauri.storeApiKey(provider, apiKey);
            setStoredKeys(prev => new Set([...prev, provider]));
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            throw err;
        }
    }, []);

    const deleteApiKey = useCallback(async (provider: string) => {
        setError(null);
        try {
            await tauri.deleteApiKey(provider);
            setStoredKeys(prev => {
                const newSet = new Set(prev);
                newSet.delete(provider);
                return newSet;
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            throw err;
        }
    }, []);

    const getModels = useCallback(async (provider: string): Promise<string[]> => {
        try {
            return await tauri.getProviderModels(provider);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            return [];
        }
    }, []);

    return {
        providers,
        isLoading,
        error,
        hasApiKey,
        validateApiKey,
        storeApiKey,
        deleteApiKey,
        getModels,
        refreshProviders,
    };
}
