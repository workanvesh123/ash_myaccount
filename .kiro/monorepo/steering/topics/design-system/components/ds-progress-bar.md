---
inclusion: manual
description: "DsProgressBar integration patterns for progress indicators, completion tracking, and value visualization for ongoing processes"
---

# DsProgressBar Integration Instructions

## Context

This guidance applies when displaying progress indicators, completion tracking, or value visualization for ongoing processes. Use this when working with files that contain or reference DsProgressBar components.

## Component Overview

DsProgressBar displays task completion progress with configurable value modes, visual variants, and accessibility features. Use for upload progress, form completion, reward tracking, and goal visualization.

**Import:** `@frontend/ui/progress-bar` | **Selector:** `ds-progress-bar` | **Status:** STABLE

## Core API Decisions

### Value Mode Selection
Always choose the appropriate value mode based on your data structure:

```html
<!-- Percentage mode: currentValue 0-100 -->
<ds-progress-bar 
  valueMode="percentage" 
  [currentValue]="75" />

<!-- Value mode: currentValue within custom range -->
<ds-progress-bar 
  valueMode="value" 
  [currentValue]="60" 
  [startValue]="0" 
  [endValue]="200" />
```

### Essential Inputs
Always provide these core inputs for proper functionality:

- `currentValue: number` - Current progress value
- `valueMode: 'value' | 'percentage'` - How currentValue is interpreted
- `variant: 'primary' | 'neutral' | 'positive'` - Visual color scheme
- `showCounter: boolean` - Display numeric value inside bar

## Implementation Patterns

### Basic Progress Tracking
Always use signal binding for reactive progress updates:

```html
<ds-progress-bar 
  [currentValue]="uploadProgress()" 
  [endValue]="totalBytes()" 
  [showCounter]="true"
  [ariaLabel]="'File upload progress'" />
```

### Reward/Goal Tracking
Always use percentage mode with subtext for reward systems:

```html
<ds-progress-bar
  valueMode="percentage"
  [currentValue]="rewardProgress()"
  variant="positive"
  [inverse]="true">
  <div slot="start">{{ earnedPoints() }}/{{ totalPoints() }}</div>
  <div slot="end">{{ pointsRemaining() }} to go</div>
</ds-progress-bar>
```

## Slot Projection Rules

### Subtext Content
Always wrap conditional content in single elements per slot:

```html
<!-- ✅ Correct: Single wrapper per slot -->
<ds-progress-bar [currentValue]="progress()">
  <span slot="start">
    @if (isComplete()) { Complete }
    @else { In progress }
  </span>
  <span slot="end">ETA: {{ eta() }}</span>
</ds-progress-bar>

<!-- ❌ Incorrect: Nested conditionals -->
<ds-progress-bar [currentValue]="progress()">
  @if (showStart) { <div slot="start">Label</div> }
</ds-progress-bar>
```

### Empty Slots
Always provide empty slot elements when using conditional projection:

```html
<ds-progress-bar [currentValue]="value()">
  <div slot="start"></div>
  @if (showEndLabel()) {
    <div slot="end">{{ endLabel() }}</div>
  }
</ds-progress-bar>
```

## Layout Integration

### Width Control
Always use width utilities on the host element:

```html
<div class="col-6">
  <ds-progress-bar class="w-100" [currentValue]="50" />
</div>
```

### Container Wrapping
Never apply display, margin, or padding classes to the host. Always use wrapper elements:

```html
<!-- ❌ Never: Layout classes on host -->
<ds-progress-bar class="d-flex m-3" [currentValue]="50" />

<!-- ✅ Always: Wrapper for layout -->
<div class="d-flex m-3">
  <ds-progress-bar [currentValue]="50" />
</div>
```

## Styling Restrictions

### State Management
Never use dynamic classes or inline styles on the host. Always use component inputs:

```html
<!-- ❌ Never: Manual class binding -->
<ds-progress-bar [class.active]="isActive" [currentValue]="50" />

<!-- ✅ Always: Input-based state -->
<ds-progress-bar [variant]="isActive ? 'positive' : 'primary'" [currentValue]="50" />
```

### Width Constraints
Never apply inline width styles. Always use wrapper containers:

```html
<!-- ❌ Never: Inline styles -->
<ds-progress-bar style="width: 300px" [currentValue]="50" />

<!-- ✅ Always: Container styling -->
<div style="width: 300px">
  <ds-progress-bar [currentValue]="50" />
</div>
```

## Accessibility Implementation

### ARIA Labels
Always provide descriptive aria-label for context-specific progress:

```html
<ds-progress-bar 
  [ariaLabel]="'Upload progress for ' + fileName()" 
  [currentValue]="bytesUploaded()" 
  [endValue]="totalBytes()" />
```

### Auto-Generated Attributes
Never override auto-generated ARIA attributes. The component automatically provides:
- `role="progressbar"`
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- `aria-valuetext` (formatted for screen readers)

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
  <ds-progress-bar 
    [inverse]="true"
    [currentValue]="progress()" />
</div>
```

## Value Mode Logic

### Percentage Mode (0-100)
Always use when working with percentage data:

```html
<!-- currentValue must be 0-100 -->
<ds-progress-bar 
  valueMode="percentage" 
  [currentValue]="completionPercent()" />
```

### Value Mode (Custom Range)
Always use when working with absolute values:

```html
<!-- currentValue must be within startValue-endValue -->
<ds-progress-bar 
  valueMode="value" 
  [currentValue]="currentPoints()" 
  [startValue]="0" 
  [endValue]="requiredPoints()" />
```

## Common Patterns

### Loading States
Always show counter for loading feedback:

```html
<ds-progress-bar 
  variant="primary" 
  [currentValue]="loadingPercent()" 
  [showCounter]="true"
  [ariaLabel]="'Loading application data'" />
```

### Achievement Progress
Always use positive variant with pattern fill for achievements:

```html
<ds-progress-bar 
  variant="positive" 
  fill="pattern" 
  [currentValue]="achievementProgress()" 
  [showCounter]="true">
  <span slot="start">Your progress</span>
  <span slot="end">Goal: {{ targetValue() }}</span>
</ds-progress-bar>
```

## Edge Cases

### Zero Range Handling
Always handle cases where startValue equals endValue:

```typescript
// Component automatically shows 0% when startValue === endValue
const isValidRange = this.endValue() !== this.startValue();
```

### Value Clamping
Never worry about out-of-range values - component automatically clamps:
- Percentage mode: clamps to 0-100
- Value mode: clamps to startValue-endValue range

### Negative Ranges
Always ensure range setup for negative values includes both min and max attributes with min < 0 and max > 0:

```html
<!-- Supports negative ranges in value mode -->
<ds-progress-bar 
  valueMode="value" 
  [currentValue]="temperature()" 
  [startValue]="-50" 
  [endValue]="50" />
```
