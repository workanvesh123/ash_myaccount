---
inclusion: manual
description: "DsCard integration patterns for content containers, product cards, dashboard widgets, and grouped layout sections"
---

# DsCard Integration Instructions

## Context

This guidance applies when creating content containers, product cards, dashboard widgets, or grouped layout sections. Use this when working with files that contain or reference DsCard components.

## Component Import and Basic Usage

Always import `DsCard` from `@frontend/ui/card` for content containers and visual grouping.

```typescript
import { DsCard, DsCardContent } from '@frontend/ui/card';
import { DsCardHeader } from '@frontend/ui/card-header';

@Component({
  imports: [DsCard, DsCardContent, DsCardHeader]
})
```

Always use the new surface API instead of deprecated variant for theming.

```html
<!-- New API -->
<ds-card surface="lowest" [elevated]="true">Content</ds-card>

<!-- Avoid deprecated variant -->
<ds-card variant="surface-lowest">Content</ds-card>
```

## Surface Selection and Theming

Always choose surface based on visual hierarchy and content importance.

```html
<!-- Default containers -->
<ds-card surface="lowest">Base content</ds-card>

<!-- Secondary containers -->
<ds-card surface="low">Nested content</ds-card>

<!-- Important containers -->
<ds-card surface="high">Featured content</ds-card>

<!-- Critical containers -->
<ds-card surface="highest">Modal overlays</ds-card>
```

Always use `[elevated]="true"` for shadow instead of CSS box-shadow overrides.

```html
<!-- Correct elevation -->
<ds-card surface="low" [elevated]="true">Elevated card</ds-card>

<!-- Never override with CSS -->
<ds-card style="box-shadow: 0 4px 8px rgba(0,0,0,0.2)">Bad</ds-card>
```

## Content Projection and Composition

Always use `<ds-card-content>` for padded content and raw card for full-bleed layouts.

```html
<!-- Padded content -->
<ds-card surface="lowest">
  <ds-card-content>Text with 12px padding</ds-card-content>
</ds-card>

<!-- Full-bleed content -->
<ds-card surface="low" style="overflow: hidden">
  <img src="image.jpg" style="width: 100%" />
  <ds-card-content>Caption below image</ds-card-content>
</ds-card>
```

Always import `DsCardHeader` from separate package for header composition.

```html
<ds-card surface="low" [elevated]="true">
  <ds-card-header title="Card Title" subtitle="Optional subtitle" />
  <ds-card-content>Card body content</ds-card-content>
</ds-card>
```

Never nest control flow (`@if`/`@for`) in content projection - use wrapper elements.

## Layout Integration and Styling

Always use layout styles on host element for positioning and sizing.

```html
<!-- Layout styles allowed -->
<ds-card style="height: 300px; width: 250px; display: flex">
  <ds-card-content style="flex-grow: 1">Flexible content</ds-card-content>
</ds-card>

<!-- Width utilities work -->
<div class="row">
  <div class="col-6">
    <ds-card class="w-100">Half-width card</ds-card>
  </div>
</div>
```

Never override design tokens with inline styles or CSS classes on host.

Always use wrapper elements for external positioning and display modes.

```html
<!-- Wrapper for centering -->
<div class="d-flex justify-content-center">
  <ds-card>Centered card</ds-card>
</div>

<!-- Wrapper for custom classes -->
<div class="custom-container">
  <ds-card surface="lowest">Card content</ds-card>
</div>
```

## Interactive Cards and Semantic HTML

Always wrap interactive cards in semantic elements (`<a>`, `<button>`) for accessibility.

```html
<!-- Navigation cards -->
<a [routerLink]="['/details', item.id]" class="text-decoration-none">
  <ds-card [clickable]="true" surface="lowest">
    <ds-card-content>{{ item.title }}</ds-card-content>
  </ds-card>
</a>

<!-- Action cards -->
<button (click)="selectCard()" class="w-100 text-start border-0 p-0 bg-transparent">
  <ds-card [clickable]="true" surface="low">
    <ds-card-content>Selectable content</ds-card-content>
  </ds-card>
</button>
```

Never make the card itself interactive - use `[clickable]="true"` only for hover animation.

Always use semantic HTML inside cards: `<article>` for standalone content, `<section>` for thematic grouping, heading tags (`<h2>`, `<h3>`) for titles, and `<p>` for body text.

```html
<ds-card surface="lowest">
  <article aria-labelledby="card-title">
    <h2 id="card-title">Article Title</h2>
    <p>Article content with semantic HTML elements (headings, paragraphs, lists)</p>
  </article>
</ds-card>
```

## State Management and Signal Binding

Always bind signals to card inputs for reactive state management.

```html
<!-- Signal-based surface selection -->
<ds-card [surface]="cardSurface()" [elevated]="isElevated()">
  <ds-card-content>{{ content() }}</ds-card-content>
</ds-card>

<!-- Conditional properties -->
<ds-card 
  [surface]="isImportant() ? 'high' : 'lowest'"
  [border]="showBorder()"
  [clickable]="isInteractive()">
  Content
</ds-card>
```

Never use `[ngClass]` for visual state on card host - use component inputs.

Always use `@if` for conditional visibility instead of CSS display classes.

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
  <ds-card [inverse]="true" surface="low" [border]="true">
    <ds-card-header [inverse]="true" title="Dark Theme Card" />
    <ds-card-content>Content in inverse theme</ds-card-content>
  </ds-card>
</div>
```

## Accessibility

Always provide ARIA attributes that describe the card's purpose: `aria-labelledby` to reference the card title, `role="article"` for standalone content, `role="region"` with `aria-label` for landmark cards.

Never add ARIA roles to the card host - let projected content manage accessibility.
