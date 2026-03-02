---
inclusion: manual
description: "Use when implementing carousel navigation, directional controls, or interactive arrow buttons for navigation"
---

# DsArrow Integration Instructions

## Context

This guidance applies when implementing directional navigation controls for carousels, galleries, slideshows, or any interface requiring left/right navigation arrows. DsArrow provides accessible, themeable arrow buttons with consistent styling and behavior.

## Component Overview

DsArrow is a utility component that renders directional navigation arrows for carousels and galleries. It supports multiple sizes (small, medium, large), variants (strong, subtle), custom icon projection, and inverse mode for dark backgrounds. The component automatically handles accessibility attributes and provides a consistent navigation experience.

## Core Patterns

### Import and Setup

Always import `DsArrow` from `@frontend/ui/arrow` for directional navigation controls in carousels and galleries.

```typescript
import { DsArrow } from '@frontend/ui/arrow';

@Component({
  imports: [DsArrow]
})
```

Always use signal-based inputs for reactive state management.

```html
<ds-arrow [size]="arrowSize()" [direction]="'left'" (click)="prev()"></ds-arrow>
<ds-arrow [size]="arrowSize()" [direction]="'right'" (click)="next()"></ds-arrow>
```

### Positioning

Always use wrapper elements for carousel positioning and layout control. Never apply display or positioning classes directly to the ds-arrow host element.

```html
<!-- ✅ Correct: use wrapper for positioning -->
<div class="carousel-arrow-wrapper position-absolute">
  <ds-arrow direction="left"></ds-arrow>
</div>

<!-- ❌ Incorrect: breaks inline-flex layout -->
<ds-arrow class="d-block position-absolute"></ds-arrow>
```

### Direction

Always specify direction as either "left" or "right" to indicate navigation direction.

```html
<ds-arrow direction="left" (click)="navigatePrevious()"></ds-arrow>
<ds-arrow direction="right" (click)="navigateNext()"></ds-arrow>
```

## Template Usage

### Tooltip Integration

DsArrow can be integrated with tooltips for enhanced user guidance.

```html
<ds-arrow direction="left" [attr.aria-label]="'Previous slide'">
  <!-- Tooltip can wrap arrow if needed -->
</ds-arrow>
```

### Popover Integration

When arrows are part of popover controls, ensure the arrow's parent container has `position: relative` or `position: absolute` to establish positioning context.

```html
<div class="popover-navigation">
  <ds-arrow direction="left" (click)="previousItem()"></ds-arrow>
  <span>{{ currentItem() }} of {{ totalItems() }}</span>
  <ds-arrow direction="right" (click)="nextItem()"></ds-arrow>
</div>
```

### Custom Icon Projection

Always use template projection with `#dsArrow` reference for custom arrow visuals.

```html
<ds-arrow direction="left">
  <ng-template #dsArrow>
    <vn-icon name="theme-left"></vn-icon>
  </ng-template>
</ds-arrow>
```

Always provide fallback to default arrow when no custom template is needed.

```html
<!-- Default SVG arrow renders automatically -->
<ds-arrow direction="right"></ds-arrow>
```

Never nest complex conditionals within template projection.

```html
<!-- ✅ Correct: wrap conditionals in single element -->
<ds-arrow>
  <ng-template #dsArrow>
    <span>
      @if (useCustomIcon) { <vn-icon name="custom-arrow" /> }
      @else { <vn-icon name="default-arrow" /> }
    </span>
  </ng-template>
</ds-arrow>
```

## Input Properties

### Size Options

Always choose size based on viewport and content prominence.

```html
<!-- Compact carousels, mobile views -->
<ds-arrow size="small" direction="left"></ds-arrow>

<!-- Standard carousels, tab navigation -->
<ds-arrow size="medium" direction="right"></ds-arrow>

<!-- Hero carousels, large viewports -->
<ds-arrow size="large" direction="left"></ds-arrow>
```

### Variant Options

Always select variant based on visual hierarchy and emphasis.

```html
<!-- Primary carousel controls, main navigation -->
<ds-arrow variant="strong" direction="right"></ds-arrow>

<!-- Secondary controls, nested carousels -->
<ds-arrow variant="subtle" direction="left"></ds-arrow>
```

### Direction Property

- `direction="left"` - Previous/backward navigation
- `direction="right"` - Next/forward navigation

### Inverse Mode

Always use inverse mode when arrows appear on dark backgrounds.

```html
<div class="dark-carousel-background">
  <ds-arrow direction="left" [inverse]="true"></ds-arrow>
  <ds-arrow direction="right" [inverse]="true"></ds-arrow>
</div>
```

