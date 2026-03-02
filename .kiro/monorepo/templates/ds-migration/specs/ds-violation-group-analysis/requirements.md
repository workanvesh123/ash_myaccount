# Requirements Document

## Introduction

This specification defines a systematic workflow for analyzing and migrating Design System (DS) violations within a violation group file. A violation group file (`violations-group.json`) contains multiple components with deprecated CSS/HTML patterns that require migration to Design System components. The workflow parses the group file, extracts unique component paths, and executes a multi-phase process following action documents in `.kiro/docs/ds-migrations/`: Package Discovery (00) → 6-Phase Component Analysis (01) → Migration Execution (02) → Code Review (03). The output includes both analysis documentation AND executed migrations with validation.

## Glossary

- **Violation Group File**: The `violations-group.json` file in the spec directory containing deprecated CSS/HTML patterns identified by the MCP violation detection tool
- **Action Documents**: Markdown files in `.kiro/docs/ds-migrations/` that define step-by-step procedures for each workflow phase
- **Package Discovery**: One-time extraction of brand configuration and product context for URL generation, defined in `00-package-discovery-actions.md`
- **6-Phase Component Analysis**: Per-component analysis workflow (phases 01-06) covering violation detection, component discovery, structural context, route configuration, viability assessment, and URL generation, defined in `01-component-discovery-and-analysis-actions.md`
- **Migration Execution**: Actual code changes to replace deprecated patterns with DS components, with contract-based validation, defined in `02-ds-refactoring-actions.md`
- **Code Review**: Systematic review process using analysis data and contract diffs to verify zero regressions, defined in `03-migration-code-review-actions.md`
- **Violation Zone**: A specific location in code (file, line number) where a deprecated pattern exists and requires replacement
- **DS Target**: The Design System component recommended to replace a deprecated pattern
- **Cross-Zone Dependencies**: Shared state, methods, or lifecycle hooks that affect multiple violation zones within a component
- **Contract**: JSON snapshot of component's public API (inputs, outputs, methods, template structure) used to detect breaking changes

## Requirements

### Requirement 1: Workflow Initialization and Data Extraction

**User Story:** As a migration engineer, I want to initialize the workflow by parsing the violation group file and extracting component metadata, so that I have a structured list of components to analyze and migrate.

#### Acceptance Criteria

1. WHEN starting the workflow THEN the system SHALL read the `violations-group.json` file from the spec directory and parse all violation entries
2. WHEN loading action documents THEN the system SHALL read all instruction files from `.kiro/docs/ds-migrations/` (00-package-discovery-actions.md, 01-component-discovery-and-analysis-actions.md, 02-ds-refactoring-actions.md, 03-migration-code-review-actions.md)
3. WHEN parsing violations THEN the system SHALL extract unique component TypeScript file paths from violation data
4. WHEN component file paths are extracted THEN the system SHALL derive package name, library name, component class name, and component selector from each path using pattern matching
5. WHEN extraction is complete THEN the system SHALL generate `data/parsed-components.json` and `tasks.md` with component list and task breakdown

### Requirement 2: Package Context Discovery

**User Story:** As a migration engineer, I want to establish package-level context and brand configurations once per product, so that I can generate accurate development URLs for all components in that package.

#### Acceptance Criteria

1. WHEN beginning package discovery THEN the system SHALL follow instructions from `.kiro/docs/ds-migrations/00-package-discovery-actions.md`
2. WHEN extracting brand configuration THEN the system SHALL identify 1-3 primary brands using priority order: e2e config-constants.ts LABELS constant, then playwright.config.ts labelProjectConfig calls, then default fallback brands
3. WHEN brand configuration is extracted THEN the system SHALL detect default language codes for each brand from the labelBaseUrlMap function
4. WHEN extracting URL construction parameters THEN the system SHALL identify URL patterns, culture codes, and authentication requirements for each brand
5. WHEN package context discovery completes THEN the system SHALL generate `data/{package}-context.json` with brand configurations and code proof (file:line references)

### Requirement 3: Phase 01 - Violation Detection and Analysis

**User Story:** As a migration engineer, I want to detect violations using the MCP tool and analyze each violation zone, so that I understand what needs to be replaced and how data flows through the component.

#### Acceptance Criteria

1. WHEN executing Phase 01 THEN the system SHALL follow instructions from `.kiro/docs/ds-migrations/01-component-discovery-and-analysis-actions.md`
2. WHEN starting violation detection THEN the system SHALL execute the `report_all_violations` MCP tool on component root path BEFORE reading any markdown files
3. WHEN violations are detected THEN the system SHALL extract HTML snippets with 2-3 lines context, parse bindings (property, event, attribute, two-way, text interpolation), and identify conditional wrappers
4. WHEN analyzing violations THEN the system SHALL trace property sources and method behaviors (user-visible only) in the component TypeScript file
5. WHEN selecting DS components THEN the system SHALL select exactly ONE DS component per violation using the `ds_target` from MCP tool, and read the component-specific steering file `.kiro/steering/topics/design-system/components/ds-{component}.md`
6. WHEN Phase 01 completes THEN the system SHALL generate `data/components/{ComponentName}/phase-01-violation-detection.json` following the template schema

