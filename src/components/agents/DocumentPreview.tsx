// src/components/agents/DocumentPreview.tsx
// Document Preview Component
// Displays generated document with markdown rendering
// Part of Phase 3 - Rainy Cowork

import { Card, Button, Spinner } from '@heroui/react';
import { Copy, Download, FileText, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { GeneratedDocument } from '../../types/document';

interface DocumentPreviewProps {
    /** Generated document to display */
    document: GeneratedDocument | null;
    /** Whether document was AI-generated */
    isAiGenerated?: boolean;
    /** Loading state */
    isLoading?: boolean;
    /** Callback when copy is clicked */
    onCopy?: () => void;
    /** Callback when download is clicked */
    onDownload?: () => void;
}

/**
 * Document Preview Component
 * Renders markdown documents with syntax highlighting and actions
 */
export function DocumentPreview({
    document,
    isAiGenerated = false,
    isLoading = false,
    onCopy,
    onDownload,
}: DocumentPreviewProps) {
    const [copied, setCopied] = useState(false);
    const [htmlContent, setHtmlContent] = useState<string>('');

    // Convert markdown to HTML when document changes
    useEffect(() => {
        if (document?.content) {
            invoke<string>('markdown_to_html', { markdown: document.content })
                .then(setHtmlContent)
                .catch(() => setHtmlContent(''));
        } else {
            setHtmlContent('');
        }
    }, [document?.content]);

    const handleCopy = async () => {
        if (!document?.content) return;

        try {
            await navigator.clipboard.writeText(document.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            onCopy?.();
        } catch {
            console.error('Failed to copy');
        }
    };

    const handleDownload = () => {
        if (!document?.content) return;

        const blob = new Blob([document.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = `${document.templateId || 'document'}-${new Date().toISOString().split('T')[0]}.md`;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        URL.revokeObjectURL(url);
        onDownload?.();
    };

    if (isLoading) {
        return (
            <Card className="w-full h-64 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Spinner size="lg" />
                    <p className="text-foreground-500">
                        {isAiGenerated ? 'AI is generating your document...' : 'Generating document...'}
                    </p>
                </div>
            </Card>
        );
    }

    if (!document) {
        return (
            <Card className="w-full h-64 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-foreground-400">
                    <FileText className="w-12 h-12" />
                    <p>No document generated yet</p>
                    <p className="text-sm">Select a template and fill in the details to get started</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <Card.Header className="flex justify-between items-center border-b border-divider">
                <div className="flex items-center gap-2">
                    {isAiGenerated ? (
                        <Sparkles className="w-5 h-5 text-accent" />
                    ) : (
                        <FileText className="w-5 h-5 text-foreground-500" />
                    )}
                    <Card.Title className="text-lg">
                        {isAiGenerated ? 'AI Generated Document' : 'Generated Document'}
                    </Card.Title>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="tertiary"
                        onPress={handleCopy}
                    >
                        <Copy className="w-4 h-4" />
                        {copied ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button
                        size="sm"
                        variant="tertiary"
                        onPress={handleDownload}
                    >
                        <Download className="w-4 h-4" />
                        Download
                    </Button>
                </div>
            </Card.Header>

            <Card.Content className="p-0">
                {/* HTML rendered view */}
                <div
                    className="prose dark:prose-invert max-w-none p-6 min-h-[200px] max-h-[500px] overflow-auto"
                    dangerouslySetInnerHTML={{ __html: htmlContent || document.html || '' }}
                />
            </Card.Content>

            <Card.Footer className="flex justify-between items-center border-t border-divider text-sm text-foreground-500">
                <span>
                    Template: {document.templateId}
                </span>
                <span>
                    {document.wordCount} words • Generated {new Date(document.generatedAt).toLocaleString()}
                </span>
            </Card.Footer>
        </Card>
    );
}

export default DocumentPreview;
