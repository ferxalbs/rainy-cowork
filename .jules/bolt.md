## 2024-05-25 - Prevent MessageBubble streaming re-renders
**Learning:** Frequent token stream updates cause massive re-render trees in the React UI because components like `SupervisorRail`, `TraceAccordion`, and `PlanCard` aren't memoized. A critical hidden cause of memoization failure is using inline fallback arrays like `prop || []`, which create a new referential array on every render, completely defeating `React.memo()`.
**Action:** Always extract static fallback arrays into an `EMPTY_ARRAY` constant outside the component and wrap heavy presentational chat components in `React.memo()`.
