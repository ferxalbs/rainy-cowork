// Document Generation Types
// TypeScript definitions for document templates and generation
// Part of Rainy Cowork Phase 3

/**
 * Template field definition
 */
export interface TemplateField {
    /** Field name (used in context) */
    name: string;
    /** Display label */
    label: string;
    /** Field type: text, textarea, date, list */
    fieldType: string;
    /** Whether field is required */
    required: boolean;
    /** Default value if any */
    default?: string;
}

/**
 * Document template info
 */
export interface TemplateInfo {
    /** Unique template ID */
    id: string;
    /** Display name */
    name: string;
    /** Description */
    description: string;
    /** Category: report, meeting, email, note, custom */
    category: string;
    /** Required fields */
    fields: TemplateField[];
}

/**
 * Generated document response
 */
export interface GeneratedDocument {
    /** Document ID */
    id: string;
    /** Template used */
    templateId: string;
    /** Markdown content */
    content: string;
    /** HTML preview */
    html: string;
    /** Generation timestamp */
    generatedAt: string;
    /** Word count */
    wordCount: number;
}

/**
 * Template categories
 */
export type TemplateCategory = 'report' | 'meeting' | 'email' | 'note' | 'custom';

/**
 * Context for document generation (key-value pairs)
 */
export type DocumentContext = Record<string, unknown>;
