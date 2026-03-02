---
inclusion: manual
---

# Template Optimization – Topic Steering

## 1. Scope – When to Read This

### This file applies when you:
- Write or modify Angular component templates (`.html` files or inline templates)
- Optimize rendering performance or reduce change detection cycles
- Use control flow (`@if`, `@for`, `@switch`) or data binding in templates
- Apply styles or classes dynamically in templates

### This file does NOT cover:
- Change detection strategy (see `change-detection-and-reactivity.md`)
- DOM manipulation in TypeScript (see `dom-manipulation.md`)
- Image optimization (see `image-optimization.md`)

**Rule:** If you're writing template markup or bindings, consult this file for performance patterns.

---

## 2. Core Principles

- **P1 – Minimize Change Detection Work:** Avoid heavy computations in template expressions. Use signals and computed values in TypeScript instead.
- **P2 – Efficient List Rendering:** Always use `@for` with unique `track` expressions to prevent unnecessary DOM re-renders.
- **P3 – Direct Bindings Over Directives:** Use `[class.x]` and `[style.x]` instead of `ngClass`/`ngStyle` for better performance.
- **P4 – No Template Getters:** Never call methods or use getters in templates—they execute on every change detection cycle.

> These principles prevent the most common template performance issues in Angular applications.

---

## 3. Do / Don't Guidelines

### Do
- Use `@for` with `track` by unique identifier (e.g., `track item.id`)
- Use direct class/style bindings: `[class.active]="isActive()"`, `[style.color]="color()"`
- Call signals directly in templates: `{{ count() }}`, `{{ user().name }}`
- Keep template expressions simple and side-effect-free

### Don't
- Never use `ngClass` or `ngStyle` (use direct bindings instead)
- Never track by index or reference in `@for` loops
- Never call methods in templates (use signals/computed instead)
- Never use getters in templates (they run on every change detection)

> Direct bindings are faster and more explicit than directive-based approaches.

---

## 4. Standard Patterns

### Control Flow with @for
Always provide a unique `track` expression to prevent unnecessary DOM re-creation:

```typescript
@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}
```

Never track by index or reference—this causes full re-renders on data changes.

### Class and Style Bindings
Use direct property bindings instead of `ngClass`/`ngStyle`:

```typescript
// ✅ Correct: Direct bindings
<div [class.active]="isActive()" [style.color]="textColor()"></div>

// ❌ Wrong: Using ngClass/ngStyle
<div [ngClass]="{'active': isActive()}" [ngStyle]="{'color': textColor()}"></div>
```

### Signal Usage in Templates
Call signals directly—they're optimized for template rendering:

```typescript
@Component({
  template: `<div>Count: {{ count() }}</div>`
})
export class CounterComponent {
  protected readonly count = signal(0);
}
```

### Conditional Rendering
Use `@if` for simple conditionals, `@switch` for multiple branches:

```typescript
@if (isLoading()) {
  <app-spinner />
} @else {
  <app-content [data]="data()" />
}
```

---

## 5. Implementation Checklist

- [ ] Does every `@for` loop have a unique `track` expression (not index)?
- [ ] Are you using `[class.x]` and `[style.x]` instead of `ngClass`/`ngStyle`?
- [ ] Are all template expressions simple (no method calls or getters)?
- [ ] Are computed values calculated in TypeScript using `computed()`, not in templates?
- [ ] Are you calling signals with `()` in templates?

---

## 6. Common Pitfalls & Anti-Patterns

- ❌ **Tracking by index in @for loops**
  - Causes full DOM re-render when array changes, even if items are identical.

- ❌ **Using ngClass/ngStyle**
  - Slower than direct bindings and adds unnecessary abstraction layer.

- ❌ **Calling methods in templates**
  - Methods execute on every change detection cycle, causing performance issues.

- ❌ **Using getters in templates**
  - Getters run on every change detection, even if dependencies haven't changed.

- ❌ **Complex expressions in templates**
  - Heavy computations in templates block rendering and slow down change detection.

---

## 7. Small Examples

```typescript
// ✅ Correct: Unique track, direct bindings, signals
@Component({
  template: `
    @for (user of users(); track user.id) {
      <div [class.active]="user.id === activeId()">
        {{ user.name }}
      </div>
    }
  `
})
export class UserListComponent {
  protected readonly users = signal<User[]>([]);
  protected readonly activeId = signal<string | null>(null);
}
```

```typescript
// ❌ Wrong: Track by index, ngClass, method call
@Component({
  template: `
    @for (user of users(); track $index) {
      <div [ngClass]="getClasses(user)">
        {{ user.name }}
      </div>
    }
  `
})
export class UserListComponent {
  protected readonly users = signal<User[]>([]);
  
  getClasses(user: User) { // Called on every change detection!
    return { active: user.id === this.activeId() };
  }
}
```

---

## 8. Escalation & Trade-offs

- If template readability conflicts with performance:
  - Prefer performance (use computed values in TypeScript)
  - Add comments explaining complex signal compositions

- If legacy code uses `ngClass`/`ngStyle`:
  - Migrate to direct bindings when touching the file
  - Don't refactor untouched code without testing

**Rule:** When in doubt, favor explicit direct bindings over directive-based abstractions.

---

## 9. Related Steering Files

- `.kiro/steering/topics/angular-performance/change-detection-and-reactivity.md` – Signal usage, OnPush strategy
- `.kiro/steering/topics/angular-performance/dom-manipulation.md` – Renderer2, afterNextRender
- `.kiro/steering/topics/angular-performance/image-optimization.md` – NgOptimizedImage usage
