---
inclusion: manual
---

# SSR Timers & Async Operations

## 1. Scope – When to Read This

### This file applies when you:
- Use `setTimeout`, `setInterval`, or any timer-based operations
- Schedule delayed or recurring tasks in components/services
- Work with async operations that need platform-specific behavior
- Debug "request failed due to critical error while rendering" timeout errors
- Clean up subscriptions, timers, or intervals on component destruction

### This file does NOT cover:
- RxJS operators and HTTP caching (see `ssr-rxjs-and-http.md`)
- Platform detection and execution context (see `ssr-platform-and-execution-context.md`)
- DOM manipulation (see `ssr-dom-and-browser-apis.md`)

**Rule:** If you're scheduling work with timers or managing async cleanup, consult this file.

---

## 2. Core Principles

- **P1 – Use TimerService:** Never use raw `setTimeout`/`setInterval`. Always use `TimerService` from `@frontend/vanilla/core` for SSR-safe timer management.
- **P2 – Always Clean Up:** Cancel all timers using `DestroyRef.onDestroy()`. Clear timers before starting new ones to prevent leaks.
- **P3 – Avoid Timers on Server:** Never run intervals on the server. Use `{ serverMode: 'omit' }` parameter to skip intervals on server, or `{ serverMode: 'sync' }` to execute synchronously. For one-time browser initialization, use `afterNextRender()`.

---

## 3. Do / Don't Guidelines

### Do
- Use `TimerService.setTimeoutOutsideAngularZone()` for non-UI timers (animations, logging)
- Use `TimerService.setTimeout()` for timers that update signals/state needing change detection
- Use `{ serverMode: 'omit' }` parameter to skip intervals on server
- Use `{ serverMode: 'sync' }` parameter to execute operations synchronously on server
- Clear timers in `DestroyRef.onDestroy()` and before restarting the same timer
- Use `afterNextRender()` for one-time browser initialization

### Don't
- Never use raw `setTimeout`, `setInterval`, `clearTimeout`, or `clearInterval`
- Never run intervals on the server—they block rendering and cause timeout errors
- Never forget to clean up timers—always use `DestroyRef.onDestroy()`
- Never start a new timer without clearing the previous one first

---

## 4. Standard Patterns

### Timer Outside Angular Zone (No Immediate Change Detection)

```typescript
export class TooltipDirective {
  private readonly timerService = inject(TimerService);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platform = inject(PLATFORM);
  private timeoutId: ReturnType<typeof setTimeout> | undefined;
  
  scheduleClose(delay: number): void {
    // Only run timers in browser
    // Clear existing timer before starting new one
      if (this.timeoutId) {
        this.timerService.clearTimeout(this.timeoutId);
      }
      
      this.timeoutId = this.timerService.setTimeoutOutsideAngularZone(() => {
        // Trigger change detection only when updating UI
        this.ngZone.run(() => this.closeTooltip());
      }, delay, { serverMode: 'omit' });
  }
  
  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.timeoutId) {
        this.timerService.clearTimeout(this.timeoutId);
      }
    });
  }
}
```

### Timer Inside Angular Zone (Immediate Change Detection)

```typescript
export class NotificationComponent {
  private readonly timerService = inject(TimerService);
  private readonly platform = inject(PLATFORM);
  private readonly message = signal('');
  
  showMessage(text: string): void {
    this.message.set(text);
    // Only run timers in browser
    this.timerService.setTimeout(() => this.message.set(''), 3000, { serverMode: 'omit' });
  }
}
```

### Interval with Cleanup

```typescript
export class PollingComponent {
  private readonly timerService = inject(TimerService);
  private readonly destroyRef = inject(DestroyRef);
  private intervalId: any;
  
  startPolling(): void {
    this.stopPolling(); // Clear existing interval
    
    // Use { serverMode: 'omit' } to skip interval on server
    this.intervalId = this.timerService.setInterval(() => {
      this.fetchData();
    }, 5000, { serverMode: 'omit' });
  }
  
  stopPolling(): void {
    if (this.intervalId) {
      this.timerService.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  constructor() {
    this.destroyRef.onDestroy(() => this.stopPolling());
  }
}
```

---

## 5. Implementation Checklist

- [ ] Are you using `TimerService` instead of raw `setTimeout`/`setInterval`?
- [ ] Did you clear the timer in `DestroyRef.onDestroy()` with a null check?
- [ ] Did you clear any existing timer before starting a new one?
- [ ] Are intervals & timers using `{ serverMode: 'omit' }` to skip server execution?
- [ ] Are you using `setTimeoutOutsideAngularZone()` for non-UI work?
- [ ] Are you wrapping UI updates in `NgZone.run()` when using outside-zone timers?

---

## 6. Common Pitfalls & Anti-Patterns

- ❌ **Using raw setTimeout/setInterval**
  - Causes SSR timeout errors and blocks server rendering. Always use `TimerService`.
  
- ❌ **Forgetting to clean up timers**
  - Leads to memory leaks and unexpected behavior. Always use `DestroyRef.onDestroy()` with null checks.
  
- ❌ **Running timers on server**
  - Blocks server thread and causes "request failed due to critical error" timeouts. Use `{ serverMode: 'omit' }` for intervals, or `afterNextRender()` for one-time browser initialization.
  
- ❌ **Not clearing before restarting**
  - Creates multiple concurrent timers. Always clear existing timer before starting new one.

- ❌ **Assuming timers are cleaned up on render crash**
  - If the server render crashes, timers may not be properly destroyed. Always guard timers to prevent server execution entirely.

---

## 7. Related Steering Files

- `.kiro/steering/topics/ssr/ssr-platform-and-execution-context.md` - Platform detection and conditional execution
- `.kiro/steering/topics/ssr/ssr-server-overrides-and-shims.md` - Platform overrides
- `.kiro/steering/topics/ssr/ssr-rxjs-and-http.md` - RxJS subscription management and cleanup
- `.kiro/steering/topics/ssr/` - General SSR best practices
