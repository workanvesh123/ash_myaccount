---
inclusion: manual
---

# Accessibility Testing & Tooling

## 1. Scope – When to Read This

### This file applies when you:
- Writing or modifying Design System components
- Adding unit tests for interactive UI components
- Setting up Storybook stories for components
- Debugging accessibility violations in axe-core reports
- Configuring test runners or accessibility tooling

### This file does NOT cover:
- ARIA implementation patterns (see `accessibility-aria-and-component-contracts.md`)
- Keyboard navigation patterns (see `accessibility-keyboard-and-focus.md`)
- Visual design and color contrast (designer responsibility)

**Rule:** If you're testing accessibility or configuring a11y tooling, read this file. For ARIA implementation, see component contracts.

---

## 2. Core Principles

- **P1 – Automated Testing is Baseline:** All components must pass axe-core tests in Storybook and unit tests. Automated tests catch ~30% of issues.
- **P2 – Manual Testing is Required:** Keyboard navigation and screen reader testing are mandatory for interactive components. Automation cannot replace manual verification.
- **P3 – Test Early and Often:** Run accessibility tests during development, not just before release. Fix violations immediately.
- **P4 – Disable Tests Only with Justification:** Never disable a11y tests without documenting why via `parameters.a11y.disable` with explanation.

---

## 3. Do / Don't Guidelines

### Do
- Run axe-core tests in Storybook via `@storybook/addon-a11y`
- Test keyboard navigation manually (`Tab`, `Enter`, `Space`, `Escape`, arrow keys)
- Test with screen readers (NVDA on Windows, VoiceOver on Mac)
- Configure axe rules per story when needed via `parameters.a11y.config.rules`
- Document accessibility test coverage in component README

### Don't
- Rely solely on automated tests (they miss 70% of issues)
- Disable a11y tests without explanation in story parameters
- Skip manual keyboard testing for interactive components
- Ignore axe-core violations in test output
- Test only in one browser (cross-browser a11y issues exist)

---

## 4. Standard Patterns

### Storybook Accessibility Testing
- **Addon:** `@storybook/addon-a11y` (v9.0.11) with axe-core via axe-playwright
- **Configuration:** `packages/design-system/shared-storybook-utils/.storybook/config.ts`
- **Test Runner:** `packages/design-system/shared-storybook-utils/.storybook/storybook-testrunner.ts`
- **Execution:** Tests run automatically on all stories unless disabled via `parameters.a11y.disable`

### Unit Test Accessibility Checks
```typescript
// ✅ Correct: axe-core in unit tests
import { axe, toHaveNoViolations } from 'jest-axe';

it('should have no accessibility violations', async () => {
  const fixture = TestBed.createComponent(DsButton);
  fixture.detectChanges();
  const results = await axe(fixture.nativeElement);
  expect(results).toHaveNoViolations();
});
```

### Disabling Tests with Justification
```typescript
// ✅ Correct: Disable with explanation
export const WorkshopExample: Story = {
  parameters: {
    a11y: {
      disable: true, // Intentionally inaccessible for training purposes
    },
  },
};
```

### Custom Axe Rules per Story
```typescript
// ✅ Correct: Configure rules for specific story
export const CustomRules: Story = {
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: false }, // Disable specific rule
        ],
      },
    },
  },
};
```

---

## 5. Implementation Checklist

- [ ] Does the component have Storybook stories with a11y addon enabled?
- [ ] Do unit tests include axe-core checks for accessibility violations?
- [ ] Have you manually tested keyboard navigation for all interactive states?
- [ ] Have you tested with a screen reader (NVDA or VoiceOver)?
- [ ] Are any disabled a11y tests documented with justification?
- [ ] Does the component README document accessibility testing coverage?

---

## 6. Common Pitfalls & Anti-Patterns

- ❌ **Disabling a11y tests without explanation**
  - Always document why via story parameters. Unexplained disables hide real issues.
- ❌ **Skipping manual keyboard testing**
  - Automated tests don't catch focus traps, incorrect tab order, or missing keyboard handlers.
- ❌ **Ignoring axe-core violations in CI**
  - Violations fail the build. Fix them immediately, don't disable tests to pass CI.
- ❌ **Testing only with mouse interactions**
  - Keyboard-only users cannot access mouse-only functionality. Test with keyboard first.
- ❌ **Assuming automated tests are sufficient**
  - Axe-core catches ~30% of issues. Screen reader and keyboard testing are mandatory.

---

## 7. Small Examples

```typescript
// ✅ Correct: Storybook story with a11y testing enabled (default)
export const Primary: Story = {
  args: {
    variant: 'primary',
    label: 'Click me',
  },
  // a11y addon runs automatically
};
```

```typescript
// ❌ Avoid: Disabling a11y tests without reason
export const BadExample: Story = {
  parameters: {
    a11y: { disable: true }, // Why? No explanation provided
  },
};
```

```typescript
// ✅ Correct: Unit test with axe-core
it('should be accessible', async () => {
  const { container } = render(DsButton, {
    componentProperties: { label: 'Click' },
  });
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## 8. Escalation & Trade-offs

- If accessibility testing conflicts with:
  - **Development speed:** Accessibility wins. Fix violations immediately, don't defer.
  - **Test performance:** Accessibility wins. Optimize other tests, not a11y checks.
  - **Legacy components:** Accessibility wins. Migrate or fix legacy components, don't skip tests.

**Rule:** Accessibility testing is non-negotiable. When in doubt, run manual tests and consult WCAG 2.2 guidelines.

---

## 9. Related Steering Files

- `.kiro/steering/topics/accessibility/accessibility-aria-and-component-contracts.md` – ARIA implementation patterns
- `.kiro/steering/topics/accessibility/accessibility-keyboard-and-focus.md` – Keyboard navigation testing
- `.kiro/steering/packages/design-system/design-system-context.md` – Component testing requirements
- `.kiro/docs/accessibility-documentation-catalog.md` – Full accessibility documentation catalog
- `packages/design-system/storybook-host-app/src/introduction/accessibility-intro/` – WCAG guidelines and testing tools
