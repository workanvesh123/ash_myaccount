---
inclusion: manual
description: "Use when creating filter chips, navigation pills, tag displays, or removable tags for categorization and selection"
---

# DsPill Integration Instructions

## Context

This guidance applies when implementing filter chips, navigation pills, tag displays, or removable tags for categorization and selection. Use DsPill for interactive elements that represent categories, filters, or navigation options with clear selected/unselected states.

## Component Overview

DsPill is an interactive component designed for filter chips, category navigation, and tag management. It supports both button and anchor semantics, provides automatic padding detection for notification bubbles, and includes built-in keyboard navigation. The component is ideal for horizontal navigation bars, filter groups, and removable tag lists where users need clear visual feedback on selection state.

## Core Patterns

### Import and Setup

Always import `DsPill` from `@frontend/ui/pill` for interactive filter and navigation elements.

```typescript
import { DsPill } from '@frontend/ui/pill';

@Component({
  imports: [DsPill]
})
```

### Semantic HTML Requirements

Always use semantic HTML: `<button ds-pill>` for actions/filters, `<a ds-pill>` for navigation.

```html
<!-- Filter actions -->
<button ds-pill (click)="toggleFilter()" [selected]="isActive()">Sports</button>
<button ds-pill (click)="removeTag()">Remove Tag</button>

<!-- Navigation -->
<a ds-pill [routerLink]="['/category', id]" [selected]="isCurrentCategory()">Category</a>
<a ds-pill href="/external">External Link</a>
```

Always choose element type based on interaction purpose, never mix semantics.

```html
<!-- ✅ Correct: Actions use button -->
<button ds-pill (click)="applyFilter()" [selected]="filterActive">
  Active Filters
</button>

<!-- ✅ Correct: Navigation uses anchor -->
<a ds-pill [routerLink]="['/games']" [selected]="isCurrentRoute()">
  Games
</a>

<!-- ❌ Incorrect: Mixed semantics -->
<button ds-pill [routerLink]="['/path']">Invalid</button>
<div ds-pill>Not supported</div>
```

Always use `type="button"` explicitly for non-submit buttons in forms.

```html
<form (ngSubmit)="onSubmit()">
  <button ds-pill type="button" (click)="addTag()">Add Tag</button>
  <button type="submit">Submit Form</button>
</form>
```

### Signal-Based State Management

Always use signal-based inputs for reactive state management and dynamic properties.

```html
<button ds-pill 
        [selected]="isFilterActive()" 
        [variant]="filterVariant()" 
        [disabled]="!canToggle()">
  {{ filterLabel() }}
</button>
```

Always bind dynamic states using computed signals or conditional expressions.

```html
<a ds-pill 
   [selected]="currentCategory() === item.id"
   [size]="isMobile() ? 'small' : 'medium'"
   [variant]="hasNotifications() ? 'strong' : 'current'">
  {{ item.name }}
</a>
```

Never use manual subscriptions or imperative state updates for pill properties.

## Template Usage

### Basic Examples

```html
<!-- Simple filter button -->
<button ds-pill (click)="toggleFilter()" [selected]="isActive()">
  Sports
</button>

<!-- Navigation link -->
<a ds-pill [routerLink]="['/category', id]" [selected]="isCurrentCategory()">
  Category
</a>

<!-- Removable tag -->
<button ds-pill size="small" (click)="removeTag()">
  Tag Name
  <vn-icon slot="end" name="close" size="12" aria-hidden="true"></vn-icon>
</button>
```

### Advanced Patterns

```html
<!-- Pill with icon and notification bubble -->
<a ds-pill [selected]="isSelected()" [routerLink]="categoryLink">
  <vn-icon slot="start" size="16" [name]="iconName" aria-hidden="true"></vn-icon>
  {{ categoryName }}
  @if (count) {
    <ds-notification-bubble slot="end" size="large">{{ count }}</ds-notification-bubble>
  }
</a>

<!-- Dynamic variant and size -->
<button ds-pill 
        [selected]="isFilterActive()" 
        [variant]="filterVariant()" 
        [size]="isMobile() ? 'small' : 'medium'"
        [disabled]="!canToggle()">
  {{ filterLabel() }}
</button>
```

### Slot Projection

Always use named slots for icons and notification bubbles: `slot="start"` for leading icons, `slot="end"` for trailing icons and notification bubbles.

```html
<a ds-pill [selected]="isSelected()" [routerLink]="categoryLink">
  <vn-icon slot="start" size="16" [name]="iconName" aria-hidden="true"></vn-icon>
  {{ categoryName }}
  @if (count) {
    <ds-notification-bubble slot="end" size="large">{{ count }}</ds-notification-bubble>
  }
</a>
```

