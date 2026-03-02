# Pre-Migration Analysis & Component Discovery Actions Catalog

## Critical Rule: Code Proof Required

**Every statement MUST include code proof with file reference:**
```
Statement: {extracted_value}
Source: {file_path}:{line_number}
Code: `{actual_code_snippet}`
```

**Rules**: Violation patterns, component locations, route paths, parent components, and structural directives MUST cite exact file:line. If not found, state: "Not found in codebase (searched: {patterns})"

---

## Phase 01 - Violation Detection & Analysis

**Template**: `.kiro/templates/ds-migration/data/phase-01-violation-detection.template.json`
**Schema**: `.kiro/templates/ds-migration/data/schemas/phase-01-violation-detection.schema.json`
**Output**: `.kiro/specs/{ticket}/data/{component}/phase-01-violation-detection.json`

**Steering Files**: 
- #[[file:.kiro/steering/topics/design-system/component-selection.md]]

**CRITICAL - Package Context**: You MUST identify and read the package-specific context file before starting analysis. The file path follows the pattern `.kiro/steering/packages/{package_name}/{package_name}-context.md` where `{package_name}` is extracted from the input data (e.g., `bingo-context.md`, `casino-context.md`, `sports-context.md`). This file contains essential package architecture, routing patterns, and product-specific conventions.

**CRITICAL - Component Steering**: You MUST identify and read the component-specific steering file for each DS component selected during violation analysis. The file path follows the pattern `.kiro/steering/topics/design-system/components/ds-{component}.md` where `{component}` is the DS component name (e.g., `ds-button.md`, `ds-modal.md`, `ds-badge.md`). This file contains essential API details, usage patterns, and migration guidance specific to that component.

**Process**:
1. **Load Template**: Read `phase-01-violation-detection.template.json`
2. **Run MCP Tool**: Execute `report_all_violations` on `component_root_path` (BEFORE reading markdown)
3. **Parse Results**: Extract violation locations, deprecated patterns, DS targets
4. **Per-Violation Analysis**:
   - Extract HTML snippet with 2-3 lines context
   - Parse bindings: `[property]`, `(event)`, `[attr.x]`, `[(ngModel)]`, `{{ text }}`
   - Identify conditionals: `@if`, `@for`, `@switch` wrappers
   - Analyze parent context: container, background (light/dark), layout type
   - Trace property sources and method behaviors (user-visible only)
   - Select single DS component (use `ds_target` from tool)
5. **Populate Template**: Fill all fields in template with extracted data
6. **Write Output**: Save to `.kiro/specs/{ticket}/data/{component}/phase-01-violation-detection.json`
7. **REQUIRED - Validate Schema**: Execute `node .kiro/scripts/ds-migration/analysis/validate-json-schema.mjs phase-01-violation-detection .kiro/specs/{ticket}/data/{component}/phase-01-violation-detection.json`
   - **STOP if validation fails** - Fix errors before proceeding to next phase

**Template Fields**:
- `component`: name, selector, package, library, root, dsComponents[]
- `violationsFound`: source, executedOn, totalViolations, violations[]
- `violationZoneAnalysis[]`: Per violation:
  - `violationId`: Unique identifier (V1, V2, etc.)
  - `location.file`: Full file path
  - `htmlSnippet.code`: HTML with context, `htmlSnippet.context`: Description
  - `bindings`: Categorized (properties, events, attributes, twoWay, textInterpolation)
  - `conditionalWrappers[]`: Directive, expression, description, source
  - `parentContext`: Container, background, layout, positioning
  - `dataSources`: Property → type, source, location, code, description
  - `methodBehavior`: Method → location, userVisibleBehavior[], implementation
  - `dsComponentSelection`: selectedComponent, rationale, userVisibleBehavior[], semanticCorrection
- `metadata`: analysisDate, analysisPhase, steeringFilesReferenced[], toolsExecuted[], filesAnalyzed[]

**Error Handling**: Stop if no violations found or tool fails. Continue with warnings for HTML/TypeScript read failures.

