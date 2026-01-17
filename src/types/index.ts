// Rainy Cowork - Type Definitions

/**
 * Task status enum for tracking task lifecycle
 */
export type TaskStatus = 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

/**
 * AI Provider identifiers
 */
export type ProviderType = 'openai' | 'anthropic' | 'ollama' | 'custom';

/**
 * File operation types for tracking changes
 */
export type FileOperation = 'create' | 'modify' | 'delete' | 'move' | 'rename';

/**
 * AI Provider configuration
 */
export interface AIProvider {
    id: ProviderType;
    name: string;
    model: string;
    isAvailable: boolean;
    icon?: string;
}

/**
 * Task definition
 */
export interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    progress: number; // 0-100
    provider: ProviderType;
    model: string;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    steps?: TaskStep[];
}

/**
 * Individual task step for detailed progress
 */
export interface TaskStep {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startedAt?: Date;
    completedAt?: Date;
}

/**
 * File change record
 */
export interface FileChange {
    id: string;
    path: string;
    filename: string;
    operation: FileOperation;
    timestamp: Date;
    taskId?: string;
    previousPath?: string; // For move/rename operations
}

/**
 * Folder with access permissions
 */
export interface Folder {
    id: string;
    path: string;
    name: string;
    accessType: 'read-only' | 'full-access';
    isExpanded?: boolean;
}

/**
 * Application settings
 */
export interface AppSettings {
    theme: 'light' | 'dark' | 'system';
    defaultProvider: ProviderType;
    sidebarCollapsed: boolean;
    showNotifications: boolean;
}

/**
 * Available AI providers with their configurations
 */
export const AI_PROVIDERS: AIProvider[] = [
    {
        id: 'openai',
        name: 'OpenAI',
        model: 'gpt-4o',
        isAvailable: true,
    },
    {
        id: 'anthropic',
        name: 'Anthropic',
        model: 'claude-3.5-sonnet',
        isAvailable: true,
    },
    {
        id: 'ollama',
        name: 'Ollama (Local)',
        model: 'llama3.2',
        isAvailable: false,
    },
];
