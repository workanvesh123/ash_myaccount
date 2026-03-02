---
inclusion: manual
description: "Use when creating navigation menus, settings lists, or selection interfaces with consistent list item styling"
---

# DsListItem Integration Instructions

## Context

This guidance applies when implementing navigation menus, settings lists, selection interfaces, or any structured list of interactive or display items. DsListItem provides consistent styling and behavior for list-based UI patterns.

## Component Overview

DsListItem is a flexible list item component that supports navigation, actions, and display modes. It works in conjunction with DsListGroup to provide keyboard navigation, selection management, and proper ARIA semantics. The component supports slot projection for icons and badges, and offers multiple size variants for different content densities.

**Primary Use Cases:**
- Navigation menus and sidebars
- Settings and configuration lists
- Selection interfaces (single or multi-select)
- Data display lists
- Action menus

**Import:** `@frontend/ui/list-item`  
**Selectors:** `ds-list-item` (component), `a[ds-list-item]` (directive for anchors)  
**Status:** STABLE

## Core Patterns

### Import and Setup

Always import both DsListItem and DsListGroup from the design system:

```typescript
import { DsListItem, DsListGroup } from '@frontend/ui/list-item';

@Component({
  selector: 'app-settings-menu',
  imports: [DsListItem, DsListGroup],
  template: `
    <ds-list-group roleType="navigation" aria-label="Settings menu">
      <a ds-list-item [title]="'Account'" [routerLink]="'/account'"></a>
      <a ds-list-item [title]="'Privacy'" [routerLink]="'/privacy'"></a>
    </ds-list-group>
  `
})
export class SettingsMenuComponent {}
```

### Interactive vs Display Modes

Always choose the correct HTML element based on interaction type:

**Navigation** - Use `<a ds-list-item>` with `href` or `[routerLink]`:
```html
<a ds-list-item [title]="'Settings'" [routerLink]="'/settings'"></a>
<a ds-list-item [title]="'Help'" href="/help"></a>
```

**Actions** - Use `<ds-list-item>` with `(itemClick)` event:
```html
<ds-list-item [title]="'Delete Item'" (itemClick)="deleteItem()"></ds-list-item>
<ds-list-item [title]="'Export Data'" (itemClick)="exportData()"></ds-list-item>
```

**Static Display** - Use `<ds-list-item>` without interaction handlers:
```html
<ds-list-item [title]="'Balance'" [subtitle]="balance | currency"></ds-list-item>
<ds-list-item [title]="'Status'" [subtitle]="'Active'"></ds-list-item>
```

Never mix semantics by using navigation attributes with action components:
```html
<!-- ❌ Never mix semantics -->
<ds-list-item [routerLink]="'/path'" [title]="'Invalid'"></ds-list-item>
```

### Container Relationships

Always wrap multiple list items in DsListGroup for keyboard navigation and proper ARIA:

```html
<!-- ✅ Grouped for navigation -->
<ds-list-group roleType="navigation" aria-label="Main menu">
  <a ds-list-item [title]="'Home'" [routerLink]="'/home'"></a>
  <a ds-list-item [title]="'Profile'" [routerLink]="'/profile'"></a>
  <a ds-list-item [title]="'Settings'" [routerLink]="'/settings'"></a>
</ds-list-group>

<!-- ✅ Grouped for selection -->
<ds-list-group roleType="selection" selectionMode="single" aria-label="Choose option">
  <ds-list-item [title]="'Option 1'" [(selected)]="option1Selected"></ds-list-item>
  <ds-list-item [title]="'Option 2'" [(selected)]="option2Selected"></ds-list-item>
</ds-list-group>
```

Never use standalone items when keyboard navigation or selection management is needed.

## Template Usage

### Basic Navigation List

```html
<ds-list-group roleType="navigation" aria-label="Account navigation">
  <a ds-list-item 
    [title]="'Profile'" 
    [subtitle]="'Manage your profile'"
    [routerLink]="'/profile'">
    <vn-icon slot="start" name="account" size="16"></vn-icon>
    <vn-icon slot="end" name="theme-right" size="16"></vn-icon>
  </a>
  
  <a ds-list-item 
    [title]="'Security'" 
    [subtitle]="'Password and authentication'"
    [routerLink]="'/security'">
    <vn-icon slot="start" name="lock" size="16"></vn-icon>
    <vn-icon slot="end" name="theme-right" size="16"></vn-icon>
  </a>
</ds-list-group>
```

### Action List

```html
<ds-list-group roleType="list" aria-label="Item actions">
  <ds-list-item 
    [title]="'Edit'" 
    (itemClick)="editItem()">
    <vn-icon slot="start" name="edit" size="16"></vn-icon>
  </ds-list-item>
  
  <ds-list-item 
    [title]="'Share'" 
    (itemClick)="shareItem()">
    <vn-icon slot="start" name="share" size="16"></vn-icon>
  </ds-list-item>
  
  <ds-list-item 
    [title]="'Delete'" 
    (itemClick)="deleteItem()">
    <vn-icon slot="start" name="delete" size="16"></vn-icon>
  </ds-list-item>
</ds-list-group>
```

