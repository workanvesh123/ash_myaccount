---
inclusion: fileMatch
fileMatchPattern: ['packages/design-system/**/*']
---

# Design System – Package Context

## 1. Role & Scope

### What this package does
- Provides 40+ reusable UI components (buttons, modals, cards, forms, navigation, feedback)
- Enforces consistent visual design, accessibility, and theming across all products
- Manages semantic design tokens and utility classes for application styling
- Supports multi-brand theming

### What this package does NOT do
- Product-specific business logic (belongs in product packages)
- API integration or data fetching (belongs in product data-access libs)
- Routing or application-level state management (belongs in product entrypoints)
- Cross-product shared utilities unrelated to UI (belongs in vanilla)

**Decision rule:**  
If the change is about **reusable UI components, visual design, or theming**, it belongs here.  
If it's about **product features, business logic, or API integration**, it belongs in product packages.

---

## 2. Public API & Consumers

### Public surface
- Each component exports from: `packages/design-system/ui/{component}/src/index.ts`
- Import path: `@frontend/ui/{component}`
- Public exports include:
  - Component classes (e.g., `DsButton`, `DsModal`, `DsCard`)
  - Component interfaces (e.g., `DsButtonSize`, `DsModalConfig`)
  - Utility functions (e.g., token helpers, accessibility utilities)

### Who is allowed to import this package
- ✅ Allowed: All product packages (sports, casino, bingo, poker, lottery, myaccount, promo, engagement, horseracing)
- ✅ Allowed: Vanilla shared features (for cross-product UI patterns)
- ❌ Not allowed: Backend services, build tools, test utilities

**Critical rule:**  
Design system is a **dependency** of products, never the reverse. Products must never be imported into design system components.

---

## 3. Internal Structure & Component Organization

### Directory layout
```
packages/design-system/
├── ui/                        # UI component libraries
│   ├── {component}/           # Individual component libraries
│   │   ├── src/
│   │   │   ├── {component}.component.ts
│   │   │   ├── {component}.component.html
│   │   │   ├── {component}.component.scss
│   │   │   ├── {component}.component.spec.ts
│   │   │   └── index.ts       # Public API barrel
│   │   ├── project.json
│   │   └── README.md          # Component documentation
├── tokens-assets/             # Design token assets
├── tokens-to-css-feature/     # Token to CSS conversion
├── storybook-host-app/        # Storybook documentation
├── shared-ds-utils/           # Shared utilities
└── stylelint-rules/           # Custom stylelint rules
```

### Placement rules
- **New component**: Create in `ui/{component-name}/` following existing structure
- **Shared component logic**: Extract to `ui/shared/` or create a base class
- **Design tokens**: Managed via `tokens-assets/` and `tokens-to-css-feature/` (coordinate with Design System team)
- **Theme configuration**: Modify `theme-config/` for Themepark integration (coordinate with Honey Badgers team)

**Naming conventions:**
- Component selector: `ds-{component}` (e.g., `ds-button`, `ds-modal`)
- Component class: `Ds{Component}` (e.g., `DsButton`, `DsModal`)
- Input/output interfaces: `Ds{Component}{Property}` (e.g., `DsButtonSize`, `DsModalConfig`)

---

## 4. Component Development Patterns

### Component architecture
- Use **standalone components** with explicit imports
- Use **ChangeDetectionStrategy.OnPush** for all components
- Use **signals** for internal state, **inputs** for configuration
- Use **content projection** (`<ng-content>`) for flexible composition
- Support **inverse theming** via `inverse` input for dark backgrounds

### Standard component structure
```typescript
@Component({
  selector: 'ds-component',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './component.component.html',
  styleUrl: './component.component.scss'
})
export class DsComponent {
  // Configuration inputs (read-only from parent)
  size = input<DsComponentSize>('medium');
  disabled = input<boolean>(false);
  
  // Writable inputs (can be modified programmatically)
  // Use model() when directives or parent components need to call .set()
  variant = model<DsComponentVariant>('primary');
  inverse = model<boolean>(false);
  
  // Event outputs
  clicked = output<void>();
  
  // Internal state (signals)
  private readonly isHovered = signal(false);
  
  // Computed values
  protected readonly classes = computed(() => ({
    [`ds-component--${this.size()}`]: true,
    [`ds-component--${this.variant()}`]: true,
    'ds-component--inverse': this.inverse(),
    'ds-component--disabled': this.disabled()
  }));
}
```