---

## Phase 02 - Component Location Discovery

**Template**: `.kiro/templates/ds-migration/data/phase-02-component-discovery.template.json`
**Schema**: `.kiro/templates/ds-migration/data/schemas/phase-02-component-discovery.schema.json`
**Output**: `.kiro/specs/{ticket}/data/{component}/phase-02-component-discovery.json`

**Process**: 
1. **Load Template**: Read `phase-02-component-discovery.template.json`
2. **Search Hierarchy**: Use `grepSearch` in order (routes → templates → shared):
   - **Routes**: `packages/{product}/entrypoint-lib/src/lib/{product}-internal.routes.ts`
   - **Templates**: `packages/{product}/**/*.html`
   - **Shared**: `packages/*/shared/`, `packages/design-system/`
3. **Document Searches**: Record all search attempts with queries and results
4. **Trace Component Chain**: Build full hierarchy from root to target component
5. **Populate Template**: Fill all fields with discovered data
6. **Write Output**: Save to `.kiro/specs/{ticket}/data/{component}/phase-02-component-discovery.json`
7. **REQUIRED - Validate Schema**: Execute `node .kiro/scripts/ds-migration/analysis/validate-json-schema.mjs phase-02-component-discovery .kiro/specs/{ticket}/data/{component}/phase-02-component-discovery.json`
   - **STOP if validation fails** - Fix errors before proceeding to next phase

**Template Fields**: 
- `component`: name, selector, package, library
- `discovery.componentLocation`: "route" | "template" | "shared" | "dialog" | "dynamic" | "unused"
- `discovery.searchAttempts`: Document all search queries and results
- `discovery.parentComponent`: Name, selector, source, code snippet
- `discovery.accessMethod`: "template" | "dialog" | "dynamic" | "route"
- `discovery.componentChain`: Full hierarchy from root to target component
- `metadata`: analysisDate, analysisPhase, toolsExecuted[], filesAnalyzed[]

**Error Handling**: If not found, mark as "unused" in componentLocation and skip phases 04-06

---

## Phase 03 - Component Relationship Discovery

**Template**: `.kiro/templates/ds-migration/data/phase-03-structural-context.template.json`
**Schema**: `.kiro/templates/ds-migration/data/schemas/phase-03-structural-context.schema.json`
**Output**: `.kiro/specs/{ticket}/data/{component}/phase-03-structural-context.json`

**Process**: 
1. **Load Template**: Read `phase-03-structural-context.template.json`
2. **Search Relationships**: Use `grepSearch` for:
   - **Template usage**: Component names in templates
   - **Dialog usage**: `MatDialog.*Component` patterns
   - **Dynamic creation**: `viewContainerRef.createComponent`
3. **Extract Structural Context**: Identify `@if`, `@for`, `@switch`, `*ngIf`, `*ngFor`, `ng-template` wrappers
4. **Analyze Parent Container**: Extract element type, classes, positioning
5. **Populate Template**: Fill all fields with relationship data
6. **Write Output**: Save to `.kiro/specs/{ticket}/data/{component}/phase-03-structural-context.json`
7. **REQUIRED - Validate Schema**: Execute `node .kiro/scripts/ds-migration/analysis/validate-json-schema.mjs phase-03-structural-context .kiro/specs/{ticket}/data/{component}/phase-03-structural-context.json`
   - **STOP if validation fails** - Fix errors before proceeding to next phase

**Template Fields**: 
- `component`: name, selector, package, library
- `structuralContext.conditionalWrappers[]`: directive, expression, source, code, note
- `structuralContext.parentContainer`: element, classes[], source, code
- `metadata`: analysisDate, analysisPhase, toolsExecuted[], filesAnalyzed[]

**Note**: Positioning and layout context is critical for migration planning

---

## Phase 04 - Route & Access Configuration

