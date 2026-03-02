# DS Migration Code Review Actions

## Purpose

Systematic code review process for DS migrations to ensure zero regressions, API preservation, and standards compliance. Uses analysis data and contract diffs to guide review depth and focus areas.

---

## Prerequisites

Before starting review, verify these artifacts exist:

**Per Component:**
- [ ] Phase files: `data/components/{Component}/phase-{01,03,05}.json`
- [ ] Pre-migration contract: `data/components/{Component}/contracts/pre-migration.json`
- [ ] Post-migration contract: `data/components/{Component}/contracts/post-migration.json`
- [ ] Contract diff: `data/components/{Component}/contracts/diff.json`

**Package Level:**
- [ ] Package context: `data/{package}-context.json`
- [ ] Parsed components: `data/parsed-components.json`

---

## Review Process

### Step 1: Automated Validation

**Action:** Run MCP tools to verify technical correctness

**Tools:**
```javascript
// 1. Diagnostics (must be 0 errors)
getDiagnostics({ 
  paths: [/* all modified TS/HTML files */] 
})

// 2. Violations (must be 0)
report_all_violations({ 
  directory: './packages/{package}/{library}/src',
  componentName: 'DsButton' 
})
```

**Expected Results:**
- 0 TypeScript/template errors
- 0 DS violations

**If any fail:** Request changes before continuing review

---

### Step 2: Contract Diff Review

**Action:** Verify no breaking changes to component API

**Read:** `data/components/{Component}/contracts/diff.json`

**Check for Breaking Changes:**
```json
{
  "breakingChanges": [],  // MUST be empty
  "removedInputs": [],    // MUST be empty
  "removedOutputs": [],   // MUST be empty
  "removedMethods": [],   // MUST be empty
  "changedInputTypes": [], // MUST be empty
  "changedOutputTypes": [], // MUST be empty
  "changedMethodSignatures": [] // MUST be empty
}
```

**Acceptable Changes:**
- `addedInputs` / `addedOutputs` (rare, must be justified)
- `unchangedInputs` / `unchangedOutputs` (expected)
- Internal implementation changes (not in public API)

**If breaking changes found:** Immediate rejection, request fix

---

### Step 3: Risk-Based Review Depth

**Action:** Determine review thoroughness from phase-05 risk assessment

**Read:** `data/components/{Component}/phase-05-viability-assessment.json`

**Extract:**
```json
{
  "riskAssessment": {
    "level": "high" | "medium" | "low",
    "riskIndicators": [/* specific concerns */]
  },
  "criticalConstraints": [/* must-follow rules */]
}
```

**Review Depth by Risk:**

**High Risk:**
- Deep code review of all changes
- Verify each `riskIndicators[]` item addressed
- Confirm all `criticalConstraints[]` respected
- Check related components for impact
- Review all conditional logic paths

**Medium Risk:**
- Standard code review
- Verify `criticalConstraints[]` respected
- Spot-check related components

**Low Risk:**
- Quick code review
- Focus on anti-patterns only

---

### Step 4: HTML Template Review

**Action:** Verify template changes preserve functionality and follow standards

**Read:** `data/components/{Component}/phase-01-violation-detection.json`

**For each violation in `violationZoneAnalysis[]`:**

1. **Verify Binding Preservation:**
   - Compare `bindings.properties[]` with new template
   - Compare `bindings.events[]` with new template
   - Compare `bindings.attributes[]` with new template
   - Compare `bindings.textInterpolation[]` with new template
   - All must be preserved exactly

2. **Verify DS Component Selection:**
   - Check `dsComponentSelection.selectedComponent` matches what was used
   - Verify `variant`, `size`, `props` applied correctly
   - Confirm semantic intent (button for actions, link for navigation)

3. **Check Inverse Theming:**
   - Read phase-03 `structuralContext.parentContainer.background`
   - If `"dark"`, verify `[inverse]="true"` on ALL DS components
   - Check cascade to child DS components

4. **Check Conditional Wrappers:**
   - Read phase-03 `structuralContext.conditionalWrappers[]`
   - Verify `@if`/`@for` wrapped in containers before slot attributes
   - Example:
     ```html
     <!-- ✅ Correct -->
     @if (condition) {
       <div slot="end">
         <ds-badge>New</ds-badge>
       </div>
     }
     
     <!-- ❌ Wrong -->
     <ds-badge slot="end" @if="condition">New</ds-badge>
     ```

5. **Check No Host Styling:**
   - No `[style]` on DS component hosts
   - No `[class]` on DS component hosts
   - No utility classes on DS component hosts
   - Layout/spacing via wrappers only

