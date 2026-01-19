// Image Processing Commands
// Tauri commands for image metadata and thumbnail generation
// Part of Rainy Cowork Phase 3 - Milestone 3.3

use crate::services::image::{ImageMetadata, ImageService, ThumbnailResult};
use tauri::{command, State};

/// Get image metadata including EXIF data
#[command]
pub fn get_image_metadata(
    path: String,
    service: State<'_, ImageService>,
) -> Result<ImageMetadata, String> {
    service.get_metadata(&path).map_err(|e| e.to_string())
}

/// Generate a thumbnail for an image
#[command]
pub fn generate_thumbnail(
    path: String,
    max_size: Option<u32>,
    service: State<'_, ImageService>,
) -> Result<ThumbnailResult, String> {
    let size = max_size.unwrap_or(200);
    service
        .generate_thumbnail(&path, size)
        .map_err(|e| e.to_string())
}

/// Get image dimensions (width, height)
#[command]
pub fn get_image_dimensions(
    path: String,
    service: State<'_, ImageService>,
) -> Result<(u32, u32), String> {
    service.get_dimensions(&path).map_err(|e| e.to_string())
}

/// Check if a file is a supported image format
#[command]
pub fn is_image_supported(path: String, service: State<'_, ImageService>) -> bool {
    service.is_supported_format(&path)
}
