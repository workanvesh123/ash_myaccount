---
inclusion: manual
description: "Use when displaying count indicators, status dots, or notification badges that show numeric values or status within other components"
---

# DsNotificationBubble Integration Instructions

## Context

This guidance applies when implementing count indicators, status dots, or notification badges that display numeric values or status information. DsNotificationBubble is designed to be integrated within other components (buttons, pills, badges, tabs) and should not be used as a standalone element.

## Component Overview

DsNotificationBubble is a utility component that displays numeric counts or status indicators within parent components. It supports multiple variants (primary, utility, live, dot styles), size options, and proper slot positioning for integration with design system components. The component is optimized for accessibility and supports both simple text labels and complex content projection.

## Core Patterns

### Import and Setup

Always import `DsNotificationBubble` from `@frontend/ui/notification-bubble` for count indicators and status dots.

```typescript
import { DsNotificationBubble } from '@frontend/ui/notification-bubble';

@Component({
  imports: [DsNotificationBubble]
})
```

Always use signal-based inputs for reactive state management with proper type safety.

```html
<ds-notification-bubble 
  [variant]="notificationVariant() || 'primary'" 
  [size]="bubbleSize() || 'medium'"
  [label]="count().toString()">
</ds-notification-bubble>
```

### Parent Integration

Always integrate notification bubbles within parent components using appropriate slot positioning. Never use notification bubbles as standalone elements.

```html
<!-- Pills: end slot with large size -->
<button ds-pill>
  Category
  @if (count()) {
    <ds-notification-bubble slot="end" size="large">{{ count() }}</ds-notification-bubble>
  }
</button>

<!-- Badges: start slot with small size -->
<ds-badge variant="primary">
  Label
  <ds-notification-bubble slot="start" variant="neutral" size="small">{{ count() }}</ds-notification-bubble>
</ds-badge>

<!-- Icon buttons -->
<button ds-button-icon aria-label="Messages">
  <vn-icon name="messages" />
  <ds-notification-bubble>{{ unreadCount() }}</ds-notification-bubble>
</button>
```

### Size Constraints

Always match size to parent component requirements for proper visual hierarchy.

```html
<!-- Small: compact badges and icon buttons -->
<ds-notification-bubble size="small">{{ count() }}</ds-notification-bubble>

<!-- Medium: standard notifications (default) -->
<ds-notification-bubble size="medium">{{ count() }}</ds-notification-bubble>

<!-- Large: pill slots and tab headers -->
<ds-notification-bubble size="large">{{ count() }}</ds-notification-bubble>
```

## Template Usage

### Slot Projection

Always use appropriate slot positioning when integrating with parent components.

```html
<!-- Pills: end slot with large size -->
<button ds-pill>
  Category
  @if (count()) {
    <ds-notification-bubble slot="end" size="large">{{ count() }}</ds-notification-bubble>
  }
</button>

<!-- Badges: start slot with small size -->
<ds-badge variant="primary">
  Label
  <ds-notification-bubble slot="start" variant="neutral" size="small">{{ count() }}</ds-notification-bubble>
</ds-badge>

<!-- Tabs: dynamic variant based on selection -->
<ds-tab [name]="tabName">
  <ng-container *dsTabHeader="let selected">
    {{ tabTitle }}
    @if (count()) {
      <ds-notification-bubble
        size="medium"
        [variant]="selected ? 'primary' : 'neutral'">
        {{ count() }}
      </ds-notification-bubble>
    }
  </ng-container>
</ds-tab>
```

### Numeric Display

Always use `label` input for simple text content and projection for complex expressions.

```html
<!-- Simple text: use label -->
<ds-notification-bubble [label]="count().toString()"></ds-notification-bubble>

<!-- Complex expressions: use projection -->
<ds-notification-bubble>{{ count() > 99 ? '99+' : count() }}</ds-notification-bubble>

<!-- Conditional display -->
@if (hasNotifications()) {
  <ds-notification-bubble>{{ notificationCount() }}</ds-notification-bubble>
}
```

Never provide content for dot variants - they ignore projection and render internal dots.

```html
<!-- ❌ Never do this (content ignored) -->
<ds-notification-bubble variant="live-dot">Text</ds-notification-bubble>

<!-- ✅ Always use empty for dots -->
<ds-notification-bubble variant="live-dot"></ds-notification-bubble>
```

## Input Properties

### Variant Options

Always choose variant based on emphasis level and context requirements.

```html
<!-- High emphasis notifications -->
<ds-notification-bubble variant="primary">5</ds-notification-bubble>

<!-- Secondary notifications -->
<ds-notification-bubble variant="utility">2</ds-notification-bubble>

<!-- Live indicators -->
<ds-notification-bubble variant="live">12</ds-notification-bubble>

<!-- Status dots (no content) -->
<ds-notification-bubble variant="live-dot"></ds-notification-bubble>
<ds-notification-bubble variant="utility-dot"></ds-notification-bubble>
```

### Size Options

- `size="small"` - Compact badges and icon buttons
- `size="medium"` - Standard notifications (default)
- `size="large"` - Pill slots and tab headers

### Label Input

Use `label` input for simple text content instead of content projection when appropriate.

```html
<ds-notification-bubble [label]="count().toString()"></ds-notification-bubble>
```

## Accessibility Requirements

### Interactive Parent Components

Never add extra ARIA when notification bubble is inside interactive elements - parent context is sufficient.

