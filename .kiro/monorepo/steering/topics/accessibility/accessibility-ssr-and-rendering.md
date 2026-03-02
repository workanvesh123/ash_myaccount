---
inclusion: manual
---

# Accessibility SSR and Rendering

## 1. Scope – When to Read This

### This file applies when you:
- Implementing accessible components that must work in SSR context
- Managing ARIA attributes dynamically with `Renderer2` for SSR compatibility
- Ensuring screen reader announcements work correctly during SSR and hydration

### This file does NOT cover:
- General accessibility principles (see `accessibility-overview-and-principles.md`)
- ARIA implementation patterns (see `accessibility-aria-and-component-contracts.md`)
- Keyboard navigation (see `accessibility-keyboard-and-focus.md`)
- General SSR patterns (see `.kiro/steering/topics/ssr/`)

**Rule:** If implementing accessible features that must work in SSR, read this file. For general accessibility or SSR patterns, consult respective topic files.

---

## 2. Core Principles

- **P1 – Prefer Template Bindings for ARIA Attributes:** Use `[attr.aria-*]` bindings with signals for reactive ARIA attributes. Only use `Renderer2.setAttribute()` for imperative updates outside templates. Never use direct DOM manipulation (`element.setAttribute()`), which breaks SSR.
- **P2 – Preserve Semantic HTML in SSR:** Server-rendered HTML must include semantic elements and ARIA attributes. Screen readers must work on initial server-rendered content before hydration. Most accessibility features work perfectly in SSR: semantic HTML (`<button>`, `<nav>`, `<main>`), ARIA attributes (`aria-label`, `aria-expanded`, `role`), keyboard navigation (handled by browser), and visual focus indicators (CSS `:focus-visible`).
- **P3 – Guard Browser-Only Accessibility Features:** Only a few accessibility features require browser APIs and must be guarded with `afterNextRender()` or `PLATFORM.runOnBrowser()`: live region announcements (dynamic DOM updates to trigger screen reader announcements), and intersection-based features (lazy loading, visibility detection). These features require user interaction or browser context, so deferring them to browser execution doesn't impact initial accessibility.

---

## 3. Do / Don't Guidelines

### Do
- Use `[attr.aria-*]` template bindings with signals for reactive ARIA attributes
- Use `Renderer2.setAttribute()` only for imperative ARIA updates outside templates
- Include ARIA attributes in server-rendered HTML (semantic structure must be complete)
- Guard live region announcements with `PLATFORM.runOnBrowser()` (require DOM manipulation)
- Test screen reader announcements in both SSR and browser contexts
- Use semantic HTML that works without JavaScript (progressive enhancement)

### Don't
- Don't use direct DOM manipulation for ARIA attributes (`element.setAttribute()`) - breaks SSR
- Don't rely on client-side JavaScript for critical accessibility features
- Don't assume live regions work on server (they require browser context for DOM updates)
- Don't skip testing accessibility in SSR mode

---

## 4. Standard Patterns

### Setting ARIA Attributes (Preferred: Template Bindings)
```typescript
// ✅ Best: Use template bindings with signals (SSR-safe, reactive)
@Component({
  template: `
    <button 
      [attr.aria-expanded]="isExpanded()"
      [attr.aria-label]="closeLabel()"
      [attr.aria-disabled]="disabled() ? true : null">
      Toggle
    </button>
  `
})
export class MyComponent {
  isExpanded = signal(false);
  closeLabel = signal('Close dialog');
  disabled = signal(false);
}
```

### Setting ARIA Attributes (Imperative: Renderer2 - Rare Cases Only)
```typescript
// ✅ Use Renderer2 only for imperative updates outside templates
// Note: This is rarely needed. Prefer template bindings with signals.
constructor() {
  const renderer = inject(Renderer2);
  const el = inject(ElementRef);
  
  // Only when you can't use template bindings (e.g., host element manipulation in directives)
  renderer.setAttribute(el.nativeElement, 'aria-hidden', 'false');
  renderer.setAttribute(el.nativeElement, 'aria-label', 'Close dialog');
}

// ❌ Wrong: Direct DOM manipulation (crashes SSR with ReferenceError)
ngOnInit() {
  this.el.nativeElement.setAttribute('aria-hidden', 'false'); // ReferenceError: document is not defined
}
```

