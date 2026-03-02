---
inclusion: manual
description: "Use when providing contextual help overlays, interactive popovers, or additional information on hover/focus"
---

# DsTooltip Integration Instructions

## Context

This guidance applies when implementing contextual help overlays, interactive popovers, or additional information displays triggered by hover, focus, or click interactions. Use DsTooltip for supplementary information that enhances understanding without cluttering the primary interface.

## Component Overview

DsTooltip is a versatile overlay component that provides contextual information and interactive content through hover, focus, or click triggers. It supports both simple informational tooltips and complex interactive popovers with buttons, links, and form elements. The component includes automatic ARIA management, flexible positioning, and built-in keyboard navigation for accessibility compliance.

## Core Patterns

### Import and Setup

Always import `DsTooltipModule` in your component's imports array.

```typescript
import { DsTooltipModule } from '@frontend/ui/tooltip';

@Component({
  imports: [DsTooltipModule],
  template: `...`
})
```

Always use the directive pattern with template references for tooltip content.

```html
<button [dsTooltipTriggerFor]="helpTooltip">Help</button>
<ng-template #helpTooltip>
  <ds-tooltip-content>
    <div slot="title">Field Help</div>
    <div slot="description">Enter a valid email address</div>
  </ds-tooltip-content>
</ng-template>
```

### Trigger Behavior

Always add `dsTooltipOnFocus` directive for hover and keyboard focus triggers.

```html
<!-- Hover + keyboard focus -->
<vn-icon [dsTooltipTriggerFor]="info" dsTooltipOnFocus name="theme-info" size="16"></vn-icon>
```

Always omit `dsTooltipOnFocus` for click-only tooltips.

```html
<!-- Click only -->
<button [dsTooltipTriggerFor]="menu" ds-button-icon>
  <vn-icon name="theme-dots" size="16"></vn-icon>
</button>
```

Never use both hover and click triggers simultaneously without considering UX implications.

### Interactive Mode

Always set `[interactive]="true"` for tooltips containing buttons, links, or form elements.

```html
<button [dsTooltipTriggerFor]="actions" [interactive]="true" ds-button-icon>
  <vn-icon name="theme-menu" size="16"></vn-icon>
</button>
<ng-template #actions>
  <ds-tooltip-content variant="utility">
    <div slot="title">Actions</div>
    <div slot="action">
      <button ds-button variant="flat" dsTooltipClose>Edit</button>
      <button ds-button variant="flat" dsTooltipClose>Delete</button>
    </div>
  </ds-tooltip-content>
</ng-template>
```

Always add `dsTooltipClose` attribute to buttons that should close the tooltip.

Never use interactive mode for simple informational tooltips without actionable content.

## Template Usage

### Basic Examples

```html
<!-- Simple informational tooltip -->
<vn-icon [dsTooltipTriggerFor]="help" dsTooltipOnFocus name="theme-info" size="16"></vn-icon>
<ng-template #help>
  <ds-tooltip-content>
    <div slot="description">Helpful information</div>
  </ds-tooltip-content>
</ng-template>

<!-- Click-triggered tooltip -->
<button [dsTooltipTriggerFor]="menu" ds-button-icon>
  <vn-icon name="theme-dots" size="16"></vn-icon>
</button>
<ng-template #menu>
  <ds-tooltip-content>
    <div slot="title">Options</div>
    <div slot="description">Select an action</div>
  </ds-tooltip-content>
</ng-template>
```

### Advanced Patterns

```html
<!-- Interactive tooltip with actions -->
<button [dsTooltipTriggerFor]="actions" [interactive]="true" ds-button-icon>
  <vn-icon name="theme-menu" size="16"></vn-icon>
</button>
<ng-template #actions>
  <ds-tooltip-content variant="utility">
    <div slot="title">Actions</div>
    <vn-icon slot="close" name="theme-close-small" size="9"></vn-icon>
    <div slot="action">
      <button ds-button variant="flat" dsTooltipClose>Edit</button>
      <button ds-button variant="flat" dsTooltipClose>Delete</button>
    </div>
  </ds-tooltip-content>
</ng-template>

<!-- Auto-opening onboarding tooltip -->
<div [dsTooltipTriggerFor]="welcome" 
     [autoOpen]="true" 
     [autoCloseTime]="5000"
     [closeOnInteraction]="true">
  New Feature
</div>
<ng-template #welcome>
  <ds-tooltip-content>
    <div slot="title">Welcome!</div>
    <div slot="description">Check out this new feature</div>
  </ds-tooltip-content>
</ng-template>
```

### Slot Projection

Always use semantic slot attributes for structured content layout.

```html
<ds-tooltip-content>
  <div slot="title">{{ dynamicTitle }}</div>
  <div slot="description">{{ dynamicDescription }}</div>
  <vn-icon slot="close" name="theme-close-small" size="9"></vn-icon>
  <button slot="action" ds-button dsTooltipClose>Got it</button>
</ds-tooltip-content>
```

