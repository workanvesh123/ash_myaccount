---
inclusion: manual
---

# Keyboard Navigation & Focus Management

## 1. Scope – When to Read This

### This file applies when you:
- Implementing keyboard navigation for interactive components (menus, modals, tabs, forms)
- Managing focus states (focus trapping, focus restoration, programmatic focus)
- Creating custom interactive elements that need keyboard support
- Writing tests for keyboard accessibility
- Debugging focus-related issues in SSR or dynamic content

### This file does NOT cover:
- ARIA attributes and roles (see `accessibility-aria-and-component-contracts.md`)
- Visual focus indicators and styling (see Themepark documentation)
- Screen reader announcements (see ARIA documentation)

**Rule:** If you're handling keyboard events or programmatically managing focus, this file defines the patterns.

---

## 2. Core Principles

- **P1 – All Interactive Elements Keyboard Accessible:** Every element users can click must be operable via keyboard (`Tab`, `Enter`, `Space`, `Arrow keys`, `Escape`). No mouse-only interactions.
- **P2 – Logical Tab Order:** Tab order follows visual layout. Use semantic HTML structure, not `tabindex` values > 0. Only use `tabindex="-1"` (programmatic focus) or `tabindex="0"` (natural order).
- **P3 – Focus Visible & Managed:** Focus must be visible (CSS `:focus-visible`), restored after modals/menus close, and trapped within modal contexts.
- **P4 – SSR-Safe Focus Operations:** Use `afterNextRender()` for programmatic focus. Never call `.focus()` in constructors or `ngOnInit()`.

---

## 3. Do / Don't Guidelines

### Do
- Use `afterNextRender()` or `afterRenderEffect()` for programmatic `.focus()` calls
- Implement arrow key navigation for lists, menus, tabs (Home/End for first/last)
- Return focus to trigger element after closing modals/menus
- Use `[attr.tabindex]` bindings for dynamic focusability (`disabled ? -1 : 0`)
- Test keyboard navigation in unit tests (harnesses with `.focus()`, `.blur()`, key events)

### Don't
- Call `.focus()` directly in constructors, `ngOnInit()`, or synchronous code (breaks SSR)
- Use `tabindex` values > 0 (disrupts natural tab order)
- Forget to handle `Escape` key for dismissible overlays (modals, menus, tooltips)
- Allow focus to escape modal dialogs (implement focus trapping)
- Skip keyboard event handlers for custom interactive components

---

## 4. Standard Patterns

### Programmatic Focus (SSR-Safe)
```typescript
// Use afterNextRender for focus operations
constructor() {
  const elementRef = inject(ElementRef);
  afterNextRender(() => {
    elementRef.nativeElement.focus();
  });
}
```

### Dynamic Tabindex (Disabled State)
```typescript
// ✅ Correct: Use template bindings with signals (SSR-safe, reactive)
@Component({
  host: {
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    '[attr.aria-disabled]': 'disabled() ? true : null'
  }
})
export class MyComponent {
  disabled = signal(false);
}
```

### Arrow Key Navigation (Menus, Lists)
```typescript
@HostListener('keydown', ['$event'])
onKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      event.stopPropagation(); // Prevent parent handlers from also processing
      this.focusNextItem();
      break;
    case 'ArrowUp':
      event.preventDefault();
      event.stopPropagation();
      this.focusPreviousItem();
      break;
    case 'Home':
      event.preventDefault();
      event.stopPropagation();
      this.focusFirstItem();
      break;
    case 'End':
      event.preventDefault();
      event.stopPropagation();
      this.focusLastItem();
      break;
    case 'Escape':
      event.preventDefault();
      event.stopPropagation();
      this.close();
      break;
  }
}
```

**Event Propagation Control:**
- Use `event.stopPropagation()` when you've fully handled the event and don't want parent components to also process it
- Use `event.stopImmediatePropagation()` when multiple handlers exist on the same element and you want to prevent other handlers from running
- Always pair with `event.preventDefault()` to prevent both default browser behavior and event bubbling

