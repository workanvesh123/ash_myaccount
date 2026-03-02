---
inclusion: manual
---

# Design System Migration – Workflow Hub

> Use this workflow when migrating legacy UI components to Design System components.  
> Follow phases sequentially. Tool results define migration scope.

## When to Use This

Use this workflow when:
- Replacing legacy CSS/HTML with Design System components (buttons, modals, cards, etc.)
- Refactoring components to use semantic tokens instead of hardcoded styles
- Migrating deprecated CSS classes flagged by MCP violation reports

Do NOT use for:
- Greenfield features (build directly with DS from start)
- Design System component development (internal DS work)

---

## Assistant Behavior When Using This Workflow

When this file is present in context, you MUST:

1. **Announce the phase.**  
   Start by stating which phase you’re in (Identification / Analysis / Migration / Validation & Cleanup).

2. **Confirm steering intake.**  
   Before making code changes, explicitly confirm which steering files you have read, by ticking items in the **Success Criteria → Steering & Rules Intake** checklist.

3. **Follow scope strictly.**  
   Only propose or perform changes for files reported by  
   `mcp_angular_toolkit_mcp_report_all_violations`.  
   If the user asks to go beyond that, ask for explicit confirmation.

4. **Work phase-by-phase.**  
   Do not skip phases.  
   - In each phase, first summarize what you are going to do,  
   - then perform the work,  
   - then update the relevant checklist items in **Success Criteria**.

5. **End with explicit verification.**  
   At the end of the workflow, show the **Success Criteria** section with checkboxes and mark each that is satisfied. If any item is not satisfied, explain why.

---

## Goal

- Replace deprecated CSS classes and legacy markup with Design System components
- Maintain existing component behavior and public API contracts
- Eliminate all MCP violation tool findings for the target scope
- Apply semantic tokens and proper theming (inverse, composition patterns)
- Ensure zero regressions through diagnostics and validation

## Non-goal

- Performance optimizations beyond what DS provides by default
- SSR compatibility fixes unrelated to the migration itself
- Refactoring business logic or component architecture
- Migrating components outside the tool-identified violation scope
- Adding new features or changing component functionality

---

## Critical Migration Rules

**Tool Results Are Source of Truth**
- ✅ Migrate ONLY violations returned by `mcp_angular_toolkit_mcp_report_all_violations`
- ❌ Do NOT migrate deprecated patterns found manually that the tool didn't identify
- Tool results define the **exact** migration scope  
- 🧾 **Evidence:** When claiming the scope, show the relevant part of the MCP report (violations + file paths).

**Do Not Modify Global Styles**
- ✅ Create component-local SCSS instead of changing shared styles
- ❌ Do NOT modify themepark SCSS files or other shared SCSS used by multiple products
- If violations appear in shared SCSS, migrate only template/TypeScript  
- 🧾 **Evidence:** When stating you didn’t touch global styles, list the modified style files and their paths (prove they’re component-local).

**Single Component Selection**
- ✅ Select ONE Design System component per violation (most fitting)
- ❌ Do NOT document multiple options or alternatives
- ❌ Do NOT write rationales like “over X” / “instead of Y”  
- 🧾 **Evidence:** For each migrated violation, show a small before/after snippet: legacy markup → chosen DS component.

**Atomic Changes**
- ✅ Migrate HTML + CSS + TypeScript together as one change
- ❌ Do NOT do template-only or style-only migrations  
- 🧾 **Evidence:** When claiming atomic migration, show a combined snippet or diff that includes the updated HTML and any related TS/SCSS for the same component.

---

## Quick Actions

1. Run `mcp_angular_toolkit_mcp_report_all_violations` for the target directory.
2. For each violation, read the component’s TS/HTML/SCSS and understand current behaviour.
3. Use `violations[].replacement` and `.kiro/steering/topics/design-system/component-selection.md` to pick the DS component.
4. Read the matching `.kiro/steering/topics/design-system/components/ds-{component}.md` and any needed DS topics:
   - `.kiro/steering/topics/design-system/component-composition.md`
   - `.kiro/steering/topics/design-system/semantic-tokens.md`
   - `.kiro/steering/topics/design-system/inverse-theming.md`
   - `.kiro/steering/topics/design-system/utility-classes.md`
5. Understand migration boundaries, antipatterns and determine risks by reading:
    - `.kiro/steering/topics/design-system/ds-migration-risk-assessment.md`
    - `.kiro/steering/topics/design-system/ds-migration-anti-patterns.md`
    - `.kiro/steering/topics/design-system/ds-migration-boundaries.md`
5. Fix the violation, run diagnostics, and re-run `mcp_angular_toolkit_mcp_report_all_violations` (must be 0).

---

## Success Criteria

Use these checklists to confirm the workflow was followed correctly.  
The assistant should explicitly tick items in chat as they are satisfied.

### 1. Context & Scope

- [ ] I ran `mcp_angular_toolkit_mcp_report_all_violations` for the agreed scope.
- [ ] I am only touching files reported by the tool (no out-of-scope files).
- [ ] I have opened and inspected the TS/HTML/SCSS for each violating component.
- [ ] I confirmed this is **not** greenfield work or internal Design System component development.

### 2. Steering & Rules Intake

- [ ] I have read `.kiro/steering/topics/design-system/component-selection.md`.
- [ ] I have read `.kiro/steering/topics/design-system/ds-migration-boundaries.md`.
- [ ] I have read `.kiro/steering/topics/design-system/ds-migration-risk-assessment.md`.
- [ ] I have read `.kiro/steering/topics/design-system/ds-migration-anti-patterns.md`.
- [ ] I have read the relevant component spec(s) in  
      `.kiro/steering/topics/design-system/components/ds-{component}.md`.
- [ ] I have read the relevant package context:  
      `packages/{product}/{product}-context.md` and  
      `packages/{product}/{library}.context.md` (if present).

### 3. Code Migration

- [ ] Legacy markup and deprecated CSS classes for the **in-scope violations** were replaced with DS components.
- [ ] DS component inputs/outputs were wired so that the public API  
      (`@Input`, `@Output`, public methods) of the host component remains unchanged.
- [ ] No `[style]`, `[class]`, utility classes or direct CSS overrides are applied to DS component hosts.
- [ ] Layout and spacing are handled via wrapper elements and allowed utilities, not via styling DS hosts.
- [ ] Inverse theming is applied consistently (`[inverse]="true"` on all DS components on dark backgrounds).
- [ ] Semantic tokens are used for app-level styling; raw tokens are not referenced directly.

### 4. Validation & Cleanliness

- [ ] TypeScript and template diagnostics are clean.
- [ ] `mcp_angular_toolkit_mcp_report_all_violations` returns 0 for the migrated scope.
- [ ] No new ESLint errors were introduced.
- [ ] Unused legacy CSS/classes/components related to the migrated scope have been removed.
- [ ] Package docs / steering were updated if a new pattern was introduced.
- [ ] If global/shared packages were touched, I checked `04-monorepo-and-packages.md` and kept dependencies valid.

**Output:** No violations, clean diff, updated docs where needed.
