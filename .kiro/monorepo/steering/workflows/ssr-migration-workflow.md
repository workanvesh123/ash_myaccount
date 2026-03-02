---
inclusion: manual
---

# SSR Migration Workflow

> Use this workflow when **fixing SSR compatibility issues** or **migrating browser-dependent code to SSR-safe patterns**.

---

## When to Use This

Use this workflow when:
- Fixing `ReferenceError: window is not defined` or similar server crashes
- Resolving SSR timeout errors or pending task issues
- Migrating components/services that access browser APIs (`window`, `document`, DOM)
- Implementing features that must work in both browser and server contexts

Do NOT use for:
- New feature development (use SSR patterns from the start via `.kiro/steering/topics/ssr/`)
- Performance optimization unrelated to SSR
- Design system migrations (use `design-system-migration-workflow.md`)

---

## Assistant Behavior

When this workflow is active, you MUST:

1. **Announce the phase** at the start of each major step (Identification → Analysis → Implementation → Validation).
2. **Confirm steering intake** by ticking items in the **Steering & Rules Intake** checklist before proposing changes.
3. **Follow scope strictly**: Only modify code within the user's specified scope. Ask before expanding.
4. **Work phase-by-phase**: Do not skip phases. Summarize → Execute → Update checklist.
5. **End with verification**: Show the **Success Criteria** section with ticked checkboxes. Explain any unsatisfied items.

---

## Goal

- Fix SSR compatibility issues using standard patterns from `.kiro/steering/topics/ssr/` topic files
- Preserve existing behavior in browser context while enabling server rendering
- Apply minimal, surgical changes to affected code only
- Ensure no SSR timeouts, crashes, or hydration mismatches

## Non-goal

- Large-scale refactors beyond SSR compatibility
- Fixing unrelated bugs or performance issues
- Changing component architecture or ownership

---

## Phases

### Phase 1 – Identification

**Goal:** Understand the SSR issue and locate affected code.

**Actions:**
- Identify the error type: `ReferenceError`, timeout, hydration mismatch, or pending task
- Locate the code accessing browser APIs or causing server issues
- Determine if the code needs server execution or can be browser-only

**Include steering:**
- `.kiro/steering/topics/ssr/ssr-anti-patterns.md` (common mistakes)

---

### Phase 2 – Analysis

**Goal:** Choose the correct SSR-safe pattern for the issue.

**Decision tree:**
- **Browser API access** (`window`, `document`, `localStorage`) → Use injection tokens or `afterNextRender()`
- **DOM manipulation** → Use `Renderer2` abstraction
- **Timers** (`setTimeout`, `setInterval`) → Use `TimerService` with cleanup
- **RxJS operators** → Replace `first()` with `take(1)`, add `transferCache: true` to HTTP
- **Browser-only code** → Guard with `afterNextRender()` or `PLATFORM.runOnBrowser()`
- **Third-party library** → Create `.provide.server.ts` override

**Include steering:**
- `.kiro/steering/topics/ssr/ssr-dom-and-browser-apis.md` (for browser API issues)
- `.kiro/steering/topics/ssr/ssr-timers-and-async.md` (for timer issues)
- `.kiro/steering/topics/ssr/ssr-rxjs-and-http.md` (for RxJS/HTTP issues)
- `.kiro/steering/topics/ssr/ssr-platform-and-execution-context.md` (for conditional execution)
- `.kiro/steering/topics/ssr/ssr-server-overrides-and-shims.md` (for third-party libraries)

---

### Phase 3 – Implementation

**Goal:** Apply SSR-safe patterns with minimal code changes.

**Rules:**
- Use `inject(WINDOW)` or `inject(DOCUMENT)` instead of direct globals
- Use `Renderer2` for all DOM manipulation
- Use `TimerService` from `@frontend/vanilla/core` with `DestroyRef.onDestroy()` cleanup
- Replace `first()` with `take(1)` in RxJS chains
- Add `transferCache: true` to HTTP requests
- Guard browser-only code with `afterNextRender()` or `PLATFORM.runOnBrowser()`
- Create `.provide.server.ts` files for services that cannot run on server

**Include steering:**
- All topic files from Phase 2 (based on issue type)
- `.kiro/steering/topics/angular-performance/zone-js-and-async-operations.md` (for timer/zone.js patterns)

---

### Phase 4 – Validation

**Goal:** Verify SSR compatibility and no regressions.

**Actions:**
- Run `nx serve-ssr {product}` to test server rendering locally
- Check for `ReferenceError`, timeout errors, or hydration warnings in console
- Verify browser behavior is unchanged
- Run unit tests if available

**Include steering:**
- `.kiro/steering/topics/ssr/ssr-logging-and-testing.md` (testing patterns)
- `.kiro/steering/topics/ssr/ssr-setup-and-config.md` (local SSR setup)

---

## Success Criteria

### Steering & Rules Intake
- [ ] Read `.kiro/steering/topics/ssr/ssr-anti-patterns.md` (common mistakes)
- [ ] Read issue-specific topic file(s) from Phase 2
- [ ] Read `.kiro/steering/topics/angular-performance/zone-js-and-async-operations.md` (if timer/zone.js changes)

### Execution
- [ ] Followed phases in order (Identification → Analysis → Implementation → Validation)
- [ ] Applied standard SSR patterns from steering files (no custom solutions)
- [ ] Made minimal changes within agreed scope
- [ ] Preserved existing browser behavior

### Validation
- [ ] Tested with `nx serve-ssr host-app` (no crashes/timeouts)
- [ ] Verified no hydration mismatches in browser console
- [ ] Confirmed browser behavior unchanged
- [ ] No dead code, TODOs, or commented blocks left behind

**Output:** SSR-compatible code using standard patterns, validated in both server and browser contexts.
