---
inclusion: manual
---

# SSR RxJS and HTTP

## Scope – When to Read This

### This file applies when you:
- Use RxJS operators (`first()`, `take()`, `tap()`) in SSR contexts
- Make HTTP requests that need to work on both server and client
- Configure HTTP transfer cache for SSR performance
- Handle platform-specific RxJS side effects (analytics, logging)
- Debug `EmptyErrorImpl` errors on server
- Manage subscriptions in SSR-enabled components

### This file does NOT cover:
- General RxJS patterns (see Angular docs)
- DOM manipulation or browser APIs (see `.kiro/steering/topics/ssr/ssr-dom-and-browser-apis.md`)
- Timer management (see `.kiro/steering/topics/ssr/ssr-timers-and-async.md`)
- Platform detection (see `.kiro/steering/topics/ssr/ssr-platform-and-execution-context.md`)

---

## Core Principles

- **P1 – Use take(1) Not first():** `first()` throws `EmptyErrorImpl` if observable completes without emission on server. Always use `take(1)` for single-value subscriptions.
- **P2 – Mark HTTP Requests for Transfer Cache (Public Data Only):** Set `transferCache: true` ONLY on HTTP requests for public, non-user-specific data (e.g., static content, public APIs). NEVER cache user-specific endpoints (e.g., `/api/user`, authenticated requests) as this can leak data between users.
- **P3 – Use Platform-Specific Tap Operators:** Use `tapIfBrowser()` and `tapIfServer()` for side effects that should only run on one platform (analytics, logging).
- **P4 – Always Clean Up Subscriptions:** Use `takeUntilDestroyed()` to automatically unsubscribe when component destroys, preventing memory leaks and server thread blocking.

---

## Do / Don't Guidelines

### Do
- Use `take(1)` for single-value subscriptions in SSR contexts
- Mark HTTP requests with `transferCache: true` ONLY for public, static data (e.g., `/api/config`, `/api/content`)
- Use `tapIfBrowser()` for analytics, tracking, and browser-only side effects
- Use `tapIfServer()` for server-only logging with `REQUEST_LOGGER`
- Use `takeUntilDestroyed()` for automatic subscription cleanup
- Configure `withHttpTransferCacheOptions()` in app config to control caching behavior

### Don't
- Never use `first()` operator in SSR contexts (throws EmptyError)
- Never cache user-specific endpoints (e.g., `/api/user`, `/api/account`, `/api/profile`)
- Never cache authenticated or session-dependent requests
- Never cache POST/PUT/DELETE requests (only GET requests should be cached)
- Never run analytics or tracking in RxJS streams without `tapIfBrowser()` guard
- Never forget to unsubscribe from long-lived observables

---

## Standard Patterns

### Single-Value Subscriptions
```typescript
// ✅ Use take(1) for SSR safety
this.dataService.getData()
  .pipe(take(1))
  .subscribe(data => this.processData(data));
```

### HTTP Transfer Cache
```typescript
// ✅ Enable caching for public data only
getPublicConfig() {
  return this.http.get('/api/config', { transferCache: true });
}

// ❌ NEVER cache user-specific data
getUserProfile() {
  return this.http.get('/api/user'); // No transferCache!
}
```

### Platform-Specific Side Effects
```typescript
// ✅ Analytics only in browser, logging only on server
this.events$.pipe(
  tapIfBrowser(e => this.analyticsService.track(e)),
  tapIfServer(e => this.logger?.info(e, 'Event tracked'))
).subscribe();
```

### Subscription Cleanup
```typescript
// ✅ Automatic cleanup with takeUntilDestroyed
ngOnInit() {
  this.dataService.updates$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(data => this.processData(data));
}
```

---

## Implementation Checklist

- [ ] Are single-value subscriptions using `take(1)` instead of `first()`?
- [ ] Are HTTP requests with `transferCache: true` ONLY for public, non-user-specific data?
- [ ] Are user-specific endpoints (e.g., `/api/user`, `/api/account`) NOT using `transferCache`?
- [ ] Are analytics/tracking side effects guarded with `tapIfBrowser()`?
- [ ] Are server-only logs using `tapIfServer()` with `REQUEST_LOGGER`?
- [ ] Are all subscriptions cleaned up with `takeUntilDestroyed()`?
- [ ] Is HTTP transfer cache configured in `app.config.ts` with `withHttpTransferCacheOptions()`?

---

## Common Pitfalls & Anti-Patterns

- ❌ **Using first() Instead of take(1)**
  - Throws `EmptyErrorImpl` if observable completes without emission on server. Always use `take(1)`.

- ❌ **Caching User-Specific or Authenticated Data**
  - **CRITICAL:** Setting `transferCache: true` on user-specific endpoints (e.g., `/api/user`, `/api/account`, `/api/profile`) can leak data between users. Only cache public, static data.

- ❌ **Missing transferCache for Public Data**
  - Public HTTP requests (e.g., `/api/config`, `/api/content`) made twice (server + client) without caching, wasting resources and slowing hydration.

- ❌ **Running Analytics in Unguarded Streams**
  - Analytics code executes on server, blocking response and wasting resources. Use `tapIfBrowser()`.

- ❌ **Forgetting Subscription Cleanup**
  - Long-lived subscriptions leak memory and block server threads. Use `takeUntilDestroyed()`.

---

## Small Examples

```typescript
// ✅ Correct: take(1) for SSR safety
this.config$.pipe(take(1)).subscribe(config => this.init(config));
```

```typescript
// ❌ Wrong: first() throws EmptyError on server
this.config$.pipe(first()).subscribe(config => this.init(config));
```

```typescript
// ✅ Correct: Platform-specific side effects
this.data$.pipe(
  tapIfBrowser(d => console.log('Browser:', d)),
  tapIfServer(d => this.logger?.info?.(d))
).subscribe();
```

```typescript
// ❌ Wrong: Analytics runs on server
this.data$.pipe(
  tap(d => this.analytics.track(d)) // Blocks server!
).subscribe();
```

---

## Escalation & Trade-offs

- If HTTP request needs caching:
  - **ONLY** use `transferCache: true` for public, static data (e.g., `/api/config`, `/api/content`, `/api/static`)
  - **NEVER** cache user-specific endpoints (e.g., `/api/user`, `/api/account`, `/api/profile`, `/api/settings`)
  - **NEVER** cache authenticated requests or session-dependent data
  - When in doubt, DO NOT cache - it's safer to make duplicate requests than leak user data
- If side effect needs platform detection:
  - Use `tapIfBrowser()` for analytics, tracking, browser-only operations
  - Use `tapIfServer()` for server-only logging with `REQUEST_LOGGER`
- If subscription lifetime is unclear:
  - Always use `takeUntilDestroyed()` for safety, even if subscription seems short-lived

**Rule:** When in doubt about caching, DO NOT cache. Data leaks are worse than performance hits.

---

## Related Steering Files

- `ssr-anti-patterns.md` – Common SSR mistakes and prevention
- `ssr-platform-and-execution-context.md` – Platform detection and conditional execution
- `.kiro/steering/topics/ssr/` – Comprehensive SSR best practices
- `.kiro/steering/topics/angular-performance/event-listeners-and-subscriptions.md` – Subscription management and change detection
- `docs/ssr-development-guide/README.md` – Full SSR guide with HTTP caching details
