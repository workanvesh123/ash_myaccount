---
inclusion: manual
description: "Use when implementing continuous value selection, price filters, volume controls, or numeric range inputs"
---

# DsRangeSelector Integration Instructions

## Context

This guidance applies when implementing continuous value selection controls, including price filters, volume controls, numeric range inputs, or any interface requiring dual-handle range selection. Use DsRangeSelector for trackable numeric ranges with visual feedback.

## Component Overview

DsRangeSelector provides an accessible slider control for selecting single values or numeric ranges. It supports three variants: linear (single value from left), centered (deviation from center point), and range (min-max selection with dual handles). The component integrates with Angular forms via ControlValueAccessor and provides real-time visual feedback during interaction.

Primary use cases include price range filters, volume controls, temperature adjustments, and any numeric input requiring visual representation of the selected range.

## Core Patterns

### Import and Setup

Always import `DsRangeSelector` from `@frontend/ui/range-selector` for continuous value selection controls.

```typescript
import { DsRangeSelector } from '@frontend/ui/range-selector';

@Component({
  imports: [DsRangeSelector, FormsModule, ReactiveFormsModule]
})
```

Always use `ds-range-selector` selector with appropriate variant for your use case.

```html
<!-- Single value selection -->
<ds-range-selector 
  variant="linear" 
  [min]="0" 
  [max]="100" 
  [value]="30">
</ds-range-selector>

<!-- Range selection -->
<ds-range-selector 
  variant="range" 
  [min]="0" 
  [max]="1000" 
  [values]="[200, 800]">
</ds-range-selector>
```

### Dual Handle Management

Always choose variant based on your data model and interaction needs.

| Variant | Value Type | Use Case | Visual Behavior |
|---------|------------|----------|-----------------|
| `linear` | `number` | Single value selection | Fill from left |
| `centered` | `number` | Deviation from center | Fill from center |
| `range` | `number[]` | Min-max selection | Fill between handles |

```html
<!-- Volume control -->
<ds-range-selector variant="linear" [value]="volume()" />

<!-- Temperature offset -->
<ds-range-selector variant="centered" [min]="-10" [max]="10" [value]="offset()" />

<!-- Price filter -->
<ds-range-selector variant="range" [values]="priceRange()" />
```

Always use exactly 2 elements in values array for range variant.

```typescript
// ✅ Correct range values
values = signal<number[]>([20, 80]);

// ❌ Wrong array length
values = signal<number[]>([20, 50, 80]);
```

### Value Binding

Always match value type to variant in form controls.

```typescript
// ✅ Correct type matching
form = this.fb.group({
  volume: [50], // linear/centered variant
  priceRange: [[20, 80]], // range variant
});

// ❌ Type mismatch causes errors
form = this.fb.group({
  priceRange: [50], // Should be array for range variant
});
```

Always use signal binding for reactive updates.

```html
<ds-range-selector 
  [min]="minValue()" 
  [max]="maxValue()" 
  [value]="currentValue()" 
  [disabled]="!enabled()">
</ds-range-selector>
```

Always update signals to trigger component recalculation.

```typescript
// Reactive value updates
updateRange(newMin: number, newMax: number) {
  this.minValue.set(newMin);
  this.maxValue.set(newMax);
  // Component automatically recalculates percentages
}
```

## Template Usage

### Form Integration

Always use `formControlName` or `[(ngModel)]` for form binding via ControlValueAccessor.

```html
<!-- Reactive forms -->
<form [formGroup]="filterForm">
  <ds-range-selector 
    formControlName="priceRange" 
    variant="range" 
    [min]="0" 
    [max]="1000">
  </ds-range-selector>
</form>

<!-- Template-driven forms -->
<ds-range-selector 
  [(ngModel)]="volumeLevel" 
  name="volume" 
  variant="linear" 
  [min]="0" 
  [max]="100">
</ds-range-selector>
```

### Validation

Always ensure step evenly divides the range to prevent orphan values.

```html
<!-- ✅ Clean divisions -->
<ds-range-selector [min]="0" [max]="100" [step]="10"></ds-range-selector>

<!-- ❌ Creates orphan at 100 -->
<ds-range-selector [min]="0" [max]="100" [step]="7"></ds-range-selector>
```

