---
inclusion: manual
---

# Zone.js & Async Operations

## Scope – When to Read This

### This file applies when you:
- Use `setTimeout`, `setInterval`, or schedule delayed/recurring tasks
- Optimize change detection by running operations outside Angular zone
- Defer non-critical work with idle callbacks
- Clean up timers, intervals, or async operations on component destruction
- Debug performance issues related to unnecessary change detection cycles

### This file does NOT cover:
- RxJS subscription management (see `event-listeners-and-subscriptions.md`)
- SSR timer patterns (see `ssr-timers-and-async.md`)
- DOM manipulation (see `dom-manipulation.md`)

**Rule:** If you're scheduling async work with timers or managing zone.js behavior, consult this file.

---

## Core Principles

- **P1 – Use TimerService:** Always use `TimerService` from `@frontend/vanilla/core` instead of raw `setTimeout`/`setInterval`. Provides SSR safety and zone control.
- **P2 – Run Outside Zone for Non-UI Work:** Use `setTimeoutOutsideAngularZone()` for operations that don't need immediate change detection (animations, logging, polling). Update signals directly—they trigger change detection automatically without needing `NgZone.run()`.
- **P3 – Always Clean Up:** Cancel all timers using `DestroyRef.onDestroy()` to prevent memory leaks and SSR timeout errors. Clear before restarting.
- **P4 – Defer Non-Critical Work:** Use `TimerService.scheduleIdleCallback()` for deferred operations like logging, caching, or analytics that don't affect initial render.

---

## Do / Don't Guidelines

### Do
- Use `TimerService.setTimeoutOutsideAngularZone()` for animations, logging, polling
- Use `TimerService.setTimeout()` for timers that update signals/state needing change detection
- Clear timers in `DestroyRef.onDestroy()` and before restarting the same timer
- Use `TimerService.scheduleIdleCallback()` for deferred non-critical work
- Update signals directly in outside-zone timers—they trigger change detection automatically

### Don't
- Never use raw `setTimeout`, `setInterval`, `clearTimeout`, or `clearInterval`
- Never forget to clean up timers—always use `DestroyRef.onDestroy()`
- Never start a new timer without clearing the previous one first
- Never run long-running timers on server (guard with `platform.runOnBrowser()`)

---

## Standard Patterns

### Timer Outside Zone (Deferred Change Detection)
```typescript
export class TooltipDirective {
  private readonly timerService = inject(TimerService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isVisible = signal(true);
  private timeoutId: ReturnType<typeof setTimeout> | undefined;
  
  scheduleClose(delay: number): void {
    if (this.timeoutId) {
      this.timerService.clearTimeout(this.timeoutId);
    }
    
    // Signal updates trigger change detection automatically, even outside zone
    this.timeoutId = this.timerService.setTimeoutOutsideAngularZone(() => {
      this.isVisible.set(false);
    }, delay);
  }
  
  constructor() {
    this.destroyRef.onDestroy(() => {
      this.timerService.clearTimeout(this.timeoutId);
    });
  }
}
```

### Timer Inside Zone (Immediate Change Detection)
```typescript
export class NotificationComponent {
  private readonly timerService = inject(TimerService);
  private readonly message = signal('');
  
  showMessage(text: string): void {
    this.message.set(text);
    this.timerService.setTimeout(() => this.message.set(''), 3000);
  }
}
```

### Deferred Non-Critical Work
```typescript
export class AnalyticsService {
  private readonly timerService = inject(TimerService);
  
  trackEvent(event: string): void {
    this.timerService.scheduleIdleCallback(() => {
      this.sendToAnalytics(event);
    });
  }
}
```

---

## Implementation Checklist

- [ ] Are you using `TimerService` instead of raw `setTimeout`/`setInterval`?
- [ ] Did you clear the timer in `DestroyRef.onDestroy()`?
- [ ] Did you clear any existing timer before starting a new one?
- [ ] Are you using `setTimeoutOutsideAngularZone()` for non-UI work?
- [ ] Are you updating signals directly (they trigger change detection automatically)?
- [ ] Are non-critical operations using `scheduleIdleCallback()`?

---

## Common Pitfalls & Anti-Patterns

- ❌ **Using raw setTimeout/setInterval:** Causes SSR issues and prevents zone control. Always use `TimerService`.
- ❌ **Forgetting cleanup:** Leads to memory leaks and SSR timeout errors. Always use `DestroyRef.onDestroy()`.
- ❌ **Not clearing before restarting:** Creates multiple concurrent timers. Clear existing timer first.
- ❌ **Running all timers inside zone:** Triggers unnecessary change detection. Use `setTimeoutOutsideAngularZone()` for non-UI work.

---

## Escalation & Trade-offs

- If timer needs to update UI immediately: Use `setTimeout()` (runs inside zone)
- If timer is for animation/logging/polling: Use `setTimeoutOutsideAngularZone()` + `NgZone.run()` for updates
- If work can be deferred: Use `scheduleIdleCallback()` to avoid blocking main thread

**Rule:** When in doubt, favor running outside zone and updating signals directly. Signals trigger change detection automatically without needing manual intervention, preventing performance issues from excessive change detection cycles.

---

## Related Steering Files

- `.kiro/steering/topics/ssr/ssr-timers-and-async.md` – SSR-specific timer patterns
- `event-listeners-and-subscriptions.md` – Subscription cleanup
- `change-detection-and-reactivity.md` – Change detection strategies

**Service location:** `packages/vanilla/lib/core/src/browser/timer.service.ts`
