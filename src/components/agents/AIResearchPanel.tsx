// src/components/agents/AIResearchPanel.tsx
// AI Research Panel - Automatic UI
// Uses HeroUI v3 compound components
// Part of Phase 3 - Rainy Cowork

import { useState } from 'react';
import { Card, Button, Spinner, Input, Label, Radio, RadioGroup } from '@heroui/react';
import { Search, Globe, Copy } from 'lucide-react';
import { useWebResearch } from '../../hooks/useWebResearch';
import { useCoworkStatus } from '../../hooks/useCoworkStatus';

export function AIResearchPanel() {
    const { researchTopic, researchResult, isResearching, error } = useWebResearch();
    const { canUseWebResearch, isLoading: coworkLoading, hasPaidPlan } = useCoworkStatus();

    const [topic, setTopic] = useState('');
    const [depth, setDepth] = useState<'basic' | 'advanced'>('basic');
    const [copied, setCopied] = useState(false);

    // AI features require paid plan
    const canUseAI = hasPaidPlan || canUseWebResearch;
    const needsUpgrade = !canUseAI && !coworkLoading;

    const handleResearch = async () => {
        if (!topic.trim()) return;
        await researchTopic(topic, depth, 5);
    };

    const handleCopy = async () => {
        if (!researchResult?.content) return;
        await navigator.clipboard.writeText(researchResult.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Globe className="size-5 text-accent" />
                <h2 className="text-lg font-semibold">AI Web Research</h2>
            </div>

            {/* Upgrade notice */}
            {needsUpgrade && (
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        Upgrade to Cowork Plus for AI web research.
                    </p>
                </div>
            )}

            {/* Input Section */}
            <Card>
                <Card.Content className="p-4 space-y-4">
                    {/* Topic Input */}
                    <div className="space-y-1">
                        <Label>Research Topic</Label>
                        <Input
                            type="text"
                            placeholder="What would you like to research?"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            disabled={isResearching || needsUpgrade}
                            className="w-full"
                        />
                    </div>

                    {/* Depth Selection */}
                    <RadioGroup
                        value={depth}
                        onChange={(val) => setDepth(val as 'basic' | 'advanced')}
                        orientation="horizontal"
                    >
                        <Label>Research Depth</Label>
                        <Radio value="basic">
                            <Radio.Control>
                                <Radio.Indicator />
                            </Radio.Control>
                            <Radio.Content>
                                <Label>Basic (faster)</Label>
                            </Radio.Content>
                        </Radio>
                        <Radio value="advanced">
                            <Radio.Control>
                                <Radio.Indicator />
                            </Radio.Control>
                            <Radio.Content>
                                <Label>Advanced (thorough)</Label>
                            </Radio.Content>
                        </Radio>
                    </RadioGroup>

                    {/* Error Display */}
                    {error && (
                        <p className="text-sm text-danger">{error}</p>
                    )}

                    {/* Research Button */}
                    <Button
                        variant="primary"
                        className="w-full"
                        onPress={handleResearch}
                        isDisabled={!topic.trim() || isResearching || needsUpgrade}
                    >
                        {isResearching ? (
                            <>
                                <Spinner size="sm" />
                                Researching...
                            </>
                        ) : (
                            <>
                                <Search className="size-4" />
                                Research with AI
                            </>
                        )}
                    </Button>
                </Card.Content>
            </Card>

            {/* Research Results */}
            {researchResult && researchResult.success && (
                <Card>
                    <Card.Header className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Globe className="size-4" />
                            <Card.Title>Research Results</Card.Title>
                        </div>
                        <Button size="sm" variant="tertiary" onPress={handleCopy}>
                            <Copy className="size-4" />
                            {copied ? 'Copied!' : 'Copy'}
                        </Button>
                    </Card.Header>
                    <Card.Content className="p-0">
                        <div
                            className="prose dark:prose-invert max-w-none p-4 max-h-96 overflow-auto"
                            dangerouslySetInnerHTML={{
                                __html: researchResult.content?.replace(/\n/g, '<br>') || ''
                            }}
                        />
                    </Card.Content>
                    <Card.Footer className="text-sm text-foreground-500">
                        Generated {researchResult.generatedAt ? new Date(researchResult.generatedAt).toLocaleTimeString() : 'just now'}
                    </Card.Footer>
                </Card>
            )}

            {/* Error result */}
            {researchResult && !researchResult.success && (
                <div className="p-4 rounded-xl border border-danger bg-danger/10">
                    <p className="text-sm text-danger">{researchResult.error}</p>
                </div>
            )}

            {/* Empty state */}
            {!researchResult && !isResearching && (
                <Card>
                    <Card.Content className="p-8 text-center">
                        <Search className="size-12 mx-auto text-foreground-300 mb-3" />
                        <p className="text-foreground-500">
                            Enter a topic above to start AI-powered research
                        </p>
                    </Card.Content>
                </Card>
            )}
        </div>
    );
}

export default AIResearchPanel;
