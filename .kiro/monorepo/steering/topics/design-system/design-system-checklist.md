---
inclusion: manual
---

# Design System Integration Checklist

> Use this checklist when integrating, migrating, or composing design system components. Covers component selection, composition, theming, styling, and migration validation.

---

## Component Selection

- [ ] Does it navigate to a different page? Use `<a>` with `ds-button` or `ds-pill`, not `<button>`
- [ ] Does it perform a JavaScript action? Use `<button>` with `ds-button` or `ds-pill`, not `<a>`
- [ ] Is it interactive (clickable)? Use DsButton/DsPill/DsSwitch, not DsBadge
- [ ] Is it a form control? Choose DsSwitch (binary toggle), DsCheckbox (optional), or DsRadioButton (exclusive)
- [ ] Is it loading? Use DsLoadingSpinner (unknown duration) or DsProgressBar (trackable progress)
- [ ] Have you chosen appropriate size and variant based on visual hierarchy, not legacy pixel matching?

---

## Component Composition

- [ ] Are conditionals (`@if`/`@for`) wrapped in container elements before applying slot attributes?
- [ ] Are multiple components in a single slot wrapped in a semantic container (`<div slot="end">`)?
- [ ] Is surface hierarchy maintained (no elevation jumps) in nested containers?
- [ ] Are badges placed in `slot="end"` of list items for consistent alignment?
- [ ] Have you avoided nesting menu components or creating submenu patterns?
- [ ] Are signals used for reactive composition instead of manual subscriptions?

---

## Inverse Theming

- [ ] Are all DS components on dark backgrounds using `[inverse]="true"`?
- [ ] Are nested DS components (badges, notification bubbles, icons) also inverted?
- [ ] Is inverse state derived from `computed()` signals for dynamic theming?
- [ ] Have you avoided using inverse on light backgrounds?
- [ ] Are all child DS components in dark containers consistently inverted (no mixing)?

---

## Semantic Tokens & Styling

- [ ] Are you using semantic tokens (`--semantic-*`) instead of hardcoded values or reference tokens?
- [ ] Have you avoided applying `[style]`, `[class]`, or utility classes to DS component hosts?
- [ ] Are you using proper token categories (color, spacing, typography, radius)?
- [ ] Are you using state variants (`-base`, `-hover`, `-active`) for interactive elements?
- [ ] Have you avoided overriding DS component CSS custom properties (`--ds-button-*`, `--ds-card-*`)?
- [ ] Are layout concerns handled by wrapper elements, not classes on DS hosts?

---

## Utility Classes

- [ ] Are you using `ds-*` utilities for typography and spacing instead of custom CSS?
- [ ] Have you avoided applying utilities to DS component hosts?
- [ ] Are you using appropriate typography utilities (`ds-headline-*`, `ds-body-*`, `ds-label-*`)?
- [ ] Are you using `-strong` variants for emphasized text instead of custom `font-weight`?
- [ ] Have you combined utilities for layout instead of writing duplicate custom CSS?

---

## Migration Validation

- [ ] Have you verified all defaults match visually (sizes, spacing, positioning)?
- [ ] Have you analyzed structural requirements before changing markup?
- [ ] Have you updated HTML, CSS, and JavaScript together (never partial)?
- [ ] Have you used DS theming attributes (`[inverse]`, `variant`) instead of inline styles?
- [ ] Have you avoided `display: contents` on DS component parents?
- [ ] Have you tested across all themes (light/dark) and viewports (mobile/desktop)?
- [ ] Have you removed legacy CSS classes and custom styling that conflicts with DS?
- [ ] Have you validated that event handlers and form controls still function correctly?

---

## Common Anti-Patterns to Avoid

- [ ] Not assuming DS defaults match legacy (always verify visually)
- [ ] Not changing structure in isolation (maintain parent context)
- [ ] Not updating only HTML without CSS/JS (update all layers together)
- [ ] Not using inline styles to override DS theming (use component inputs)
- [ ] Not applying conditionals directly to elements with slot attributes (wrap in containers)
- [ ] Not mixing inverse and non-inverse in same dark container (cascade consistently)
- [ ] Not applying layout classes to DS component hosts (use wrappers)

---

## Related Steering Files

For detailed rules and examples, refer to:
- `.kiro/steering/topics/design-system/component-selection.md` – Choosing the right component
- `.kiro/steering/topics/design-system/component-composition.md` – Nesting and slots
- `.kiro/steering/topics/design-system/inverse-theming.md` – Dark background patterns
- `.kiro/steering/topics/design-system/semantic-tokens.md` – Token usage and styling restrictions
- `.kiro/steering/topics/design-system/utility-classes.md` – Typography and spacing utilities
- `.kiro/steering/topics/design-system/ds-migration-anti-patterns.md` – Common mistakes (73% of bugs)
- `.kiro/steering/topics/design-system/ds-migration-risk-assessment.md` – Complexity evaluation
- `.kiro/steering/topics/design-system/ds-migration-testing-checklist.md` – Test planning