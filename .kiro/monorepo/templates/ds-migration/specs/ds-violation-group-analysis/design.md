# Design Document: DS Violation Group Analysis & Migration Workflow

## Overview

This design defines a **complete migration workflow** that produces comprehensive pre-migration analysis AND executes migrations with validation. The workflow is **instruction-driven**: it reads action documents that define step-by-step procedures, then executes those procedures to generate analysis artifacts and perform code changes.

**This workflow includes both documentation AND code implementation**—it produces analysis that informs migration planning, then executes migrations with contract-based validation to ensure zero regressions.

### Key Design Principles

1. **Action Documents as Source of Truth**: The `.kiro/docs/ds-migrations/` folder contains markdown files that define "how" to perform each workflow phase. The workflow reads and follows these instructions.

2. **Multi-Phase Sequential Workflow**: 
   - Phase 00: Package Discovery (once per package, cached)
   - Phases 01-06: Per-Component Analysis (6 phases per component)
   - Phase 07: Migration Execution (with contract validation)
   - Phase 08: Code Review (analysis-driven validation)

3. **Per-Component Processing**: Each component in the violation group is analyzed through all 6 phases, then migrated and reviewed before moving to the next component.

4. **Package-Level Context Caching**: Brand configuration and product context are loaded once per package and reused for all components in that package.

5. **Contract-Based Validation**: Pre and post-migration contracts are compared to detect breaking changes, ensuring zero regressions.

## Architecture

### High-Level Flow

```
violations-group.json
    ↓
Parse Component Paths → data/parsed-components.json + tasks.md
    ↓
Package Discovery (once) → data/{package}-context.json
    ↓
For Each Component:
    ↓
Phase 01: Violation Detection → phase-01-violation-detection.json
    ↓
Phase 02: Component Discovery → phase-02-component-discovery.json
    ↓
Phase 03: Structural Context → phase-03-structural-context.json
    ↓
Phase 04: Route Configuration → phase-04-route-configuration.json
    ↓
Phase 05: Viability Assessment → phase-05-viability-assessment.json
    ↓
Phase 06: URL Generation → phase-06-url-generation.json
    ↓
Migration Execution → contracts/pre-migration.json, post-migration.json, diff.json
    ↓
Code Review → code-review.md (Approve/Request Changes/Reject)
    ↓
Next Component
    ↓
Generate Group Summary → group-summary.md
```

### Workflow Orchestration

**Initialization**:
1. Read `violations-group.json` from spec directory
2. Load action documents from `.kiro/docs/ds-migrations/`:
   - `00-package-discovery-actions.md`
   - `01-component-discovery-and-analysis-actions.md`
   - `02-ds-refactoring-actions.md`
   - `03-migration-code-review-actions.md`
3. Parse unique component TypeScript file paths from violations
4. Derive component metadata (package, library, class name, selector)
5. Generate `data/parsed-components.json` and `tasks.md`

**Package Discovery (Once Per Package)**:
```
Execute Phase 00:
  1. Read package context files from .kiro/steering/packages/{package}/*.md
  2. Extract brand configuration from e2e config-constants.ts (LABELS constant)
  3. Extract language codes from labelBaseUrlMap function
  4. Generate data/{package}-context.json with code proof
  5. Cache for all components in package
```

**Per-Component Analysis Loop (Phases 01-06)**:
```
For each component in queue:
  1. Execute Phase 01 (Violation Detection)
     - Run report_all_violations MCP tool
     - Analyze violation zones (HTML, bindings, data sources)
     - Select DS components
     - Output: data/components/{Component}/phase-01-violation-detection.json
  
  2. Execute Phase 02 (Component Discovery)
     - Search routes, templates, shared libraries
     - Document parent component and access method
     - Output: data/components/{Component}/phase-02-component-discovery.json
  
  3. Execute Phase 03 (Structural Context)
     - Identify conditional wrappers and parent container
     - Output: data/components/{Component}/phase-03-structural-context.json
  
  4. Execute Phase 04 (Route Configuration)
     - Extract route paths, feature flags, guards
     - Output: data/components/{Component}/phase-04-route-configuration.json
  
  5. Execute Phase 05 (Viability Assessment)
     - Boundary detection, cross-zone dependencies
     - Feature mapping, risk assessment
     - Output: data/components/{Component}/phase-05-viability-assessment.json
  
  6. Execute Phase 06 (URL Generation)
     - Generate 3 development URLs with traceability
     - Output: data/components/{Component}/phase-06-url-generation.json
```

