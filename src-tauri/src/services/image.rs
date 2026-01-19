// Image Processing Service
// Handles image metadata extraction, thumbnail generation, and basic analysis
// Part of Rainy Cowork Phase 3 - Milestone 3.3

use image::{GenericImageView, ImageFormat};
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::BufReader;
use std::path::Path;
use thiserror::Error;

/// Errors for image processing operations
#[derive(Error, Debug)]
pub enum ImageError {
    #[error("File not found: {0}")]
    FileNotFound(String),
    #[error("Invalid image format: {0}")]
    InvalidFormat(String),
    #[error("Failed to read image: {0}")]
    ReadError(String),
    #[error("Failed to process image: {0}")]
    ProcessingError(String),
    #[error("EXIF parsing error: {0}")]
    ExifError(String),
}

/// Image metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageMetadata {
    /// File path
    pub path: String,
    /// File name
    pub filename: String,
    /// Image width in pixels
    pub width: u32,
    /// Image height in pixels
    pub height: u32,
    /// Format (JPEG, PNG, etc.)
    pub format: Option<String>,
    /// File size in bytes
    pub file_size: u64,
    /// Color type
    pub color_type: String,
    /// EXIF data if available
    pub exif: Option<ExifData>,
}

/// EXIF metadata extracted from images
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ExifData {
    /// Camera make
    #[serde(skip_serializing_if = "Option::is_none")]
    pub make: Option<String>,
    /// Camera model
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    /// Date/time original
    #[serde(skip_serializing_if = "Option::is_none")]
    pub date_time: Option<String>,
    /// Exposure time
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exposure_time: Option<String>,
    /// F-number (aperture)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub f_number: Option<String>,
    /// ISO speed
    #[serde(skip_serializing_if = "Option::is_none")]
    pub iso: Option<u32>,
    /// Focal length
    #[serde(skip_serializing_if = "Option::is_none")]
    pub focal_length: Option<String>,
    /// GPS latitude
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gps_latitude: Option<f64>,
    /// GPS longitude
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gps_longitude: Option<f64>,
    /// Image orientation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub orientation: Option<u16>,
}

/// Thumbnail result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThumbnailResult {
    /// Base64-encoded PNG data
    pub data: String,
    /// Width of thumbnail
    pub width: u32,
    /// Height of thumbnail
    pub height: u32,
    /// Original image dimensions
    pub original_width: u32,
    /// Original image height
    pub original_height: u32,
}

/// Image processing service
pub struct ImageService;

impl Default for ImageService {
    fn default() -> Self {
        Self::new()
    }
}

impl ImageService {
    /// Create new ImageService
    pub fn new() -> Self {
        Self
    }

    /// Get image metadata including EXIF data
    pub fn get_metadata(&self, path: &str) -> Result<ImageMetadata, ImageError> {
        let path_obj = Path::new(path);

        // Check file exists
        if !path_obj.exists() {
            return Err(ImageError::FileNotFound(path.to_string()));
        }

        // Get file size
        let file_size = std::fs::metadata(path)
            .map_err(|e| ImageError::ReadError(e.to_string()))?
            .len();

        // Get filename
        let filename = path_obj
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        // Open and decode image
        let img = image::open(path).map_err(|e| ImageError::InvalidFormat(e.to_string()))?;

        let (width, height) = img.dimensions();
        let color_type = format!("{:?}", img.color());

        // Detect format from extension
        let format = path_obj
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.to_uppercase());

        // Extract EXIF data
        let exif = self.extract_exif(path).ok();

