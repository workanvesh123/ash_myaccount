---
inclusion: manual
description: "Pagination dots for carousels, image galleries, and step-by-step processes"
---

# DsPaginationIndicator Integration Instructions

## Context

This guidance applies when implementing pagination dots for carousels, image galleries, or multi-step form progress indicators. Use DsPaginationIndicator to provide visual navigation feedback and allow users to jump between slides, images, or steps.

## Component Overview

DsPaginationIndicator is a visual navigation component that displays a series of dots representing pages, slides, or steps. Each dot can be selected to indicate the current position and clicked to navigate to a specific item. The component is designed for carousel navigation, image gallery selectors, and multi-step process indicators.

Primary use cases:
- Carousel slide navigation
- Image gallery page indicators
- Multi-step form progress
- Onboarding flow navigation
- Content slideshow controls

## Core Patterns

### Import and Setup

Always import DsPaginationIndicator in your component:

```typescript
import { DsPaginationIndicator } from '@frontend/ui/pagination-indicator';

@Component({
  selector: 'app-carousel',
  imports: [DsPaginationIndicator],
  template: `...`
})
export class CarouselComponent {}
```

### Page State Management

Always generate indicator arrays using computed values or methods:

```typescript
export class CarouselComponent {
  private readonly slideCount = signal(5);
  
  protected readonly slideIndexes = computed(() => 
    Array.from({ length: this.slideCount() }, (_, i) => i)
  );
  
  protected readonly currentSlide = signal(0);
}
```

### Navigation Patterns

Always implement navigation with bounds checking:

```typescript
navigateToSlide(index: number) {
  if (index >= 0 && index < this.slides().length) {
    this.currentSlide.set(index);
    // Update carousel/gallery state
  }
}
```

Always prevent redundant navigation for current state:

```typescript
onIndicatorClick(index: number, event: Event) {
  if (this.currentIndex() === index) {
    event.stopPropagation();
    return;
  }
  this.navigateToSlide(index);
}
```

## Template Usage

### Basic Pattern

Always use @for loops with index tracking for indicator generation:

```html
<div role="group" aria-label="Slide navigation" class="pagination-container">
  @for (i of slideIndexes(); track i) {
    <ds-pagination-indicator 
      [selected]="i === currentSlide()" 
      (click)="navigateToSlide(i)" />
  }
</div>
```

### Selected State Binding

Always bind selected state using index comparison:

```html
<!-- ✅ Correct: Index comparison -->
<ds-pagination-indicator [selected]="i === currentIndex()" />

<!-- ❌ Wrong: Class binding -->
<ds-pagination-indicator [class.active]="i === currentIndex()" />
```

### Layout Container

Always wrap indicators in a flex container with proper spacing:

```html
<div style="display: flex; justify-content: center; gap: 4px;">
  @for (i of slideIndexes(); track i) {
    <ds-pagination-indicator 
      [selected]="i === currentSlide()" 
      (click)="navigateToSlide(i)" />
  }
</div>
```

### Mobile vs Desktop

Use consistent patterns across breakpoints, adjusting only container spacing:

```html
<!-- Mobile: Smaller gap -->
<div style="display: flex; justify-content: center; gap: 2px;">
  @for (i of slideIndexes(); track i) {
    <ds-pagination-indicator [selected]="i === currentSlide()" />
  }
</div>

<!-- Desktop: Standard gap -->
<div style="display: flex; justify-content: center; gap: 4px;">
  @for (i of slideIndexes(); track i) {
    <ds-pagination-indicator [selected]="i === currentSlide()" />
  }
</div>
```

## Input Properties

### Required Properties

None - component works with default state.

### Optional Properties

**selected** (boolean)
- Indicates if this indicator represents the current page/slide
- Default: `false`
- Usage: `[selected]="i === currentIndex()"`

**inverse** (boolean)
- Enables inverse color scheme for dark backgrounds
- Default: `false`
- Usage: `[inverse]="true"`