**Per-Component Migration Loop**:
```
For each component with completed analysis:
  1. Execute Migration (Phase 07)
     - Generate pre-migration contract
     - Update HTML (replace deprecated with DS components)
     - Update TypeScript (import DS components)
     - Update SCSS (remove legacy, use semantic tokens)
     - Run diagnostics (must be 0 errors)
     - Generate post-migration contract
     - Compare contracts (must be 0 breaking changes)
     - Verify violations resolved (must be 0)
     - Output: contracts/pre-migration.json, post-migration.json, diff.json
  
  2. Execute Code Review (Phase 08)
     - Automated validation (diagnostics, violations)
     - Contract diff review (breaking changes)
     - Risk-based review depth (from phase-05)
     - HTML/TS/SCSS review (bindings, imports, tokens)
     - Success criteria verification (from phase-05)
     - Anti-pattern detection
     - Output: code-review.md (Approve/Request Changes/Reject)
```

**Finalization**:
- Aggregate all component analyses and migrations
- Generate group summary document
- Calculate metrics (violations resolved, DS components used, completion %)

## Components and Interfaces

### 1. Workflow Orchestrator

**Purpose**: Coordinate workflow execution, manage processing queue, aggregate results.

**Key Responsibilities**:
- Parse violation group file
- Load and cache action documents
- Maintain component processing queue
- Execute phases in sequence
- Generate group summary

**Data Structures**:
```typescript
interface ComponentMetadata {
  tsFilePath: string;
  packageName: string;
  libraryName: string;
  className: string;
  selector: string;
  rootPath: string;
}

interface ProcessingQueue {
  components: ComponentMetadata[];
  currentIndex: number;
  packageContextCache: Map<string, PackageContext>;
}

interface ActionDocument {
  phase: string;
  instructions: string; // Raw markdown
}
```

### 2. Phase 00: Package Discovery Executor

**Purpose**: Extract brand configuration and product context once per package following `00-package-discovery-actions.md`.

**Process** (from action document):
1. Read `.kiro/steering/packages/{package}/*.md` for product context
2. Extract brand configuration (priority order):
   - Primary: `packages/{product}/e2e/core/src/constants/config-constants.ts` → `LABELS` constant
   - Secondary: `packages/{product}/e2e/core/playwright.config.ts` → `labelProjectConfig()` calls
   - Fallback: `['sportingbet.com', 'ladbrokes.com', 'coral.co.uk']`
3. Extract language codes from `labelBaseUrlMap` function
4. Extract URL construction parameters (subdomain, product path)
5. Generate `data/{package}-context.json` with code proof (file:line references)
6. Cache for all components in package

**Output Document**: `data/{package}-context.json`

**Output Format** (JSON): `.kiro/templates/ds-migration/data/package-context.template.json`

### 3. Phases 01-06: Component Analysis Executor

**Purpose**: Execute 6-phase per-component analysis following `01-component-discovery-and-analysis-actions.md`.

**Process** (from action document):

**Phase 01 - Violation Detection**:
1. Execute `report_all_violations` MCP tool on component root path
2. Extract HTML snippets with 2-3 lines context
3. Parse bindings: property `[prop]`, event `(event)`, attribute `[attr.x]`, two-way `[(model)]`, text `{{ }}`
4. Identify conditional wrappers: `@if`, `@for`, `@switch`
5. Trace property sources and method behaviors in TypeScript
6. Select single DS component (use `ds_target` from tool)
7. Read component-specific steering file: `.kiro/steering/topics/design-system/components/ds-{component}.md`

**Output**: `data/components/{Component}/phase-01-violation-detection.json`

**Phase 02 - Component Discovery**:
1. Search routes: `grepSearch` for component class name
2. Search templates: `grepSearch` for component selector in `*.html`
3. Search shared libraries
4. Document parent component and access method
5. If not found, mark as "unused" and skip phases 04-06

**Output**: `data/components/{Component}/phase-02-component-discovery.json`

**Phase 03 - Structural Context**:
1. Search for child components in parent templates
2. Identify dialog instantiation: `MatDialog.*ComponentName`
3. Identify dynamic creation: `ViewContainerRef.createComponent`
4. Extract structural directives: `*ngIf`, `*ngFor`, `ng-template`, `@if`, `@for`, `@switch`
5. Analyze parent container: element, classes, background (light/dark), positioning

**Output**: `data/components/{Component}/phase-03-structural-context.json`