**Template**: `.kiro/templates/ds-migration/data/phase-04-route-configuration.template.json`
**Schema**: `.kiro/templates/ds-migration/data/schemas/phase-04-route-configuration.schema.json`
**Output**: `.kiro/specs/{ticket}/data/{component}/phase-04-route-configuration.json`

**Process**:
1. **Load Template**: Read `phase-04-route-configuration.template.json`
2. **Extract Route Path**: Find route config with source and code
3. **Search Feature Flags**: Use `grepSearch` for guard names and feature checks
4. **Find Route Parameters**: Use `grepSearch` for `:[a-zA-Z]+` patterns, generate example values
5. **Check Anonymous Access**: Look for `allowAnonymous` in route data
6. **Populate Template**: Fill all fields with route configuration data
7. **Write Output**: Save to `.kiro/specs/{ticket}/data/{component}/phase-04-route-configuration.json`
8. **REQUIRED - Validate Schema**: Execute `node .kiro/scripts/ds-migration/analysis/validate-json-schema.mjs phase-04-route-configuration .kiro/specs/{ticket}/data/{component}/phase-04-route-configuration.json`
   - **STOP if validation fails** - Fix errors before proceeding to next phase

**Template Fields**: 
- `component`: name, selector, package, library
- `routeConfiguration.routePath`: Full path with culture placeholder
- `routeConfiguration.routeSource`: File path with line numbers
- `routeConfiguration.routeCode`: Actual route configuration code
- `routeConfiguration.featureFlags[]`: flag, source, code, description
- `routeConfiguration.guards[]`: name, source, code
- `routeConfiguration.dynamicParams[]`: param, example, description
- `routeConfiguration.allowAnonymous`: boolean
- `routeConfiguration.allowAnonymousSource`: File path with line numbers
- `routeConfiguration.allowAnonymousCode`: Actual code snippet
- `metadata`: analysisDate, analysisPhase, toolsExecuted[], filesAnalyzed[]

---

## Phase 05 - Viability, Gap Analysis & Risk Assessment

**Template**: `.kiro/templates/ds-migration/data/phase-05-viability-assessment.template.json`
**Schema**: `.kiro/templates/ds-migration/data/schemas/phase-05-viability-assessment.schema.json`
**Output**: `.kiro/specs/{ticket}/data/{component}/phase-05-viability-assessment.json`

**Steering Files**: 
- #[[file:.kiro/steering/topics/design-system/ds-migration-boundaries.md]]
- #[[file:.kiro/steering/topics/design-system/ds-migration-risk-assessment.md]]
- #[[file:.kiro/steering/topics/design-system/ds-migration-anti-patterns.md]]

**CRITICAL**: You MUST read the component-specific steering file for each DS component identified in Phase 01. The file path is `.kiro/steering/topics/design-system/components/ds-{component}.md` where `{component}` matches the selected DS component (e.g., `ds-button.md` for DsButton). This file is required for accurate feature mapping and gap analysis.

**Process**:
1. **Load Template**: Read `phase-05-viability-assessment.template.json`
2. **Boundary Detection**: Check component against DS boundary rules, assess viability (stop if not feasible)
3. **Cross-Zone Dependencies**: If multiple violations, identify shared properties/methods/lifecycle hooks
4. **Feature Mapping**: Map violation requirements to DS features, document gaps and workarounds
5. **Risk Assessment**: Apply rubric (High/Medium/Low), generate mitigation strategies
6. **Constraint Filtering**: Apply essentiality criteria, output 1-10 essential constraints
7. **Success Criteria**: Define testable verification points
8. **Architecture Summary**: Document component role, integration points, migration approach
9. **Populate Template**: Fill all fields with assessment data
10. **Write Output**: Save to `.kiro/specs/{ticket}/data/{component}/phase-05-viability-assessment.json`
11. **REQUIRED - Validate Schema**: Execute `node .kiro/scripts/ds-migration/analysis/validate-json-schema.mjs phase-05-viability-assessment .kiro/specs/{ticket}/data/{component}/phase-05-viability-assessment.json`
    - **STOP if validation fails** - Fix errors before proceeding to next phase

