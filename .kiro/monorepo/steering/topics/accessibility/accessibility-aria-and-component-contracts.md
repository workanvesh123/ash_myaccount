---
inclusion: manual
---

# ARIA & Component Accessibility Contracts

## 1. Scope – When to Read This

### This file applies when you:
- Creating or modifying Design System components
- Adding interactive elements (buttons, forms, modals, menus)
- Implementing keyboard navigation or focus management
- Writing component tests that verify accessibility
- Integrating third-party UI libraries

### This file does NOT cover:
- Color contrast and visual design (see Themepark documentation)
- Content accessibility (alt text, heading structure) – content writer responsibility
- Backend API accessibility concerns

**Rule:** If you're building UI that users interact with, ARIA attributes and accessibility contracts are mandatory.

---

## 2. Core Principles

- **P1 – Native HTML First:** Use semantic HTML elements (`<button>`, `<a>`, `<input>`) over custom divs with ARIA. ARIA supplements, never replaces, proper HTML.
- **P2 – WCAG 2.2 Level AA Compliance:** All components must meet WCAG 2.2 AA standards. This is non-negotiable for keyboard navigation, screen readers, and focus management.
- **P3 – Component Contract Stability:** ARIA attributes are part of the public API. Breaking changes to `aria-*` attributes require deprecation and migration paths.
- **P4 – Test with Assistive Tech:** Automated axe-core tests catch ~30% of issues. Manual keyboard and screen reader testing is required for complex components.

---

## 3. Do / Don't Guidelines

### Do
- Use `role`, `aria-label`, `aria-describedby`, `aria-labelledby` for all interactive components
- Implement keyboard navigation (`Tab`, `Enter`, `Space`, `Arrow keys`, `Escape`)
- Test with axe-core in unit tests and Storybook
- Use `[attr.aria-*]` bindings in Angular templates (not direct attributes)
- Provide `aria-live` regions for dynamic content updates (toasts, alerts, loading states)

### Don't
- Apply ARIA to non-interactive elements without semantic meaning
- Use `aria-label` when visible text exists (use `aria-labelledby` instead)
- Forget `aria-disabled` when disabling interactive elements
- Skip keyboard event handlers (`keydown`, `keyup`) for custom interactive components
- Use `tabindex` values other than `-1`, `0`, or natural tab order

---

## 4. Standard Patterns

### Widget Attributes (Interactive Components)
- `aria-checked` – Checkboxes, switches, radio buttons (boolean or "mixed")
- `aria-disabled` – Buttons, inputs when disabled (use with `[attr.disabled]`)
- `aria-expanded` – Menus, accordions, dropdowns (boolean)
- `aria-pressed` – Toggle buttons, pills (boolean)
- `aria-selected` – Tabs, list items, pagination indicators (boolean)

### Live Region Attributes (Dynamic Content)
- `aria-live="polite"` – Non-urgent updates (help text, validation messages)
- `aria-live="assertive"` – Urgent updates (errors, alerts)
- `aria-busy="true"` – Loading spinners, async operations
- `aria-atomic="true"` – Announce entire region, not just changes

### Relationship Attributes (Associations)
- `aria-describedby` – Link input to help text or error messages (use generated IDs)
- `aria-labelledby` – Link component to visible label (prefer over `aria-label`)
- `aria-controls` – Link trigger to controlled element (menus, modals)

### SSR-Safe ARIA Implementation
- Use `Renderer2.setAttribute()` for dynamic ARIA attributes, never direct DOM manipulation
- Compute ARIA values in signals or computed properties, bind with `[attr.aria-*]`

---

## 5. Implementation Checklist

- [ ] Does the component use semantic HTML (`<button>`, `<a>`, `<input>`) where applicable?
- [ ] Are all interactive elements keyboard accessible (`Tab`, `Enter`, `Space`, `Escape`)?
- [ ] Do all ARIA attributes use `[attr.aria-*]` bindings (not static attributes)?
- [ ] Are dynamic content updates announced via `aria-live` regions?
- [ ] Does the component have axe-core tests covering ARIA attributes?
- [ ] Have you manually tested with keyboard navigation and screen reader?

---

## 6. Common Pitfalls & Anti-Patterns

- ❌ **Static ARIA attributes in templates**
  - Use `[attr.aria-label]="label()"` not `aria-label="label"`. Static attributes break when values change.
- ❌ **Missing `aria-describedby` for form controls**
  - Input fields must link to help text and error messages via `aria-describedby` with generated IDs.
- ❌ **Forgetting `aria-disabled` on disabled buttons**
  - Disabled buttons need both `[attr.disabled]` and `[attr.aria-disabled]="true"` for screen readers.
- ❌ **Using `aria-label` when visible text exists**
  - Prefer `aria-labelledby` pointing to visible text. `aria-label` hides context from sighted users.
- ❌ **Direct DOM manipulation for ARIA**
  - Use `Renderer2.setAttribute()` for SSR safety. Direct `element.setAttribute()` breaks server rendering.

---

## 7. Small Examples

```typescript
// ✅ Correct: Button with dynamic ARIA attributes
@Component({
  selector: 'ds-button',
  host: {
    '[attr.disabled]': 'disabled() ? "" : null',
    '[attr.aria-disabled]': 'disabled() ? true : null',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.tabindex]': 'disabled() ? -1 : 0'
  }
})
export class DsButton {
  disabled = input<boolean>(false);
  ariaLabel = input<string | undefined>();
}
```

```typescript
// ❌ Avoid: Static ARIA, missing disabled state
@Component({
  selector: 'bad-button',
  template: `<button aria-label="Click me">Click</button>`
})
export class BadButton {
  // Missing aria-disabled, static aria-label, no keyboard handling
}
```

```typescript
// ✅ Correct: Input with aria-describedby linking to help text
@Component({
  selector: 'ds-input-field',
  template: `
    <input [attr.aria-describedby]="helpTextId()" />
    <span [id]="helpTextId()">{{ helpText() }}</span>
  `
})
export class DsInputField {
  helpTextId = computed(() => `help-${this.inputId()}`);
  helpText = input<string>('');
}
```

---

## 8. Escalation & Trade-offs

- If accessibility conflicts with visual design:
  - **Accessibility wins.** Adjust design to meet WCAG 2.2 AA standards.
- If ARIA complexity impacts performance:
  - **Accessibility wins.** Optimize elsewhere (change detection, lazy loading).
- If third-party library lacks ARIA:
  - Create wrapper component with proper ARIA or find accessible alternative.

**Rule:** Accessibility is a requirement, not a feature. When in doubt, consult WCAG 2.2 guidelines and test with screen readers.

---

## 9. Related Steering Files

- `.kiro/steering/packages/design-system/design-system-context.md` – Component development patterns
- `.kiro/steering/02-coding-standards.md` – Accessibility requirements
- `.kiro/steering/topics/ssr/ssr-dom-and-browser-apis.md` – SSR-safe DOM manipulation
- `.kiro/docs/accessibility-documentation-catalog.md` – Full accessibility documentation catalog
- `packages/design-system/storybook-host-app/src/introduction/accessibility-intro/` – WCAG guidelines and team responsibilities
