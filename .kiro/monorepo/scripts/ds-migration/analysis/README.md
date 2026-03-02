# Design System Migration Analysis Scripts

Automated scripts for parsing violation reports and generating analysis tasks for Design System migrations.

## Overview

These scripts support the **DS Violation Group Analysis** workflow by:
1. Parsing violation reports to extract component metadata
2. Generating dynamic task lists for systematic component analysis
3. Deriving component information from file paths and TypeScript files

## Scripts

### 1. `validate-json-schema.mjs`

Validates JSON files against JSON Schema definitions. No external dependencies required.

**Usage:**
```bash
# Auto-detect schema from $schema property
node .kiro/scripts/ds-migration/analysis/validate-json-schema.mjs <json-path>

# Explicit schema path
node .kiro/scripts/ds-migration/analysis/validate-json-schema.mjs <schema-path> <json-path>
```

**Examples:**
```bash
# Validate component analysis (auto-detect)
node .kiro/scripts/ds-migration/analysis/validate-json-schema.mjs \
  .kiro/specs/ds-violation-group-analysis/data/components/BingoSlotRacesComponent/BingoSlotRacesComponent-pre-migration-analysis.json

# Validate with explicit schema
node .kiro/scripts/ds-migration/analysis/validate-json-schema.mjs \
  .kiro/templates/ds-migration/data/schemas/component-analysis.schema.json \
  .kiro/specs/ds-violation-group-analysis/data/components/BingoSlotRacesComponent/BingoSlotRacesComponent-pre-migration-analysis.json

# Validate package context
node .kiro/scripts/ds-migration/analysis/validate-json-schema.mjs \
  .kiro/templates/ds-migration/data/schemas/package-context.schema.json \
  .kiro/specs/ds-violation-group-analysis/data/bingo-context.json
```

**Features:**
- Auto-detects schema from `$schema` property in JSON files
- Validates required fields, types, arrays, enums
- Detailed error reporting with paths and values
- No external dependencies (pure Node.js)
- Exit code 0 (valid) or 1 (invalid)

**Validation Checks:**
- Required fields presence
- Type validation (string, number, integer, boolean, array, object)
- Array constraints (minItems, maxItems)
- Enum value validation
- Nested object validation

**Output:**
- ✅ Success: "Validation successful! No errors found." (exit code 0)
- ❌ Failure: Detailed error list with paths, messages, and values (exit code 1)

**Integration:**
This script is used in the generated `tasks.md` for:
- Package context validation (Phase 01, Section 1)
- Per-component URL analysis validation (Phase 01, per component)
- Per-component pre-migration analysis validation (Phase 02, per component)

---

### 2. `parse-violations.mjs`

Parses `violations-group.json` and extracts component metadata.

**Input:** `.kiro/specs/ds-violation-group-analysis/data/violations-group.json`

**Outputs:**
- `data/parsed-components.json` - Structured component metadata
- `data/component-summary.md` - Human-readable summary report

**Usage:**
```bash
node .kiro/scripts/ds-migration/analysis/parse-violations.mjs [spec-directory]
```

**Default spec directory:** `.kiro/specs/ds-violation-group-analysis`

**What it extracts:**
- Component class names (from TypeScript files or derived from paths)
- Component selectors (from `@Component` decorator or derived)
- Package and library names
- File paths (TypeScript, template, styles)
- DS components required for migration
- Steering file mappings for each DS component

**Extraction methods:**
- **Extracted:** Reads TypeScript file and parses `@Component` decorator
- **Derived:** Falls back to path-based naming conventions if file not found

### 2. `generate-tasks.mjs`

Generates dynamic `tasks.md` from parsed component data.

**Input:** `data/parsed-components.json`

**Output:** `tasks.md` - Dynamic task list with per-component instructions

**Usage:**
```bash
node .kiro/scripts/ds-migration/analysis/generate-tasks.mjs [spec-directory]
```