### Live Region Announcements
```typescript
constructor() {
  const platform = inject(PLATFORM);
  
  // ✅ Skip live region updates on server
  // Reason: Live regions require DOM manipulation to trigger screen reader announcements
  platform.runOnBrowser(() => {
    this.announceToScreenReader('Content loaded');
  });
}

// Note: The aria-live attribute itself can be in SSR HTML, but dynamic content
// updates that trigger announcements must happen in browser
```

### Progressive Enhancement
```html
<!-- ✅ Semantic HTML works without JavaScript -->
<button 
  ds-button 
  [attr.aria-expanded]="isExpanded()"
  [attr.aria-controls]="panelId"
  (click)="toggle()">
  Toggle Panel
</button>

<div 
  [id]="panelId" 
  [attr.aria-hidden]="!isExpanded()"
  role="region">
  Panel content
</div>
```

---

## 5. Implementation Checklist

- [ ] Are ARIA attributes set using `[attr.aria-*]` template bindings with signals (preferred)?
- [ ] If using imperative updates, are you using `Renderer2.setAttribute()` instead of direct DOM manipulation?
- [ ] Does server-rendered HTML include all semantic elements and ARIA attributes?
- [ ] Do live region announcements skip execution on server with `PLATFORM.runOnBrowser()`?
- [ ] Have you tested with screen readers in both SSR and browser contexts?
- [ ] Does the component work without JavaScript (progressive enhancement)?
- [ ] Have you verified that SSR renders complete semantic HTML before hydration?

---

## 6. Common Pitfalls & Anti-Patterns

- ❌ **Direct DOM manipulation for ARIA attributes**
  - Using `element.setAttribute('aria-label', 'text')` breaks SSR. Use `[attr.aria-label]` bindings or `Renderer2.setAttribute()`.
- ❌ **Using Renderer2 when template bindings would work**
  - Prefer `[attr.aria-expanded]="isExpanded()"` over imperative `Renderer2.setAttribute()`. Only use Renderer2 for updates outside templates.
- ❌ **Missing ARIA attributes in server-rendered HTML**
  - Screen readers need semantic structure before hydration. Include ARIA attributes in initial render using template bindings.
- ❌ **Live region updates on server**
  - Dynamic content updates for `aria-live` regions don't work on server. Skip announcements with `PLATFORM.runOnBrowser()`.
- ❌ **Relying on client-side JavaScript for accessibility**
  - Critical accessibility features must work in server-rendered HTML (progressive enhancement).

---

## 7. Small Examples

```typescript
// ✅ Best: Use template bindings with signals (SSR-safe, reactive)
@Component({
  template: `
    <button [attr.aria-expanded]="isExpanded()">Toggle</button>
  `
})
export class MyComponent {
  isExpanded = signal(false);
}

// ✅ Acceptable: Use Renderer2 for imperative updates
constructor() {
  const renderer = inject(Renderer2);
  const el = inject(ElementRef);
  renderer.setAttribute(el.nativeElement, 'aria-hidden', 'false');
}

// ❌ Wrong: Direct DOM manipulation breaks SSR
ngOnInit() {
  this.el.nativeElement.setAttribute('aria-hidden', 'false');
}
```

---

## 8. Escalation & Trade-offs

- If accessibility feature requires browser APIs (live regions, intersection observers):
  - **Accessibility wins.** Use progressive enhancement: provide semantic HTML on server, enhance with JavaScript in browser.
- If ARIA attributes need dynamic updates:
  - **Prefer template bindings** with signals (`[attr.aria-*]`). Only use `Renderer2` for imperative updates outside templates.

---

## 9. Related Steering Files

- `.kiro/steering/topics/accessibility/accessibility-overview-and-principles.md` – General accessibility principles
- `.kiro/steering/topics/accessibility/accessibility-aria-and-component-contracts.md` – ARIA implementation patterns
- `.kiro/steering/topics/accessibility/accessibility-keyboard-and-focus.md` – Focus management patterns
- `.kiro/steering/topics/ssr/ssr-dom-and-browser-apis.md` – SSR-safe DOM manipulation
- `.kiro/steering/topics/ssr/ssr-platform-and-execution-context.md` – Platform-specific execution
- `.kiro/docs/accessibility-documentation-catalog.md` – Full accessibility documentation
- `docs/ssr-development-guide/README.md` – SSR development patterns
