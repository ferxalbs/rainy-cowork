## 2024-06-11 - React.memo with Inline Arrays Anti-Pattern
**Learning:** In React streaming chat interfaces, passing inline fallback arrays (e.g., `prop || []`) to child components defeats `React.memo()` due to referential inequality on every render.
**Action:** Extract fallback arrays as stable global constants (e.g., `const EMPTY_ARRAY: never[] = [];`) outside the component to preserve memoization when dealing with complex, frequently updating components.
