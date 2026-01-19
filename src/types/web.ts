// Web Research Types
// TypeScript definitions for web content extraction
// Part of Rainy Cowork Phase 3

/**
 * Extracted web content with metadata
 */
export interface WebContent {
    /** Original URL */
    url: string;
    /** Page title */
    title: string;
    /** Content converted to Markdown */
    contentMarkdown: string;
    /** Meta description if available */
    description: string | null;
    /** Extraction timestamp (ISO 8601) */
    extractedAt: string;
    /** Content byte size */
    sizeBytes: number;
}

/**
 * Web cache statistics
 */
export interface WebCacheStats {
    total: number;
    valid: number;
}