**Phase 04 - Route Configuration**:
1. Extract route path with source file and code snippet
2. Search for feature flags and guards
3. Parse dynamic parameters: `:id`, `:param`, `:slug`
4. Generate example values for parameters
5. Check allowAnonymous setting

**Output**: `data/components/{Component}/phase-04-route-configuration.json`

**Phase 05 - Viability Assessment**:
1. Apply boundary detection rules from `ds-migration-boundaries.md`
2. Assess viability (feasible/not feasible), stop if not feasible
3. Detect cross-zone dependencies (shared properties/methods/lifecycle hooks)
4. Map features to DS components, identify gaps and workarounds
5. Apply risk rubric from `ds-migration-risk-assessment.md`
6. Assign risk level (High/Medium/Low) with mitigation strategies
7. Filter constraints to 1-10 essential items
8. Define testable success criteria

**Output**: `data/components/{Component}/phase-05-viability-assessment.json`

**Phase 06 - URL Generation**:
1. Use cached brand configuration from package context
2. Construct URLs: `https://dev.{subdomain}.{brand}/{lang}/{productPath}/{componentPath}`
3. Generate exactly 3 URLs (primary/secondary/tertiary brands)
4. Include full traceability (brandSource, brandConfigSource, urlPatternSource)
5. Document testing guidance (access instructions, feature flags, visual location)

**Output**: `data/components/{Component}/phase-06-url-generation.json`

### 4. Phase 07: Migration Execution Executor

**Purpose**: Execute actual migration with contract-based validation following `02-ds-refactoring-actions.md`.

**Process** (from action document):

**Step 0: Read Analysis Files**:
- Load phase-01, phase-03, phase-05 JSON files
- Extract data: violations, bindings, DS components, structural context, success criteria

**Step 1: Generate Pre-Migration Contract**:
- Use `build_component_contract` MCP tool
- Parameters: typescriptFile, templateFile, styleFile, dsComponentName
- Output: `data/components/{Component}/contracts/pre-migration.json`

**Step 2: Update HTML Template**:
- For each violation in phase-01 `violationZoneAnalysis[]`:
  - Replace deprecated classes with DS components
  - Preserve all bindings (properties, events, attributes, two-way, text)
  - Apply inverse theming if phase-03 `parentContainer.background === "dark"`
  - Wrap conditionals in containers before slot attributes

**Step 3: Update TypeScript**:
- Import DS components from phase-01 `component.dsComponents[]`
- Add to `@Component({ imports: [...] })`
- Import paths: `@frontend/ui/{component}`

**Step 4: Update SCSS**:
- Remove legacy class definitions
- Use semantic tokens only (`--semantic-*`)
- Never style DS component hosts
- Never override DS component internals

**Step 5: Run Diagnostics**:
- Use `getDiagnostics` MCP tool
- Expected: 0 errors, 0 warnings

**Step 6: Generate Post-Migration Contract**:
- Use `build_component_contract` MCP tool
- Output: `data/components/{Component}/contracts/post-migration.json`

**Step 7: Compare Contracts**:
- Use `diff_component_contract` MCP tool
- Expected: 0 breaking changes

**Step 8: Verify Zero Violations**:
- Use `report_all_violations` MCP tool
- Expected: 0 violations

**Step 9: Final Diagnostics Check**:
- Use `getDiagnostics` MCP tool
- Expected: 0 errors, 0 warnings

**Output Documents**: 
- `data/components/{Component}/contracts/pre-migration.json`
- `data/components/{Component}/contracts/post-migration.json`
- `data/components/{Component}/contracts/diff.json`

### 5. Phase 08: Code Review Executor

**Purpose**: Systematic code review using analysis data and contract diffs following `03-migration-code-review-actions.md`.

**Process** (from action document):

**Step 1: Automated Validation**:
- Run `getDiagnostics` (must be 0 errors)
- Run `report_all_violations` (must be 0 violations)

**Step 2: Contract Diff Review**:
- Read `data/components/{Component}/contracts/diff.json`
- Verify 0 breaking changes (no removed inputs/outputs/methods, no changed signatures)

**Step 3: Risk-Based Review Depth**:
- Read phase-05 `riskAssessment.level`
- Apply appropriate thoroughness:
  - High: Deep code review, verify all risk indicators addressed
  - Medium: Standard code review, verify critical constraints
  - Low: Quick code review, focus on anti-patterns only