```html
<!-- ✅ Correct: no additional ARIA needed -->
<button ds-pill>
  Messages
  <ds-notification-bubble>{{ messageCount() }}</ds-notification-bubble>
</button>
```

### Non-Interactive Parent Components

Always establish relationship with `aria-label` or `aria-describedby` on parent element.

```html
<!-- ✅ Correct: parent provides context -->
<ds-badge [attr.aria-label]="'Cart with ' + itemCount() + ' items'">
  Cart
  <ds-notification-bubble aria-hidden="true">{{ itemCount() }}</ds-notification-bubble>
</ds-badge>
```

### Live Updates

Always use `role="status"` and `aria-live="polite"` for dynamically changing counts.

```html
<button ds-pill>
  Notifications
  <ds-notification-bubble 
    role="status" 
    aria-live="polite">{{ liveCount() }}</ds-notification-bubble>
</button>
```

### Decorative Indicators

Always use `aria-hidden="true"` for dot variants and when parent provides full context.

```html
<!-- Status dots -->
<button ds-pill>
  Live Stream
  <ds-notification-bubble variant="live-dot" aria-hidden="true"></ds-notification-bubble>
</button>

<!-- Parent has complete label -->
<button [attr.aria-label]="'Inbox with ' + count() + ' messages'">
  <vn-icon name="inbox" />
  <ds-notification-bubble aria-hidden="true">{{ count() }}</ds-notification-bubble>
</button>
```

## Common Use Cases

### Button Integration

```html
<button ds-button-icon aria-label="Messages">
  <vn-icon name="messages" />
  <ds-notification-bubble>{{ unreadCount() }}</ds-notification-bubble>
</button>
```

### Pill Integration

```html
<button ds-pill>
  Category
  @if (count()) {
    <ds-notification-bubble slot="end" size="large">{{ count() }}</ds-notification-bubble>
  }
</button>
```

### Icon Integration

```html
<button ds-button-icon aria-label="Notifications">
  <vn-icon name="bell" />
  @if (notificationCount() > 0) {
    <ds-notification-bubble>{{ notificationCount() }}</ds-notification-bubble>
  }
</button>
```

### Count Limiting

```html
<ds-notification-bubble>{{ count() > 99 ? '99+' : count() }}</ds-notification-bubble>
```

### Theme Coordination

```html
<!-- Match parent component inverse state -->
<ds-pill [inverse]="isDarkTheme()">
  Label
  <ds-notification-bubble 
    slot="end" 
    [inverse]="isDarkTheme()" 
    size="large">{{ count() }}</ds-notification-bubble>
</ds-pill>
```

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
  <ds-notification-bubble [inverse]="true" variant="primary">
    5
  </ds-notification-bubble>
</div>
```

## Anti-Patterns

Never apply layout or display classes directly to the notification bubble host element.

```html
<!-- ❌ Never do this -->
<ds-notification-bubble class="d-block m-3">5</ds-notification-bubble>

<!-- ✅ Always use wrapper -->
<div class="d-block m-3">
  <ds-notification-bubble>5</ds-notification-bubble>
</div>
```

Never apply dynamic classes or inline styles to the notification bubble host element.

```html
<!-- ❌ Never use dynamic classes -->
<ds-notification-bubble [ngClass]="{'active': isActive()}">5</ds-notification-bubble>

<!-- ❌ Never use inline styles -->
<ds-notification-bubble [style.background]="'red'">5</ds-notification-bubble>

<!-- ✅ Always use component inputs -->
<ds-notification-bubble [variant]="isActive() ? 'primary' : 'neutral'">5</ds-notification-bubble>

<!-- ✅ Always use wrapper for external styling -->
<div [ngClass]="{'wrapper-active': isActive()}">
  <ds-notification-bubble>5</ds-notification-bubble>
</div>
```

Never manipulate the component's internal DOM structure directly.

```typescript
// ❌ Never access internal elements
@ViewChild(DsNotificationBubble, { read: ElementRef }) bubble: ElementRef;
ngAfterViewInit() {
  this.bubble.nativeElement.querySelector('.ds-notification-bubble-inside-dot').style.color = 'red';
}

// ✅ Always use component API
@ViewChild(DsNotificationBubble) bubble: DsNotificationBubble;
ngAfterViewInit() {
  this.bubble.variant.set('primary');
  this.bubble.inverse.set(true);
}
```

Never use manual change detection or direct DOM manipulation for state updates.

```typescript
// ❌ Never manually trigger change detection
ngOnInit() {
  this.notificationService.count$.subscribe(count => {
    this.count = count;
    this.cdr.markForCheck(); // Avoid this pattern
  });
}

// ✅ Always use signals for reactive updates
private readonly notificationService = inject(NotificationService);
protected readonly count = toSignal(this.notificationService.count$, { initialValue: 0 });
```

## Key Rules

- Always integrate notification bubbles within parent components using slot positioning
- Never use notification bubbles as standalone elements
- Always match size to parent component requirements (small/medium/large)
- Always use `label` input for simple text, projection for complex expressions
- Never provide content for dot variants
- Always use appropriate ARIA attributes based on parent context
- Never add extra ARIA when inside interactive elements
- Always use `aria-hidden="true"` for decorative indicators
- Never apply classes or styles directly to the component host
- Always use signal-based reactivity for dynamic updates
- Never manipulate internal DOM structure directly
