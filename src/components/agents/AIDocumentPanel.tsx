// src/components/agents/AIDocumentPanel.tsx
// AI Document Generation Panel - Automatic UI
// Uses HeroUI v3 compound components
// Part of Phase 3 - Rainy Cowork

import { useState } from 'react';
import { Card, Button, Spinner, Input, Label, Select, ListBox } from '@heroui/react';
import { Sparkles, FileText, Download, Copy } from 'lucide-react';
import { useDocument } from '../../hooks/useDocument';
import { useCoworkStatus } from '../../hooks/useCoworkStatus';

interface Template {
    id: string;
    name: string;
    description: string;
}

const templates: Template[] = [
    { id: 'meeting_notes', name: 'Meeting Notes', description: 'Meeting notes with attendees and action items' },
    { id: 'project_report', name: 'Project Report', description: 'Comprehensive project status report' },
    { id: 'email_draft', name: 'Email Draft', description: 'Professional email template' },
    { id: 'quick_note', name: 'Quick Note', description: 'Simple note with title and content' },
];

export function AIDocumentPanel() {
    const { generateWithAI, generatedDoc, isAiGenerating, error } = useDocument();
    const { canUseDocumentExport, isLoading: coworkLoading, hasPaidPlan } = useCoworkStatus();

    const [prompt, setPrompt] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [copied, setCopied] = useState(false);

    // AI features require paid plan
    const canUseAI = hasPaidPlan || canUseDocumentExport;
    const needsUpgrade = !canUseAI && !coworkLoading;

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        await generateWithAI(prompt, selectedTemplate || undefined);
    };

    const handleCopy = async () => {
        if (!generatedDoc?.content) return;
        await navigator.clipboard.writeText(generatedDoc.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!generatedDoc?.content) return;
        const blob = new Blob([generatedDoc.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedTemplate || 'document'}-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-accent" />
                <h2 className="text-lg font-semibold">AI Document Generation</h2>
            </div>

            {/* Upgrade notice */}
            {needsUpgrade && (
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        Upgrade to Cowork Plus for AI document generation.
                    </p>
                </div>
            )}

            {/* Input Section */}
            <Card>
                <Card.Content className="p-4 space-y-4">
                    {/* Template Selection */}
                    <Select
                        className="w-full"
                        placeholder="Select template (optional)"
                        selectedKey={selectedTemplate || null}
                        onSelectionChange={(key) => {
                            setSelectedTemplate(key as string || '');
                        }}
                    >
                        <Label>Template</Label>
                        <Select.Trigger>
                            <Select.Value />
                            <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                            <ListBox>
                                {templates.map((t) => (
                                    <ListBox.Item key={t.id} id={t.id} textValue={t.name}>
                                        <div>
                                            <p className="font-medium">{t.name}</p>
                                            <p className="text-xs text-foreground-500">{t.description}</p>
                                        </div>
                                        <ListBox.ItemIndicator />
                                    </ListBox.Item>
                                ))}
                            </ListBox>
                        </Select.Popover>
                    </Select>

                    {/* Prompt Input */}
                    <div className="space-y-1">
                        <Label>What would you like to create?</Label>
                        <Input
                            type="text"
                            placeholder="Write meeting notes for our product launch discussion..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={isAiGenerating || needsUpgrade}
                            className="w-full"
                        />
                    </div>

                    {/* Error Display */}
                    {error && (
                        <p className="text-sm text-danger">{error}</p>
                    )}

                    {/* Generate Button */}
                    <Button
                        variant="primary"
                        className="w-full"
                        onPress={handleGenerate}
                        isDisabled={!prompt.trim() || isAiGenerating || needsUpgrade}
                    >
                        {isAiGenerating ? (
                            <>
                                <Spinner size="sm" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="size-4" />
                                Generate with AI
                            </>
                        )}
                    </Button>
                </Card.Content>
            </Card>

            {/* Generated Document */}
            {generatedDoc && (
                <Card>
                    <Card.Header className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <FileText className="size-4" />
                            <Card.Title>Generated Document</Card.Title>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="tertiary" onPress={handleCopy}>
                                <Copy className="size-4" />
                                {copied ? 'Copied!' : 'Copy'}
                            </Button>
                            <Button size="sm" variant="tertiary" onPress={handleDownload}>
                                <Download className="size-4" />
                                Download
                            </Button>
                        </div>
                    </Card.Header>
                    <Card.Content className="p-0">
                        <div
                            className="prose dark:prose-invert max-w-none p-4 max-h-96 overflow-auto"
                            dangerouslySetInnerHTML={{ __html: generatedDoc.html || generatedDoc.content || '' }}
                        />
                    </Card.Content>
                    <Card.Footer className="text-sm text-foreground-500">
                        {generatedDoc.wordCount} words • Generated {new Date(generatedDoc.generatedAt).toLocaleTimeString()}
                    </Card.Footer>
                </Card>
            )}

            {/* Empty state */}
            {!generatedDoc && !isAiGenerating && (
                <Card>
                    <Card.Content className="p-8 text-center">
                        <FileText className="size-12 mx-auto text-foreground-300 mb-3" />
                        <p className="text-foreground-500">
                            Enter a prompt above to generate a document with AI
                        </p>
                    </Card.Content>
                </Card>
            )}
        </div>
    );
}

export default AIDocumentPanel;