### Requirement 4: Phase 02 - Component Location Discovery

**User Story:** As a migration engineer, I want to discover where components are used in the codebase, so that I can understand their context and access patterns.

#### Acceptance Criteria

1. WHEN executing Phase 02 THEN the system SHALL follow instructions from `.kiro/docs/ds-migrations/01-component-discovery-and-analysis-actions.md`
2. WHEN searching for component usage THEN the system SHALL use `grepSearch` in hierarchy order: routes → templates → shared libraries
3. WHEN component is found THEN the system SHALL document search attempts, parent component, access method, and full component chain
4. WHEN component is NOT found THEN the system SHALL mark as "unused" and skip phases 04-06
5. WHEN Phase 02 completes THEN the system SHALL generate `data/components/{ComponentName}/phase-02-component-discovery.json` following the template schema

### Requirement 5: Phase 03 - Component Relationship Discovery

**User Story:** As a migration engineer, I want to understand component relationships and structural context, so that I can preserve layout and positioning during migration.

#### Acceptance Criteria

1. WHEN executing Phase 03 THEN the system SHALL follow instructions from `.kiro/docs/ds-migrations/01-component-discovery-and-analysis-actions.md`
2. WHEN analyzing relationships THEN the system SHALL search for child components, dialog instantiation (MatDialog), and dynamic creation (ViewContainerRef)
3. WHEN extracting structural context THEN the system SHALL identify conditional wrappers (@if, @for, @switch, *ngIf, *ngFor, ng-template)
4. WHEN analyzing parent container THEN the system SHALL extract element type, classes, and positioning context
5. WHEN Phase 03 completes THEN the system SHALL generate `data/components/{ComponentName}/phase-03-structural-context.json` following the template schema

### Requirement 6: Phase 04 - Route and Access Configuration

**User Story:** As a migration engineer, I want to extract route configuration details and access requirements, so that I can generate complete URLs with proper parameters for testing.

#### Acceptance Criteria

1. WHEN executing Phase 04 THEN the system SHALL follow instructions from `.kiro/docs/ds-migrations/01-component-discovery-and-analysis-actions.md`
2. WHEN extracting route configuration THEN the system SHALL find route path with source file and code snippet
3. WHEN analyzing access requirements THEN the system SHALL search for feature flags, guards, and allowAnonymous settings
4. WHEN parsing route parameters THEN the system SHALL identify dynamic parameters (:id, :param, :slug) and generate example values
5. WHEN Phase 04 completes THEN the system SHALL generate `data/components/{ComponentName}/phase-04-route-configuration.json` following the template schema

### Requirement 7: Phase 05 - Viability, Gap Analysis, and Risk Assessment

**User Story:** As a migration engineer, I want to assess migration viability, identify feature gaps, and calculate risk level, so that I can plan migrations safely with appropriate safeguards.

#### Acceptance Criteria

1. WHEN executing Phase 05 THEN the system SHALL follow instructions from `.kiro/docs/ds-migrations/01-component-discovery-and-analysis-actions.md`
2. WHEN performing boundary detection THEN the system SHALL apply rules from `.kiro/steering/topics/design-system/ds-migration-boundaries.md` and assess viability (stop if not feasible)
3. WHEN detecting cross-zone dependencies THEN the system SHALL identify shared properties, methods, and lifecycle hooks affecting multiple violation zones
4. WHEN performing feature mapping THEN the system SHALL read DS component integration rules from `.kiro/steering/topics/design-system/components/ds-{component}.md` and document gaps with workarounds
5. WHEN performing risk assessment THEN the system SHALL apply the risk rubric from `.kiro/steering/topics/design-system/ds-migration-risk-assessment.md` and assign level (High/Medium/Low) with mitigation strategies
6. WHEN filtering constraints THEN the system SHALL apply essentiality criteria and output 1-10 essential constraints
7. WHEN Phase 05 completes THEN the system SHALL generate `data/components/{ComponentName}/phase-05-viability-assessment.json` following the template schema

### Requirement 8: Phase 06 - URL Generation and Testing Guidance

**User Story:** As a migration engineer, I want to generate development environment URLs for component access, so that I can manually test components before and after migration.

#### Acceptance Criteria

