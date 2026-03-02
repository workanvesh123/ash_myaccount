# DS Component Refactoring Actions

## Purpose

Execute the actual migration of a component from legacy CSS/HTML to Design System components, with integrated validation to ensure zero regressions.

---

## Prerequisites

Before starting this action, you MUST have completed:
- [ ] 6-phase analysis (phases 01-06) for the target component
- [ ] Package context file generated and validated
- [ ] All analysis JSON files schema-validated

**Required Input Files:**
- `data/components/{ComponentName}/phase-01-violation-detection.json`
- `data/components/{ComponentName}/phase-03-structural-context.json`
- `data/components/{ComponentName}/phase-05-viability-assessment.json`

---

## Critical Rules

**Atomic Migration:**
- Update HTML, TypeScript, and SCSS together in a single operation
- Never do partial migrations (HTML-only or CSS-only)
- All changes must be applied synchronously

**Contract-Based Validation:**
- Generate pre-migration contract BEFORE making any changes
- Generate post-migration contract AFTER all changes complete
- Compare contracts to detect breaking changes
- Zero breaking changes is mandatory

**Zero Tolerance:**
- 0 violations after migration (verified by MCP tool)
- 0 diagnostics errors (TypeScript, linting)
- 0 breaking changes (contract diff)

---

## Data Extraction Reference

Before executing migration steps, understand which data to extract from each phase file:

**Phase 01 (violation-detection.json):**
- `component.name` / `component.selector` / `component.root` - Component identity and file paths
- `violationsFound.totalViolations` / `violationsFound.violations[]` - Violation count and details
- `violationZoneAnalysis[].htmlSnippet.code` - Exact HTML to replace
- `violationZoneAnalysis[].bindings` - Properties, events, attributes to preserve
- `violationZoneAnalysis[].dsComponentSelection.selectedComponent` - Target DS component
- `violationZoneAnalysis[].methodBehavior` - Component behavior analysis
- `component.dsComponents[]` - All DS components needed for imports

**Phase 02 (component-discovery.json):**
- `discovery.componentLocation` - Where component is used (route/feature)
- `discovery.parentComponent` - Direct parent component
- `discovery.componentChain[]` - Full component hierarchy

**Phase 03 (structural-context.json):**
- `structuralContext.conditionalWrappers[]` - @if/@for wrappers needed
- `structuralContext.parentContainer.background` - Inverse theming requirements

**Phase 04 (route-configuration.json):**
- `routeConfiguration.routePath` - Route path for testing
- `routeConfiguration.guards[]` - Auth/feature guards
- `routeConfiguration.featureFlags[]` - Feature flags affecting component
- `routeConfiguration.allowAnonymous` - Anonymous access flag

**Phase 05 (viability-assessment.json):**
- `viabilityAssessment.feasible` / `viabilityAssessment.decision` - Migration feasibility
- `riskAssessment.level` / `riskAssessment.riskIndicators` - Risk level and factors
- `criticalConstraints[]` - Migration constraints (9 categories)
- `successCriteria[]` - Validation criteria after migration
- `featureMapping.requiredDsFeatures[]` / `featureMapping.gaps[]` - DS feature requirements

---

## Process

### Step 0: Read Analysis Files

**Action:** Load all phase files for the component being migrated

**Required Files:**
1. `data/components/{ComponentName}/phase-01-violation-detection.json`
2. `data/components/{ComponentName}/phase-03-structural-context.json`
3. `data/components/{ComponentName}/phase-05-viability-assessment.json`

**Optional Files (for context):**
- `data/components/{ComponentName}/phase-02-component-discovery.json` (usage context)
- `data/components/{ComponentName}/phase-04-route-configuration.json` (testing routes)

**Critical:** Read these files BEFORE making any code changes. They contain the exact data needed for migration.

---

### Step 1: Generate Pre-Migration Contract

**Action:** Capture component's current API surface before making changes

**Tool:** `build_component_contract`

