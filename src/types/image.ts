// Image Processing Types
// TypeScript definitions for image metadata and thumbnails
// Part of Rainy Cowork Phase 3

/**
 * EXIF metadata extracted from images
 */
export interface ExifData {
    /** Camera make */
    make?: string;
    /** Camera model */
    model?: string;
    /** Date/time original */
    dateTime?: string;
    /** Exposure time */
    exposureTime?: string;
    /** F-number (aperture) */
    fNumber?: string;
    /** ISO speed */
    iso?: number;
    /** Focal length */
    focalLength?: string;
    /** GPS latitude */
    gpsLatitude?: number;
    /** GPS longitude */
    gpsLongitude?: number;
    /** Image orientation */
    orientation?: number;
}

/**
 * Image metadata
 */
export interface ImageMetadata {
    /** File path */
    path: string;
    /** File name */
    filename: string;
    /** Image width in pixels */
    width: number;
    /** Image height in pixels */
    height: number;
    /** Format (JPEG, PNG, etc.) */
    format?: string;
    /** File size in bytes */
    fileSize: number;
    /** Color type */
    colorType: string;
    /** EXIF data if available */
    exif?: ExifData;
}

/**
 * Thumbnail result
 */
export interface ThumbnailResult {
    /** Base64-encoded PNG data */
    data: string;
    /** Width of thumbnail */
    width: number;
    /** Height of thumbnail */
    height: number;
    /** Original image width */
    originalWidth: number;
    /** Original image height */
    originalHeight: number;
}
