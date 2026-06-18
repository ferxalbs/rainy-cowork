
## 2025-02-18 - Safe React.memo Application via Scripts
**Learning:** When using temporary Node scripts to add `React.memo` to existing functions in a large file, simple regex replacements are often too greedy and fail to close the parentheses correctly, leading to syntax errors.
**Action:** Use string matching and indexing (like finding the last brace before the next component) instead of regex `[\s\S]*?` when trying to wrap components, or manually adjust specific known boundaries. Always verify the result immediately with `bun build <file> --external "*"`.
