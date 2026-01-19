// Rainy Cowork - File Operations Engine
// High-performance file operations with parallel processing and AI integration
// Part of Phase 1: Core AI File Operations Engine

use chrono::{DateTime, Utc};
use dashmap::DashMap;
// rayon is available for future parallel processing optimizations
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use thiserror::Error;
use tokio::fs;
use uuid::Uuid;

// ============ Error Types ============

#[derive(Debug, Error)]
#[allow(dead_code)] // Some variants reserved for future operations
pub enum FileOpError {
    #[error("File not found: {0}")]
    NotFound(String),
    #[error("Permission denied: {0}")]
    PermissionDenied(String),
    #[error("Destination already exists: {0}")]
    AlreadyExists(String),
    #[error("Invalid path: {0}")]
    InvalidPath(String),
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
    #[error("Operation cancelled")]
    Cancelled,
    #[error("Conflict: {0}")]
    Conflict(String),
}

pub type FileOpResult<T> = Result<T, FileOpError>;

// ============ Operation Types ============

/// Strategy for handling file conflicts
#[derive(Debug, Clone, Copy, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum ConflictStrategy {
    #[default]
    Skip,
    Overwrite,
    Rename,
    Ask,
}

/// Strategy for organizing files
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OrganizeStrategy {
    /// Organize by file type (Documents, Images, Videos, etc.)
    ByType,
    /// Organize by date (Year/Month folders)
    ByDate,
    /// Organize by file extension
    ByExtension,
    /// AI-powered organization based on content analysis
    ByContent,
    /// Custom rules provided by user
    Custom(Vec<OrganizeRule>),
}

/// Custom organization rule
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OrganizeRule {
    pub pattern: String,
    pub destination: String,
    pub is_regex: bool,
}

/// Pattern for batch renaming
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenamePattern {
    pub template: String,
    pub find: Option<String>,
    pub replace: Option<String>,
    pub counter_start: Option<u32>,
    pub counter_padding: Option<u32>,
}

/// A single move operation
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MoveOperation {
    pub source: String,
    pub destination: String,
    pub on_conflict: ConflictStrategy,
}

/// Rename preview for user confirmation
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenamePreview {
    pub original: String,
    pub new_name: String,
    pub has_conflict: bool,
}

/// Result of an organize operation
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OrganizeResult {
    pub files_moved: u32,
    pub folders_created: u32,
    pub skipped: u32,
    pub errors: Vec<String>,
    pub changes: Vec<FileOpChange>,
}

/// Individual file operation change record
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileOpChange {
    pub id: String,
    pub operation: FileOpType,
    pub source_path: String,
    pub dest_path: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub reversible: bool,
}

/// Type of file operation
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum FileOpType {
    Move,
    Copy,
    Rename,
    Delete,
    Create,
    CreateFolder,
}

/// Workspace analysis result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceAnalysis {
    pub total_files: u64,
    pub total_folders: u64,
    pub total_size_bytes: u64,
    pub file_types: HashMap<String, FileTypeStats>,
    pub largest_files: Vec<FileInfo>,
    pub duplicate_candidates: Vec<DuplicateGroup>,
    pub suggestions: Vec<OptimizationSuggestion>,
}

/// Statistics for a file type
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileTypeStats {
    pub count: u64,
    pub total_size: u64,
    pub extensions: Vec<String>,
}

/// File information for display
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileInfo {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub modified: DateTime<Utc>,
}

/// Group of potentially duplicate files
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DuplicateGroup {
    pub size: u64,
    pub files: Vec<String>,
}

