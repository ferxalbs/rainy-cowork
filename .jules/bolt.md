
## 2024-05-18 - Memoize complex child components in chat

**Learning:** When using React.memo on complex child components to prevent re-renders, it is crucial to extract default fallback arrays/objects (like `[]`) into stable global constants (e.g. `const EMPTY_ARRAY = []`). Otherwise, inline initializations evaluate to referential inequality on every render, completely defeating the memoization. Also, handler callbacks passed as props must be wrapped in `React.useCallback`.
**Action:** Always scrutinize default prop values when adding `React.memo`, especially empty arrays or objects, and lift them out of the render scope.
