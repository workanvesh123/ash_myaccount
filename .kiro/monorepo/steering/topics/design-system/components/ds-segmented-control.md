---
inclusion: manual
description: "Use when creating view switchers, filter toggles, preference selectors, or compact navigation with multiple options"
---

# DsSegmentedControl Integration Instructions

## Context

This guidance applies when implementing view switchers, filter toggles, preference selectors, or compact navigation with multiple mutually exclusive options. Use DsSegmentedControl for grouped choice interfaces where users select exactly one option from a set of related alternatives.

## Component Overview

DsSegmentedControl is a grouped choice component that provides exclusive selection from multiple options with clear visual feedback. It supports both simple text labels and custom content projection, includes automatic ARIA management for accessibility, and implements proper keyboard navigation patterns. The component is ideal for view switching, filter toggles, and preference selection where users need to choose one option from a compact set of alternatives.

## Core Patterns

### Import and Setup

Always import `DsSegmentedControl` and `DsSegmentedOption` from `@frontend/ui/segmented-control` for grouped choice interfaces.

```typescript
import { DsSegmentedControl, DsSegmentedOption } from '@frontend/ui/segmented-control';

@Component({
  imports: [DsSegmentedControl, DsSegmentedOption]
})
```

### Exclusive Selection

Always use two-way binding with `[(activeOption)]` for reactive state management.

```html
<ds-segmented-control [(activeOption)]="selectedView">
  <ds-segmented-option name="grid" title="Grid View" />
  <ds-segmented-option name="list" title="List View" />
</ds-segmented-control>
```

The component enforces exclusive selection - only one option can be active at a time.

### Signal-Based State

Always use signal-based state for reactive updates.

```typescript
export class ViewSwitcherComponent {
  selectedView = signal<'grid' | 'list'>('grid');
  
  // Computed values based on selection
  isGridView = computed(() => this.selectedView() === 'grid');
}
```

```html
<ds-segmented-control [(activeOption)]="selectedView">
  <ds-segmented-option name="grid" title="Grid View" />
  <ds-segmented-option name="list" title="List View" />
</ds-segmented-control>

@if (isGridView()) {
  <div class="grid-layout">Grid content</div>
} @else {
  <div class="list-layout">List content</div>
}
```

## Template Usage

### Basic Examples

```html
<!-- Simple view switcher -->
<ds-segmented-control [(activeOption)]="selectedView">
  <ds-segmented-option name="grid" title="Grid View" />
  <ds-segmented-option name="list" title="List View" />
</ds-segmented-control>

<!-- Filter toggle -->
<ds-segmented-control [(activeOption)]="selectedInterval">
  <ds-segmented-option name="daily" title="Daily" />
  <ds-segmented-option name="weekly" title="Weekly" />
  <ds-segmented-option name="monthly" title="Monthly" />
</ds-segmented-control>
```

### Advanced Patterns

```html
<!-- With custom icons -->
<ds-segmented-control [(activeOption)]="selectedAction">
  <ds-segmented-option name="deposit" title="Deposit">
    <ng-template #dsTemplate>
      <vn-icon name="deposit" size="16" />
    </ng-template>
  </ds-segmented-option>
  <ds-segmented-option name="withdraw" title="Withdraw">
    <ng-template #dsTemplate>
      <vn-icon name="withdraw" size="16" />
    </ng-template>
  </ds-segmented-option>
</ds-segmented-control>

<!-- With event handling for tracking -->
<ds-segmented-control 
  [activeOption]="active" 
  (optionChanged)="trackSelection($event.name)">
  <ds-segmented-option name="tab1" title="Tab 1" />
  <ds-segmented-option name="tab2" title="Tab 2" />
</ds-segmented-control>

<!-- Full-width for mobile -->
<ds-segmented-control [fullWidth]="true" [(activeOption)]="selectedOption">
  <ds-segmented-option name="option1" title="Option 1" />
  <ds-segmented-option name="option2" title="Option 2" />
</ds-segmented-control>
```

### Form Integration

```html
<!-- As form control with radiogroup role -->
<form [formGroup]="settingsForm">
  <label>Notification Frequency</label>
  <ds-segmented-control 
    [(activeOption)]="notificationFrequency" 
    roleType="radiogroup"
    [fullWidth]="true">
    <ds-segmented-option name="immediate" title="Immediate" />
    <ds-segmented-option name="daily" title="Daily Digest" />
    <ds-segmented-option name="weekly" title="Weekly Summary" />
  </ds-segmented-control>
</form>
```

## Input Properties

### DsSegmentedControl Properties

