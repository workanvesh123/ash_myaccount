---
inclusion: manual
---

# Memory & Routes – Topic Steering

## 1. Scope – When to Read This

### This file applies when you:
- Implementing lazy-loaded routes or feature modules
- Managing dynamic component creation with `ViewContainerRef`
- Adding route preloading or speculative link directives
- Debugging memory leaks in routed components

### This file does NOT cover:
- General change detection optimization (see `change-detection-and-reactivity.md`)
- RxJS subscription management (see `event-listeners-and-subscriptions.md`)
- SSR-specific routing concerns (see `ssr-platform-and-execution-context.md`)

**Rule:** If working on route configuration, lazy loading, or dynamic component lifecycle, consult this file.

---

## 2. Core Principles

- **P1 – Lazy Load by Default:** All feature routes must use lazy loading to minimize initial bundle size and enable code splitting.
- **P2 – Clean Up Dynamic Components:** Always clear `ViewContainerRef` when destroying dynamically created components to prevent memory leaks.
- **P3 – Preload Strategically:** Apply `vnSpeculativeLink` directive to navigation links to preload routes when they enter viewport.

---

## 3. Do / Don't Guidelines

### Do
- Use lazy loading for all feature routes: `loadChildren: () => import('./feature/routes')`
- Clear `ViewContainerRef` in `ngOnDestroy()` when creating dynamic components
- Use `vnSpeculativeLink` directive on navigation links to preload routes on viewport entry
- Use `takeUntilDestroyed()` for route param/query subscriptions

### Don't
- Never eagerly load feature modules in route configuration
- Never leave dynamic components in `ViewContainerRef` without cleanup
- Never use `PreloadAllModules` strategy (wastes bandwidth and memory)

---

## 4. Standard Patterns

### Lazy Loading Routes
```typescript
// ✅ Correct: Lazy load feature routes
export const routes: Routes = [
  {
    path: 'games',
    loadChildren: () => import('./features/games/routes').then(m => m.GAMES_ROUTES)
  }
];
```

### Dynamic Component Cleanup
```typescript
// ✅ Correct: Clear ViewContainerRef on destroy
export class DynamicHostComponent implements OnDestroy {
  private readonly viewContainerRef = inject(ViewContainerRef);
  
  ngOnDestroy(): void {
    this.viewContainerRef.clear();
  }
}
```

### Route Parameter Subscriptions
```typescript
// ✅ Correct: Clean up route subscriptions automatically
export class GameDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly gameService = inject(GameService);
  
  constructor() {
    // takeUntilDestroyed() ensures subscription is cleaned up when component is destroyed
    this.route.params
      .pipe(takeUntilDestroyed())
      .subscribe(params => {
        this.gameService.loadGame(params['id']);
      });
  }
}
```

### Speculative Link Preloading
```typescript
// ✅ Correct: Preload route on viewport entry
<a [routerLink]="['/games']" [vnSpeculativeLink]="'/games'">View Games</a>
```

---

## 5. Implementation Checklist

- [ ] Are all feature routes using `loadChildren` with dynamic imports?
- [ ] Does `ViewContainerRef.clear()` get called in `ngOnDestroy()` for dynamic components?
- [ ] Are navigation links using `vnSpeculativeLink` directive for preloading?
- [ ] Are route parameter and query parameter subscriptions using `takeUntilDestroyed()`?

---

## 6. Common Pitfalls & Anti-Patterns

- ❌ **Forgetting ViewContainerRef Cleanup:** Dynamic components remain in memory after the parent component is destroyed, causing memory leaks. Always call `viewContainerRef.clear()` in `ngOnDestroy()`.

- ❌ **Missing takeUntilDestroyed() on Route Subscriptions:** When you manually subscribe to `ActivatedRoute.params`, `ActivatedRoute.queryParams`, or `ActivatedRoute.data`, those subscriptions don't automatically clean up when the component is destroyed. This causes memory leaks because the subscription callback keeps a reference to the component. Always use `takeUntilDestroyed()` to ensure cleanup.

  ```typescript
  // ❌ Wrong: Subscription leaks after component destruction
  constructor() {
    this.route.params.subscribe(params => {
      this.loadData(params['id']); // Component reference kept alive
    });
  }
  
  // ✅ Correct: Subscription cleaned up automatically
  constructor() {
    this.route.params
      .pipe(takeUntilDestroyed())
      .subscribe(params => {
        this.loadData(params['id']);
      });
  }
  ```

---

## 7. Small Examples

```typescript
// ✅ Correct: Lazy route with speculative preload
export const routes: Routes = [
  { path: 'casino', loadChildren: () => import('./casino/routes') }
];

// Template
<a [routerLink]="['/casino']" [vnSpeculativeLink]="'/casino'">Casino</a>
```

```typescript
// ❌ Avoid: Eager loading and no cleanup
export const routes: Routes = [
  { path: 'casino', component: CasinoComponent } // Eager load
];

export class HostComponent {
  private readonly vcr = inject(ViewContainerRef);
  
  createComponent() {
    this.vcr.createComponent(DynamicComponent);
    // Missing: vcr.clear() in ngOnDestroy
  }
}
```

---

## 8. Escalation & Trade-offs

- If dynamic component cleanup conflicts with animation timing, use `afterRenderEffect()` to defer cleanup until animation completes.

**Rule:** When trade-offs are unclear, favor memory efficiency over convenience and document the decision.

---

## 9. Related Steering Files

- `.kiro/steering/topics/angular-performance/event-listeners-and-subscriptions.md` – Subscription cleanup
- `.kiro/steering/04-monorepo-and-packages.md` – Module Federation configuration
- `packages/vanilla/features/speculative-link/` – Speculative link directive implementation
