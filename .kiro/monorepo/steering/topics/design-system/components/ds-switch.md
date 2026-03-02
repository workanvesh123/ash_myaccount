---
inclusion: manual
description: "DsSwitch integration patterns for binary toggle switches for on/off states, settings, and feature toggles"
---

# DsSwitch Integration Instructions

## Context

This guidance applies when implementing binary toggle switches for on/off states, settings, or feature toggles. Use this when working with files that contain or reference DsSwitch components.

## Import and Setup

Always import `DsSwitch` from the design system package:

```typescript
import { DsSwitch } from '@frontend/ui/switch';

@Component({
  imports: [DsSwitch],
  template: `...`
})
```

## Forms Integration Patterns

### Template-Driven Forms
Always use `[(ngModel)]` for template-driven forms:

```html
<ds-switch [(ngModel)]="notificationsEnabled" name="notifications">
  <span slot="start">Notifications</span>
</ds-switch>
```

### Reactive Forms
Always use `formControlName` for reactive forms:

```html
<form [formGroup]="settingsForm">
  <ds-switch formControlName="darkMode">
    <span slot="start">Dark Mode</span>
  </ds-switch>
</form>
```

### Two-Way Binding
Always use `[(checked)]` for direct property binding:

```html
<ds-switch [(checked)]="isFeatureEnabled">
  <span slot="start">Features</span>
</ds-switch>
```

## State Management

Always use Angular Forms APIs for state changes - never manual event handling:

```typescript
// ✅ Correct - use formControl.valueChanges
this.settingsForm.get('notifications')!.valueChanges.subscribe(value => {
  this.updateNotificationSettings(value);
});

// ❌ Never - component doesn't emit events
// <ds-switch (change)="handler($event)"> // This won't work
```

Never use `(checkedChange)` output - component implements ControlValueAccessor pattern.

## Slot Projection

Always use slot="start" for labels that appear before (left of) the switch toggle. 

```html
<ds-switch [(ngModel)]="setting">
  <span slot="start">Enable feature</span>
</ds-switch>
```

Always use slot="end" for labels that appear after (right of) the switch toggle. 

```html
<ds-switch [(ngModel)]="setting">
  <span slot="end">Enable feature</span>
</ds-switch>
```

Always use `.sr-only` class for screen reader only labels:

```html
<ds-switch [(ngModel)]="compactMode">
  <span slot="start" class="sr-only">Compact mode</span>
</ds-switch>
```

Never omit slot attributes - they provide semantic meaning for assistive technology.

## Variant Selection

Always use `utility` variant for primary settings and feature toggles:

```html
<ds-switch [(ngModel)]="pushNotifications" variant="utility">
  <span slot="start">Push notifications</span>
</ds-switch>
```

Always use `neutral` variant for secondary or filter toggles:

```html
<ds-switch [(ngModel)]="showAdvanced" variant="neutral">
  <span slot="start">Show Advanced</span>
</ds-switch>
```

## Layout Integration

Never apply display or positioning classes directly to ds-switch:

```html
<!-- ❌ Never -->
<ds-switch class="d-flex justify-content-end" [(ngModel)]="value">

<!-- ✅ Always use wrapper -->
<div class="d-flex justify-content-end">
  <ds-switch [(ngModel)]="value">
    <span slot="start">Label</span>
  </ds-switch>
</div>
```

Always use margin utilities on host for spacing:

```html
<ds-switch class="mt-3 mb-2" [(ngModel)]="setting">
  <span slot="start">Label</span>
</ds-switch>
```

## Style Restrictions

Never use `[ngClass]` or dynamic classes on ds-switch host:

```html
<!-- ❌ Never -->
<ds-switch [ngClass]="{'active': isActive}" [(ngModel)]="value">

<!-- ✅ Always use component inputs -->
<ds-switch [(ngModel)]="value" [disabled]="!isActive">
```

Never use inline styles on ds-switch host:

```html
<!-- ❌ Never -->
<ds-switch style="margin-left: 10px" [(ngModel)]="value">

<!-- ✅ Always use wrapper or utility classes -->
<div style="margin-left: 10px">
  <ds-switch [(ngModel)]="value">
```

## Accessibility Implementation

Never add manual ARIA attributes - component auto-manages:
- `role="switch"` on internal input
- `aria-checked` synced with checked state
- `aria-required` when required input is true

Always use `[ariaLabel]` only when visible label is missing:

```html
<ds-switch [(ngModel)]="setting" [ariaLabel]="'Toggle dark mode'">
</ds-switch>
```

Always use `[ariaLabelledby]` to connect with external labels:

```html
<h3 id="notifications-heading">Email Notifications</h3>
<ds-switch [(ngModel)]="emailEnabled" [ariaLabelledby]="'notifications-heading'">
  <span slot="start">Email Notifications</span>
</ds-switch>
```

## Form Validation

Always use standard Angular validators with required switches:

```typescript
settingsForm = this.fb.group({
  termsAccepted: [false, Validators.requiredTrue]
});
```

```html
<ds-switch formControlName="termsAccepted" [required]="true">
  <span slot="start">Accept Terms</span>
</ds-switch>

@if (settingsForm.get('termsAccepted')?.hasError('required')) {
  <div class="error-message">You must accept the terms</div>
}
```

Always check form control state for validation feedback - component doesn't provide validation UI.

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
  <ds-switch [(ngModel)]="setting" [inverse]="true">
    <span slot="start">Enable feature</span>
  </ds-switch>
</div>
```

## Common Implementation Patterns

Settings page toggle with external label:

```html
<div class="setting-row d-flex justify-content-between align-items-center">
  <div>
    <div class="fw-bold" id="push-notif-label">Push Notifications</div>
    <div class="text-muted small">Receive alerts on your device</div>
  </div>
  <ds-switch [(ngModel)]="pushEnabled" variant="utility" [ariaLabelledby]="'push-notif-label'">
  </ds-switch>
</div>
```

Feature flag with visible labels:

```html
<ds-switch [(ngModel)]="betaFeatures" variant="utility">
  <span slot="start">Beta features</span>
</ds-switch>
```
