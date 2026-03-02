---
inclusion: manual
description: "DsAlert integration patterns for inline notifications, form validation errors, and status messages requiring user attention"
---

# DsAlert Integration Instructions

## Context

This guidance applies when displaying inline notifications, form validation errors, or status messages that need user attention. Use this when working with files that contain or reference DsAlert components.

## Component Import and Basic Usage

Always import `DsAlert` from `@frontend/ui/alert` for inline notifications and feedback messages.

```typescript
import { DsAlert } from '@frontend/ui/alert';

@Component({
  imports: [DsAlert]
})
```

Always use signal-based inputs for reactive state management.

```html
<ds-alert [type]="alertType()" [inverse]="isDarkMode()">
  {{ message() }}
</ds-alert>
```

## Type Selection Patterns

Always choose type based on message urgency and user action requirements.

```html
<!-- Form validation errors -->
<ds-alert type="error">{{ validationMessage }}</ds-alert>

<!-- Success confirmations -->
<ds-alert type="success">Account created successfully</ds-alert>

<!-- Warnings requiring attention -->
<ds-alert type="caution">Session will expire in 5 minutes</ds-alert>

<!-- Informational updates -->
<ds-alert type="info">New features available</ds-alert>
```

Always use conditional type binding for dynamic states.

```html
<ds-alert [type]="hasError() ? 'error' : 'success'">
  {{ statusMessage() }}
</ds-alert>
```

## Accessibility and Live Regions

Always set `politeness="assertive"` for critical errors and urgent notifications that require immediate user attention.

```html
<ds-alert type="error" politeness="assertive">
  Payment processing failed
</ds-alert>
```

Always use `politeness="polite"` for background updates and non-critical status changes.

```html
<ds-alert type="info" politeness="polite">
  Draft saved automatically
</ds-alert>
```

Always use `assertive` politeness for dynamically added alerts. Never rely on `polite` for new DOM elements.

```html
@if (showError()) {
  <ds-alert type="error" politeness="assertive">
    {{ errorMessage() }}
  </ds-alert>
}
```

## Slot Projection Patterns

Always use `slot="header"` for alert titles and `slot="footer"` for action buttons.

```html
<ds-alert type="success">
  <span slot="header">Operation Complete</span>
  Your changes have been saved successfully.
  <span slot="footer">
    <button ds-button variant="filled" kind="primary">Continue</button>
    <button ds-button variant="flat" kind="tertiary">Dismiss</button>
  </span>
</ds-alert>
```

Always use `slot="closeIcon"` for dismissible alerts with click handlers that call a function to update the alert's visibility state.

```html
<ds-alert type="caution">
  <span slot="header">Unsaved Changes</span>
  You have unsaved changes that will be lost.
  <button ds-button-icon slot="closeIcon" variant="flat" kind="tertiary" 
          (click)="dismissAlert()">
    <vn-icon name="theme-ex" size="12"></vn-icon>
  </button>
</ds-alert>
```

Always use `slot="actionIcon"` for inline actions within alert content.

```html
<ds-alert type="info">
  New update available
  <button slot="actionIcon" ds-button-icon variant="flat" kind="tertiary"
          (click)="viewUpdate()">
    <vn-icon name="theme-right" />
  </button>
</ds-alert>
```

Never use nested `@if` or `@for` directives within slot content. Always wrap complex conditionals in single elements.

## Layout and Styling Restrictions

Always use wrapper elements for display, positioning, and layout classes. Never apply these to the alert host.

```html
<!-- ✅ Correct -->
<div class="d-flex justify-content-center">
  <ds-alert type="info">Centered alert</ds-alert>
</div>

<!-- ❌ Incorrect -->
<ds-alert class="d-flex justify-content-center" type="info">
  Broken layout
</ds-alert>
```

Always use width utilities (`w-100`, `mw-100`) and spacing utilities (`mt-*`, `mb-*`) directly on alert host when needed.

```html
<ds-alert class="w-100 mt-3 mb-3" type="success">
  Full width alert with spacing
</ds-alert>
```

Never use `[ngClass]`, `[class]`, or `style` attributes on alert host for visual state changes. Always use the `[type]` input.

## State Management and Dismissal

Always manage alert visibility through component state and conditional rendering.

```typescript
export class AlertExampleComponent {
  showAlert = signal(true);
  
  dismissAlert() {
    this.showAlert.set(false);
  }
}
```

```html
@if (showAlert()) {
  <ds-alert type="success">
    <span slot="header">Success</span>
    Operation completed successfully.
    <button ds-button-icon slot="closeIcon" (click)="dismissAlert()">
      <vn-icon name="theme-ex" size="12"></vn-icon>
    </button>
  </ds-alert>
}
```

Always use signal-based reactive patterns for dynamic alert content and types.

Never rely on component internal state for dismissal. Always implement dismissal logic in parent component.

## Form Integration Patterns

Always use `type="error"` with `politeness="assertive"` for form validation feedback.

```html
@if (formErrors()) {
  <ds-alert type="error" politeness="assertive">
    <span slot="header">Validation Failed</span>
    {{ formErrors() }}
  </ds-alert>
}
```

Always use `type="success"` for form submission confirmations.

```html
@if (isSubmitted()) {
  <ds-alert type="success">
    <span slot="header">Form Submitted</span>
    Your information has been saved successfully.
  </ds-alert>
}
```

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
  <ds-alert [inverse]="true" type="info">
    <span slot="header">Important Notice</span>
    This alert maintains sufficient contrast (4.5:1 minimum) on dark backgrounds.
  </ds-alert>
</div>
```