- **activeOption**: `string` - Currently selected option name (two-way bindable)
- **fullWidth**: `boolean` - Make control fill container width (default: `false`)
- **inverse**: `boolean` - Use inverse color scheme (default: `false`)
- **roleType**: `'tablist' | 'radiogroup'` - ARIA role for semantic context (default: `'tablist'`)

### DsSegmentedOption Properties

- **name**: `string` - Unique identifier for the option (required)
- **title**: `string` - Display text and accessible label (required)

### Selection Binding Patterns

Always use `[(activeOption)]` for simple state binding to eliminate manual event handlers.

```html
<!-- Two-way binding (preferred) -->
<ds-segmented-control [(activeOption)]="selectedInterval">
  <ds-segmented-option name="daily" title="Daily" />
  <ds-segmented-option name="weekly" title="Weekly" />
</ds-segmented-control>
```

Always use `(optionChanged)` when additional logic is needed beyond state updates.

```html
<!-- Event handling for tracking/side effects -->
<ds-segmented-control [activeOption]="active" (optionChanged)="trackSelection($event.name)">
  <ds-segmented-option name="tab1" title="Tab 1" />
</ds-segmented-control>
```

Never use both `[(activeOption)]` and `(optionChanged)` simultaneously to avoid event conflicts.

### Content Projection

Always use `title` input for simple text labels to avoid template overhead.

```html
<ds-segmented-option name="sports" title="Sports Betting" />
```

Always use `<ng-template #dsTemplate>` for custom content including icons and dynamic HTML.

```html
<ds-segmented-option name="deposit" title="Deposit">
  <ng-template #dsTemplate>
    <vn-icon name="deposit" size="16" />
  </ng-template>
</ds-segmented-option>
```

Always provide descriptive `title` even when using custom templates for accessibility.

```html
<!-- Icon with accessible title -->
<ds-segmented-option name="withdraw" title="Withdraw Funds">
  <ng-template #dsTemplate>
    <vn-icon name="withdraw" size="16" />
  </ng-template>
</ds-segmented-option>
```

## Accessibility Requirements

### ARIA Roles

Always use `roleType="tablist"` (default) for content switching and view navigation.

```html
<ds-segmented-control [activeOption]="activeTab" roleType="tablist">
  <ds-segmented-option name="overview" title="Overview" />
  <ds-segmented-option name="details" title="Details" />
</ds-segmented-control>
<div role="tabpanel" [attr.aria-labelledby]="'ds-segment-item-' + activeTab">
  <!-- Panel content -->
</div>
```

Always use `roleType="radiogroup"` for form inputs and exclusive choice selections.

```html
<ds-segmented-control [(activeOption)]="interval" roleType="radiogroup">
  <ds-segmented-option name="daily" title="Daily Limit" />
  <ds-segmented-option name="weekly" title="Weekly Limit" />
</ds-segmented-control>
```

Never manually add ARIA attributes as the component auto-manages `aria-selected`, `aria-checked`, and `tabindex`.

### Keyboard Navigation

Always trust the component's automatic keyboard navigation implementation.

The component automatically handles:
- **Arrow Keys**: Navigate between options (Left/Right or Up/Down)
- **Enter/Space**: Select focused option
- **Tab**: Move focus to/from the control
- **Roving tabindex**: Only active option is tabbable

Never override the component's keyboard event handling as it implements roving tabindex (only the active option has tabindex='0', others have tabindex='-1') for keyboard navigation.

### Screen Reader Support

Always provide meaningful `title` or `name` values for screen reader announcements.

```html
<!-- ✅ Good -->
<ds-segmented-option name="sports" title="Sports Betting" />

<!-- ❌ Bad - missing accessible label -->
<ds-segmented-option name="icon1" title="">
  <ng-template #dsTemplate><vn-icon name="deposit" /></ng-template>
</ds-segmented-option>
```

## Common Use Cases

### View Switching

Use segmented control for switching between different view modes.

```html
<ds-segmented-control [(activeOption)]="viewMode" roleType="tablist">
  <ds-segmented-option name="grid" title="Grid View">
    <ng-template #dsTemplate>
      <vn-icon name="grid" size="16" />
    </ng-template>
  </ds-segmented-option>
  <ds-segmented-option name="list" title="List View">
    <ng-template #dsTemplate>
      <vn-icon name="list" size="16" />
    </ng-template>
  </ds-segmented-option>
</ds-segmented-control>

@if (viewMode() === 'grid') {
  <div class="grid-layout">Grid content</div>
} @else {
  <div class="list-layout">List content</div>
}
```

### Filter Groups