Always use `[customTooltip]="true"` only when you need complete control over layout.

```html
<ds-tooltip-content [customTooltip]="true">
  <div class="custom-layout">
    <ul><li>Custom item 1</li><li>Custom item 2</li></ul>
  </div>
</ds-tooltip-content>
```

Never mix slotted content with custom tooltip mode.

### Positioning

Always combine `position` and `arrowPosition` for precise tooltip placement.

```html
<div [dsTooltipTriggerFor]="tip" 
     position="bottom" 
     arrowPosition="start">
  Left-aligned trigger
</div>
```

Always use `[fullWidth]="true"` on both trigger and content for mobile-optimized tooltips.

```html
<div [dsTooltipTriggerFor]="mobile" 
     [fullWidth]="true" 
     position="top">
<ng-template #mobile>
  <ds-tooltip-content [fullWidth]="true">
    Full-width content on mobile
  </ds-tooltip-content>
</ng-template>
```

Never use `fullWidth` with `left` or `right` positions - only `top` and `bottom` are supported.

## Input Properties

### Trigger Properties

- **dsTooltipTriggerFor**: `TemplateRef` - Template reference for tooltip content (required)
- **dsTooltipOnFocus**: `boolean` - Enable hover and keyboard focus triggers (directive)
- **interactive**: `boolean` - Enable interactive mode for actionable content (default: `false`)
- **position**: `'top' | 'bottom' | 'left' | 'right'` - Tooltip position relative to trigger (default: `'top'`)
- **arrowPosition**: `'start' | 'center' | 'end'` - Arrow alignment on tooltip edge (default: `'center'`)
- **fullWidth**: `boolean` - Make tooltip full-width on mobile (default: `false`)
- **autoOpen**: `boolean` - Automatically open tooltip on mount (default: `false`)
- **autoCloseTime**: `number` - Auto-close delay in milliseconds, 0 to disable (default: `3000`)
- **closeOnInteraction**: `boolean` - Close on any user interaction (default: `false`)
- **closeOnScroll**: `boolean` - Close on scroll events (default: `false`)
- **tooltipToggle**: `WritableSignal<boolean>` - Two-way binding for programmatic control

### Content Properties

- **variant**: `'neutral' | 'utility'` - Visual style variant (default: `'neutral'`)
- **customTooltip**: `boolean` - Enable custom layout mode (default: `false`)
- **tooltipTitle**: `string` - Screen reader title when slot="title" is empty
- **fullWidth**: `boolean` - Make content full-width (default: `false`)

### Variant Selection

Always use `variant="neutral"` (default) for informational help text and field hints.

```html
<ds-tooltip-content variant="neutral">
  <div slot="description">Helpful information</div>
</ds-tooltip-content>
```

Always use `variant="utility"` for action-oriented popovers and rich content.

```html
<ds-tooltip-content variant="utility">
  <div slot="title">Available Actions</div>
  <div slot="action">
    <button ds-button>Primary Action</button>
  </div>
</ds-tooltip-content>
```

## Accessibility Requirements

### ARIA Attributes

Always trust the component's automatic ARIA management for standard use cases.

- Non-interactive tooltips automatically get `role="tooltip"` and `aria-describedby`
- Interactive tooltips automatically get `role="dialog"` and focus management

Always provide `[tooltipTitle]` when slot="title" is empty but screen readers need context.

```html
<ds-tooltip-content [tooltipTitle]="'Screen reader title'">
  <div slot="description">Only description visible</div>
</ds-tooltip-content>
```

Never override the component's built-in ARIA attributes unless absolutely necessary.

### Keyboard Navigation

Always ensure interactive tooltips have keyboard navigation with Tab and Escape keys.

The component automatically handles:
- **Tab**: Navigate through interactive elements within tooltip
- **Escape**: Close tooltip and return focus to trigger
- **Enter/Space**: Activate trigger element (when applicable)

Never override the component's keyboard event handling unless adding specific application logic.

### Screen Reader Support

Always ensure trigger elements have labels that describe their purpose: use `aria-label` for icon-only buttons, ensure text content is descriptive for text buttons, and use `aria-labelledby` to reference visible labels.

```html
<!-- Icon with aria-label on trigger -->
<button [dsTooltipTriggerFor]="help" 
        ds-button-icon 
        aria-label="Help information">
  <vn-icon name="theme-info" size="16" aria-hidden="true"></vn-icon>
</button>

<!-- Icon hidden from screen readers when text is present -->
<button [dsTooltipTriggerFor]="menu">
  <vn-icon name="theme-menu" size="16" aria-hidden="true"></vn-icon>
  Menu
</button>
```

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
  <button [dsTooltipTriggerFor]="help" dsTooltipOnFocus ds-button-icon [inverse]="true">
    <vn-icon name="theme-info" size="16"></vn-icon>
  </button>
  <ng-template #help>
    <ds-tooltip-content [inverse]="true">
      <div slot="description">Helpful information on dark background</div>
    </ds-tooltip-content>
  </ng-template>