**Parameters:**
- `typescriptFile`: Path from phase-01 `component.files.typescript`
- `templateFile`: Path from phase-01 `component.files.template`
- `styleFile`: Path from phase-01 `component.files.styles[0]` (if exists)
- `dsComponentName`: First DS component from phase-01 `dsComponentSelection.selectedComponent`
- `saveLocation`: `data/components/{ComponentName}/contracts/pre-migration.json`

**Example:**
```javascript
build_component_contract({
  typescriptFile: 'packages/bingo/frontend-lib/bingo-tournaments/src/bingo-slot-races.component.ts',
  templateFile: 'packages/bingo/frontend-lib/bingo-tournaments/src/bingo-slot-races.component.html',
  dsComponentName: 'DsButton',
  saveLocation: 'data/components/BingoSlotRacesComponent/contracts/pre-migration.json'
})
```

**Output:** JSON file in component's contracts folder containing:
- Component inputs/outputs
- Template structure
- Style dependencies
- Public API surface

---

### Step 2: Update HTML Template

**Action:** Replace deprecated classes with DS components using phase-01 data

**Migration Pattern (for each violation):**

1. **Read from phase-01 `violationZoneAnalysis[]`:**
   - `htmlSnippet.code` - Exact HTML to replace
   - `bindings.properties[]` - Property bindings to preserve
   - `bindings.events[]` - Event handlers to preserve
   - `bindings.attributes[]` - Attributes to preserve
   - `bindings.textInterpolation[]` - Text content to preserve
   - `dsComponentSelection.selectedComponent` - Target DS component
   - `dsComponentSelection.variant` / `size` / `props` - DS configuration

2. **Replace markup following this pattern:**
   ```html
   <!-- Before (from htmlSnippet.code) -->
   <button class="btn btn-primary" [disabled]="loading()" (click)="save()">
     {{ buttonText() }}
   </button>
   
   <!-- After (using dsComponentSelection + bindings) -->
   <button ds-button kind="primary" [disabled]="loading()" (click)="save()">
     {{ buttonText() }}
   </button>
   ```

**Binding Preservation (from phase-01 `bindings`):**
- **Properties** (`bindings.properties[]`): Map to DS component inputs
  - Example: `[disabled]="loading()"` → `[disabled]="loading()"`
- **Events** (`bindings.events[]`): Preserve exactly as-is
  - Example: `(click)="save()"` → `(click)="save()"`
- **Attributes** (`bindings.attributes[]`): Preserve or map to DS inputs
  - Example: `[attr.aria-label]="label()"` → `[attr.aria-label]="label()"`
- **Two-way** (`bindings.twoWayBindings[]`): Preserve exactly as-is
  - Example: `[(ngModel)]="value"` → `[(ngModel)]="value"`
- **Text interpolation** (`bindings.textInterpolation[]`): Preserve exactly as-is
  - Example: `{{ text() }}` → `{{ text() }}`

**Conditional Handling (from phase-03 `structuralContext.conditionalWrappers[]`):**
- If wrappers exist, wrap DS component in container:
  ```html
  @if (condition) {
    <div>
      <button ds-button>Click</button>
    </div>
  }
  ```

**Inverse Theming (from phase-03 `structuralContext.parentContainer.background`):**
- If `background === "dark"`, add `[inverse]="true"` to ALL DS components:
  ```html
  <button ds-button [inverse]="true">Click</button>
  ```

**DS Component Configuration (from phase-01 `dsComponentSelection`):**
- Apply `variant`, `size`, `props` from analysis:
  ```html
  <button ds-button 
          kind="primary"           <!-- from variant -->
          size="medium"            <!-- from size -->
          [disabled]="loading()">  <!-- from props -->
    Save
  </button>
  ```

---

### Step 3: Update TypeScript

**Action:** Import DS components and add to imports array using phase-01 data

**Read from phase-01:**
- `component.dsComponents[]` - List of all DS components to import

**For each DS component in `component.dsComponents[]`:**

1. **Add import statement:**
   ```typescript
   import { DsButton } from '@frontend/ui-button';
   ```

2. **Add to component imports array:**
   ```typescript
   @Component({
     imports: [DsButton, /* existing imports */]
   })
   ```

