---
inclusion: manual
---

# SSR Platform and Execution Context

## Scope – When to Read This

### This file applies when you:
- Use `PLATFORM` token to conditionally execute browser or server code
- Use `afterNextRender()` or `afterRenderEffect()` for browser-only initialization
- Create server overrides (`.provide.server.ts` files) only when you need to alter behavior on the server (not for every browser API usage)
- Test platform-specific code paths in unit tests
- Need to detect if code is running in browser, server, or SSR-hydrated context

### This file does NOT cover:
- DOM manipulation (see `ssr-dom-and-browser-apis.md`)
- Timer management (see `ssr-timer-management.md`)
- HTTP caching (see `ssr-http-caching.md`)
- General SSR patterns (see `ssr-integration.md`)

---

## Core Principles

- **P1 – Use PLATFORM for Conditional Execution:** Use `PLATFORM.runOnBrowser()` and `PLATFORM.runOnServer()` to execute platform-specific code. Check `PLATFORM.isBrowser` or `PLATFORM.isServer` for conditional logic.
- **P2 – Use afterNextRender for Browser Initialization:** Use `afterNextRender()` for one-time browser-only setup (third-party libraries, performance measurement). Use `afterRenderEffect()` for reactive browser-only operations tied to signals.
- **P3 – Provide Server Overrides:** Create `.provide.server.ts` files for services requiring browser APIs. Register overrides in `vanilla-server-overrides.ts` or `app.config.server.ts`.
- **P4 – Test Both Platforms:** Mock `PLATFORM` token in tests to verify browser and server code paths execute correctly.

---

## Do / Don't Guidelines

### Do
- Use `PLATFORM.runOnBrowser()` to skip analytics, tracking, polling on server
- Use `PLATFORM.isBrowser` for conditional logic (e.g., feature initialization)
- Use `PLATFORM.runOnServer()` to run code specifically only in server environment
- Use `afterNextRender()` for one-time browser initialization (third-party libraries)
- Use `afterRenderEffect()` for reactive browser operations tied to signals
- Create `.provide.server.ts` files for browser-dependent services
- Mock `PLATFORM` in tests to verify both execution paths

### Don't
- Don't run long-running operations on server (blocks response)
- Don't initialize WebWorkers or browser-only libraries without platform guards
- Don't forget to test both browser and server code paths
- Don't use `@defer` with `hydrate` in CSR applications (breaks CSR)

---

## Standard Patterns

### Platform-Specific Execution
```typescript
import { PLATFORM } from '@frontend/vanilla/ssr';

private readonly platform = inject(PLATFORM);

initialize() {
  // ✅ Run only in browser
  this.platform.runOnBrowser(() => {
    this.initializeAnalytics();
    this.startPolling();
  });
  
  // ✅ Conditional logic
  if (this.platform.isBrowser) {
    this.setupBrowserFeatures();
  }
  
  // ✅ Run only on server
  this.platform.runOnServer(() => {
    this.logServerRequest();
  });
}
```

### Browser-Only Initialization
```typescript
import { afterNextRender } from '@angular/core';

constructor() {
  // ✅ Runs once after first render, browser only
  afterNextRender(() => {
    this.initializeThirdPartyLibrary();
    this.measurePerformance();
  });
}
```

### Reactive Browser Operations
```typescript
import { afterRenderEffect, signal } from '@angular/core';

private readonly someValue = signal(0);

constructor() {
  // ✅ Runs after every render when signal changes, browser only
  // Note: Use read/write phases for DOM operations to avoid layout thrashing
  afterRenderEffect((onCleanup) => {
    const value = this.someValue(); // Read phase
    this.updateSomeTracking(value);   // Write phase
  });
}
```

### Creating Server Overrides
```typescript
// my-service.provide.server.ts
export function provideMyServiceServerOverride(): Provider {
  return {
    provide: MyBrowserService,
    useValue: {
      method: () => void 0,
      asyncMethod: () => Promise.resolve(null)
    }
  };
}

// Register in vanilla-server-overrides.ts or app.config.server.ts
export function provideVanillaCoreServerOverride() {
  return [
    provideMyServiceServerOverride(),
    // ... other overrides
  ];
}
```

---

## Implementation Checklist

- [ ] Are analytics, tracking, and polling guarded with `PLATFORM.runOnBrowser()`?
  - analytics and tracking should be `Noop` on the server, instead of polluting the whole codebase with `PLATFORM` checks
- [ ] Are ssr incompatible browser libraries initialized only on the browser or have an override? 
- [ ] Do ssr incompatible (or useless) services have `.provide.server.ts` overrides?
- [ ] Are both browser and server code paths tested with mocked `PLATFORM`?
- [ ] Are reactive browser operations using `afterRenderEffect()` instead of `afterNextRender()`?

---

## Common Pitfalls & Anti-Patterns

- ❌ **Running analytics on server:** Blocks server response and wastes resources. Make sure tracking has a `Noop` override for the server, see `.kiro/steering/topics/ssr/ssr-server-overrides-and-shims.md` 
- ❌ **Initializing ssr incompatible libraries unguarded:** Crashes on server. Use `afterNextRender()` instead.
- ❌ **Missing server overrides:** Services using ssr incompatible APIs crash without `.provide.server.ts` files.
- ❌ **Not testing platform-specific paths:** Components with conditional execution need tests for both browser and server modes.

---

## Small Examples

```typescript
// ✅ Correct: Skip not needed code on server
this.platform.runOnBrowser(() => {
  this.pollingService.poll(() => /* some execution */ )
});
```

```typescript
// ❌ Wrong: Not needed code on server
this.pollingService.poll(() => /* some execution */ )
```

```typescript
// ✅ Correct: Browser-only library initialization
afterNextRender(() => {
  const lib = new ThirdPartyLibrary();
  lib.initialize();
});
```

```typescript
// ❌ Wrong: Library initialized on server
ngOnInit() {
  const lib = new ThirdPartyLibrary(); // Crashes on server
}
```

---

## Escalation & Trade-offs

- If third-party libraries require browser context:
  - Prefer `afterNextRender()` with dynamic imports over server overrides
  - **Warning:** Some third-party libraries have side effects on import or require initialization before DOM renders. In these cases, use platform guards (`PLATFORM.runOnBrowser()`) instead of dynamic imports
- If feature needs platform detection:
  - Use `PLATFORM.isBrowser` for simple checks, `runOnBrowser()` for side effects
- If service requires browser APIs:
  - Only create `.provide.server.ts` when you need to alter behavior on the server, not for every browser API usage
  - Prefer platform guards (`PLATFORM.runOnBrowser()`) for simple cases

**Rule:** When platform-specific behavior is needed, favor explicit guards (`PLATFORM`, `afterNextRender`) over implicit assumptions. Avoid creating unnecessary `.provide.server.ts` files.

---

## Related Steering Files

- `ssr-integration.md` – General SSR patterns and principles
- `ssr-dom-and-browser-apis.md` – Safe DOM access and browser API usage
- `.kiro/steering/topics/ssr/ssr-logging-and-testing.md` – Testing platform-specific code
- `.kiro/steering/topics/ssr/ssr-anti-patterns.md` – Comprehensive SSR best practices
- `.kiro/steering/topics/ssr/ssr-server-overrides-and-shims.md` – SSR Overrides best practices
- `docs/ssr-development-guide/README.md` – Debugging and server overrides