**Step 4: HTML Template Review**:
- Verify binding preservation (compare with phase-01 `bindings`)
- Verify DS component selection (match phase-01 `dsComponentSelection`)
- Check inverse theming (phase-03 `parentContainer.background`)
- Check conditional wrappers (phase-03 `conditionalWrappers[]`)
- Check no host styling (`[style]`, `[class]`, utilities on DS hosts)

**Step 5: TypeScript Review**:
- Verify DS imports match phase-01 `component.dsComponents[]`
- Verify no logic changes (methods, properties, lifecycle unchanged)
- Verify type safety (no `any`, no `@ts-ignore`)

**Step 6: SCSS Review**:
- Verify legacy CSS removed
- Verify semantic tokens only (`--semantic-*`, no reference tokens)
- Verify no DS overrides (no targeting DS internals)
- Verify layout preservation

**Step 7: Success Criteria Verification**:
- Read phase-05 `successCriteria[]`
- Verify each criterion met through code inspection

**Step 8: Anti-Pattern Detection**:
- Check against `.kiro/steering/topics/design-system/ds-migration-anti-patterns.md`
- Common anti-patterns: host styling, reference tokens, missing inverse, slot on conditional, wrong component

**Step 9: Review Decision**:
- Approve: All criteria met, no anti-patterns, contract clean
- Request Changes: Anti-patterns present or criteria not met
- Reject: Breaking changes or violations present

**Output Document**: `data/components/{Component}/code-review.md`

### 6. Group Summary Generator

**Purpose**: Aggregate all component analyses and migrations into group-level summary.

**Process**:
1. Collect outputs from all components:
   - Violation counts per component (from phase-01)
   - DS components required per component (from phase-01)
   - Risk levels per component (from phase-05)
   - Migration status per component (from code-review)
2. Identify cross-component dependencies:
   - Shared services
   - Shared state
   - Shared utilities
3. Categorize components by risk level (High/Medium/Low) and status (completed/in-progress/blocked)
4. Calculate metrics:
   - Total violations resolved
   - Unique DS components used
   - Migration completion percentage
5. Document lessons learned and recommendations

**Output Document**: `.kiro/specs/{ticket}/group-summary.md`

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Action Document Instruction Following
*For any* phase execution, all steps performed must match the instructions defined in the corresponding action document exactly.
**Validates: Requirements 2.1, 3.1, 9.1, 10.1**

### Property 2: Component Path Uniqueness
*For any* violation group file, extracting component paths must produce a list where each TypeScript file path appears exactly once.
**Validates: Requirements 1.3**

### Property 3: Package Context Caching
*For any* package, brand configuration and product context must be loaded exactly once and reused for all components in that package.
**Validates: Requirements 2.1**

### Property 4: Component Discovery Hierarchy
*For any* component, location discovery must follow the search hierarchy (routes → templates → shared libraries) and stop at first match.
**Validates: Requirements 4.2**

### Property 5: Unused Component Handling
*For any* component not found in routes, templates, or shared libraries, phases 04-06 must be skipped and the component marked as "unused".
**Validates: Requirements 4.4**

### Property 6: URL Generation Brand Count
*For any* component with route paths, exactly 3 development URLs must be generated (one per primary/secondary/tertiary brand).
**Validates: Requirements 8.3**

### Property 7: Violation Detection Tool Primacy
*For any* component, violation detection must execute the `report_all_violations` MCP tool before reading any markdown files, and all violations in analysis must match tool output exactly.
**Validates: Requirements 3.2**

### Property 8: DS Component Selection Uniqueness
*For any* violation, exactly ONE Design System component must be selected without documenting alternatives or comparisons.
**Validates: Requirements 3.5**

### Property 9: Cross-Zone Dependency Evaluation
*For any* component with multiple violation zones, cross-zone dependency detection must evaluate whether properties or methods affect 2 or more zones.
**Validates: Requirements 7.3**

### Property 10: Viability Assessment Blocking
*For any* component assessed as "not feasible" for migration, further analysis must stop and blocking issues must be documented.
**Validates: Requirements 7.2**

### Property 11: Contract Validation Zero Tolerance
*For any* migration execution, the contract diff must show 0 breaking changes (no removed inputs/outputs/methods, no changed signatures).
**Validates: Requirements 9.6**

### Property 12: Violation Resolution Zero Tolerance
*For any* completed migration, the `report_all_violations` tool must return 0 violations.
**Validates: Requirements 9.7**

