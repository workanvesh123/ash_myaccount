---
inclusion: manual
description: "DsCheckbox integration patterns for boolean options, multi-select forms, terms acceptance, and settings toggles"
---

# DsCheckbox Integration Instructions

## Context

This guidance applies when creating boolean options, multi-select forms, terms acceptance, or settings toggles that require user selection. Use this when working with files that contain or reference DsCheckbox components.

## Component Import and Basic Usage

Always import `DsCheckbox` from `@frontend/ui/checkbox` for boolean selection controls.

```typescript
import { DsCheckbox } from '@frontend/ui/checkbox';

@Component({
  imports: [DsCheckbox]
})
```

Always use `ds-checkbox` selector with content projection for labels.

```html
<!-- Boolean option -->
<ds-checkbox [checked]="isEnabled()" (checkedChange)="toggle($event)">
  Enable notifications
</ds-checkbox>

<!-- Terms acceptance -->
<ds-checkbox formControlName="termsAccepted" size="large">
  I agree to <a href="/terms" target="_blank">terms and conditions</a>
</ds-checkbox>
```

## Forms Integration

Always use `formControlName` or `[(ngModel)]` for form binding via ControlValueAccessor.

```html
<!-- Reactive forms -->
<form [formGroup]="settingsForm">
  <ds-checkbox formControlName="emailNotifications" size="medium">
    {{ sitecore.betslip.messages.EmailNotification }}
  </ds-checkbox>
</form>

<!-- Template-driven forms -->
<form #form="ngForm">
  <ds-checkbox 
    [(ngModel)]="settings.betslipSkipConfirmation" 
    name="betslipSkipConfirmation"
    size="medium">
    {{ sitecore.betslipSettings.SkipConfirmationText }}
  </ds-checkbox>
</form>
```

Always use `Validators.requiredTrue` for mandatory checkboxes (terms acceptance).

```typescript
form = this.fb.group({
  termsAccepted: [false, Validators.requiredTrue],
  newsletter: [false] // Optional checkbox
});
```

## Label Projection and Content

Always project label content inside `ds-checkbox` tags. Never use external `<label>` elements.

```html
<!-- ✅ Always - Content projection -->
<ds-checkbox [checked]="isAccepted()">
  Accept privacy policy
</ds-checkbox>

<!-- ✅ Always - Complex HTML content -->
<ds-checkbox formControlName="consent">
  I agree to <a href="/privacy" target="_blank">privacy policy</a> and 
  <a href="/terms" target="_blank">terms of service</a>
</ds-checkbox>

<!-- ❌ Never - External label -->
<ds-checkbox [checked]="value"></ds-checkbox>
<label for="checkbox-id">External label</label>
```

Always use size variants based on context: `medium` for compact forms, `large` for prominent settings.

```html
<!-- Compact forms, lists -->
<ds-checkbox size="medium" [(ngModel)]="category.unSubscribed">
  {{ category.communicationName }}
</ds-checkbox>

<!-- Standard forms, registration -->
<ds-checkbox size="large" formControlName="termsAccepted">
  I accept the terms and conditions
</ds-checkbox>
```

## State Management and Indeterminate

Always use signal-based inputs for state binding. Never use manual class manipulation.

```html
<!-- ✅ Always - Signal binding -->
<ds-checkbox 
  [checked]="notificationsEnabled()" 
  [disabled]="!canEdit()"
  (checkedChange)="updateNotifications($event)">
  Email notifications
</ds-checkbox>

<!-- ❌ Never - Manual classes -->
<ds-checkbox [class.active]="isActive">Label</ds-checkbox>
```

Always use `[indeterminate]="true"` for partial selection states (select-all scenarios).

```html
<!-- Select-all checkbox -->
<ds-checkbox 
  [checked]="allSelected()" 
  [indeterminate]="someSelected()"
  (checkedChange)="toggleAll($event)">
  Select All
</ds-checkbox>

@for (item of items(); track item.id) {
  <ds-checkbox 
    [checked]="item.selected()"
    (checkedChange)="item.selected.set($event)">
    {{ item.name }}
  </ds-checkbox>
}
```