### State Management Properties

Always manage state in parent component, not in DsPaginationIndicator:

```typescript
export class GalleryComponent {
  protected readonly currentIndex = signal(0);
  protected readonly images = signal<Image[]>([]);
  
  selectImage(index: number) {
    this.currentIndex.set(index);
  }
}
```

## Accessibility Requirements

### ARIA Attributes

Always wrap indicator groups in role="group" with descriptive aria-label:

```html
<!-- Carousel navigation -->
<div role="group" aria-label="Slide navigation">
  @for (i of slideIndexes(); track i) {
    <ds-pagination-indicator 
      [selected]="i === currentSlide()" 
      (click)="navigateToSlide(i)" />
  }
</div>

<!-- Multi-step form -->
<div role="group" [attr.aria-label]="'Step ' + (currentStep() + 1) + ' of ' + totalSteps()">
  @for (i of stepIndexes(); track i) {
    <ds-pagination-indicator 
      [selected]="i === currentStep()" 
      (click)="goToStep(i)" />
  }
</div>
```

### Keyboard Navigation

Always implement arrow key navigation for better keyboard UX:

```typescript
handleKeydown(event: KeyboardEvent, index: number) {
  if (event.key === 'ArrowRight' && index < this.slides().length - 1) {
    event.preventDefault();
    this.goToSlide(index + 1);
  } else if (event.key === 'ArrowLeft' && index > 0) {
    event.preventDefault();
    this.goToSlide(index - 1);
  }
}
```

```html
<div role="group" aria-label="Slide navigation" (keydown)="handleKeydown($event, currentSlide())">
  @for (i of slideIndexes(); track i) {
    <ds-pagination-indicator 
      [selected]="i === currentSlide()" 
      (click)="navigateToSlide(i)"
      tabindex="0" />
  }
</div>
```

### Screen Reader Support

Always provide context about total count and current position:

```html
<div role="group" [attr.aria-label]="'Image ' + (currentImage() + 1) + ' of ' + totalImages()">
  @for (i of imageIndexes(); track i) {
    <ds-pagination-indicator 
      [selected]="i === currentImage()" 
      (click)="selectImage(i)"
      [attr.aria-label]="'Go to image ' + (i + 1)" />
  }
</div>
```

## Common Use Cases

### Table Pagination

Use for visual page indicators in data tables:

```html
<div class="table-pagination">
  <button (click)="previousPage()">Previous</button>
  
  <div role="group" aria-label="Page navigation" style="display: flex; gap: 4px;">
    @for (i of pageIndexes(); track i) {
      <ds-pagination-indicator 
        [selected]="i === currentPage()" 
        (click)="goToPage(i)" />
    }
  </div>
  
  <button (click)="nextPage()">Next</button>
</div>
```

### Content Pagination

Use for article or content section navigation:

```html
<div role="group" aria-label="Content navigation" class="content-pagination">
  @for (section of sections(); track section.id; let i = $index) {
    <ds-pagination-indicator 
      [selected]="i === activeSection()" 
      (click)="scrollToSection(i)" />
  }
</div>
```

### Carousel Indicators

Use for image carousel or slideshow navigation:

```html
<div class="carousel-container">
  <div class="carousel-slides">
    <!-- Carousel content -->
  </div>
  
  <div role="group" aria-label="Slide navigation" class="carousel-pagination">
    @for (i of slideIndexes(); track i) {
      <ds-pagination-indicator 
        [selected]="i === currentSlide()" 
        (click)="navigateToSlide(i)" />
    }
  </div>
</div>
```

### Image Gallery Selector

Use for thumbnail-less image gallery navigation:

```html
<div role="group" aria-label="Image selector" class="gallery-pagination">
  @for (img of images(); track img.id; let i = $index) {
    <ds-pagination-indicator 
      [selected]="i === activeImage()" 
      (click)="selectImage(i)" />
  }
</div>
```