Always use `size="large"` for notification bubbles in pill `slot="end"` to match pill height.

```html
<button ds-pill (click)="showMessages()">
  Messages
  <ds-notification-bubble slot="end" size="large">{{ unreadCount }}</ds-notification-bubble>
</button>
```

Never use nested `@if` or `@for` directives within slot content. Always wrap complex conditionals in single elements.

```html
<!-- ✅ Correct -->
<button ds-pill>
  <span slot="start">
    @if (loading) { <i class="spinner"></i> }
    @else { <vn-icon name="filter"></vn-icon> }
  </span>
  Filter
</button>

<!-- ❌ Incorrect -->
<button ds-pill>
  @if (condition) { 
    @if (nested) { <vn-icon slot="start" name="filter"></vn-icon> } 
  }
  Filter
</button>
```

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
  <button ds-pill [inverse]="true" [selected]="isActive()">
    Filter Option
  </button>
</div>
```

## Input Properties

### Required Properties

None - all properties are optional with sensible defaults.

### Optional Properties

- **selected**: `boolean` - Indicates selected/active state (default: `false`)
- **variant**: `'current' | 'subtle' | 'strong'` - Visual style variant (default: `'current'`)
- **size**: `'small' | 'medium'` - Component size (default: `'medium'`)
- **disabled**: `boolean` - Disables interaction (default: `false`)

### Variant Selection

Always choose variant based on visual hierarchy and interaction context.

```html
<!-- Primary navigation and main filters -->
<button ds-pill variant="current" [selected]="isActive()">Main Filter</button>

<!-- Secondary options and metadata tags -->
<button ds-pill variant="subtle">Tag Label</button>

<!-- Important actions and featured items -->
<button ds-pill variant="strong" [selected]="isPriority()">Priority</button>
```

### Size Selection

Always choose size based on available space and UI density.

```html
<!-- Compact lists and mobile interfaces -->
<button ds-pill size="small">Compact</button>

<!-- Standard navigation and filter bars -->
<button ds-pill size="medium">Standard</button>
```

Never use unsupported size values. Only `small` and `medium` are available.

## Accessibility Requirements

### ARIA Attributes

Always add context-specific ARIA attributes for interactive states and navigation context.

```html
<!-- Toggle/filter buttons -->
<button ds-pill [attr.aria-pressed]="isFilterActive()" (click)="toggleFilter()">
  Active Filter
</button>

<!-- Current page navigation -->
<a ds-pill [attr.aria-current]="'page'" [routerLink]="currentPath">
  Current Page
</a>

<!-- Selection in lists -->
<button ds-pill 
        [attr.aria-selected]="isSelected()" 
        role="option" 
        (click)="selectOption()">
  Selectable Option
</button>
```

Always provide `aria-label` for pills with unclear context or icon-only content.

```html
<button ds-pill aria-label="Remove sports filter" (click)="removeFilter('sports')">
  <vn-icon slot="start" name="close" aria-hidden="true"></vn-icon>
  Sports
</button>
```

Always hide decorative icons with `aria-hidden="true"` when pill text provides sufficient context.

```html
<a ds-pill [routerLink]="['/category']">
  <vn-icon slot="start" name="category" aria-hidden="true"></vn-icon>
  Category Name
</a>
```

### Keyboard Navigation

Always trust component's automatic keyboard handling. Both button and anchor pills support standard keyboard navigation: Space/Enter to activate buttons, Enter to follow anchor links.

- `<button ds-pill>`: Enter and Space trigger click events
- `<a ds-pill>`: Enter follows link, Space triggers click (prevents scroll)
- Both: Tab moves focus, disabled pills are skipped

Never override component's keyboard event handling unless adding specific application logic.

```html
<!-- ✅ Standard behavior -->
<button ds-pill (click)="handleAction()">Action</button>
<a ds-pill [routerLink]="['/path']">Navigation</a>

<!-- ✅ Additional logic allowed -->
<button ds-pill (click)="handleAction()" (keydown.escape)="closeMenu()">
  Action with Escape
</button>
```

## Common Use Cases

### Filters

Always use pills for removable tags with clear removal actions.

```html
<div class="tag-list d-flex flex-wrap gap-2">
  @for (tag of selectedTags(); track tag.id) {
    <button ds-pill 
            variant="subtle" 
            size="small" 
            (click)="removeTag(tag)"
            [attr.aria-label]="'Remove ' + tag.name + ' tag'">
      {{ tag.name }}
      <vn-icon slot="end" name="close" size="12" aria-hidden="true"></vn-icon>
    </button>
  }
