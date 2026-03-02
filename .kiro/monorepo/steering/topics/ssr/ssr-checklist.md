---
inclusion: manual
---

# SSR Compatibility Checklist

> Use this checklist when writing or reviewing code that will run in SSR context. Verify all items before committing code that touches browser APIs, DOM, timers, or async operations.

## Browser API Access

- [ ] No direct `window` or `document` access (use `inject(WINDOW)`, `inject(DOCUMENT)`)
- [ ] For `localStorage`, `sessionStorage`, `navigator` - use the provided server overrides, e.g. `inject(WINDOW).localStorage`
- [ ] No `location` access without `inject(WINDOW)` or `PLATFORM.runOnBrowser()`
- [ ] All browser-only APIs guarded with `afterNextRender()` or `PLATFORM.runOnBrowser()`
- [ ] Server overrides provided for browser-dependent services (`.provide.server.ts`)

## DOM Manipulation

- [ ] All DOM manipulation uses `Renderer2` (no `element.style.x`, `element.classList.add()`)
- [ ] `ElementRef` accessed only in browser context or with null checks
- [ ] No direct `querySelector`, `getElementById` (use `Renderer2.selectRootElement()`)
- [ ] `ResizeObserver`, `IntersectionObserver` use SSR-safe wrappers from vanilla/core
- [ ] `afterRenderEffect()` used for batched DOM read/write operations

## Timers & Async Operations

- [ ] `TimerService` used instead of raw `setTimeout`/`setInterval`
- [ ] All timers cleaned up in `DestroyRef.onDestroy()`
- [ ] All long-running timers (>100ms) skipped on server with `PLATFORM.runOnBrowser()`
- [ ] No infinite loops or polling on server (guarded with `PLATFORM.runOnBrowser()`)
- [ ] Analytics, tracking, and monitoring skipped on server

## RxJS & HTTP

- [ ] `take(1)` used instead of `first()` to prevent `EmptyErrorImpl`
- [ ] Platform-specific side effects use `tapIfBrowser()`/`tapIfServer()`
- [ ] Subscriptions cleaned up with `takeUntilDestroyed()`
- [ ] Observables that don't complete naturally use `take(1)` or timeout on server

## Component Lifecycle

- [ ] Browser-only initialization in `afterNextRender()`, not `ngOnInit()`
- [ ] No `window` access in constructor or `ngOnInit()`
- [ ] Cleanup logic in `DestroyRef.onDestroy()` for timers, subscriptions, observers
- [ ] Server-safe default values for browser-dependent state

## Third-Party Libraries

- [ ] Browser-only libraries imported dynamically in `afterNextRender()`
- [ ] No global side effects from library imports (e.g., `window.MyLib = ...`)
- [ ] Server shims provided only when absolutely necessary for critical libraries
- [ ] Chart libraries, maps, video players guarded with platform checks

## Testing & Debugging

- [ ] Code tested with both `PLATFORM_BROWSER_ID` and `PLATFORM_SERVER_ID`
- [ ] No `ReferenceError: window is not defined` in server logs
- [ ] No SSR timeout errors (check pending tasks with Node Inspector)
- [ ] Server logs use `REQUEST_LOGGER` token (null in browser)
- [ ] Platform-specific code paths covered by unit tests

## Performance & Optimization

- [ ] No unnecessary work on server (skip animations, tracking, polling)
- [ ] Server response time < 500ms (no blocking operations)
- [ ] No memory leaks from uncleaned timers or subscriptions
- [ ] Critical rendering path optimized (minimal server-side work)

For detailed rules and examples, refer to:
- `.kiro/steering/topics/ssr/ssr-anti-patterns.md` - Common mistakes and fixes
- `.kiro/steering/topics/ssr/ssr-dom-and-browser-apis.md` - Safe DOM access patterns
- `.kiro/steering/topics/ssr/ssr-timers-and-async.md` - Timer management
- `.kiro/steering/topics/ssr/ssr-rxjs-and-http.md` - Observable patterns
- `.kiro/steering/topics/ssr/ssr-platform-and-execution-context.md` - Platform checks