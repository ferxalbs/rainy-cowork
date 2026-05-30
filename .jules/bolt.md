## 2024-05-18 - [Optimizing React streaming chat interfaces]
**Learning:** React elements passed to children or inline fallbacks (e.g. `prop || []`) within frequently updating components (like streaming chat message bubbles) trigger child re-renders even when wrapped in `React.memo()`. You must also memoize the props.
**Action:** Extract inline arrays to stable global constants (e.g., `const EMPTY_ARRAY: never[] = [];`) and use `useCallback` for functions passed as props to heavily optimized child components.