**Input vs Model Pattern:**
- Use `input()` for standard one-way data binding (parent → child)
- Use `model()` for properties that need programmatic updates (e.g., theme directives, two-way binding)
- `model()` creates a writable signal that supports `.set()` calls
- Common `model()` use cases: `variant`, `inverse`, `selected`, theme-related properties
```

### Styling patterns
- Use **CSS custom properties** for themeable values
- Use **semantic tokens** (e.g., `--color-action-primary`) not reference tokens
- Never use hardcoded colors, spacing, or typography values
- Support **inverse mode** by swapping token values, not duplicating styles
- Use **BEM-like naming** for component-specific classes

### Accessibility requirements
- All interactive components must be keyboard accessible
- All components must have proper ARIA attributes
- All components must support screen readers
- All form controls must integrate with Angular forms (ControlValueAccessor)
- All components must meet WCAG 2.1 AA standards

---

## 5. Component Contracts & Invariants

### Input stability
- Component inputs are **stable APIs** – breaking changes require deprecation
- New inputs must have sensible defaults to avoid breaking existing usage
- Input types must be specific (enums/unions) not generic (string/any)

### Theming invariants
- All components must support `inverse="true"` for dark backgrounds
- All components must use semantic tokens, never reference tokens directly
- Token values must never be overridden by consumers
- Component CSS custom properties are internal implementation details

### Composition rules
- Components must support content projection for flexible layouts
- Slot elements must never have structural directives (`@if`, `@for`) applied directly
- Consumers must wrap slot content in container elements for conditionals
- Components must not make assumptions about projected content structure

---

## 6. Dependencies

### Allowed dependencies
- `@angular/core`, `@angular/common`, `@angular/forms` (framework essentials)
- `@frontend/vanilla/core` (for SSR-safe utilities like `WINDOW`, `TimerService`)
- `@frontend/vanilla/ssr` (for platform detection, SSR utilities)
- `@frontend/themepark` (for theming integration)

### Forbidden dependencies
- Any product package (`@frontend/sports`, `@frontend/casino`, etc.)
- Any product-specific shared library
- Heavy third-party UI libraries (prefer native implementations)
- Direct browser APIs without SSR guards (use vanilla utilities)

### Third-party usage
- Minimize external dependencies to reduce bundle size
- Prefer native browser APIs over libraries when possible
- Wrap third-party dependencies in services for testability
- Document any required peer dependencies in component README

---

## 7. Testing Requirements

### Unit tests
- Test files: `{component}.component.spec.ts` alongside source
- Required coverage:
  - All input combinations and their visual/behavioral effects
  - All output events and their trigger conditions
  - Accessibility attributes (ARIA, roles, keyboard navigation)
  - Inverse theming behavior
  - Form control integration (if applicable)
- Tools: Jest + Angular Testing Library

### Visual regression tests
- Storybook stories for all component variants
- Visual snapshots for critical states (default, hover, focus, disabled, inverse)
- Cross-browser testing for layout-critical components

### Accessibility tests
- Automated: axe-core integration in unit tests
- Manual: Keyboard navigation, screen reader testing for complex components

**Rule:**  
Any new component or input must include tests covering all variants and states. Breaking changes to public APIs must be caught by failing tests.

---

## 8. Migration & Deprecation

### Active migration
- Legacy CSS classes → Design system components (ongoing)
- Products are migrating from custom UI to standardized DS components
- Migration tooling available via MCP tools (see `.kiro/steering/topics/design-system/`)

### Deprecation process
1. Mark deprecated API with `@deprecated` JSDoc tag and migration path
2. Add console warning in development mode
3. Update documentation with migration guide
4. Maintain deprecated API for at least 2 major versions
5. Remove after all products have migrated

### Legacy patterns (avoid)
- Direct CSS class application (use component inputs instead)
- Overriding component styles (use inputs or semantic tokens)
- Mixing inverse and non-inverse components in same container
- Applying utility classes to component hosts (use wrapper elements)

---

## 9. Known Pitfalls & FAQ

### Common mistakes
- **Applying `@if`/`@for` to slot elements**: Always wrap projected content in container elements for structural directives
- **Forgetting `inverse="true"` on dark backgrounds**: All DS components in dark containers must have inverse applied
- **Overriding component styles**: Use component inputs or semantic tokens, never override internal CSS
- **Using reference tokens in applications**: Applications must use semantic tokens, not reference tokens
- **Applying utility classes to component hosts**: Utility classes must be applied to wrapper elements, not DS component selectors

### Performance considerations
- Components use OnPush change detection – ensure inputs are immutable or use signals
- Avoid heavy computations in component getters (use computed signals instead)
- Use `@defer` for heavy components not immediately visible
- Optimize SVG icons and images with NgOptimizedImage

### SSR compatibility
- All components must be SSR-safe (no direct `window`/`document` access)
- Use `afterNextRender()` for browser-only initialization
- Use `WINDOW` token from `@frontend/vanilla/core` for browser APIs
- Use `ResizeObserver` from `@frontend/vanilla/core` instead of the browser default (provides SSR-safe wrapper)
- Test components in SSR mode to catch hydration mismatches

### FAQ

**Q: When should I create a new component vs extend an existing one?**  
A: Create a new component if the use case is semantically different (e.g., button vs link). Extend via inputs if it's a visual variant of the same semantic element.

**Q: How do I handle product-specific variations?**  
A: Use content projection and composition. DS components provide structure and theming; products compose them for specific use cases.

**Q: When should something move from a product to design system?**  
A: When the component is used in 3+ products, has no product-specific logic, and provides reusable UI value across the platform.

**Q: How do I test inverse theming?**  
A: Create test cases with `inverse="true"` input and verify CSS custom property values or computed classes reflect inverse state.

**Q: What if a component needs product-specific behavior?**  
A: Use outputs for events and let products handle behavior. DS components provide UI, not business logic.