</div>
```

## Common Use Cases

### Help Text

Always follow this pattern for icon help tooltips:

```html
<vn-icon [dsTooltipTriggerFor]="help" 
         dsTooltipOnFocus 
         name="theme-info" 
         size="16" 
         aria-hidden="true"></vn-icon>
<ng-template #help>
  <ds-tooltip-content>
    <div slot="description">Contextual help text</div>
  </ds-tooltip-content>
</ng-template>
```

### Action Menus

Always follow this pattern for action menus:

```html
<button [dsTooltipTriggerFor]="menu" 
        [interactive]="true" 
        ds-button-icon 
        aria-label="More options">
  <vn-icon name="theme-dots" size="16"></vn-icon>
</button>
<ng-template #menu>
  <ds-tooltip-content variant="utility">
    <vn-icon slot="close" name="theme-close-small" size="9"></vn-icon>
    <div slot="action">
      <button ds-button variant="flat" dsTooltipClose>Edit</button>
      <button ds-button variant="flat" dsTooltipClose>Delete</button>
    </div>
  </ds-tooltip-content>
</ng-template>
```

### Onboarding

Always use auto-open tooltips for first-time user guidance.

```html
<div [dsTooltipTriggerFor]="welcome" 
     [autoOpen]="true" 
     [autoCloseTime]="5000"
     [closeOnInteraction]="true">
  New Feature
</div>
<ng-template #welcome>
  <ds-tooltip-content>
    <div slot="title">Welcome!</div>
    <div slot="description">Check out this new feature</div>
    <button slot="action" ds-button dsTooltipClose>Got it</button>
  </ds-tooltip-content>
</ng-template>
```

## Anti-Patterns

Never use tooltips as the primary way to convey essential information.

```html
<!-- ❌ Incorrect: Essential info hidden in tooltip -->
<button [dsTooltipTriggerFor]="required">Submit</button>
<ng-template #required>
  <ds-tooltip-content>
    <div slot="description">All fields are required</div>
  </ds-tooltip-content>
</ng-template>

<!-- ✅ Correct: Essential info visible, tooltip supplements -->
<button>Submit</button>
<span class="text-danger">* All fields required</span>
```

Never use both hover and click triggers without considering UX.

```html
<!-- ❌ Incorrect: Confusing trigger behavior -->
<button [dsTooltipTriggerFor]="confused" dsTooltipOnFocus (click)="action()">
  Confusing
</button>

<!-- ✅ Correct: Clear trigger behavior -->
<button [dsTooltipTriggerFor]="clear" dsTooltipOnFocus>
  Hover for info
</button>
```

Never create tooltips inside `@for` loops without `trackBy` functions.

```html
<!-- ❌ Incorrect: Performance issue -->
@for (item of items(); track $index) {
  <button [dsTooltipTriggerFor]="tooltip">{{ item }}</button>
}

<!-- ✅ Correct: Proper tracking -->
@for (item of items(); track item.id) {
  <button [dsTooltipTriggerFor]="tooltip">{{ item }}</button>
}
```

Never mix slotted content with custom tooltip mode.

```html
<!-- ❌ Incorrect: Mixed modes -->
<ds-tooltip-content [customTooltip]="true">
  <div slot="title">Title</div>
  <div class="custom">Custom content</div>
</ds-tooltip-content>

<!-- ✅ Correct: Choose one mode -->
<ds-tooltip-content>
  <div slot="title">Title</div>
  <div slot="description">Description</div>
</ds-tooltip-content>
```

Never rely on auto-close for critical user actions.

```html
<!-- ❌ Incorrect: Critical action might be missed -->
<div [dsTooltipTriggerFor]="critical" [autoCloseTime]="3000">
  Important
</div>

<!-- ✅ Correct: Explicit close button -->
<div [dsTooltipTriggerFor]="critical" [autoCloseTime]="0">
  Important
</div>
<ng-template #critical>
  <ds-tooltip-content>
    <div slot="description">Critical information</div>
    <button slot="action" ds-button dsTooltipClose>I understand</button>
  </ds-tooltip-content>
</ng-template>
```

## Key Rules

- Always import `DsTooltipModule` in component imports
- Always use template references for tooltip content
- Always add `dsTooltipOnFocus` for hover and keyboard focus triggers
- Always set `[interactive]="true"` for tooltips with actionable content
- Always add `dsTooltipClose` to buttons that should close the tooltip
- Always use semantic slot attributes for structured content
- Always trust component's automatic ARIA management
- Always provide `[tooltipTitle]` when slot="title" is empty
- Always ensure trigger elements have descriptive labels
- Always use `trackBy` when creating tooltips in loops
- Never use tooltips as primary way to convey essential information
- Never mix hover and click triggers without considering UX
- Never mix slotted content with custom tooltip mode
- Never use `fullWidth` with `left` or `right` positions
- Never override built-in ARIA attributes unless necessary
- Never rely on auto-close for critical user actions