### Step Indicators

Use for multi-step form or onboarding progress:

```html
<div role="group" aria-label="Step progress" class="step-indicators">
  @for (step of steps(); track step; let i = $index) {
    <ds-pagination-indicator 
      [selected]="i === currentStep()"
      (click)="goToStep(i)" />
  }
</div>
```

### Integration with Swiper

Always check swiper instance before navigation:

```typescript
export class SwiperCarouselComponent {
  @ViewChild('carousel') carousel?: SwiperComponent;
  
  paginationClick(index: number) {
    const swiperInstance = this.carousel?.swiper;
    if (!swiperInstance) return;
    
    if (swiperInstance.params.loop) {
      swiperInstance.slideToLoop(index);
    } else {
      swiperInstance.slideTo(index);
    }
  }
}
```

```html
<swiper-container #carousel>
  <!-- Slides -->
</swiper-container>

<div role="group" aria-label="Slide navigation">
  @for (i of slideIndexes(); track i) {
    <ds-pagination-indicator 
      [selected]="i === currentSlide()" 
      (click)="paginationClick(i)" />
  }
</div>
```

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
  <div role="group" aria-label="Slide navigation">
    @for (i of slideIndexes(); track i) {
      <ds-pagination-indicator 
        [selected]="i === currentSlide()" 
        [inverse]="true"
        (click)="navigateToSlide(i)" />
    }
  </div>
</div>
```

## Anti-Patterns

Never apply display, sizing, or positioning classes directly to ds-pagination-indicator:

```html
<!-- ❌ Wrong: Direct styling on component -->
<ds-pagination-indicator class="d-flex w-100" />

<!-- ✅ Correct: Wrapper element -->
<div class="d-flex"><ds-pagination-indicator /></div>
```

Never use inline styles on the component host:

```html
<!-- ❌ Wrong: Inline styles on host -->
<ds-pagination-indicator style="opacity: 0.5" />

<!-- ✅ Correct: Wrapper with styles -->
<div style="opacity: 0.5"><ds-pagination-indicator /></div>
```

Never override component CSS classes or use ::ng-deep:

```scss
/* ❌ Wrong: Deep styling */
ds-pagination-indicator {
  ::ng-deep .ds-pagination-dot {
    background: red;
  }
}

/* ✅ Correct: Use component inputs */
```

Never use custom pagination dots or Bootstrap pagination components:

```html
<!-- ❌ Wrong: Custom dots -->
<div class="custom-dot" [class.active]="isActive"></div>

<!-- ❌ Wrong: Bootstrap pagination -->
<ul class="pagination">
  <li class="page-item"><a class="page-link">1</a></li>
</ul>

<!-- ✅ Correct: DsPaginationIndicator -->
<ds-pagination-indicator [selected]="isActive" />
```

Never use [class.active] for selected state:

```html
<!-- ❌ Wrong: Class binding -->
<ds-pagination-indicator [class.active]="i === currentIndex()" />

<!-- ✅ Correct: Selected input -->
<ds-pagination-indicator [selected]="i === currentIndex()" />
```

## Key Rules

- Always use DsPaginationIndicator for carousel navigation, image galleries, and step indicators
- Always generate indicators using @for loops with index tracking
- Always bind selected state using index comparison with [selected] input
- Always wrap indicator groups in role="group" with descriptive aria-label
- Always implement arrow key navigation for keyboard accessibility
- Always use wrapper elements for layout and styling, never style the component host directly
- Always check bounds before navigating to prevent invalid states
- Always prevent event propagation for current/disabled states
- Use [inverse]="true" for dark backgrounds
- Never use custom pagination dots or Bootstrap pagination components
- Never apply display, sizing, or positioning classes directly to ds-pagination-indicator
- Never use inline styles on the component host
- Never override component CSS classes with ::ng-deep
- Never use [class.active] for selected state
