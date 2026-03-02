---
inclusion: manual
---

# SSR DOM and Browser APIs – Topic Steering

## 1. Scope – When to Read This

### This file applies when you:
- Access browser globals (`window`, `document`, `localStorage`, `navigator`, `location`, or any other global browser API)
- Manipulate the DOM (styles, classes, attributes, element creation)
- Use browser-only APIs (e.g., `ResizeObserver`, `IntersectionObserver`, `WebWorker`, `MutationObserver`, `PerformanceObserver`)
- Measure element dimensions (`offsetHeight`, `clientWidth`, `scrollTop`)
- Initialize third-party libraries that assume browser context

### This file does NOT cover:
- Timer management (see `ssr-timer-management.md`)
- RxJS patterns (see `ssr-rxjs-patterns.md`)
- HTTP caching (see `.kiro/steering/topics/ssr/ssr-rxjs-and-http.md`)
- General SSR principles (see `.kiro/steering/topics/ssr/ssr-anti-patterns.md`)

**Rule:** If your code directly touches browser APIs or DOM, consult this file first.

---

## 2. Core Principles

- **P1 – Use Injection Tokens:** Never access `window`, `document`, or browser globals directly. Use `WINDOW`, `DOCUMENT` tokens or `ElementRef`.
- **P2 – Use Renderer2 for DOM:** All DOM manipulation must use `Renderer2`. Never use direct methods like `element.style.x`, `element.classList.add()`, or `element.setAttribute()`.
- **P3 – Guard Browser-Only code:** Use `afterNextRender()`, `PLATFORM.runOnBrowser()` for code that should only run on the server. Use server overrides for browser-only APIs like `ResizeObserver`, `IntersectionObserver`, `localStorage`, etc.
- **P4 – Dimensional Computations Return Zero:** Properties like `offsetHeight`, `clientWidth` return 0 on server. Prefer CSS solutions or guard with platform checks.

---

## 3. Do / Don't Guidelines

### Do
- Use `inject(WINDOW)` and `inject(DOCUMENT)` for browser API access
- Use `inject(ElementRef)` to access component's DOM node
- Use `Renderer2` for all DOM manipulation (styles, classes, attributes, creation)
- Use SSR-safe implementations: `RESIZE_OBSERVER`, `INTERSECTION_OBSERVER`, `ResizeObserverService`, `IntersectionObserverService`
- Use `afterNextRender()` for one-time browser initialization
- Use `PLATFORM.runOnBrowser()` to skip browser-only code on server
- Create `.provide.server.ts` files for services that otherwise would break the node server. E.g. a `NoopService` for tracking

### Don't
- Never access `window`, `document`, `localStorage`, `navigator`, or any global browser API directly from the global namespace
- Never use `element.style.x = 'value'`, `element.classList.add()`, `element.setAttribute()`
- Never use `document.querySelector()`, `document.createElement()` directly
- Be aware that dimensional computations (`clientHeight` etc. as well as `ResizeObserver` results) won't work on the server
- Never initialize browser-only libraries without safe wrappers (use `ResizeObserverService`, `IntersectionObserverService`, or injection tokens)

---

## 4. Standard Patterns

### Browser API Access
```typescript
import { DOCUMENT } from '@angular/common';
import { WINDOW } from '@frontend/vanilla/core';

private readonly window = inject(WINDOW);
private readonly document = inject(DOCUMENT);

getValue() {
  return this.window.localStorage.getItem('key');
}
```

