---
inclusion: manual
description: "DsTabsGroup integration patterns for tabbed navigation, multi-section forms, and dashboard panels with tab-based switching"
---

# DsTabsGroup Integration Instructions

## Context

This guidance applies when organizing content into tabbed navigation, multi-section forms, or dashboard panels with tab-based switching. Use this when working with files that contain or reference DsTabsGroup components.

## Component Import and Basic Usage

Always import `DsTabsGroup` and `DsTab` from `@frontend/ui/tabsgroup` for tabbed navigation interfaces.

```typescript
import { DsTab, DsTabsGroup, DsTabContent, DsTabHeader } from '@frontend/ui/tabsgroup';

@Component({
  imports: [DsTabsGroup, DsTab, DsTabContent, DsTabHeader]
})
```

Always use two-way binding for reactive state management and unique tab names (each name must be unique within the tabs group) for tab identification.

```html
<ds-tabs-group [(activeTab)]="selectedTab" size="large" variant="horizontal">
  <ds-tab name="overview" title="Overview">Overview content</ds-tab>
  <ds-tab name="details" title="Details">Details content</ds-tab>
</ds-tabs-group>
```

## Size and Variant Selection

Always choose size based on UI hierarchy and variant based on layout requirements.

```html
<!-- Primary navigation - large horizontal tabs -->
<ds-tabs-group size="large" variant="horizontal" indicator="underline">
  <ds-tab name="dashboard" title="Dashboard">Main content</ds-tab>
  <ds-tab name="settings" title="Settings">Settings panel</ds-tab>
</ds-tabs-group>

<!-- Compact sub-navigation - small horizontal tabs -->
<ds-tabs-group size="small" variant="horizontal" [scrollable]="true">
  <ds-tab name="live" title="Live Events">Live content</ds-tab>
  <ds-tab name="upcoming" title="Upcoming">Upcoming content</ds-tab>
</ds-tabs-group>

<!-- Sidebar navigation - vertical tabs -->
<ds-tabs-group variant="vertical" size="large">
  <ds-tab name="profile" title="Profile">Profile settings</ds-tab>
  <ds-tab name="preferences" title="Preferences">User preferences</ds-tab>
</ds-tabs-group>
```

Never use `indicator="fill"` with two-line headers - always use `indicator="underline"` for multi-line content.

## Dynamic Tab Generation

Always use `@for` loops with unique `name` attributes for data-driven tabs.

```html
<ds-tabs-group [(activeTab)]="activeCategory" [scrollable]="true">
  @for (category of categories; track category.id) {
    <ds-tab [name]="category.id" [title]="category.name" [disabled]="!category.available">
      <div>{{ category.content }}</div>
    </ds-tab>
  }
</ds-tabs-group>
```

Always provide unique tracking keys (e.g., `track tab.id`) and handle disabled states by setting `[disabled]="true"` on individual tabs for dynamic content.

## Custom Headers with Icons and Badges

Always use `*dsTabHeader="let selected"` directive for complex tab headers with conditional styling.

```html
<ds-tabs-group [(activeTab)]="activeTab">
  <ds-tab name="betslip">
    <ng-container *dsTabHeader="let selected">
      <vn-icon name="betslip" size="16" slot="start" />
      {{ title }}
      @if (betCount > 0) {
        <ds-notification-bubble 
          size="medium" 
          [variant]="selected ? 'primary' : 'neutral'">
          {{ betCount }}
        </ds-notification-bubble>
      }
    </ng-container>
    <div>Betslip content</div>
  </ds-tab>
</ds-tabs-group>
```

Always use the `selected` context variable for conditional styling and variant selection on notification bubbles (use 'primary' variant when selected, 'secondary' when not selected).

Never apply CSS classes directly to tab headers - use component inputs and design tokens instead.

## Performance Optimization with Lazy Loading

Always use `*dsTabContent` directive for heavy components that should render only when active.

