// Rainy Cowork - CoworkPanel Component
// Chat-style AI agent interface for file operations

import { useState, useRef, useEffect } from 'react';
import { Button, TextArea, Spinner } from '@heroui/react';
import { Send, Trash2, Play, X, FolderSearch, Sparkles } from 'lucide-react';
import { useCoworkAgent, AgentMessage } from '../../hooks/useCoworkAgent';

interface CoworkPanelProps {
    workspacePath: string;
    onClose?: () => void;
}

export function CoworkPanel({ workspacePath, onClose }: CoworkPanelProps) {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {
        messages,
        isPlanning,
        isExecuting,
        currentPlan,
        sendInstruction,
        executePlan,
        cancelPlan,
        analyzeWorkspace,
        clearMessages,
    } = useCoworkAgent();

    const isProcessing = isPlanning || isExecuting;

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async () => {
        if (!input.trim() || isProcessing) return;

        const instruction = input.trim();
        setInput('');
        await sendInstruction(instruction, workspacePath);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const quickActions = [
        { label: 'Analyze', icon: FolderSearch, action: () => analyzeWorkspace(workspacePath) },
        { label: 'Organize by type', icon: Sparkles, action: () => sendInstruction('Organize all files by type', workspacePath) },
    ];

    return (
        <div className="flex flex-col h-full bg-neutral-950/50 backdrop-blur-xl rounded-2xl border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="font-medium text-white">AI Cowork Agent</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        isIconOnly
                        onPress={clearMessages}
                        isDisabled={messages.length === 0}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                    {onClose && (
                        <Button
                            variant="ghost"
                            size="sm"
                            isIconOnly
                            onPress={onClose}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-neutral-400">
                        <Sparkles className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">AI File Assistant</p>
                        <p className="text-sm max-w-xs">
                            Describe what you want to do with your files. For example:
                            "Organize my downloads by file type" or "Rename all photos with date prefix"
                        </p>

                        {/* Quick Actions */}
                        <div className="flex gap-2 mt-6">
                            {quickActions.map((action) => (
                                <Button
                                    key={action.label}
                                    variant="secondary"
                                    size="sm"
                                    onPress={action.action}
                                    isDisabled={isProcessing}
                                >
                                    <action.icon className="w-4 h-4 mr-1" />
                                    {action.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((message) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            currentPlan={currentPlan}
                            isExecuting={isExecuting}
                            onExecute={executePlan}
                            onCancel={cancelPlan}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                    <TextArea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe what you want to do..."
                        rows={2}
                        className="flex-1 bg-neutral-900/50 border-white/10 text-white placeholder:text-neutral-500"
                        disabled={isProcessing}
                    />
                    <Button
                        variant="primary"
                        isIconOnly
                        onPress={handleSubmit}
                        isDisabled={!input.trim() || isProcessing}
                        isPending={isProcessing}
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                    Press Enter to send • Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}

// Message bubble component
interface MessageBubbleProps {
    message: AgentMessage;
    currentPlan: ReturnType<typeof useCoworkAgent>['currentPlan'];
    isExecuting: boolean;
    onExecute: (planId: string) => void;
    onCancel: (planId: string) => void;
}

function MessageBubble({ message, currentPlan, isExecuting, onExecute, onCancel }: MessageBubbleProps) {
    const isUser = message.type === 'user';
    const isSystem = message.type === 'system';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${isUser
                    ? 'bg-purple-600 text-white'
                    : isSystem
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                        : 'bg-neutral-800 text-neutral-100'
                    }`}
            >
                {message.isLoading && (
                    <div className="flex items-center gap-2 mb-2">
                        <Spinner size="sm" color="current" />
                        <span className="text-sm opacity-70">Processing...</span>
                    </div>
                )}

                <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                </div>

                {/* Plan Actions */}
                {message.plan && currentPlan?.id === message.plan.id && !message.result && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                        <Button
                            variant="primary"
                            size="sm"
                            onPress={() => onExecute(message.plan!.id)}
                            isDisabled={isExecuting}
                            isPending={isExecuting}
                        >
                            <Play className="w-3 h-3 mr-1" />
                            Execute
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onPress={() => onCancel(message.plan!.id)}
                            isDisabled={isExecuting}
                        >
                            Cancel
                        </Button>
                    </div>
                )}

                {/* Execution Result */}
                {message.result && (
                    <div className="mt-2 pt-2 border-t border-white/10 text-xs opacity-70">
                        {message.result.completedSteps}/{message.result.totalSteps} steps •
                        {message.result.totalChanges} changes •
                        {message.result.durationMs}ms
                    </div>
                )}
            </div>
        </div>
    );
}

export default CoworkPanel;
