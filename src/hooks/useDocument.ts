// useDocument Hook
// React hook for document generation with AI agent support
// Part of Rainy Cowork Phase 3

import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type {
    TemplateInfo,
    GeneratedDocument,
    DocumentContext,
    TemplateCategory,
} from '../types/document';
import type { AgentResult } from '../types/agent';

// API base URL for agent endpoints  
const API_BASE = 'https://rainy-api-v2-179843975974.us-west1.run.app/api/v1';

interface UseDocumentReturn {
    /** All available templates */
    templates: TemplateInfo[];
    /** Currently selected template */
    selectedTemplate: TemplateInfo | null;
    /** Generated document */
    generatedDoc: GeneratedDocument | null;
    /** Loading state */
    isLoading: boolean;
    /** Error message */
    error: string | null;
    /** AI generation in progress */
    isAiGenerating: boolean;
    /** Load all templates */
    loadTemplates: () => Promise<void>;
    /** Get templates by category */
    getByCategory: (category: TemplateCategory) => Promise<TemplateInfo[]>;
    /** Select a template */
    selectTemplate: (templateId: string) => Promise<void>;
    /** Generate document from template (local Rust) */
    generate: (templateId: string, context: DocumentContext) => Promise<GeneratedDocument>;
    /** Generate document with AI agent (remote) */
    generateWithAI: (prompt: string, templateId?: string, context?: Record<string, unknown>) => Promise<AgentResult | null>;
    /** Convert markdown to HTML */
    toHtml: (markdown: string) => Promise<string>;
    /** Clear generated document */
    clearGenerated: () => void;
}

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

/**
 * Hook for document generation with AI support
 *
 * @example
 * ```tsx
 * const {
 *   templates,
 *   generate,        // Local template-based generation
 *   generateWithAI,  // AI-powered generation
 *   generatedDoc,
 *   isLoading,
 *   isAiGenerating
 * } = useDocument();
 *
 * // Template-based (local/fast)
 * const doc = await generate('meeting_notes', { title: 'Sprint' });
 *
 * // AI-powered (remote/smart)
 * const aiDoc = await generateWithAI(
 *   'Create meeting notes for our product launch discussion',
 *   'meeting_notes'
 * );
 * ```
 */
export function useDocument(): UseDocumentReturn {
    const [templates, setTemplates] = useState<TemplateInfo[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateInfo | null>(null);
    const [generatedDoc, setGeneratedDoc] = useState<GeneratedDocument | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadTemplates = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await invoke<TemplateInfo[]>('list_document_templates');
            setTemplates(result);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getByCategory = useCallback(async (category: TemplateCategory): Promise<TemplateInfo[]> => {
        try {
            return await invoke<TemplateInfo[]>('get_templates_by_category', { category });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            return [];
        }
    }, []);

    const selectTemplate = useCallback(async (templateId: string): Promise<void> => {
        setError(null);
        try {
            const template = await invoke<TemplateInfo>('get_template', { templateId });
            setSelectedTemplate(template);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
        }
    }, []);

    // Local template-based generation (Rust backend)
    const generate = useCallback(async (
        templateId: string,
        context: DocumentContext
    ): Promise<GeneratedDocument> => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await invoke<GeneratedDocument>('generate_document', {
                templateId,
                context,
            });
            setGeneratedDoc(result);
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw new Error(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // AI-powered generation (remote agent)
    const generateWithAI = useCallback(async (
        prompt: string,
        templateId?: string,
        context?: Record<string, unknown>
    ): Promise<AgentResult | null> => {
        setIsAiGenerating(true);
        setError(null);

        try {
            const apiKey = await getApiKey();
            if (!apiKey) {
                throw new Error('No API key configured. Please add your Rainy API key in settings.');
            }

            const response = await fetch(`${API_BASE}/agents/document`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    prompt,
                    templateId,
                    context,
                    async: false, // Synchronous for now
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                // Check if upgrade is required
                if (response.status === 403 && errorData.upgrade_required) {
                    throw new Error(errorData.message || 'Upgrade to Cowork Plus for AI document generation');
                }

                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const data = await response.json();

            const result: AgentResult = {
                success: true,
                content: typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2),
                network: data.network,
                generatedAt: data.generatedAt,
            };

            // Also update generatedDoc for compatibility
            if (result.content) {
                const html = await invoke<string>('markdown_to_html', { markdown: result.content }).catch(() => '');
                setGeneratedDoc({
                    id: crypto.randomUUID(),
                    templateId: templateId || 'ai_generated',
                    content: result.content,
                    html,
                    generatedAt: result.generatedAt || new Date().toISOString(),
                    wordCount: result.content.split(/\s+/).length,
                });
            }

            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'AI generation failed';
            setError(message);
            return {
                success: false,
                error: message,
            };
        } finally {
            setIsAiGenerating(false);
        }
    }, []);

    const toHtml = useCallback(async (markdown: string): Promise<string> => {
        try {
            return await invoke<string>('markdown_to_html', { markdown });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            return '';
        }
    }, []);

    const clearGenerated = useCallback(() => {
        setGeneratedDoc(null);
    }, []);

    // Load templates on mount
    useEffect(() => {
        loadTemplates();
    }, [loadTemplates]);

    return {
        templates,
        selectedTemplate,
        generatedDoc,
        isLoading,
        error,
        isAiGenerating,
        loadTemplates,
        getByCategory,
        selectTemplate,
        generate,
        generateWithAI,
        toHtml,
        clearGenerated,
    };
}

export default useDocument;
