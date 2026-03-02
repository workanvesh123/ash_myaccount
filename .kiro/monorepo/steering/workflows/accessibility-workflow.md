---
inclusion: manual
---

# Accessibility Implementation – Workflow Hub

> Use this workflow when **implementing or fixing accessibility features** in components.  
> Follow phases sequentially to ensure WCAG 2.2 AA compliance.

---

## When to Use This

Use this workflow when:
- Creating new interactive components (buttons, forms, modals, menus, tabs)
- Adding accessibility features to existing components (ARIA, keyboard navigation, focus management)
- Fixing accessibility violations reported by axe-core or manual testing
- Implementing Design System components with accessibility requirements
- Ensuring SSR-compatible accessibility features

Do NOT use for:
- Visual design and color contrast decisions (designer responsibility)
- Content accessibility (alt text, heading structure – content writer responsibility)
- Design System migration (use `design-system-migration-workflow.md`)
- SSR-only issues unrelated to accessibility (use `ssr-migration-workflow.md`)

---

## Assistant Behavior When Using This Workflow

When this file is present in context, you MUST:

1. **Announce the phase.**  
   Start each major reply by stating which phase you are in (Requirements → Implementation → Testing → Validation).

2. **Confirm steering intake.**  
   Before proposing or making changes, explicitly confirm which steering files you have read by ticking items in the **Success Criteria → Steering & Rules Intake** checklist.

3. **Follow scope strictly.**  
   Only propose or perform changes within the user's specified scope. Ask before expanding to additional components or features.

4. **Work phase-by-phase.**  
   Do not skip phases. Summarize → Execute → Update checklist.

5. **End with explicit verification.**  
   At the end of the workflow, show the **Success Criteria** section with checkboxes and mark each that is satisfied. If any item is not satisfied, explain why.

---

## Goal

- Implement accessibility features that meet WCAG 2.2 Level AA standards
- Use semantic HTML and proper ARIA attributes for screen reader support
- Ensure keyboard navigation works for all interactive elements
- Verify accessibility with automated tests (axe-core) and manual testing
- Maintain SSR compatibility for all accessibility features

## Non-goal

- Fixing visual design issues (color contrast, typography – designer responsibility)
- Writing content (alt text, labels – content writer responsibility)
- Large-scale refactors beyond accessibility requirements
- Performance optimization unrelated to accessibility
- Changing component architecture or ownership

---

## Phases

### Phase 1 – Requirements Analysis

**Goal:**  
- Understand accessibility requirements for the component or feature
- Identify which WCAG 2.2 criteria apply
- Determine semantic HTML elements and ARIA attributes needed

**Include steering:**
- `.kiro/steering/topics/accessibility/accessibility-overview-and-principles.md` (WCAG principles, component selection)
- `.kiro/steering/topics/accessibility/accessibility-checklist.md` (comprehensive checklist)
- `.kiro/steering/01-project-context.md` (project context)
- `.kiro/steering/02-coding-standards.md` (accessibility standards)
- `packages/{product}/{product}-context.md` (if product-specific)

**Actions:**
- Identify component type (button, form, modal, menu, etc.)
- Determine semantic HTML elements (`<button>`, `<a>`, `<input>`, etc.)
- List required ARIA attributes (`aria-label`, `aria-expanded`, `aria-describedby`, etc.)
- Identify keyboard interactions (`Tab`, `Enter`, `Space`, `Escape`, arrow keys)
- Check if SSR compatibility is required

---

### Phase 2 – Implementation

**Goal:**  
- Implement semantic HTML, ARIA attributes, and keyboard navigation
- Ensure SSR compatibility for all accessibility features
- Apply Design System components where applicable

**Include steering:**
- `.kiro/steering/topics/accessibility/accessibility-aria-and-component-contracts.md` (ARIA patterns)
- `.kiro/steering/topics/accessibility/accessibility-keyboard-and-focus.md` (keyboard navigation, focus management)
- `.kiro/steering/topics/accessibility/accessibility-ssr-and-rendering.md` (if SSR required)
- `.kiro/steering/topics/design-system/component-selection.md` (if using DS components)
- `packages/{product}/{library}.context.md` (if library-specific)

**Actions:**
- Use semantic HTML elements (`<button>`, `<a>`, `<input>`) instead of divs
- Add ARIA attributes using `[attr.aria-*]` bindings (not static attributes)
- Implement keyboard event handlers (`@HostListener('keydown')`)
- Use `afterNextRender()` for programmatic focus operations (SSR-safe)
- Use `Renderer2.setAttribute()` for dynamic ARIA attributes (SSR-safe)
- Apply `[attr.tabindex]` bindings for dynamic focusability
- Implement focus restoration for overlays (modals, menus)

