---
inclusion: manual
description: "DsRadioButton integration patterns for mutually exclusive selection options in forms where only one choice is allowed"
---

# DsRadioButton Integration Guidelines

## Context

This guidance applies when creating mutually exclusive selection options in forms or interfaces where only one choice is allowed. Use this when working with files that contain or reference DsRadioButton and DsRadioGroup components.

## Core Integration Principles

**Always** wrap individual `ds-radio-button` components in `ds-radio-group` to enable single-selection state management and ARIA radio group semantics.

**Always** bind form state to the group using `[(value)]`, `[(ngModel)]`, or `formControlName` on `ds-radio-group`, never on individual buttons.

**Always** use the same `name` attribute value for all radio buttons within a group to ensure native browser grouping behavior.

**Never** apply `[ngClass]`, `[class]`, or `style` attributes directly to radio button components - use component inputs for styling.

**Never** manage individual button `[checked]` states manually when using group binding - let the group handle state synchronization.

## Import and Setup

```typescript
// Component imports
import { DsRadioButton, DsRadioGroup } from '@frontend/ui/radio-button';

@Component({
  imports: [DsRadioButton, DsRadioGroup],
  // ...
})
```

## Form Integration Patterns

### Reactive Forms
```html
<form [formGroup]="settingsForm">
  <ds-radio-group formControlName="preference" aria-label="Contact preference">
    <ds-radio-button value="email" name="contact">Email</ds-radio-button>
    <ds-radio-button value="phone" name="contact">Phone</ds-radio-button>
    <ds-radio-button value="sms" name="contact">SMS</ds-radio-button>
  </ds-radio-group>
</form>
```

### Template-Driven Forms
```html
<ds-radio-group [(ngModel)]="selectedOption" name="options" aria-label="Selection options">
  <ds-radio-button value="option1" name="options">Option 1</ds-radio-button>
  <ds-radio-button value="option2" name="options">Option 2</ds-radio-button>
</ds-radio-group>
```

## Accessibility Requirements

**Always** provide `aria-label` or `aria-labelledby` on `ds-radio-group` to describe the purpose of the radio group.

**Always** ensure all buttons in a group share the same `name` attribute so screen readers announce them as a related set (e.g., 'Payment method, 1 of 3').

```html
<!-- Correct ARIA labeling -->
<ds-radio-group aria-label="Payment method" [(value)]="paymentMethod">
  <ds-radio-button value="card" name="payment">Credit Card</ds-radio-button>
  <ds-radio-button value="bank" name="payment">Bank Transfer</ds-radio-button>
</ds-radio-group>

<!-- External label reference -->
<h3 id="gender-label">Gender</h3>
<ds-radio-group [attr.aria-labelledby]="'gender-label'" formControlName="gender">
  <ds-radio-button value="male" name="gender">Male</ds-radio-button>
  <ds-radio-button value="female" name="gender">Female</ds-radio-button>
</ds-radio-group>
```

## Layout and Styling

**Always** apply layout classes to `ds-radio-group` or wrapper elements, not individual buttons.

**Always** use component inputs (`size`, `labelPosition`) for styling instead of CSS overrides.

```html
<!-- Correct layout approach -->
<ds-radio-group class="d-flex gap-3" size="large" [(value)]="selection">
  <ds-radio-button value="opt1" name="options">Option 1</ds-radio-button>
  <ds-radio-button value="opt2" name="options">Option 2</ds-radio-button>
</ds-radio-group>

<!-- Wrapper for positioning -->
<div class="mb-4">
  <ds-radio-group size="medium" [(value)]="compactSelection">
    <ds-radio-button value="yes" name="compact">Yes</ds-radio-button>
    <ds-radio-button value="no" name="compact">No</ds-radio-button>
  </ds-radio-group>
</div>
```

## Content Projection

**Always** keep projected content simple - plain text or basic HTML elements only.

**Never** project complex nested structures or interactive elements into radio button labels.

```html
<!-- Correct content projection -->
<ds-radio-button value="premium" name="plan">
  <strong>Premium</strong> Plan - $29/month
</ds-radio-button>

<!-- Avoid complex nesting -->
<ds-radio-button value="complex" name="plan">
  <!-- ❌ Too complex -->
  <div class="wrapper">
    <span class="title">Title</span>
    <button>Action</button>
  </div>
</ds-radio-button>
```

## State Management

**Always** handle state changes through group value binding, not individual button events.

**Always** use group-level disabled state to disable all options simultaneously.

```typescript
// Component state management
export class SettingsComponent {
  selectedValue = signal('default');
  isDisabled = signal(false);
  
  onSelectionChange(value: string) {
    this.selectedValue.set(value);
    // Handle business logic here
  }
}
```

```html
<ds-radio-group 
  [value]="selectedValue()" 
  [disabled]="isDisabled()"
  (valueChange)="onSelectionChange($event)">
  <ds-radio-button value="opt1" name="options">Option 1</ds-radio-button>
  <ds-radio-button value="opt2" name="options">Option 2</ds-radio-button>
</ds-radio-group>
```

## Common Anti-Patterns

**Never** use individual button click handlers for state management:
```html
<!-- ❌ Incorrect -->
<ds-radio-button (click)="selectOption('opt1')" value="opt1">Option 1</ds-radio-button>

<!-- ✅ Correct -->
<ds-radio-group (valueChange)="selectOption($event)">
  <ds-radio-button value="opt1" name="options">Option 1</ds-radio-button>
</ds-radio-group>
```

**Never** mix different `name` attributes within the same group:
```html
<!-- ❌ Incorrect -->
<ds-radio-group [(value)]="selection">
  <ds-radio-button value="opt1" name="option1">Option 1</ds-radio-button>
  <ds-radio-button value="opt2" name="option2">Option 2</ds-radio-button>
</ds-radio-group>

<!-- ✅ Correct -->
<ds-radio-group [(value)]="selection">
  <ds-radio-button value="opt1" name="options">Option 1</ds-radio-button>
  <ds-radio-button value="opt2" name="options">Option 2</ds-radio-button>
</ds-radio-group>
```

## Size and Position Options

Use `size="large"` (48px) for standard desktop forms and `size="medium"` (40px) for compact layouts.

Use `labelPosition="right"` (default) for LTR layouts and `labelPosition="left"` for RTL or specialized patterns.

```html
<!-- Standard desktop form -->
<ds-radio-group size="large" [(value)]="preference">
  <ds-radio-button value="email" name="contact">Email notifications</ds-radio-button>
</ds-radio-group>

<!-- Compact mobile form -->
<ds-radio-group size="medium" [(value)]="mobilePreference">
  <ds-radio-button value="push" name="mobile">Push notifications</ds-radio-button>
</ds-radio-group>
```

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
  <ds-radio-group [inverse]="true" [(value)]="selection">
    <ds-radio-button value="opt1" name="options">Option 1</ds-radio-button>
    <ds-radio-button value="opt2" name="options">Option 2</ds-radio-button>
  </ds-radio-group>
</div>
```
