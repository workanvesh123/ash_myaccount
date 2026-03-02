---
inclusion: fileMatch
fileMatchPattern: ['packages/design-system/ui/**/*']
---

# Design System UI Library Context

## 1. Role & Scope

### Responsibility
- **Type:** UI component library
- **Purpose:** Provides 40+ standardized, accessible, themeable UI components for all product applications
- **Key components:** DsButton, DsModal, DsCard, DsBadge, DsCheckbox, DsSwitch, DsTabs, DsTooltip, DsAlert, DsPill, DsRadioButton, DsLoadingSpinner, DsDivider, and more
- **Consumers:** All product packages (sports, casino, bingo, poker, lottery, myaccount, promo, engagement, horseracing)

### Out of scope
- Product-specific business logic (belongs in product packages)
- Data fetching or state management (belongs in product data-access libs)
- Authentication, routing, or global layout (belongs in vanilla/features)
- Backend API integration (belongs in product-specific services)

## 2. Public API

- **Barrel exports:** Each component has its own barrel at `packages/design-system/ui/{component}/src/index.ts`
- **Import pattern:** `import { DsButton } from '@frontend/ui-button';`
- **Stability:** Stable API - breaking changes require migration path for all consuming products
- **Component structure:** Each component exports the component class, types, and any related utilities

**Rule:** Consumers must import from `@frontend/ui/{component}` barrel exports only. Never import from internal `src/` paths.

## 3. Internal Structure

Each component follows this structure:

```
packages/design-system/ui/{component}/
├── src/
│   ├── {component}.component.ts       # Main component implementation
│   ├── {component}.component.html     # Template
│   ├── {component}.component.scss     # Styles using semantic tokens
│   ├── {component}.component.spec.ts  # Unit tests
│   ├── {component}.types.ts           # TypeScript interfaces/types
│   └── index.ts                       # Barrel export
├── README.md                          # Component documentation
└── project.json                       # Nx configuration
```

**Placement rule:** Each component is isolated in its own directory. Shared utilities across components go in `packages/design-system/utils/`.

## 4. Angular Patterns

### Components
- **Standalone only** - all DS components use standalone architecture
- **Change detection:** `ChangeDetectionStrategy.OnPush` for all components
- **Inputs:** Use `input()` and `input.required()` for component properties. Use `model()` for properties that need to be programmatically writable (e.g., via directives or parent components calling `.set()`)
- **Outputs:** Use `output()` for events
- **State:** Use `signal()` for internal reactive state, `computed()` for derived values

**Note:** `model()` creates a two-way bindable signal that can be written to programmatically. Use it when:
- A directive needs to modify component properties (e.g., theme modifiers)
- Parent components need to imperatively update child state
- The property supports two-way binding with `[(property)]` syntax

Use `input()` for standard one-way data flow where the parent controls the value.

### Styling
- **Semantic tokens:** Use CSS custom properties from Themepark (`--ds-color-*`, `--ds-spacing-*`, `--ds-typography-*`)
- **Inverse theming:** Support `inverse` input for dark backgrounds
- **Host bindings:** Use `@HostBinding` for component-level classes and attributes
- **No global styles:** All styles scoped to component with `:host` selector

### Accessibility
- **ARIA attributes:** All interactive components must have proper ARIA labels, roles, and states
- **Keyboard navigation:** Support standard keyboard interactions (Enter, Space, Escape, Arrow keys)
- **Focus management:** Visible focus indicators and logical focus order
- **Screen readers:** Meaningful announcements for state changes

**Rule:** Every DS component must be fully accessible and pass WCAG 2.1 AA standards.

## 5. Invariants & Contracts

### Data assumptions
- All required inputs must be provided by consumers
- Optional inputs have sensible defaults defined in component
- Input values are immutable - components react to changes via signals

### Behavioral guarantees
- Components are SSR-compatible (no direct `window`/`document` access)
- Components work in all supported browsers (see `.browserslistrc`)
- Components support both light and dark themes via `inverse` prop
- Components emit standard Angular events for user interactions

### Error handling
- Invalid input combinations log console warnings in development
- Missing required inputs throw errors at runtime
- Graceful degradation for unsupported features (e.g., CSS features in older browsers)

**Rule:** Breaking changes to component APIs require coordinated updates across all consuming products and comprehensive migration documentation.

## 6. Dependencies

### Allowed
- **Angular core:** `@angular/core`, `@angular/common`
- **Angular CDK:** For overlay, a11y, portal utilities
- **Internal DS utils:** `@frontend/design-system/utils`
- **Themepark tokens:** For semantic design tokens

### Forbidden
- **Product packages:** Never import from `@frontend/sports`, `@frontend/casino`, etc.
- **Vanilla features:** Avoid dependencies on `@frontend/vanilla/features` (use vanilla/core utilities only if necessary)
- **Third-party UI libraries:** No Material, Bootstrap, or other component libraries
- **Direct DOM manipulation:** Use `Renderer2` or Angular APIs only

**Rule:** Design system must remain dependency-free from product code to maintain unidirectional dependency flow.

## 7. Testing Expectations

### Test harnesses
- **Purpose:** Reusable test utilities for DS components
- **Location:** Exported alongside component from barrel (`@frontend/ui/{component}`)
- **Usage:** Developers create test harnesses for DS components and export them for reuse in product tests
- **Pattern:** Harnesses provide programmatic API for interacting with component in tests

### Unit tests
- **Framework:** Jest (migrating from Karma)
- **Location:** `*.spec.ts` next to component files
- **Coverage focus:**
  - Component inputs and outputs
  - User interactions (click, keyboard, focus)
  - Accessibility attributes (ARIA, roles)
  - Inverse theming behavior
  - SSR compatibility (no browser API errors)

### Accessibility tests
- **Framework:** @guidepup for screen reader testing
- **Coverage:** Verify screen reader announcements, navigation, and semantic structure
- **Location:** Alongside unit tests or in dedicated a11y test files

**Rule:** All new components require unit tests covering inputs, outputs, accessibility, and SSR. Test harnesses must be exported for reuse in product tests. Accessibility tests with @guidepup screen reader are required for interactive components.

## 8. Known Gotchas

- **SSR compatibility:** Components run on server - never access `window`, `document`, or browser APIs directly. Use `afterNextRender()` or platform checks.
- **Inverse theming:** When a component is inside a dark container, ALL nested DS components must have `inverse="true"` applied. Mixing inverse and non-inverse in the same container causes visual bugs.
- **Slot content wrapping:** When using `@if` or `@for` with slot attributes, always wrap in a container element. Never apply conditionals directly to elements with slot attributes.
- **Host element styling:** Consumers should never apply utility classes or styles directly to DS component hosts. Use wrapper elements or component inputs instead.
- **Change detection:** Components use OnPush - ensure all inputs are properly signaled or immutably updated to trigger change detection.
- **Circular dependencies:** Check `nx graph` before adding new internal dependencies between DS components.

**Rule:** When in doubt about component usage patterns, consult the detailed steering files in `.kiro/steering/design-system/components/ds-{component}.md`.
