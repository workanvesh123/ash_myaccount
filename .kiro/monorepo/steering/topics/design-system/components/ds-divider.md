---
inclusion: manual
description: "Use when separating content sections visually with horizontal or vertical divider lines"
---

# DsDivider Integration Instructions

## Context

This guidance applies when implementing visual separators between content sections. DsDivider creates horizontal or vertical lines to establish visual boundaries without semantic meaning.

## Component Overview

DsDivider is a purely visual separator component that creates boundaries between content sections. It supports both horizontal and vertical orientations with configurable color variants for different visual hierarchy needs. The component has no interactive behavior and does not project content.

**Primary Use Cases:**
- Separating content sections in layouts
- Creating visual boundaries in toolbars
- Dividing list items or menu options
- Establishing visual hierarchy in grouped content

**Import:** `@frontend/ui/divider`  
**Selector:** `ds-divider`  
**Status:** STABLE

## Core Patterns

### Import and Setup

Always import DsDivider as a standalone component in your component imports:

```typescript
import { DsDivider } from '@frontend/ui/divider';

@Component({
  selector: 'app-content-section',
  imports: [DsDivider],
  template: `
    <div class="section-one">First section</div>
    <ds-divider></ds-divider>
    <div class="section-two">Second section</div>
  `
})
export class ContentSectionComponent {}
```

### Orientation

Always use the `vertical` input to control divider orientation:

```html
<!-- ✅ Horizontal divider (default) -->
<ds-divider></ds-divider>

<!-- ✅ Vertical divider -->
<ds-divider [vertical]="true"></ds-divider>

<!-- ✅ Dynamic orientation -->
<ds-divider [vertical]="isVerticalLayout()"></ds-divider>
```

### Spacing and Sizing

Always use parent containers to control divider dimensions, never style the host element directly:

```html
<!-- ✅ Container controls width -->
<div style="width: 300px;">
  <ds-divider></ds-divider>
</div>

<!-- ✅ Container controls height for vertical dividers -->
<div style="height: 100px; display: flex;">
  <ds-divider [vertical]="true"></ds-divider>
</div>

<!-- ❌ Never style host directly -->
<ds-divider style="width: 200px;"></ds-divider>
<ds-divider [style.height]="'50px'"></ds-divider>
```

## Template Usage

### Basic Horizontal Divider

```html
<section>
  <div class="content-block">
    <h3>Section Title</h3>
    <p>Section content</p>
  </div>
  <ds-divider></ds-divider>
  <div class="content-block">
    <h3>Another Section</h3>
    <p>More content</p>
  </div>
</section>
```

### Vertical Divider in Toolbar

```html
<div class="toolbar d-flex align-items-center gap-2">
  <button ds-button>Cut</button>
  <button ds-button>Copy</button>
  <ds-divider [vertical]="true"></ds-divider>
  <button ds-button>Paste</button>
  <button ds-button>Delete</button>
</div>
```

### Flex Layout Integration

Always leverage the component's flex display for proper alignment:

```html
<div class="d-flex align-items-center gap-3">
  <span>Left Content</span>
  <ds-divider [vertical]="true"></ds-divider>
  <span>Right Content</span>
</div>
```

### Variant Selection

Always choose variant based on visual hierarchy needs:

```html
<!-- ✅ Subtle separation -->
<ds-divider [variant]="'on-surface-lowest'"></ds-divider>

<!-- ✅ Standard separation -->
<ds-divider [variant]="'on-surface'"></ds-divider>

<!-- ✅ Emphasized separation -->
<ds-divider [variant]="'on-surface-high'"></ds-divider>

<!-- ✅ Dynamic variant -->
<ds-divider [variant]="isEmphasized() ? 'on-surface-high' : 'on-surface-lowest'"></ds-divider>
```

### Dark Background Usage

Always use the `inverse` input for dividers on dark backgrounds:

```html
<div class="dark-background">
  <h3>Title</h3>
  <ds-divider [inverse]="true"></ds-divider>
  <p>Content</p>
</div>
```

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
  <ds-divider [inverse]="true"></ds-divider>
</div>
```

## Input Properties

### Required Properties

None - all properties are optional with sensible defaults.

### Optional Properties

**`vertical: boolean`**
- Controls divider orientation
- Default: `false` (horizontal)
- Use `true` for vertical dividers in flex layouts

**`variant: DsDividerVariant`**
- Controls color intensity and visual hierarchy
- Default: `'on-surface-lowest'`
- Options: `'on-surface-lowest'` | `'on-surface-low'` | `'on-surface'` | `'on-surface-high'` | `'on-surface-highest'`
- Hierarchy: lowest (subtle) → highest (maximum contrast)

**`inverse: boolean`**
- Inverts colors for dark backgrounds
- Default: `false`
- Use `true` when divider appears on dark surfaces

### Signal-Based Binding

Always use signal-based inputs with proper binding syntax:

```html
<!-- ✅ Correct signal binding -->
<ds-divider [vertical]="isVertical()"></ds-divider>
<ds-divider [variant]="dividerVariant()"></ds-divider>
<ds-divider [inverse]="isDarkBackground()"></ds-divider>