### Focus Restoration (Modals, Menus)
```typescript
// Store trigger element before opening
private triggerElement: HTMLElement | null = null;

open(): void {
  this.triggerElement = document.activeElement as HTMLElement;
  // Open modal/menu
}

close(): void {
  // Close modal/menu
  afterNextRender(() => {
    this.triggerElement?.focus();
  });
}
```

---

## 5. Implementation Checklist

- [ ] Are all interactive elements keyboard accessible (`Tab`, `Enter`, `Space`, `Escape`)?
- [ ] Does `tabindex` use only `-1` (programmatic) or `0` (natural order), never positive values?
- [ ] Are programmatic `.focus()` calls wrapped in `afterNextRender()` or `afterRenderEffect()`?
- [ ] Does the component restore focus after closing overlays (modals, menus)?
- [ ] Are arrow keys implemented for list-like components (menus, tabs, radio groups)?
- [ ] Do keyboard tests verify focus behavior and key event handling?
- [ ] Are dynamic ARIA attributes set using `[attr.aria-*]` template bindings with signals (not Renderer2)?

---

## 6. Common Pitfalls & Anti-Patterns

- ❌ **Calling `.focus()` in `ngOnInit()` or constructor**
  - Breaks SSR (no DOM on server). Use `afterNextRender()` for all programmatic focus.
- ❌ **Using `tabindex` values > 0**
  - Disrupts natural tab order. Use semantic HTML structure instead.
- ❌ **Missing `Escape` key handler for overlays**
  - Users expect `Escape` to close modals, menus, tooltips. Always implement.
- ❌ **Not restoring focus after closing overlays**
  - Focus gets lost, forcing users to re-navigate. Store trigger element and restore focus on close.
- ❌ **Forgetting to prevent default on arrow keys**
  - Arrow keys scroll the page. Use `event.preventDefault()` in navigation handlers.

---

## 7. Small Examples

```typescript
// ✅ Correct: SSR-safe focus with afterNextRender
export class DsInputField {
  private readonly elementRef = inject(ElementRef);
  
  focus(): void {
    afterNextRender(() => {
      this.elementRef.nativeElement.focus();
    });
  }
}
```

```typescript
// ❌ Avoid: Direct focus call (breaks SSR)
export class BadInput {
  ngOnInit(): void {
    this.elementRef.nativeElement.focus(); // SSR crash
  }
}
```

```typescript
// ✅ Correct: Menu with arrow key navigation and focus restoration
export class DsMenu {
  private triggerElement: HTMLElement | null = null;
  
  open(): void {
    this.triggerElement = document.activeElement as HTMLElement;
    afterNextRender(() => this.focusFirstItem());
  }
  
  close(): void {
    afterNextRender(() => this.triggerElement?.focus());
  }
  
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();
      this.focusNextItem();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
    }
  }
}
```

---

## 8. Escalation & Trade-offs

- If keyboard navigation conflicts with mouse interactions:
  - **Keyboard accessibility wins.** Ensure both input methods work equivalently.
- If focus management impacts performance:
  - **Accessibility wins.** Optimize elsewhere (change detection, lazy loading).
- If SSR requires delaying focus operations:
  - **Use `afterNextRender()`.** Never skip focus management for SSR convenience.

**Rule:** Keyboard accessibility is mandatory per WCAG 2.2 AA. When in doubt, test with keyboard-only navigation.

---

## 9. Related Steering Files

- `.kiro/steering/topics/accessibility/accessibility-aria-and-component-contracts.md` – ARIA attributes and roles
- `.kiro/steering/topics/ssr/ssr-dom-and-browser-apis.md` – SSR-safe DOM manipulation
- `.kiro/steering/packages/design-system/design-system-context.md` – Component development patterns
- `.kiro/steering/02-coding-standards.md` – Accessibility requirements
- `.kiro/docs/accessibility-documentation-catalog.md` – Full accessibility documentation
