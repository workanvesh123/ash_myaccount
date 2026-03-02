---
inclusion: manual
description: "DsButton integration patterns for action buttons, CTAs, form submissions, and navigation links"
---

# DsButton Integration Instructions

## Context

This guidance applies when creating action buttons, CTAs, form submissions, or navigation links that require user interaction. Use this when working with files that contain or reference DsButton components.

## Component Import and Basic Usage

Always import `DsButton` from `@frontend/ui-button` for interactive elements and navigation.

```typescript
import { DsButton } from '@frontend/ui-button';

@Component({
  imports: [DsButton]
})
```

Always use semantic HTML: `<button ds-button>` for actions, `<a ds-button>` for navigation.

```html
<!-- Actions -->
<button ds-button (click)="submit()">Submit Form</button>
<button ds-button (click)="cancel()">Cancel</button>

<!-- Navigation -->
<a ds-button [routerLink]="['/dashboard']">Go to Dashboard</a>
<a ds-button href="/external">External Link</a>
```

## Variant and Kind Selection

Always choose variant based on visual hierarchy and kind based on semantic intent.

```html
<!-- Primary actions -->
<button ds-button variant="filled" kind="primary">Save Changes</button>

<!-- Secondary actions -->
<button ds-button variant="outline" kind="secondary">Cancel</button>

<!-- Tertiary actions -->
<button ds-button variant="flat" kind="tertiary">Learn More</button>

<!-- Success confirmations -->
<button ds-button variant="filled" kind="success">Complete</button>

<!-- Utility actions -->
<button ds-button variant="flat" kind="utility">Edit</button>
```

Never use unsupported variant+kind combinations. Always validate against supported configurations.

```html
<!-- ❌ Unsupported combinations -->
<button ds-button variant="flat" kind="primary">Invalid</button>
<button ds-button variant="outline" kind="success">Invalid</button>

<!-- ✅ Supported alternatives -->
<button ds-button variant="filled" kind="primary">Valid Primary</button>
<button ds-button variant="filled" kind="success">Valid Success</button>
```

## Signal-Based State Management

Always use signal-based inputs for reactive state management.

```html
<button ds-button 
        [variant]="buttonVariant()" 
        [loading]="isProcessing()" 
        [disabled]="!isFormValid()">
  {{ buttonText() }}
</button>
```

Always bind dynamic states using computed signals or conditional expressions.

```html
<button ds-button 
        [kind]="hasError() ? 'utility' : 'primary'"
        [size]="isMobile() ? 'medium' : 'large'">
  Process Payment
</button>
```

Never use manual subscriptions or imperative state updates for button properties.

## Slot Projection Patterns

Always use named slots for icons and additional content with proper slot attributes.

```html
<button ds-button variant="filled" kind="primary">
  <vn-icon slot="start" name="save" aria-hidden="true"></vn-icon>
  Save Document
  <vn-icon slot="end" name="arrow-right" aria-hidden="true"></vn-icon>
</button>
```

Always use `slot="subtext"` only with `size="large"` for additional context.

```html
<button ds-button size="large" variant="filled" kind="primary">
  Place Bet
  <span slot="subtext">Total: {{ totalAmount | currency }}</span>
</button>
```

Never use nested `@if` or `@for` directives within slot content. Always wrap complex conditionals in single elements.

```html
<!-- ✅ Correct -->
<button ds-button>
  <span slot="start">
    @if (loading) { <i class="spinner"></i> }
    @else { <vn-icon name="save"></vn-icon> }
  </span>
  Save
</button>

<!-- ❌ Incorrect -->
<button ds-button>
  @if (condition) { 
    @if (nested) { <vn-icon slot="start" name="save"></vn-icon> } 
  }
  Save
</button>
```

## Loading State and Custom Templates

Always use the `[loading]` input for loading states with automatic accessibility handling.

```html
<button ds-button [loading]="isSubmitting()" [disabled]="!canSubmit()">
  Submit Application
</button>
```

Always use `#loadingTemplate` for custom loading indicators when default spinner is insufficient.

```html
<button ds-button [loading]="isProcessing()">
  Process Payment
  <ng-template #loadingTemplate>
    <span class="custom-spinner"></span>
    Processing...
  </ng-template>
</button>
```

Never manually manage loading aria-labels. Always trust component's automatic `aria-label="Loading"` behavior.

## Layout and Styling Restrictions

Always use wrapper elements for display, positioning, and layout classes. Never apply these to button host.

```html
<!-- ✅ Correct -->
<div class="d-flex justify-content-center mb-3">
  <button ds-button>Centered Button</button>
</div>

<!-- ❌ Incorrect -->
<button ds-button class="d-flex justify-content-center mb-3">
  Broken Layout
</button>
```

Always use width utilities (`w-100`, `mw-100`) and margin utilities (`mt-*`, `mb-*`) directly on button host when needed.

```html
<button ds-button class="w-100 mt-3" variant="filled" kind="primary">
  Full Width Button
</button>
```

Never use `[ngClass]`, `[class]`, or `style` attributes on button host for visual state changes. Always use component inputs.