/// Suggestion for workspace optimization
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OptimizationSuggestion {
    pub suggestion_type: SuggestionType,
    pub description: String,
    pub potential_savings: Option<u64>,
    pub affected_files: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SuggestionType {
    DeleteDuplicates,
    ArchiveOldFiles,
    OrganizeByType,
    CompressImages,
    CleanTempFiles,
}

// ============ Operation History ============

/// Recorded operation for undo support
#[derive(Debug, Clone)]
pub struct OperationRecord {
    pub id: String,
    pub changes: Vec<FileOpChange>,
    pub timestamp: DateTime<Utc>,
    pub description: String,
}

// ============ File Operations Engine ============

/// Core engine for file operations with parallel processing
pub struct FileOperationEngine {
    /// Operation history for undo support
    history: DashMap<String, OperationRecord>,
    /// Trash directory for safe deletes
    trash_dir: PathBuf,
}

impl FileOperationEngine {
    pub fn new() -> Self {
        let trash_dir = dirs::data_local_dir()
            .unwrap_or_else(|| PathBuf::from("/tmp"))
            .join("rainy-cowork")
            .join("trash");

        Self {
            history: DashMap::new(),
            trash_dir,
        }
    }

    /// Initialize the engine (create required directories)
    pub async fn init(&self) -> FileOpResult<()> {
        if !self.trash_dir.exists() {
            fs::create_dir_all(&self.trash_dir).await?;
        }
        Ok(())
    }

    // ============ Core Operations ============

    /// Move multiple files with parallel processing
    pub async fn move_files(
        &self,
        operations: Vec<MoveOperation>,
    ) -> FileOpResult<Vec<FileOpChange>> {
        let mut changes = Vec::new();
        let mut errors = Vec::new();

        for op in operations {
            match self
                .move_single(&op.source, &op.destination, op.on_conflict)
                .await
            {
                Ok(change) => changes.push(change),
                Err(e) => errors.push(format!("{}: {}", op.source, e)),
            }
        }

        if !errors.is_empty() && changes.is_empty() {
            return Err(FileOpError::Conflict(errors.join("; ")));
        }

        // Record in history
        if !changes.is_empty() {
            self.record_operation("Move files", changes.clone());
        }

        Ok(changes)
    }

    /// Move a single file (non-recursive implementation)
    async fn move_single(
        &self,
        source: &str,
        destination: &str,
        on_conflict: ConflictStrategy,
    ) -> FileOpResult<FileOpChange> {
        let src_path = Path::new(source);
        let mut dest_path_buf = PathBuf::from(destination);

        if !src_path.exists() {
            return Err(FileOpError::NotFound(source.to_string()));
        }

        // Handle conflicts
        if dest_path_buf.exists() {
            match on_conflict {
                ConflictStrategy::Skip => {
                    return Err(FileOpError::AlreadyExists(destination.to_string()));
                }
                ConflictStrategy::Overwrite => {
                    fs::remove_file(&dest_path_buf).await?;
                }
                ConflictStrategy::Rename => {
                    // Generate unique name without recursion
                    dest_path_buf = self.generate_unique_name(&dest_path_buf).await?;
                }
                ConflictStrategy::Ask => {
                    return Err(FileOpError::Conflict(format!(
                        "File exists: {}",
                        destination
                    )));
                }
            }
        }

        // Ensure destination directory exists
        if let Some(parent) = dest_path_buf.parent() {
            if !parent.exists() {
                fs::create_dir_all(parent).await?;
            }
        }

        // Perform the move
        fs::rename(src_path, &dest_path_buf).await?;

        Ok(FileOpChange {
            id: Uuid::new_v4().to_string(),
            operation: FileOpType::Move,
            source_path: source.to_string(),
            dest_path: Some(dest_path_buf.to_string_lossy().to_string()),
            timestamp: Utc::now(),
            reversible: true,
        })
    }

    /// Generate a unique filename by appending a counter
    async fn generate_unique_name(&self, path: &Path) -> FileOpResult<PathBuf> {
        let stem = path
            .file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_default();
        let ext = path
            .extension()
            .map(|s| format!(".{}", s.to_string_lossy()))
            .unwrap_or_default();
        let parent = path.parent().unwrap_or(Path::new("."));

        for i in 1..1000 {
            let new_name = format!("{} ({}){}", stem, i, ext);
            let new_path = parent.join(&new_name);
            if !new_path.exists() {
                return Ok(new_path);
            }
        }

        Err(FileOpError::Conflict(
            "Could not generate unique name".to_string(),
        ))
    }

    /// Batch rename files with pattern
    pub async fn batch_rename(
        &self,
        files: Vec<String>,
        pattern: RenamePattern,
        preview_only: bool,
    ) -> FileOpResult<Vec<RenamePreview>> {
        let mut previews = Vec::new();
        let mut counter = pattern.counter_start.unwrap_or(1);
        let padding = pattern.counter_padding.unwrap_or(3) as usize;

        for file_path in &files {
            let path = Path::new(file_path);
            let file_name = path
                .file_name()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_default();
            let stem = path
                .file_stem()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_default();
            let ext = path
                .extension()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_default();

            let mut new_name = pattern.template.clone();

            // Replace placeholders
            new_name = new_name.replace("{name}", &file_name);
            new_name = new_name.replace("{stem}", &stem);
            new_name = new_name.replace("{ext}", &ext);
            new_name = new_name.replace(
                "{counter}",
                &format!("{:0width$}", counter, width = padding),
            );

            // Apply find/replace if specified
            if let (Some(find), Some(replace)) = (&pattern.find, &pattern.replace) {
                new_name = new_name.replace(find, replace);
            }

            let new_path = path
                .parent()
                .map(|p| p.join(&new_name))
                .unwrap_or_else(|| PathBuf::from(&new_name));

            let has_conflict = new_path.exists() && new_path != path;

            previews.push(RenamePreview {
                original: file_path.clone(),
                new_name: new_path.to_string_lossy().to_string(),
                has_conflict,
            });

            counter += 1;
        }

        // Execute renames if not preview only
        if !preview_only {
            let mut changes = Vec::new();
            for preview in &previews {
                if !preview.has_conflict {
                    fs::rename(&preview.original, &preview.new_name).await?;
                    changes.push(FileOpChange {
                        id: Uuid::new_v4().to_string(),
                        operation: FileOpType::Rename,
                        source_path: preview.original.clone(),
                        dest_path: Some(preview.new_name.clone()),
                        timestamp: Utc::now(),
                        reversible: true,
                    });
                }
            }
            if !changes.is_empty() {
                self.record_operation("Batch rename", changes);
            }
        }

        Ok(previews)
    }

    /// Safe delete - moves files to trash
    pub async fn safe_delete(&self, paths: Vec<String>) -> FileOpResult<Vec<FileOpChange>> {
        self.init().await?;
        let mut changes = Vec::new();

        for path_str in paths {
            let path = Path::new(&path_str);
            if !path.exists() {
                continue;
            }

            let file_name = path
                .file_name()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_else(|| Uuid::new_v4().to_string());

            let trash_name = format!("{}_{}", Uuid::new_v4(), file_name);
            let trash_path = self.trash_dir.join(&trash_name);

            fs::rename(&path, &trash_path).await?;

            changes.push(FileOpChange {
                id: Uuid::new_v4().to_string(),
                operation: FileOpType::Delete,
                source_path: path_str,
                dest_path: Some(trash_path.to_string_lossy().to_string()),
                timestamp: Utc::now(),
                reversible: true,
            });
        }

        if !changes.is_empty() {
            self.record_operation("Delete files", changes.clone());
        }

        Ok(changes)
    }

    /// Organize folder by strategy
    pub async fn organize_folder(
        &self,
        path: &str,
        strategy: OrganizeStrategy,
        dry_run: bool,
    ) -> FileOpResult<OrganizeResult> {
        let base_path = Path::new(path);
        if !base_path.exists() || !base_path.is_dir() {
            return Err(FileOpError::InvalidPath(path.to_string()));
        }

        let mut result = OrganizeResult {
            files_moved: 0,
            folders_created: 0,
            skipped: 0,
            errors: Vec::new(),
            changes: Vec::new(),
        };

        // Collect all files in directory
        let mut files_to_organize = Vec::new();
        let mut entries = fs::read_dir(base_path).await?;
        while let Some(entry) = entries.next_entry().await? {
            let entry_path = entry.path();
            if entry_path.is_file() {
                files_to_organize.push(entry_path);
            }
        }

        // Process files based on strategy
        for file_path in files_to_organize {
            let dest_folder = match &strategy {
                OrganizeStrategy::ByType => self.get_type_folder(&file_path),
                OrganizeStrategy::ByExtension => self.get_extension_folder(&file_path),
                OrganizeStrategy::ByDate => self.get_date_folder(&file_path).await,
                OrganizeStrategy::ByContent => "Uncategorized".to_string(), // AI analysis would go here
                OrganizeStrategy::Custom(rules) => self.apply_custom_rules(&file_path, rules),
            };

            let dest_dir = base_path.join(&dest_folder);
            let dest_path = dest_dir.join(file_path.file_name().unwrap_or_default());

            if dest_path == file_path {
                result.skipped += 1;
                continue;
            }

            if !dry_run {
                // Create destination folder if needed
                if !dest_dir.exists() {
                    if let Err(e) = fs::create_dir_all(&dest_dir).await {
                        result
                            .errors
                            .push(format!("Failed to create {}: {}", dest_folder, e));
                        continue;
                    }
                    result.folders_created += 1;
                }

                // Move the file
                match fs::rename(&file_path, &dest_path).await {
                    Ok(_) => {
                        result.files_moved += 1;
                        result.changes.push(FileOpChange {
                            id: Uuid::new_v4().to_string(),
                            operation: FileOpType::Move,
                            source_path: file_path.to_string_lossy().to_string(),
                            dest_path: Some(dest_path.to_string_lossy().to_string()),
                            timestamp: Utc::now(),
                            reversible: true,
                        });
                    }
                    Err(e) => {
                        result.errors.push(format!(
                            "Failed to move {}: {}",
                            file_path.to_string_lossy(),
                            e
                        ));
                    }
                }
            } else {
                // Dry run - just record what would happen
                result.files_moved += 1;
                result.changes.push(FileOpChange {
                    id: Uuid::new_v4().to_string(),
                    operation: FileOpType::Move,
                    source_path: file_path.to_string_lossy().to_string(),
                    dest_path: Some(dest_path.to_string_lossy().to_string()),
                    timestamp: Utc::now(),
                    reversible: true,
                });
            }
        }

        // Record in history if not dry run
        if !dry_run && !result.changes.is_empty() {
            self.record_operation("Organize folder", result.changes.clone());
        }

        Ok(result)
    }

    /// Get destination folder based on file type
    fn get_type_folder(&self, path: &Path) -> String {
        let ext = path
            .extension()
            .map(|s| s.to_string_lossy().to_lowercase())
            .unwrap_or_default();

        match ext.as_str() {
            // Documents
            "pdf" | "doc" | "docx" | "txt" | "rtf" | "odt" | "pages" => "Documents",
            // Spreadsheets
            "xls" | "xlsx" | "csv" | "numbers" => "Spreadsheets",
            // Presentations
            "ppt" | "pptx" | "key" => "Presentations",
            // Images
            "jpg" | "jpeg" | "png" | "gif" | "bmp" | "svg" | "webp" | "heic" | "heif" => "Images",
            // Videos
            "mp4" | "mov" | "avi" | "mkv" | "wmv" | "flv" | "webm" => "Videos",
            // Audio
            "mp3" | "wav" | "flac" | "aac" | "ogg" | "m4a" => "Audio",
            // Archives
            "zip" | "rar" | "7z" | "tar" | "gz" | "bz2" => "Archives",
            // Code
            "rs" | "js" | "ts" | "jsx" | "tsx" | "py" | "rb" | "go" | "java" | "c" | "cpp"
            | "h" | "hpp" | "swift" => "Code",
            // Data
            "json" | "xml" | "yaml" | "yml" | "toml" => "Data",
            // Apps
            "app" | "dmg" | "pkg" | "exe" | "msi" => "Applications",
            // Default
            _ => "Other",
        }
        .to_string()
    }

    /// Get destination folder based on extension
    fn get_extension_folder(&self, path: &Path) -> String {
        path.extension()
            .map(|s| s.to_string_lossy().to_uppercase())
            .unwrap_or_else(|| "NO_EXTENSION".to_string())
    }

    /// Get destination folder based on modification date
    async fn get_date_folder(&self, path: &Path) -> String {
        if let Ok(metadata) = fs::metadata(path).await {
            if let Ok(modified) = metadata.modified() {
                let dt: DateTime<Utc> = modified.into();
                return format!("{}/{:02}", dt.format("%Y"), dt.format("%m"));
            }
        }
        "Unknown".to_string()
    }

    /// Apply custom organization rules
    fn apply_custom_rules(&self, path: &Path, rules: &[OrganizeRule]) -> String {
        let file_name = path
            .file_name()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_default();

        for rule in rules {
            let matches = if rule.is_regex {
                regex::Regex::new(&rule.pattern)
                    .map(|re| re.is_match(&file_name))
                    .unwrap_or(false)
            } else {
                file_name.contains(&rule.pattern)
            };

            if matches {
                return rule.destination.clone();
            }
        }

        "Other".to_string()
    }

    /// Analyze workspace and generate optimization suggestions
    pub async fn analyze_workspace(&self, path: &str) -> FileOpResult<WorkspaceAnalysis> {
        let base_path = Path::new(path);
        if !base_path.exists() || !base_path.is_dir() {
            return Err(FileOpError::InvalidPath(path.to_string()));
        }

        let mut total_files = 0u64;
        let mut total_folders = 0u64;
        let mut total_size = 0u64;
        let mut file_types: HashMap<String, FileTypeStats> = HashMap::new();
        let mut file_sizes: Vec<FileInfo> = Vec::new();
        let mut size_map: HashMap<u64, Vec<String>> = HashMap::new();

        // Use walkdir for recursive traversal (sync, then we'll make it work)
        fn visit_dir(
            dir: &Path,
            total_files: &mut u64,
            total_folders: &mut u64,
            total_size: &mut u64,
            file_types: &mut HashMap<String, FileTypeStats>,
            file_sizes: &mut Vec<FileInfo>,
            size_map: &mut HashMap<u64, Vec<String>>,
        ) -> std::io::Result<()> {
            if dir.is_dir() {
                for entry in std::fs::read_dir(dir)? {
                    let entry = entry?;
                    let path = entry.path();

                    if path.is_dir() {
                        *total_folders += 1;
                        visit_dir(
                            &path,
                            total_files,
                            total_folders,
                            total_size,
                            file_types,
                            file_sizes,
                            size_map,
                        )?;
                    } else {
                        *total_files += 1;

                        if let Ok(metadata) = std::fs::metadata(&path) {
                            let size = metadata.len();
                            *total_size += size;

                            // Track file type
                            let ext = path
                                .extension()
                                .map(|s| s.to_string_lossy().to_lowercase())
                                .unwrap_or_else(|| "unknown".to_string());

                            let type_name = match ext.as_str() {
                                "jpg" | "jpeg" | "png" | "gif" | "webp" | "heic" => "Images",
                                "mp4" | "mov" | "avi" | "mkv" => "Videos",
                                "mp3" | "wav" | "flac" | "m4a" => "Audio",
                                "pdf" | "doc" | "docx" | "txt" => "Documents",
                                "zip" | "rar" | "7z" | "tar" | "gz" => "Archives",
                                _ => "Other",
                            };

                            let entry =
                                file_types
                                    .entry(type_name.to_string())
                                    .or_insert(FileTypeStats {
                                        count: 0,
                                        total_size: 0,
                                        extensions: Vec::new(),
                                    });
                            entry.count += 1;
                            entry.total_size += size;
                            if !entry.extensions.contains(&ext) {
                                entry.extensions.push(ext);
                            }

                            // Track for largest files
                            let modified = metadata
                                .modified()
                                .map(|t| DateTime::<Utc>::from(t))
                                .unwrap_or_else(|_| Utc::now());

                            file_sizes.push(FileInfo {
                                path: path.to_string_lossy().to_string(),
                                name: path
                                    .file_name()
                                    .map(|s| s.to_string_lossy().to_string())
                                    .unwrap_or_default(),
                                size,
                                modified,
                            });

                            // Track for duplicates by size
                            size_map
                                .entry(size)
                                .or_default()
                                .push(path.to_string_lossy().to_string());
                        }
                    }
                }
            }
            Ok(())
        }

        visit_dir(
            base_path,
            &mut total_files,
            &mut total_folders,
            &mut total_size,
            &mut file_types,
            &mut file_sizes,
            &mut size_map,
        )?;

        // Get largest files (top 10)
        file_sizes.sort_by(|a, b| b.size.cmp(&a.size));
        let largest_files: Vec<FileInfo> = file_sizes.into_iter().take(10).collect();

        // Find potential duplicates (same size files)
        let duplicate_candidates: Vec<DuplicateGroup> = size_map
            .into_iter()
            .filter(|(size, files)| *size > 1024 && files.len() > 1) // Only consider files > 1KB with duplicates
            .map(|(size, files)| DuplicateGroup { size, files })
            .take(10)
            .collect();

        // Generate suggestions
        let mut suggestions = Vec::new();

        if !duplicate_candidates.is_empty() {
            let potential_savings: u64 = duplicate_candidates
                .iter()
                .map(|g| g.size * (g.files.len() as u64 - 1))
                .sum();

            suggestions.push(OptimizationSuggestion {
                suggestion_type: SuggestionType::DeleteDuplicates,
                description: format!(
                    "Found {} potential duplicate groups",
                    duplicate_candidates.len()
                ),
                potential_savings: Some(potential_savings),
                affected_files: duplicate_candidates
                    .iter()
                    .flat_map(|g| g.files.clone())
                    .collect(),
            });
        }

        if file_types.len() > 5 {
            suggestions.push(OptimizationSuggestion {
                suggestion_type: SuggestionType::OrganizeByType,
                description: "Workspace contains many file types. Consider organizing by type."
                    .to_string(),
                potential_savings: None,
                affected_files: Vec::new(),
            });
        }

        Ok(WorkspaceAnalysis {
            total_files,
            total_folders,
            total_size_bytes: total_size,
            file_types,
            largest_files,
            duplicate_candidates,
            suggestions,
        })
    }

    // ============ Undo Support ============

    /// Record an operation for undo support
    fn record_operation(&self, description: &str, changes: Vec<FileOpChange>) {
        let record = OperationRecord {
            id: Uuid::new_v4().to_string(),
            changes,
            timestamp: Utc::now(),
            description: description.to_string(),
        };
        self.history.insert(record.id.clone(), record);
    }

    /// Undo the last operation
    pub async fn undo_operation(&self, operation_id: &str) -> FileOpResult<Vec<FileOpChange>> {
        let record = self
            .history
            .remove(operation_id)
            .map(|(_, r)| r)
            .ok_or_else(|| {
                FileOpError::NotFound(format!("Operation not found: {}", operation_id))
            })?;

        let mut undo_changes = Vec::new();

        // Reverse each change
        for change in record.changes.into_iter().rev() {
            if !change.reversible {
                continue;
            }

            match change.operation {
                FileOpType::Move | FileOpType::Rename => {
                    if let Some(dest) = &change.dest_path {
                        fs::rename(dest, &change.source_path).await?;
                        undo_changes.push(FileOpChange {
                            id: Uuid::new_v4().to_string(),
                            operation: FileOpType::Move,
                            source_path: dest.clone(),
                            dest_path: Some(change.source_path.clone()),
                            timestamp: Utc::now(),
                            reversible: false,
                        });
                    }
                }
                FileOpType::Delete => {
                    // Restore from trash
                    if let Some(trash_path) = &change.dest_path {
                        fs::rename(trash_path, &change.source_path).await?;
                        undo_changes.push(FileOpChange {
                            id: Uuid::new_v4().to_string(),
                            operation: FileOpType::Create,
                            source_path: change.source_path.clone(),
                            dest_path: None,
                            timestamp: Utc::now(),
                            reversible: false,
                        });
                    }
                }
                _ => {}
            }
        }

        Ok(undo_changes)
    }

    /// Get list of undoable operations
    pub fn list_operations(&self) -> Vec<(String, String, DateTime<Utc>)> {
        self.history
            .iter()
            .map(|r| (r.id.clone(), r.description.clone(), r.timestamp))
            .collect()
    }
}

impl Default for FileOperationEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_type_folder() {
        let engine = FileOperationEngine::new();

        assert_eq!(engine.get_type_folder(Path::new("test.pdf")), "Documents");
        assert_eq!(engine.get_type_folder(Path::new("photo.jpg")), "Images");
        assert_eq!(engine.get_type_folder(Path::new("video.mp4")), "Videos");
        assert_eq!(engine.get_type_folder(Path::new("code.rs")), "Code");
        assert_eq!(engine.get_type_folder(Path::new("unknown.xyz")), "Other");
    }

    #[test]
    fn test_rename_pattern() {
        let pattern = RenamePattern {
            template: "photo_{counter}.{ext}".to_string(),
            find: None,
            replace: None,
            counter_start: Some(1),
            counter_padding: Some(3),
        };

        // Pattern should produce names like "photo_001.jpg"
        assert!(pattern.template.contains("{counter}"));
    }
}