### DOM Manipulation with Renderer2
```typescript
import { Renderer2, ElementRef, signal } from '@angular/core';

private readonly renderer = inject(Renderer2);
private readonly elementRef = inject(ElementRef);

// Prefer signal-based approach with host bindings
readonly isVisible = signal(false);

// In component decorator:
// host: {
//   '[class.visible]': 'isVisible()',
//   '[attr.aria-hidden]': '!isVisible()'
// }

// Only use Renderer2 when host bindings are not sufficient
// better prefer always to use `host` bindings or attribute bindings in the template via signals
// in case this is not an option, use the Renderer2
show() {
  this.renderer.setStyle(this.elementRef.nativeElement, 'display', 'block');
  this.renderer.addClass(this.elementRef.nativeElement, 'visible');
  this.renderer.setAttribute(this.elementRef.nativeElement, 'aria-hidden', 'false');
}

// Only use Renderer2 when template expressions not sufficient, otherwise prefer using signals and template syntax
createAndAppend() {
  const div = this.renderer.createElement('div');
  const text = this.renderer.createText('Hello');
  this.renderer.appendChild(div, text);
  this.renderer.appendChild(this.elementRef.nativeElement, div);
}
```

### SSR-Safe Browser APIs
```typescript
// Prefer using the service implementations
import { ResizeObserverService } from '@frontend/vanilla/ssr';
import { IntersectionObserverService } from '@frontend/vanilla/core';

private readonly resizeObserverService = inject(ResizeObserverService);
private readonly intersectionObserverService = inject(IntersectionObserverService);

ngOnInit() {
  this.resizeObserverService.observe(this.elementRef.nativeElement, entries => {
    console.log('Resized:', entries);
  });
}

// Alternative: Use injection tokens if service is not available
import { RESIZE_OBSERVER } from '@frontend/vanilla/ssr';
import { INTERSECTION_OBSERVER } from '@frontend/vanilla/core';

private readonly ResizeObserver = inject(RESIZE_OBSERVER);
private readonly resizeObserver = new (inject(RESIZE_OBSERVER))(entries => /* handle update */);
private readonly intersectionObserver = new (inject(INTERSECTION_OBSERVER))(entries => /* handle update */);

ngOnInit() {
  this.resizeObserver.observe(this.elementRef.nativeElement);
}
```

### Browser-Only Initialization
```typescript
import { afterNextRender } from '@angular/core';

constructor() {
  afterNextRender(() => {
    // Runs once, browser only
    this.initializeThirdPartyLibrary();
    this.measurePerformance();
  });
}
```

### Platform-Specific Execution
```typescript
// Prefer PLATFORM.isBrowser for platform checks
import { PLATFORM } from '@frontend/vanilla/ssr';

private readonly platform = inject(PLATFORM);

initialize() {
  // Either use conditions
    
  // Use isBrowser for conditional logic
  if (this.platform.isBrowser) {
    this.setupBrowserFeatures();
    this.startPolling();
  }
  
  // Or use functional style
  // Use runOnBrowser for callback-based execution
  this.platform.runOnBrowser(() => {
    this.setupBrowserFeatures();
  });
}
```

---

## 5. Implementation Checklist

- [ ] Does the code avoid direct `window`/`document` access from the global namespace?
- [ ] Are all DOM manipulations using `Renderer2` or signal-based host bindings?
- [ ] Are browser-only APIs using `ResizeObserverService`, `IntersectionObserverService`, or injection tokens?
- [ ] Are dimensional computations (`offsetHeight`, `clientWidth`) avoided or guarded with `PLATFORM.isBrowser`?
- [ ] Are third-party browser libraries guarded with `afterNextRender()` or `PLATFORM.isBrowser`?
- [ ] Are services requiring browser APIs providing `.provide.server.ts` overrides only when necessary?

---

## 6. Common Pitfalls & Anti-Patterns

**IMPORTANT:** The patterns below are ANTI-PATTERNS and should be AVOIDED. They represent incorrect approaches that will cause SSR failures.

