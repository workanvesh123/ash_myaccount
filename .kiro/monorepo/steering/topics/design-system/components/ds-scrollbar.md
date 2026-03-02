---
inclusion: manual
description: "Use when implementing consistent scrollbar theming and custom scroll behavior across different browsers"
---

# DsScrollbar Integration Instructions

## Context

This guidance applies when implementing consistent scrollbar theming across different browsers and integrating custom scroll behavior. DsScrollbar is a pure styling wrapper that provides design system tokens for scrollbars without creating scroll behavior - content must define overflow properties.

## Component Overview

DsScrollbar provides consistent scrollbar theming across browsers with support for both native scrollbars and ng-scrollbar integration. It's a styling wrapper component that applies design system tokens to scrollable content. The component handles cross-browser compatibility automatically, using webkit pseudo-elements for Chrome/Safari and standard properties for Firefox.

## Core Patterns

### Import and Setup

Always import `DsScrollbar` from `@frontend/ui/scrollbar` for consistent scrollbar styling.

```typescript
import { DsScrollbar } from '@frontend/ui/scrollbar';

@Component({
  imports: [DsScrollbar]
})
```

### Custom Styling

Always ensure content defines scroll behavior - component only provides styling.

```html
<!-- ✅ Correct: Content defines overflow -->
<ds-scrollbar>
  <div style="height: 200px; overflow-y: auto;">
    <div>Long content that scrolls...</div>
  </div>
</ds-scrollbar>

<!-- ❌ Incorrect: No scroll behavior defined -->
<ds-scrollbar>
  <div>Content without overflow</div>
</ds-scrollbar>
```

### Browser Compatibility

Always rely on component's built-in browser detection - never override.

- **Webkit browsers:** Uses `::-webkit-scrollbar` pseudo-elements
- **Firefox:** Uses `scrollbar-color` and `scrollbar-width` properties
- **Fallback:** Graceful degradation to native scrollbars

## Template Usage

### Basic Scrollbar Styling

```html
<ds-scrollbar>
  <div style="max-height: 300px; overflow-y: auto;">
    <div>Scrollable content...</div>
  </div>
</ds-scrollbar>
```

### Global Application

Always choose between global or scoped scrollbar styling based on requirements.

```typescript
// Global application - affects all scrollbars
@Component({
  selector: 'app-root',
  host: { class: 'ds-scrollbar' }
})
export class AppComponent {}
```

### Scoped Application

```typescript
// Scoped application - specific areas only
@Component({
  imports: [DsScrollbar],
  template: `
    <ds-scrollbar>
      <div style="height: 300px; overflow-y: auto;">
        <!-- scrollable content -->
      </div>
    </ds-scrollbar>
  `
})
```

### ng-scrollbar Integration

Always wrap ng-scrollbar elements to inherit design system tokens.

```html
<ds-scrollbar [inverse]="theme() === 'dark'">
  <ng-scrollbar style="height: 300px;">
    <div>Scrollable content</div>
  </ng-scrollbar>
</ds-scrollbar>
```

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
  <ds-scrollbar [inverse]="true">
    <div style="max-height: 300px; overflow-y: auto;">
      Scrollable content on dark background
    </div>
  </ds-scrollbar>
</div>
```

## Input Properties

### Inverse Mode

Always use `[inverse]` input for dark backgrounds - never manual CSS classes.

```html
<!-- ✅ Correct: Signal-based inverse -->
<ds-scrollbar [inverse]="isDarkTheme()">
  <div style="overflow: auto;">Dark themed content</div>
</ds-scrollbar>

<!-- ❌ Incorrect: Manual class application -->
<ds-scrollbar class="ds-scrollbar-inverse">
  <div>Content</div>
</ds-scrollbar>
```

- `inverse: boolean` - Dark scrollbar for dark backgrounds (default: false)

## Accessibility

### Focus Management

Always ensure scrollable containers are keyboard accessible.

```html
<ds-scrollbar>
  <div 
    role="region" 
    aria-label="Messages" 
    tabindex="0" 
    style="overflow: auto;">
    Scrollable content
  </div>
</ds-scrollbar>
```

### Semantic Preservation

Never alter semantic structure - component preserves projected content roles.

```html
<ds-scrollbar>
  <ul role="listbox" style="overflow: auto;">
    <li role="option">Item 1</li>
    <li role="option">Item 2</li>
  </ul>