---

### Phase 3 – Testing

**Goal:**  
- Verify accessibility with automated tests (axe-core)
- Test keyboard navigation manually
- Test with screen readers (NVDA, VoiceOver)

**Include steering:**
- `.kiro/steering/topics/accessibility/accessibility-testing-and-tooling.md` (testing patterns)
- `.kiro/steering/topics/accessibility/accessibility-checklist.md` (validation checklist)
- `.kiro/steering/packages/design-system/design-system-context.md` (if DS component)

**Actions:**
- Add axe-core tests to unit tests (`jest-axe` or `axe-playwright`)
- Enable Storybook a11y addon for visual testing
- Test keyboard navigation (`Tab`, `Enter`, `Space`, `Escape`, arrow keys)
- Test with screen reader (NVDA on Windows, VoiceOver on Mac)
- Verify focus indicators are visible (`:focus-visible`)
- Test in SSR mode if applicable (`nx serve-ssr {product}`)

---

### Phase 4 – Validation

**Goal:**  
- Verify all accessibility requirements are met
- Ensure no regressions in existing functionality
- Document accessibility features

**Include steering:**
- `.kiro/steering/02-coding-standards.md` (accessibility standards)
- `.kiro/steering/topics/accessibility/accessibility-overview-and-principles.md` (WCAG principles)
- `.kiro/steering/topics/accessibility/accessibility-checklist.md` (validation checklist)

**Actions:**
- Run `getDiagnostics` to check for type/lint errors
- Verify axe-core tests pass in unit tests and Storybook
- Confirm keyboard navigation works for all interactive states
- Verify screen reader announcements are correct
- Check SSR compatibility (no crashes, hydration mismatches)
- Update component README with accessibility documentation

---

## Success Criteria

Use these checklists to confirm the workflow was followed correctly.  
The assistant should explicitly tick items in chat as they are satisfied.

### 1. Context & Scope

- [ ] I confirmed the component or feature requiring accessibility implementation.
- [ ] I confirmed which parts of the codebase are in scope.
- [ ] I am only proposing or making changes within that scope.
- [ ] I confirmed this work matches the **When to Use This** section (not an out-of-scope case).

### 2. Steering & Rules Intake

- [ ] I have read `.kiro/steering/topics/accessibility/accessibility-overview-and-principles.md` (WCAG principles).
- [ ] I have read `.kiro/steering/topics/accessibility/accessibility-checklist.md` (comprehensive checklist).
- [ ] I have read `.kiro/steering/topics/accessibility/accessibility-aria-and-component-contracts.md` (ARIA patterns).
- [ ] I have read `.kiro/steering/topics/accessibility/accessibility-keyboard-and-focus.md` (keyboard navigation).
- [ ] I have read `.kiro/steering/topics/accessibility/accessibility-testing-and-tooling.md` (testing patterns).
- [ ] I have read `.kiro/steering/topics/accessibility/accessibility-ssr-and-rendering.md` (if SSR required).
- [ ] I have read `.kiro/steering/02-coding-standards.md` (accessibility standards).
- [ ] I have read the relevant package context files:  
      `packages/{product}/{product}-context.md` and  
      `packages/{product}/{library}.context.md` (if present).

### 3. Execution

- [ ] I followed the phases defined in this workflow in order (Requirements → Implementation → Testing → Validation).
- [ ] I used semantic HTML elements (`<button>`, `<a>`, `<input>`) instead of divs.
- [ ] I added ARIA attributes using `[attr.aria-*]` bindings (not static attributes).
- [ ] I implemented keyboard navigation for all interactive elements.
- [ ] I used `afterNextRender()` for programmatic focus operations (SSR-safe).
- [ ] I used `Renderer2.setAttribute()` for dynamic ARIA attributes (SSR-safe).
- [ ] I kept changes minimal and within the agreed scope.

### 4. Validation & Cleanliness

- [ ] Axe-core tests pass in unit tests and Storybook.
- [ ] Keyboard navigation works for all interactive states (`Tab`, `Enter`, `Space`, `Escape`, arrow keys).
- [ ] Screen reader announcements are correct (tested with NVDA or VoiceOver).
- [ ] Focus indicators are visible (`:focus-visible`).
- [ ] SSR compatibility verified (no crashes, hydration mismatches).
- [ ] Component README documents accessibility features.
- [ ] No dead code, TODOs, or commented-out blocks related to accessibility.

**Output:**  
Accessible component meeting WCAG 2.2 Level AA standards, validated with automated tests and manual verification.