**Default spec directory:** `.kiro/specs/ds-violation-group-analysis`

**Generated task structure:**
- **Phase 00:** Data extraction (completed by scripts)
- **Phase 01:** Component discovery (per-component tasks)
  - Package context discovery (run once)
  - Component location search
  - Relationship analysis
  - Route configuration extraction
  - Development URL generation
- **Phase 02:** Pre-migration analysis (per-component tasks)
  - Violation report execution
  - HTML pattern extraction
  - Viability assessment
  - Risk analysis
- **Group Summary:** Aggregate analysis across all components



## Workflow Integration

These scripts are part of the **DS Violation Group Analysis** spec workflow:

1. **Manual:** Create `violations-group.json` from MCP tool output
2. **Script:** Run `parse-violations.mjs` to extract component metadata
3. **Script:** Run `generate-tasks.mjs` to create dynamic task list
4. **Agent:** Follow `tasks.md` to analyze each component systematically

## File Structure

```
.kiro/specs/ds-violation-group-analysis/
├── data/
│   ├── violations-group.json          # Input: MCP tool output
│   ├── parsed-components.json         # Output: Structured metadata
│   ├── component-summary.md           # Output: Human-readable summary
│   └── components/                    # Output: Per-component analysis
│       ├── {ComponentName}-url-analysis.md
│       └── {ComponentName}-analysis.md
├── requirements.md                    # Spec requirements
└── tasks.md                           # Generated task list
```

## Component Metadata Schema

```typescript
{
  tsFilePath: string;           // Full path to TypeScript file
  packageName: string;          // Package name (e.g., "bingo")
  libraryName: string;          // Library name (e.g., "ui-lib")
  componentName: string;        // Class name (e.g., "BonusPopupComponent")
  selector: string;             // Component selector (e.g., "bonus-popup")
  rootPath: string;             // Component directory path
  dsComponents: Array<{         // DS components required
    component: string;          // DS component name (e.g., "DsButton")
    steeringFile: string;       // Steering file path
    exists: boolean;            // Steering file exists
  }>;
  extractionMethod: string;     // "extracted" | "derived"
  files: {
    typescript: { path: string; exists: boolean };
    template: { path: string; exists: boolean };
    styles: Array<{ path: string | null; exists: boolean }>;
  };
}
```

## Example Usage

```bash
# Step 1: Parse violations
node .kiro/scripts/ds-migration/analysis/parse-violations.mjs

# Output:
# ✓ Saved parsed components to: .kiro/specs/ds-violation-group-analysis/data/parsed-components.json
# ✓ Saved component summary to: .kiro/specs/ds-violation-group-analysis/data/component-summary.md
# ✓ Successfully parsed 5 components

# Step 2: Generate tasks
node .kiro/scripts/ds-migration/analysis/generate-tasks.mjs

# Output:
# ✓ Generated tasks.md with dynamic component tasks
# ✓ Output: .kiro/specs/ds-violation-group-analysis/tasks.md


```

## Error Handling

**Missing TypeScript file:**
- Falls back to derived component name and selector
- Logs warning: `⚠ Could not read {path}, using derived values`

**Missing template/style files:**
- Marks as `exists: false` in metadata
- Continues processing other components

**Invalid JSON:**
- Script exits with error code 1
- Displays error message

## Requirements Mapping

Scripts satisfy these spec requirements:

- **1.1-1.5:** Data extraction and parsing
- **2.1-2.5:** Component metadata derivation
- **3.1-3.5:** File path resolution
- **4.1-4.5:** DS component mapping
- **5.1-5.5:** Steering file verification

## Related Documentation

- **Spec:** `.kiro/specs/ds-violation-group-analysis/requirements.md`
- **Actions:** `.kiro/docs/ds-migration/analysis/00-data-extraction-actions.md`
- **Workflow:** `.kiro/steering/workflows/design-system-migration-workflow.md`