```html
<!-- ✅ Correct -->
<button ds-button [variant]="isActive() ? 'filled' : 'outline'">
  Toggle Action
</button>

<!-- ❌ Incorrect -->
<button ds-button [class.active]="isActive()" style="background: red">
  Broken Styling
</button>
```

## Accessibility Patterns

Always provide `aria-label` for icon-only buttons and buttons with unclear context.

```html
<button ds-button variant="flat" kind="utility" aria-label="Delete item">
  <vn-icon name="delete" aria-hidden="true"></vn-icon>
</button>
```

Always use `aria-expanded` for buttons that control collapsible content.

```html
<button ds-button 
        [attr.aria-expanded]="isMenuOpen()" 
        aria-controls="menu-panel">
  Menu
  <vn-icon slot="end" name="chevron-down" aria-hidden="true"></vn-icon>
</button>
```

Always use `aria-pressed` for toggle buttons that maintain state.

```html
<button ds-button 
        [attr.aria-pressed]="isFavorite()" 
        (click)="toggleFavorite()">
  <vn-icon slot="start" name="heart" aria-hidden="true"></vn-icon>
  Favorite
</button>
```

Never override component's automatic accessibility features (`aria-disabled`, loading aria-label).

## Form Integration Patterns

Always use appropriate button types for form contexts with proper semantic meaning.

```html
<form (ngSubmit)="onSubmit()">
  <button ds-button type="submit" [disabled]="!form.valid">
    Submit Form
  </button>
  <button ds-button type="button" variant="outline" kind="secondary" (click)="cancel()">
    Cancel
  </button>
</form>
```

Always handle form validation states through button disabled state and visual feedback.

```html
<button ds-button 
        type="submit" 
        [disabled]="form.invalid || isSubmitting()" 
        [loading]="isSubmitting()">
  Create Account
</button>
```

## Size and Responsive Patterns

Always choose button size based on context and available space.

```html
<!-- Large for hero sections and primary CTAs -->
<button ds-button size="large" variant="filled" kind="primary">
  Get Started Now
</button>

<!-- Medium for standard forms and modals -->
<button ds-button size="medium" variant="outline" kind="secondary">
  Learn More
</button>

<!-- Small for compact UI and table actions -->
<button ds-button size="small" variant="flat" kind="utility">
  Edit
</button>
```

Always use responsive size binding for different screen contexts.

```html
<button ds-button [size]="isMobile() ? 'medium' : 'large'">
  {{ actionText() }}
</button>
```

Never use subtext with small or medium sizes. Always restrict to `size="large"` only.

```html
<!-- ✅ Correct -->
<button ds-button size="large">
  Place Bet
  <span slot="subtext">Min: {{ minBet | currency }}</span>
</button>

<!-- ❌ Incorrect - subtext ignored -->
<button ds-button size="medium">
  Place Bet
  <span slot="subtext">Will not render</span>
</button>
```

## Text Handling and Truncation

Always use `[truncate]="true"` for buttons with dynamic text that may overflow.

```html
<button ds-button [truncate]="true" class="mw-200">
  {{ dynamicLongText() }}
</button>
```

Always use `[wrapText]="true"` for multi-line button content when space allows.

```html
<button ds-button [wrapText]="true" size="large">
  Complete Your Account Setup Process
  <span slot="subtext">This may take a few moments</span>
</button>
```

Never combine truncate and wrapText. Always choose one text handling strategy.

## Theme and Inverse Patterns

Always use `[inverse]="true"` for buttons on dark backgrounds or inverse theme contexts.

```html
<div class="dark-background">
  <button ds-button [inverse]="true" variant="filled" kind="primary">
    Light Button on Dark
  </button>
</div>
```

Always bind inverse state to theme signals for dynamic theme switching.

```html
<button ds-button [inverse]="isDarkTheme()" variant="outline" kind="secondary">
  Theme-Aware Button
</button>
```

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
  <button ds-button [inverse]="true" variant="filled" kind="primary">
    Action on Dark Background
  </button>
</div>
```

## Common Integration Patterns

Always group related buttons with consistent spacing and hierarchy.

```html
<div class="button-group d-flex gap-3">
  <button ds-button variant="filled" kind="primary" (click)="save()">
    Save Changes
  </button>
  <button ds-button variant="outline" kind="secondary" (click)="cancel()">
    Cancel
  </button>
  <button ds-button variant="flat" kind="utility" (click)="preview()">
    Preview
  </button>
</div>
```

Always handle loading states with proper user feedback and interaction prevention.

```html
<button ds-button 
        [loading]="isSubmitting()" 
        [disabled]="!canSubmit() || isSubmitting()"
        (click)="submitForm()">
  {{ isSubmitting() ? 'Submitting...' : 'Submit Application' }}
</button>
```

Always provide clear visual hierarchy in button groups using variant and kind combinations.

```html
<!-- Primary action stands out -->
<button ds-button variant="filled" kind="primary">Confirm Purchase</button>

<!-- Secondary actions are less prominent -->
<button ds-button variant="outline" kind="secondary">Add to Cart</button>
<button ds-button variant="flat" kind="tertiary">View Details</button>
```

Never mix semantic meanings within the same context. Always maintain consistent button purpose and hierarchy.
