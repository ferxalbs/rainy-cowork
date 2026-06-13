## 2024-05-24 - React.memo Optimization in Streaming Chat

**Learning:** When attempting to optimize complex list item components like `MessageBubble` that receive rapid prop updates (like token streaming), `React.memo` on child components is completely defeated if inline fallbacks (e.g. `prop || []`) or inline arrow functions are passed as props. This causes continuous re-rendering of entire sub-trees (`TraceAccordion`, `SupervisorRail`, etc) even if their logical contents haven't changed.
**Action:** Always extract fallback arrays/objects to stable global constants (e.g., `const EMPTY_TRACE: any[] = []`) outside the render function. Wrap event handlers passed to heavy child components in `React.useCallback`. Finally, wrap the heavy child components in `React.memo()`.
