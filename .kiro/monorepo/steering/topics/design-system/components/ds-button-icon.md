---
inclusion: manual
description: "DsButtonIcon integration patterns for icon-only buttons like delete, edit, close, and compact interactive controls"
---

# DsButtonIcon Integration Guide

## Context

This guidance applies when creating icon-only buttons for actions like delete, edit, close, or other compact interactive controls. Use this when working with files that contain or reference DsButtonIcon components.

## Component API

### Input Properties

Always use signal-based inputs with proper type constraints.

| Input | Type | Default | Usage |
|-------|------|---------|-------|
| `variant` | `'flat' \| 'filled' \| 'outline' \| 'flat-reduced'` | `'filled'` | Visual appearance |
| `kind` | `'primary' \| 'secondary' \| 'tertiary' \| 'utility'` | `'primary'` | Semantic tone |
| `size` | `'small' \| 'medium' \| 'large'` | `'large'` | Button dimensions |
| `disabled` | `boolean` | `false` | Interaction state |
| `inverse` | `boolean` | `false` | Dark background styling |

```typescript
// ✅ Always import and add to component imports
import { DsButtonIcon } from '@frontend/ui/button-icon';

@Component({
  imports: [DsButtonIcon],
  template: `...`
})
```

### Size Guidelines

Always choose size based on context and touch target requirements.

| Size | Dimensions | Use Case |
|------|------------|----------|
| `small` | 28px | Compact UIs, inline actions, mobile |
| `medium` | 36px | Standard density, form controls |
| `large` | 44px | Touch targets, headers, primary actions |

## Semantic HTML Patterns

### Element Selection

Always use `button` for actions, `a` for navigation. Never mix semantics.

```html
<!-- ✅ Actions -->
<button ds-button-icon aria-label="Delete item" (click)="delete()">
  <vn-icon name="delete" aria-hidden="true"></vn-icon>
</button>

<!-- ✅ Navigation -->
<a ds-button-icon aria-label="Settings" [routerLink]="'/settings'">
  <vn-icon name="settings" aria-hidden="true"></vn-icon>
</a>

<!-- ❌ Never -->
<div ds-button-icon>Invalid</div>
<button ds-button-icon [routerLink]="'/path'">Invalid</button>
```

### Event Handling

Always use native DOM events. Component provides no Angular `@Output()` bindings.

```html
<button ds-button-icon (click)="save()" (focus)="onFocus()">
  <vn-icon name="save" aria-hidden="true"></vn-icon>
</button>
```

## Accessibility Requirements

### Mandatory ARIA Labels

Always provide accessible names. Icons alone are insufficient for assistive technology.

```html
<!-- ✅ aria-label -->
<button ds-button-icon aria-label="Delete item">
  <vn-icon name="delete" aria-hidden="true"></vn-icon>
</button>

<!-- ✅ aria-labelledby -->
<button ds-button-icon aria-labelledby="delete-label">
  <vn-icon name="delete" aria-hidden="true"></vn-icon>
</button>
<span id="delete-label" class="sr-only">Delete item</span>

<!-- ❌ Missing accessible name -->
<button ds-button-icon>
  <vn-icon name="delete"></vn-icon>
</button>
```

### Icon Hiding

Always add `aria-hidden="true"` on projected icons to prevent double announcements.

```html
<button ds-button-icon aria-label="Settings">
  <vn-icon name="settings" aria-hidden="true"></vn-icon>
</button>
```

### Context-Specific ARIA

Always add state ARIA for toggles and expandable content.

```html
<!-- Toggle state -->
<button ds-button-icon [attr.aria-pressed]="isFavorite" aria-label="Favorite">
  <vn-icon [name]="isFavorite ? 'star-filled' : 'star'" aria-hidden="true"></vn-icon>
</button>

<!-- Expandable content -->
<button ds-button-icon [attr.aria-expanded]="isOpen" aria-controls="menu" aria-label="Menu">
  <vn-icon name="menu" aria-hidden="true"></vn-icon>
</button>
```

## Layout Integration

### Host Element Restrictions

Never apply display, positioning, or spacing classes directly to component host.

