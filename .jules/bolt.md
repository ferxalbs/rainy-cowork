## $(date +%Y-%m-%d) - Prevent React.memo() invalidation with stable fallback array
**Learning:** Passing inline fallback arrays like `prop || []` to child components completely defeats `React.memo()` because `[]` creates a new array reference on every render, failing the shallow equality check.
**Action:** Always extract fallback arrays as stable global constants (e.g., `const EMPTY_ARRAY: never[] = [];`) outside the component to preserve referential equality when using `React.memo()`.