        Ok(ImageMetadata {
            path: path.to_string(),
            filename,
            width,
            height,
            format,
            file_size,
            color_type,
            exif,
        })
    }

    /// Extract EXIF metadata from image
    fn extract_exif(&self, path: &str) -> Result<ExifData, ImageError> {
        let file = File::open(path).map_err(|e| ImageError::ReadError(e.to_string()))?;
        let mut bufreader = BufReader::new(&file);

        let exif_reader = exif::Reader::new()
            .read_from_container(&mut bufreader)
            .map_err(|e| ImageError::ExifError(e.to_string()))?;

        let mut data = ExifData::default();

        // Camera info
        if let Some(field) = exif_reader.get_field(exif::Tag::Make, exif::In::PRIMARY) {
            data.make = Some(
                field
                    .display_value()
                    .to_string()
                    .trim_matches('"')
                    .to_string(),
            );
        }
        if let Some(field) = exif_reader.get_field(exif::Tag::Model, exif::In::PRIMARY) {
            data.model = Some(
                field
                    .display_value()
                    .to_string()
                    .trim_matches('"')
                    .to_string(),
            );
        }

        // Date/time
        if let Some(field) = exif_reader.get_field(exif::Tag::DateTimeOriginal, exif::In::PRIMARY) {
            data.date_time = Some(
                field
                    .display_value()
                    .to_string()
                    .trim_matches('"')
                    .to_string(),
            );
        }

        // Exposure settings
        if let Some(field) = exif_reader.get_field(exif::Tag::ExposureTime, exif::In::PRIMARY) {
            data.exposure_time = Some(field.display_value().to_string());
        }
        if let Some(field) = exif_reader.get_field(exif::Tag::FNumber, exif::In::PRIMARY) {
            data.f_number = Some(field.display_value().to_string());
        }
        if let Some(field) =
            exif_reader.get_field(exif::Tag::PhotographicSensitivity, exif::In::PRIMARY)
        {
            if let exif::Value::Short(ref v) = field.value {
                if let Some(&iso) = v.first() {
                    data.iso = Some(iso as u32);
                }
            }
        }
        if let Some(field) = exif_reader.get_field(exif::Tag::FocalLength, exif::In::PRIMARY) {
            data.focal_length = Some(field.display_value().to_string());
        }

        // Orientation
        if let Some(field) = exif_reader.get_field(exif::Tag::Orientation, exif::In::PRIMARY) {
            if let exif::Value::Short(ref v) = field.value {
                if let Some(&o) = v.first() {
                    data.orientation = Some(o);
                }
            }
        }

        // GPS data
        if let (Some(lat_field), Some(lat_ref)) = (
            exif_reader.get_field(exif::Tag::GPSLatitude, exif::In::PRIMARY),
            exif_reader.get_field(exif::Tag::GPSLatitudeRef, exif::In::PRIMARY),
        ) {
            if let exif::Value::Rational(ref rationals) = lat_field.value {
                if rationals.len() >= 3 {
                    let lat = Self::dms_to_decimal(
                        rationals[0].to_f64(),
                        rationals[1].to_f64(),
                        rationals[2].to_f64(),
                    );
                    let lat_ref_str = lat_ref.display_value().to_string();
                    data.gps_latitude = Some(if lat_ref_str.contains('S') { -lat } else { lat });
                }
            }
        }

        if let (Some(lon_field), Some(lon_ref)) = (
            exif_reader.get_field(exif::Tag::GPSLongitude, exif::In::PRIMARY),
            exif_reader.get_field(exif::Tag::GPSLongitudeRef, exif::In::PRIMARY),
        ) {
            if let exif::Value::Rational(ref rationals) = lon_field.value {
                if rationals.len() >= 3 {
                    let lon = Self::dms_to_decimal(
                        rationals[0].to_f64(),
                        rationals[1].to_f64(),
                        rationals[2].to_f64(),
                    );
                    let lon_ref_str = lon_ref.display_value().to_string();
                    data.gps_longitude = Some(if lon_ref_str.contains('W') { -lon } else { lon });
                }
            }
        }

        Ok(data)
    }

    /// Convert DMS coordinates to decimal
    fn dms_to_decimal(degrees: f64, minutes: f64, seconds: f64) -> f64 {
        degrees + (minutes / 60.0) + (seconds / 3600.0)
    }

    /// Generate a thumbnail of the image
    pub fn generate_thumbnail(
        &self,
        path: &str,
        max_size: u32,
    ) -> Result<ThumbnailResult, ImageError> {
        if !Path::new(path).exists() {
            return Err(ImageError::FileNotFound(path.to_string()));
        }

        // Open image
        let img = image::open(path).map_err(|e| ImageError::InvalidFormat(e.to_string()))?;
        let (original_width, original_height) = img.dimensions();

        // Generate thumbnail maintaining aspect ratio
        let thumbnail = img.thumbnail(max_size, max_size);
        let (width, height) = thumbnail.dimensions();

        // Encode to PNG in memory
        let mut buffer = Vec::new();
        let mut cursor = std::io::Cursor::new(&mut buffer);
        thumbnail
            .write_to(&mut cursor, ImageFormat::Png)
            .map_err(|e| ImageError::ProcessingError(e.to_string()))?;

        // Base64 encode
        use base64::Engine;
        let data = base64::engine::general_purpose::STANDARD.encode(&buffer);

        Ok(ThumbnailResult {
            data,
            width,
            height,
            original_width,
            original_height,
        })
    }

    /// Get basic image info (lighter than full metadata)
    pub fn get_dimensions(&self, path: &str) -> Result<(u32, u32), ImageError> {
        if !Path::new(path).exists() {
            return Err(ImageError::FileNotFound(path.to_string()));
        }

        let img = image::open(path).map_err(|e| ImageError::InvalidFormat(e.to_string()))?;
        Ok(img.dimensions())
    }

    /// Check if file is a supported image format
    pub fn is_supported_format(&self, path: &str) -> bool {
        let supported = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "tif"];
        Path::new(path)
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| supported.contains(&e.to_lowercase().as_str()))
            .unwrap_or(false)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_service() {
        let service = ImageService::new();
        assert!(!service.is_supported_format("test.txt"));
        assert!(service.is_supported_format("test.jpg"));
        assert!(service.is_supported_format("test.PNG"));
    }

    #[test]
    fn test_dms_to_decimal() {
        // 40° 26' 46.302" N should be ~40.446195
        let result = ImageService::dms_to_decimal(40.0, 26.0, 46.302);
        assert!((result - 40.446195).abs() < 0.0001);
    }
}
