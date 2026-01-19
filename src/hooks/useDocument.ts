// useDocument Hook
// React hook for document generation
// Part of Rainy Cowork Phase 3

import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type {
    TemplateInfo,
    GeneratedDocument,
    DocumentContext,
    TemplateCategory,
} from '../types/document';

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
    /** Load all templates */
    loadTemplates: () => Promise<void>;
    /** Get templates by category */
    getByCategory: (category: TemplateCategory) => Promise<TemplateInfo[]>;
    /** Select a template */
    selectTemplate: (templateId: string) => Promise<void>;
    /** Generate document from template */
    generate: (templateId: string, context: DocumentContext) => Promise<GeneratedDocument>;
    /** Convert markdown to HTML */
    toHtml: (markdown: string) => Promise<string>;
    /** Clear generated document */
    clearGenerated: () => void;
}

/**
 * Hook for document generation
 *
 * @example
 * ```tsx
 * const {
 *   templates,
 *   selectedTemplate,
 *   generate,
 *   generatedDoc,
 *   isLoading
 * } = useDocument();
 *
 * // Load templates on mount
 * useEffect(() => { loadTemplates(); }, []);
 *
 * // Generate document
 * const handleGenerate = async () => {
 *   const doc = await generate('meeting_notes', {
 *     title: 'Sprint Planning',
 *     date: '2026-01-18',
 *     attendees: 'Team A'
 *   });
 *   console.log(doc.content);
 * };
 * ```
 */
export function useDocument(): UseDocumentReturn {
    const [templates, setTemplates] = useState<TemplateInfo[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateInfo | null>(null);
    const [generatedDoc, setGeneratedDoc] = useState<GeneratedDocument | null>(null);
    const [isLoading, setIsLoading] = useState(false);
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
        loadTemplates,
        getByCategory,
        selectTemplate,
        generate,
        toHtml,
        clearGenerated,
    };
}

export default useDocument;
