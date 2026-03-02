---
inclusion: manual
---

# Performance Optimization – Workflow Hub

> Use when optimizing Angular performance: change detection, templates, images, async operations, DOM manipulation, or Core Web Vitals.

---

## When to Use This

**Use for:**
- Component rendering optimization (OnPush, signals)
- Template performance (@for track, bindings)
- Image loading and LCP optimization
- Timer/subscription cleanup issues
- DOM manipulation or layout thrashing
- Animation performance
- Core Web Vitals improvements (LCP, INP, CLS)

**Do NOT use for:**
- SSR-specific issues (use `ssr-migration-workflow.md`)
- Design System migrations (use `design-system-migration-workflow.md`)
- Backend API or build-time optimization

---

## Assistant Behavior

1. **Announce phase** at start of each reply (Identification → Selection → Replacement → Verification)
2. **Confirm steering intake** by ticking checklist items before making changes
3. **Follow scope strictly** - only change what user specified
4. **Work phase-by-phase** - don't skip phases
5. **End with verification** - show completed Success Criteria checklist

---

## Phases

### Phase 1 – Pattern Identification

**Goal:** Identify anti-patterns and code that needs replacement

**Steering:** `.kiro/steering/topics/angular-performance/` topic files, `performace-checklist.md`, `{product}-context.md`

**Actions:** Scan for change detection anti-patterns, template issues (getters, missing track), direct DOM access, raw setTimeout/setInterval, missing subscription cleanup, layout-triggering animations

### Phase 2 – Pattern Selection

**Goal:** Map anti-patterns to correct replacements from steering

**Steering:** Read relevant topic files:
- `change-detection-and-reactivity.md` (OnPush, signals)
- `template-optimization.md` (@for track, bindings)
- `image-optimization.md` (NgOptimizedImage)
- `zone-js-and-async-operations.md` (TimerService)
- `dom-manipulation.md` (Renderer2)
- `css-and-animations.md` (compositor)
- `event-listeners-and-subscriptions.md` (cleanup)

**Actions:** Map each anti-pattern to correct pattern, plan replacement order, confirm scope

### Phase 3 – Code Replacement

**Goal:** Replace anti-patterns with correct patterns, preserve functionality

**Steering:** All relevant Phase 2 topics + `.kiro/steering/topics/ssr/` topic files (if SSR affected)

**Replacements:**
- **Change Detection:** Add OnPush, convert observables to signals, replace `| async` with `toSignal()`
- **Templates:** Add `track` to @for, replace `[ngClass]`/`[ngStyle]` with direct bindings, eliminate getters/methods
- **Images:** Replace `<img>` with `<img ngSrc>`, add width/height/sizes/priority
- **Async:** Replace `setTimeout`/`setInterval` with `TimerService`, add `takeUntilDestroyed()`
- **DOM:** Replace `element.style.x` with `Renderer2.setStyle()`, replace `element.classList` with `Renderer2.addClass()`
- **Animations:** Replace width/height/top/left animations with transform/opacity
- **Subscriptions:** Add `takeUntilDestroyed()`, add `{ passive: true }` to scroll/touch listeners

### Phase 4 – Verification

**Goal:** Verify replacements are correct, ensure no regressions

**Steering:** `performace-checklist.md`, `.kiro/steering/topics/ssr/` topic files (if applicable)

**Actions:** Run tests, verify type checks pass, confirm SSR compatibility (if applicable), verify functionality preserved

---

## Success Criteria

### 1. Context & Scope
- [ ] Confirmed user goal and scope
- [ ] Only changing what's in scope
- [ ] Matches "When to Use This" section

### 2. Steering Intake
- [ ] Read: `01-project-context.md`, `04-monorepo-and-packages.md`
- [ ] Read: `performace-checklist.md`
- [ ] Read relevant performance topics from `.kiro/steering/topics/angular-performance/` based on issues identified
- [ ] Read: `packages/{product}/{product}-context.md` and library context
- [ ] Read: `.kiro/steering/topics/ssr/` topic files (if SSR affected)

### 3. Execution
- [ ] Followed phases: Identification → Selection → Replacement → Verification
- [ ] Identified anti-patterns before replacing
- [ ] Replaced with correct patterns from steering (OnPush, signals, track, NgOptimizedImage, TimerService, Renderer2, takeUntilDestroyed, transform/opacity)
- [ ] Kept changes minimal and focused
- [ ] Preserved functionality
- [ ] Called out trade-offs

### 4. Validation
- [ ] Tests pass, linting clean
- [ ] Type checks pass
- [ ] SSR compatible (if applicable)
- [ ] Functionality preserved
- [ ] No dead code or regressions
- [ ] All anti-patterns replaced with correct patterns

**Output:** Code replacements aligned with Angular performance best practices from steering files, validated through testing.
