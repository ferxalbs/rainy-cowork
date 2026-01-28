//! Tauri commands for memory management
//!
//! This module provides Tauri commands that expose the memory system to the frontend.
//! All commands are thread-safe and use the MemoryManager for operations.

use crate::agents::MemoryEntry;
use crate::services::memory::MemoryManager;
use tauri::State;

/// State wrapper for MemoryManager
///
/// Wraps the MemoryManager in an Arc for thread-safe access across Tauri commands.
#[derive(Debug, Clone)]
pub struct MemoryManagerState(pub std::sync::Arc<MemoryManager>);

/// Store an entry in memory
///
/// Stores the entry in both short-term and long-term memory.
///
/// # Arguments
///
/// * `manager` - Memory manager state
/// * `content` - The content of the memory entry
/// * `tags` - Optional tags for categorization
///
/// # Returns
///
/// Success message if stored successfully
///
/// # Example
///
/// ```typescript
/// import { invoke } from '@tauri-apps/api/core';
///
/// const result = await invoke('store_memory', {
///   content: 'Test entry',
///   tags: ['test', 'example']
/// });
/// ```
#[tauri::command]
pub async fn store_memory(
    manager: State<'_, MemoryManagerState>,
    content: String,
    tags: Vec<String>,
) -> Result<String, String> {
    let entry = MemoryEntry {
        id: uuid::Uuid::new_v4().to_string(),
        content,
        embedding: None,
        timestamp: chrono::Utc::now(),
        tags,
    };

    manager.0.store(entry).await.map_err(|e| e.to_string())?;

    Ok("Stored successfully".to_string())
}

/// Search memory
///
/// Performs semantic search across both short-term and long-term memory.
///
/// # Arguments
///
/// * `manager` - Memory manager state
/// * `query` - The search query string
/// * `limit` - Maximum number of results to return (default: 10)
///
/// # Returns
///
/// A vector of matching memory entries
///
/// # Example
///
/// ```typescript
/// import { invoke } from '@tauri-apps/api/core';
///
/// const results = await invoke<MemoryEntry[]>('search_memory', {
///   query: 'test query',
///   limit: 10
/// });
/// ```
#[tauri::command]
pub async fn search_memory(
    manager: State<'_, MemoryManagerState>,
    query: String,
    limit: Option<usize>,
) -> Result<Vec<MemoryEntry>, String> {
    let limit = limit.unwrap_or(10);
    manager
        .0
        .search(&query, limit)
        .await
        .map_err(|e| e.to_string())
}

/// Get recent entries from short-term memory
///
/// Returns the most recent entries from short-term memory only.
///
/// # Arguments
///
/// * `manager` - Memory manager state
/// * `count` - Maximum number of entries to return (default: 10)
///
/// # Returns
///
/// A vector of the most recent entries
///
/// # Example
///
/// ```typescript
/// import { invoke } from '@tauri-apps/api/core';
///
/// const recent = await invoke<MemoryEntry[]>('get_recent_memory', {
///   count: 10
/// });
/// ```
#[tauri::command]
pub async fn get_recent_memory(
    manager: State<'_, MemoryManagerState>,
    count: Option<usize>,
) -> Result<Vec<MemoryEntry>, String> {
    let count = count.unwrap_or(10);
    Ok(manager.0.get_recent(count).await)
}

/// Get all entries from short-term memory
///
/// Returns all entries currently in short-term memory.
///
/// # Arguments
///
/// * `manager` - Memory manager state
///
/// # Returns
///
/// A vector of all entries in short-term memory
///
/// # Example
///
/// ```typescript
/// import { invoke } from '@tauri-apps/api/core';
///
/// const all = await invoke<MemoryEntry[]>('get_all_short_term_memory');
/// ```
#[tauri::command]
pub async fn get_all_short_term_memory(
    manager: State<'_, MemoryManagerState>,
) -> Result<Vec<MemoryEntry>, String> {
    Ok(manager.0.get_all_short_term().await)
}

/// Clear short-term memory
///
/// Removes all entries from short-term memory.
/// Long-term memory is not affected.
///
/// # Arguments
///
/// * `manager` - Memory manager state
///
/// # Returns
///
/// Success message if cleared successfully
///
/// # Example
///
/// ```typescript
/// import { invoke } from '@tauri-apps/api/core';
///
/// await invoke('clear_short_term_memory');
/// ```
#[tauri::command]
pub async fn clear_short_term_memory(manager: State<'_, MemoryManagerState>) -> Result<(), String> {
    manager.0.clear_short_term().await;
    Ok(())
}

/// Get memory statistics
///
/// Returns statistics from long-term memory.
///
/// # Arguments
///
/// * `manager` - Memory manager state
///
/// # Returns
///
/// Memory statistics including total entries and storage size
///
/// # Example
///
/// ```typescript
/// import { invoke } from '@tauri-apps/api/core';
///
/// const stats = await invoke<MemoryStats>('get_memory_stats');
/// console.log(`Total entries: ${stats.total_entries}`);
/// ```
#[tauri::command]
pub async fn get_memory_stats(
    manager: State<'_, MemoryManagerState>,
) -> Result<crate::services::memory::long_term::MemoryStats, String> {
    manager.0.get_stats().await.map_err(|e| e.to_string())
}

/// Get entry by ID
///
/// Retrieves a specific memory entry by its unique identifier.
///
/// # Arguments
///
/// * `manager` - Memory manager state
/// * `id` - The unique identifier of the entry
///
/// # Returns
///
/// The memory entry if found, null otherwise
///
/// # Example
///
/// ```typescript
/// import { invoke } from '@tauri-apps/api/core';
///
/// const entry = await invoke<MemoryEntry | null>('get_memory_by_id', {
///   id: 'entry-id'
/// });
/// ```
#[tauri::command]
pub async fn get_memory_by_id(
    manager: State<'_, MemoryManagerState>,
    id: String,
) -> Result<Option<MemoryEntry>, String> {
    manager.0.get_by_id(&id).await.map_err(|e| e.to_string())
}

