---
inclusion: manual
description: "DsBottomNav integration patterns for mobile bottom navigation bars with tabs, icons, and state management"
---

# DsBottomNav Integration Instructions

## Context

This guidance applies when implementing mobile bottom navigation bars with tabs, icons, and state management. Use this when working with files that contain or reference DsBottomNav components.

## Component Overview

**Purpose:** Fixed mobile navigation bar for primary app navigation. Thumb-optimized for one-handed mobile use with 3-5 tabs containing icons, labels, and badges.

**Import:** `@frontend/ui/bottom-nav` | **Selectors:** `ds-bottom-nav`, `ds-bottom-nav-tab` | **Status:** STABLE

## Core Integration Rules

### State Management

Always use component inputs for tab state management:
```html
<!-- ✅ CORRECT - Signal-based inputs -->
<ds-bottom-nav-tab [active]="isCurrentSection()" [disabled]="!isEnabled()">
  <div class="text-wrapper">Sports</div>
</ds-bottom-nav-tab>
```

Never use CSS classes or ngClass for state:
```html
<!-- ❌ FORBIDDEN - Bypasses component state management -->
<ds-bottom-nav-tab [ngClass]="{'active': isActive}">Sports</ds-bottom-nav-tab>
<ds-bottom-nav-tab class="active">Sports</ds-bottom-nav-tab>
```

### Navigation Handling

Always use click handlers for navigation - no built-in router support:
```html
<!-- ✅ CORRECT - Delegate to click handler -->
<ds-bottom-nav-tab (click)="navigate('sports')" [active]="section === 'sports'">
  <div class="icon-wrapper"><vn-icon name="trophy" /></div>
  <div class="text-wrapper">Sports</div>
</ds-bottom-nav-tab>
```

Never use routerLink directly on tabs:
```html
<!-- ❌ FORBIDDEN - No router integration -->
<ds-bottom-nav-tab [routerLink]="/sports">Sports</ds-bottom-nav-tab>
```

### Content Projection Patterns

Always use wrapper divs for structured content:
```html
<!-- ✅ CORRECT - Proper wrapper structure -->
<ds-bottom-nav-tab>
  <div class="icon-wrapper">
    <vn-icon name="casino" />
    <ds-notification-bubble variant="primary" size="small">3</ds-notification-bubble>
  </div>
  <div class="text-wrapper">Casino</div>
</ds-bottom-nav-tab>
```

Always use single-level conditionals in content projection:
```html
<!-- ✅ ALLOWED - Root-level @if -->
<ds-bottom-nav-tab>
  @if (hasIcon) { 
    <div class="icon-wrapper"><vn-icon [name]="iconName" /></div> 
  }
  <div class="text-wrapper">{{ label }}</div>
</ds-bottom-nav-tab>
```

Never nest control flow structures:
```html
<!-- ❌ FORBIDDEN - Nested @if creates projection ambiguity -->
<ds-bottom-nav-tab>
  @if (hasContent) { 
    @if (hasIcon) { <vn-icon [name]="icon" /> }
  }
</ds-bottom-nav-tab>
```

## Layout Integration

### Fixed Positioning

Always trust component's fixed positioning - never override:
```html
<!-- ✅ CORRECT - Component handles positioning -->
<ds-bottom-nav>
  <ds-bottom-nav-tab>Home</ds-bottom-nav-tab>
</ds-bottom-nav>
```

Never apply positioning classes to component host:
```html
<!-- ❌ FORBIDDEN - Conflicts with component CSS -->
<ds-bottom-nav class="position-relative">
  <ds-bottom-nav-tab>Home</ds-bottom-nav-tab>
</ds-bottom-nav>
```

### Width and Sizing

Always use wrapper for custom sizing when needed:
```html
<!-- ✅ CORRECT - Wrapper for demo/preview contexts -->
<div style="width: 390px; position: relative">
  <ds-bottom-nav style="position: absolute; bottom: auto;">
    <ds-bottom-nav-tab>Sports</ds-bottom-nav-tab>
  </ds-bottom-nav>
</div>
```

Never apply display or layout classes to component host:
```html
<!-- ❌ FORBIDDEN - Breaks component layout -->
<ds-bottom-nav class="d-flex justify-content-center">
  <ds-bottom-nav-tab>Sports</ds-bottom-nav-tab>
</ds-bottom-nav>
```

