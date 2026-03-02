---
inclusion: manual
---

# DS Migration Architectural Boundaries

## Scope – When to Read This

### This file applies when you:
- Evaluating whether a component should be migrated to Design System
- Encountering architectural incompatibilities during DS migration
- Deciding between custom implementation vs DS component
- Assessing migration suitability before starting work

### This file does NOT cover:
- How to perform DS migrations (see `ds-migration-anti-patterns.md`)
- Risk assessment for suitable components (see `ds-migration-risk-assessment.md`)
- Component selection or composition (see respective topic files)

**Rule:** Use this file to determine IF a component should be migrated. If unsuitable, maintain custom implementation and document why.

---

## Core Principles

- **P1 – Architectural Fit Over Force**: Never force a component into DS if it requires 3+ workarounds or conflicts with DS design principles. Custom implementations are valid when architecturally justified.
- **P2 – Static Theming Constraint**: DS semantic tokens are build-time static. Components requiring runtime-configurable styling from external sources (CMS, APIs) cannot use DS theming.
- **P3 – Single Responsibility**: DS components have well-defined, single responsibilities. Dual-role components (container + interactive) or complex state machines (5+ interacting states) exceed DS capabilities.
- **P4 – Risk Tolerance Alignment**: Critical flows with zero-tolerance SLAs may not tolerate migration bug risk (2-3 bugs expected for moderate-risk components).

---

## Decision Threshold: 3+ Indicators = Maintain Custom

Evaluate your component against 7 architectural indicators below. If **3 or more** apply, maintain custom implementation.

### Indicator 1: Runtime-Configurable Styling
- Colors from CMS or brand configuration APIs
- Styling changes based on external data at runtime
- Per-brand color overrides outside DS token system
- Theme values loaded from backend services

**Why incompatible**: DS semantic tokens are static build-time mappings. Runtime styling requires dynamic theme values.

### Indicator 2: Complex State Machines
- 5+ interacting state variables
- State transitions require complex business logic
- Multiple states active simultaneously
- State combinations create 10+ distinct visual outputs

**Why incompatible**: DS components support 2-3 variants. Complex state machines require separate variants for each combination, exceeding DS capabilities.

### Indicator 3: Multi-Brand Theming with External Overrides
- Different brands need different colors for same component
- Color overrides from brand config, not DS tokens
- Component appearance varies by brand beyond DS token support
- Brand-specific styling logic embedded in component

**Why incompatible**: DS theming uses semantic tokens mapped at theme level. Per-brand component overrides bypass this system.

### Indicator 4: No Clear DS Equivalent
- No DS component matches component semantics
- Migration requires 3+ workarounds to function
- Component combines multiple DS components in non-standard ways
- Component has unique interaction patterns not in DS

**Why incompatible**: Forcing workarounds creates maintenance burden and increases bug likelihood as workarounds conflict with DS internals.

### Indicator 5: Device-Specific Implementations
- Desktop and mobile versions have different structures
- Component behavior changes based on device type
- Responsive behavior requires conditional rendering of different components
- Touch vs mouse interactions require different implementations

**Why incompatible**: DS components use CSS and inputs for responsive behavior. Device-specific implementations require separate component logic per device.

### Indicator 6: Dual Role Components
- Component is both layout container and interactive element
- Component manages child layout while handling user interactions
- Component has conflicting responsibilities (container + action)
- Component styling depends on both container and interactive state

**Why incompatible**: DS components have single responsibilities. Dual-role components create complexity conflicting with DS design principles.

### Indicator 7: Critical User Flows with Zero-Tolerance
- Component in critical payment or account security flows
- Component failure directly impacts revenue
- Component has zero-tolerance SLA for bugs
- Component in user authentication or authorization flows

**Why incompatible**: Migration introduces bug risk (2-3 bugs for moderate-risk). Critical flows with zero-tolerance SLAs may not tolerate this.

---

## Evaluation Workflow

### Step 1: Check All Indicators
Review each of the 7 indicators above. Mark any that apply to your component.

### Step 2: Count Indicators
- **3+ indicators**: Maintain custom implementation (architectural boundary)
- **1-2 indicators**: Evaluate trade-offs (bug likelihood vs maintenance cost vs team familiarity)
- **0 indicators**: Proceed with DS migration (component is suitable)

### Step 3: Document Decision
If maintaining custom implementation, document in code comments:
- Which indicators were present
- Why migration was unsuitable
- Expected maintenance burden
- Plan for future re-evaluation (if any)

---

## Common Scenarios

**Payment Form**: Runtime branding + complex state machine + critical flow = Maintain custom (3 indicators)

**Product Card**: No indicators = Proceed with DS migration

**Theme Switcher**: Runtime styling + multi-brand overrides + complex state = Maintain custom (3 indicators)

**Modal Dialog**: No indicators = Proceed with DS migration (DsModal exists)

**Notification Toast**: Multiple visual states + icon integration = Evaluate (1-2 indicators, apply prevention strategies)

**Analytics Dashboard Widget**: No DS equivalent + complex state + device-specific = Maintain custom (3 indicators)

---

## Related Steering Files

- `.kiro/steering/topics/design-system/ds-migration-risk-assessment.md` – Risk evaluation for suitable components
- `.kiro/steering/topics/design-system/ds-migration-anti-patterns.md` – How to perform migrations correctly
- `.kiro/steering/topics/design-system/component-selection.md` – Choosing the right DS component
- `.kiro/steering/topics/design-system/component-composition.md` – Nesting DS components