**Import Path Pattern:**
- DsButton → `@frontend/ui-button`
- DsModal → `@frontend/ui/modal`
- DsBadge → `@frontend/ui/badge`
- DsSegmentedControl → `@frontend/ui/segmented-control`
- DsCard → `@frontend/ui/card`
- DsIcon → `@frontend/ui/icon`
- DsLoadingSpinner → `@frontend/ui/loading-spinner`

**Example (from phase-01 `component.dsComponents: ["DsButton", "DsBadge"]`):**
```typescript
import { DsButton } from '@frontend/ui-button';
import { DsBadge } from '@frontend/ui/badge';

@Component({
  selector: 'app-my-component',
  imports: [DsButton, DsBadge, CommonModule, /* other imports */],
  // ...
})
```

---

### Step 4: Update SCSS (if exists)

**Action:** Remove legacy classes, add semantic tokens if needed

**Remove:**
- Legacy class definitions that targeted deprecated classes
- Example: `.btn-primary { ... }` → Remove

**Add (if needed):**
- Semantic tokens for app-specific styling
- Example: `background-color: var(--semantic-color-background-primary);`

**Never:**
- Style DS component hosts directly
- Override DS component internal styles
- Use reference tokens (use semantic tokens only)

---

### Step 5: Run Diagnostics

**Action:** Verify TypeScript and template are error-free

**Tool:** `getDiagnostics`

**Parameters:**
- `paths`: Array of modified file paths

**Example:**
```javascript
getDiagnostics({
  paths: [
    'packages/bingo/frontend-lib/bingo-tournaments/src/bingo-slot-races.component.ts',
    'packages/bingo/frontend-lib/bingo-tournaments/src/bingo-slot-races.component.html'
  ]
})
```

**Expected:** 0 errors, 0 warnings

**If errors found:**
- Fix TypeScript errors (missing imports, type mismatches)
- Fix template errors (unknown components, binding errors)
- Re-run diagnostics until clean

---

### Step 6: Generate Post-Migration Contract

**Action:** Capture component's API surface after changes

**Tool:** `build_component_contract`

**Parameters:** Same as Step 1, but different save location
- `saveLocation`: `data/components/{ComponentName}/contracts/post-migration.json`

**Example:**
```javascript
build_component_contract({
  typescriptFile: 'packages/bingo/frontend-lib/bingo-tournaments/src/bingo-slot-races.component.ts',
  templateFile: 'packages/bingo/frontend-lib/bingo-tournaments/src/bingo-slot-races.component.html',
  dsComponentName: 'DsButton',
  saveLocation: 'data/components/BingoSlotRacesComponent/contracts/post-migration.json'
})
```

---

### Step 7: Compare Contracts

**Action:** Detect breaking changes between pre and post migration

**Tool:** `diff_component_contract`

**Parameters:**
- `contractBeforePath`: `data/components/{ComponentName}/contracts/pre-migration.json`
- `contractAfterPath`: `data/components/{ComponentName}/contracts/post-migration.json`
- `saveLocation`: `data/components/{ComponentName}/contracts/diff.json`

**Example:**
```javascript
diff_component_contract({
  contractBeforePath: 'data/components/BingoSlotRacesComponent/contracts/pre-migration.json',
  contractAfterPath: 'data/components/BingoSlotRacesComponent/contracts/post-migration.json',
  saveLocation: 'data/components/BingoSlotRacesComponent/contracts/diff.json'
})
```

**Expected:** Diff shows 0 breaking changes

**Breaking changes include:**
- Removed inputs/outputs
- Changed input/output types
- Removed public methods
- Changed method signatures
- Removed template elements with bindings

**If breaking changes found:**
- Review diff to understand what changed
- Restore removed public API elements
- Ensure bindings are preserved
- Re-generate post-contract and compare again

---

### Step 8: Verify Zero Violations

**Action:** Confirm all violations resolved

**Tool:** `report_all_violations`

**Parameters:**
- `directory`: Component root path from phase-01

**Example:**
```javascript
report_all_violations({
  directory: './packages/bingo/frontend-lib/bingo-tournaments/src',
  componentName: 'DsButton'
})
```

