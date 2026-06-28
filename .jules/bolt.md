## 2024-05-15 - React.memo() on complex message components

**Learning:** When using React.memo on complex child components inside streaming chat interfaces (like MessageBubble), any inline empty arrays (e.g. `trace={message.trace || []}`) or inline callbacks defeat the memoization because they create referential inequality on every render.
**Action:** Extract empty arrays to module-level constants (e.g. `const EMPTY_ARRAY: never[] = []`) and use `useCallback` for functions passed as props.