```html
<ds-tabs-group [(activeTab)]="selectedTab">
  <ds-tab name="reports">
    <ng-template dsTabContent>
      <expensive-chart-component [data]="chartData" />
      <heavy-data-table [items]="tableData" />
    </ng-template>
  </ds-tab>
  
  <ds-tab name="simple" title="Simple">
    <!-- Immediate rendering for lightweight content -->
    <div>Simple content that renders immediately</div>
  </ds-tab>
</ds-tabs-group>
```

Always wrap expensive components in `dsTabContent` templates to prevent unnecessary rendering and improve initial load performance.

## Layout Integration and Width Control

Always use wrapper elements for layout control and positioning - never apply layout classes to the component host.

```html
<!-- Correct: Wrapper controls layout -->
<div class="tab-container" style="width: 600px;">
  <ds-tabs-group [fullWidthTabs]="true" [scrollable]="false">
    <ds-tab name="tab1" title="Tab 1">Content 1</ds-tab>
    <ds-tab name="tab2" title="Tab 2">Content 2</ds-tab>
  </ds-tabs-group>
</div>

<!-- Incorrect: Never apply layout to host -->
<ds-tabs-group class="w-100 d-flex" style="width: 600px;">
  <!-- This breaks design tokens -->
</ds-tabs-group>
```

Always use `[fullWidthTabs]="true"` for even distribution and `[scrollable]="true"` for overflow handling.

## Accessibility and Navigation Integration

Always provide ARIA labels that describe the action: `aria-label='Previous tab'` for left arrow, `aria-label='Next tab'` for right arrow, and descriptive labels for icon-only tabs (e.g., `aria-label='Settings tab'`).

```html
<ds-tabs-group 
  [ariaLabelNavigationArrowPrev]="'Previous tabs'" 
  [ariaLabelNavigationArrowNext]="'Next tabs'">
  
  <ds-tab name="search" [attr.aria-label]="'Search functionality'">
    <ng-container *dsTabHeader>
      <vn-icon name="search" size="16" aria-hidden="true" />
    </ng-container>
    <div>Search content</div>
  </ds-tab>
</ds-tabs-group>
```

Always use semantic links inside custom headers for SEO-friendly navigation.

Never override auto-managed ARIA attributes - the component handles `role`, `aria-selected`, and `tabindex` automatically.

## Event Handling and State Management

Always use `(activeTabChange)` for side effects like data loading and URL updates.

```typescript
onTabChange(tabName: string): void {
  // Update URL for bookmarkable state
  this.router.navigate([], { 
    queryParams: { tab: tabName },
    queryParamsHandling: 'merge'
  });
  
  // Load tab-specific data
  this.loadTabData(tabName);
  
  // Analytics tracking
  this.analytics.track('tab_changed', { tab: tabName });
}
```

Always sync tab state with URL parameters for shareable links and browser history.

## Theme Integration and Customization

Always use theme directives for brand-specific styling instead of CSS overrides.

Always apply CSS custom properties on wrapper elements, never on the component host.

Never use `[ngClass]`, `[class]`, or `[style]` bindings on `ds-tabs-group` - use component inputs and CSS variables instead.

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
  <ds-tabs-group [inverse]="true" [(activeTab)]="selectedTab">
    <ds-tab name="tab1" title="Tab 1">Content 1</ds-tab>
    <ds-tab name="tab2" title="Tab 2">Content 2</ds-tab>
  </ds-tabs-group>
</div>
```

## Common Integration Patterns

Always include dividers for visual separation between tabs and content.

Always handle loading states and empty states within tab content.

```html
<ds-tab name="data">
  <ng-template dsTabContent>
    @if (loading()) {
      <ds-loading-spinner />
    } @else if (data().length === 0) {
      <div class="empty-state">No data available</div>
    } @else {
      <data-table [items]="data()" />
    }
  </ng-template>
</ds-tab>
```

Always provide fallback content and error boundaries for robust user experience.
