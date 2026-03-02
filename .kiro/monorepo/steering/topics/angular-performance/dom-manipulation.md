---
inclusion: manual
---

# DOM Manipulation – Topic Steering

## 1. Scope – When to Read This

### This file applies when you:
- Directly manipulate DOM elements (reading/writing properties, styles, classes, attributes)
- Implement animations, transitions, or layout calculations
- Use browser APIs like `ResizeObserver`, `IntersectionObserver`, or `MutationObserver`
- Optimize rendering performance or prevent forced reflows
- Work with dynamic content that requires DOM measurements

### This file does NOT cover:
- Template syntax and data binding (see `template-optimization.md`)
- Change detection strategies (see `change-detection-and-reactivity.md`)
- SSR platform checks (see `ssr-dom-and-browser-apis.md`)
- CSS animations (see `css-animations.md`)

**Rule:** If you're manually adjusting styles on any HTMLElement / DOM Node, e.g. `nativeElement`, reading layout properties, or writing styles/classes programmatically, consult this file.

---

## 2. Core Principles

### Before You Start: Do You Really Need Manual DOM Manipulation?

**Ask yourself first:** Can this be achieved with Angular template bindings, CSS, or declarative patterns instead?

- Use `[style.property]`, `[class.name]`, `[attr.name]` bindings in templates
- Use CSS for animations, transitions, and responsive layouts (flexbox, grid, container queries)
- Use Angular directives (`*ngIf`, `*ngFor`, `[ngClass]`, `[ngStyle]`) for dynamic content
- Use signals and computed values to drive template updates reactively

**Only proceed with manual DOM manipulation if the above approaches cannot solve your problem.**

---

### When Manual DOM Manipulation Is Necessary

- **P0 – Avoid manual DOM manipulation & reading at all cost:** Prefer template bindings & CSS whenever possible (see above).
- **P1 – Always use Renderer2:** Never use direct element methods (`element.style.x`, `element.classList.add()`, `element.setAttribute()`). SSR requires abstraction and Renderer2 ensures platform compatibility.
- **P2 – Prevent forced reflows:** Always batch DOM reads before DOM writes. Reading layout properties after writes causes expensive synchronous layout recalculations.
- **P3 – Use observers over polling:** Prefer `ResizeObserver`, `IntersectionObserver`, and `MutationObserver` over manual DOM reads or intervals. They're more efficient and don't block the main thread.
- **P4 – Batch with render hooks:** Use `afterNextRender()` or `afterRenderEffect()` to batch DOM operations in proper read/write phases.

---

## 3. Do / Don't Guidelines

### Do
- **First, try template bindings and CSS** before reaching for manual DOM manipulation
- Use `[style.property]`, `[class.name]`, `[ngClass]`, `[ngStyle]` in templates for dynamic styling
- Use CSS for animations, transitions, and layout (flexbox, grid, container queries)
- Use `Renderer2` for all DOM manipulation when manual manipulation is truly necessary
- Use `afterRenderEffect()` with separate `read` and `write` phases to batch DOM operations
- Use `ResizeObserverService` from `@frontend/vanilla/core` for element size changes
- Use `IntersectionObserverService` from `@frontend/vanilla/core` for viewport visibility
- Clean up observers in `DestroyRef.onDestroy()`

### Don't
- Never use manual DOM manipulation when template bindings or CSS can achieve the same result
- Never use `element.style.property = value` or `element.setAttribute()` directly
- Never mix DOM reads and writes (causes forced reflows)
- Never read layout properties (`offsetHeight`, `clientWidth`, `scrollTop`) without batching
- Never poll DOM properties with intervals—use observers instead
- Never manipulate DOM in constructor or `ngOnInit`—use render hooks

---

## 4. Standard Patterns

### DOM Manipulation in template or host bindings

Always inject `Renderer2` and use its methods for platform-safe DOM operations.

**⚠️ Important:** Try to avoid the usage of direct DOM manipulation whenever possible. Better use template bindings, host bindings or
template expressions to adjust styles, manipulate attributes or add DOM Nodes.

```typescript
@Component({
    host: {
        '[class]': 'someClass()',
        '[class.empty]': 'empty()',
        '[attr.some-attribute]': 'empty()',
    },
    template: `
        @if (empty()) {
            <div [class]="someClass()">Placeholder</div>
        }
    `
})
export class SomeComponent {
    someClass = signal('my-class');
    empty = signal(true);
}
```

### Batched Read/Write with afterRenderEffect
Use `afterRenderEffect` with `write` phase for DOM updates. Avoid reading layout properties that cause forced reflows:

**⚠️ Important:** Try to avoid the usage of direct DOM manipulation whenever possible. Better use template bindings, host bindings or
template expressions to adjust styles, manipulate attributes or add DOM Nodes.


```typescript
private isExpanded = signal(false);

constructor() {
  // ✅ Good: DOM writes are done in the correct phase
  afterRenderEffect({
    write: () => {
      const expanded = this.isExpanded();
      this.renderer.setStyle(
        this.elementRef.nativeElement,
        'maxHeight',
        expanded ? '500px' : '0'
      );
      this.renderer.setStyle(
        this.elementRef.nativeElement,
        'opacity',
        expanded ? '1' : '0'
      );
    }
  });
}
```