**Red Flags:**
- Missing bindings from phase-01
- Wrong DS component selected (doesn't match phase-01 selection)
- Missing inverse theming on dark backgrounds (phase-03 indicates dark)
- Slot attributes on conditionals (not wrapped in container)
- Host styling present (`[style]`, `[class]`, utilities on DS hosts)

---

### Step 5: TypeScript Review

**Action:** Verify imports and no logic changes

**Read:** `data/components/{Component}/phase-01-violation-detection.json`

**Check:**

1. **DS Component Imports:**
   - All components in `component.dsComponents[]` imported
   - Import paths use barrel exports: `@frontend/ui/{component}`
   - All added to `@Component({ imports: [...] })`

2. **No Logic Changes:**
   - Component class unchanged (methods, properties, lifecycle)
   - No new dependencies injected (unless justified)
   - No type changes to existing properties
   - No method signature changes

3. **Type Safety:**
   - No `any` types introduced
   - No `@ts-ignore` comments added
   - No type errors in diagnostics

**Example:**
```typescript
// ✅ Correct
import { DsButton } from '@frontend/ui-button';
import { DsBadge } from '@frontend/ui/badge';

@Component({
  imports: [DsButton, DsBadge, /* existing imports */],
  // ... rest unchanged
})
export class MyComponent {
  // ... logic unchanged
}
```

**Red Flags:**
- Missing DS imports (phase-01 dsComponents[] not all imported)
- Relative import paths (should use `@frontend/ui/{component}`)
- Logic changes not justified (methods/properties modified)
- Type safety compromised (`any` types, `@ts-ignore` added)

---

### Step 6: SCSS Review

**Action:** Verify legacy removal and semantic token usage

**Check:**

1. **Legacy CSS Removed:**
   - Deprecated class definitions removed
   - No dead CSS left behind
   - No commented-out styles

2. **Semantic Tokens Only:**
   - Only `--semantic-*` tokens used
   - No reference tokens (`--ds-*`, `--color-*`)
   - No hardcoded values (colors, spacing)

3. **No DS Overrides:**
   - No styles targeting DS component internals
   - No overriding DS CSS custom properties
   - No `::ng-deep` or `:host ::ng-deep` for DS components

4. **Layout Preservation:**
   - Spacing/layout maintained
   - Flexbox/grid unchanged (unless intentional)
   - Responsive behavior preserved

**Example:**
```scss
// ✅ Correct
.wrapper {
  background-color: var(--semantic-color-background-primary);
  padding: var(--semantic-spacing-medium);
}

// ❌ Wrong
ds-button {
  margin: 10px; // host styling
}

.wrapper {
  background-color: var(--color-blue-500); // reference token
}
```

**Red Flags:**
- Legacy classes still present (deprecated classes not removed)
- Reference tokens used (`--ds-*`, `--color-*` instead of `--semantic-*`)
- DS component styling (targeting DS internals or hosts)
- Layout properties changed (flexbox/grid modified without justification)

---

### Step 7: Success Criteria Verification

**Action:** Verify phase-05 success criteria met through code inspection

**Read:** `data/components/{Component}/phase-05-viability-assessment.json`

**Extract:**
```json
{
  "successCriteria": [
    "Criterion 1",
    "Criterion 2",
    "Criterion 3"
  ]
}
```

**For each criterion:**
- [ ] Verify met through code review
- [ ] Document evidence (code snippet, contract diff reference)
- [ ] Flag if not met or unclear

**Common Criteria (Code-Verifiable):**
- "All bindings preserved" → Check template diff against phase-01 bindings
- "No breaking changes" → Check contract diff
- "Inverse theming applied" → Check template for `[inverse]="true"` on dark backgrounds
- "DS imports correct" → Check TypeScript imports match phase-01 dsComponents[]
- "Legacy CSS removed" → Check SCSS diff for removed deprecated classes

---

### Step 8: Anti-Pattern Detection

**Action:** Check for common DS migration anti-patterns

**Read:** `.kiro/steering/topics/design-system/ds-migration-anti-patterns.md`

**Common Anti-Patterns:**

1. **Host Styling:**
   ```html
   <!-- ❌ Wrong -->
   <ds-button [style.margin]="'10px'" class="custom-btn">
   ```

2. **Reference Tokens:**
   ```scss
   /* ❌ Wrong */
   .wrapper { color: var(--ds-button-color); }
   ```

3. **Missing Inverse:**
   ```html
   <!-- ❌ Wrong: dark background, no inverse -->
   <div class="dark-container">
     <ds-button>Click</ds-button>
   </div>
   ```

4. **Slot on Conditional:**
   ```html
   <!-- ❌ Wrong -->
   <ds-badge slot="end" @if="show">New</ds-badge>
   ```

5. **Wrong Component:**
   ```html
   <!-- ❌ Wrong: navigation should use <a> -->
   <button ds-button (click)="navigate()">Go</button>
   ```

**If anti-patterns found:** Request changes with specific examples

---

### Step 9: Logic Preservation Review

**Action:** Verify component logic unchanged through code inspection

**Read Modified Files:**
- Component TypeScript file
- Component template file
- Related service files (if modified)

**Check:**

1. **Event Handlers Unchanged:**
   - All `(click)`, `(submit)`, `(change)` handlers preserved
   - Handler method signatures unchanged
   - Handler logic unchanged

2. **Conditional Logic Preserved:**
   - `@if` conditions unchanged
   - `@for` track expressions unchanged
   - Template logic unchanged

3. **State Management Unchanged:**
   - Signal/observable definitions unchanged
   - Computed values unchanged
   - State update logic unchanged

4. **Data Flow Preserved:**
   - `@Input()` bindings unchanged
   - `@Output()` emissions unchanged
   - Parent-child communication unchanged

**Example Review:**
```typescript
// Before (from phase-01 bindings)
<button (click)="handleSave()" [disabled]="loading()">
  {{ buttonText() }}
</button>

// After (verify preserved)
<button ds-button (click)="handleSave()" [disabled]="loading()">
  {{ buttonText() }}
</button>

// Component class (verify unchanged)
handleSave() { /* logic unchanged */ }
loading = signal(false);
buttonText = computed(() => /* logic unchanged */);
```

**Red Flags:**
- Event handlers removed or changed
- Conditional logic modified
- State management refactored
- Data flow altered

---

## Review Decision Matrix

### ✅ Approve

**All must be true:**
- [ ] Contract diff clean (0 breaking changes)
- [ ] Diagnostics clean (0 errors)
- [ ] Violations resolved (0 violations)
- [ ] Phase-05 success criteria met
- [ ] No anti-patterns present
- [ ] Bindings preserved
- [ ] Logic unchanged

### 🔄 Request Changes

**Any of these:**
- [ ] Anti-patterns present (host styling, reference tokens, missing inverse)
- [ ] Bindings not preserved
- [ ] Legacy CSS not removed
- [ ] Logic changes not justified
- [ ] Success criteria not met

### ❌ Reject

**Any of these:**
- [ ] Contract diff shows breaking changes
- [ ] Diagnostics errors present
- [ ] Violations still present
- [ ] Critical constraints violated

---

## Review Checklist Template

Use this checklist for each component review:

```markdown
## Component: {ComponentName}

### Automated Validation
- [ ] Diagnostics: 0 errors (via getDiagnostics)
- [ ] Violations: 0 (via report_all_violations)

### Contract Review
- [ ] Contract diff exists at `data/components/{ComponentName}/contracts/diff.json`
- [ ] 0 breaking changes
- [ ] No removed inputs/outputs/methods

### Risk Assessment
- [ ] Risk level: {high|medium|low} (from phase-05)
- [ ] Review depth appropriate for risk
- [ ] Risk indicators addressed

### Code Review
- [ ] HTML: Bindings preserved (compare with phase-01)
- [ ] HTML: DS components correct (match phase-01 selections)
- [ ] HTML: Inverse theming correct (check phase-03)
- [ ] HTML: No host styling
- [ ] TS: Imports correct (match phase-01 dsComponents[])
- [ ] TS: No logic changes
- [ ] SCSS: Legacy removed
- [ ] SCSS: Semantic tokens only

### Standards Compliance
- [ ] No anti-patterns (host styling, reference tokens, slot on conditionals)
- [ ] Success criteria met (from phase-05)
- [ ] Critical constraints respected (from phase-05)

### Logic Preservation
- [ ] Event handlers unchanged
- [ ] Conditional logic preserved
- [ ] State management unchanged
- [ ] Data flow preserved

### Decision
- [ ] ✅ Approve
- [ ] 🔄 Request Changes: {reason}
- [ ] ❌ Reject: {reason}
```

---

## Related Documents

- **Analysis**: `.kiro/docs/ds-migrations/01-component-discovery-and-analysis-actions.md`
- **Migration**: `.kiro/docs/ds-migrations/02-ds-refactoring-actions.md`
- **Anti-Patterns**: `.kiro/steering/topics/design-system/ds-migration-anti-patterns.md`
- **Standards**: `.kiro/steering/02-coding-standards.md`