1. WHEN executing Phase 06 THEN the system SHALL follow instructions from `.kiro/docs/ds-migrations/01-component-discovery-and-analysis-actions.md`
2. WHEN generating URLs THEN the system SHALL use cached brand configuration from package context discovery (Requirement 2)
3. WHEN constructing URLs THEN the system SHALL generate exactly 3 URLs (primary/secondary/tertiary brands) using format `https://dev.{subdomain}.{brand}/{lang}/{productPath}/{componentPath}`
4. WHEN documenting URLs THEN the system SHALL include full traceability (brandSource, brandConfigSource, urlPatternSource with file:line references)
5. WHEN creating testing guidance THEN the system SHALL document access instructions, feature flag requirements, and visual location
6. WHEN Phase 06 completes THEN the system SHALL generate `data/components/{ComponentName}/phase-06-url-generation.json` following the template schema

### Requirement 9: Migration Execution with Contract Validation

**User Story:** As a migration engineer, I want to execute the actual migration with contract-based validation, so that I can ensure zero breaking changes and zero regressions.

#### Acceptance Criteria

1. WHEN executing migration THEN the system SHALL follow instructions from `.kiro/docs/ds-migrations/02-ds-refactoring-actions.md`
2. WHEN starting migration THEN the system SHALL read phase files (phase-01, phase-03, phase-05) and generate pre-migration contract using `build_component_contract` MCP tool
3. WHEN updating HTML THEN the system SHALL replace deprecated classes with DS components using data from phase-01 `violationZoneAnalysis[]`, preserving all bindings and applying inverse theming from phase-03
4. WHEN updating TypeScript THEN the system SHALL import DS components from phase-01 `component.dsComponents[]` and add to imports array
5. WHEN updating SCSS THEN the system SHALL remove legacy classes and use semantic tokens only (no reference tokens, no DS overrides)
6. WHEN validating changes THEN the system SHALL run `getDiagnostics` (must be 0 errors), generate post-migration contract, and run `diff_component_contract` (must be 0 breaking changes)
7. WHEN verifying completion THEN the system SHALL run `report_all_violations` (must be 0 violations)

### Requirement 10: Code Review with Analysis-Driven Validation

**User Story:** As a migration engineer, I want to perform systematic code review using analysis data and contract diffs, so that I can verify zero regressions and standards compliance.

#### Acceptance Criteria

1. WHEN executing code review THEN the system SHALL follow instructions from `.kiro/docs/ds-migrations/03-migration-code-review-actions.md`
2. WHEN performing automated validation THEN the system SHALL run `getDiagnostics` (must be 0 errors) and `report_all_violations` (must be 0 violations)
3. WHEN reviewing contract diff THEN the system SHALL verify 0 breaking changes (no removed inputs/outputs/methods, no changed signatures)
4. WHEN determining review depth THEN the system SHALL read phase-05 `riskAssessment.level` and apply appropriate thoroughness (high=deep, medium=standard, low=quick)
5. WHEN reviewing HTML THEN the system SHALL verify binding preservation (compare with phase-01 `bindings`), DS component selection (match phase-01 `dsComponentSelection`), inverse theming (check phase-03 `parentContainer.background`), and no host styling
6. WHEN reviewing TypeScript THEN the system SHALL verify DS imports match phase-01 `component.dsComponents[]`, no logic changes, and type safety preserved
7. WHEN reviewing SCSS THEN the system SHALL verify legacy CSS removed, semantic tokens only, no DS overrides, and layout preservation
8. WHEN verifying success criteria THEN the system SHALL check phase-05 `successCriteria[]` met through code inspection
9. WHEN detecting anti-patterns THEN the system SHALL check against `.kiro/steering/topics/design-system/ds-migration-anti-patterns.md` (host styling, reference tokens, missing inverse, slot on conditional, wrong component)
10. WHEN making review decision THEN the system SHALL approve (all criteria met), request changes (anti-patterns or criteria not met), or reject (breaking changes or violations present)

### Requirement 11: Group-Level Consolidation and Summary

**User Story:** As a migration engineer, I want to consolidate all component analyses and migrations into a group-level summary document, so that I can understand the overall scope, risks, and completion status across the entire violation group.

#### Acceptance Criteria

1. WHEN all component migrations are complete THEN the system SHALL aggregate violation counts, DS component targets, risk levels, and migration status across all components
2. WHEN aggregating data THEN the system SHALL identify cross-component dependencies where shared services, state, or utilities are affected
3. WHEN creating the summary THEN the system SHALL categorize components by risk level (High/Medium/Low) and migration status (completed/in-progress/blocked)
4. WHEN documenting group scope THEN the system SHALL calculate total violations resolved, unique DS components used, and migration completion percentage
5. WHEN consolidation is complete THEN the system SHALL generate a group summary document at `.kiro/specs/{spec_name}/group-summary.md` containing aggregated metrics, risk distribution, and lessons learned
