---
inclusion: manual
---

# Design System Semantic Tokens

## Scope – When to Read This

### This file applies when you:
- Style application components with design system tokens
- Migrate legacy CSS variables to semantic tokens
- Apply colors, spacing, typography, or radius to custom components
- Work with theme-aware styling or dark mode variants

### This file does NOT cover:
- Design system component internals (handled by DS package)
- Component selection or composition (see `component-selection.md`, `component-composition.md`)
- Inverse theming patterns (see `inverse-theming.md`)

**Rule:** If styling application components with design system tokens, consult this file. For DS component usage, see component-specific files.

---

## Core Principles

- **P1 – Semantic tokens only:** Always use semantic tokens (`--semantic-*`) for application styling. Never use reference tokens (`--reference-*`) or hardcoded values.
- **P2 – Never style DS component hosts:** Never apply styles, classes, or tokens directly to DS component hosts. Use component inputs, wrapper elements, or slots.
- **P3 – Never override component tokens:** Never override DS component CSS custom properties (`--ds-button-*`, `--ds-card-*`). This breaks theming architecture.
- **P4 – Use proper token categories:** Use color tokens for colors, spacing tokens for spacing, typography tokens for text, radius tokens for borders.
- **P5 – Treat tokens as blackbox:** Never redefine or override semantic token values. They are managed by the design system.

---

## Do / Don't Guidelines

### Do
- Use semantic tokens for all application component styling
- Apply tokens to wrapper elements when customizing DS component layout
- Use state variants (`-base`, `-hover`, `-active`) for interactive elements
- Use inverse variants (`-inverse`) for dark backgrounds
- Provide fallback values when migrating legacy code

### Don't
- Never apply `[style]`, `[class]`, or utility classes to DS component hosts
- Never override `--ds-*` component CSS custom properties
- Never use reference tokens (`--reference-color-*`) in application code
- Never hardcode colors, spacing, or typography values
- Never redefine semantic token values in application CSS

---

## Standard Patterns

### Color Tokens
```scss
// ✅ Surface colors for backgrounds
.surface {
  background: var(--semantic-color-surface-base);
  color: var(--semantic-color-on-surface-base);
}

// ✅ Container colors for grouped content
.container {
  background: var(--semantic-color-surface-container-base);
}

// ✅ Status colors with semantic meaning
.status-error {
  background: var(--semantic-color-negative-container-base);
  color: var(--semantic-color-on-negative-container-base);
}
```

### Spacing Tokens
```scss
// ✅ Container padding for component interiors
.component {
  padding: var(--semantic-spacing-container-padding-md);
}

// ✅ Stack spacing for vertical gaps
.vertical-list {
  display: flex;
  flex-direction: column;
  gap: var(--semantic-spacing-stack-md);
}

// ✅ Inline spacing for horizontal gaps
.horizontal-list {
  display: flex;
  gap: var(--semantic-spacing-inline-lg);
}
```

### Typography Tokens
```scss
// ✅ Complete font definition
.headline {
  font-family: var(--semantic-typography-headline-lg-font-family);
  font-size: var(--semantic-typography-headline-lg-font-size);
  line-height: var(--semantic-typography-headline-lg-line-height);
  font-weight: var(--semantic-typography-headline-lg-font-weight);
}
```

### State Variants
```scss
// ✅ Interactive element with all states
.interactive {
  background: var(--semantic-color-surface-container-base);
  
  &:hover { background: var(--semantic-color-surface-container-hover); }
  &:active { background: var(--semantic-color-surface-container-active); }
  &:disabled { 
    background: var(--semantic-color-disabled-base);
    color: var(--semantic-color-on-disabled-base);
  }
}
```

---

## Implementation Checklist

- [ ] Are you using semantic tokens (`--semantic-*`) instead of hardcoded values?
- [ ] Are you avoiding styling DS component hosts directly?
- [ ] Are you using proper token categories (color, spacing, typography, radius)?
- [ ] Are you using state variants (`-base`, `-hover`, `-active`) for interactive elements?
- [ ] Are you using inverse variants for dark backgrounds?
- [ ] Have you provided fallback values when migrating legacy code?

---

## Common Pitfalls & Anti-Patterns

- ❌ **Styling DS component hosts directly**
  - Breaks theming architecture and component encapsulation. Use component inputs or wrapper elements.

- ❌ **Overriding component CSS custom properties**
  - `--ds-button-bg`, `--ds-card-background` are internal. Use component inputs or theme configuration.

- ❌ **Using reference tokens in application code**
  - `--reference-color-light-neutrals-100` is not exposed. Use `--semantic-color-surface-base`.

- ❌ **Hardcoding values**
  - `color: #333333` or `padding: 16px` breaks theming. Use semantic tokens.

- ❌ **Redefining semantic token values**
  - Never override `:root { --semantic-color-primary-base: ... }`. Use theme configuration.

---

## Small Examples

```html
<!-- ❌ Never: Direct styling on DS components -->
<ds-button style="background: var(--semantic-color-primary-base);">Broken</ds-button>
<ds-card [style.border-color]="'var(--semantic-color-surface-outline-base)'">Broken</ds-card>

<!-- ✅ Use component inputs -->
<ds-button variant="filled" size="large">Correct</ds-button>

<!-- ✅ Use wrapper elements for custom styling -->
<div class="custom-wrapper" style="border: 1px solid var(--semantic-color-surface-outline-base);">
  <ds-button variant="filled">Correct</ds-button>
</div>
```

```scss
// ❌ Never: Override component tokens
ds-button {
  --ds-button-color-bg: var(--semantic-color-negative-base) !important;
}

// ✅ Use wrapper classes
.danger-action-wrapper {
  border: 1px solid var(--semantic-color-negative-outline-base);
  background: var(--semantic-color-negative-container-base);
}
```

---

## Escalation & Trade-offs

- If semantic tokens conflict with legacy design requirements:
  - Prefer semantic tokens and update design to match design system
  - If legacy design must be preserved, use wrapper elements with semantic tokens
  - Never override semantic token values or component tokens

**Rule:** When trade-offs are unclear, favor design system consistency over legacy appearance. Document exceptions with comments.

---

## Related Steering Files

- `.kiro/steering/topics/design-system/inverse-theming.md` – Dark background patterns
- `.kiro/steering/topics/design-system/utility-classes.md` – Typography and spacing utilities
- `.kiro/steering/topics/design-system/component-composition.md` – Nesting DS components
- `packages/design-system/tokens/README.md` – Token documentation
- `packages/themepark/` – Theme configuration