Always enable value controls for precise input when needed.

```html
<ds-range-selector 
  [enableValueControls]="true" 
  [stepIndicator]="true" 
  [valueTooltip]="true" 
  [value]="50">
</ds-range-selector>
```

### Event Handling

Always choose appropriate event based on timing needs.

```html
<!-- Live updates during drag -->
<ds-range-selector 
  [value]="volume()" 
  (onChange)="updateVolume($event.value)">
</ds-range-selector>

<!-- Final value after interaction -->
<ds-range-selector 
  [values]="priceRange()" 
  (onSlideEnd)="applyFilter($event.values)">
</ds-range-selector>
```

Always handle both single and range event types by checking the event structure: single events have `value: number`, range events have `value: { min: number, max: number }`.

```typescript
// onChange event handling
handleChange(event: DsRangeSelectorChangeEvent) {
  if (event.value !== undefined) {
    // Linear/centered variant
    this.updateSingleValue(event.value);
  }
  if (event.values !== undefined) {
    // Range variant
    this.updateRangeValues(event.values);
  }
}
```

### Layout Integration

Always use wrapper containers for width control and positioning.

```html
<!-- ✅ Container controls width -->
<div style="width: 656px;">
  <ds-range-selector [min]="0" [max]="100"></ds-range-selector>
</div>

<!-- ✅ Responsive width -->
<div class="w-100">
  <ds-range-selector [values]="[20, 80]"></ds-range-selector>
</div>
```

## Input Properties

### Required Properties

- `variant`: `'linear' | 'centered' | 'range'` - Determines value type and visual behavior
- `min`: `number` - Minimum value of the range
- `max`: `number` - Maximum value of the range

### Value Properties

- `value`: `number` - Single value for linear/centered variants
- `values`: `number[]` - Two-element array for range variant [min, max]

### Optional Properties

- `step`: `number` - Increment/decrement step size (default: 1)
- `enableValueControls`: `boolean` - Show numeric input controls
- `stepIndicator`: `boolean` - Display step markers on track
- `valueTooltip`: `boolean` - Show value tooltip during interaction
- `disabled`: `boolean` - Disable all interactions

### Accessibility Properties

- `leftHandleAriaLabel`: `string` - ARIA label for left/single handle
- `rightHandleAriaLabel`: `string` - ARIA label for right handle (range variant)

### Event Outputs

- `onChange`: Emits during drag with current value(s)
- `onSlideEnd`: Emits when interaction completes with final value(s)

## Accessibility Requirements

### ARIA Attributes

Always provide meaningful ARIA labels for screen readers.

```html
<ds-range-selector 
  variant="range" 
  [values]="[20, 80]" 
  leftHandleAriaLabel="Minimum price in dollars" 
  rightHandleAriaLabel="Maximum price in dollars">
</ds-range-selector>
```

The component automatically manages:
- `aria-valuemin`: Set to min property
- `aria-valuemax`: Set to max property
- `aria-valuenow`: Current handle value
- `role="slider"`: Applied to each handle

### Keyboard Navigation

Always trust auto-managed keyboard navigation:

- **Arrow keys**: Increment/decrement by step
- **Home**: Jump to minimum value
- **End**: Jump to maximum value
- **Tab**: Cycle between handles (range variant)

### Screen Reader Support

The component announces value changes during interaction and provides context through ARIA labels. Always ensure labels describe the purpose and unit of measurement.

```html
<!-- ✅ Descriptive labels -->
<ds-range-selector 
  leftHandleAriaLabel="Minimum temperature in celsius"
  rightHandleAriaLabel="Maximum temperature in celsius">
</ds-range-selector>

<!-- ❌ Generic labels -->
<ds-range-selector 
  leftHandleAriaLabel="Min"
  rightHandleAriaLabel="Max">
</ds-range-selector>
```

## Common Use Cases

### Price Ranges

