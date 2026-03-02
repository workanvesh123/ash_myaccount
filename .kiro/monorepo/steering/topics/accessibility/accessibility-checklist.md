---
inclusion: manual
---

# Accessibility Checklist

> Use this checklist when creating or modifying interactive components to ensure WCAG 2.2 Level AA compliance and accessibility best practices are followed.

## Semantic HTML & Component Selection

- [ ] Semantic HTML elements used (`<button>`, `<a>`, `<input>`, `<nav>`, `<main>`) instead of divs
- [ ] Navigation (URL change) uses `<a>` with `ds-button` or `ds-pill` styling
- [ ] JavaScript actions use `<button>` with `ds-button` or `ds-pill` styling
- [ ] Display-only elements use `DsBadge` (not interactive)
- [ ] Form controls use appropriate DS components (`DsSwitch`, `DsCheckbox`, `DsRadioButton`)
- [ ] Loading states use `DsLoadingSpinner` or `DsProgressBar` appropriately
- [ ] Design System components used instead of custom UI (built-in accessibility)

## ARIA Attributes & Roles

- [ ] All ARIA attributes use `[attr.aria-*]` bindings (not static attributes)
- [ ] Interactive elements have appropriate `role` attributes when needed
- [ ] `aria-label` or `aria-labelledby` provided for icon-only buttons
- [ ] `aria-describedby` links inputs to help text and error messages
- [ ] `aria-expanded` used for expandable elements (menus, accordions, dropdowns)
- [ ] `aria-checked` used for checkboxes, switches, radio buttons
- [ ] `aria-disabled` set when elements are disabled (with `[attr.disabled]`)
- [ ] `aria-live` regions used for dynamic content updates (toasts, alerts, loading)
- [ ] `aria-hidden="true"` applied to decorative icons and non-interactive elements
- [ ] `Renderer2.setAttribute()` used for dynamic ARIA attributes (SSR-safe)

## Keyboard Navigation

- [ ] All interactive elements keyboard accessible (`Tab`, `Enter`, `Space`, `Escape`)
- [ ] `tabindex` uses only `-1` (programmatic) or `0` (natural order), never positive values
- [ ] Arrow key navigation implemented for lists, menus, tabs (Home/End for first/last)
- [ ] `Escape` key closes dismissible overlays (modals, menus, tooltips)
- [ ] `event.preventDefault()` called on arrow keys to prevent page scrolling
- [ ] Dynamic `[attr.tabindex]` bindings used for disabled states (`disabled ? -1 : 0`)
- [ ] Keyboard event handlers implemented for custom interactive components

## Focus Management

- [ ] Programmatic `.focus()` calls wrapped in `afterNextRender()` or `afterRenderEffect()`
- [ ] Focus restored to trigger element after closing modals/menus
- [ ] Focus trapped within modal dialogs (cannot escape to background)
- [ ] Focus indicators visible (CSS `:focus-visible` applied)
- [ ] No `.focus()` calls in constructors or `ngOnInit()`
- [ ] Focus management works with keyboard-only navigation

## SSR Compatibility

- [ ] `Renderer2.setAttribute()` used for all ARIA attribute manipulation (not direct DOM)
- [ ] ARIA attributes included in server-rendered HTML (semantic structure complete)
- [ ] Live region announcements skip execution on server
- [ ] Component works without JavaScript (progressive enhancement)

## Testing & Validation

- [ ] Axe-core tests pass in Storybook (via `@storybook/addon-a11y`)
- [ ] Axe-core tests included in unit tests (`jest-axe` or `axe-playwright`)
- [ ] Manual keyboard navigation tested (`Tab`, `Enter`, `Space`, `Escape`, arrow keys)
- [ ] Screen reader tested (NVDA on Windows or VoiceOver on Mac)
- [ ] Color contrast meets WCAG AA standards (4.5:1 text, 3:1 UI components)
- [ ] Touch targets meet minimum size (44x44px)
- [ ] Any disabled a11y tests documented with justification in story parameters

## Content & Visual Design

- [ ] All images have descriptive `alt` attributes (or `alt=""` for decorative)
- [ ] Icon-only buttons have `aria-label` or visible text
- [ ] Heading hierarchy follows logical structure (`<h1>` → `<h6>`)
- [ ] Color not used alone to convey information (text or icons provided)
- [ ] Text alternatives provided for non-text content
- [ ] Link text is descriptive (not "click here" or "read more")

## Common Anti-Patterns to Avoid

- [ ] No `<div>` or `<span>` used for buttons/links (use semantic HTML)
- [ ] No static ARIA attributes in templates (use `[attr.aria-*]` bindings)
- [ ] No `tabindex` values > 0 (disrupts natural tab order)
- [ ] No missing `aria-describedby` for form controls with help text
- [ ] No direct DOM manipulation for ARIA (`element.setAttribute()`)
- [ ] No disabled a11y tests without documented justification
- [ ] No reliance solely on automated tests (manual testing required)

For detailed patterns and examples, refer to:
- `.kiro/steering/topics/accessibility/accessibility-overview-and-principles.md`
- `.kiro/steering/topics/accessibility/accessibility-aria-and-component-contracts.md`
- `.kiro/steering/topics/accessibility/accessibility-keyboard-and-focus.md`
- `.kiro/steering/topics/accessibility/accessibility-ssr-and-rendering.md`
- `.kiro/steering/topics/accessibility/accessibility-testing-and-tooling.md`
- `.kiro/steering/workflows/accessibility-workflow.md`