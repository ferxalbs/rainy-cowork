# prioritize-the-modularization.md

Purpose
- Enforce mandatory modularization of code and content: modularization is required, not optional. Every new feature, component, or content chunk must be packaged as a cohesive, testable module with a defined public interface.

Scope
- Applies to all new and refactored code, configuration, and content within the repository. Existing legacy code must be scheduled for migration.

Rules (must follow)
1. Single Responsibility: Each module must implement one clear responsibility. If a change affects more than one concept, split into multiple modules.
2. High cohesion, low coupling: Internals should be tightly related; dependencies between modules must be minimal and explicit.
3. Explicit interfaces: Export only what consumers need. Prefer small, well-documented APIs over large surface areas.
4. No circular dependencies: Design dependency graph to be acyclic. CI must fail on detected cycles.
5. Size and complexity limits: Aim for modules that can be reviewed in one pass. Prefer < 400 lines of code or equivalent content; if exceeded, evaluate splitting.
6. Dependency injection and inversion: Depend on abstractions where appropriate to decouple implementation details.
7. Tests at boundaries: Every module must have unit/integration tests covering its public interface and failure modes.
8. Documentation: Each module must include a short README describing responsibility, public interface, examples, and migration notes.
9. Versioning and stability: Treat module interfaces as versioned; any breaking change requires explicit version increment and migration guide.
10. Automation and enforcement: Static analysis, linter rules, and CI checks must validate modularization rules (exports, cycles, test presence, doc presence).

Acceptance criteria (for PRs)
- Every added/changed feature is implemented in one or more modules respecting the rules above.
- Module README present and linked from top-level docs.
- Automated checks (lint, dependency graph, test coverage threshold for changed modules) pass.
- No new circular dependencies introduced.
- Reviewer checklist items (responsibility, interface, tests, docs) are completed in PR description.

Reviewer responsibilities
- Verify single responsibility and cohesion.
- Confirm interface minimality and documentation.
- Ensure tests cover public surface.
- Request splits or refactors when module exceeds complexity limits.

Examples (brief)
- GOOD: A "user-auth" module that exposes authenticate(), authorize(), and has its own tests and README.
- BAD: A "utils" module accumulating unrelated helpers across domains.

Enforcement actions
- CI reject on cycles or missing tests/docs.
- PR feedback requiring refactor before merge.
- Periodic audits to identify monoliths and schedule decomposition.

Change process
- Propose module boundaries in design notes for major features.
- When breaking interfaces, create a migration plan and deprecation timeline.

Contact
- Direct questions about boundaries or review disputes to the architecture owner specified in the repo governance.

