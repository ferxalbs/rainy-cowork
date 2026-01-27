# Memory System

A dual-layer memory system for the multi-agent system, providing both short-term and long-term memory capabilities.

## Overview

The memory system consists of three main components:

1. **ShortTermMemory**: Fast, in-memory ring buffer for recent actions
2. **LongTermMemory**: Persistent storage with semantic search (LanceDB)
3. **MemoryManager**: Unified interface coordinating both memory types

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MemoryManager                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │         ShortTermMemory (Ring Buffer)            │  │
│  │  - Fast in-memory storage                      │  │
│  │  - Fixed size (configurable)                   │  │
│  │  - Automatic eviction (FIFO)                   │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │         LongTermMemory (LanceDB)                │  │
│  │  - Persistent storage                          │  │
│  │  - Semantic search with embeddings              │  │
│  │  - Cross-session persistence                   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Components

### ShortTermMemory

Fast, in-memory storage for recent memory entries using a ring buffer (VecDeque).

**Features:**
- Fixed-size buffer with automatic eviction
- O(1) add and retrieve operations
- Thread-safe with Arc<RwLock>
- Returns entries in reverse chronological order

**Usage:**
```rust
use crate::services::memory::short_term::ShortTermMemory;

let mut memory = ShortTermMemory::new(100);
memory.add(entry);
let recent = memory.get_recent(10);
```

### LongTermMemory

Persistent storage with semantic search capabilities using LanceDB.

**Features:**
- Persistent storage across sessions
- Semantic search with vector embeddings
- Efficient similarity search
- TODO: LanceDB integration (future phase)

**Usage:**
```rust
use crate::services::memory::long_term::LongTermMemory;

let memory = LongTermMemory::new(PathBuf::from("./memory_db"));
memory.store(entry).await?;
let results = memory.search("query", 10).await?;
```

### MemoryManager

Unified interface coordinating both short-term and long-term memory.

**Features:**
- Single API for all memory operations
- Automatic storage in both memory types
- Combined search results
- Thread-safe with Arc<RwLock>

**Usage:**
```rust
use crate::services::memory::MemoryManager;

let manager = MemoryManager::new(100, PathBuf::from("./memory_db"));

// Store in both memories
manager.store(entry).await?;

// Search across both memories
let results = manager.search("query", 10).await?;

// Get recent from short-term
let recent = manager.get_recent(10).await;
```

## Tauri Commands

The memory system exposes the following Tauri commands to the frontend:

### Store Memory
```typescript
import { invoke } from '@tauri-apps/api/core';

const result = await invoke('store_memory', {
  content: 'Test entry',
  tags: ['test', 'example']
});
```

### Search Memory
```typescript
const results = await invoke<MemoryEntry[]>('search_memory', {
  query: 'test query',
  limit: 10
});
```

### Get Recent Memory
```typescript
const recent = await invoke<MemoryEntry[]>('get_recent_memory', {
  count: 10
});
```

### Get All Short-Term Memory
```typescript
const all = await invoke<MemoryEntry[]>('get_all_short_term_memory');
```

### Clear Short-Term Memory
```typescript
await invoke('clear_short_term_memory');
```

### Get Memory Statistics
```typescript
const stats = await invoke<MemoryStats>('get_memory_stats');
console.log(`Total entries: ${stats.total_entries}`);
```

### Get Memory by ID
```typescript
const entry = await invoke<MemoryEntry | null>('get_memory_by_id', {
  id: 'entry-id'
});
```

### Delete Memory
```typescript
await invoke('delete_memory', {
  id: 'entry-id'
});
```

### Get Short-Term Memory Size
```typescript
const size = await invoke<number>('get_short_term_memory_size');
```

### Check if Short-Term Memory is Empty
```typescript
const isEmpty = await invoke<boolean>('is_short_term_memory_empty');
```

## Data Structures

### MemoryEntry
```rust
pub struct MemoryEntry {
    pub id: String,
    pub content: String,
    pub embedding: Option<Vec<f32>>,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub tags: Vec<String>,
}
```

### MemoryStats
```rust
pub struct MemoryStats {
    pub total_entries: usize,
    pub total_size: u64,
}
```

### MemoryError
```rust
pub enum MemoryError {
    Storage(String),
    Search(String),
    Embedding(String),
    Io(std::io::Error),
    Serialization(String),
}
```

## Configuration

The memory system is configured in [`src-tauri/src/lib.rs`](../../lib.rs):

```rust
// Initialize memory manager with app data dir
let memory_db_path = app_data_dir.join("memory_db");
let memory_manager = Arc::new(MemoryManager::new(100, memory_db_path));
```

**Parameters:**
- `100`: Short-term memory size (number of entries)
- `memory_db_path`: Path to long-term memory database

## Testing

All components include comprehensive unit tests:

```bash
# Run all memory tests
cargo test --package rainy-cowork --lib services::memory

# Run specific component tests
cargo test --package rainy-cowork --lib short_term
cargo test --package rainy-cowork --lib long_term
cargo test --package rainy-cowork --lib memory_manager
cargo test --package rainy-cowork --lib commands::memory
```

## Future Enhancements

### Phase 2.4: LanceDB Integration
- Integrate LanceDB client for persistent storage
- Implement embedding generation
- Implement semantic search with vector similarity
- Add batch operations for bulk storage/retrieval

### Phase 2.5: Advanced Features
- Memory consolidation (move important entries to long-term)
- Memory pruning (remove outdated entries)
- Memory importance scoring
- Cross-agent memory sharing
- Memory export/import

## Performance Considerations

### Short-Term Memory
- **Time Complexity**: O(1) for add and retrieve
- **Space Complexity**: O(n) where n is max_size
- **Thread Safety**: Arc<RwLock> for concurrent access

### Long-Term Memory
- **Time Complexity**: O(log n) for search (with LanceDB indexing)
- **Space Complexity**: O(n) where n is total entries
- **Thread Safety**: Async operations with tokio

## Best Practices

1. **Use short-term memory for**: Recent actions, temporary context, quick lookups
2. **Use long-term memory for**: Persistent knowledge, important decisions, cross-session data
3. **Tag entries appropriately**: Use tags for categorization and filtering
4. **Clear short-term memory periodically**: To free memory and maintain relevance
5. **Search with specific queries**: Use meaningful queries for better semantic search results

## Troubleshooting

### Memory Not Persisting
- Check that the database path is writable
- Verify that LanceDB is properly initialized (future phase)

### Search Returns No Results
- Ensure entries are stored with proper content
- Check that embeddings are generated (future phase)
- Try broader search queries

### Short-Term Memory Full
- Increase the buffer size in configuration
- Clear short-term memory periodically
- Move important entries to long-term memory

## Related Documentation

- [Agent System](../../agents/README.md)
- [Multi-Agent Architecture](../../../docs/phase2-implementation-plan.md)
- [Tauri Commands](../../commands/README.md)

## License

Part of Rainy Cowork project. See LICENSE file for details.