### Property 13: Code Review Decision Criteria
*For any* code review, the decision (Approve/Request Changes/Reject) must be based on automated validation results, contract diff, and anti-pattern detection.
**Validates: Requirements 10.10**

### Property 14: Group Summary Aggregation
*For any* completed workflow, the group summary must aggregate violation counts, DS component targets, risk levels, and migration status across all components.
**Validates: Requirements 11.1**

## Error Handling

### Initialization Errors
- **Violation group file not found**: Stop workflow, report error with expected path
- **Action documents missing**: Stop workflow, report missing action document paths
- **Component path parsing fails**: Skip component, log error, continue with remaining components

### Phase 00 Errors
- **Package context discovery fails**: Continue with default brands (sportingbet.com, ladbrokes.com, coral.co.uk) and default language (en)
- **LABELS constant not found**: Try playwright.config.ts, then use fallback
- **Language codes not found**: Use default `en` for all brands

### Phases 01-06 Errors
- **MCP tool fails**: Stop phase for this component, report error
- **Component not found (Phase 02)**: Mark as "unused", skip phases 04-06, continue to Phase 05
- **HTML extraction fails**: Continue with warning, use line number only
- **TypeScript read fails**: Continue with warning, document bindings without sources
- **Boundary violations block migration (Phase 05)**: Mark as "not feasible", document blocking issues, stop migration execution

### Phase 07 Errors (Migration)
- **Pre-migration contract generation fails**: Stop migration for this component, report error
- **Diagnostics errors after changes**: Fix errors, re-run diagnostics until clean
- **Contract diff shows breaking changes**: Restore removed API elements, re-generate post-contract
- **Violations still present**: Fix remaining violations, re-run tool until 0 violations

### Phase 08 Errors (Code Review)
- **Automated validation fails**: Immediate rejection, request fix
- **Breaking changes in contract diff**: Immediate rejection, request fix
- **Anti-patterns detected**: Request changes with specific examples

### Group Summary Errors
- **No component analyses completed**: Generate empty summary with error message
- **Aggregation calculation fails**: Report error, generate partial summary with available data

## Testing Strategy

### Unit Testing Approach

**Component Metadata Parsing**:
- Test selector extraction from @Component decorator
- Test class name extraction from export statement
- Test file path derivation (TypeScript → HTML, SCSS)
- Test package/library name extraction from paths

**Brand Configuration Extraction**:
- Test LABELS constant parsing from config-constants.ts
- Test labelProjectConfig parsing from playwright.config.ts
- Test fallback to default brands
- Test language code extraction from labelBaseUrlMap

**URL Construction**:
- Test subdomain selection logic
- Test product path mapping
- Test language code selection
- Test parameter resolution

**Violation Data Parsing**:
- Test MCP tool output parsing
- Test HTML snippet extraction with context
- Test binding categorization (property, event, attribute, two-way, text)
- Test conditional wrapper identification

**Contract Comparison**:
- Test breaking change detection (removed inputs/outputs/methods)
- Test signature change detection
- Test acceptable change identification (added inputs/outputs)

**Risk Assessment**:
- Test risk rubric application
- Test risk level assignment (High/Medium/Low)
- Test mitigation strategy generation

### Integration Testing

**End-to-End Workflow Test**:
1. Create test violation group file with 3 components
2. Create test action documents
3. Execute full workflow (package discovery → analysis → migration → review)
4. Verify:
   - Package context generated once
   - All 6 phase files generated per component
   - Migrations executed with contract validation
   - Code reviews completed with decisions
   - Group summary generated
   - All documents follow specified formats

**Package Context Caching Test**:
1. Create test violation group with 5 components from same package
2. Execute workflow
3. Verify package context loaded exactly once (mock/spy on file reads)

**Contract Validation Test**:
1. Create test component with known API
2. Execute migration that removes an input
3. Verify contract diff detects breaking change
4. Verify migration rejected

**Error Handling Test**:
1. Create test scenarios for each error condition
2. Execute workflow
3. Verify appropriate error handling (stop/continue/fallback)

## Design Decisions and Rationales

### Decision 1: Action Documents as Source of Truth
**Rationale**: Makes the workflow adaptable without code changes. Analysis and migration procedures can be updated by editing markdown files, not code. Enables non-developers to refine workflow steps.

### Decision 2: Per-Component Sequential Processing
**Rationale**: Simplifies state management and error handling. Each component is fully analyzed and migrated before moving to the next. Failures in one component don't affect others.

