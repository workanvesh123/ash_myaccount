---
inclusion: manual
---

# Accessibility Overview & Principles

## 1. Scope – When to Read This

### This file applies when you:
- Starting any new component or feature development
- Reviewing accessibility requirements before implementation
- Making decisions about UI patterns and component selection
- Need high-level accessibility context before diving into specific topics

### This file does NOT cover:
- Detailed ARIA implementation (see `accessibility-aria-and-component-contracts.md`)
- Keyboard navigation patterns (see `accessibility-keyboard-and-focus.md`)
- Testing procedures (see `accessibility-testing-and-tooling.md`)
- SSR-specific accessibility concerns (see `accessibility-ssr-and-rendering.md`)

**Rule:** Read this first for accessibility context, then consult specific topic files for implementation details.

---

## 2. Core Principles

- **P1 – WCAG 2.2 Level AA Compliance:** All components and features must meet WCAG 2.2 AA standards. This is a non-negotiable requirement for keyboard navigation, screen readers, color contrast, and focus management.
- **P2 – Native HTML First:** Use semantic HTML elements (`<button>`, `<a>`, `<input>`, `<nav>`, `<main>`) over custom divs with ARIA. ARIA supplements HTML, never replaces it.
- **P3 – Keyboard Accessibility Mandatory:** Every interactive element must be operable via keyboard alone. No mouse-only interactions are permitted.
- **P4 – Design System Provides Accessibility:** DS components have built-in accessibility. Use them instead of building custom UI. If DS lacks a component, build it accessibly first, then consider DS contribution.
- **P5 – Test with Assistive Technology:** Automated axe-core tests catch ~30% of issues. Manual keyboard and screen reader testing is required for all interactive components.

---

## 3. Do / Don't Guidelines

### Do
- Use Design System components (they have built-in accessibility)
- Test with keyboard navigation (`Tab`, `Enter`, `Space`, `Escape`, arrow keys)
- Run axe-core tests in unit tests and Storybook
- Use semantic HTML and proper heading hierarchy (`<h1>` → `<h6>`)
- Provide text alternatives for images, icons, and non-text content
- Ensure color contrast meets WCAG AA standards (4.5:1 for text, 3:1 for UI components)

### Don't
- Build custom interactive components without ARIA attributes and keyboard support
- Use `<div>` or `<span>` for buttons/links (use `<button>` and `<a>`)
- Skip keyboard testing or assume mouse interactions cover all cases
- Rely solely on automated tests (manual testing with screen readers is required)
- Use color alone to convey information (provide text or icons as well)
- Apply `tabindex` values > 0 (disrupts natural tab order)

---

## 4. Standard Patterns

### Component Selection by Semantic Intent
- **Navigation (URL change):** `<a>` with `ds-button` or `ds-pill` styling
- **JavaScript action:** `<button>` with `ds-button` or `ds-pill` styling
- **Display only (non-interactive):** `DsBadge` (not clickable)
- **Form controls:** `DsSwitch` (binary), `DsCheckbox` (optional), `DsRadioButton` (exclusive choice)
- **Loading states:** `DsLoadingSpinner` (unknown duration), `DsProgressBar` (trackable progress)

### WCAG 2.2 Four Principles (POUR)
- **Perceivable:** Provide text alternatives, captions, color contrast, resizable text
- **Operable:** Keyboard accessible, sufficient time, no seizure triggers, navigable
- **Understandable:** Readable text, predictable behavior, input assistance
- **Robust:** Compatible with assistive technologies, valid HTML, proper ARIA

### Team Responsibilities
- **Developers:** Semantic HTML, ARIA attributes, keyboard navigation, focus management, screen reader support
- **Designers:** Color contrast, focus indicators, touch targets (44x44px min), visual hierarchy
- **Testers:** Automated axe-core tests, manual keyboard testing, screen reader verification
- **Content Writers:** Alt text, heading structure, clear language, link text

---

## 5. Implementation Checklist

- [ ] Does the component use semantic HTML (`<button>`, `<a>`, `<input>`) where applicable?
- [ ] Are all interactive elements keyboard accessible?
- [ ] Do all images and icons have text alternatives (`alt`, `aria-label`)?
- [ ] Does color contrast meet WCAG AA standards (4.5:1 text, 3:1 UI)?
- [ ] Are ARIA attributes present for custom interactive components?
- [ ] Have you tested with keyboard navigation and screen reader?
- [ ] Do axe-core tests pass in unit tests and Storybook?

---

## 6. Common Pitfalls & Anti-Patterns

- ❌ **Using `<div>` or `<span>` for buttons**
  - Screen readers won't announce role, keyboard navigation breaks. Use `<button>` or `<a>`.
- ❌ **Skipping keyboard testing**
  - Mouse interactions don't guarantee keyboard accessibility. Test with `Tab`, `Enter`, `Space`, arrow keys.
- ❌ **Missing text alternatives for icons**
  - Icon-only buttons need `aria-label`. Decorative icons need `aria-hidden="true"`.
- ❌ **Relying only on automated tests**
  - Axe-core catches ~30% of issues. Manual screen reader testing is required.
- ❌ **Poor color contrast**
  - Low contrast fails WCAG AA. Use semantic tokens that meet contrast requirements.
- ❌ **Breaking tab order with `tabindex` > 0**
  - Positive tabindex disrupts natural order. Use semantic HTML structure instead.

---

## 7. Small Examples

```typescript
// ✅ Correct: Semantic button with DS component
<button ds-button [variant]="'primary'" (click)="submit()">
  Submit
</button>

// ❌ Avoid: Div styled as button (not keyboard accessible, no role)
<div class="button-style" (click)="submit()">Submit</div>
```

```html
<!-- ✅ Correct: Icon button with text alternative -->
<button ds-button [variant]="'icon'" aria-label="Close dialog">
  <ds-icon name="close" aria-hidden="true"></ds-icon>
</button>

<!-- ❌ Avoid: Icon button without text alternative -->
<button ds-button [variant]="'icon'">
  <ds-icon name="close"></ds-icon>
</button>
```

---

## 8. Escalation & Trade-offs

- If accessibility conflicts with visual design:
  - **Accessibility wins.** Adjust design to meet WCAG 2.2 AA standards.
- If accessibility impacts performance:
  - **Accessibility wins.** Optimize elsewhere (change detection, lazy loading, caching).
- If third-party library lacks accessibility:
  - Create accessible wrapper component or find alternative library.
- If timeline pressure conflicts with accessibility:
  - **Accessibility is not optional.** Defer other features, not accessibility.

**Rule:** Accessibility is a requirement, not a feature. When in doubt, consult WCAG 2.2 guidelines and test with assistive technologies.

---

## 9. Related Steering Files

- `.kiro/steering/topics/accessibility/accessibility-aria-and-component-contracts.md` – ARIA implementation patterns
- `.kiro/steering/topics/accessibility/accessibility-keyboard-and-focus.md` – Keyboard navigation and focus management
- `.kiro/steering/topics/accessibility/accessibility-testing-and-tooling.md` – Testing procedures and tools
- `.kiro/steering/topics/accessibility/accessibility-ssr-and-rendering.md` – SSR-specific accessibility patterns
- `.kiro/steering/packages/design-system/design-system-context.md` – DS component accessibility requirements
- `.kiro/steering/02-coding-standards.md` – Accessibility coding standards
- `.kiro/docs/accessibility-documentation-catalog.md` – Full accessibility documentation catalog
- `packages/design-system/storybook-host-app/src/introduction/accessibility-intro/` – Comprehensive WCAG guide