<!-- ❌ Avoid string attributes -->
<ds-divider vertical="true"></ds-divider>
```

## Accessibility

### Default Behavior

DsDivider is purely decorative by default and does not include ARIA roles. This prevents conflicts with composite ARIA patterns.

```html
<!-- ✅ Default - purely decorative -->
<ds-divider></ds-divider>
```

### Semantic Separators

Only add `role="separator"` when the divider has semantic meaning in the document structure:

```html
<!-- ✅ Semantic separator in toolbar -->
<div role="toolbar">
  <button>Action 1</button>
  <ds-divider role="separator" [attr.aria-orientation]="'vertical'"></ds-divider>
  <button>Action 2</button>
</div>
```

### ARIA Pattern Conflicts

Never add `role="separator"` within composite ARIA patterns where it would break the structure:

```html
<!-- ❌ Breaks listbox pattern -->
<ul role="listbox">
  <li role="option">Option 1</li>
  <ds-divider role="separator"></ds-divider>
  <li role="option">Option 2</li>
</ul>

<!-- ✅ Use visual divider without role -->
<ul role="listbox">
  <li role="option">Option 1</li>
  <ds-divider></ds-divider>
  <li role="option">Option 2</li>
</ul>
```

## Common Use Cases

### Section Separation

Use horizontal dividers to separate major content sections:

```html
<article>
  <section class="introduction">
    <h2>Introduction</h2>
    <p>Opening content</p>
  </section>
  
  <ds-divider></ds-divider>
  
  <section class="main-content">
    <h2>Main Content</h2>
    <p>Primary information</p>
  </section>
  
  <ds-divider></ds-divider>
  
  <section class="conclusion">
    <h2>Conclusion</h2>
    <p>Closing remarks</p>
  </section>
</article>
```

### List Dividers

Use dividers between list items for visual separation:

```html
<ul class="menu-list">
  <li>Menu Item 1</li>
  <ds-divider></ds-divider>
  <li>Menu Item 2</li>
  <ds-divider></ds-divider>
  <li>Menu Item 3</li>
</ul>
```

### Toolbar Button Groups

Use vertical dividers to separate button groups in toolbars:

```html
<div class="toolbar d-flex align-items-center gap-2">
  <button ds-button-icon aria-label="Bold">
    <vn-icon name="bold" />
  </button>
  <button ds-button-icon aria-label="Italic">
    <vn-icon name="italic" />
  </button>
  
  <ds-divider [vertical]="true"></ds-divider>
  
  <button ds-button-icon aria-label="Align Left">
    <vn-icon name="align-left" />
  </button>
  <button ds-button-icon aria-label="Align Center">
    <vn-icon name="align-center" />
  </button>
</div>
```

### Card Content Separation

Use dividers within cards to separate different content areas:

```html
<ds-card>
  <div class="card-header">
    <h3>Card Title</h3>
  </div>
  
  <ds-divider></ds-divider>
  
  <div class="card-body">
    <p>Card content</p>
  </div>
  
  <ds-divider></ds-divider>
  
  <div class="card-footer">
    <button ds-button>Action</button>
  </div>
</ds-card>
```

## Anti-Patterns

### Never Style Host Element

Never apply classes, styles, or bindings directly to the ds-divider host element:

```html
<!-- ❌ Bypasses computed hostClass -->
<ds-divider [ngClass]="{'custom-divider': true}"></ds-divider>
<ds-divider [class]="dynamicClass"></ds-divider>

<!-- ❌ Breaks theming -->
<ds-divider style="border-color: red;"></ds-divider>
<ds-divider [style.width]="customWidth"></ds-divider>

<!-- ✅ Use component inputs -->
<ds-divider [variant]="'on-surface-high'"></ds-divider>

<!-- ✅ Use wrapper for external styling -->
<div [ngClass]="{'wrapper-class': true}" [style.width]="customWidth">
  <ds-divider></ds-divider>
</div>
```

### Never Use for Semantic Separation

Never use DsDivider when semantic HTML elements are more appropriate:

```html
<!-- ❌ Wrong: Using divider for semantic separation -->
<h2>Section Title</h2>
<ds-divider></ds-divider>
<p>Content</p>

<!-- ✅ Correct: Use semantic HTML -->
<section>
  <h2>Section Title</h2>
  <p>Content</p>
</section>
```

### Never Use Legacy Divider Patterns

Never use custom CSS classes or HTML elements for dividers:

```html
<!-- ❌ Legacy patterns -->
<div class="divider"></div>
<div class="vertical-divider"></div>
<hr class="custom-divider">

<!-- ✅ Design system replacement -->
<ds-divider></ds-divider>
<ds-divider [vertical]="true"></ds-divider>
```

## Key Rules

- Always use parent containers to control divider dimensions
- Never apply styles or classes directly to the ds-divider host element
- Use `vertical` input for vertical orientation in flex layouts
- Choose variant based on visual hierarchy needs (lowest to highest)
- Use `inverse` input for dividers on dark backgrounds
- Default behavior is decorative - only add ARIA roles when semantically required
- Never add `role="separator"` within composite ARIA patterns
- Replace legacy divider CSS with DsDivider component
- Use semantic HTML elements for structural separation, not dividers
