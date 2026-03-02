import { readFileSync, writeFileSync } from 'fs';
import { join, basename } from 'path';

/**
 * Generates dynamic tasks.md from parsed components
 */
function generateTasks(specDirectory) {
    // Read parsed components
    const componentsPath = join(specDirectory, 'data', 'parsed-components.json');
    const components = JSON.parse(readFileSync(componentsPath, 'utf-8'));

    if (components.length === 0) {
        throw new Error('No components found in parsed-components.json');
    }

    // Extract ticket name from spec directory path
    const ticket = basename(specDirectory);

    // Get unique package name (assuming all components from same package)
    const packageName = components[0].packageName;

    let tasks = `# Implementation Plan

## Phase 00: Data Extraction ✓

- [x] 1-2. Parse violations and generate tasks
  - Extracted ${components.length} components
  - Output: \`data/parsed-components.json\`, \`tasks.md\`

---

## Phase 01: Package Context

- [ ] 3. Generate ${packageName} package context
  - **Guide**: \`.kiro/docs/ds-migrations/00-package-discovery-actions.md\`
  - **Output**: \`data/${packageName}-context.json\`
  - **Validate**: Run schema validation script

---

## Phase 02: Component Analysis

`;

    // Generate per-component tasks
    let taskNumber = 4;
    components.forEach((comp, index) => {
        const componentNum = index + 1;

        tasks += `### Component ${componentNum}: ${comp.componentName}

- [ ] ${taskNumber}. Complete 6-phase analysis
  - **Guide**: \`.kiro/docs/ds-migrations/01-component-discovery-and-analysis-actions.md\`
  - **Component**: \`${comp.selector}\` at \`${comp.rootPath}\`
  - **DS Components**: ${comp.dsComponents.map((ds) => ds.component).join(', ')}
  - **Outputs**: 6 JSON files in \`data/components/${comp.componentName}/\`

- [ ] ${taskNumber + 1}. Migrate & validate
  - **Guide**: \`.kiro/docs/ds-migrations/02-ds-refactoring-actions.md\`
  - **Sources**: \`data/components/${comp.componentName}/phase-{01,03,05}.json\`
  - **Files**: \`${comp.files.typescript?.path || ''}\`, \`${comp.files.template?.path || ''}\`
  - **Acceptance**: 0 violations, 0 diagnostics, 0 breaking changes

- [ ] ${taskNumber + 2}. Code review
  - **Guide**: \`.kiro/docs/ds-migrations/03-migration-code-review-actions.md\`
  - **Component**: \`${comp.selector}\` at \`${comp.rootPath}\`
  - **Files**: \`${comp.files.typescript?.path || ''}\`, \`${comp.files.template?.path || ''}\`
  - **Review**: Contract diff, bindings, DS selection, inverse theming, anti-patterns
  - **Decision**: Approve / Request Changes / Reject

`;

        taskNumber += 3;
    });

    tasks += `
---

## Phase 03: Final Validation

- [ ] ${taskNumber}. Cross-component validation
  - Review all ${components.length} contract diffs
  - Run \`report_all_violations\` on package (must be 0)
  - Run \`getDiagnostics\` on all modified files

- [ ] ${taskNumber + 1}. Cleanup
  - Remove unused legacy CSS
  - Format: \`yarn nx format:write --base=main\`
  - Update documentation

---
`;

    return tasks;
}

// CLI execution
const specDir = process.argv[2] || '.kiro/specs/ds-violation-group-analysis';

try {
    console.log('Generating tasks from parsed components...\n');

    const tasks = generateTasks(specDir);

    const outputPath = join(specDir, 'tasks.md');
    writeFileSync(outputPath, tasks, 'utf-8');

    console.log(`✓ Generated tasks.md with dynamic component tasks`);
    console.log(`✓ Output: ${outputPath}\n`);
} catch (error) {
    console.error('Error generating tasks:', error);
    process.exit(1);
}
