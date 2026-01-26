/**
 * useCoworkBilling Hook
 *
 * React hook for Cowork subscription management.
 * Handles plan listing, checkout, and subscription status via Tauri backend.
 */

import { useCallback, useEffect, useState } from 'react';
import * as tauri from '../services/tauri';

export interface CoworkPlan {
    id: string;
    name: string;
    price: number;
    usageLimit: number;
    modelAccessLevel: string;
    features: {
        web_research: boolean;
        document_export: boolean;
        image_analysis: boolean;
        priority_support: boolean;
    } | null;
    hasStripePrice: boolean;
}

export interface CoworkSubscription {
    hasSubscription: boolean;
    plan: string;
    planName?: string;
    status?: string;
    currentPeriodEnd?: string;
    usageThisMonth?: number;
    creditsUsedThisMonth?: number;
}

interface UseCoworkBillingResult {
    plans: CoworkPlan[];
    subscription: CoworkSubscription | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    checkout: (planId: string) => Promise<string | null>;
    openPortal: () => Promise<string | null>;
    refresh: () => Promise<void>;
}

export function useCoworkBilling(): UseCoworkBillingResult {
    const [plans] = useState<CoworkPlan[]>([]);
    const [subscription, setSubscription] = useState<CoworkSubscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Fetch subscription status via Tauri Backend
            // This ensures we validation against the real rainy-sdk/backend state
            const status = await tauri.getCoworkStatus();
            
            setSubscription({
                hasSubscription: status.has_paid_plan,
                plan: status.plan,
                planName: status.plan_name,
                status: status.is_valid ? 'active' : 'inactive',
                usageThisMonth: status.usage.used,
                creditsUsedThisMonth: status.usage.credits_used,
                currentPeriodEnd: status.usage.resets_at
            });

            // Populate plans with data from status if available, or leave empty
            // We avoid fetching from frontend to prevent SSL errors
            if (status.plan) {
                 // We could potentially reconstruct current plan info here
            }

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to load billing info');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // Simplified checkout - just opens the pricing page as requested by user ("modal" / external link)
    const checkout = useCallback(async (_planId: string): Promise<string | null> => {
       // Just open the pricing page directly
       await import('@tauri-apps/plugin-opener').then(opener => {
          opener.openUrl('https://enosislabs.com/pricing');
       });
       return null;
    }, []);

    const openPortal = useCallback(async (): Promise<string | null> => {
        // Just open the portal/account page directly
       await import('@tauri-apps/plugin-opener').then(opener => {
          opener.openUrl('https://enosislabs.com/account');
       });
       return null;
    }, []);

    return {
        plans,
        subscription,
        isLoading,
        error,
        checkout,
        openPortal,
        refresh,
    };
}
