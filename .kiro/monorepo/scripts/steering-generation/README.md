# Steering File Generation Scripts

This directory contains a unified script for generating steering file blueprints in the `.kiro/steering/` folder.

## Unified Generator

The main script `generate-steering.mjs` provides a flexible interface for generating all types of steering files.

```bash
node .kiro/scripts/steering-generation/generate-steering.mjs <type> <name> [options]
```

### Available Types

| Type | Description | Output Location |
|------|-------------|-----------------|
| `package` | Package context and library context files | `.kiro/steering/packages/<name>/` |
| `topic` | Topic steering file (supports nested paths) | `.kiro/steering/topics/` |
| `workflow` | Workflow hub file | `.kiro/steering/workflows/` |
| `root` | Root-level steering file | `.kiro/steering/` |

---

## Usage Examples

### 1. Generate Package Steering

Creates package context and library context files for a given package.

```bash
node .kiro/scripts/steering-generation/generate-steering.mjs package global-search
```

**Options:**
- `--skip-libraries` - Skip generating library context files

**Output:**
- `.kiro/steering/packages/global-search/global-search-context.md`
- `.kiro/steering/packages/global-search/global-search-<library>.context.md` (for each library)

---

### 2. Generate Topic Steering

Creates a topic steering file in the `.kiro/steering/topics/` folder.

```bash
# Simple topic
node .kiro/scripts/steering-generation/generate-steering.mjs topic "Host app integration"

# Nested topic (with folder)
node .kiro/scripts/steering-generation/generate-steering.mjs topic "ssr/cache-transfer"
node .kiro/scripts/steering-generation/generate-steering.mjs topic "angular-performance/signals"
```

**Options:**
- `--force` - Overwrite existing file

**Output:**
- `.kiro/steering/topics/<topic-name>.md` (simple)
- `.kiro/steering/topics/<folder>/<topic-name>.md` (nested)

---

### 3. Generate Workflow Steering

Creates a workflow hub file in the `.kiro/steering/workflows/` folder.

```bash
node .kiro/scripts/steering-generation/generate-steering.mjs workflow "feature-development"
node .kiro/scripts/steering-generation/generate-steering.mjs workflow "api-integration"
```

**Options:**
- `--force` - Overwrite existing file
- `--phase1=NAME` - Custom phase 1 name (default: "Identification")
- `--phase2=NAME` - Custom phase 2 name (default: "Analysis")
- `--phase3=NAME` - Custom phase 3 name (default: "Implementation")
- `--phase4=NAME` - Custom phase 4 name (default: "Validation")
- `--pattern=GLOB` - File match pattern (default: "**/*")

**Example with custom phases:**
```bash
node .kiro/scripts/steering-generation/generate-steering.mjs workflow "data-migration" \
  --phase1="Discovery" \
  --phase2="Planning" \
  --phase3="Execution" \
  --phase4="Verification"
```

**Output:**
- `.kiro/steering/workflows/<workflow-name>.md`

---

### 4. Generate Root Steering

Creates a root-level steering file in the `.kiro/steering/` folder.

```bash
# Without prefix
node .kiro/scripts/steering-generation/generate-steering.mjs root "testing-strategy"

# With numeric prefix
node .kiro/scripts/steering-generation/generate-steering.mjs root "testing-strategy" --prefix=08
```

**Options:**
- `--force` - Overwrite existing file
- `--prefix=XX` - Add numeric prefix (e.g., 01, 02, 08)

**Output:**
- `.kiro/steering/<name>.md` (without prefix)
- `.kiro/steering/<prefix>-<name>.md` (with prefix)

---

## Templates

Templates are located in `.kiro/scripts/steering-generation/templates/`:

| Template | Used For | Placeholders |
|----------|----------|--------------|
| `package-steering.template.md` | Package context | `<package-name>`, `<project>`, `<lib>`, `<Lib Name>` |
| `library-steering.template.md` | Library context | `<library-name>`, `<lib>`, `<project>`, `<Lib Name>` |
| `topic.template.md` | Topic steering | `<TOPIC_NAME>`, `<topic-name>` |
| `workflow-template.md` | Workflow hub | `<WORKFLOW_NAME>`, `<PHASE_X_NAME>`, `<GLOB_PATTERN_IF_APPLICABLE>` |

---

## How It Works

### Package Steering
1. Scans `packages/<package-name>/` for libraries and apps
2. Identifies directories ending with `-lib`, `-app`, or named `core`, `ui`, `utils`, `features`, `libs`
3. Generates a package context file and individual library context files

### Topic Steering
1. Parses topic name to extract folder path (if using `/` separator)
2. Creates nested folder structure if needed
3. Generates topic file from template with placeholders replaced

### Workflow Steering
1. Creates workflow hub file with customizable phase names
2. Supports file match patterns for conditional inclusion
3. Includes success criteria checklists

### Root Steering
1. Creates root-level steering files with optional numeric prefixes
2. Generates basic template structure for manual completion

---

## Customization

### Modifying Templates
1. Edit template files in `.kiro/scripts/steering-generation/templates/`
2. Add or modify placeholders (e.g., `<package-name>`, `<TOPIC_NAME>`)
3. Placeholders are replaced using regex, so use unique identifiers

### Adding New Steering Types
1. Open `generate-steering.mjs`
2. Add new type to `STEERING_TYPES` configuration
3. Implement handler function following existing patterns
4. Create corresponding template file

---

## Notes

- All generated files are **blueprints** that need to be filled in with actual content
- Use `--force` flag to overwrite existing files (except package steering which always preserves existing files)
- Names are automatically converted to kebab-case
- Nested paths use `/` separator (e.g., `ssr/cache-transfer`)
- Numeric prefixes for root files should be two digits (e.g., `01`, `08`, `12`)