```html
<!-- ❌ Never on host -->
<button ds-button-icon class="d-flex m-3 position-absolute">
  <vn-icon name="close" aria-hidden="true"></vn-icon>
</button>

<!-- ✅ Always use wrapper -->
<div class="d-flex justify-content-center m-3">
  <button ds-button-icon aria-label="Close">
    <vn-icon name="close" aria-hidden="true"></vn-icon>
  </button>
</div>
```

### Allowed Host Classes

Always limit host classes to width utilities and semantic attributes.

```html
<!-- ✅ Allowed -->
<button ds-button-icon class="w-100" aria-label="Action" data-testid="btn">
  <vn-icon name="action" aria-hidden="true"></vn-icon>
</button>
```

## Common Usage Patterns

### Close Buttons

Always use tertiary + flat for modal/drawer close actions.

```html
<button slot="end" ds-button-icon kind="tertiary" variant="flat" size="large" 
        aria-label="Close" (click)="close()">
  <vn-icon name="close" aria-hidden="true"></vn-icon>
</button>
```

### Form Actions

Always use medium size with flat-reduced variant for form controls.

```html
<div class="d-flex gap-2">
  <button ds-button-icon size="medium" variant="flat-reduced" kind="tertiary" 
          aria-label="Edit item" (click)="edit()">
    <vn-icon name="edit" aria-hidden="true"></vn-icon>
  </button>
  <button ds-button-icon size="medium" variant="filled" kind="primary" 
          aria-label="Delete item" (click)="delete()">
    <vn-icon name="delete" aria-hidden="true"></vn-icon>
  </button>
</div>
```

### Navigation Back

Always use small size with flat-reduced for back navigation.

```html
<button ds-button-icon size="small" variant="flat-reduced" kind="utility"
        aria-label="Back to previous page" (click)="goBack()">
  <vn-icon name="arrow-left" aria-hidden="true"></vn-icon>
</button>
```

### Favorite Toggle

Always bind aria-pressed and dynamic icon names for toggle states.

```html
<button ds-button-icon variant="flat" size="medium" kind="tertiary"
        [attr.aria-pressed]="isFavorite" 
        [attr.aria-label]="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
        (click)="toggleFavorite()">
  <vn-icon [name]="isFavorite ? 'heart-filled' : 'heart'" aria-hidden="true"></vn-icon>
</button>
```

## State Management

### Signal Binding

Always bind component inputs to signals for reactive updates.

```typescript
export class MyComponent {
  protected readonly isDisabled = signal(false);
  protected readonly buttonSize = signal<DsButtonIconSizes>('large');
  
  toggleDisabled() {
    this.isDisabled.update(disabled => !disabled);
  }
}
```

```html
<button ds-button-icon [disabled]="isDisabled()" [size]="buttonSize()" 
        aria-label="Action">
  <vn-icon name="action" aria-hidden="true"></vn-icon>
</button>
```

### Conditional Rendering

Always use `@if` for visibility control, never CSS classes.

```html
@if (showDeleteButton) {
  <button ds-button-icon aria-label="Delete" (click)="delete()">
    <vn-icon name="delete" aria-hidden="true"></vn-icon>
  </button>
}
```

## Variant Combinations

### Supported Combinations

Always verify variant + kind combinations are supported before use.

| Variant | Primary | Secondary | Tertiary | Utility |
|---------|---------|-----------|----------|---------|
| `filled` | ✅ | ✅ | ✅ | ❌ |
| `outline` | ✅ | ✅ | ✅ | ❌ |
| `flat` | ❌ | ❌ | ✅ | ✅ |
| `flat-reduced` | ❌ | ❌ | ✅ | ✅ |

### Common Patterns

```html
<!-- Primary actions -->
<button ds-button-icon variant="filled" kind="primary">
<button ds-button-icon variant="outline" kind="secondary">

<!-- Utility actions -->
<button ds-button-icon variant="flat" kind="tertiary">
<button ds-button-icon variant="flat-reduced" kind="utility">
```

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
  <button ds-button-icon [inverse]="true" variant="flat" kind="tertiary" 
          aria-label="Close">
    <vn-icon name="close" aria-hidden="true"></vn-icon>
  </button>
</div>
```