Use segmented control for mutually exclusive filter options.

```html
<ds-segmented-control [(activeOption)]="timeFilter" [fullWidth]="true">
  <ds-segmented-option name="today" title="Today" />
  <ds-segmented-option name="week" title="This Week" />
  <ds-segmented-option name="month" title="This Month" />
  <ds-segmented-option name="all" title="All Time" />
</ds-segmented-control>
```

### Dynamic Options

Always use `@for` with unique tracking expressions (e.g., `track option.id` or `track option.name`) for dynamic option generation to prevent unnecessary DOM re-renders.

```html
<ds-segmented-control [(activeOption)]="selectedInterval" [fullWidth]="true" roleType="radiogroup">
  @for (limit of intervalTypes; track limit.id) {
    <ds-segmented-option [name]="limit.id" [title]="limit.label">
      <ng-template #dsTemplate>
        <div [vnDynamicHtml]="limit.label" />
      </ng-template>
    </ds-segmented-option>
  }
</ds-segmented-control>
```

Always provide unique `name` values for each option to ensure the component can identify which option is selected (name values must be unique within the segmented control).

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
  <ds-segmented-control [inverse]="true" [(activeOption)]="selectedView">
    <ds-segmented-option name="grid" title="Grid View" />
    <ds-segmented-option name="list" title="List View" />
  </ds-segmented-control>
</div>
```

## Anti-Patterns

Never apply CSS classes or inline styles to the host element except for the allowed CSS variable.

```html
<!-- ❌ Forbidden -->
<ds-segmented-control class="custom-class" style="margin: 10px">
</ds-segmented-control>

<!-- ✅ Allowed -->
<div class="custom-class" style="margin: 10px">
  <ds-segmented-control style="--ds-segment-item-text-max-width: 100px">
  </ds-segmented-control>
</div>
```

Never use `[ngClass]` or dynamic class binding on the host element.

```html
<!-- ❌ Forbidden -->
<ds-segmented-control [ngClass]="{'active': isActive}">
</ds-segmented-control>

<!-- ✅ Use component inputs -->
<ds-segmented-control [inverse]="isActive">
</ds-segmented-control>
```

Never apply display utilities directly to the host element.

```html
<!-- ❌ Incorrect -->
<ds-segmented-control class="d-flex mb-3">
</ds-segmented-control>

<!-- ✅ Correct -->
<div class="d-flex mb-3">
  <ds-segmented-control>
  </ds-segmented-control>
</div>
```

Never use both `[(activeOption)]` and `(optionChanged)` simultaneously.

```html
<!-- ❌ Incorrect: Event conflicts -->
<ds-segmented-control 
  [(activeOption)]="selected" 
  (optionChanged)="handleChange($event)">
</ds-segmented-control>

<!-- ✅ Correct: Choose one approach -->
<ds-segmented-control [(activeOption)]="selected">
</ds-segmented-control>
```

Never use nested `@if` statements within content projection.

```html
<!-- ❌ Incorrect: Projection context issues -->
<ds-segmented-option name="opt" title="Option">
  <ng-template #dsTemplate>
    @if (condition) {
      @if (nested) { <span>Content</span> }
    }
  </ng-template>
</ds-segmented-option>

<!-- ✅ Correct: Flatten conditionals -->
<ds-segmented-option name="opt" title="Option">
  <ng-template #dsTemplate>
    @if (showContent) { <span>Content</span> }
  </ng-template>
</ds-segmented-option>
```

Never manually add ARIA attributes.

```html
<!-- ❌ Incorrect: Manual ARIA -->
<ds-segmented-option 
  name="opt" 
  title="Option" 
  [attr.aria-selected]="true">
</ds-segmented-option>

<!-- ✅ Correct: Component manages ARIA -->
<ds-segmented-option name="opt" title="Option" />
```

## Key Rules

- Always import both `DsSegmentedControl` and `DsSegmentedOption`
- Always use `[(activeOption)]` for two-way binding
- Always provide unique `name` values for each option
- Always provide meaningful `title` for accessibility
- Always use `roleType="tablist"` for view switching
- Always use `roleType="radiogroup"` for form inputs
- Always use wrapper elements for layout and styling
- Always trust component's automatic keyboard navigation
- Always use `@for` with unique tracking expressions for dynamic options
- Never apply CSS classes or styles to host element (except CSS variable)
- Never use `[ngClass]` on host element
- Never use both `[(activeOption)]` and `(optionChanged)` together
- Never manually add ARIA attributes
- Never override keyboard navigation
- Never use nested `@if` in content projection
- Never apply display utilities to host element
