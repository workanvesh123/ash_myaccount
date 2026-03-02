#!/usr/bin/env node

import { readdir, mkdir, readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '../../..');

// ============================================================================
// CONFIGURATION
// ============================================================================

const STEERING_TYPES = {
    package: {
        description: 'Generate package context and library context files',
        templateDir: 'templates',
        outputDir: '.kiro/steering/packages',
        handler: generatePackageSteering,
    },
    topic: {
        description: 'Generate topic steering file',
        templateDir: 'templates',
        outputDir: '.kiro/steering/topics',
        handler: generateTopicSteering,
    },
    workflow: {
        description: 'Generate workflow hub file',
        templateDir: 'templates',
        outputDir: '.kiro/steering/workflows',
        handler: generateWorkflowSteering,
    },
    root: {
        description: 'Generate root-level steering file (e.g., 01-project-context.md)',
        templateDir: 'templates',
        outputDir: '.kiro/steering',
        handler: generateRootSteering,
    },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Converts a name to kebab-case
 */
function toKebabCase(name) {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9/]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Converts a name to Title Case
 */
function toTitleCase(name) {
    return name
        .split(/[-_\s/]+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Parses a name that may contain folder paths (e.g., "ssr/cache-transfer")
 */
function parsePath(name) {
    const kebabName = toKebabCase(name);

    if (kebabName.includes('/')) {
        const parts = kebabName.split('/');
        const folder = parts.slice(0, -1).join('/');
        const filename = parts[parts.length - 1];
        const displayName = name.split('/').pop().trim();

        return { folder, filename, displayName, fullPath: kebabName };
    }

    return { folder: '', filename: kebabName, displayName: name, fullPath: kebabName };
}

/**
 * Ensures a directory exists
 */
async function ensureDir(dirPath) {
    if (!existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true });
        console.log(`✓ Created directory: ${dirPath}`);
    }
    return dirPath;
}

/**
 * Processes template with replacements
 */
async function processTemplate(templatePath, outputPath, replacements) {
    let content = await readFile(templatePath, 'utf-8');

    for (const [placeholder, value] of Object.entries(replacements)) {
        const regex = new RegExp(placeholder, 'g');
        content = content.replace(regex, value);
    }

    await writeFile(outputPath, content, 'utf-8');
    console.log(`✓ Created: ${outputPath}`);
}

/**
 * Identifies libraries and apps in a package folder
 */
async function identifyLibrariesAndApps(packagePath) {
    const entries = await readdir(packagePath, { withFileTypes: true });

    return entries
        .filter((entry) => entry.isDirectory())
        .filter((entry) => !entry.name.startsWith('.') && !entry.name.startsWith('_'))
        .map((entry) => entry.name)
        .filter((name) => {
            return (
                name.endsWith('-lib') ||
                name.endsWith('-app') ||
                name === 'core' ||
                name === 'ui' ||
                name === 'utils' ||
                name === 'features' ||
                name === 'libs'
            );
        });
}

// ============================================================================
// STEERING TYPE HANDLERS
// ============================================================================

/**
 * Generate package steering files
 */
async function generatePackageSteering(name, options = {}) {
    console.log(`\n🚀 Generating package steering for: ${name}\n`);

    const packagePath = join(ROOT_DIR, 'packages', name);
    if (!existsSync(packagePath)) {
        throw new Error(`Package not found: ${packagePath}`);
    }

    // Identify libraries
    console.log('📦 Identifying libraries and apps...');
    const libraries = await identifyLibrariesAndApps(packagePath);
    console.log(`   Found ${libraries.length} libraries/apps: ${libraries.join(', ')}\n`);

    // Create output directory
    const outputDir = join(ROOT_DIR, '.kiro/steering/packages', name);
    await ensureDir(outputDir);
    console.log('');

    // Generate package context file
    console.log('📝 Creating package context file...');
    const packageTemplate = join(ROOT_DIR, '.kiro/scripts/steering-generation/templates/package-steering.template.md');
    const packageOutput = join(outputDir, `${name}-context.md`);

    await processTemplate(packageTemplate, packageOutput, {
        '<package-name>': name,
        '<project>': name,
        '<lib>': '*',
        '<Lib Name>': toTitleCase(name),
    });
    console.log('');

    // Generate library context files
    if (!options.skipLibraries) {
        console.log('📝 Creating library context files...');
        const libraryTemplate = join(ROOT_DIR, '.kiro/scripts/steering-generation/templates/library-steering.template.md');

        for (const libName of libraries) {
            const libraryOutput = join(outputDir, `${name}-${libName}.context.md`);
            await processTemplate(libraryTemplate, libraryOutput, {
                '<library-name>': libName,
                '<lib>': libName,
                '<project>': name,
                '<Lib Name>': toTitleCase(libName),
            });
        }
        console.log('');
    }

    console.log(`✅ Successfully generated package steering for ${name}`);
    console.log(`   Package context: ${name}-context.md`);
    if (!options.skipLibraries) {
        console.log(`   Library contexts: ${libraries.length} files`);
    }
    console.log(`\n📂 Location: .kiro/steering/packages/${name}/\n`);
}

/**
 * Generate topic steering file
 */
async function generateTopicSteering(name, options = {}) {
    console.log(`\n🚀 Generating topic steering for: ${name}\n`);

    const { folder, filename, displayName } = parsePath(name);

    if (folder) {
        console.log(`📁 Folder: ${folder}/`);
    }
    console.log(`📝 Filename: ${filename}.md\n`);

    // Create output directory
    const baseDir = join(ROOT_DIR, '.kiro/steering/topics');
    const outputDir = folder ? join(baseDir, folder) : baseDir;
    await ensureDir(outputDir);
    console.log('');

    // Generate topic file
    const templatePath = join(ROOT_DIR, '.kiro/scripts/steering-generation/templates/topic.template.md');
    const outputPath = join(outputDir, `${filename}.md`);

    if (existsSync(outputPath) && !options.force) {
        throw new Error(`Topic file already exists: ${outputPath}\nUse --force to overwrite`);
    }

    console.log('📝 Creating topic file...');
    await processTemplate(templatePath, outputPath, {
        '<TOPIC_NAME>': displayName,
        '<topic-name>': displayName,
    });

    const relativePath = folder ? `${folder}/${filename}.md` : `${filename}.md`;
    console.log(`\n✅ Successfully generated topic steering: ${displayName}`);
    console.log(`\n📂 Location: .kiro/steering/topics/${relativePath}\n`);
}

/**
 * Generate workflow steering file
 */
async function generateWorkflowSteering(name, options = {}) {
    console.log(`\n🚀 Generating workflow steering for: ${name}\n`);

    const { filename, displayName } = parsePath(name);
    console.log(`📝 Filename: ${filename}.md\n`);

    // Create output directory
    const outputDir = join(ROOT_DIR, '.kiro/steering/workflows');
    await ensureDir(outputDir);
    console.log('');

    // Generate workflow file
    const templatePath = join(ROOT_DIR, '.kiro/scripts/steering-generation/templates/workflow-template.md');
    const outputPath = join(outputDir, `${filename}.md`);

    if (existsSync(outputPath) && !options.force) {
        throw new Error(`Workflow file already exists: ${outputPath}\nUse --force to overwrite`);
    }

    console.log('📝 Creating workflow file...');
    await processTemplate(templatePath, outputPath, {
        '<WORKFLOW_NAME>': displayName,
        '<workflow-name>': filename,
        '<PHASE_1_NAME>': options.phase1 || 'Identification',
        '<PHASE_2_NAME>': options.phase2 || 'Analysis',
        '<PHASE_3_NAME>': options.phase3 || 'Implementation',
        '<PHASE_4_NAME>': options.phase4 || 'Validation',
        '<GLOB_PATTERN_IF_APPLICABLE>': options.pattern || '**/*',
    });

    console.log(`\n✅ Successfully generated workflow steering: ${displayName}`);
    console.log(`\n📂 Location: .kiro/steering/workflows/${filename}.md\n`);
}

/**
 * Generate root-level steering file
 */
async function generateRootSteering(name, options = {}) {
    console.log(`\n🚀 Generating root steering file: ${name}\n`);

    const { filename, displayName } = parsePath(name);

    // Add numeric prefix if provided
    const finalFilename = options.prefix ? `${options.prefix}-${filename}.md` : `${filename}.md`;

    console.log(`📝 Filename: ${finalFilename}\n`);

    // Create output directory
    const outputDir = join(ROOT_DIR, '.kiro/steering');
    await ensureDir(outputDir);
    console.log('');

    const outputPath = join(outputDir, finalFilename);

    if (existsSync(outputPath) && !options.force) {
        throw new Error(`Root steering file already exists: ${outputPath}\nUse --force to overwrite`);
    }

    // Create basic template
    console.log('📝 Creating root steering file...');

    const basicTemplate = `# ${displayName}

## Purpose

{{ Describe the purpose of this steering file }}

## Content

{{ Add your content here }}

---

Fill in this template for ${displayName}.
`;

    await writeFile(outputPath, basicTemplate, 'utf-8');
    console.log(`✓ Created: ${outputPath}`);

    console.log(`\n✅ Successfully generated root steering: ${displayName}`);
    console.log(`\n📂 Location: .kiro/steering/${finalFilename}\n`);
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

function printUsage() {
    console.log(`
📚 Steering File Blueprint Generator

Usage: node generate-steering.mjs <type> <name> [options]

Types:
  package   Generate package context and library context files
  topic     Generate topic steering file (supports nested paths)
  workflow  Generate workflow hub file
  root      Generate root-level steering file

Examples:
  # Generate package steering
  node generate-steering.mjs package global-search

  # Generate topic steering (nested)
  node generate-steering.mjs topic "ssr/cache-transfer"
  node generate-steering.mjs topic "angular-performance/signals"

  # Generate workflow steering
  node generate-steering.mjs workflow "feature-development"

  # Generate root steering with prefix
  node generate-steering.mjs root "testing-strategy" --prefix=08

Options:
  --force              Overwrite existing files
  --skip-libraries     (package only) Skip library context files
  --prefix=XX          (root only) Add numeric prefix (e.g., 01, 02)
  --phase1=NAME        (workflow only) Custom phase 1 name
  --phase2=NAME        (workflow only) Custom phase 2 name
  --phase3=NAME        (workflow only) Custom phase 3 name
  --phase4=NAME        (workflow only) Custom phase 4 name
  --pattern=GLOB       (workflow only) File match pattern

Available Types:
${Object.entries(STEERING_TYPES)
    .map(([key, config]) => `  ${key.padEnd(12)} ${config.description}`)
    .join('\n')}
`);
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        printUsage();
        process.exit(0);
    }

    const type = args[0];
    const name = args[1];

    if (!type || !name) {
        console.error('❌ Error: Both type and name are required\n');
        printUsage();
        process.exit(1);
    }

    if (!STEERING_TYPES[type]) {
        console.error(`❌ Error: Unknown type "${type}"\n`);
        printUsage();
        process.exit(1);
    }

    // Parse options
    const options = {};
    for (let i = 2; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const [key, value] = arg.slice(2).split('=');
            options[key] = value || true;
        }
    }

    // Execute handler
    const handler = STEERING_TYPES[type].handler;
    await handler(name, options);
}

// ============================================================================
// EXECUTION
// ============================================================================

main().catch((error) => {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
});
