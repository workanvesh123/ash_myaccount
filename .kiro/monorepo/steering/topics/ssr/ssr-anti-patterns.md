---
inclusion: manual
---

# SSR Anti-Patterns

## Scope – When to Read This

### This file applies when you:
- Access browser APIs (`window`, `document`, `localStorage`, `navigator`)
- Manipulate the DOM directly
- Use timers (`setTimeout`, `setInterval`) or intervals
- Work with third-party libraries that assume browser context
- Handle async operations or network requests that may run on server
- Debug "ReferenceError" or "request failed due to critical error" SSR issues

### This file does NOT cover:
- HTTP caching strategies (see `.kiro/steering/topics/ssr/ssr-rxjs-and-http.md`)
- General Angular performance (see `.kiro/steering/topics/angular-performance/`)
- Component architecture or routing

**Rule:** If code touches browser APIs or runs during SSR, consult this file first.

---

## Core Principles

- **P1 – Never Access Browser Globals Directly:** `window`, `document`, `navigator`, `location` don't exist on server. Always use injection tokens (`WINDOW`, `DOCUMENT`) or platform checks.
- **P2 – Use Angular Abstractions for DOM:** Always use `Renderer2` for DOM manipulation, never direct element methods. Server rendering requires abstraction layers.
- **P3 – Guard Browser-Only Code:** Use `afterNextRender()`, `PLATFORM.runOnBrowser()`, or `PLATFORM.isBrowser` checks to prevent server execution of browser-only logic.
- **P4 – Never Run Intervals on Server:** Intervals block server rendering indefinitely. Always skip intervals on server using `{ serverMode: 'omit' }` parameter.
- **P5 – Clean Up Timers and Subscriptions:** Always cancel timers using `DestroyRef.onDestroy()` to prevent server thread blocking.
- **P6 – Never run intervals on server:** Don't run `setInterval` or similar `rxjs` operators like `auditTime` etc. on the server. Use the TimerService whenever possible and pass `{ serverMode: 'omit' }` to skip intervals on server. 

---

## Do / Don't Guidelines

### Do
- Use `inject(WINDOW)` and `inject(DOCUMENT)` for browser API access
- Use `Renderer2` for all DOM manipulation (styles, classes, attributes, element creation)
- Use `TimerService` from `@frontend/vanilla/core` instead of raw `setTimeout`/`setInterval`
- Use `take(1)` instead of `first()` in RxJS streams (prevents EmptyError on server)
- Use `afterNextRender()` for one-time browser initialization
- Use `PLATFORM.runOnBrowser()` to skip non-critical operations on server
- Create `.provide.server.ts` overrides for services that have behavior harming the SSR rendering (long running timers, tracking, browser API usages)
- Use `tapIfBrowser()` and `tapIfServer()` for platform-specific RxJS side effects

### Don't
- Never access `window`, `document`, `localStorage`, `navigator`, `ResizeObserver`, `IntersectionObserver`, `MutationObserver` directly
- Never use `element.style.property = value`, `element.classList.add()`, or `element.setAttribute()`
- Never use raw `setTimeout`/`setInterval` without `TimerService`
- Never use `first()` operator in SSR contexts (throws EmptyError if no emission)
- Never run analytics, tracking, or polling on server
- Never use `@defer` with `hydrate` in CSR applications (breaks CSR)
- Never import browser-only libraries at module level (lazy load with dynamic imports)
- Never forget to clean up timers/subscriptions in `DestroyRef.onDestroy()`

---

## Common Pitfalls & Anti-Patterns

- ❌ **Direct Browser API Access**
  - Causes `ReferenceError: window is not defined` on server. Always use injection tokens (`WINDOW`, `DOCUMENT`) or `PLATFORM.isBrowser` checks.

- ❌ **Direct DOM Manipulation**
  - Using `element.style.display = 'block'` bypasses Angular's abstraction. Use `Renderer2.setStyle()`.

- ❌ **Uncleaned Timers**
  - `setTimeout` without cleanup causes "request failed due to critical error" by blocking server thread. Always clear in `DestroyRef.onDestroy()`.

- ❌ **Running Intervals on Server**
  - `setInterval` blocks server rendering indefinitely. Never run intervals on server - always use `{ serverMode: 'omit' }` parameter to skip on server.

- ❌ **Using first() Instead of take(1)**
  - `first()` throws `EmptyErrorImpl` if observable completes without emission. Use `take(1)`.

- ❌ **Browser-Only Libraries at Module Level**
  - Importing libraries that assume browser context crashes server. Guard with `PLATFORM.runOnBrowser()` and dynamic imports.

- ❌ **Dimensional Computations on Server**
  - `offsetHeight`, `clientWidth` return 0 on server. Prefer CSS solutions or guard with `PLATFORM.isBrowser` checks.

---

## Standard Patterns

### DOM Access
```typescript
// ✅ Use injection tokens
private readonly window = inject(WINDOW);
private readonly document = inject(DOCUMENT);

// ✅ Use Renderer2 for manipulation
this.renderer.setStyle(el, 'display', 'block');
this.renderer.addClass(el, 'active');
```

### Browser-Only Execution
```typescript
// ✅ One-time browser init
afterNextRender(() => this.initThirdPartyLib());

// ✅ Conditional execution (prefer PLATFORM.isBrowser or PLATFORM.runOnBrowser)
if (this.platform.isBrowser) {
  this.startAnalytics();
}

// ✅ Or use runOnBrowser helper
this.platform.runOnBrowser(() => this.startAnalytics());
```

### Timer Management
```typescript
// ✅ Use TimerService with cleanup (only use ngZone.run if change detection is needed)
private timeoutId = this.timerService.setTimeoutOutsideAngularZone(() => {
  this.update();
}, 1000);

constructor() {
  this.destroyRef.onDestroy(() => {
    this.timerService.clearTimeout(this.timeoutId);
  });
}
```

### RxJS Streams
```typescript
// ✅ Use take(1) not first()
this.data$.pipe(take(1)).subscribe(data => this.process(data));

// ✅ Platform-specific side effects
this.events$.pipe(
  tapIfBrowser(e => this.trackAnalytics(e)),
  tapIfServer(e => this.logger?.info?.(e))
).subscribe();
```

---

## Implementation Checklist

- [ ] Does code access `window`, `document`, or browser APIs? Use injection tokens (`WINDOW`, `DOCUMENT`) or `PLATFORM.isBrowser` checks.
- [ ] Does code manipulate DOM? Use `Renderer2`, never direct element methods.
- [ ] Does code use timers? Use `TimerService` and clean up in `DestroyRef.onDestroy()`.
- [ ] Does code use intervals? Always skip on server with `{ serverMode: 'omit' }` from the TimerService parameter - intervals block server rendering.
- [ ] Does code use `first()` operator? Replace with `take(1)`.
- [ ] Does code import browser-only libraries? Guard with `PLATFORM.runOnBrowser()` and dynamic imports.
- [ ] Does code use dimensional properties (`offsetHeight`)? Prefer CSS or guard with `PLATFORM.isBrowser` checks.

---

## Related Steering Files

- `.kiro/steering/topics/ssr/` – Comprehensive SSR best practices
- `.kiro/steering/topics/angular-performance/zone-js-and-async-operations.md` – Timer management and change detection
- `docs/ssr-development-guide/README.md` – Full SSR development guide with debugging
