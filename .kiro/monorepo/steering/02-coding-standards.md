---
inclusion: always
---

# Coding Standards

## Critical Rules (Always Apply)

### SSR Compatibility
- Never access `window`/`document` directly → Use `inject(WINDOW)`, `inject(DOCUMENT)`, or `PLATFORM.runOnBrowser()`
- Never use direct DOM manipulation → Always use `Renderer2` for all DOM operations
- Never use raw `setTimeout`/`setInterval` → Use `TimerService` from `@frontend/vanilla/core`
- Never use RxJS `first()` → Use `take(1)` to prevent `EmptyErrorImpl` on server
- Always guard browser-only code with `afterNextRender()` or `PLATFORM.runOnBrowser()`
- Always skip analytics/polling/tracking on server (blocks response)
- Always set `transferCache: true` on HTTP requests for SSR caching

### Performance
- Always use `ChangeDetectionStrategy.OnPush` for all new components
- Always use signals (`signal()`, `computed()`, `toSignal()`) → Never use `async` pipe
- Always use `@for` with unique `track` (e.g., `track item.id`) → Never track by index
- Always animate only `transform` and `opacity` → Never animate layout properties
- Always use `NgOptimizedImage` with `ngSrc`, `width`, `height`, `sizes`, `ngSrcset`
- Always clean up subscriptions with `takeUntilDestroyed()` or `DestroyRef.onDestroy()`
- Always use `{ passive: true }` for touch/scroll event listeners

### Design System
- Never apply `[style]`, `[class]`, or utility classes to DS component hosts
- Always use semantic tokens (`--semantic-*`) → Never use reference tokens or hardcoded values
- Always apply `[inverse]="true"` on dark backgrounds (cascade to all child DS components)
- Always wrap conditionals (`@if`/`@for`) in containers before applying slot attributes
- Always choose components by semantic intent: `<button>` for actions, `<a>` for navigation
- Always verify DS defaults visually → Size scales are semantic, not pixel-perfect legacy matches

### Accessibility
- Never use `<div>` or `<span>` for buttons/links → Always use semantic HTML (`<button>`, `<a>`, `<input>`)
- Always use `[attr.aria-*]` bindings for ARIA attributes → Never use static attributes
- Always implement keyboard navigation (`Tab`, `Enter`, `Space`, `Escape`) for interactive elements
- Always use `afterNextRender()` for programmatic `.focus()` calls → Never in constructors or `ngOnInit()`
- Always use `Renderer2.setAttribute()` for dynamic ARIA attributes → Never direct DOM manipulation
- Always provide `aria-label` or `aria-labelledby` for icon-only buttons
- Always test with axe-core, keyboard navigation, and screen readers

---

## Component Architecture

### Change Detection & State
```typescript
// ✅ Correct
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2);
  data = toSignal(this.service.getData$());
}

// ❌ Wrong
@Component({ /* default change detection */ })
export class MyComponent {
  count = 0;
  doubled$ = this.count$.pipe(map(x => x * 2));
}
```

- Use `signal()` for mutable state, `computed()` for derived values
- Convert observables with `toSignal()`, never use `async` pipe
- No template getters or method calls → Use `computed()` instead
- No manual `ChangeDetectorRef.detectChanges()` or `markForCheck()`

### Templates
```html
<!-- ✅ Correct -->
@for (item of items(); track item.id) {
  <div [class.active]="item.active" [style.color]="item.color">
    {{ item.name }}
  </div>
}

<!-- ❌ Wrong -->
@for (item of items(); track $index) {
  <div [ngClass]="{'active': item.active}" [ngStyle]="{'color': item.color}">
    {{ getName(item) }}
  </div>
}
```

- Every `@for` must have unique `track` (not index or reference)
- Use direct bindings (`[class.x]`, `[style.x]`) instead of `ngClass`/`ngStyle`
- Call signals with `()` in templates: `{{ count() }}`
- Keep expressions simple and side-effect-free

### Images
```html
<!-- ✅ Correct -->
<img ngSrc="/hero.jpg" width="1200" height="600" 
     sizes="(max-width: 768px) 100vw, 50vw"
     priority="true" alt="Hero image">

<!-- ❌ Wrong -->
<img src="/hero.jpg" alt="Hero image">
```

