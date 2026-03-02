---
inclusion: manual
---

# Design System Utility Classes

## 1. Scope – When to Read This

### This file applies when you:
- Styling application components with consistent typography, spacing, or layout
- Migrating legacy CSS to design system patterns
- Applying padding, margin, or text styles in templates
- Building layouts with design system components

### This file does NOT cover:
- Styling DS component internals (see `semantic-tokens.md`)
- Component selection or composition (see `component-selection.md`, `component-composition.md`)
- Inverse theming (see `inverse-theming.md`)

**Rule:** Use utilities for application-level styling. Never apply them to DS component hosts.

---

## 2. Core Principles

- **P1 – Utilities over custom CSS:** Always use `ds-*` utility classes for typography and spacing instead of writing custom CSS. Utilities are token-based and theme-aware.
- **P2 – Never on DS hosts:** Never apply utility classes directly to design system component hosts (`<ds-button>`, `<ds-card>`, etc.). Use wrapper elements or component inputs.
- **P3 – Token-generated, never override:** Utilities are generated from semantic tokens. Never override utility values with `!important` or custom CSS.
- **P4 – Combine, don't duplicate:** Use multiple utilities together for complex layouts. Never create custom utility classes that duplicate DS functionality.

---

## 3. Do / Don't Guidelines

### Do
- Use `ds-p-*` and `ds-m-*` for all padding and margin
- Use `ds-headline-*`, `ds-body-*`, `ds-label-*` for typography
- Combine utilities for layout patterns (`ds-p-lg ds-m-md`)
- Use `-strong` variants for emphasized text (`ds-body-md-strong`)
- Wrap DS components in containers with utilities

### Don't
- Apply utilities to DS component hosts (`<ds-button class="ds-p-lg">`)
- Mix utilities with custom font/spacing properties
- Override utility token values with `!important`
- Create duplicate utility classes
- Use inline styles for spacing/typography

---

## 4. Standard Patterns

### Typography Hierarchy
```html
<!-- Page structure -->
<h1 class="ds-display-lg">Hero Headline</h1>
<h2 class="ds-headline-xl">Page Title</h2>
<h3 class="ds-headline-lg">Section Title</h3>
<h4 class="ds-title-lg">Card Title</h4>
<p class="ds-body-md">Standard body text</p>
<small class="ds-label-sm">Helper text</small>
```

### Spacing Patterns
```html
<!-- Container with padding and margin -->
<div class="ds-p-lg ds-m-md">
  <h2 class="ds-headline-lg ds-m-sm">Title</h2>
  <p class="ds-body-md">Content</p>
</div>
```

### Wrapper Pattern for DS Components
```html
<!-- ✅ Correct: Wrapper with utilities -->
<div class="ds-p-lg ds-m-md">
  <ds-button variant="filled">Action</ds-button>
</div>

<!-- ❌ Wrong: Utilities on DS host -->
<ds-button class="ds-p-lg ds-m-md">Action</ds-button>
```

### SCSS Extension Pattern
```scss
.custom-component {
  @extend .ds-p-md;
  @extend .ds-body-md;
  
  // Additional custom styling with semantic tokens
  background: var(--semantic-color-surface-container-base);
}
```

---

## 5. Implementation Checklist

- [ ] Are you using `ds-*` utilities instead of custom padding/margin/font styles?
- [ ] Have you avoided applying utilities to DS component hosts?
- [ ] Are you using appropriate typography utilities (`ds-headline-*`, `ds-body-*`, `ds-label-*`)?
- [ ] Are you using `-strong` variants for emphasized text instead of custom `font-weight`?
- [ ] Have you combined utilities for layout instead of writing custom CSS?

---

## 6. Common Pitfalls & Anti-Patterns

- ❌ **Utilities on DS hosts:** Applying `class="ds-p-lg"` to `<ds-button>` breaks component encapsulation and causes styling conflicts.
- ❌ **Mixing utilities with custom properties:** Using `@extend .ds-body-md` then overriding `font-weight` defeats the purpose of token-based utilities.
- ❌ **Overriding utility values:** Using `.ds-p-lg { padding: 20px !important; }` breaks the token system and theme consistency.
- ❌ **Creating duplicate utilities:** Writing `.my-padding-lg { padding: 24px; }` duplicates `ds-p-lg` and bypasses token updates.
- ❌ **Inline styles for spacing:** Using `style="padding: 16px"` instead of `class="ds-p-md"` breaks theme consistency and token updates.

---

## 7. Small Examples

```html
<!-- ✅ Card layout with utilities -->
<ds-card>
  <div class="ds-p-lg">
    <h3 class="ds-title-lg ds-m-sm">Card Title</h3>
    <p class="ds-body-md ds-m-md">Description text</p>
    <ds-button variant="filled">Action</ds-button>
  </div>
</ds-card>

<!-- ❌ Avoid: Utilities on DS components -->
<ds-card class="ds-p-lg">
  <h3 class="ds-title-lg">Card Title</h3>
  <ds-button class="ds-m-md">Action</ds-button>
</ds-card>
```

```scss
// ✅ Migration: Legacy to utilities
.legacy-component {
  padding: 16px;
  font-size: 18px;
  font-weight: 600;
}

.migrated-component {
  @extend .ds-p-md;
  @extend .ds-body-lg-strong;
}
```

---

## 8. Escalation & Trade-offs

- If utilities conflict with legacy design requirements, prefer utilities and adjust design to match token system.
- If custom spacing is absolutely required (rare), use semantic tokens directly: `padding: var(--semantic-spacing-container-padding-lg);`
- When migrating, replace all legacy spacing/typography with utilities in a single commit to avoid partial states.

**Rule:** Favor utilities over custom CSS. Only use semantic tokens directly when utilities don't cover the use case.

---

## 9. Related Steering Files

- `.kiro/steering/topics/design-system/semantic-tokens.md` – Token usage and DS component styling restrictions
- `.kiro/steering/topics/design-system/component-composition.md` – Wrapper patterns for DS components
- `packages/design-system/tokens/README.md` – Token documentation