- ❌ **Direct Browser API Access:** `window.localStorage` or `document.querySelector()` crashes on server with `ReferenceError: window is not defined`
- ❌ **Direct DOM Manipulation:** `element.style.color = 'red'` bypasses Angular's SSR abstraction and may cause hydration mismatches. Prefer signal-based host bindings or `Renderer2`.
- ❌ **Unguarded Browser APIs:** `new ResizeObserver()` crashes on server with `ReferenceError: ResizeObserver is not defined`. Use `ResizeObserverService` instead.
- ❌ **Relying on Dimensions:** `element.offsetHeight` returns 0 on server, causing incorrect calculations. These computations will not provide accurate values on the server.
- ❌ **Unnecessary Server Overrides:** Creating `.provide.server.ts` files when not needed adds complexity. Only create them when you need to alter behavior on the server.
- ❌ **Third-Party Library Initialization:** Initializing browser-only libraries in `ngOnInit()` crashes on server. Use `afterNextRender()` or `PLATFORM.isBrowser` guards.

---

## 7. Small Examples

```typescript
// ✅ Correct: SSR-safe localStorage access
import { WINDOW } from '@frontend/vanilla/core';
private readonly window = inject(WINDOW);
const value = this.window.localStorage.getItem('key');
```

```typescript
// ❌ Avoid: Direct browser API access
const value = window.localStorage.getItem('key'); // Crashes on server
```

```typescript
// ✅ Correct: Renderer2 for DOM manipulation
// ⚠️ Important: Use this only as absolute last resort, always prefer the official angular coding guidelines that make use of
// host bindings or template bindings via signals.
this.renderer.setStyle(this.elementRef.nativeElement, 'color', 'red');
this.renderer.addClass(this.elementRef.nativeElement, 'active');
```

```typescript
// ❌ Avoid: Direct DOM manipulation
this.elementRef.nativeElement.style.color = 'red'; // Bypasses SSR
this.elementRef.nativeElement.classList.add('active'); // Bypasses SSR
```

```typescript
// ✅ Correct: Use ResizeObserverService
import { ResizeObserverService } from '@frontend/vanilla/ssr';
private readonly resizeObserverService = inject(ResizeObserverService);
this.resizeObserverService.observe(element, entries => {});
```

```typescript
// ✅ Alternative: SSR-safe ResizeObserver with injection token
import { RESIZE_OBSERVER } from '@frontend/vanilla/ssr';
private readonly ResizeObserver = new (inject(RESIZE_OBSERVER))(entries => /* handle update */);
const observer = new this.ResizeObserver(entries => {});
```

```typescript
// ❌ Avoid: Direct ResizeObserver usage
const observer = new ResizeObserver(entries => {}); // Crashes on server
```

---

## 8. Escalation & Trade-offs

- If third-party libraries require browser APIs:
  - Prefer dynamic imports with `PLATFORM.isBrowser` over server overrides
  - Use `afterNextRender()` for one-time initialization
  - Note: Some third-party libraries have side effects on import or require initialization before DOM renders, making guards insufficient
- If dimensional computations are required:
  - Prefer CSS solutions (flexbox, grid) over JavaScript measurements
  - Understand that dimensional properties (e.g. `clientHeight`, `offsetHeight`, `ResizeObserverEntry`) return 0 on server and will not provide accurate values
- If whole services need to be skipped or altered on the server:
  - Create `.provide.server.ts` files when you need to alter behavior on the server
    - e.g. having a `NoopService` for something that is only needed on the browser
  - Avoid creating unnecessary server override files
  - Register overrides in `packages/vanilla/lib/core/src/vanilla-server-overrides.ts`

**Rule:** When SSR compatibility is unclear, favor server-safe patterns and guard browser-only code explicitly with `PLATFORM.isBrowser`.

---

## 9. Related Steering Files

- `.kiro/steering/topics/ssr/ssr-anti-patterns.md` – Comprehensive SSR best practices
- `.kiro/steering/topics/ssr/ssr-timers-and-async.md` – Timer and interval management
- `ssr-rxjs-patterns.md` – RxJS patterns for SSR
- `ssr-http-caching.md` – HTTP transfer cache
- `docs/ssr-development-guide/README.md` – Debugging and server overrides
- `packages/vanilla/lib/core/src/vanilla-server-overrides.ts` – Server override registry
