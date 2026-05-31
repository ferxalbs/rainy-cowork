
## 2024-05-31 - Memoize React Chat Stream sub-components

**Learning:** When using React.memo on a container component handling highly volatile streams (like `MessageBubble`), passing default array inline (`|| []`) defeats `React.memo` by generating a new referential array whenever the evaluated string is missing. Also, callback functions should be wrapped using `React.useCallback`.

**Action:** Extracted fallback elements like empty arrays outside of components as `EMPTY_ARRAY` constants, memoized all internal callback methods, and wrapped UI rendering components (`SupervisorRail`, `ExternalSessionRail`, `TraceAccordion`, `PlanCard`, etc.) in `React.memo`.