### Decision 3: Package-Level Context Caching
**Rationale**: Reduces redundant file reads and parsing. Brand configuration is identical for all components in a package. Improves performance for large violation groups.

### Decision 4: 6-Phase Component Analysis
**Rationale**: Separates concerns and enables incremental analysis. Each phase has clear inputs/outputs. Phases can be executed independently for debugging. Matches natural analysis workflow (violations → usage → structure → routes → viability → testing).

### Decision 5: Contract-Based Validation
**Rationale**: Ensures zero breaking changes through automated comparison. Prevents regressions by detecting removed/changed API elements. Provides objective validation criteria for code review.

### Decision 6: MCP Tool as Primary Violation Source
**Rationale**: Ensures consistency with automated violation detection. Prevents manual additions that may not match tool criteria. Validates that analysis scope matches tool output exactly.

### Decision 7: Single DS Component Selection
**Rationale**: Forces decisive component selection. Prevents analysis paralysis from documenting multiple options. Aligns with migration workflow requirement for single component selection.

### Decision 8: Risk-Based Review Depth
**Rationale**: Optimizes review effort based on migration complexity. High-risk migrations get deep review, low-risk get quick review. Improves efficiency without compromising quality.

### Decision 9: Viability Assessment as Gate
**Rationale**: Prevents wasted effort on infeasible migrations. Identifies blocking issues early. Allows focus on viable migrations first.

### Decision 10: Integrated Migration Execution
**Rationale**: Combines analysis and execution in single workflow. Ensures analysis data is used during migration. Validates migrations immediately after execution. Reduces context switching between analysis and implementation.

## Performance Considerations

### File I/O Optimization
- Cache package context per package (not per component)
- Cache action documents at initialization (not per phase)
- Batch file reads where possible (e.g., read all steering files at once)

### Search Optimization
- Use `grepSearch` with specific patterns to reduce search space
- Use `includePattern` to limit search to relevant file types
- Stop searches at first match in hierarchy (routes → templates → shared)

### Memory Management
- Process components sequentially (not all at once)
- Clear component-specific data after generating output document
- Retain only aggregated data for group summary

### Parallelization Opportunities
- Components can be analyzed in parallel (no shared state except package context)
- Phases 01-03 can run in parallel (independent data sources)
- Violation zone analysis can be parallelized (independent violations)

**Note**: Initial implementation should be sequential for simplicity. Parallelization can be added later if performance becomes an issue.

## Constraints and Limitations

### Workflow Constraints
- This workflow includes both analysis AND migration execution
- Produces analysis artifacts AND modified code files
- Requires manual review and approval via code review phase
- Does not automate code review decision (human judgment required)

### Input Constraints
- Violation group file must exist and be parsable
- Action documents must exist and follow expected format
- Component TypeScript files must be accessible
- MCP violation detection tool must be available
- MCP contract tools must be available

### Output Constraints
- Per-component analysis documents: JSON format with comprehensive structure
- Constraints list: 1-10 essential items
- Development URLs: Exactly 3 per component
- DS component selection: Exactly ONE per violation
- Contract diff: Must show 0 breaking changes
- Violations: Must be 0 after migration

### Scope Constraints
- Only analyzes violations identified by MCP tool
- Does not detect violations manually
- Validates migration implementation via contracts and diagnostics
- Does not test migrated components in browser (manual testing required)

### Technical Constraints
- Requires access to file system for reading and writing source files
- Requires MCP tool integration for violation detection and contract generation
- Requires grep/search capabilities for component discovery
- Requires markdown parsing for action documents

## Future Enhancements

### Potential Improvements
1. **Parallel Component Processing**: Analyze and migrate multiple components simultaneously
2. **Incremental Analysis**: Re-analyze only changed components
3. **Interactive Mode**: Allow user to review and adjust analysis/migration during execution
4. **Automated Browser Testing**: Generate and run browser tests from analysis documents
5. **Migration Estimation**: Calculate effort estimates based on risk and complexity
6. **Dependency Graph Visualization**: Generate visual representation of cross-component dependencies
7. **Historical Analysis**: Track analysis results over time to measure migration progress
8. **Custom Action Documents**: Allow users to define custom workflow phases
9. **Template Customization**: Allow users to customize output document templates
10. **Integration with Jira**: Automatically create migration tickets from analysis documents

### Non-Goals
- Fully automated migrations without human review (code review phase required)
- Real-time analysis (batch processing)
- Browser-based testing (manual testing required)
- Performance profiling (analysis only)
