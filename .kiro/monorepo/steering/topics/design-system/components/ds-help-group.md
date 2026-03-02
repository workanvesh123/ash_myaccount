---
inclusion: manual
description: "Use when displaying form validation messages, help text, or contextual assistance for form fields. Provides structured feedback with automatic ARIA linking and semantic type indicators."
---

# DsHelpGroup Integration Instructions

## Context

This guidance applies when implementing form validation feedback, help text, or contextual assistance for form fields. Use `ds-help-group` and `ds-help-item` to provide structured, accessible validation messages and guidance to users.

## Component Overview

`DsHelpGroup` and `DsHelpItem` are companion components designed for form validation and contextual help. They provide semantic feedback through type-based styling (error, success, caution, info) with automatic icon injection and ARIA live region announcements. When used within `ds-input-field`, they automatically establish ARIA relationships for screen reader accessibility.

**Primary Use Cases:**
- Form field validation messages
- Password requirement checklists
- Multi-rule validation feedback
- Contextual help text for inputs
- Progressive validation indicators

## Core Patterns

### Import and Setup

Always import both components for form validation contexts.

```typescript
import { DsHelpGroup, DsHelpItem } from '@frontend/ui-help-group';

@Component({
  imports: [DsHelpGroup, DsHelpItem],
  template: `...`
})
```

### Slot Projection Requirements

Always use `slot="text"` for message content. Never project text directly without the slot attribute.

```html
<!-- ✅ Correct: Text in slot -->
<ds-help-item type="error">
  <div slot="text">Field is required</div>
</ds-help-item>

<!-- ❌ Wrong: Direct text projection -->
<ds-help-item type="error">Field is required</ds-help-item>
```

Always use `slot="header"` in `ds-help-group` for titles and labels.

```html
<ds-help-group>
  <span slot="header">Password requirements:</span>
  <ds-help-item type="success">
    <div slot="text">At least 8 characters</div>
  </ds-help-item>
</ds-help-group>
```

### Semantic Type Selection

Always map validation states to help item types using this mapping: 'error' for failed validation, 'success' for passed validation, 'info' for neutral guidance, 'warning' for potential issues.

| State | Type | Use Case |
|-------|------|----------|
| Valid field | `success` | Confirmed valid input |
| Invalid field | `error` | Failed validation |
| Warning | `caution` | Potential issues |
| Helper text | `info` | Neutral guidance |

## Template Usage

### Basic Validation Message

```html
<ds-input-field labelText="Email">
  <input dsInput type="email" formControlName="email" />
  <ds-help-item type="error" slot="bottom">
    <div slot="text">Invalid email format</div>
  </ds-help-item>
</ds-input-field>
```

### Dynamic Validation Feedback

Always bind `type` input to form control state for dynamic feedback.

```html
<ds-input-field labelText="Email">
  <input dsInput type="email" formControlName="email" />
  <ds-help-item [type]="emailControl.valid ? 'success' : 'error'" slot="bottom">
    <div slot="text">{{ getValidationMessage() }}</div>
  </ds-help-item>
</ds-input-field>
```

### Conditional Validation Messages

```html
@if (passwordControl.invalid && passwordControl.touched) {
  <ds-help-item type="error" slot="bottom">
    <div slot="text">Password too short</div>
  </ds-help-item>
} @else if (passwordControl.valid) {
  <ds-help-item type="success" slot="bottom">
    <div slot="text">Password meets requirements</div>
  </ds-help-item>
}
```

### Multi-Rule Validation with DsHelpGroup

Always use `ds-help-group` for multiple validation rules with dynamic type switching.

```html
<ds-input-field labelText="Password">
  <input dsInput type="password" formControlName="password" />
  <ds-help-group slot="bottom">
    <span slot="header">Password must contain:</span>
    <ds-help-item [type]="hasMinLength() ? 'success' : 'error'">
      <div slot="text">At least 8 characters</div>
    </ds-help-item>
    <ds-help-item [type]="hasUppercase() ? 'success' : 'error'">
      <div slot="text">One uppercase letter</div>
    </ds-help-item>
    <ds-help-item [type]="hasNumber() ? 'success' : 'error'">
      <div slot="text">One number</div>
    </ds-help-item>
  </ds-help-group>
</ds-input-field>
```

### Right-Aligned Layout for Currency

Always use `[isRightAligned]="true"` for currency and stake inputs.

```html
<ds-input-field labelText="Stake" [isRightAligned]="true">
  <input dsInput type="number" formControlName="stake" />
  <ds-help-item type="error" [isRightAligned]="true" slot="bottom">
    <div slot="text">Minimum stake: $5.00</div>
  </ds-help-item>
</ds-input-field>
```

## Input Properties

### DsHelpItem Properties

**type** (required)
- Type: `'error' | 'success' | 'caution' | 'info'`
- Purpose: Determines semantic meaning, icon, and styling
- Usage: Bind to validation state for dynamic feedback

**isRightAligned** (optional)
- Type: `boolean`
- Default: `false`
- Purpose: Aligns content to the right for currency/numeric inputs
- Usage: Set to `true` for stake, currency, or right-aligned input fields

### DsHelpGroup Properties

**No configurable inputs** - `ds-help-group` is a container component that accepts slotted content only.

## Accessibility Requirements

### Automatic ARIA Linking

Never manually set ARIA attributes. `DsInputField` automatically links help items via `aria-describedby` when using `slot="bottom"`.

```html
<!-- ✅ Automatic ARIA linking -->
<ds-input-field labelText="Username">
  <input dsInput /> <!-- aria-describedby automatically set -->
  <ds-help-item type="info" slot="bottom">
    <div slot="text">6-20 characters only</div>
  </ds-help-item>
</ds-input-field>
```

