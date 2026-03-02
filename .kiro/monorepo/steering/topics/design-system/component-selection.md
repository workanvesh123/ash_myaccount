---
inclusion: manual
---

# Design System Component Selection

## Scope – When to Read This

### This file applies when you:
- Choose which DS component to use for a specific UI requirement
- Decide between button vs anchor, switch vs checkbox, badge vs pill
- Determine appropriate component size, variant, or hierarchy
- Migrate legacy components to design system equivalents

### This file does NOT cover:
- Component composition patterns (see `component-composition.md`)
- Inverse theming rules (see `inverse-theming.md`)
- Semantic token usage (see `semantic-tokens.md`)

**Rule:** If choosing the right DS component, read this. For how to use it, see component-specific files.

---

## Core Principles

- **P1 – Semantic Intent:** Match component semantics to user intent. Use `<button>` for actions (JavaScript), `<a>` for navigation (URL changes).
- **P2 – Interactive vs Display:** Interactive elements require user action (button, pill, switch). Display elements show information only (badge, alert).
- **P3 – Form Control Semantics:** Use DsSwitch for binary toggles, DsCheckbox for optional selections, DsRadioButton for exclusive choices.
- **P4 – Visual Hierarchy:** Choose size (large/medium/small) and variant (filled/outline/flat) based on importance and context, not legacy pixel matching.

---

## Do / Don't Guidelines

### Do
- Use `<a>` with `ds-button` or `ds-pill` for navigation (routerLink, href)
- Use `<button>` with `ds-button` or `ds-pill` for actions (click handlers)
- Use DsBadge for non-interactive status indicators
- Use DsLoadingSpinner for unknown duration, DsProgressBar for trackable progress
- Choose component size and variant based on visual hierarchy and context

### Don't
- Use DsBadge with click handlers (use DsPill instead)
- Use `<button>` for navigation (use `<a>` with routerLink)
- Use DsCheckbox for exclusive choices (use DsRadioButton in ds-radio-group)
- Mix loading indicators (choose spinner OR progress bar, not both)
- Apply click handlers to display-only components

---

## Standard Patterns

### Action vs Navigation
```html
<!-- Actions: JavaScript functions, state changes -->
<button ds-button (click)="save()">Save</button>
<button ds-pill (click)="toggleFilter()">Filter</button>

<!-- Navigation: URL changes, routing -->
<a ds-button [routerLink]="['/dashboard']">Dashboard</a>
<a ds-pill [routerLink]="['/category', id]">Category</a>
```

### Form Controls
```html
<!-- Binary toggle: on/off, immediate effect -->
<ds-switch [(ngModel)]="enabled" variant="utility">
  <span slot="start">Enable</span>
</ds-switch>

<!-- Optional selection: multi-select, terms -->
<ds-checkbox formControlName="terms">Accept terms</ds-checkbox>

<!-- Exclusive choice: single selection from group -->
<ds-radio-group formControlName="method">
  <ds-radio-button value="email" name="contact">Email</ds-radio-button>
  <ds-radio-button value="phone" name="contact">Phone</ds-radio-button>
</ds-radio-group>
```

### Interactive vs Display
```html
<!-- Interactive: requires user action -->
<button ds-button (click)="save()">Save</button>
<button ds-pill [selected]="active" (click)="toggle()">Filter</button>

<!-- Display: information only -->
<ds-badge variant="green-strong">Active</ds-badge>
<ds-alert type="error">Please correct errors</ds-alert>
```

### Loading States
```html
<!-- Unknown duration -->
<ds-loading-spinner [ariaLabel]="'Loading results'" />
<button ds-button [loading]="submitting">Submit</button>

<!-- Known progress -->
<ds-progress-bar [currentValue]="progress" [showCounter]="true" />
```

---

## Implementation Checklist

- [ ] Does it navigate? Use `<a>`, not `<button>`
- [ ] Does it perform an action? Use `<button>`, not `<a>`
- [ ] Is it interactive? Use DsButton/DsPill, not DsBadge
- [ ] Is it a form control? Choose DsSwitch/DsCheckbox/DsRadioButton based on semantics
- [ ] Is it loading? Choose DsLoadingSpinner (unknown) or DsProgressBar (trackable)
- [ ] Have you chosen appropriate size and variant for visual hierarchy?

---

## Common Pitfalls & Anti-Patterns

- ❌ **Interactive Badge:** Using `<ds-badge (click)="action()">` for clickable elements. Badges are display-only. Use `<button ds-pill>` instead.
- ❌ **Button for Navigation:** Using `<button ds-button (click)="router.navigate()">` for page changes. Use `<a ds-button [routerLink]>` for proper semantics and accessibility.
- ❌ **Wrong Form Control:** Using DsCheckbox for exclusive choices. Use DsRadioButton in ds-radio-group for single selection from multiple options.
- ❌ **Anchor for Actions:** Using `<a ds-button (click)="save()">` for JavaScript actions. Use `<button>` for actions that don't change URL.
- ❌ **Mixed Loading:** Using both DsLoadingSpinner and DsProgressBar for same operation. Choose one based on whether progress is trackable.

---

## Decision Tree

### For User Actions
1. **Navigates to different page?** → `<a>` with `ds-button` or `ds-pill`
2. **Form control?** → DsSwitch (binary) / DsCheckbox (optional) / DsRadioButton (exclusive)
3. **Standard action?** → DsButton
4. **Icon-only action?** → DsButtonIcon
5. **Filter/category toggle?** → DsPill

### For Information Display
1. **Interactive?** → See "For User Actions"
2. **Status/label?** → DsBadge
3. **User feedback?** → DsAlert
4. **Count indicator?** → DsNotificationBubble
5. **Loading state?** → DsLoadingSpinner (unknown) or DsProgressBar (trackable)

### For Layout
1. **Focus isolation?** → DsModal
2. **Content grouping?** → DsCard
3. **Mobile primary nav?** → DsBottomNav
4. **Content tabs?** → DsTabsGroup
5. **Category filters?** → DsPill

---

## Escalation & Trade-offs

- **Semantic correctness vs legacy behavior:** Always favor semantic HTML (`<button>` for actions, `<a>` for navigation) over replicating legacy patterns.
- **DS component vs custom implementation:** Use DS components unless there's architectural incompatibility (see `ds-migration-boundaries.md`).
- **Size/variant matching:** DS scales represent semantic intent, not pixel-perfect legacy matches. Validate visually and adjust explicitly.

**Rule:** When component choice is unclear, favor semantic correctness and leave a comment explaining the decision.

---

## Related Steering Files

- `.kiro/steering/topics/design-system/component-composition.md` – Nesting DS components
- `.kiro/steering/topics/design-system/inverse-theming.md` – Dark background usage
- `.kiro/steering/topics/design-system/components/` – Individual component APIs
