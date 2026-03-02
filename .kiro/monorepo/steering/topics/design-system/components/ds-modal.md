---
inclusion: manual
description: "DsModal integration patterns for dialog overlays, confirmations, forms, and bottom sheets requiring user focus"
---

# DsModal Integration Instructions

## Context

This guidance applies when creating dialog overlays, confirmations, forms, or bottom sheets that require user focus and interaction. Use this when working with files that contain or reference DsModal components.

## Component Import and Service Setup

Always import DsModal components from `@frontend/ui/modal` and use dialog services for lifecycle management.

```typescript
import { DsModal, DsModalHeader, DsModalContent } from '@frontend/ui/modal';
import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
// OR for Material Dialog compatibility
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  imports: [DsModal, DsModalHeader, DsModalContent]
})
```

Always open modals via dialog service, never instantiate modal components directly.

```typescript
// CDK Dialog (recommended for new features)
openModal() {
  this.dialog.open(MyModalComponent, {
    data: { title: 'Confirm Action' },
    hasBackdrop: true,
    panelClass: 'ds-dialog-panel'
  });
}
```

## Modal Component Structure

Always inject DialogRef and data tokens for proper lifecycle management.

```typescript
@Component({
  template: `
    <ds-modal [variant]="'surface-low'">
      <ds-modal-header>
        <div slot="start">
          <div slot="title">{{ data.title }}</div>
        </div>
        <button slot="end" ds-button-icon size="small" (click)="close()">
          <vn-icon name="theme-ex" />
        </button>
      </ds-modal-header>
      <ds-modal-content>{{ data.content }}</ds-modal-content>
    </ds-modal>
  `
})
export class MyModalComponent {
  dialogRef = inject(DialogRef);
  data = inject(DIALOG_DATA);
  
  close() { this.dialogRef.close(); }
}
```

Always define typed data interfaces for modal communication.

```typescript
export interface ModalData {
  title: string;
  content: string;
  // Add required fields only
}
```

## Variant Selection and Theming

Always choose variant based on content hierarchy and visual context.

```html
<!-- High contrast content (promotional, media) -->
<ds-modal [variant]="'surface-lowest'">

<!-- Standard dialogs (confirmations, alerts) -->
<ds-modal [variant]="'surface-low'">

<!-- General content (forms, info) -->
<ds-modal [variant]="'surface'">
```

Always match header variant to modal context for visual consistency.

```html
<ds-modal [variant]="'surface-low'">
  <ds-modal-header [variant]="'surface-low'">
    <!-- Header content -->
  </ds-modal-header>
</ds-modal>
```

Never use `[ngClass]` or inline styles on modal components - use variant inputs or wrapper elements.

## Header Slot Projection

Always use semantic slot structure for modal headers with proper nesting.

```html
<ds-modal-header>
  <div slot="start">
    <div slot="title">{{ title }}</div>
    <div slot="subtitle">{{ subtitle }}</div>
  </div>
  <div slot="center">
    <ds-modal-header-drag />
  </div>
  <button slot="end" ds-button-icon size="small" (click)="close()">
    <vn-icon name="theme-ex" />
  </button>
</ds-modal-header>
```

Never place title/subtitle slots directly in header - always nest within start slot.

## Modal Sizing and Layout

Always apply sizing to ds-modal host element, never use size inputs.

```typescript
@Component({
  template: `<ds-modal>...</ds-modal>`,
  styles: [`
    ds-modal {
      width: 400px;
      max-width: 90vw;
      max-height: 80vh;
    }
  `]
})
```

Always use wrapper elements for positioning and display modes.

## Bottom Sheet Implementation

Always combine `[bottomSheet]="true"` with panelClass for proper positioning.

```typescript
openBottomSheet() {
  this.dialog.open(BottomSheetComponent, {
    panelClass: 'ds-bottom-sheet-panel',
    data: { bottomSheet: true }
  });
}
```

```html
<ds-modal [bottomSheet]="true" [radius]="false">
  <ds-modal-header [variant]="'nav-bg'">
    <ds-modal-header-drag />
  </ds-modal-header>
</ds-modal>
```

## Accessibility Implementation

Always add proper ARIA labeling for screen reader context.

```html
<!-- Title-based labeling -->
<ds-modal [attr.aria-labelledby]="'modal-title'">
  <ds-modal-header>
    <div slot="start">
      <div id="modal-title" slot="title">Confirm Action</div>
    </div>
  </ds-modal-header>
</ds-modal>

<!-- Direct labeling for forms without visible titles -->
<ds-modal [attr.aria-label]="'Edit Profile Form'">
  <ds-modal-content>
    <!-- Form content -->
  </ds-modal-content>
</ds-modal>
```

Always use `role="alertdialog"` for critical notifications requiring immediate attention.

Never manage focus manually - dialog services handle focus trap and restoration automatically.

## Service Choice Guidelines

Always use CDK Dialog for new features unless Material Dialog features are specifically needed.

Always configure backdrop and keyboard behavior in dialog options.

```typescript
this.dialog.open(ModalComponent, {
  hasBackdrop: true,
  disableClose: false,  // Allow Escape key
  panelClass: 'custom-panel-class',
  data: modalData
});
```

## Form Integration Patterns

Always use reactive forms with proper validation in modal content.

Always return form data through DialogRef.close() for parent component handling.

## Inverse Theming

Always apply `[inverse]="true"` when using this component on dark backgrounds. See `inverse-theming.md` for comprehensive guidance.

```html
<div class="dark-background">
  <ds-modal [inverse]="true" [variant]="'surface-low'">
    <ds-modal-header [inverse]="true">
      <div slot="start">
        <div slot="title">Modal on Dark Background</div>
      </div>
    </ds-modal-header>
    <ds-modal-content>Content here</ds-modal-content>
  </ds-modal>
</div>
```

## Confirmation Dialog Patterns

Always structure confirmation dialogs with clear action buttons and proper data flow.

Always handle modal results with proper type safety in parent components.

```typescript
openConfirmation() {
  const dialogRef = this.dialog.open(ConfirmModalComponent, {
    data: { title: 'Delete Item', content: 'Are you sure?' }
  });
  
  dialogRef.afterClosed().subscribe((confirmed: boolean) => {
    if (confirmed) {
      this.deleteItem();
    }
  });
}
```