</div>
```

Always use selected state for active filters with clear visual feedback.

```html
<div class="filter-bar d-flex gap-2">
  @for (filter of availableFilters(); track filter.id) {
    <button ds-pill 
            [selected]="activeFilters().includes(filter.id)"
            (click)="toggleFilter(filter)">
      {{ filter.label }}
      @if (getFilterCount(filter.id)) {
        <ds-notification-bubble slot="end" size="large">
          {{ getFilterCount(filter.id) }}
        </ds-notification-bubble>
      }
    </button>
  }
</div>
```

### Tags

Use pills for tag displays with optional removal functionality.

```html
<div class="tag-list d-flex flex-wrap gap-2">
  @for (tag of selectedTags(); track tag.id) {
    <button ds-pill 
            variant="subtle" 
            size="small" 
            (click)="removeTag(tag)"
            [attr.aria-label]="'Remove ' + tag.name + ' tag'">
      {{ tag.name }}
      <vn-icon slot="end" name="close" size="12" aria-hidden="true"></vn-icon>
    </button>
  }
</div>
```

### Navigation

Always use pills for category navigation with proper routing and state management.

```html
<nav class="category-nav d-flex gap-2" role="navigation" aria-label="Category navigation">
  @for (category of categories(); track category.id) {
    <a ds-pill 
       [routerLink]="['/category', category.slug]"
       [selected]="currentCategory() === category.id"
       [attr.aria-current]="currentCategory() === category.id ? 'page' : null">
      <vn-icon slot="start" [name]="category.icon" aria-hidden="true"></vn-icon>
      {{ category.name }}
      @if (category.count) {
        <ds-notification-bubble slot="end" size="large">{{ category.count }}</ds-notification-bubble>
      }
    </a>
  }
</nav>
```

Always handle loading states during navigation with proper user feedback.

```html
<a ds-pill 
   [routerLink]="['/category', id]"
   [attr.aria-disabled]="isLoading()"
   [class.loading]="isLoading()">
  @if (isLoading()) {
    <i slot="start" class="spinner" aria-hidden="true"></i>
  } @else {
    <vn-icon slot="start" name="category" aria-hidden="true"></vn-icon>
  }
  {{ categoryName() }}
</a>
```

## Anti-Patterns

Never apply display, positioning, or layout classes directly to pill host.

```html
<!-- ❌ Incorrect -->
<button ds-pill class="d-flex mb-3">Broken Layout</button>

<!-- ✅ Correct -->
<div class="d-flex gap-2 mb-3">
  <button ds-pill>Filter 1</button>
  <button ds-pill>Filter 2</button>
</div>
```

Never use `[ngClass]`, `[class]`, or `style` attributes on pill host for visual state changes.

```html
<!-- ❌ Incorrect -->
<button ds-pill [class.active]="isActive()" style="background: red">
  Manual Styling
</button>

<!-- ✅ Correct -->
<button ds-pill [variant]="isActive() ? 'strong' : 'current'">
  State-Driven
</button>
```

Never manually add padding classes for notification bubbles.

```html
<!-- ❌ Incorrect: Manual padding -->
<button ds-pill class="ds-pill-rounded-padding">Manual</button>

<!-- ✅ Correct: Auto-detected -->
<button ds-pill>
  Auto
  <ds-notification-bubble slot="end">3</ds-notification-bubble>
</button>
```

Never mix button and anchor semantics.

```html
<!-- ❌ Incorrect -->
<button ds-pill [routerLink]="['/path']">Invalid</button>
<div ds-pill>Not supported</div>

<!-- ✅ Correct -->
<button ds-pill (click)="action()">Action</button>
<a ds-pill [routerLink]="['/path']">Navigation</a>
```

## Key Rules

- Always use `<button ds-pill>` for actions/filters, `<a ds-pill>` for navigation
- Always use signal-based inputs for reactive state management
- Always use `size="large"` for notification bubbles in `slot="end"`
- Always trust component's automatic padding detection for notification bubbles
- Always use wrapper elements for display, positioning, and layout classes
- Always add context-specific ARIA attributes for interactive states
- Always hide decorative icons with `aria-hidden="true"`
- Never apply `[ngClass]`, `[class]`, or `style` to pill host for visual changes
- Never manually add padding classes
- Never mix button and anchor semantics
- Never use unsupported size values (only `small` and `medium`)
- Never override component's keyboard event handling without specific reason