## Layout Integration and Styling

Always use wrapper elements for positioning and layout. Never apply layout classes to host.

```html
<!-- ✅ Always - Wrapper for layout -->
<div class="d-flex justify-content-between">
  <ds-checkbox [checked]="enabled">Enable feature</ds-checkbox>
</div>

<!-- ✅ Always - Grid positioning -->
<div class="col-6">
  <ds-checkbox formControlName="newsletter">Subscribe</ds-checkbox>
</div>

<!-- ❌ Never - Layout on host -->
<ds-checkbox class="d-flex w-100" [checked]="value">Label</ds-checkbox>
```

Never use inline styles or dynamic classes on host. Always use component inputs for state.

```html
<!-- ❌ Never - Inline styles -->
<ds-checkbox style="margin-top: 10px" [checked]="value">Label</ds-checkbox>

<!-- ❌ Never - Dynamic classes -->
<ds-checkbox [ngClass]="{'active': isActive}" [checked]="value">Label</ds-checkbox>

<!-- ✅ Always - Wrapper styling -->
<div class="mt-2">
  <ds-checkbox [checked]="value">Label</ds-checkbox>
</div>
```

## Accessibility and ARIA

Always rely on built-in ARIA attributes. Component automatically manages `aria-checked`, `aria-label`.

```html
<!-- Auto-managed accessibility -->
<ds-checkbox [checked]="isEnabled">Enable notifications</ds-checkbox>
```

Always use `ariaLabel` or `ariaDescribedby` for additional context when needed.

```html
<!-- Custom aria-label for icon-only -->
<ds-checkbox 
  [checked]="privacyEnabled"
  ariaLabel="Enable privacy mode">
</ds-checkbox>

<!-- Error association -->
<ds-checkbox 
  formControlName="terms"
  ariaDescribedby="terms-error">
  Accept terms
</ds-checkbox>
<div id="terms-error" class="error">
  @if (form.get('terms')?.errors) {
    You must accept the terms to continue
  }
</div>
```

## Form Validation Patterns

Always display validation errors using Angular form state, not custom logic.

```html
<ds-checkbox formControlName="termsAccepted" size="large">
  I agree to terms and conditions
</ds-checkbox>

@if (form.get('termsAccepted')?.invalid && form.get('termsAccepted')?.touched) {
  <div class="error">{{ validationMessages.termsRequired }}</div>
}
```

Always use appropriate validators for checkbox requirements.

```typescript
// Required checkbox (must be true)
termsAccepted: [false, Validators.requiredTrue]

// Optional checkbox (true/false both valid)
newsletter: [false, Validators.required]

// Custom validation
privacyConsent: [false, (control) => 
  control.value ? null : { consentRequired: true }
]
```

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
  <ds-checkbox [inverse]="true" [checked]="isEnabled()">
    Enable notifications
  </ds-checkbox>
</div>
```

## Real-World Implementation Examples

**Multi-select with indeterminate state:**
```html
<ds-checkbox
  [checked]="allRacesSelected()"
  [indeterminate]="someRacesSelected()"
  [disabled]="preferNotToSay()"
  (checkedChange)="toggleAllRaces($event)">
  Select All Races
</ds-checkbox>
```

**Settings toggle with dynamic state:**
```html
<ds-checkbox
  name="betslip-settings-email-notify"
  size="medium"
  [disabled]="!notificationsViewModel.email.enabled"
  [checked]="notificationsViewModel.email.value"
  (checkedChange)="onNotificationToggled($event, 'email')">
  {{ notificationsViewModel.email.label }}
</ds-checkbox>
```

**Terms acceptance with validation:**
```html
<form [formGroup]="registrationForm">
  <ds-checkbox formControlName="termsAccepted" size="large">
    I agree to <a href="/terms" target="_blank">terms and conditions</a>
  </ds-checkbox>
  
  @if (form.get('termsAccepted')?.invalid && form.get('termsAccepted')?.touched) {
    <div class="error">{{ validationMessages.termsRequired }}</div>
  }
</form>
```