**Template Fields**:
- `component`: name, selector, package, library
- `sharedContext`: crossZoneDependencies, sharedProperties[], sharedMethods[], lifecycleHooks[], reasoning
- `viabilityAssessment`: feasible, boundaryViolations[], architecturalFitIndicators{}, decision, reasoning
- `featureMapping`: requiredDsFeatures[], gaps[], workarounds[], reasoning
- `riskAssessment`: level, justification, riskIndicators{}, mitigationStrategies[], testingRequirements{}
- `criticalConstraints[]`: id, constraint, category, impact, validation (1-10 items max)
- `successCriteria[]`: id, criterion, testable, validationMethod
- `architectureSummary`: componentRole, integrationPoints[], migrationApproach, preservedBehavior[]
- `metadata`: analysisDate, analysisPhase, steeringFilesReferenced[], filesAnalyzed[]

---

## Phase 06 - URL Generation & Documentation

**Template**: `.kiro/templates/ds-migration/data/phase-06-url-generation.template.json`
**Schema**: `.kiro/templates/ds-migration/data/schemas/phase-06-url-generation.schema.json`
**Output**: `.kiro/specs/{ticket}/data/{component}/phase-06-url-generation.json`

**URL Format**: `https://dev.{subdomain}.{brand}/{lang}/{productPath}/{componentPath}`
- **Subdomain**: `www` (default), `casino` for specific brands
- **Product Paths**: Casino=`games`/`casino`/`slots`, Bingo=`bingo`, Sports=`sports`, Promo=`promotions`
- **Languages**: Brand-specific defaults (en, es, pt-br, de, it, el, da, pt, en-ca)

**Process**:
1. **Load Template**: Read `phase-06-url-generation.template.json`
2. **Read Package Context**: Load brand configurations from package context file
3. **Extract E2E Config**: Find brand constants and URL patterns in e2e config
4. **Generate URLs**: Create 3 URLs (primary/secondary/tertiary brands) with full traceability
5. **Create Testing Guidance**: Document access instructions, feature flags, visual location
6. **Populate Template**: Fill all fields with URL and testing data
7. **Write Output**: Save to `.kiro/specs/{ticket}/data/{component}/phase-06-url-generation.json`
8. **REQUIRED - Validate Schema**: Execute `node .kiro/scripts/ds-migration/analysis/validate-json-schema.mjs phase-06-url-generation .kiro/specs/{ticket}/data/{component}/phase-06-url-generation.json`
   - **STOP if validation fails** - Fix errors before proceeding to next phase

**Template Fields**: 
- `component`: name, selector, package, library
- `developmentUrls[]`: Array of 3 URLs with:
  - `url`, `brand`, `language`, `subdomain`, `productPath`, `componentPath`
  - `brandSource`: Reference to context file
  - `brandConfigSource`, `brandConfigCode`: E2E config reference
  - `urlPatternSource`, `urlPatternCode`: URL construction pattern
  - `note`: Purpose of this URL (primary/secondary/tertiary)
- `testingGuidance.accessInstructions[]`: Step-by-step access guide
- `testingGuidance.featureFlagRequirements[]`: Required flags
- `testingGuidance.visualLocation`: Where component appears on page
- `metadata`: analysisDate, analysisPhase, steeringFilesReferenced[], filesAnalyzed[]

---

## Phase 07 - Final Document Assembly (Optional)

**Template**: `.kiro/templates/ds-migration/data/component-combined-analysis.template.json`
**Schema**: `.kiro/templates/ds-migration/data/schemas/component-combined-analysis.schema.json`
**Output**: `.kiro/specs/{ticket}/data/{component}/{component}-combined-analysis.json`

**Note**: This phase is optional. The phase-specific JSON files (01-06) are the primary outputs. This combined document is only needed for legacy compatibility or human-readable summaries.