### Use and extend existing services for recurring DOM queries

There are existing services like the `DeviceService` that store information about global APIs and reveal them as signals.
Use them instead of directly querying the DOM.

The APIs currently exposed:
* `scrollTop` of the current scrolling element (window)
* `visualViewport`
* `visualViewportWidth`
* `visualViewportHeight`
* `bodyRect` (width, height of body)
* `windowRect` (width, height of window)
* `orientationSignal` (orientation of device)

In case there is the need to extend this service with more related APIs, please extend the service instead of polluting components or directives.

```ts
import { DeviceService } from '@frontend/vanilla/core';

private deviceService = inject(DeviceService);

scrollToTop() {
    // ✅ use deviceService.scrollTop() instead of directly querying DOM (`window.scrollTop`)
    const currentScroll = this.deviceService.scrollTop();
    // do something
}

```

**Important:** Avoid reading layout properties (`offsetHeight`, `clientWidth`, `scrollTop`) as they cause forced reflows. Use `ResizeObserver` or `IntersectionObserver` instead for dimensional information.

### Using ResizeObserver
**First, ask yourself:** Can this be solved with CSS alone (e.g., `container-queries`, `aspect-ratio`, flexbox, grid)? Only use observers if CSS cannot achieve the desired behavior.

Use `ResizeObserverService` instead of reading any dimensional information, e.g. `clientHeight`/`clientWidth`:

```typescript
private readonly resizeObserver = inject(ResizeObserverService);

width = toSignal(this.resizeObserver.observe(this.elementRef.nativeElement).pipe(
    map(entry => entry.contentRect.width)
));

```

---

## 5. Implementation Checklist

- [ ] Are you avoiding using direct DOM Manipulation? In case there is no escape, are u using  `Renderer2` for all DOM manipulation (no direct element methods)?
- [ ] Have you separated DOM reads and writes into distinct phases?
- [ ] Are u using `DeviceService` for global DOM queries instead of querying them directly?
- [ ] Are you using `afterRenderEffect()` or `afterNextRender()` for DOM operations?
- [ ] Are you using observers (`ResizeObserver`, `IntersectionObserver`) instead of polling?
- [ ] Have you cleaned up all observers in `DestroyRef.onDestroy()`?
- [ ] Does your code work correctly in SSR (no `window`/`document` access)?

---

## 6. Common Pitfalls & Anti-Patterns

- ❌ **Direct element manipulation:** Using `element.style.width = '100px'` breaks SSR and bypasses Angular's platform abstraction.
- ❌ **Reading layout properties:** Accessing `offsetHeight`, `clientWidth`, `scrollTop`, `getBoundingClientRect()` causes forced reflows—use `ResizeObserver` or `IntersectionObserver` instead.
- ❌ **Mixed read/write phases:** Reading layout properties after setting styles causes forced reflow—avoid layout reads entirely or batch all reads before writes.
- ❌ **Polling layout properties:** Using `setInterval` to check `scrollTop` is inefficient—use `IntersectionObserver` or scroll events instead.
- ❌ **DOM operations in constructor/ngOnInit:** Elements may not be rendered yet—use `afterNextRender()` or `afterRenderEffect()`.
- ❌ **Forgetting cleanup:** Not unsubscribing from observers causes memory leaks—always use `takeUntilDestroyed()` or manual cleanup.

---

## 7. Small Examples

```typescript
// ✅ Correct: Write-only DOM updates with Renderer2
afterRenderEffect({
  write: () => {
    this.renderer.setStyle(this.elementRef.nativeElement, 'opacity', '1');
    this.renderer.addClass(this.elementRef.nativeElement, 'visible');
  }
});

// ❌ Wrong: Reading layout properties causes forced reflow
const height = element.offsetHeight; // Forces layout calculation
element.style.width = '100px'; // Write
const width = element.offsetWidth; // Forces another layout calculation!
```

```typescript
// ✅ Correct: Using ResizeObserver
this.resizeObserver.observe(element)
  .pipe(takeUntilDestroyed())
  .subscribe(entry => this.width.set(entry.contentRect.width));

// ❌ Wrong: Polling with interval
setInterval(() => {
  this.width.set(element.clientWidth); // Causes layout thrashing
}, 100);
```

---

## 8. Escalation & Trade-offs

- If DOM manipulation conflicts with SSR compatibility, always favor SSR—use `Renderer2` and platform checks.
- If performance conflicts with readability, prefer batched operations with clear read/write phases over inline manipulation.

**Rule:** When trade-offs are unclear, favor SSR compatibility and performance over convenience. Document any deviations with comments.

---

## 9. Related Steering Files

- `.kiro/steering/topics/ssr/ssr-dom-and-browser-apis.md` – SSR-safe DOM access
- `.kiro/steering/topics/angular-performance/zone-js-and-async-operations.md` – Timer management
- `.kiro/steering/topics/angular-performance/css-and-animations.md` – Animation performance

**Services:**
- `ResizeObserverService`: `packages/vanilla/lib/core/src/browser/resize-observer.service.ts`
- `IntersectionObserverService`: `packages/sports/libs/common/core/utils/dom/src/lib/intersection-observer.service.ts`