```html
<form [formGroup]="filterForm">
  <label>Price Range</label>
  <ds-range-selector 
    formControlName="priceRange"
    variant="range" 
    [min]="0" 
    [max]="1000" 
    [step]="10"
    [enableValueControls]="true"
    leftHandleAriaLabel="Minimum price in dollars"
    rightHandleAriaLabel="Maximum price in dollars"
    (onSlideEnd)="applyPriceFilter($event.values)">
  </ds-range-selector>
</form>
```

### Date Ranges

```html
<ds-range-selector 
  variant="range" 
  [min]="0" 
  [max]="365" 
  [values]="dateRange()"
  [step]="1"
  leftHandleAriaLabel="Start day of year"
  rightHandleAriaLabel="End day of year"
  (onChange)="updateDateRange($event.values)">
</ds-range-selector>
```

### Numeric Filters

```html
<div class="filter-group">
  <label>Age Range</label>
  <ds-range-selector 
    variant="range" 
    [min]="18" 
    [max]="100" 
    [values]="ageRange()"
    [enableValueControls]="true"
    [stepIndicator]="true"
    leftHandleAriaLabel="Minimum age"
    rightHandleAriaLabel="Maximum age">
  </ds-range-selector>
</div>
```

### Volume Controls

```html
<ds-range-selector 
  variant="linear" 
  [min]="0" 
  [max]="100" 
  [value]="volume()"
  [valueTooltip]="true"
  leftHandleAriaLabel="Volume level percentage"
  (onChange)="setVolume($event.value)">
</ds-range-selector>
```

### Temperature Offset

```html
<ds-range-selector 
  variant="centered" 
  [min]="-10" 
  [max]="10" 
  [value]="temperatureOffset()"
  [step]="0.5"
  leftHandleAriaLabel="Temperature offset in degrees"
  (onSlideEnd)="applyTemperatureOffset($event.value)">
</ds-range-selector>
```

## Anti-Patterns

Never mix variant types with wrong value bindings.

```html
<!-- ❌ Type mismatch -->
<ds-range-selector variant="range" [value]="50"></ds-range-selector>

<!-- ✅ Correct binding -->
<ds-range-selector variant="range" [values]="[20, 80]"></ds-range-selector>
```

Never apply styling directly to the host element.

```html
<!-- ❌ Never style host -->
<ds-range-selector style="width: 500px" class="m-3"></ds-range-selector>

<!-- ✅ Always use wrapper -->
<div style="width: 500px" class="m-3">
  <ds-range-selector></ds-range-selector>
</div>
```

Never apply dynamic classes or inline styles to host.

```html
<!-- ❌ Breaks component logic -->
<ds-range-selector [ngClass]="{'active': isActive}"></ds-range-selector>

<!-- ✅ Use wrapper -->
<div [ngClass]="{'active': isActive}">
  <ds-range-selector></ds-range-selector>
</div>
```

Never override internal CSS classes with `::ng-deep`.

```scss
// ❌ Breaks design tokens
ds-range-selector { ::ng-deep .ds-range-selector-track { background: red; } }

// ✅ Use wrapper styling
.custom-range { ds-range-selector { /* host-only styles */ } }
```

Never use centered variant without negative min values.

```html
<!-- ❌ Center point unclear -->
<ds-range-selector variant="centered" [min]="0" [max]="100"></ds-range-selector>

<!-- ✅ Proper center at 0 -->
<ds-range-selector variant="centered" [min]="-50" [max]="50"></ds-range-selector>
```

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
  <ds-range-selector [inverse]="true" variant="range" [values]="[20, 80]"></ds-range-selector>
</div>
```

## Key Rules

- Always choose variant based on data model: linear (single), centered (deviation), range (min-max)
- Always match value type to variant: number for linear/centered, number[] for range
- Always use wrapper containers for width control and positioning
- Always provide descriptive ARIA labels including units of measurement
- Always ensure step evenly divides the range to prevent orphan values
- Always use exactly 2 elements in values array for range variant
- Always use formControlName or ngModel for form integration
- Always choose onChange for live updates or onSlideEnd for final values
- Never style the host element directly - use wrapper containers
- Never override internal CSS classes or design tokens
- Never mix variant types with incorrect value bindings
- Never use centered variant without negative min values