</ds-scrollbar>
```

## Common Use Cases

### List Component Integration

```html
<ds-scrollbar>
  <div 
    class="list-container" 
    style="max-height: 300px; overflow-y: auto;"
    role="list">
    <div role="listitem">Item 1</div>
    <div role="listitem">Item 2</div>
  </div>
</ds-scrollbar>
```

### Table Integration

```html
<ds-scrollbar [inverse]="darkMode()">
  <div style="max-height: 400px; overflow: auto;">
    <table>
      <thead><tr><th>Header</th></tr></thead>
      <tbody><tr><td>Data</td></tr></tbody>
    </table>
  </div>
</ds-scrollbar>
```

### Modal Content Integration

```html
<ds-modal>
  <ds-modal-content>
    <ds-scrollbar>
      <div style="max-height: 60vh; overflow-y: auto;">
        Long modal content that scrolls
      </div>
    </ds-scrollbar>
  </ds-modal-content>
</ds-modal>
```

### Host Element Integration

Always use host binding pattern for global application.

```typescript
@Component({
  selector: 'ms-main',
  template: '...'
})
export class MainComponent {
  @HostBinding('class') className = 'main-container ds-scrollbar';
}
```

### Modal Dialog Integration

Always apply scrollbar styling to modal containers.

```typescript
@Component({
  selector: 'ms-modal-dialog',
  template: '...'
})
export class ModalDialogComponent {
  @HostBinding('class') className = 'ds-scrollbar';
}
```

## Anti-Patterns

### Manual Styling Override

Never bypass component theming system.

```html
<!-- ❌ Never: Direct scrollbar styling -->
<style>
  .custom ::-webkit-scrollbar-thumb { background: blue; }
</style>

<!-- ✅ Always: Use component inputs -->
<ds-scrollbar [inverse]="needsDarkTheme">
  <div class="custom">Content</div>
</ds-scrollbar>
```

### Missing Scroll Behavior

Never expect component to create scrolling - only provides styling.

```html
<!-- ❌ Never: No overflow defined -->
<ds-scrollbar>
  <div>Very long content that should scroll</div>
</ds-scrollbar>

<!-- ✅ Always: Content defines scroll -->
<ds-scrollbar>
  <div style="max-height: 200px; overflow-y: auto;">
    Very long content that scrolls
  </div>
</ds-scrollbar>
```

### Incorrect Class Application

Never manually apply inverse classes.

```html
<!-- ❌ Never: Manual inverse class -->
<ds-scrollbar class="ds-scrollbar-inverse">
  Content
</ds-scrollbar>

<!-- ✅ Always: Input-based theming -->
<ds-scrollbar [inverse]="true">
  Content  
</ds-scrollbar>
```

### Layout on Component Host

Never apply layout styles to ds-scrollbar host - component is inline wrapper.

```html
<!-- ❌ Incorrect: Layout on component host -->
<ds-scrollbar class="d-flex flex-column">
  <div>Content</div>
</ds-scrollbar>

<!-- ✅ Correct: Wrapper handles layout -->
<div class="d-flex flex-column">
  <ds-scrollbar>
    <div style="flex: 1; overflow: auto;">Content</div>
  </ds-scrollbar>
</div>
```

### Sizing on Component

Always let projected content control dimensions.

```html
<!-- ❌ Incorrect: Size on component -->
<ds-scrollbar style="height: 400px; width: 100%;">
  <div>Content</div>
</ds-scrollbar>

<!-- ✅ Correct: Content controls size -->
<ds-scrollbar>
  <div style="max-height: 400px; width: 100%; overflow: auto;">
    Content with defined constraints
  </div>
</ds-scrollbar>
```

### CSS Custom Properties Override

Never override component-provided CSS variables manually.

```scss
// ❌ Never override manually - breaks design tokens
.custom-scrollbar ::-webkit-scrollbar-thumb {
  background: red;
}

// ✅ Component sets these automatically:
// --scrollbar-thumb-color
// --scrollbar-thumb-hover-color  
// --scrollbar-track-color
// --scrollbar-size
// --scrollbar-border-radius
```

## Key Rules

- Always import from `@frontend/ui/scrollbar`
- Always ensure content defines scroll behavior (overflow properties)
- Never expect component to create scrolling - only provides styling
- Always use `[inverse]` input for dark backgrounds
- Never manually apply inverse classes
- Always let projected content control dimensions
- Never apply layout styles to ds-scrollbar host
- Always preserve semantic structure of projected content
- Always ensure scrollable containers are keyboard accessible
- Never override component theming system with manual CSS
- Always rely on built-in browser compatibility handling