/// Delete entry from long-term memory
///
/// Removes a memory entry from long-term memory.
///
/// # Arguments
///
/// * `manager` - Memory manager state
/// * `id` - The unique identifier of the entry to delete
///
/// # Returns
///
/// Success message if deleted successfully
///
/// # Example
///
/// ```typescript
/// import { invoke } from '@tauri-apps/api/core';
///
/// await invoke('delete_memory', {
///   id: 'entry-id'
/// });
/// ```
#[tauri::command]
pub async fn delete_memory(
    manager: State<'_, MemoryManagerState>,
    id: String,
) -> Result<(), String> {
    manager.0.delete(&id).await.map_err(|e| e.to_string())
}

/// Get short-term memory size
///
/// Returns the current number of entries in short-term memory.
///
/// # Arguments
///
/// * `manager` - Memory manager state
///
/// # Returns
///
/// The number of entries in short-term memory
///
/// # Example
///
/// ```typescript
/// import { invoke } from '@tauri-apps/api/core';
///
/// const size = await invoke<number>('get_short_term_memory_size');
/// console.log(`Short-term memory size: ${size}`);
/// ```
#[tauri::command]
pub async fn get_short_term_memory_size(
    manager: State<'_, MemoryManagerState>,
) -> Result<usize, String> {
    Ok(manager.0.short_term_size().await)
}

/// Check if short-term memory is empty
///
/// # Arguments
///
/// * `manager` - Memory manager state
///
/// # Returns
///
/// `true` if short-term memory is empty, `false` otherwise
///
/// # Example
///
/// ```typescript
/// import { invoke } from '@tauri-apps/api/core';
///
/// const isEmpty = await invoke<boolean>('is_short_term_memory_empty');
/// console.log(`Is empty: ${isEmpty}`);
/// ```
#[tauri::command]
pub async fn is_short_term_memory_empty(
    manager: State<'_, MemoryManagerState>,
) -> Result<bool, String> {
    Ok(manager.0.is_short_term_empty().await)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::memory::MemoryManager;
    use tempfile::TempDir;

    fn create_test_manager() -> MemoryManagerState {
        let temp_dir = TempDir::new().unwrap();
        MemoryManagerState(std::sync::Arc::new(MemoryManager::new(
            10,
            temp_dir.path().to_path_buf(),
        )))
    }

    // Helper function to simulate Tauri State
    fn as_state<'a>(manager: &'a MemoryManagerState) -> State<'a, MemoryManagerState> {
        unsafe { std::mem::transmute_copy(&manager) }
    }

    #[tokio::test]
    async fn test_store_memory_command() {
        let manager = create_test_manager();

        let result = store_memory(
            as_state(&manager),
            "Test entry".to_string(),
            vec!["test".to_string()],
        )
        .await;

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "Stored successfully");
    }

    #[tokio::test]
    async fn test_search_memory_command() {
        let manager = create_test_manager();

        // Store an entry first
        store_memory(as_state(&manager), "Test entry".to_string(), vec![])
            .await
            .unwrap();

        let result = search_memory(as_state(&manager), "test".to_string(), Some(10)).await;

        assert!(result.is_ok());
        let results = result.unwrap();
        assert!(!results.is_empty());
    }

    #[tokio::test]
    async fn test_get_recent_memory_command() {
        let manager = create_test_manager();

        // Store some entries
        for i in 0..3 {
            store_memory(as_state(&manager), format!("Entry {}", i), vec![])
                .await
                .unwrap();
        }

        let result = get_recent_memory(as_state(&manager), Some(2)).await;

        assert!(result.is_ok());
        let recent = result.unwrap();
        assert_eq!(recent.len(), 2);
    }

    #[tokio::test]
    async fn test_clear_short_term_memory_command() {
        let manager = create_test_manager();

        // Store an entry
        store_memory(as_state(&manager), "Test entry".to_string(), vec![])
            .await
            .unwrap();

        // Clear memory
        let result = clear_short_term_memory(as_state(&manager)).await;
        assert!(result.is_ok());

        // Verify it's empty
        let size = get_short_term_memory_size(as_state(&manager))
            .await
            .unwrap();
        assert_eq!(size, 0);
    }

    #[tokio::test]
    async fn test_get_memory_stats_command() {
        let manager = create_test_manager();

        let result = get_memory_stats(as_state(&manager)).await;
        assert!(result.is_ok());
        let stats = result.unwrap();
        assert_eq!(stats.total_entries, 0);
    }

    #[tokio::test]
    async fn test_get_short_term_memory_size_command() {
        let manager = create_test_manager();

        let size = get_short_term_memory_size(as_state(&manager))
            .await
            .unwrap();
        assert_eq!(size, 0);

        // Store an entry
        store_memory(as_state(&manager), "Test entry".to_string(), vec![])
            .await
            .unwrap();

        let size = get_short_term_memory_size(as_state(&manager))
            .await
            .unwrap();
        assert_eq!(size, 1);
    }

    #[tokio::test]
    async fn test_is_short_term_memory_empty_command() {
        let manager = create_test_manager();

        let is_empty = is_short_term_memory_empty(as_state(&manager))
            .await
            .unwrap();
        assert!(is_empty);

        // Store an entry
        store_memory(as_state(&manager), "Test entry".to_string(), vec![])
            .await
            .unwrap();

        let is_empty = is_short_term_memory_empty(as_state(&manager))
            .await
            .unwrap();
        assert!(!is_empty);
    }
}
