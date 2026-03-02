---
inclusion: manual
---

# Event Listeners & Subscriptions

## Scope

### This file applies when you:
- Subscribe to Observables or RxJS streams
- Add DOM event listeners (`addEventListener`, `@HostListener`)
- Handle touch/scroll/resize events
- Create long-lived subscriptions in components or services
- Work with shared Observables that need multicasting

### This file does NOT cover:
- HTTP requests (see `ssr-rxjs-and-http.md`)
- Timer management (see `zone-js-and-async-operations.md`)
- SSR-specific concerns (see `ssr-anti-patterns.md`)

---

## Core Principles

- **P1 – Always Clean Up:** All subscriptions and event listeners must be cleaned up on component/service destruction to prevent memory leaks.
- **P2 – Use Passive Listeners:** Touch and scroll event listeners must use `{ passive: true }` to prevent blocking the main thread.
- **P3 – Multicast Shared Streams:** Observables with multiple subscribers must use `shareReplay()` or `share()` to prevent duplicate work.
- **P4 – Prefer Declarative Cleanup:** Use `takeUntilDestroyed()` over manual `unsubscribe()` for automatic cleanup tied to component lifecycle.

---

## Do / Don't Guidelines

### Do
- Use `takeUntilDestroyed()` for automatic subscription cleanup in components/directives
- Use `DestroyRef.onDestroy()` for manual cleanup of timers, event listeners, or non-Observable resources
- Apply `{ passive: true }` to touch/scroll event listeners via `@HostListener` or `addEventListener`
- Use `shareReplay({ bufferSize: 1, refCount: true })` for shared Observables that should cache the last value

### Don't
- Never forget to clean up subscriptions—memory leaks accumulate over time
- Never use `first()` operator without understanding it throws on empty streams (use `take(1)` instead)
- Never manually call `unsubscribe()` when `takeUntilDestroyed()` can handle it declaratively
- Never add touch/scroll listeners without `passive: true`—it blocks scrolling performance
- Never use `shareReplay` without explicitly setting `refCount` based on your caching needs:
  - Use `refCount: true` for dynamic/user-specific data that should be re-fetched when all subscribers unsubscribe (e.g., user profiles, account balances, session data)
  - Use `refCount: false` for static app-wide data that should be cached forever and never re-fetched (e.g., feature flags, translations, app config)
  - **Important:** With `refCount: false`, the HTTP request happens only once for the entire app lifetime—choose this intentionally for truly static data

---

## Standard Patterns

### Subscription Cleanup with `takeUntilDestroyed()`
```typescript
export class NotificationComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly notificationService = inject(NotificationService);

  constructor() {
    this.notificationService.updates$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(this.handleUpdate);
  }
}
```

### Manual Cleanup with `DestroyRef.onDestroy()`
```typescript
export class TooltipDirective {
  private readonly destroyRef = inject(DestroyRef);
  private readonly window = inject(WINDOW);

  constructor() {
    this.window.addEventListener('scroll', this.onScroll, { passive: true });
    this.destroyRef.onDestroy(() => {
      this.window.removeEventListener('scroll', this.onScroll);
    });
  }
}
```

### Passive Event Listeners
```typescript
@HostListener('touchstart', ['$event', { passive: true }])
onTouchStart(event: TouchEvent) {
  // Handle touch without blocking scroll
}
```

### Multicasting Shared Observables

**When to use `refCount: false` (cache forever):**
Use for static, app-wide data that doesn't change during the session and should only be fetched once:
- Feature flags, app configuration, translations
- Static reference data (countries, currencies, game types)
- Data that's expensive to fetch and rarely changes

**When to use `refCount: true` (re-fetch when needed):**
Use for dynamic, user-specific, or frequently changing data that should be re-fetched when no longer actively used:
- User profiles, account balances, session data
- Real-time data that may become stale
- Component-scoped data that should be cleaned up

```typescript
// ✅ App-wide config: Cache forever (refCount: false)
// The API request happens once and the result is cached for the entire app lifetime
export class ConfigService {
  private readonly http = inject(HttpClient);
  
  readonly config$ = this.http.get('/api/config').pipe(
    shareReplay({ bufferSize: 1, refCount: false })
    // refCount: false means the cache persists even when all subscribers unsubscribe
    // The HTTP request will NEVER be made again, even if new subscribers appear later
  );
}

// ✅ User-specific data: Re-fetch when needed (refCount: true)
// The API request is made on first subscription, cached while subscribers exist,
// and re-fetched if new subscribers appear after all previous ones unsubscribed
export class UserDataService {
  private readonly http = inject(HttpClient);
  
  getUserProfile(userId: string) {
    return this.http.get(`/api/users/${userId}`).pipe(
      shareReplay({ bufferSize: 1, refCount: true })
      // refCount: true means the cache is cleared when all subscribers unsubscribe
      // A new HTTP request will be made if someone subscribes again later
    );
  }
}
```

---

## Implementation Checklist

- [ ] Are all subscriptions cleaned up with `takeUntilDestroyed()` or `DestroyRef.onDestroy()`?
- [ ] Do touch/scroll event listeners use `{ passive: true }`?
- [ ] Are shared Observables using `shareReplay()` or `share()` to prevent duplicate requests?
- [ ] Is `refCount` configured appropriately (`true` for dynamic data, `false` for static config)?
- [ ] Are you using `take(1)` instead of `first()` to avoid `EmptyErrorImpl` on server?
- [ ] Have you verified no memory leaks by checking subscriptions are properly torn down?

---

## Common Pitfalls

- ❌ **Forgetting to unsubscribe:** Subscriptions without cleanup accumulate and cause memory leaks, especially in frequently created/destroyed components.
- ❌ **Using `first()` instead of `take(1)`:** `first()` throws `EmptyErrorImpl` if the Observable completes without emitting, breaking SSR.
- ❌ **Non-passive scroll/touch listeners:** Blocking event listeners prevent smooth scrolling and hurt INP metrics.
- ❌ **Multiple subscriptions to cold Observables:** Without `shareReplay()`, each subscription triggers a new HTTP request or computation.

---

## Examples

```typescript
// ✅ Correct: Automatic cleanup with takeUntilDestroyed
export class UserProfileComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly userService = inject(UserService);
  
  constructor() {
    this.userService.profile$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(profile => this.updateUI(profile));
  }
}

// ❌ Wrong: No cleanup, memory leak
export class UserProfileComponent {
  constructor() {
    this.userService.profile$.subscribe(profile => this.updateUI(profile));
  }
}
```

```typescript
// ✅ Correct: Passive scroll listener
@HostListener('scroll', ['$event', { passive: true }])
onScroll(event: Event) {
  this.handleScroll();
}

// ❌ Wrong: Blocking scroll listener
@HostListener('scroll', ['$event'])
onScroll(event: Event) {
  this.handleScroll();
}
```

---

## Related Steering

- `.kiro/steering/topics/angular-performance/zone-js-and-async-operations.md` – Timer management
- `.kiro/steering/topics/ssr/ssr-rxjs-and-http.md` – RxJS patterns for SSR
- `.kiro/steering/topics/ssr/ssr-anti-patterns.md` – SSR-safe subscription patterns