### Selection List (Single)

```html
<ds-list-group 
  roleType="selection" 
  selectionMode="single" 
  aria-label="Sort options">
  <ds-list-item 
    [title]="'Name'" 
    [(selected)]="sortByName">
  </ds-list-item>
  
  <ds-list-item 
    [title]="'Date'" 
    [(selected)]="sortByDate">
  </ds-list-item>
  
  <ds-list-item 
    [title]="'Size'" 
    [(selected)]="sortBySize">
  </ds-list-item>
</ds-list-group>
```

### Selection List (Multi-select)

```html
<ds-list-group 
  roleType="selection" 
  selectionMode="multiselect" 
  aria-label="Feature selection">
  <ds-list-item 
    [title]="'Notifications'" 
    [subtitle]="'Receive push notifications'"
    [(selected)]="notificationsEnabled">
  </ds-list-item>
  
  <ds-list-item 
    [title]="'Auto-save'" 
    [subtitle]="'Automatically save changes'"
    [(selected)]="autoSaveEnabled">
  </ds-list-item>
</ds-list-group>
```

### Display List

```html
<ds-list-group roleType="list">
  <ds-list-item 
    [title]="'Balance'" 
    [subtitle]="balance() | currency">
    <vn-icon slot="start" name="wallet" size="20"></vn-icon>
  </ds-list-item>
  
  <ds-list-item 
    [title]="'Last Login'" 
    [subtitle]="lastLogin() | date">
    <vn-icon slot="start" name="clock" size="20"></vn-icon>
  </ds-list-item>
</ds-list-group>
```

### Slot Projection

Always use proper slot attributes for content projection:

```html
<!-- ✅ Basic slot usage -->
<ds-list-item [title]="'Account Settings'">
  <vn-icon slot="start" name="account" size="16"></vn-icon>
  <vn-icon slot="end" name="theme-right" size="16"></vn-icon>
</ds-list-item>

<!-- ✅ Complex content with wrapper -->
<ds-list-item [title]="'Payment Method'">
  <span slot="start">
    @if (isDefault()) {
      <vn-icon name="check" size="16" />
    } @else {
      <vn-icon name="credit-card" size="16" />
    }
  </span>
  <ds-badge slot="end" variant="success">Default</ds-badge>
</ds-list-item>

<!-- ✅ Multiple elements in slot -->
<ds-list-item [title]="'Notifications'">
  <div slot="end" class="d-flex align-items-center gap-2">
    <ds-badge variant="primary">{{ count() }}</ds-badge>
    <vn-icon name="theme-right" size="16" />
  </div>
</ds-list-item>
```

Never nest `@if` directives directly in slots without a wrapper element.

## Input Properties

### Required Properties

**`title: string`**
- Primary text displayed in the list item
- Always required for accessibility and content display

### Optional Properties

**`subtitle: string`**
- Secondary text displayed below the title
- Use for additional context or descriptions
- Default: `undefined`

**`selected: boolean`**
- Controls selection state
- Supports two-way binding with `[(selected)]`
- Managed automatically by DsListGroup in selection mode
- Default: `false`

**`size: DsListItemSize`**
- Controls item height and padding
- Options: `'large'` (72px) | `'large-condensed'` (64px) | `'medium'` (56px) | `'medium-condensed'` (48px)
- Default: `'large'`

**Size Selection Guidelines:**
- `large` (72px): Standard navigation, settings pages
- `large-condensed` (64px): Dense navigation with more items
- `medium` (56px): Compact lists, mobile interfaces
- `medium-condensed` (48px): Very dense data lists

### Signal-Based Binding

Always use signal-based inputs for component state:

```html
<!-- ✅ Proper input binding -->
<ds-list-item 
  [title]="itemTitle()" 
  [subtitle]="itemSubtitle()" 
  [selected]="isSelected()"
  [size]="'large'">
</ds-list-item>

<!-- ✅ Two-way binding for selection -->
<ds-list-item [title]="'Toggle'" [(selected)]="toggleState"></ds-list-item>
```

### Output Events

**`itemClick: EventEmitter<void>`**
- Emitted when the list item is clicked or activated via keyboard
- Use for action-based list items
- Not emitted for navigation items (anchors)

```html
<ds-list-item 
  [title]="'Delete'" 
  (itemClick)="handleDelete()">
</ds-list-item>
```

## Accessibility

### ARIA Roles and Labels

Always provide proper ARIA labels for list groups:

```html
<!-- ✅ Navigation with label -->
<ds-list-group roleType="navigation" aria-label="Account navigation">
  <a ds-list-item [title]="'Profile'" [routerLink]="'/profile'"></a>
</ds-list-group>

<!-- ✅ Selection with label -->
<ds-list-group roleType="selection" aria-label="Filter options">
  <ds-list-item [title]="'Active'" [(selected)]="showActive"></ds-list-item>
</ds-list-group>

<!-- ✅ Generic list with label -->
<ds-list-group roleType="list" aria-label="Account details">
  <ds-list-item [title]="'Balance'" [subtitle]="balance()"></ds-list-item>
</ds-list-group>
```

### Auto-Managed ARIA Attributes

Never override auto-managed ARIA attributes:

```html
<!-- ❌ Never override managed attributes -->
<ds-list-item 
  [title]="'Item'" 
  role="button" 
  [attr.aria-selected]="true"
  [attr.tabindex]="0">
</ds-list-item>

<!-- ✅ Let component manage ARIA -->
<ds-list-item [title]="'Item'" [(selected)]="isSelected"></ds-list-item>
```

The component automatically manages:
- `role` attribute based on context
- `aria-selected` for selection items
- `tabindex` for keyboard navigation
- `aria-current` for navigation items

### Keyboard Navigation

DsListGroup automatically provides keyboard navigation:
- **Arrow Up/Down**: Navigate between items
- **Enter/Space**: Activate item or toggle selection
- **Home/End**: Jump to first/last item

Always wrap items in DsListGroup to enable keyboard navigation.

### List Semantics

Always use appropriate `roleType` for the list group:

```html
<!-- ✅ Navigation lists -->
<ds-list-group roleType="navigation" aria-label="Main menu">
  <a ds-list-item [title]="'Home'" [routerLink]="'/home'"></a>
</ds-list-group>

<!-- ✅ Selection lists -->
<ds-list-group roleType="selection" selectionMode="single" aria-label="Options">
  <ds-list-item [title]="'Option 1'" [(selected)]="option1"></ds-list-item>
</ds-list-group>

<!-- ✅ Generic lists -->
<ds-list-group roleType="list" aria-label="Details">
  <ds-list-item [title]="'Name'" [subtitle]="userName()"></ds-list-item>
</ds-list-group>
```

## Common Use Cases

### Navigation Lists

Use for primary navigation, sidebars, or menu structures:

```html
<ds-list-group roleType="navigation" aria-label="Main navigation">
  <a ds-list-item 
    [title]="'Dashboard'" 
    [routerLink]="'/dashboard'"
    [selected]="isActive('/dashboard')">
    <vn-icon slot="start" name="dashboard" size="16"></vn-icon>
  </a>
  
  <a ds-list-item 
    [title]="'Games'" 
    [routerLink]="'/games'"
    [selected]="isActive('/games')">
    <vn-icon slot="start" name="games" size="16"></vn-icon>
  </a>
  
  <a ds-list-item 
    [title]="'Account'" 
    [routerLink]="'/account'"
    [selected]="isActive('/account')">
    <vn-icon slot="start" name="account" size="16"></vn-icon>
  </a>
</ds-list-group>
```

### Action Lists

Use for context menus or action sheets:

```html
<ds-list-group roleType="list" aria-label="Item actions">
  <ds-list-item 
    [title]="'Edit'" 
    [subtitle]="'Modify item details'"
    (itemClick)="editItem()">
    <vn-icon slot="start" name="edit" size="16"></vn-icon>
  </ds-list-item>
  
  <ds-list-item 
    [title]="'Duplicate'" 
    [subtitle]="'Create a copy'"
    (itemClick)="duplicateItem()">
    <vn-icon slot="start" name="copy" size="16"></vn-icon>
  </ds-list-item>
  
  <ds-list-item 
    [title]="'Delete'" 
    [subtitle]="'Remove permanently'"
    (itemClick)="deleteItem()">
    <vn-icon slot="start" name="delete" size="16"></vn-icon>
  </ds-list-item>
</ds-list-group>
```

### Display Lists

Use for read-only information display:

```html
<ds-list-group roleType="list" aria-label="Account information">
  <ds-list-item 
    [title]="'Username'" 
    [subtitle]="username()">
    <vn-icon slot="start" name="account" size="20"></vn-icon>
  </ds-list-item>
  
  <ds-list-item 
    [title]="'Email'" 
    [subtitle]="email()">
    <vn-icon slot="start" name="email" size="20"></vn-icon>
  </ds-list-item>
  
  <ds-list-item 
    [title]="'Member Since'" 
    [subtitle]="memberSince() | date">
    <vn-icon slot="start" name="calendar" size="20"></vn-icon>
  </ds-list-item>
</ds-list-group>
```

### Settings Lists

Use for configuration and preference interfaces:

```html
<ds-list-group roleType="selection" selectionMode="multiselect" aria-label="Notification settings">
  <ds-list-item 
    [title]="'Email Notifications'" 
    [subtitle]="'Receive updates via email'"
    [(selected)]="emailNotifications">
    <vn-icon slot="start" name="email" size="16"></vn-icon>
  </ds-list-item>
  
  <ds-list-item 
    [title]="'Push Notifications'" 
    [subtitle]="'Receive push notifications'"
    [(selected)]="pushNotifications">
    <vn-icon slot="start" name="bell" size="16"></vn-icon>
  </ds-list-item>
  
  <ds-list-item 
    [title]="'SMS Notifications'" 
    [subtitle]="'Receive text messages'"
    [(selected)]="smsNotifications">
    <vn-icon slot="start" name="phone" size="16"></vn-icon>
  </ds-list-item>
</ds-list-group>
```

## Anti-Patterns

### Never Apply Layout Classes to Host

Never apply display, positioning, or margin classes directly to ds-list-item elements:

```html
<!-- ❌ Layout classes on host -->
<ds-list-item class="w-100 mb-3" [title]="'Invalid'"></ds-list-item>
<ds-list-item [ngClass]="{'custom-class': true}" [title]="'Invalid'"></ds-list-item>

<!-- ✅ Use wrapper for layout -->
<div class="w-100 mb-3">
  <ds-list-item [title]="'Valid'"></ds-list-item>
</div>
```

### Never Use Native Click Events

Never use native click events - always use component outputs:

```html
<!-- ❌ Native event bypasses component logic -->
<ds-list-item [title]="'Invalid'" (click)="handleAction()"></ds-list-item>

<!-- ✅ Component output -->
<ds-list-item [title]="'Valid'" (itemClick)="handleAction()"></ds-list-item>
```

### Never Mix Semantics

Never mix navigation and action semantics:

```html
<!-- ❌ Mixed semantics -->
<ds-list-item [routerLink]="'/path'" (itemClick)="action()"></ds-list-item>
<a ds-list-item (itemClick)="action()"></a>

<!-- ✅ Clear semantics -->
<a ds-list-item [routerLink]="'/path'"></a>
<ds-list-item (itemClick)="action()"></ds-list-item>
```

### Never Use Without Container

Never use list items without DsListGroup when keyboard navigation or selection is needed:

```html
<!-- ❌ Standalone items without navigation -->
<ds-list-item [title]="'Item 1'"></ds-list-item>
<ds-list-item [title]="'Item 2'"></ds-list-item>

<!-- ✅ Grouped for proper behavior -->
<ds-list-group roleType="list" aria-label="Items">
  <ds-list-item [title]="'Item 1'"></ds-list-item>
  <ds-list-item [title]="'Item 2'"></ds-list-item>
</ds-list-group>
```

### Never Override Component Styling

Never override component styling with CSS classes or inline styles:

```html
<!-- ❌ Style overrides -->
<ds-list-item 
  [title]="'Invalid'" 
  style="background: red;"
  [style.padding]="'20px'">
</ds-list-item>

<!-- ✅ Use component inputs -->
<ds-list-item 
  [title]="'Valid'" 
  [size]="'large'">
</ds-list-item>
```

## State Management

### Signal-Based Selection Tracking

Use computed signals for reactive selection state:

```typescript
@ViewChild(DsListGroup) listGroup!: DsListGroup;

readonly selectedCount = computed(() => 
  this.listGroup.selectedItems().length
);

readonly hasSelection = computed(() => 
  this.selectedCount() > 0
);
```

Never use manual event subscriptions for selection tracking:

```typescript
// ❌ Manual event handling
ngAfterViewInit() {
  this.listGroup.items().forEach(item => {
    item.itemClick.subscribe(() => {
      // Manual tracking
    });
  });
}

// ✅ Signal-based reactivity
readonly selectedItems = computed(() => 
  this.listGroup.selectedItems()
);
```

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
  <ds-list-group roleType="navigation" aria-label="Menu">
    <a ds-list-item [title]="'Home'" [routerLink]="'/home'" [inverse]="true"></a>
    <a ds-list-item [title]="'Profile'" [routerLink]="'/profile'" [inverse]="true"></a>
  </ds-list-group>
</div>
```

## Key Rules

- Always import both DsListItem and DsListGroup
- Use `<a ds-list-item>` for navigation, `<ds-list-item>` for actions
- Always wrap multiple items in DsListGroup for keyboard navigation
- Use proper slot attributes (`start`, `end`) for content projection
- Never apply layout classes or styles directly to host element
- Always use `(itemClick)` output instead of native click events
- Never mix navigation and action semantics
- Provide ARIA labels for all list groups
- Never override auto-managed ARIA attributes
- Use signal-based inputs for reactive state
- Choose appropriate size variant based on content density
- Use wrapper elements for layout and positioning