Always bind inverse to theme or background state signals.

```html
<ds-arrow 
  direction="left" 
  [inverse]="isDarkTheme() || hasImageBackground()">
</ds-arrow>
```

## Accessibility

### Built-in Accessibility

Always rely on built-in accessibility features for standard navigation.

```html
<!-- Automatic aria-label based on direction -->
<ds-arrow direction="left"></ds-arrow> <!-- aria-label="left arrow" -->
<ds-arrow direction="right"></ds-arrow> <!-- aria-label="right arrow" -->
```

### Custom Labels

Always provide custom aria-label for context-specific navigation.

```html
<ds-arrow direction="left" [attr.aria-label]="'Previous offer'"></ds-arrow>
<ds-arrow direction="right" [attr.aria-label]="'Next offer'"></ds-arrow>
```

### Role and Tabindex

Never override role or tabindex attributes - they are managed automatically.

```html
<!-- ❌ Incorrect: conflicts with built-in accessibility -->
<ds-arrow role="link" tabindex="-1"></ds-arrow>

<!-- ✅ Correct: trust component defaults -->
<ds-arrow direction="left"></ds-arrow>
```

## Common Use Cases

### Carousel Navigation

Always implement carousel navigation with conditional arrow visibility.

```html
<div class="image-carousel">
  @if (currentIndex() > 0) {
    <ds-arrow 
      class="carousel-prev" 
      direction="left" 
      size="medium"
      (click)="goToPrevious()">
    </ds-arrow>
  }
  
  <div class="carousel-slides">
    <!-- slide content -->
  </div>
  
  @if (currentIndex() < totalSlides() - 1) {
    <ds-arrow 
      class="carousel-next" 
      direction="right" 
      size="medium"
      (click)="goToNext()">
    </ds-arrow>
  }
</div>
```

### Gallery Navigation

```html
<div class="gallery-container">
  <div class="gallery-arrow gallery-arrow-left">
    <ds-arrow direction="left" size="large" (click)="prev()"></ds-arrow>
  </div>
  <div class="gallery-content">
    <!-- gallery items -->
  </div>
  <div class="gallery-arrow gallery-arrow-right">
    <ds-arrow direction="right" size="large" (click)="next()"></ds-arrow>
  </div>
</div>
```

### Slideshow Controls

```html
<div class="slideshow">
  @if (hasPrevious()) {
    <ds-arrow direction="left" variant="strong" (click)="navigatePrevious()"></ds-arrow>
  }
  @if (hasNext()) {
    <ds-arrow direction="right" variant="strong" (click)="navigateNext()"></ds-arrow>
  }
</div>
```

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
  <ds-arrow [inverse]="true" direction="left" (click)="prev()"></ds-arrow>
  <ds-arrow [inverse]="true" direction="right" (click)="next()"></ds-arrow>
</div>
```

## Anti-Patterns

Never use disabled attribute - it's not supported. Use conditional rendering instead.

```html
<!-- ❌ Never use disabled attribute - not supported -->
<ds-arrow [disabled]="!canNavigate"></ds-arrow>

<!-- ✅ Correct: use conditional rendering -->
@if (hasPrevious()) {
  <ds-arrow direction="left" (click)="prev()"></ds-arrow>
}
@if (hasNext()) {
  <ds-arrow direction="right" (click)="next()"></ds-arrow>
}
```

Never override internal CSS classes or use inline styles on the host.

```html
<!-- ❌ Incorrect: breaks design tokens -->
<ds-arrow style="background: red; width: 60px;"></ds-arrow>

<!-- ✅ Correct: use variant and size inputs -->
<ds-arrow variant="strong" size="large"></ds-arrow>
```

Never mix different arrow sizes or variants in the same navigation context.

```html
<!-- ❌ Incorrect: inconsistent styling -->
<ds-arrow size="small" variant="subtle" direction="left"></ds-arrow>
<ds-arrow size="large" variant="strong" direction="right"></ds-arrow>

<!-- ✅ Correct: consistent styling -->
<ds-arrow size="large" variant="strong" direction="left"></ds-arrow>
<ds-arrow size="large" variant="strong" direction="right"></ds-arrow>
```

## Key Rules

- Always import from `@frontend/ui/arrow`
- Always use wrapper elements for positioning and layout control
- Never apply display or positioning classes directly to ds-arrow host
- Always use conditional rendering instead of disabled state
- Always provide custom aria-label for context-specific navigation
- Never override role or tabindex attributes
- Always use inverse mode on dark backgrounds
- Always use consistent sizing and variants within the same context
- Never override internal CSS classes or use inline styles
- Always use template projection for custom icons
