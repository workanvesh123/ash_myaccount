---
inclusion: manual
---

# Design System Component Composition

## Scope – When to Read This

### This file applies when you:
- Nest design system components (badges in list items, notification bubbles in buttons)
- Build complex component hierarchies (modals containing cards, cards with multiple badges)
- Use slots with conditional rendering (`@if`/`@for` with slot attributes)
- Compose themed components with inverse mode
- Optimize projection performance in component trees

### This file does NOT cover:
- Choosing which DS component to use (see `component-selection.md`)
- Inverse theming rules (see `inverse-theming.md`)
- Styling application components (see `semantic-tokens.md`)

**Rule:** If nesting DS components or using slots, consult this file. For single-component usage, defer to component-specific docs.

---

## Core Principles

- **P1 – Stable Projection Context:** Never apply `@if`/`@else` directly to elements with slot attributes. Always wrap conditionals in container elements to maintain stable projection resolution.
- **P2 – Respect Surface Hierarchy:** When nesting container components (modals, cards), maintain proper surface elevation order (lowest → low → high → highest) to ensure correct visual layering.
- **P3 – Semantic Slot Usage:** Use appropriate slots for component composition (`slot="end"` for badges in list items, `slot="start"` for icons). Slots define semantic positioning, not just visual placement.
- **P4 – Theme Propagation via Inputs:** Use component inputs (`[inverse]="isDark()"`) for theme state, never CSS classes. This ensures proper design system token resolution.
- **P5 – Layout via Wrappers:** Never apply layout utilities (display, positioning, spacing) to DS component hosts. Use semantic wrapper elements for layout concerns.

---

## Do / Don't Guidelines

### Do
- Place badges in `slot="end"` of list items for consistent alignment
- Use wrapper elements (`<div slot="end">`) when composing multiple components in a single slot
- Bind signals to component inputs for reactive composition (`[inverse]="isDarkMode()"`)
- Use minimal surface elevation differences to reduce rendering layers
- Wrap conditional content in container elements before applying slot attributes

### Don't
- Never nest menu components or create submenu patterns (unsupported, breaks focus trap)
- Never apply `@if`/`@for` directly to elements with slot attributes (breaks projection)
- Never nest control flow directives within projected content (creates ambiguous contexts)
- Never apply layout classes (`d-flex`, `mb-3`) directly to DS component hosts
- Never use CSS classes for theming (`[ngClass]="{'dark-theme': isDark()}"`)

---

## Standard Patterns

### Badge in List Item
```html
<!-- Single badge -->
<ds-list-item [title]="item.name">
  <ds-badge slot="end" [variant]="statusVariant()">{{ item.status }}</ds-badge>
</ds-list-item>

<!-- Multiple badges with wrapper -->
<ds-list-item [title]="user.name">
  <div slot="end" class="d-flex gap-2">
    <ds-badge variant="success">{{ user.role }}</ds-badge>
    @if (user.isNew()) {
      <ds-badge variant="primary" size="xsmall">New</ds-badge>
    }
  </div>
</ds-list-item>
```

### Notification Bubble in Button
```html
<button ds-button-icon [aria-label]="'Messages (' + count() + ' unread)'">
  <vn-icon name="messages" aria-hidden="true" />
  @if (hasNotifications()) {
    <ds-notification-bubble>{{ count() }}</ds-notification-bubble>
  }
</button>
```

### Conditional Content with Slots
```html
<!-- ✅ Correct: Wrapper for conditionals -->
<button ds-button variant="filled">
  <span slot="start">
    @if (loading()) { <ds-loading-spinner size="small" /> }
    @else { <vn-icon [name]="iconName()" /> }
  </span>
  {{ buttonText() }}
</button>

<!-- ❌ Wrong: Direct conditional on slot -->
<button ds-button variant="filled">
  @if (loading()) { <ds-loading-spinner slot="start" /> }
  @else { <vn-icon slot="start" [name]="iconName()" /> }
  {{ buttonText() }}
</button>
```

### Theme Propagation
```html
<ds-card surface="high" [inverse]="isDarkMode()">
  <ds-card-header [inverse]="isDarkMode()">
    <span slot="title">{{ title() }}</span>
  </ds-card-header>
  <ds-card-content>
    <ds-button [variant]="buttonVariant()" [inverse]="isDarkMode()">
      {{ actionText() }}
    </ds-button>
  </ds-card-content>
</ds-card>
```

---

## Implementation Checklist

- [ ] Are conditionals wrapped in container elements before applying slot attributes?
- [ ] Are multiple components in a single slot wrapped in a semantic container?
- [ ] Is surface hierarchy maintained (no elevation jumps) in nested containers?
- [ ] Are theme states propagated via component inputs, not CSS classes?
- [ ] Are layout concerns handled by wrapper elements, not classes on DS hosts?
- [ ] Are signals used for reactive composition instead of manual subscriptions?

---

## Common Pitfalls

- ❌ **Direct conditionals on slots** – Applying `@if` directly to `<element slot="x">` breaks Angular's projection resolution. Always wrap in a container.
- ❌ **Nested menus** – Menu component doesn't support hierarchical overlays. Use flat menus with dividers instead.
- ❌ **Layout classes on DS hosts** – `<ds-badge class="mb-3">` bypasses component encapsulation. Use wrapper: `<div class="mb-3"><ds-badge /></div>`.
- ❌ **Theme via CSS classes** – `[ngClass]="{'dark': isDark()}"` bypasses design system token resolution. Use `[inverse]="isDark()"`.
- ❌ **Multiple projection points in loops** – `@for (item) { <ds-badge slot="end" /> }` recalculates projection on every change. Wrap in single `<div slot="end">`.

---

## Escalation & Trade-offs

- **Composition complexity vs performance:** Prefer flat component structures over deep nesting. Each nesting level adds projection overhead.
- **Slot flexibility vs semantic clarity:** When unsure about slot usage, prefer explicit wrappers over implicit positioning. Clarity wins over brevity.
- **Theme propagation:** Always propagate `[inverse]` to all child DS components in dark containers. Consistency wins over convenience.

**Rule:** When composition patterns are unclear, favor explicit wrappers and semantic slots over clever CSS tricks. Leave a comment explaining the composition intent.

---

## Related Steering Files

- `.kiro/steering/topics/design-system/component-selection.md` – Choosing the right DS component
- `.kiro/steering/topics/design-system/inverse-theming.md` – Dark background theming rules
- `.kiro/steering/topics/design-system/semantic-tokens.md` – Styling restrictions on DS hosts
- `.kiro/steering/topics/angular-performance/change-detection-and-reactivity.md` – Signal-based reactivity patterns