**Expected:** 0 violations

**If violations found:**
- Review violation details
- Check if deprecated classes still present in HTML
- Check if CSS still references old classes
- Fix remaining violations
- Re-run tool until 0 violations

---

### Step 9: Final Diagnostics Check

**Action:** Ensure no new errors introduced

**Tool:** `getDiagnostics`

**Parameters:**
- `paths`: All modified files

**Expected:** 0 errors, 0 warnings

---

## Task Execution Pattern

When executing a migration task, follow this pattern:

**Task Structure:**
```markdown
- [ ] {N}. Migrate {ComponentName}
  - **Read Sources:**
    - `data/components/{ComponentName}/phase-01-violation-detection.json` (violations, DS selection, bindings)
    - `data/components/{ComponentName}/phase-03-structural-context.json` (conditionals, parent containers)
    - `data/components/{ComponentName}/phase-05-viability-assessment.json` (success criteria)
  - **Files:** {paths from phase-01 component.root}
  - **Actions:**
    1. HTML: Replace deprecated classes with DS components (from phase-01 violationZoneAnalysis[])
    2. TS: Import DS components (from phase-01 component.dsComponents[]), add to imports array
    3. SCSS: Remove legacy classes, preserve parent containers (from phase-03)
  - **Validation:** Run `getDiagnostics` on modified files
  - **Acceptance:** {2-3 key criteria from phase-05 successCriteria[]}

- [ ] {N+1}. Validate {ComponentName}
  - **Read Sources:**
    - `data/components/{ComponentName}/phase-01-violation-detection.json` (file paths for contract)
    - `data/components/{ComponentName}/phase-05-viability-assessment.json` (success criteria)
  - **Actions:**
    1. `build_component_contract` → `data/components/{ComponentName}/contracts/post-migration.json`
    2. `diff_component_contract` → `data/components/{ComponentName}/contracts/diff.json`
    3. `getDiagnostics` → 0 errors
    4. `report_all_violations` → 0 violations
  - **Acceptance:** Contract diff clean, diagnostics clean, violations resolved
```

**Execution Steps:**
1. Read all source JSON files listed under "Read Sources"
2. Extract data using the Data Extraction Reference (Step 0)
3. Execute actions in order (HTML → TS → SCSS)
4. Run validation commands
5. Verify acceptance criteria met

---

## Success Criteria

**Before marking task complete, verify:**
- [ ] Step 0: All phase files read (phase-01, phase-03, phase-05)
- [ ] Step 1: Pre-migration contract generated
- [ ] Step 2: HTML updated with DS components (from phase-01 violationZoneAnalysis[])
- [ ] Step 3: TypeScript imports added (from phase-01 component.dsComponents[])
- [ ] Step 4: SCSS updated (if applicable)
- [ ] Step 5: Diagnostics clean (0 errors)
- [ ] Step 6: Post-migration contract generated
- [ ] Step 7: Contract diff shows 0 breaking changes
- [ ] Step 8: Violations resolved (0 violations)
- [ ] Step 9: Final diagnostics clean
- [ ] Success criteria from phase-05 met

---

## Common Issues & Solutions

**Issue:** Diagnostics show "Unknown component DsButton"
**Solution:** Check import statement and imports array, verify barrel export path

**Issue:** Contract diff shows removed inputs
**Solution:** Check if bindings were preserved in template, restore missing bindings

**Issue:** Violations still present after migration
**Solution:** Check if all deprecated classes removed, verify CSS selectors updated

**Issue:** Template errors after DS component added
**Solution:** Verify component is in imports array, check binding syntax

---

## Related Documents

- **Analysis Phase**: `.kiro/docs/ds-migrations/01-component-discovery-and-analysis-actions.md`
- **Migration Patterns**: `.kiro/steering/topics/design-system/ds-migration-anti-patterns.md`
- **Component Selection**: `.kiro/steering/topics/design-system/component-selection.md`
- **Inverse Theming**: `.kiro/steering/topics/design-system/inverse-theming.md`
