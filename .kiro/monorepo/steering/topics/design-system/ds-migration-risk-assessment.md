---
inclusion: manual
---

# DS Migration Risk Assessment

## Scope – When to Read This

### This file applies when you:
- Evaluating whether to migrate a legacy component to Design System
- Planning a DS migration and need to estimate complexity
- Determining testing scope for a DS migration
- Deciding if a component is architecturally suitable for DS migration

### This file does NOT cover:
- How to perform the actual migration (see `ds-migration-anti-patterns.md`)
- Component selection criteria (see `component-selection.md`)
- Testing execution details (see `ds-migration-testing-checklist.md`)

**Rule:** Use this file BEFORE starting a migration to assess risk level and determine if migration is appropriate.

---

## Core Principles

- **P1 – Risk-Based Planning:** Migration complexity varies dramatically. Assess risk before committing to migration to avoid wasted effort on unsuitable components.
- **P2 – Architectural Boundaries:** Some components exceed DS capabilities (runtime styling, complex state machines). Maintaining custom implementations is a valid architectural decision.
- **P3 – Prevention Over Correction:** Bug count correlates directly with risk level and prevention strategy application. High-risk migrations without prevention strategies produce 8+ bugs.
- **P4 – Testing Proportionality:** Testing scope must match risk level. Low-risk components need minimal validation; high-risk components require comprehensive cross-dimensional testing.

---

## Risk Classification System

### Low Risk (0-1 expected bugs)

**Indicators (need 5-6 checked):**
- Static component with single visual state
- Used in consistent, single-context environments
- No dynamic styling from external sources
- Responsive behavior handled by parent container
- Clear DS equivalent exists without adaptations
- No complex conditional visibility logic

**Action:** Proceed with standard workflow. Test primary theme + primary viewport + spot-check 1-2 themes.

### Moderate Risk (2-3 expected bugs)

**Indicators (need 3-4 checked):**
- Multiple visual states or design variants
- Integration with icons or dynamic images
- Multi-device usage contexts (desktop, tablet, mobile)
- Custom spacing requirements beyond DS defaults
- Brand-specific styling variations
- Conditional visibility logic controlling display

**Action:** Apply all 8 prevention strategies. Test 20-30% of combinations (all states in primary theme/viewport, then spot-check other dimensions).

### High Risk (4+ expected bugs)

**Indicators (need 3+ checked):**
- Runtime-configurable styling from CMS or brand configuration systems
- Complex state machines with 5+ interacting state variables
- Multi-brand theming requiring per-context color overrides from external sources
- Device-specific implementations with divergent behavior
- Dual role components (container + interactive element)
- No clear structural equivalent in DS
- Critical to core user flows with zero-tolerance for disruption

**Action:** Evaluate architectural fit using decision tree below. If proceeding, apply all prevention strategies + comprehensive testing (50-75% of combinations).

---

## Decision Tree for High-Risk Components

**Step 1:** Does component have runtime-configurable styling from CMS/brand APIs?
- **YES** → DS semantic theming conflicts with runtime configuration. **Maintain custom implementation.**
- **NO** → Continue to Step 2.

**Step 2:** Does component have 5+ interacting state variables?
- **YES** → DS supports 2-3 variants. Complex state machines exceed DS capabilities. **Maintain custom implementation.**
- **NO** → Continue to Step 3.

**Step 3:** Does component require multi-brand color overrides outside DS token system?
- **YES** → DS theming system can't accommodate per-brand overrides. **Maintain custom implementation.**
- **NO** → Continue to Step 4.

**Step 4:** Does component require 3+ workarounds with no clear DS equivalent?
- **YES** → Migration complexity exceeds benefit. **Maintain custom implementation.**
- **NO** → Proceed with extreme caution. Apply all prevention strategies + comprehensive testing.

**If maintaining custom implementation:** Document the architectural decision and reasoning. This is a valid boundary.

---

## Bug Distribution Reference

Understanding where bugs concentrate helps prioritize prevention:

**Top 3 categories (73% of all bugs):**
1. **Default Assumption (33%)** - DS defaults don't match legacy behavior (sizes, spacing, colors)
2. **Structural Context (22%)** - Missing layout context, positioning ancestors, wrapper elements
3. **Incomplete Migration (18%)** - HTML updated but CSS/JavaScript unchanged

