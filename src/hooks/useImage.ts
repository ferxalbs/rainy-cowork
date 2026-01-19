// useImage Hook
// React hook for image processing
// Part of Rainy Cowork Phase 3

import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { ImageMetadata, ThumbnailResult } from '../types/image';

interface UseImageReturn {
    /** Image metadata */
    metadata: ImageMetadata | null;
    /** Thumbnail result */
    thumbnail: ThumbnailResult | null;
    /** Loading state */
    isLoading: boolean;
    /** Error message */
    error: string | null;
    /** Get image metadata */
    getMetadata: (path: string) => Promise<ImageMetadata>;
    /** Generate thumbnail */
    getThumbnail: (path: string, maxSize?: number) => Promise<ThumbnailResult>;
    /** Get image dimensions */
    getDimensions: (path: string) => Promise<[number, number]>;
    /** Check if format is supported */
    isSupported: (path: string) => Promise<boolean>;
    /** Clear state */
    clear: () => void;
}

/**
 * Hook for image processing
 *
 * @example
 * ```tsx
 * const { getMetadata, getThumbnail, metadata, thumbnail } = useImage();
 *
 * const handleSelectImage = async (path: string) => {
 *   const meta = await getMetadata(path);
 *   console.log(`${meta.width}x${meta.height}`, meta.exif);
 *
 *   const thumb = await getThumbnail(path, 150);
 *   // Use thumb.data as base64 PNG in <img src={`data:image/png;base64,${thumb.data}`} />
 * };
 * ```
 */
export function useImage(): UseImageReturn {
    const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
    const [thumbnail, setThumbnail] = useState<ThumbnailResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getMetadata = useCallback(async (path: string): Promise<ImageMetadata> => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await invoke<ImageMetadata>('get_image_metadata', { path });
            setMetadata(result);
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw new Error(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getThumbnail = useCallback(async (
        path: string,
        maxSize: number = 200
    ): Promise<ThumbnailResult> => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await invoke<ThumbnailResult>('generate_thumbnail', { path, maxSize });
            setThumbnail(result);
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw new Error(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getDimensions = useCallback(async (path: string): Promise<[number, number]> => {
        try {
            return await invoke<[number, number]>('get_image_dimensions', { path });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw new Error(message);
        }
    }, []);

    const isSupported = useCallback(async (path: string): Promise<boolean> => {
        try {
            return await invoke<boolean>('is_image_supported', { path });
        } catch {
            return false;
        }
    }, []);

    const clear = useCallback(() => {
        setMetadata(null);
        setThumbnail(null);
        setError(null);
    }, []);

    return {
        metadata,
        thumbnail,
        isLoading,
        error,
        getMetadata,
        getThumbnail,
        getDimensions,
        isSupported,
        clear,
    };
}

export default useImage;