## Accessibility Patterns

### Auto-Managed ARIA

Always trust component's automatic ARIA management:
- `role="tab"` on tabs
- `aria-selected` based on `[active]` input
- `aria-disabled` based on `[disabled]` input
- `role="navigation"` and `role="tablist"` on container

Never add manual ARIA attributes that conflict:
```html
<!-- ❌ FORBIDDEN - Component auto-manages these -->
<ds-bottom-nav-tab role="button" aria-pressed="true">Sports</ds-bottom-nav-tab>
```

### Icon Accessibility

Always add `aria-hidden="true"` to decorative icons:
```html
<!-- ✅ CORRECT - Hide decorative icons from screen readers -->
<ds-bottom-nav-tab>
  <div class="icon-wrapper">
    <vn-icon name="trophy" aria-hidden="true" />
  </div>
  <div class="text-wrapper">Sports</div>
</ds-bottom-nav-tab>
```

## Badge and Notification Integration

Always position badges within icon-wrapper using absolute positioning:
```html
<!-- ✅ CORRECT - Proper badge positioning -->
<ds-bottom-nav-tab>
  <div class="icon-wrapper">
    <vn-icon name="casino" />
    <ds-notification-bubble 
      style="position: absolute; top: -8px; right: -8px; z-index: 1"
      variant="primary" 
      size="small">3</ds-notification-bubble>
  </div>
  <div class="text-wrapper">Casino</div>
</ds-bottom-nav-tab>
```

Never apply badges outside the icon-wrapper structure:
```html
<!-- ❌ FORBIDDEN - Breaks visual hierarchy -->
<ds-bottom-nav-tab>
  <div class="icon-wrapper"><vn-icon name="casino" /></div>
  <ds-notification-bubble>3</ds-notification-bubble>
  <div class="text-wrapper">Casino</div>
</ds-bottom-nav-tab>
```

## Component Import Requirements

Always import both components when using bottom navigation:
```typescript
// ✅ CORRECT - Import both components
import { DsBottomNav, DsBottomNavTab } from '@frontend/ui/bottom-nav';

@Component({
  imports: [DsBottomNav, DsBottomNavTab],
  // ...
})
```

## Common Integration Patterns

### Service-Based Navigation
```typescript
// ✅ CORRECT - Delegate navigation to service
click(event: Event, item: MenuContentItem) {
  this.menuItemClickHandler.handleMenuTrack(item);
  this.menuItemClickHandler.handleMenuAction(event, item, MenuSection.BottomNav, true);
}
```

### Signal-Based Active State
```typescript
// ✅ CORRECT - Reactive active state
isActive(item: MenuContentItem): Observable<boolean> {
  if (this.menuItemsService.isActive(MenuSection.BottomNav, item.name)) {
    return of(true);
  }
  return this.dslService.evaluateExpression<boolean>(item.parameters.highlighted);
}
```

### Brand Logo Integration
```html
<!-- ✅ CORRECT - Brand logo wrapper -->
<ds-bottom-nav-tab>
  <div class="brand-logo-wrapper">
    <svg viewBox="0 0 22 22" width="12" height="12" fill="currentColor">
      <!-- SVG content -->
    </svg>
  </div>
</ds-bottom-nav-tab>
```

## Design Token Preservation

Always preserve component design tokens - never override with inline styles:
```html
<!-- ❌ FORBIDDEN - Breaks theming -->
<ds-bottom-nav-tab style="background: red; padding: 10px;">Sports</ds-bottom-nav-tab>
```

Always use CSS custom properties when available:
```scss
// ✅ CORRECT - Use provided design tokens
.custom-bottom-nav {
  --ds-bottom-nav-width: 100%;
  --ds-bottom-nav-tabs-size-icon-size: 24px;
}
```

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
  <ds-bottom-nav [inverse]="true">
    <ds-bottom-nav-tab [active]="true">
      <div class="icon-wrapper">
        <vn-icon name="home" />
      </div>
      <div class="text-wrapper">Home</div>
    </ds-bottom-nav-tab>
  </ds-bottom-nav>
</div>
```