### Live Region Announcements

Never override `aria-live` attributes. Components automatically use `aria-live="polite"` for non-intrusive screen reader announcements when validation states change.

### Icon Semantics

Never use `slot="icon"` to override icons. Icons are automatically injected based on `type` input to ensure consistent semantic meaning:
- `error`: Error icon with semantic meaning
- `success`: Success/checkmark icon
- `caution`: Warning icon
- `info`: Information icon

## Common Use Cases

### Form Validation Messages

Use `ds-help-item` with `slot="bottom"` in `ds-input-field` for field-specific validation feedback.

```html
<ds-input-field labelText="Username">
  <input dsInput formControlName="username" />
  @if (usernameControl.hasError('required') && usernameControl.touched) {
    <ds-help-item type="error" slot="bottom">
      <div slot="text">Username is required</div>
    </ds-help-item>
  }
  @if (usernameControl.hasError('minlength')) {
    <ds-help-item type="error" slot="bottom">
      <div slot="text">Username must be at least 6 characters</div>
    </ds-help-item>
  }
</ds-input-field>
```

### Password Strength Indicators

Use `ds-help-group` with multiple `ds-help-item` components to show progressive validation.

```html
<ds-help-group slot="bottom">
  <span slot="header">Password strength:</span>
  <ds-help-item [type]="hasMinLength() ? 'success' : 'error'">
    <div slot="text">Minimum 8 characters</div>
  </ds-help-item>
  <ds-help-item [type]="hasSpecialChar() ? 'success' : 'error'">
    <div slot="text">One special character</div>
  </ds-help-item>
  <ds-help-item [type]="hasUpperAndLower() ? 'success' : 'error'">
    <div slot="text">Upper and lowercase letters</div>
  </ds-help-item>
</ds-help-group>
```

### Contextual Help Text

Use `type="info"` for neutral guidance that isn't validation-related.

```html
<ds-input-field labelText="Promo Code">
  <input dsInput formControlName="promoCode" />
  <ds-help-item type="info" slot="bottom">
    <div slot="text">Enter your promotional code if you have one</div>
  </ds-help-item>
</ds-input-field>
```

### Warning Messages

Use `type="caution"` for non-blocking warnings or potential issues.

```html
<ds-input-field labelText="Withdrawal Amount">
  <input dsInput type="number" formControlName="amount" />
  @if (exceedsRecommended()) {
    <ds-help-item type="caution" slot="bottom">
      <div slot="text">This amount exceeds your recommended daily limit</div>
    </ds-help-item>
  }
</ds-input-field>
```

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
  <ds-help-item [inverse]="true" type="error">
    <div slot="text">Error message on dark background</div>
  </ds-help-item>
</div>
```

## Anti-Patterns

### Never Use Dynamic Classes

Never use `[class]` or `[ngClass]` on help component hosts. Always use `type` input for styling.

```html
<!-- ❌ Wrong: Dynamic classes -->
<ds-help-item [class.error]="hasError">
  <div slot="text">Error message</div>
</ds-help-item>

<!-- ✅ Correct: Type input -->
<ds-help-item [type]="hasError ? 'error' : 'success'">
  <div slot="text">Validation message</div>
</ds-help-item>
```

### Never Apply Inline Styles

Never use `style` or `[style.*]` on help component hosts. Always use wrapper elements for custom styling.

```html
<!-- ❌ Wrong: Inline styles on host -->
<ds-help-item style="color: red" type="error">
  <div slot="text">Error message</div>
</ds-help-item>

<!-- ✅ Correct: Wrapper element -->
<div style="color: red">
  <ds-help-item type="error">
    <div slot="text">Error message</div>
  </ds-help-item>
</div>
```

### Never Override Icon Slot

Never use `slot="icon"` to override icons. Icons are automatically injected based on `type` for semantic consistency.

```html
<!-- ❌ Wrong: Custom icon slot -->
<ds-help-item type="error">
  <vn-icon slot="icon" name="custom" />
  <div slot="text">Error message</div>
</ds-help-item>

<!-- ✅ Correct: Automatic icon -->
<ds-help-item type="error">
  <div slot="text">Error message</div>
</ds-help-item>
```

### Never Project Text Directly

Never project text content without using `slot="text"`.

```html
<!-- ❌ Wrong: Direct text projection -->
<ds-help-item type="error">This is an error</ds-help-item>

<!-- ✅ Correct: Text in slot -->
<ds-help-item type="error">
  <div slot="text">This is an error</div>
</ds-help-item>
```

### Never Apply Layout Classes to Hosts

Never apply layout classes directly to help component hosts. Always use wrapper elements.

```html
<!-- ❌ Wrong: Layout classes on host -->
<ds-help-item class="w-100 d-flex" type="error">
  <div slot="text">Error message</div>
</ds-help-item>

<!-- ✅ Correct: Wrapper element -->
<div class="w-100 d-flex">
  <ds-help-item type="error">
    <div slot="text">Error message</div>
  </ds-help-item>
</div>
```

## Key Rules

- Always import both `DsHelpGroup` and `DsHelpItem` for form validation contexts
- Always use `slot="text"` for message content, never project text directly
- Always use `slot="header"` in `ds-help-group` for titles
- Always use `slot="bottom"` in `ds-input-field` for automatic ARIA linking
- Always bind `type` input to validation state for dynamic feedback
- Always use `ds-help-group` for multiple validation rules
- Always use `[isRightAligned]="true"` for currency and stake inputs
- Never use `[class]` or `[ngClass]` on help component hosts
- Never use `style` or `[style.*]` on help component hosts
- Never override `slot="icon"` - icons are automatic based on type
- Never manually set ARIA attributes - automatic linking is provided
- Never override `aria-live` attributes - polite announcements are automatic