- All `<img>` must use `NgOptimizedImage` with `ngSrc`
- Explicit `width` and `height` (matching aspect ratio)
- `sizes` attribute based on viewport usage
- `priority="true"` only for LCP image (above-the-fold)
- Use `<img>` for content, not CSS `background-image`

---

## Async & Lifecycle

### Timers
```typescript
// ✅ Correct
constructor() {
  const timer = inject(TimerService);
  const destroyRef = inject(DestroyRef);
  
  timer.setTimeout(() => { /* work */ }, 1000);
  destroyRef.onDestroy(() => timer.clearAllTimeouts());
}

// ❌ Wrong
ngOnInit() {
  setTimeout(() => { /* work */ }, 1000);
}
```

- Use `TimerService` from `@frontend/vanilla/core`, never raw `setTimeout`/`setInterval`
- Clean up in `DestroyRef.onDestroy()`
- Clear existing timers before starting new ones
- Run non-UI work outside Angular zone: `setTimeoutOutsideAngularZone()`

### DOM Manipulation
```typescript
// ✅ Correct
constructor() {
  const renderer = inject(Renderer2);
  const el = inject(ElementRef);
  
  afterNextRender(() => {
    renderer.setStyle(el.nativeElement, 'color', 'red');
  });
}

// ❌ Wrong
ngAfterViewInit() {
  this.el.nativeElement.style.color = 'red';
}
```

- Use `Renderer2` for all DOM operations (no `element.style.x`, `element.classList.add()`)
- Use `afterRenderEffect()` or `afterNextRender()` for DOM operations
- Batch DOM reads and writes into separate phases
- Use SSR-safe wrappers for `ResizeObserver`, `IntersectionObserver` from `vanilla/core`

### Subscriptions
```typescript
// ✅ Correct
data$ = this.service.getData$().pipe(
  take(1),
  takeUntilDestroyed()
);

// ❌ Wrong
data$ = this.service.getData$().pipe(first());
```

- Use `takeUntilDestroyed()` for automatic cleanup
- Use `take(1)` instead of `first()` (prevents `EmptyErrorImpl` on server)
- Use `shareReplay()` or `share()` for shared observables
- Set `transferCache: true` on HTTP requests

---

## Design System Integration

### Component Selection
- Navigation (URL change) → `<a>` with `ds-button` or `ds-pill`
- JavaScript action → `<button>` with `ds-button` or `ds-pill`
- Display only → `DsBadge` (not interactive)
- Form controls → `DsSwitch` (binary), `DsCheckbox` (optional), `DsRadioButton` (exclusive)
- Loading → `DsLoadingSpinner` (unknown duration), `DsProgressBar` (trackable)

### Styling
```html
<!-- ✅ Correct -->
<div class="wrapper">
  <ds-button [inverse]="isDark()">Click</ds-button>
</div>

<!-- ❌ Wrong -->
<ds-button [style.margin]="'10px'" class="custom-button">Click</ds-button>
```

- Never apply `[style]`, `[class]`, or utilities to DS component hosts
- Use semantic tokens (`--semantic-color-*`) for app styling
- Never override DS CSS custom properties (`--ds-button-*`)
- Use wrapper elements for layout and spacing

### Composition
```html
<!-- ✅ Correct -->
@if (showBadge()) {
  <div slot="end">
    <ds-badge [inverse]="isDark()">New</ds-badge>
  </div>
}

<!-- ❌ Wrong -->
<ds-badge slot="end" @if="showBadge()">New</ds-badge>
```

- Wrap conditionals in containers before applying slot attributes
- Cascade `[inverse]="true"` to all child DS components on dark backgrounds
- Never mix inverse and non-inverse in same dark container

---

## SSR Patterns

### Browser API Access
```typescript
// ✅ Correct
constructor() {
  const window = inject(WINDOW);
  const platform = inject(PLATFORM);
  
  platform.runOnBrowser(() => {
    const width = window.innerWidth;
  });
}

// ❌ Wrong
ngOnInit() {
  const width = window.innerWidth;
}
```

- No direct `window`, `document`, `localStorage`, `navigator` access
- Use `inject(WINDOW)`, `inject(DOCUMENT)` with platform checks
- Guard browser-only code with `afterNextRender()` or `PLATFORM.runOnBrowser()`
- Provide `.provide.server.ts` overrides for browser-dependent services

