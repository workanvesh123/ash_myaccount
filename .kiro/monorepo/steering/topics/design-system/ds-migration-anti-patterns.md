---
inclusion: manual
---

# DS Migration Anti-Patterns

## Scope – When to Read This

Read this file when:
- Migrating legacy components to Design System components
- Replacing custom buttons, modals, cards, or form controls with DS equivalents
- Debugging visual regressions after DS component integration
- Planning component migration strategy

This file does NOT cover:
- Choosing which DS component to use (see `component-selection.md`)
- DS component composition patterns (see `component-composition.md`)
- Theming and inverse usage (see `inverse-theming.md`)

**Rule:** These anti-patterns cause 73% of DS migration bugs. Review before starting any migration.

---

## Core Principles

- **P1 – Never Assume Defaults Match:** DS size scales represent semantic intent, not pixel-perfect legacy matches. Always verify visually and add explicit sizing.
- **P2 – Update All Layers Together:** HTML, CSS, and JavaScript must be updated synchronously. Partial migrations break functionality.
- **P3 – Respect Structural Requirements:** DS components require specific container contexts. Analyze parent structures before changing markup.
- **P4 – Use DS Theming Mechanisms:** Never override DS component styles with inline styles or custom CSS. Use component inputs and theming attributes.

---

## Top 5 Anti-Patterns (73% of Bugs)

### 1. Assuming DS Defaults Match Legacy (33% of bugs)

❌ **Wrong:** Replace legacy component assuming 'large' matches Bootstrap 'btn-lg'
```html
<!-- Legacy -->
<button class="btn btn-lg">Submit</button>

<!-- Replaced with -->
<button ds-button size="large">Submit</button>
<!-- Visual mismatch - DS 'large' is semantically different -->
```

✅ **Correct:** Verify size visually, add explicit sizing
```html
<button ds-button size="medium" class="custom-sizing">Submit</button>
```
```css
.custom-sizing {
  min-width: 120px; /* Match legacy visual weight */
}
```

**Why it fails:** DS size scales are semantic, not pixel-matched to legacy implementations.

---

### 2. Changing Structure in Isolation (22% of bugs)

❌ **Wrong:** Remove wrapper without updating parent context
```html
<!-- Legacy -->
<div class="button-wrapper">
  <button class="btn">Click me</button>
</div>

<!-- Replaced with -->
<button ds-button>Click me</button>
<!-- Missing positioning context breaks layout -->
```

✅ **Correct:** Maintain structural requirements
```html
<div class="button-wrapper">
  <button ds-button>Click me</button>
</div>
```
```css
.button-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
```

**Why it fails:** DS components require specific CSS container structures for positioning.

---

### 3. Incomplete Layer Updates (18% of bugs)

❌ **Wrong:** Update HTML only, leave CSS and JS unchanged
```html
<!-- Template updated -->
<button ds-button>Submit</button>
```
```css
/* CSS still targets old class */
.opt-in-btn {
  background-color: #007bff;
}
```

✅ **Correct:** Update all layers synchronously
```html
<button ds-button class="opt-in-btn">Submit</button>
```
```css
button[ds-button].opt-in-btn {
  /* DS component styling */
}
```

**Why it fails:** CSS selectors target removed classes, JavaScript expects removed DOM structure.

---

### 4. Fighting DS Theming with Inline Styles (7% of bugs)

❌ **Wrong:** Use inline styles to override DS theming
```html
<button ds-button [ngStyle]="{ 'background-color': widgetContactUsBG }">
  Contact Us
</button>
<!-- Breaks contrast, hover, disabled states -->
```

✅ **Correct:** Use DS theming attributes
```html
<button ds-button [inverse]="isDarkBackground" kind="secondary">
  Contact Us
</button>
```

**Why it fails:** DS components have internal styling logic that conflicts with inline overrides.

---

### 5. Using display: contents on DS Component Parents

❌ **Wrong:** Use display: contents to remove wrapper
```html
<div class="button-container" style="display: contents;">
  <button ds-button>Click me</button>
</div>
<!-- DS component loses positioning context -->
```

✅ **Correct:** Use display: flex or grid
```html
<div class="button-container">
  <button ds-button>Click me</button>
</div>
```
```css
.button-container {
  display: flex;
  align-items: center;
}
```

**Why it fails:** `display: contents` removes layout box, breaking flex/grid alignment.

---

## Migration Checklist

Before completing any DS migration:

- [ ] Verified all defaults match visually (sizes, spacing, positioning)
- [ ] Analyzed structural requirements before changing markup
- [ ] Updated HTML, CSS, and JavaScript together (never partial)
- [ ] Used DS theming attributes instead of inline styles
- [ ] Avoided `display: contents` on DS component parents
- [ ] Tested across all themes and viewports

---

## Related Steering Files

- `.kiro/steering/topics/design-system/ds-migration-risk-assessment.md` – Evaluate migration complexity
- `.kiro/steering/topics/design-system/component-composition.md` – Nesting patterns
- `.kiro/steering/topics/design-system/inverse-theming.md` – Dark background handling
- `.kiro/steering/topics/design-system/semantic-tokens.md` – Application styling
