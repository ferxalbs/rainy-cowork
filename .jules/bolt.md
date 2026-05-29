
## 2024-05-18 - [Preventing referential inequality in streaming components]
**Learning:** In highly dynamic components like `MessageBubble` that stream rapid prop updates, passing inline arrays (like `prop || []`) as props defeats `React.memo` on complex child components because a new array reference is created on every render tick, causing expensive AST teardowns.
**Action:** Extract inline fallback arrays as global constants (e.g. `const EMPTY_ARRAY: never[] = [];`) outside the render function, and use `React.useCallback` for functions passed down to memoized children.