**Other categories:**
- Theming Conflict (7%) - Inline styles fighting DS theming
- Responsive Context (7%) - Device-specific requirements not implemented
- CSS Selector Evolution (7%) - Selectors not updated from class-based to attribute-based
- Visibility Logic (4%) - Conditional logic not adapted for new structure
- Boolean Logic Inversion (2%) - Negation logic incorrectly preserved

**Implication:** Focus prevention strategies on default verification, structural analysis, and complete migration (HTML + CSS + JS together).

---

## Testing Dimensions

Migrations require validation across multiple dimensions:

**Themes:** BetMGM, Bwin, Betboo, Ladbrokes, Coral, PartyPoker (6 themes)

**Viewports:** Desktop (1920px+), Tablet (768-1024px), Mobile (0-767px) (3 viewports)

**States:** Enabled, Disabled, Loading, Hover, Focus, Active, Pressed (7+ states)

**Contexts:** Modals, Overlays, Embedded views, Inline layouts (4+ contexts)

**Variants:** Primary, Secondary, Filled, Outline, Inverse (5+ variants)

**Risk implication:** Each dimension multiplies testing surface. Example: 3 contexts × 5 themes × 3 devices × 4 states = 180 test scenarios. Testing scope must be proportional to risk level.

---

## Standard Workflow by Risk Level

### Low Risk Workflow
1. Update HTML to use DS component
2. Remove legacy CSS targeting old selectors
3. Update TypeScript for new component API
4. Test primary theme + primary viewport
5. Spot-check 1-2 additional themes

### Moderate Risk Workflow
1. Verify every default (sizes, spacing, colors)
2. Analyze structural requirements (positioning, wrappers)
3. Update HTML + CSS + JS together (never partial)
4. Respect theming mechanisms (semantic attributes, no inline styles)
5. Re-derive logic (understand semantic differences)
6. Implement responsive behavior (DS doesn't auto-adjust)
7. Evolve all selectors (`.class` → `[ds-attribute]`)
8. Test all states in primary theme/viewport + spot-check other dimensions

### High Risk Workflow
1. Complete architectural fit evaluation (decision tree)
2. If proceeding: Apply all 8 prevention strategies
3. Test all states × all themes at desktop viewport
4. Test all viewports × primary theme for all states
5. Test critical user paths across all dimensions
6. Test edge cases: empty, error, loading states
7. Test state transitions: enabled → disabled, loading → success

---

## Implementation Checklist

Before starting migration:
- [ ] Have you evaluated the component against risk indicators?
- [ ] Have you determined the risk level (low/moderate/high)?
- [ ] If high-risk, have you completed the architectural fit decision tree?
- [ ] Have you identified which prevention strategies are required?
- [ ] Have you defined the testing scope based on risk level?
- [ ] If maintaining custom implementation, have you documented the decision?

During migration:
- [ ] Are you applying all required prevention strategies for the risk level?
- [ ] Are you updating HTML + CSS + JS together (never partial)?
- [ ] Are you testing according to the risk-appropriate scope?

---

## Common Pitfalls

- ❌ **Skipping risk assessment** - Starting migration without evaluating complexity leads to underestimated effort and incomplete testing.
- ❌ **Forcing unsuitable migrations** - Attempting to migrate components with runtime styling or complex state machines that exceed DS capabilities.
- ❌ **Insufficient testing for risk level** - Testing low-risk scope (1 theme, 1 viewport) for moderate/high-risk components produces bugs in production.
- ❌ **Ignoring prevention strategies** - Skipping prevention strategies increases bug count from 2-3 to 5+ for moderate-risk components.
- ❌ **Assuming DS defaults match legacy** - DS size scales represent semantic intent, not pixel-perfect legacy matches. Always verify visually.

---

## Related Steering Files

- `.kiro/steering/topics/design-system/ds-migration-anti-patterns.md` - Prevention strategies and common mistakes
- `.kiro/steering/topics/design-system/ds-migration-testing-checklist.md` - Testing execution details
- `.kiro/steering/topics/design-system/ds-migration-boundaries.md` - Architectural compatibility evaluation
- `.kiro/steering/topics/design-system/component-selection.md` - Choosing the right DS component
