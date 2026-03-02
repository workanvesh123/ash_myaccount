---
inclusion: manual
description: "DsBadge integration patterns for status labels, category tags, user role indicators, and non-interactive visual markers"
---

# DsBadge Integration Instructions

## Context

This guidance applies when displaying status labels, category tags, user role indicators, or non-interactive visual markers. Use this when working with files that contain or reference DsBadge components.

## Component Import and Basic Usage

Always import `DsBadge` from `@frontend/ui/badge` for non-interactive status labels and visual markers.

```typescript
import { DsBadge } from '@frontend/ui/badge';

@Component({
  imports: [DsBadge]
})
```

Always use signal-based inputs for reactive state management with proper fallback patterns.

```html
<ds-badge 
  [variant]="statusVariant() || 'primary'" 
  [size]="badgeSize() || 'medium'">
  {{ statusText() }}
</ds-badge>
```

## Variant Selection Patterns

Always choose variant based on semantic meaning and visual emphasis requirements.

```html
<!-- Success states -->
<ds-badge variant="green-strong">Active</ds-badge>
<ds-badge variant="green">Verified</ds-badge>
<ds-badge variant="green-subtle">Available</ds-badge>

<!-- Error states -->
<ds-badge variant="red-strong">Critical</ds-badge>
<ds-badge variant="red">Error</ds-badge>
<ds-badge variant="red-subtle">Warning</ds-badge>

<!-- Information states -->
<ds-badge variant="blue">Info</ds-badge>
<ds-badge variant="primary">Default</ds-badge>
<ds-badge variant="neutral-subtle">Metadata</ds-badge>
```

Always use conditional variant binding for dynamic states with proper fallback values.

```html
<ds-badge 
  [variant]="offer.offerContent?.offerType?.dsVariant || 'primary'"
  [size]="offer.offerContent?.offerType?.dsSize || 'medium'"
  [inverse]="offer.offerContent?.offerType?.dsInverse || false">
  {{ offer.offerContent?.offerType?.text }}
</ds-badge>
```

## Slot Projection Patterns

Always use `slot="start"` for icons or indicators before text and `slot="end"` for icons after text.

```html
<ds-badge variant="green">
  <vn-icon slot="start" name="theme-success-i" size="12" aria-hidden="true"></vn-icon>
  Verified
</ds-badge>

<ds-badge variant="blue" size="xsmall">
  Label
  <vn-icon slot="end" name="theme-right" size="12" aria-hidden="true"></vn-icon>
</ds-badge>
```

Always use `slot="start"` for notification bubbles and counters.

```html
<ds-badge variant="primary">
  @if (offer.offerMetadata?.isGroupedTile && groupedOffersCount) {
    <ds-notification-bubble slot="start" size="small">
      {{ groupedOffersCount }}
    </ds-notification-bubble>
  }
  {{ offer.offerContent?.offerType?.text }}
</ds-badge>
```

Never use nested `@if` or `@for` directives within slot content. Always wrap complex conditionals in single elements.

## Layout and Styling Restrictions

Always use wrapper elements for display, positioning, and layout classes. Never apply these to the badge host.

```html
<!-- ✅ Correct -->
<div class="d-flex g-2 align-items-center">
  <ds-badge variant="primary">Primary</ds-badge>
  <ds-badge variant="green">Success</ds-badge>
  <ds-badge variant="red-subtle">Error</ds-badge>
</div>

<!-- ❌ Incorrect -->
<ds-badge class="d-flex g-2" variant="primary">Broken layout</ds-badge>
```

Always use width utilities (`w-100`, `mw-100`) and spacing utilities (`mt-*`, `mb-*`) directly on badge host when needed.

```html
<ds-badge class="w-100 mt-2 mb-2" variant="success">
  Full width status badge
</ds-badge>
```

Never use `[ngClass]`, `[class]`, or `style` attributes on badge host for visual state changes. Always use the `[variant]` input.

```html
<!-- ✅ Correct -->
<ds-badge [variant]="isActive() ? 'green-strong' : 'neutral'">
  {{ statusText() }}
</ds-badge>

<!-- ❌ Incorrect -->
<ds-badge [class.active-state]="isActive()" variant="primary">
  {{ statusText() }}
</ds-badge>
```

## Accessibility Patterns

Always add `aria-hidden="true"` to decorative icons within badges.

```html
<ds-badge variant="green">
  <vn-icon slot="start" name="theme-success-i" aria-hidden="true"></vn-icon>
  Verified Account
</ds-badge>
```

Always provide context-specific ARIA attributes for badges that convey important status information.

```html
<!-- Status indicator -->
<ds-badge variant="red" role="status" aria-label="Account suspended">
  Suspended
</ds-badge>

<!-- Count indicator -->
<ds-badge variant="blue" aria-label="3 unread messages">
  <ds-notification-bubble slot="start">3</ds-notification-bubble>
  Messages
</ds-badge>
```

Always use semantic wrapper elements for clickable badges. Never add click handlers directly to badge host.

```html
<!-- ✅ Correct -->
<button type="button" class="badge-button" (click)="filterByStatus()">
  <ds-badge variant="primary">Active Items</ds-badge>
</button>

<!-- ❌ Incorrect -->
<ds-badge variant="primary" (click)="filterByStatus()">
  Active Items
</ds-badge>
```

## State Management and Conditional Rendering

Always manage badge visibility through component state and conditional rendering with `@if`.

```typescript
export class BadgeExampleComponent {
  showBadge = signal(true);
  statusVariant = computed(() => 
    this.isActive() ? 'green-strong' : 'neutral'
  );
  
  toggleBadge() {
    this.showBadge.update(current => !current);
  }
}
```

```html
@if (showBadge()) {
  <ds-badge [variant]="statusVariant()" [size]="badgeSize()">
    {{ statusMessage() }}
  </ds-badge>
}
```

Always use signal-based reactive patterns for dynamic badge properties.

Never rely on CSS classes for badge state management. Always use component inputs.

## Size and Variant Decision Patterns

Always use `size="xsmall"` for compact lists, tags, and mobile interfaces.

```html
<div class="tag-list">
  <ds-badge variant="neutral-subtle" size="xsmall">Tag 1</ds-badge>
  <ds-badge variant="neutral-subtle" size="xsmall">Tag 2</ds-badge>
  <ds-badge variant="neutral-subtle" size="xsmall">Tag 3</ds-badge>
</div>
```

Always use `size="medium"` for standard content areas and card components.

```html
<ds-badge variant="green-strong" size="medium">
  Premium Member
</ds-badge>
```

Always follow variant intensity patterns: `strong` for high emphasis, base for default, `subtle` for low emphasis.

```html
<!-- High emphasis: critical status -->
<ds-badge variant="red-strong">Critical Error</ds-badge>

<!-- Default emphasis: standard status -->
<ds-badge variant="red">Error</ds-badge>

<!-- Low emphasis: metadata -->
<ds-badge variant="red-subtle">Minor Issue</ds-badge>
```

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
  <ds-badge [inverse]="true" variant="primary">
    Status Label
  </ds-badge>
</div>
```