**Process**:
1. **Load All Phase Outputs**: Read JSON files from phases 01-06
2. **Load Combined Template**: Read `component-combined-analysis.template.json`
3. **Merge Data**: Combine all phase outputs into single document:
   - Phase 01 → `violationsFound`, `violationZoneAnalysis`
   - Phase 02 → `discovery`
   - Phase 03 → `structuralContext`
   - Phase 04 → `routeConfiguration`
   - Phase 05 → `sharedContext`, `viabilityAssessment`, `featureMapping`, `riskAssessment`, `criticalConstraints`, `successCriteria`, `architectureSummary`
   - Phase 06 → `developmentUrls`, `testingGuidance`
4. **Add Metadata**: Aggregate all steering files, tools, and files from phase metadata
5. **Populate Template**: Fill combined template with merged data
6. **Validate Completeness**: 
   - Each violation has HTML context, categorized bindings, parent context, data sources
   - Single DS target per violation (no alternatives)
   - Essential constraints (1-10 items)
   - Testable success criteria
7. **Write Output**: Save to `.kiro/specs/{ticket}/data/{component}/{component}-combined-analysis.json`
8. **REQUIRED - Validate Schema**: Execute `node .kiro/scripts/ds-migration/analysis/validate-json-schema.mjs component-combined-analysis .kiro/specs/{ticket}/data/{component}/{component}-combined-analysis.json`
   - **STOP if validation fails** - Fix errors before proceeding

**Output**: Single combined analysis JSON document with full traceability

**Critical Validation**: Only ONE DS component per violation, no alternatives mentioned

## Validation Checklist

**Phase-Specific Validation**: Each phase has its own JSON schema validation. Run schema validation after completing each phase.

**Before proceeding to migration requirements generation**:
**Phase 01 - Violation Detection**:
- [ ] `phase-01-violation-detection.json` created and schema-validated
- [ ] MCP violation tool executed and results documented
- [ ] Each violation has HTML snippet with context
- [ ] Bindings categorized for each violation element
- [ ] Data sources traced for violation element bindings only
- [ ] Single DS component selected per violation (no alternatives)
- [ ] Component-specific steering file read for each DS component

**Phase 02 - Component Discovery**:
- [ ] `phase-02-component-discovery.json` created and schema-validated
- [ ] Component location documented with file reference
- [ ] Search attempts documented (routes, templates, shared)
- [ ] Parent component identified with source and code
- [ ] Component chain traced from root to target

**Phase 03 - Structural Context**:
- [ ] `phase-03-structural-context.json` created and schema-validated
- [ ] Conditional wrappers documented with code snippets
- [ ] Parent container analyzed with classes and positioning

**Phase 04 - Route Configuration**:
- [ ] `phase-04-route-configuration.json` created and schema-validated
- [ ] Route paths documented with file reference
- [ ] Feature flags identified with source and code
- [ ] Guards and dynamic params documented

**Phase 05 - Viability Assessment**:
- [ ] `phase-05-viability-assessment.json` created and schema-validated
- [ ] Viability assessment completed with decision
- [ ] Feature mapping completed with gaps/workarounds
- [ ] Risk assessment completed with justification
- [ ] Essential constraints filtered (1-10 items)
- [ ] Success criteria defined and validated as testable
- [ ] Architecture summary documented

**Phase 06 - URL Generation**:
- [ ] `phase-06-url-generation.json` created and schema-validated
- [ ] Development URLs generated (3 brands minimum)
- [ ] URLs reference package context and E2E config
- [ ] Testing guidance documented with access instructions

**Code Proof Validation** (All Phases):
- [ ] Every extracted value has code proof (file:line + code snippet)
- [ ] Component location cites exact file and line number
- [ ] Route definitions include actual code snippets
- [ ] Parent component references include file locations
- [ ] Structural directives include surrounding context (2-3 lines)
- [ ] Violation patterns cite MCP tool results with file:line
- [ ] All grepSearch queries documented for traceability
- [ ] HTML snippets include context lines with line numbers
- [ ] Property/method sources traced to TypeScript definitions
- [ ] No inferred or assumed values without code proof