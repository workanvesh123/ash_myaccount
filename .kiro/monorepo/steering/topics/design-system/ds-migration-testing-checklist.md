---
inclusion: manual
---

# DS Migration Testing Checklist

## Scope – When to Read This

### This file applies when you:
- Planning test coverage for a Design System component migration
- Determining which test scenarios are required based on component risk level
- Validating a migrated component across themes, viewports, states, or contexts
- Deciding between minimal (5-10%), targeted (20-30%), or comprehensive (50-75%) testing

### This file does NOT cover:
- How to identify component risk level (see `ds-migration-risk-assessment.md`)
- How to prevent migration bugs (see `ds-migration-anti-patterns.md`)
- Component-specific API details (see `components/ds-[component].md`)

**Rule:** Use this checklist AFTER risk assessment and DURING validation phase to ensure appropriate test coverage.

---

## Core Principles

- **P1 – Risk-Proportional Coverage:** Test coverage must match component risk level. Low-risk components need 5-10% coverage (3-5 scenarios), moderate-risk need 20-30% (20-30 scenarios), high-risk need 50-75% (72-108 scenarios).

- **P2 – Dimension-Based Testing:** Test across 5 dimensions: themes (6 brands), viewports (3 sizes), states (8 variations), contexts (5 layouts), variants (5 types). Prioritize dimensions based on component usage patterns.

- **P3 – Primary-First Validation:** Always test BetMGM theme + Desktop viewport + Enabled state first. This is the baseline for all components. Expand coverage from this foundation.

- **P4 – State × Theme Priority:** For moderate/high-risk components, test all states in primary theme AND primary state across all themes before testing other dimensions.

---

## Testing Strategy by Risk Level

### Low Risk: 5-10% Coverage (3-5 scenarios)

**When to use 5%:**
- Component has single state
- Used in one context only
- Clear DS equivalent with no customization

**When to use 10%:**
- Component has 2 states OR used in 2 contexts
- Requires minor brand-specific adjustments

**Required test scenarios:**
1. BetMGM theme + Desktop viewport + Enabled state
2. Spot-check 2 additional themes (Bwin, Ladbrokes) in same configuration
3. Verify primary user flow end-to-end

**Expected bugs if prevention strategies applied:** 0-1

**Time estimate:** 15-30 minutes

---

### Moderate Risk: 20-30% Coverage (20-30 scenarios)

**When to use 20%:**
- Clear DS equivalent exists
- Minimal custom logic
- No brand-specific variations
- Standard responsive behavior

**When to use 30%:**
- Brand-specific styling required
- Complex state interactions
- Multi-device requirements
- Custom event handling

**Required test scenarios:**
1. All 8 states in BetMGM theme + Desktop viewport
2. Enabled state across all 6 themes + Desktop viewport
3. All 8 states in BetMGM theme across all 3 viewports
4. Critical user path end-to-end in primary theme
5. State transitions (enabled → disabled, loading → success) in primary theme

**Expected bugs if prevention strategies applied:** 2-3

**Time estimate:** 1-2 hours

---

### High Risk: 50-75% Coverage (72-108 scenarios)

**When to use 50%:**
- Component has 3-4 high-risk indicators
- Team has strong DS migration experience
- Component used in non-critical flows

**When to use 75%:**
- Component has 5+ high-risk indicators
- Critical user flow (checkout, login, betting)
- Zero-tolerance for bugs
- Complex state machine

**Required test scenarios:**
1. All states × all themes at desktop viewport (6 themes × 8 states = 48 combinations)
2. All viewports × BetMGM theme for all states (3 viewports × 8 states = 24 combinations)
3. Critical user paths across all dimensions (themes × viewports × states)
4. Edge cases: empty states, error states, loading states in all themes
5. State transitions across all themes
6. Component behavior in all 5 contexts (modal, overlay, embeddedView, inlineLayout, cardContainer)

**Expected bugs if prevention strategies applied:** 4+

**Time estimate:** 3-5 hours

---

## Testing Dimensions Reference

Use these dimensions to construct test scenarios:

### Themes (6 total)
- **BetMGM** (primary baseline)
- **Bwin** (secondary)
- **Betboo**, **Ladbrokes**, **Coral**, **PartyPoker** (tertiary)

### Viewports (3 total)
- **Desktop:** 1920px+ (primary)
- **Tablet:** 768-1024px (secondary)
- **Mobile:** 0-767px (tertiary)

### States (8 total)
- **Enabled** (primary), **Disabled**, **Loading**, **Hover** (desktop only), **Focus**, **Active**, **Pressed**, **Error**

### Contexts (5 total)
- **InlineLayout** (primary), **Modal**, **Overlay**, **EmbeddedView**, **CardContainer**

### Variants (5 total)
- **Primary** (default), **Secondary**, **Filled**, **Outline**, **Inverse** (dark backgrounds)

---

## Implementation Checklist

### Before Testing
- [ ] Component migrated to DS (HTML + CSS + JS updated together)
- [ ] All 8 prevention strategies applied (see `ds-migration-anti-patterns.md`)
- [ ] CSS selectors updated to attribute-based (e.g., `[ds-button]`)
- [ ] Component API understood (inputs, outputs, slots)

### During Testing
- [ ] Visual regression check in BetMGM theme + Desktop + Enabled state (baseline)
- [ ] State transitions work smoothly (no janky animations)
- [ ] Responsive behavior verified (component adapts to viewport)
- [ ] Theme switching works correctly (semantic tokens applied)
- [ ] Accessibility maintained (keyboard navigation, screen reader)
- [ ] Performance acceptable (no layout thrashing, smooth animations)

### After Testing
- [ ] All required test scenarios passed (based on risk level)
- [ ] No visual regressions detected
- [ ] No console errors or warnings
- [ ] Component ready for production deployment

---

## Common Testing Issues

### Issue: Component looks different in secondary themes
**Cause:** DS uses semantic tokens, not pixel-perfect legacy matches  
**Solution:** Verify component uses DS theming attributes (`inverse`, `kind`, `variant`), not inline styles  
**Reference:** `inverse-theming.md`

### Issue: Component breaks on mobile viewport
**Cause:** DS components don't auto-adjust; responsive behavior must be implemented  
**Solution:** Add responsive wrapper or use component responsive inputs  
**Reference:** `component-composition.md`

### Issue: State transitions are janky or slow
**Cause:** CSS animations conflicting with DS component internals  
**Solution:** Use DS component animation inputs, avoid custom CSS animations on host  
**Reference:** `components/ds-[component].md`

### Issue: Component works in isolation but breaks in context
**Cause:** Missing positioning context or wrapper elements  
**Solution:** Verify parent containers have `position: relative` and proper flex/grid layout  
**Reference:** `component-composition.md`

---

## AI Assistant Guidelines

When validating a DS migration:

1. **Determine risk level first:** Read `ds-migration-risk-assessment.md` to classify component as low/moderate/high risk
2. **Select appropriate coverage:** Use 5-10% for low, 20-30% for moderate, 50-75% for high risk
3. **Start with baseline:** Always test BetMGM + Desktop + Enabled state first
4. **Expand systematically:** Test all states in primary theme, then primary state across all themes, then viewports
5. **Document test results:** Note which scenarios passed/failed and any visual regressions
6. **Reference prevention strategies:** Ensure all 8 strategies from `ds-migration-anti-patterns.md` were applied before testing

**Critical:** Never skip baseline testing. Never test only one dimension. Never assume DS defaults match legacy appearance.

---

## Related Steering Files

- **Risk Assessment:** `.kiro/steering/topics/design-system/ds-migration-risk-assessment.md`
- **Anti-patterns:** `.kiro/steering/topics/design-system/ds-migration-anti-patterns.md`
- **Component Composition:** `.kiro/steering/topics/design-system/component-composition.md`
- **Inverse Theming:** `.kiro/steering/topics/design-system/inverse-theming.md`
- **Component APIs:** `.kiro/steering/topics/design-system/components/ds-[component].md`