### Lifecycle
- Browser-only initialization in `afterNextRender()`, not `ngOnInit()`
- No `window` access in constructor or `ngOnInit()`
- Server-safe default values for browser-dependent state
- Skip animations, tracking, polling on server

---

## Performance Optimization

### Animations
```css
/* ✅ Correct */
.element {
  transition: transform 0.3s, opacity 0.3s;
}

/* ❌ Wrong */
.element {
  transition: all 0.3s;
  /* or */
  transition: width 0.3s, height 0.3s;
}
```

- Only animate `transform` and `opacity` (compositor-only)
- Never animate layout properties (`top`, `left`, `width`, `height`, `margin`, `padding`)
- Apply `will-change` conditionally during animation only
- Explicitly list transition properties

### Routes & Memory
- Lazy load all feature routes with `loadChildren` and dynamic imports
- Call `ViewContainerRef.clear()` in `ngOnDestroy()` for dynamic components
- Use `vnSpeculativeLink` directive for navigation preloading
- Import Module Federation remotes dynamically, never statically

---

## Accessibility

### Semantic HTML & ARIA
```html
<!-- ✅ Correct: Semantic button with ARIA -->
<button ds-button 
        [attr.aria-label]="closeLabel()"
        [attr.aria-disabled]="disabled() ? true : null"
        [attr.tabindex]="disabled() ? -1 : 0">
  <ds-icon name="close" aria-hidden="true"></ds-icon>
</button>

<!-- ❌ Wrong: Div as button, static ARIA -->
<div class="button" aria-label="Close" (click)="close()">
  <ds-icon name="close"></ds-icon>
</div>
```

- Use semantic HTML (`<button>`, `<a>`, `<input>`) over divs with ARIA
- All ARIA attributes use `[attr.aria-*]` bindings, never static attributes
- Icon-only buttons need `aria-label` or `aria-labelledby`
- Decorative icons need `aria-hidden="true"`
- Form controls link to help text via `[attr.aria-describedby]`

### Keyboard Navigation
```typescript
// ✅ Correct: Keyboard event handling
@HostListener('keydown', ['$event'])
onKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault();
      this.activate();
      break;
    case 'Escape':
      event.preventDefault();
      this.close();
      break;
  }
}
```

- All interactive elements keyboard accessible (`Tab`, `Enter`, `Space`, `Escape`)
- Use `tabindex="-1"` (programmatic) or `0` (natural order), never positive values
- Implement arrow key navigation for lists, menus, tabs
- Always call `event.preventDefault()` for handled keys

### Focus Management
```typescript
// ✅ Correct: SSR-safe focus
constructor() {
  const el = inject(ElementRef);
  afterNextRender(() => {
    el.nativeElement.focus();
  });
}

// ❌ Wrong: Focus in ngOnInit (breaks SSR)
ngOnInit() {
  this.el.nativeElement.focus();
}
```

- Use `afterNextRender()` for all programmatic `.focus()` calls
- Restore focus to trigger element after closing modals/menus
- Trap focus within modal dialogs
- Never call `.focus()` in constructors or `ngOnInit()`

### ARIA Attributes (SSR-Safe)
```typescript
// ✅ Correct: Renderer2 for dynamic ARIA
constructor() {
  const renderer = inject(Renderer2);
  const el = inject(ElementRef);
  renderer.setAttribute(el.nativeElement, 'aria-expanded', 'true');
}

// ❌ Wrong: Direct DOM manipulation
ngOnInit() {
  this.el.nativeElement.setAttribute('aria-expanded', 'true');
}
```

- Use `Renderer2.setAttribute()` for dynamic ARIA attributes
- Include ARIA attributes in server-rendered HTML
- Use `[attr.aria-*]` bindings in templates for reactive values

---

## Related Documentation
- SSR patterns: `.kiro/steering/topics/ssr/`
- Performance: `.kiro/steering/topics/angular-performance/`
- Design System: `.kiro/steering/topics/design-system/`
- Accessibility: `.kiro/steering/topics/accessibility/`
- Architecture: `.kiro/steering/04-monorepo-and-packages.md`