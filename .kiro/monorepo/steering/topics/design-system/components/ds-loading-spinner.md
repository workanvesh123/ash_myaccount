---
inclusion: manual
description: "DsLoadingSpinner integration patterns for loading states, button loading indicators, and data fetching processes"
---

# DsLoadingSpinner Integration Guidelines

## Context

This guidance applies when displaying loading states for async operations, button loading indicators, or data fetching processes. Use this when working with files that contain or reference DsLoadingSpinner components.

## Core Integration Principles

### Always Use Conditional Display
Control spinner visibility with `@if` conditionals, not CSS classes or hidden attributes.

```html
@if (isLoading()) {
    <ds-loading-spinner />
}
```

### Always Import as Standalone Component
Add `DsLoadingSpinner` to component imports array to enable tree-shaking (unused code elimination) and explicit dependency tracking.

```typescript
import { DsLoadingSpinner } from '@frontend/ui/loading-spinner';

@Component({
    imports: [DsLoadingSpinner],
    // ...
})
```

### Always Use Wrapper Containers for Layout
Never apply display, flex, or positioning classes directly to `<ds-loading-spinner>`. Use wrapper elements for layout control.

```html
<!-- ✅ Correct -->
<div class="d-flex justify-content-center align-items-center">
    <ds-loading-spinner />
</div>

<!-- ❌ Incorrect -->
<ds-loading-spinner class="d-flex justify-content-center" />
```

## CSS Variable Customization

### Always Use Design System Tokens for Sizing
Customize spinner size using CSS variables with semantic size tokens, maintaining aspect ratio.

```scss
.custom-spinner {
    --ds-loading-indicator-size-width: var(--semantic-size-x4);
    --ds-loading-indicator-size-height: var(--semantic-size-x4);
}
```

### Always Override Position for Inline Contexts
Change default `fixed` positioning to `relative` or `static` for inline content integration.

```scss
.inline-spinner {
    --ds-loading-indicator-position: relative;
}
```

```html
<ds-loading-spinner class="inline-spinner" />
```

### Never Use Inline Styles
Always use CSS classes with custom properties instead of style attributes to maintain theming consistency.

```html
<!-- ❌ Never -->
<ds-loading-spinner style="width: 24px; height: 24px;" />

<!-- ✅ Always -->
<ds-loading-spinner class="small-spinner" />
```

## Accessibility Integration

### Always Trust Default ARIA Configuration
The component auto-manages `role="status"`, `aria-live="polite"`, `aria-busy="true"`, and `aria-label="Loading"` for standard use cases.

```html
<!-- No ARIA customization needed -->
<ds-loading-spinner />
```

### Always Use Assertive Mode for Critical Operations
Override `ariaLive` to `"assertive"` only for time-sensitive operations requiring immediate screen reader attention.

```html
<ds-loading-spinner 
    [ariaLive]="'assertive'" 
    [ariaLabel]="'Processing payment'" />
```

### Always Provide Context-Specific Labels
Use descriptive `ariaLabel` values instead of generic "Loading" for better user experience.

```html
<ds-loading-spinner [ariaLabel]="'Loading search results'" />
<ds-loading-spinner [ariaLabel]="'Validating your information'" />
```

## Service Integration Patterns

### Always Prefer @if Over Hidden Attribute
Use `@if` conditionals for DOM removal instead of `[hidden]` for better performance and accessibility.

```html
<!-- ✅ Modern pattern -->
@if (service.visible()) {
    <ds-loading-spinner />
}

<!-- ⚠️ Legacy pattern (migrate when possible) -->
<div [hidden]="!service.visible()">
    <ds-loading-spinner />
</div>
```

### Always Combine with Loading Messages
Wrap spinner and accompanying text in a `<div>` with `role="status"` and `aria-live="polite"` to announce loading state to screen readers.

```html
<div class="loading-container">
    <ds-loading-spinner />
    <span class="loading-message">{{ loadingMessage }}</span>
</div>
```

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
    <ds-loading-spinner [inverse]="true" />
</div>
```

## Legacy Migration Patterns

### Always Replace Deprecated Spinner Classes
Immediately migrate from legacy spinner implementations to maintain accessibility and design token consistency.

**Deprecated Classes to Replace:**
- `loading-v1`, `loading-v2`, `loading-v3`
- `dot-flashing`, `epcot-spinner`
- `lds-spinner`, `loading-indicator`
- `loading-ellipsis`

```html
<!-- ❌ Legacy -->
<div class="loading-v3">
    <div class="dot-flashing"></div>
</div>

<!-- ✅ Modern -->
<ds-loading-spinner />
```

### Always Maintain Existing Loading Logic
Preserve existing loading state management while updating only the visual spinner implementation.

```typescript
// Keep existing loading state logic
@if (validationInProgress) {
    <div class="validation-container">
        <ds-loading-spinner class="validation-spinner" />
        <div [vnDynamicHtml]="messages.validationInProgress"></div>
    </div>
}
```

## Performance Considerations

### Always Use OnPush Change Detection
The component uses `ChangeDetectionStrategy.OnPush` - ensure parent components trigger change detection by using signals, calling `markForCheck()`, or updating input bindings when loading state changes.

### Always Leverage Built-in Optimizations
Trust component's built-in performance features: `contain: strict`, `content-visibility: auto`, and `will-change: opacity` for optimal rendering.
