---
inclusion: manual
---

# Angular Performance Checklist

> Use this checklist when creating or optimizing Angular components, templates, services, or routes to ensure performance best practices are followed.

## Change Detection & Reactivity

- [ ] Component uses `ChangeDetectionStrategy.OnPush`
- [ ] Reactive state uses `signal()`, derived values use `computed()`
- [ ] Observables converted to signals with `toSignal()` (no `async` pipe)
- [ ] No template getters or method calls (use `computed()` instead)
- [ ] Side effects use `effect()` with proper cleanup
- [ ] No manual `ChangeDetectorRef.detectChanges()` or `markForCheck()` calls

## Template Optimization

- [ ] Every `@for` loop has unique `track` expression (not index or reference)
- [ ] Direct class/style bindings used (`[class.x]`, `[style.x]`) instead of `ngClass`/`ngStyle`
- [ ] Template expressions are simple and side-effect-free
- [ ] Signals called with `()` in templates: `{{ count() }}`
- [ ] Conditional rendering uses `@if`/`@else` or `@switch` appropriately

## Image Optimization

- [ ] All `<img>` tags use `NgOptimizedImage` directive with `ngSrc`
- [ ] Explicit `width` and `height` attributes defined (matching aspect ratio) or `fill` is used on an image within a `position: relative` container
- [ ] `sizes` attribute specified based on viewport usage
- [ ] `ngSrcset` provided with multiple resolution variants
- [ ] `priority="true"` set only for LCP image (above-the-fold)
- [ ] Descriptive `alt` attribute provided for accessibility
- [ ] NEVER use CSS `background-image` - always use `<img>` with `NgOptimizedImage`

## Zone.js & Async Operations

- [ ] `TimerService` used instead of raw `setTimeout`/`setInterval`
- [ ] Timers cleaned up in `DestroyRef.onDestroy()`
- [ ] Existing timers cleared before starting new ones
- [ ] Non-UI work uses `setTimeoutOutsideAngularZone()`
- [ ] Deferred work uses `scheduleIdleCallback()` for non-critical operations
- [ ] Long-running server operations guarded with `platform.runOnBrowser()`

## DOM Manipulation

- [ ] Avoid using direct DOM Manipulation. In case there is no escape, are u using  `Renderer2` for all DOM manipulation (no direct element methods).
- [ ] Use `DeviceService` for global DOM queries instead of querying them directly
- [ ] DOM reads and writes separated into distinct batched phases
- [ ] `afterRenderEffect()` or `afterNextRender()` used for DOM operations
- [ ] Observers (`ResizeObserver`, `IntersectionObserver`) used instead of polling
- [ ] All observers cleaned up in `DestroyRef.onDestroy()`
- [ ] Code works correctly in SSR (no direct `window`/`document` access)

## CSS & Animations

- [ ] Animations only use `transform` and `opacity` (compositor-only properties)
- [ ] No layout property animations (`top`, `left`, `width`, `height`, `margin`, `padding`)
- [ ] `will-change` applied conditionally during animation (not permanently)
- [ ] Transitions explicitly list properties (not `transition: all`)
- [ ] NEVER use CSS `background-image` - always use `<img>` with `NgOptimizedImage`
- [ ] Animations tested on low-end devices for 60fps performance

## Event Listeners & Subscriptions

- [ ] All subscriptions cleaned up with `takeUntilDestroyed()` or `DestroyRef.onDestroy()`
- [ ] Touch/scroll event listeners use `{ passive: true }`
- [ ] Shared Observables use `shareReplay()` or `share()` to prevent duplicate work
- [ ] `take(1)` used instead of `first()` (avoids `EmptyErrorImpl` on server)
- [ ] No memory leaks verified (subscriptions properly torn down)

## Memory & Routes

- [ ] All feature routes use lazy loading with `loadChildren` and dynamic imports
- [ ] `ViewContainerRef.clear()` called in `ngOnDestroy()` for dynamic components
- [ ] Navigation links use `vnSpeculativeLink` directive for preloading
- [ ] Route param/query subscriptions use `takeUntilDestroyed()`

For detailed rules and examples, refer to:
- `.kiro/steering/topics/angular-performance/change-detection-and-reactivity.md`
- `.kiro/steering/topics/angular-performance/template-optimization.md`
- `.kiro/steering/topics/angular-performance/image-optimization.md`
- `.kiro/steering/topics/angular-performance/zone-js-and-async-operations.md`
- `.kiro/steering/topics/angular-performance/dom-manipulation.md`
- `.kiro/steering/topics/angular-performance/css-and-animations.md`
- `.kiro/steering/topics/angular-performance/event-listeners-and-subscriptions.md`
- `.kiro/steering/topics/angular-performance/memory-and-routes.md`
