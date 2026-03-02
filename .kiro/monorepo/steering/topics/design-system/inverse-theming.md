---
inclusion: manual
---

# Design System Inverse Theming

## 1. Scope – When to Read This

### This file applies when you:
- Display design system components on dark backgrounds
- Migrate legacy dark-themed components to design system
- Build navigation bars, modals, cards with dark surfaces
- Implement theme-aware components that switch between light/dark

### This file does NOT cover:
- General design system component usage (see `component-selection.md`)
- Semantic token usage (see `semantic-tokens.md`)
- Component composition patterns (see `component-composition.md`)

**Rule:** If DS components appear on dark backgrounds, apply inverse. Otherwise, defer to other DS steering files.

---

## 2. Core Principles

- **P1 – Inverse for Contrast:** Always apply `[inverse]="true"` to DS components on dark backgrounds. Without it, components become invisible or unreadable.
- **P2 – Cascade Consistently:** Apply inverse to ALL child DS components in dark containers. Never mix inverse and non-inverse in the same dark context.
- **P3 – Never Invert on Light:** Inverse on light backgrounds creates poor contrast. Only use inverse when the background is semantically dark.
- **P4 – Use Computed Signals:** For dynamic theming, use `computed()` signals to derive inverse state from theme configuration.

---

## 3. Do / Don't Guidelines

### Do
- Apply `[inverse]="true"` to every DS component in dark containers
- Use `computed()` signals for dynamic inverse based on theme state
- Cascade inverse to all nested DS components (badges in buttons, alerts in modals)
- Use `dsThemeConfig` for centralized inverse management across features

### Don't
- Use inverse on light backgrounds (creates poor contrast)
- Mix inverse and non-inverse DS components in the same dark container
- Apply manual dark styling classes when DS inverse is available
- Forget to apply inverse to nested components (badges, notification bubbles, icons)

---

## 4. Standard Patterns

### Static Dark Background
```html
<div style="background: #000000;">
  <button ds-button [inverse]="true">Visible</button>
  <ds-badge [inverse]="true">Status</ds-badge>
</div>
```

### Dynamic Theme-Based Inverse
```typescript
export class Component {
  isDarkTheme = signal(false);
  shouldInvert = computed(() => this.isDarkTheme());
}
```
```html
<button ds-button [inverse]="shouldInvert()">Button</button>
```

### Cascading Inverse in Complex Components
```html
<ds-modal [inverse]="true">
  <ds-modal-header>
    <button slot="close" ds-button-icon [inverse]="true">×</button>
  </ds-modal-header>
  <ds-modal-content>
    <ds-alert [inverse]="true">Alert</ds-alert>
    <button ds-button [inverse]="true">Action</button>
  </ds-modal-content>
</ds-modal>
```

### Theme Configuration
```typescript
const themeConfig = {
  'dark-navigation': {
    DsPill: { variant: 'strong', inverse: true },
    DsNotificationBubble: { variant: 'neutral', inverse: true }
  }
};
```
```html
<button ds-pill dsThemeConfig="dark-navigation">Nav Item</button>
```

---

## 5. Implementation Checklist

- [ ] Are all DS components on dark backgrounds using `[inverse]="true"`?
- [ ] Are nested DS components (badges, bubbles, icons) also inverted?
- [ ] Is inverse state derived from signals for dynamic theming?
- [ ] Have you removed manual dark styling classes in favor of DS inverse?
- [ ] Does the component avoid using inverse on light backgrounds?

---

## 6. Common Pitfalls & Anti-Patterns

- ❌ **Missing inverse on dark background**
  - Component becomes invisible or unreadable due to poor contrast
- ❌ **Mixing inverse and non-inverse in same container**
  - Creates inconsistent contrast and visual confusion
- ❌ **Using inverse on light backgrounds**
  - Inverts colors unnecessarily, creating poor contrast
- ❌ **Forgetting nested components**
  - Parent has inverse but child badges/bubbles don't, causing visibility issues
- ❌ **Manual dark classes instead of inverse**
  - Bypasses design system theming, creates maintenance burden

---

## 7. Small Examples

```html
<!-- ✅ Correct: All components inverted on dark background -->
<nav style="background: var(--semantic-color-surface-base);">
  <button ds-pill [inverse]="true">Home</button>
  <button ds-pill [inverse]="true">
    Games
    <ds-notification-bubble slot="end" [inverse]="true">5</ds-notification-bubble>
  </button>
</nav>

<!-- ❌ Wrong: Missing inverse on nested bubble -->
<nav style="background: var(--semantic-color-surface-base);">
  <button ds-pill [inverse]="true">
    Games
    <ds-notification-bubble slot="end">5</ds-notification-bubble>
  </button>
</nav>

<!-- ❌ Wrong: Inverse on light background -->
<div style="background: #ffffff;">
  <button ds-button [inverse]="true">Poor contrast</button>
</div>
```

---

## 8. Escalation & Trade-offs

- If inverse conflicts with legacy styling:
  - Prefer DS inverse over manual dark classes for consistency and maintainability
- If unsure whether background is "dark enough":
  - Test contrast ratios or default to non-inverse for light/medium backgrounds
- If theme switches dynamically:
  - Use computed signals to derive inverse from theme state, never hardcode

**Rule:** When in doubt, test visually on both light and dark backgrounds. Favor design system inverse over custom solutions.

---

## 9. Related Steering Files

- `.kiro/steering/topics/design-system/component-selection.md` – Choosing DS components
- `.kiro/steering/topics/design-system/component-composition.md` – Nesting patterns
- `.kiro/steering/topics/design-system/semantic-tokens.md` – Token usage for backgrounds
