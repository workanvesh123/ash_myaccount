---
inclusion: manual
---

# Change Detection & Reactivity

## Scope

### Read this when:
- Creating new components or directives
- Optimizing rendering performance or debugging unnecessary change detection cycles
- Converting observables to signals or refactoring reactive state
- Migrating legacy components to OnPush strategy

### Not covered here:
- RxJS operators and HTTP patterns (see `ssr-rxjs-and-http.md`)
- Template syntax and control flow (see `template-optimization.md`)
- Zone.js and async operations (see `zone-js-and-async-operations.md`)

## Core Principles

- **P1 – OnPush by Default:** All new components use `ChangeDetectionStrategy.OnPush` to prevent unnecessary change detection cycles. Only skip OnPush when integrating third-party libraries that require Default strategy.

- **P2 – Signals for State:** Use `signal()` for reactive state that changes during component lifecycle, `computed()` for derived values. Static literals and configuration constants don't need signals.

- **P3 – No Manual Change Detection:** Never call `ChangeDetectorRef.detectChanges()` or `markForCheck()`. Signals trigger change detection automatically. Manual calls indicate architectural problems.

- **P4 – Observable to Signal Conversion:** Transform observables to signals with `toSignal()` for template-bound state. This enables OnPush optimization and simplifies templates. The `toSignal()` function subscribes to the observable and updates the signal value automatically, handling cleanup on component destruction.

## Do / Don't Guidelines

### Do
- Use `signal()` for mutable state, `computed()` for derived state, `toSignal()` for observables
- Apply `ChangeDetectionStrategy.OnPush` to all new component decorators
- Use `effect()` for side effects like logging, storage, or analytics
- Clean up subscriptions with `takeUntilDestroyed()` when not using signals

### Don't
- Never use `async` pipe in templates (use `toSignal()` instead)
- Never use getters in templates (use `computed()` for derived values)
- Never call `ChangeDetectorRef.detectChanges()` or `markForCheck()` manually
- Never wrap static string literals or constants in signals unnecessarily

## Standard Patterns

**Component with reactive state:**
```typescript
@Component({
  selector: 'app-counter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div>{{ count() }} × 2 = {{ doubled() }}</div>`
})
export class CounterComponent {
  protected readonly count = signal(0);
  protected readonly doubled = computed(() => this.count() * 2);
  
  increment() {
    this.count.update(c => c + 1);
  }
}
```

**Observable to signal conversion:**
```typescript
@Component({
  selector: 'app-notifications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div>Unread: {{ unreadCount() }}</div>`
})
export class NotificationsComponent {
  private readonly service = inject(NotificationService);
  protected readonly unreadCount = toSignal(this.service.unread$, { initialValue: 0 });
}
```

**Side effects with effect():**
```typescript
export class AnalyticsComponent {
  private readonly activeTab = signal<string>('overview');
  private readonly analytics = inject(AnalyticsService);
  
  constructor() {
    effect(() => {
      this.analytics.trackTabView(this.activeTab());
    });
  }
}
```

## Implementation Checklist

- [ ] Does the component use `ChangeDetectionStrategy.OnPush`?
- [ ] Are all reactive values using `signal()` or `computed()` instead of class properties?
- [ ] Are template-bound observables converted to signals with `toSignal()` instead of `async` pipe?
- [ ] Are there any template getters that should be `computed()` instead?
- [ ] Are side effects using `effect()` rather than manual subscriptions?

## Common Pitfalls

- ❌ **Using async pipe for template-bound state:** Prevents OnPush optimization and creates verbose templates. Convert template-bound observables to signals with `toSignal()`. For side effects or imperative logic, use `.pipe(takeUntilDestroyed()).subscribe()` instead.

- ❌ **Wrapping static content in signals:** `protected readonly title = signal('Welcome')` for unchanging text wastes memory. Use plain properties for static values.

- ❌ **Template getters with OnPush:** Getters don't trigger change detection with OnPush strategy. Use `computed()` for derived values.

- ❌ **Manual change detection calls:** Calling `detectChanges()` or `markForCheck()` indicates missing signal usage or architectural issues. Fix the root cause.

- ❌ **Retrofitting OnPush without testing:** Converting existing Default components to OnPush requires validation. Only convert during refactoring with proper testing.

## Exceptions

- **OnPush conversion:** Apply to all new components. For existing components, only convert when refactoring with proper testing—retrofitting OnPush without validation is risky.

- **async pipe:** Acceptable for simple template-only observables in read-only contexts (e.g., route params in legacy code).

- **Manual change detection:** Required for framework integration code (custom form controls, third-party library wrappers).

## Trade-offs

When OnPush conflicts with third-party library integration (e.g., libraries that mutate state outside Angular's zone), prefer correctness over performance. Use Default strategy and document why OnPush was skipped.

When signal conversion requires extensive refactoring, prefer incremental migration. Convert one component at a time rather than attempting wholesale changes.

## Related Files

- `.kiro/steering/topics/angular-performance/template-optimization.md` – Template patterns
- `.kiro/steering/topics/angular-performance/zone-js-and-async-operations.md` – Async handling
- `.kiro/steering/topics/ssr/ssr-rxjs-and-http.md` – Observable patterns
